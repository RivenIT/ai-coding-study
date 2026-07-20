<template>
  <main class="chat-view">
    <header class="chat-topbar">
      <button class="app-title" type="button" @click="router.push('/')">
        <a-avatar :src="app?.user?.userAvatar || undefined">{{ app?.appName?.slice(0, 1) || 'A' }}</a-avatar>
        <span>{{ app?.appName || '应用生成' }}</span>
      </button>
      <a-space>
        <a-button v-if="app && canEdit" @click="editApp">编辑</a-button>
        <a-button type="primary" :loading="deploying" :disabled="!canDeploy" @click="deployCurrentApp">
          <template #icon><CloudUploadOutlined /></template>
          部署
        </a-button>
      </a-space>
    </header>

    <a-segmented
      v-if="showPreview"
      v-model:value="activePanel"
      class="mobile-switch"
      :options="[
        { label: '对话', value: 'chat' },
        { label: '预览', value: 'preview' },
      ]"
    />

    <section class="workbench" :class="[`show-${activePanel}`, { 'with-preview': showPreview }]">
      <section class="chat-panel">
        <div v-if="loadError" class="load-error">
          <a-alert type="error" show-icon :message="loadError" />
          <a-button size="small" @click="loadApp">重试</a-button>
        </div>
        <div v-if="hasMoreHistory" class="history-load">
          <a-button type="link" size="small" :loading="loadingHistory" @click="loadMoreChatHistory">加载更多</a-button>
        </div>
        <ChatMessageList
          class="messages"
          :messages="messages"
          :preserve-scroll-version="historyPrependVersion"
        />
        <div v-if="generationError" class="stream-error">
          <a-alert type="warning" show-icon :message="generationError" />
          <a-button size="small" @click="retryLastMessage">重试</a-button>
        </div>
        <PromptComposer
          v-model="input"
          class="chat-composer"
          :loading="generating"
          :disabled="!canOperate"
          :placeholder="canOperate ? '描述得越详细，页面越具体，可以一步一步完善生成效果' : '只有应用创建者可以继续生成'"
          submit-label="发送消息"
          :max-length="2000"
          @submit="sendFollowup"
        >
          <template #tools>
            <a-space wrap>
              <a-tag v-if="app?.codeGenType" color="blue">{{ app.codeGenType }}</a-tag>
              <a-tag v-if="generating" color="processing">生成中</a-tag>
            </a-space>
          </template>
        </PromptComposer>
      </section>

      <AppPreviewPanel
        v-if="showPreview"
        class="preview-panel"
        :url="previewUrl"
        title="生成后的网页展示"
        subtitle="生成完成后自动刷新预览"
        @refresh="refreshPreview"
      />
    </section>

    <a-modal v-model:open="deployModalOpen" title="部署成功" :footer="null">
      <a-typography-paragraph copyable>{{ deployUrl }}</a-typography-paragraph>
      <a-space>
        <a-button type="primary" @click="openDeployUrl">打开网站</a-button>
        <a-button @click="copyDeployUrl">复制地址</a-button>
      </a-space>
    </a-modal>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CloudUploadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import AppPreviewPanel from '@/components/app/AppPreviewPanel.vue'
import ChatMessageList from '@/components/app/ChatMessageList.vue'
import PromptComposer from '@/components/app/PromptComposer.vue'
import { deployApp, getApp } from '@/services/app'
import { getAppChatHistory } from '@/services/chatHistory'
import { connectAppGeneration, type AppGenerationConnection } from '@/services/appSse'
import { ApiError } from '@/services/http'
import { useUserStore } from '@/stores/user'
import type { AppVO, ChatMessage } from '@/types/app'
import type { ChatHistory } from '@/types/chatHistory'
import { buildPreviewUrl, canEditApp, isHttpUrl, isNumericId } from '@/utils/app'
import { removeFailedRetryTurn } from '@/utils/chat'

const HISTORY_PAGE_SIZE = 10
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const app = ref<AppVO | null>(null)
const input = ref('')
const messages = ref<ChatMessage[]>([])
const stream = ref<AppGenerationConnection | null>(null)
const generating = ref(false)
const deploying = ref(false)
const previewUrl = ref('')
const loadError = ref('')
const generationError = ref('')
const lastMessage = ref('')
const activePanel = ref<'chat' | 'preview'>('chat')
const deployModalOpen = ref(false)
const deployUrl = ref('')
const loadingHistory = ref(false)
const hasMoreHistory = ref(false)
const historyCursor = ref<string>()
const historyMessageCount = ref(0)
const historyPrependVersion = ref(0)
const loadedHistoryIds = new Set<string>()
let loadSeq = 0

