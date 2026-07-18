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
        @search="searchMyApps"
        @page="changeMyPage"
        @open="openApp"
        @edit="editApp"
        @delete="confirmDelete"
        @deploy="openApp"
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
        @search="searchGoodApps"
        @page="changeGoodPage"
        @open="openApp"
        @edit="openApp"
        @delete="openApp"
        @deploy="openApp"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
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
const myApps = ref<AppVO[]>([])
const goodApps = ref<AppVO[]>([])
const myTotal = ref(0)
const goodTotal = ref(0)
const myLoading = ref(false)
const goodLoading = ref(false)
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
    sessionStorage.removeItem(DRAFT_KEY)
    await router.push({ name: 'app-chat', params: { id }, query: { autoStart: '1' } })
  } catch (error) {
    handleError(error, '创建应用失败')
  } finally {
    creating.value = false
  }
}

async function loadMyApps() {
  if (!userStore.loginUser) {
    myApps.value = []
    myTotal.value = 0
    return
  }
  const requestId = ++myLoadSeq
  myLoading.value = true
  try {
    const page = await listMyApps(normalizePublicAppQuery(myQuery))
    if (requestId !== myLoadSeq) return
    myApps.value = page.records
    myTotal.value = page.totalRow
  } catch (error) {
    if (requestId !== myLoadSeq) return
    handleError(error, '加载我的应用失败')
  } finally {
    if (requestId === myLoadSeq) myLoading.value = false
  }
}

async function loadGoodApps() {
  const requestId = ++goodLoadSeq
  goodLoading.value = true
  try {
    const page = await listGoodApps(normalizePublicAppQuery(goodQuery))
    if (requestId !== goodLoadSeq) return
    goodApps.value = page.records
    goodTotal.value = page.totalRow
  } catch (error) {
    if (requestId !== goodLoadSeq) return
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
    sessionStorage.removeItem(DRAFT_KEY)
  }
  void loadMyApps()
  void loadGoodApps()
})
</script>

<style scoped>
.home-view {
  min-width: 0;
  max-width: 100%;
  margin: calc(var(--space-8) * -1) 0 calc(var(--space-12) * -1);
}

.prompt-hero {
  position: relative;
  min-width: 0;
  min-height: 660px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
  align-content: center;
  gap: var(--space-8);
  padding: var(--space-16) var(--space-4) calc(var(--space-16) + var(--space-12));
  overflow: hidden;
  background:
    repeating-linear-gradient(154deg, transparent 0 13px, var(--color-field-stripe) 14px 15px, transparent 16px 30px),
    linear-gradient(153deg, var(--color-paper) 0%, var(--color-field-mist) 42%, var(--color-field-cyan) 70%, var(--color-field-blue) 100%);
}

.hero-copy {
  max-width: 680px;
  text-align: center;
  z-index: 1;
}

.hero-copy h1 {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 58px;
  line-height: 1.12;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.hero-copy p {
  margin: var(--space-4) 0 0;
  color: var(--color-muted);
  font-size: 18px;
  line-height: 1.65;
}

.composer-wrap {
  width: min(100%, 880px);
  min-width: 0;
  display: grid;
  gap: var(--space-4);
  z-index: 1;
}

.suggestions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.suggestions :deep(.ant-btn) {
  height: 34px;
  color: var(--color-muted);
  border-color: var(--color-rule-on-field);
  border-radius: var(--radius-sm);
  background: var(--color-panel-on-field);
}

.work-gallery {
  position: relative;
  z-index: 2;
  display: grid;
  gap: var(--space-12);
  width: min(90%, 1400px);
  margin: calc(var(--space-16) * -1) auto 0;
  padding: var(--space-10) var(--space-8) var(--space-12);
  border: 1px solid var(--color-rule-on-field);
  border-radius: 24px 24px 0 0;
  background: var(--color-panel);
  box-shadow: var(--shadow-panel);
}

@media (max-width: 640px) {
  .home-view {
    margin: calc(var(--space-5) * -1) 0 calc(var(--space-8) * -1);
  }

  .prompt-hero {
    min-height: 570px;
    padding: var(--space-12) var(--space-3) calc(var(--space-12) + var(--space-8));
  }

  .hero-copy h1 {
    font-size: 40px;
  }

  .hero-copy p {
    font-size: 16px;
  }

  .work-gallery {
    width: calc(100% - var(--space-4));
    margin-top: calc(var(--space-10) * -1);
    padding: var(--space-6) var(--space-4) var(--space-8);
    border-radius: 16px 16px 0 0;
  }
}
</style>
