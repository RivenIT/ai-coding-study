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
      v-model:value="activePanel"
      class="mobile-switch"
      :options="[
        { label: '对话', value: 'chat' },
        { label: '预览', value: 'preview' },
      ]"
    />

    <section class="workbench" :class="`show-${activePanel}`">
      <section class="chat-panel">
        <a-alert v-if="loadError" type="error" show-icon :message="loadError" />
        <ChatMessageList class="messages" :messages="messages" />
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
        class="preview-panel"
        :url="previewUrl"
        :loading="previewLoading"
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
import { connectAppGeneration, type AppGenerationConnection } from '@/services/appSse'
import { ApiError } from '@/services/http'
import { useUserStore } from '@/stores/user'
import type { AppVO, ChatMessage } from '@/types/app'
import { buildPreviewUrl, canEditApp, isHttpUrl, isNumericId } from '@/utils/app'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const app = ref<AppVO | null>(null)
const input = ref('')
const messages = ref<ChatMessage[]>([])
const stream = ref<AppGenerationConnection | null>(null)
const generating = ref(false)
const deploying = ref(false)
const previewLoading = ref(false)
const previewUrl = ref('')
const loadError = ref('')
const generationError = ref('')
const lastMessage = ref('')
const activePanel = ref<'chat' | 'preview'>('chat')
const deployModalOpen = ref(false)
const deployUrl = ref('')
let loadSeq = 0

const isOwner = computed(() => {
  if (!app.value || !userStore.loginUser) return false
  return userStore.loginUser.id === app.value.userId
})
const canEdit = computed(() => {
  if (!app.value || !userStore.loginUser) return false
  return canEditApp({
    role: userStore.isAdmin ? 'admin' : 'user',
    userId: userStore.loginUser.id,
    ownerId: app.value.userId,
  })
})
// 后端要求仅应用创建者可继续对话生成和部署
const canOperate = computed(() => isOwner.value)
const canDeploy = computed(() => Boolean(app.value && isOwner.value && !generating.value && !deploying.value))

function createMessage(role: ChatMessage['role'], content: string, status: ChatMessage['status']): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    status,
  }
}

function resetWorkbenchState() {
  closeStream()
  app.value = null
  input.value = ''
  messages.value = []
  generating.value = false
  deploying.value = false
  previewLoading.value = false
  previewUrl.value = ''
  loadError.value = ''
  generationError.value = ''
  lastMessage.value = ''
  activePanel.value = 'chat'
  deployModalOpen.value = false
  deployUrl.value = ''
}

async function loadApp() {
  const requestId = ++loadSeq
  const id = String(route.params.id || '')
  if (!isNumericId(id)) {
    if (requestId === loadSeq) loadError.value = '应用 ID 不正确'
    return
  }

  try {
    const nextApp = await getApp(id)
    if (requestId !== loadSeq) return
    app.value = nextApp
    const initPrompt = nextApp.initPrompt || ''
    const autoStartRequested = route.query.autoStart === '1'
    const shouldAutoStart = autoStartRequested && Boolean(initPrompt) && canOperate.value
    if (autoStartRequested) await consumeAutoStart()
    if (requestId !== loadSeq) return
    if (shouldAutoStart) {
      sendMessage(initPrompt)
    } else {
      seedInitialMessage()
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

function seedInitialMessage() {
  if (!app.value?.initPrompt || messages.value.length > 0) return
  messages.value = [createMessage('user', app.value.initPrompt, 'complete')]
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
  previewLoading.value = true
  activePanel.value = 'chat'

  stream.value = connectAppGeneration({
    appId: app.value.id,
    message: content,
    onChunk: (chunk) => {
      assistantMessage.content += chunk
    },
    onDone: () => {
      assistantMessage.status = 'complete'
      generating.value = false
      previewLoading.value = false
      refreshPreview()
    },
    onError: (error) => {
      assistantMessage.status = 'error'
      generationError.value = error.message
      generating.value = false
      previewLoading.value = false
    },
  })
}

function retryLastMessage() {
  if (!lastMessage.value || !canOperate.value) return
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
  if (!app.value || deploying.value || !canOperate.value) return
  deploying.value = true
  try {
    const url = await deployApp(app.value.id)
    deployUrl.value = url
    app.value = await getApp(app.value.id)
    deployModalOpen.value = true
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
  min-height: 640px;
  display: grid;
  grid-template-rows: 72px minmax(0, 1fr);
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
  grid-template-columns: minmax(380px, 480px) minmax(0, 1fr);
  gap: var(--space-5);
  padding: var(--space-4);
}

.chat-panel {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  overflow: hidden;
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-lg);
  background: var(--color-panel-raised);
  box-shadow: var(--shadow-workbench);
}

.messages {
  min-height: 0;
}

.stream-error {
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
