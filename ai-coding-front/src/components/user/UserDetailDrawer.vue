<template>
  <a-drawer :open="open" title="用户详情" width="480" placement="right" @close="emit('update:open', false)">
    <div v-if="user" class="user-summary">
      <a-avatar :size="68" :src="user.userAvatar || undefined"><template #icon><UserOutlined /></template></a-avatar>
      <div>
        <strong>{{ user.userName || '-' }}</strong>
        <p>{{ user.userAccount }}</p>
      </div>
    </div>
    <a-descriptions v-if="user" :column="1" bordered size="small">
      <a-descriptions-item label="用户 ID">{{ user.id }}</a-descriptions-item>
      <a-descriptions-item label="账号">{{ user.userAccount }}</a-descriptions-item>
      <a-descriptions-item label="昵称">{{ user.userName || '-' }}</a-descriptions-item>
      <a-descriptions-item label="个人简介">{{ user.userProfile || '-' }}</a-descriptions-item>
      <a-descriptions-item label="角色"><a-tag :color="user.userRole === 'admin' ? 'orange' : 'blue'">{{ user.userRole === 'admin' ? '管理员' : '普通用户' }}</a-tag></a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ formatDate(user.createTime) }}</a-descriptions-item>
    </a-descriptions>
    <template #footer>
      <a-space>
        <a-button @click="emit('update:open', false)">关闭</a-button>
        <a-button type="primary" @click="emit('edit')">编辑</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { UserOutlined } from '@ant-design/icons-vue'
import type { UserVO } from '@/types/user'

defineProps<{ open: boolean; user: UserVO | null }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; edit: [] }>()

function formatDate(value: string | null): string {
  return value ? value.replace('T', ' ') : '-'
}
</script>

<style scoped>
.user-summary { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.user-summary strong { color: #1e293b; font-size: 18px; }
.user-summary p { color: #64748b; margin: 4px 0 0; }
</style>