const isOwner = computed(() => Boolean(app.value && userStore.loginUser?.id === app.value.userId))
const canEdit = computed(() => {
  if (!app.value || !userStore.loginUser) return false
  return canEditApp({
    role: userStore.isAdmin ? 'admin' : 'user',
    userId: userStore.loginUser.id,
    ownerId: app.value.userId,
  })
})
const canOperate = computed(() => isOwner.value)
const showPreview = computed(() => historyMessageCount.value >= 2)
const canDeploy = computed(() =>
  Boolean(
    app.value &&
      isOwner.value &&
      showPreview.value &&
      previewUrl.value &&
      !generationError.value &&
      !generating.value &&
      !deploying.value,
  ),
)

function createMessage(role: ChatMessage['role'], content: string, status: ChatMessage['status']): ChatMessage {
  return { id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, content, status }
}

function toChatMessage(record: ChatHistory): ChatMessage {
  return {
    id: `history-${record.id}`,
    role: record.messageType === 'user' ? 'user' : 'assistant',
    content: record.message,
    status: 'complete',
  }
}

function resetWorkbenchState() {
  closeStream()
  app.value = null
  input.value = ''
  messages.value = []
  generating.value = false
  deploying.value = false
  previewUrl.value = ''
  loadError.value = ''
  generationError.value = ''
  lastMessage.value = ''
  activePanel.value = 'chat'
  deployModalOpen.value = false
  deployUrl.value = ''
  loadingHistory.value = false
  hasMoreHistory.value = false
  historyCursor.value = undefined
  historyMessageCount.value = 0
  loadedHistoryIds.clear()
}

async function loadChatHistory(reset = false, requestId = loadSeq): Promise<ChatMessage[] | null> {
  if (!app.value || loadingHistory.value) return null
  loadingHistory.value = true
  try {
    const page = await getAppChatHistory(app.value.id, {
      pageSize: HISTORY_PAGE_SIZE,
      lastCreateTime: reset ? undefined : historyCursor.value,
    })
    if (requestId !== loadSeq) return null
    if (reset) loadedHistoryIds.clear()
    const previousCursor = historyCursor.value
    const freshRecords = page.records.filter((record) => {
      if (loadedHistoryIds.has(record.id)) return false
      loadedHistoryIds.add(record.id)
      return true
    })
    const historyMessages = [...freshRecords]
      .sort((left, right) => (left.createTime || '').localeCompare(right.createTime || ''))
      .map(toChatMessage)
    const lastRecord = page.records[page.records.length - 1]
    const nextCursor = lastRecord?.createTime ?? undefined
    historyCursor.value = nextCursor
    hasMoreHistory.value =
      loadedHistoryIds.size < page.totalRow &&
      Boolean(nextCursor) &&
      nextCursor !== previousCursor &&
      freshRecords.length > 0
    historyMessageCount.value = page.totalRow
    if (reset) {
      messages.value = historyMessages
    } else {
      historyPrependVersion.value += 1
      messages.value = [...historyMessages, ...messages.value]
    }
    return historyMessages
  } catch (error) {
    if (requestId === loadSeq) loadError.value = error instanceof Error ? error.message : '加载对话历史失败'
    return null
  } finally {
    if (requestId === loadSeq) loadingHistory.value = false
  }
}

async function loadMoreChatHistory() {
  if (!hasMoreHistory.value || loadingHistory.value) return
  await loadChatHistory()
}

async function loadApp() {
  const requestId = ++loadSeq
  const id = String(route.params.id || '')
  loadError.value = ''
  if (!isNumericId(id)) {
    if (requestId === loadSeq) loadError.value = '应用 ID 不正确'
    return
  }
  try {
    const nextApp = await getApp(id)
    if (requestId !== loadSeq) return
    app.value = nextApp
    const historyMessages = await loadChatHistory(true, requestId)
    if (requestId !== loadSeq) return
    const autoStartRequested = route.query.autoStart === '1'
    // 历史加载失败时绝不能消费 autoStart：否则新建应用会永久跳过首轮生成。
    if (historyMessages === null) return
    const shouldAutoStart =
      autoStartRequested &&
      Boolean(nextApp.initPrompt) &&
      isOwner.value &&
      historyMessages.length === 0
    if (autoStartRequested) await consumeAutoStart()
    if (requestId !== loadSeq) return
    if (shouldAutoStart) {
      sendMessage(nextApp.initPrompt!)
    } else if (showPreview.value) {
      refreshPreview()
    }
  } catch (error) {
    if (requestId !== loadSeq) return
    if (error instanceof ApiError && error.code === 40100) {
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
      return
    }
    loadError.value = error instanceof Error ? error.message : '加载应用失败'
  }
}

async function consumeAutoStart() {
  const nextQuery = { ...route.query }
  delete nextQuery.autoStart
  await router.replace({ name: 'app-chat', params: route.params, query: nextQuery })
}

function sendFollowup() {
  const content = input.value.trim()
  if (!content || !canOperate.value) return
  input.value = ''
  sendMessage(content)
}

