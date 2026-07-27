<template>
  <main class="home-view">
    <section class="prompt-hero">
      <div class="hero-copy">
        <h1>一句话，呈所想</h1>
        <p>与 AI 对话生成应用和网站，完成后直接预览与部署。</p>
      </div>

      <div class="composer-wrap">
        <PromptComposer
          v-model="prompt"
          :loading="creating"
          placeholder="描述你想创建的工具、企业官网或个人博客..."
          submit-label="创建应用"
          @submit="submitPrompt"
        />
        <a-alert
          v-if="draftRestored"
          class="draft-banner"
          type="info"
          show-icon
          closable
          message="已恢复你登录前填写的描述，确认后点击「创建应用」继续"
          @close="dismissDraft"
        />
        <div class="suggestions">
          <a-button v-for="item in suggestions" :key="item" size="small" @click="prompt = item">
            {{ item }}
          </a-button>
        </div>
      </div>
    </section>

    <section class="work-gallery">
      <AppListSection
        title="我的应用"
        description="继续生成、编辑或删除你创建的应用"
        :items="myApps"
        :loading="myLoading"
        :total="myTotal"
        :page="myQuery.pageNum"
        :page-size="myQuery.pageSize"
        :editable="Boolean(userStore.loginUser)"
        :deletable="Boolean(userStore.loginUser)"
        :empty-text="userStore.loginUser ? '还没有创建应用' : '登录后查看你的应用'"
        :error-message="myLoadError"
        @search="searchMyApps"
        @page="changeMyPage"
        @open="openApp"
        @edit="editApp"
        @delete="confirmDelete"
        @retry="loadMyApps"
      />

      <AppListSection
        title="精选应用"
        description="浏览站内精选案例"
        :items="goodApps"
        :loading="goodLoading"
        :total="goodTotal"
        :page="goodQuery.pageNum"
        :page-size="goodQuery.pageSize"
        empty-text="暂无精选应用"
        :error-message="goodLoadError"
        @search="searchGoodApps"
        @page="changeGoodPage"
        @open="openApp"
        @retry="loadGoodApps"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import AppListSection from '@/components/app/AppListSection.vue'
import PromptComposer from '@/components/app/PromptComposer.vue'
import { addApp, deleteApp, listGoodApps, listMyApps } from '@/services/app'
import { ApiError } from '@/services/http'
import { useUserStore } from '@/stores/user'
import type { AppVO } from '@/types/app'
import { normalizePublicAppQuery } from '@/utils/app'

const DRAFT_KEY = 'ai-app-init-prompt'

const router = useRouter()
const userStore = useUserStore()
const prompt = ref('')
const creating = ref(false)
const draftRestored = ref(false)
const myApps = ref<AppVO[]>([])
const goodApps = ref<AppVO[]>([])
const myTotal = ref(0)
const goodTotal = ref(0)
const myLoading = ref(false)
const goodLoading = ref(false)
const myLoadError = ref('')
const goodLoadError = ref('')
let myLoadSeq = 0
let goodLoadSeq = 0
const myQuery = reactive<{ pageNum: number; pageSize: number; appName?: string }>({
  pageNum: 1,
  pageSize: 8,
})
const goodQuery = reactive<{ pageNum: number; pageSize: number; appName?: string }>({
  pageNum: 1,
  pageSize: 8,
})
const suggestions = ['波普风电商页面', '企业网站', '电商运营后台', '暗黑话题社区']

async function submitPrompt() {
  const initPrompt = prompt.value.trim()
  if (!initPrompt || creating.value) return

  if (!userStore.loginUser) {
    sessionStorage.setItem(DRAFT_KEY, initPrompt)
    await router.push({ path: '/login', query: { redirect: '/' } })
    return
  }

  creating.value = true
  try {
    const id = await addApp({ initPrompt })
    prompt.value = ''
    draftRestored.value = false
    sessionStorage.removeItem(DRAFT_KEY)
    await router.push({ name: 'app-chat', params: { id }, query: { autoStart: '1' } })
  } catch (error) {
    handleError(error, '创建应用失败')
  } finally {
    creating.value = false
  }
}

function dismissDraft() {
  // 用户显式关闭提示即视为放弃恢复：清掉草稿，避免下次进入首页重复弹提示。
  draftRestored.value = false
  sessionStorage.removeItem(DRAFT_KEY)
}

async function loadMyApps() {
  const requestId = ++myLoadSeq
  myLoadError.value = ''
  if (!userStore.loginUser) {
    myApps.value = []
    myTotal.value = 0
    myLoading.value = false
    return
  }
  myLoading.value = true
  try {
    const page = await listMyApps(normalizePublicAppQuery(myQuery))
    if (requestId !== myLoadSeq) return
    myApps.value = page.records
    myTotal.value = page.totalRow
  } catch (error) {
    if (requestId !== myLoadSeq) return
    myLoadError.value = error instanceof Error ? error.message : '加载我的应用失败'
    handleError(error, '加载我的应用失败')
  } finally {
    if (requestId === myLoadSeq) myLoading.value = false
  }
}

