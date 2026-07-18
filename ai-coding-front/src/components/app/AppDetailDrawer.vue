<template>
  <a-drawer v-model:open="drawerOpen" title="应用详情" width="520px">
    <template v-if="app">
      <a-image
        v-if="coverUrl"
        class="detail-cover"
        :src="coverUrl"
        :alt="app.appName || '应用封面'"
      />
      <a-descriptions :column="1" bordered size="small">
        <a-descriptions-item label="应用 ID">{{ app.id }}</a-descriptions-item>
        <a-descriptions-item label="应用名称">{{ app.appName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="初始提示词">{{ app.initPrompt || '-' }}</a-descriptions-item>
        <a-descriptions-item label="生成类型">{{ app.codeGenType || '-' }}</a-descriptions-item>
        <a-descriptions-item label="部署标识">{{ app.deployKey || '-' }}</a-descriptions-item>
        <a-descriptions-item label="部署时间">{{ formatDate(app.deployedTime) }}</a-descriptions-item>
        <a-descriptions-item label="优先级">{{ app.priority }}</a-descriptions-item>
        <a-descriptions-item label="创建用户">{{ app.user?.userName || app.user?.userAccount || app.userId }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatDate(app.createTime) }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ formatDate(app.updateTime) }}</a-descriptions-item>
      </a-descriptions>
    </template>
    <template #footer>
      <a-space>
        <a-button @click="drawerOpen = false">关闭</a-button>
        <a-button v-if="app" type="primary" @click="emit('edit', app)">编辑</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AppVO } from '@/types/app'
import { isHttpUrl } from '@/utils/app'

const props = defineProps<{
  open: boolean
  app: AppVO | null
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  edit: [app: AppVO]
}>()

const drawerOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

const coverUrl = computed(() => (props.app?.cover && isHttpUrl(props.app.cover) ? props.app.cover : ''))

function formatDate(value: string | null): string {
  return value ? value.replace('T', ' ').slice(0, 19) : '-'
}
</script>

<style scoped>
.detail-cover {
  width: 100%;
  margin-bottom: var(--space-4);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
</style>
