<template>
  <section class="preview-panel">
    <header class="preview-toolbar">
      <div>
        <h2>{{ title }}</h2>
        <p>{{ subtitle }}</p>
      </div>
      <a-space>
        <a-button :disabled="!safeUrl || loading" :aria-label="`刷新 ${title}`" @click="emit('refresh')">
          <template #icon><ReloadOutlined /></template>
        </a-button>
        <a-button :disabled="!safeUrl" :aria-label="`打开 ${title}`" @click="openPreview">
          <template #icon><ExportOutlined /></template>
        </a-button>
      </a-space>
    </header>

    <div class="preview-body">
      <a-spin v-if="loading" />
      <a-empty v-else-if="!safeUrl" description="网站生成完成后将在这里展示" />
      <div v-else-if="failed" class="preview-error">
        <a-result status="warning" title="预览加载失败">
          <template #extra>
            <a-button type="primary" @click="retry">重试</a-button>
          </template>
        </a-result>
      </div>
      <iframe
        v-else
        :key="frameKey"
        class="preview-frame"
        :src="safeUrl"
        title="应用预览"
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
        @error="failed = true"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
const frameKey = ref(0)
const safeUrl = computed(() => (props.url && isHttpUrl(props.url) ? props.url : ''))

function openPreview() {
  if (!safeUrl.value) return
  window.open(safeUrl.value, '_blank', 'noopener,noreferrer')
}

function retry() {
  failed.value = false
  frameKey.value += 1
  emit('refresh')
}

watch(
  () => props.url,
  () => {
    failed.value = false
    frameKey.value += 1
  },
)
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