function sendMessage(content: string) {
  if (!app.value || generating.value || !canOperate.value) return
  closeStream()
  generationError.value = ''
  lastMessage.value = content
  const userMessage = createMessage('user', content, 'complete')
  const assistantMessage = reactive(createMessage('assistant', '', 'streaming'))
  messages.value.push(userMessage, assistantMessage)
  generating.value = true
  activePanel.value = 'chat'
  try {
    stream.value = connectAppGeneration({
      appId: app.value.id,
      message: content,
      onChunk: (chunk) => { assistantMessage.content += chunk },
      onDone: () => {
        assistantMessage.status = 'complete'
        historyMessageCount.value = Math.max(historyMessageCount.value, messages.value.filter((item) => item.status === 'complete').length)
        generating.value = false
        refreshPreview()
      },
      onError: (error) => {
        assistantMessage.status = 'error'
        generationError.value = error.message
        generating.value = false
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 生成失败，请稍后重试'
    assistantMessage.status = 'error'
    generationError.value = message
    generating.value = false
    stream.value = null
  }
}

function retryLastMessage() {
  if (!lastMessage.value || !canOperate.value || generating.value) return
  messages.value = removeFailedRetryTurn(messages.value, lastMessage.value)
  sendMessage(lastMessage.value)
}

function refreshPreview() {
  if (!app.value?.codeGenType) {
    previewUrl.value = ''
    return
  }
  previewUrl.value = buildPreviewUrl(undefined, app.value.codeGenType, app.value.id, Date.now())
}

async function deployCurrentApp() {
  if (!app.value || !canDeploy.value) return
  deploying.value = true
  try {
    deployUrl.value = await deployApp(app.value.id)
    deployModalOpen.value = true
    try {
      app.value = await getApp(app.value.id)
    } catch {
      message.warning('部署已成功，但应用信息刷新失败')
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : '部署失败')
  } finally {
    deploying.value = false
  }
}

function openDeployUrl() {
  if (!isHttpUrl(deployUrl.value)) {
    message.warning('部署地址不是有效链接')
    return
  }
  window.open(deployUrl.value, '_blank', 'noopener,noreferrer')
}

async function copyDeployUrl() {
  try {
    await navigator.clipboard.writeText(deployUrl.value)
    message.success('已复制')
  } catch {
    message.error('复制失败，请手动复制')
  }
}

function editApp() {
  if (!app.value) return
  void router.push({ name: 'app-edit', params: { id: app.value.id }, query: { from: route.fullPath } })
}

function closeStream() {
  stream.value?.close()
  stream.value = null
}

watch(
  () => route.params.id,
  () => {
    resetWorkbenchState()
    void loadApp()
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  loadSeq += 1
  closeStream()
})
</script>
<style scoped>
.chat-view {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 640px;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: 72px minmax(0, 1fr);
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--color-paper-soft);
}

.chat-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-rule);
  background: var(--color-panel-raised);
}

.app-title {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0;
  color: var(--color-ink);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  border: 0;
  background: transparent;
}

.app-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-switch {
  display: none;
  margin: var(--space-3) var(--space-4) 0;
}

.workbench {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-5);
  padding: var(--space-4);
}

.workbench.with-preview {
  grid-template-columns: minmax(380px, 480px) minmax(0, 1fr);
}

.chat-panel {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto auto;
  overflow: hidden;
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-lg);
  background: var(--color-panel-raised);
  box-shadow: var(--shadow-workbench);
}

.messages {
  grid-row: 3;
  min-height: 0;
}

.load-error {
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin: var(--space-4) var(--space-4) 0;
}

.history-load {
  grid-row: 2;
  padding: var(--space-2) var(--space-4) 0;
  text-align: center;
}

.stream-error {
  grid-row: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 0 var(--space-4) var(--space-3);
}

.stream-error :deep(.ant-alert) {
  flex: 1;
}

.chat-composer {
  grid-row: 5;
  margin: var(--space-4);
  min-height: 142px;
  box-shadow: var(--shadow-card);
}

.preview-panel {
  min-height: 0;
}

@media (max-width: 900px) {
  .chat-view {
    min-height: 100vh;
    min-height: 100dvh;
    grid-template-rows: 72px auto minmax(0, 1fr);
  }

  .mobile-switch {
    display: block;
  }

  .workbench {
    grid-template-columns: 1fr;
  }

  .show-chat .preview-panel,
  .show-preview .chat-panel {
    display: none;
  }

  .chat-panel,
  .preview-panel {
    min-height: calc(100vh - 140px);
    min-height: calc(100dvh - 140px);
  }
}

@media (max-width: 560px) {
  .chat-topbar {
    padding: 0 var(--space-3);
  }

  .workbench {
    padding: var(--space-3);
  }

  .chat-composer {
    margin: var(--space-3);
  }
}
</style>