async function loadGoodApps() {
  const requestId = ++goodLoadSeq
  goodLoadError.value = ''
  goodLoading.value = true
  try {
    const page = await listGoodApps(normalizePublicAppQuery(goodQuery))
    if (requestId !== goodLoadSeq) return
    goodApps.value = page.records
    goodTotal.value = page.totalRow
  } catch (error) {
    if (requestId !== goodLoadSeq) return
    goodLoadError.value = error instanceof Error ? error.message : '加载精选应用失败'
    handleError(error, '加载精选应用失败')
  } finally {
    if (requestId === goodLoadSeq) goodLoading.value = false
  }
}

function searchMyApps(appName: string) {
  myQuery.pageNum = 1
  myQuery.appName = appName || undefined
  void loadMyApps()
}

function searchGoodApps(appName: string) {
  goodQuery.pageNum = 1
  goodQuery.appName = appName || undefined
  void loadGoodApps()
}

function changeMyPage(page: number, pageSize: number) {
  const sizeChanged = pageSize !== myQuery.pageSize
  myQuery.pageSize = pageSize
  myQuery.pageNum = sizeChanged ? 1 : page
  void loadMyApps()
}

function changeGoodPage(page: number, pageSize: number) {
  const sizeChanged = pageSize !== goodQuery.pageSize
  goodQuery.pageSize = pageSize
  goodQuery.pageNum = sizeChanged ? 1 : page
  void loadGoodApps()
}

function openApp(app: AppVO) {
  void router.push({ name: 'app-chat', params: { id: app.id } })
}

function editApp(app: AppVO) {
  void router.push({ name: 'app-edit', params: { id: app.id }, query: { from: '/' } })
}

function confirmDelete(app: AppVO) {
  Modal.confirm({
    title: '确认删除应用？',
    content: `将删除“${app.appName || '未命名应用'}”，该操作不可撤销。`,
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: async () => {
      try {
        const deleted = await deleteApp(app.id)
        if (!deleted) {
          throw new Error('删除应用失败')
        }
        if (myApps.value.length === 1 && myQuery.pageNum && myQuery.pageNum > 1) {
          myQuery.pageNum -= 1
        }
        message.success('删除成功')
        await loadMyApps()
      } catch (error) {
        handleError(error, '删除应用失败')
      }
    },
  })
}

function handleError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.code === 40100) {
    userStore.clearLoginUser()
    void router.push({ path: '/login', query: { redirect: '/' } })
    return
  }
  message.error(error instanceof Error ? error.message : fallback)
}

onMounted(() => {
  const draft = sessionStorage.getItem(DRAFT_KEY)
  if (draft) {
    prompt.value = draft
    // 保留草稿直到创建成功或用户关闭提示；用常驻 banner 提示，不再每次进入都弹 toast
    draftRestored.value = true
  }
  void loadMyApps()
  void loadGoodApps()
})

watch(
  () => userStore.loginUser?.id,
  () => void loadMyApps(),
)
</script>

<style scoped>
.home-view {
  min-width: 0;
  max-width: 100%;
  margin: calc(var(--space-8) * -1) 0 calc(var(--space-12) * -1);
}

.prompt-hero {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
  gap: var(--space-6);
  padding: var(--space-10) var(--space-6);
  border-top: 2px solid var(--color-field-cyan);
  border-bottom: 1px solid var(--color-rule);
  background: var(--color-panel-raised);
}

.hero-copy {
  width: min(100%, 880px);
  text-align: left;
}

.hero-copy h1 {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 32px;
  line-height: 1.3;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.hero-copy p {
  margin: var(--space-4) 0 0;
  color: var(--color-muted);
  font-size: 16px;
  line-height: 1.6;
}

.composer-wrap {
  width: min(100%, 880px);
  min-width: 0;
  display: grid;
  gap: var(--space-4);
}

.suggestions {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.suggestions :deep(.ant-btn) {
  height: 34px;
  color: var(--color-muted);
  border-color: var(--color-rule);
  border-radius: var(--radius-sm);
  background: var(--color-panel);
}

.suggestions :deep(.ant-btn:hover) {
  color: var(--color-accent-strong);
  border-color: var(--color-field-blue);
  background: var(--color-panel-raised);
}

.work-gallery {
  display: grid;
  gap: var(--space-12);
  width: min(100%, 1400px);
  margin: 0 auto;
  padding: var(--space-10) var(--space-6) var(--space-12);
}

.draft-banner {
  text-align: left;
  border-radius: var(--radius-md);
}

@media (max-width: 640px) {
  .home-view {
    margin: calc(var(--space-5) * -1) 0 calc(var(--space-8) * -1);
  }

  .prompt-hero {
    min-height: 0;
    gap: var(--space-5);
    padding: var(--space-8) var(--space-3);
  }

  .hero-copy h1 {
    font-size: 28px;
  }

  .hero-copy p {
    font-size: 16px;
  }

  .work-gallery {
    width: 100%;
    padding: var(--space-8) var(--space-3);
  }
}
</style>
