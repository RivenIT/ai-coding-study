<template>
  <article class="app-card">
    <div class="cover-preview">
      <img
        v-if="coverUrl && !imageFailed"
        :src="coverUrl"
        :alt="title"
        class="cover-image"
        loading="lazy"
        @error="imageFailed = true"
      />
      <iframe
        v-else-if="previewUrl"
        :src="previewUrl"
        :title="`${title}预览`"
        class="cover-preview-frame"
        loading="lazy"
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
        tabindex="-1"
        aria-hidden="true"
      />
      <div v-else class="cover-placeholder">
        <span>{{ placeholderText }}</span>
      </div>
      <button
        class="cover-button"
        type="button"
        :aria-label="`打开 ${title}`"
        @click="emit('open', app)"
      />
    </div>

    <div class="card-body">
      <button class="title-button" type="button" @click="emit('open', app)">
        {{ title }}
      </button>
      <p class="meta">{{ ownerName }} · {{ createTime }}</p>
      <div class="tag-row">
        <a-tag v-if="app.codeGenType" color="blue">{{ app.codeGenType }}</a-tag>
        <a-tag v-if="app.priority >= 99" color="gold">精选</a-tag>
        <a-tag v-if="app.deployKey" color="green">已部署</a-tag>
      </div>
      <div v-if="editable || deletable" class="action-row">
        <a-button type="text" size="small" :aria-label="`打开 ${title}`" @click="emit('open', app)">
          <template #icon><EyeOutlined /></template>
        </a-button>
        <a-button
          v-if="editable"
          type="text"
          size="small"
          :aria-label="`编辑 ${title}`"
          @click="emit('edit', app)"
        >
          <template #icon><EditOutlined /></template>
        </a-button>
        <a-button
          v-if="deletable"
          danger
          type="text"
          size="small"
          :aria-label="`删除 ${title}`"
          @click="emit('delete', app)"
        >
          <template #icon><DeleteOutlined /></template>
        </a-button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from '@ant-design/icons-vue'
import type { AppVO } from '@/types/app'
import { buildPreviewUrl, isHttpUrl } from '@/utils/app'

const props = withDefaults(
  defineProps<{
    app: AppVO
    editable?: boolean
    deletable?: boolean
  }>(),
  {
    editable: false,
    deletable: false,
  },
)

const emit = defineEmits<{
  open: [app: AppVO]
  edit: [app: AppVO]
  delete: [app: AppVO]
}>()

const imageFailed = ref(false)
const title = computed(() => props.app.appName || '未命名应用')
const coverUrl = computed(() =>
  props.app.cover && isHttpUrl(props.app.cover) ? props.app.cover : '',
)
const previewUrl = computed(() => {
  if (coverUrl.value || !props.app.codeGenType) return ''

  return buildPreviewUrl(
    undefined,
    props.app.codeGenType,
    props.app.id,
    props.app.updateTime || undefined,
  )
})
const ownerName = computed(
  () => props.app.user?.userName || props.app.user?.userAccount || `用户 ${props.app.userId}`,
)
const placeholderText = computed(() => title.value.slice(0, 2).toUpperCase())
const createTime = computed(() => formatDate(props.app.createTime))

watch(
  () => props.app.cover,
  () => {
    imageFailed.value = false
  },
)

function formatDate(value: string | null): string {
  if (!value) return '创建时间未知'
  return value.replace('T', ' ').slice(0, 16)
}
</script>

<style scoped>
.app-card {
  min-width: 0;
  display: grid;
  gap: var(--space-3);
  padding: var(--space-2);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-md);
  background: var(--color-panel);
  transition:
    border-color var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}

.app-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
}

.cover-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: var(--color-panel-raised);
}

.cover-preview:hover .cover-image,
.cover-preview:focus-within .cover-image {
  transform: scale(1.02);
}

.cover-button {
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  padding: 0;
  cursor: pointer;
  border: 0;
  background: transparent;
}

.cover-button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--dur-med) var(--ease-out);
}

.cover-preview-frame {
  width: 250%;
  height: 250%;
  border: 0;
  pointer-events: none;
  background: var(--color-panel);
  transform: scale(0.4);
  transform-origin: top left;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--color-accent-strong);
  background: var(--color-paper-soft);
}

.cover-placeholder span {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 800;
}

.card-body {
  min-width: 0;
  display: grid;
  gap: var(--space-2);
}

.title-button {
  min-width: 0;
  padding: 0;
  overflow: hidden;
  color: var(--color-ink);
  font: inherit;
  font-size: 17px;
  font-weight: 700;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  border: 0;
  background: transparent;
}

.title-button:hover {
  color: var(--color-accent-strong);
}

.meta {
  margin: 0;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-row,
.action-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.tag-row :deep(.ant-tag) {
  margin-inline-end: 0;
}
</style>
