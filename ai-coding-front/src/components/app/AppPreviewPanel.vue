<template>
  <section class="preview-panel">
    <header class="preview-toolbar">
      <div>
        <h2>{{ title }}</h2>
        <p>{{ subtitle }}</p>
      </div>
      <a-space>
        <a-button :disabled="!safeUrl || loading || checking" :aria-label="`刷新 ${title}`" @click="emit('refresh')">
          <template #icon><ReloadOutlined /></template>
        </a-button>
        <a-button :disabled="!safeUrl || checking || failed" :aria-label="`打开 ${title}`" @click="openPreview">
          <template #icon><ExportOutlined /></template>
        </a-button>
      </a-space>
    </header>

    <div class="preview-body">
      <a-spin v-if="loading || checking" />
      <a-empty v-else-if="!safeUrl" description="网站生成完成后将在这里展示" />
      <div v-else-if="failed" class="preview-error">
        <a-result status="warning" title="预览加载失败">
          <template #extra>
            <a-button type="primary" @click="retry">重试</a-button>
          </template>
        </a-result>
      </div>
      <iframe
        v-else-if="showFrame"
        :key="frameKey"
        class="preview-frame"
        :src="safeUrl"
        title="应用预览"
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
        @load="handleFrameLoad"
        @error="failPreview"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ExportOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { isHttpUrl } from '@/utils/app'

const props = withDefaults(
  defineProps<{
    url: string
    loading?: boolean
    title?: string
    subtitle?: string
  }>(),
  {
    loading: false,
    title: '网页预览',
    subtitle: '生成完成后自动刷新',
  },
)

const emit = defineEmits<{
  refresh: []
}>()

const failed = ref(false)
const checking = ref(false)
const showFrame = ref(false)
const frameKey = ref(0)
const safeUrl = computed(() => (props.url && isHttpUrl(props.url) ? props.url : ''))
let checkSeq = 0
let probeController: AbortController | null = null
let frameTimeout: ReturnType<typeof setTimeout> | undefined

function openPreview() {
  if (!safeUrl.value) return
  window.open(safeUrl.value, '_blank', 'noopener,noreferrer')
}

function retry() {
  checkPreview()
  emit('refresh')
}

function clearFrameTimeout() {
  if (frameTimeout) clearTimeout(frameTimeout)
  frameTimeout = undefined
}

function isSameOrigin(url: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    return new URL(url).origin === window.location.origin
  } catch {
    return false
  }
}

function failPreview() {
  clearFrameTimeout()
  checking.value = false
  showFrame.value = false
  failed.value = true
}

function armFrameTimeout(requestId: number) {
  clearFrameTimeout()
  frameTimeout = setTimeout(() => {
    if (requestId === checkSeq) failPreview()
  }, 12_000)
}

function handleFrameLoad() {
  clearFrameTimeout()
}

function checkPreview() {
  const url = safeUrl.value
  const requestId = ++checkSeq
  probeController?.abort()
  probeController = null
  clearFrameTimeout()
  failed.value = false
  showFrame.value = false
  frameKey.value += 1

  if (!url) {
    checking.value = false
    return
  }

  checking.value = true
  if (!isSameOrigin(url)) {
    checking.value = false
    showFrame.value = true
    armFrameTimeout(requestId)
    return
  }

  probeController = new AbortController()
  // 后端静态资源仅声明了 GET；HEAD 在同域代理下会误判为预览失败。
  fetch(url, { method: 'GET', cache: 'no-store', signal: probeController.signal })
    .then((response) => {
      if (requestId !== checkSeq) return
      if (!response.ok) {
        failPreview()
        return
      }
      checking.value = false
      showFrame.value = true
      armFrameTimeout(requestId)
    })
    .catch((error: unknown) => {
      if (requestId !== checkSeq || (error instanceof DOMException && error.name === 'AbortError')) return
      // 探测失败时仍尝试直接加载 iframe，避免仅因探测方式导致预览不可用。
      checking.value = false
      showFrame.value = true
      armFrameTimeout(requestId)
    })
}

watch(
  () => props.url,
  checkPreview,
  { immediate: true },
)

onBeforeUnmount(() => {
  checkSeq += 1
  probeController?.abort()
  clearFrameTimeout()
})
</script>

<style scoped>
.preview-panel {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-lg);
  background: var(--color-panel-raised);
  box-shadow: var(--shadow-workbench);
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-rule);
}

.preview-toolbar h2 {
  margin: 0;
  font-size: 16px;
}

.preview-toolbar p {
  margin: var(--space-1) 0 0;
  color: var(--color-muted);
  font-size: 12px;
}

.preview-body {
  min-height: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--color-panel-raised);
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: var(--color-panel);
}

.preview-error {
  width: 100%;
}

@media (max-width: 640px) {
  .preview-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
