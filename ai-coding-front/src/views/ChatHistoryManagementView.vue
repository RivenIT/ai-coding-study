<template>
  <section class="management-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">ADMINISTRATION</span>
        <h1>对话管理</h1>
        <p>检索和查看所有应用的历史对话</p>
      </div>
    </header>

    <a-form class="filter-bar" layout="inline" @finish="search">
      <a-form-item label="记录 ID" :validate-status="idError ? 'error' : undefined" :help="idError">
        <a-input v-model:value="filters.id" allow-clear placeholder="精确 ID" />
      </a-form-item>
      <a-form-item label="应用 ID" :validate-status="appIdError ? 'error' : undefined" :help="appIdError">
        <a-input v-model:value="filters.appId" allow-clear placeholder="精确应用 ID" />
      </a-form-item>
      <a-form-item label="用户 ID" :validate-status="userIdError ? 'error' : undefined" :help="userIdError">
        <a-input v-model:value="filters.userId" allow-clear placeholder="精确用户 ID" />
      </a-form-item>
      <a-form-item label="消息类型">
        <a-select v-model:value="filters.messageType" allow-clear style="width: 130px" :options="messageTypeOptions" placeholder="全部类型" />
      </a-form-item>
      <a-form-item label="消息内容">
        <a-input v-model:value="filters.message" allow-clear placeholder="消息关键词" />
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button type="primary" html-type="submit">
            <template #icon><SearchOutlined /></template>
            查询
          </a-button>
          <a-button @click="reset">
            <template #icon><ReloadOutlined /></template>
            重置
          </a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <a-table
      class="history-table"
      :columns="columns"
      :data-source="records"
      :loading="loading"
      :pagination="false"
      :row-key="(record: ChatHistory) => record.id"
      :scroll="{ x: 1120 }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'messageType'">
          <a-tag :color="record.messageType === 'user' ? 'blue' : 'purple'">
            {{ record.messageType === 'user' ? '用户' : 'AI' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'message'">
          <a-typography-paragraph class="ellipsis" :ellipsis="{ tooltip: record.message }" :content="record.message || '-'" />
        </template>
        <template v-else-if="column.key === 'createTime'">{{ formatDate(record.createTime) }}</template>
      </template>
    </a-table>

    <div class="pagination-bar">
      <span>共 {{ total }} 条</span>
      <a-pagination
        :current="query.pageNum"
        :page-size="query.pageSize"
        :total="total"
        :page-size-options="['10', '20', '50', '100']"
        show-size-changer
        show-quick-jumper
        @change="changePage"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { listChatHistoryByAdmin } from '@/services/chatHistory'
import { isAuthenticationError } from '@/services/http'
import { useUserStore } from '@/stores/user'
import type { ChatHistory, ChatHistoryQueryInput } from '@/types/chatHistory'
import { isNumericId } from '@/utils/app'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const records = ref<ChatHistory[]>([])
const total = ref(0)
const loading = ref(false)
const idError = ref('')
const appIdError = ref('')
const userIdError = ref('')
let loadSeq = 0
const query = reactive<ChatHistoryQueryInput>({ pageNum: 1, pageSize: 10, sortField: 'createTime', sortOrder: 'descend' })
const filters = reactive<{ id: string; appId: string; userId: string; messageType?: 'user' | 'ai'; message: string }>({
  id: '',
  appId: '',
  userId: '',
  messageType: undefined,
  message: '',
})
const messageTypeOptions = [
  { label: '用户', value: 'user' },
  { label: 'AI', value: 'ai' },
]
const sortableFields = ['id', 'appId', 'userId', 'messageType', 'createTime', 'updateTime'] as const
const columns = [
  { title: '记录 ID', dataIndex: 'id', key: 'id', width: 150, sorter: true },
  { title: '应用 ID', dataIndex: 'appId', key: 'appId', width: 150, sorter: true },
  { title: '用户 ID', dataIndex: 'userId', key: 'userId', width: 150, sorter: true },
  { title: '消息类型', dataIndex: 'messageType', key: 'messageType', width: 110, sorter: true },
  { title: '消息内容', dataIndex: 'message', key: 'message', width: 360 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180, sorter: true },
]

function formatDate(value: string | null): string {
  return value ? value.replace('T', ' ').slice(0, 19) : '-'
}

function validateIds(): boolean {
  idError.value = filters.id.trim() && !isNumericId(filters.id.trim()) ? '记录 ID 必须是数字' : ''
  appIdError.value = filters.appId.trim() && !isNumericId(filters.appId.trim()) ? '应用 ID 必须是数字' : ''
  userIdError.value = filters.userId.trim() && !isNumericId(filters.userId.trim()) ? '用户 ID 必须是数字' : ''
  return !idError.value && !appIdError.value && !userIdError.value
}

function getRequestQuery() {
  return {
    pageNum: query.pageNum ?? 1,
    pageSize: query.pageSize ?? 10,
    sortField: query.sortField ?? 'createTime',
    sortOrder: query.sortOrder ?? 'descend',
    id: filters.id.trim() || undefined,
    appId: filters.appId.trim() || undefined,
    userId: filters.userId.trim() || undefined,
    messageType: filters.messageType,
    message: filters.message.trim() || undefined,
  }
}

async function loadChatHistory() {
  const requestId = ++loadSeq
  if (!validateIds()) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const page = await listChatHistoryByAdmin(getRequestQuery())
    if (requestId !== loadSeq) return
    records.value = page.records
    total.value = page.totalRow
  } catch (error) {
    if (requestId !== loadSeq) return
    handleRequestError(error, '加载对话历史失败')
  } finally {
    if (requestId === loadSeq) loading.value = false
  }
}

function handleRequestError(error: unknown, fallback: string): boolean {
  if (isAuthenticationError(error)) {
    records.value = []
    total.value = 0
    userStore.clearLoginUser()
    void router.replace({ path: '/login', query: { redirect: route.fullPath } })
    return true
  }

  message.error(error instanceof Error ? error.message : fallback)
  return false
}

function search() {
  query.pageNum = 1
  void loadChatHistory()
}

function reset() {
  filters.id = ''
  filters.appId = ''
  filters.userId = ''
  filters.messageType = undefined
  filters.message = ''
  query.pageNum = 1
  query.pageSize = 10
  query.sortField = 'createTime'
  query.sortOrder = 'descend'
  void loadChatHistory()
}

function changePage(page: number, pageSize: number) {
  const sizeChanged = pageSize !== query.pageSize
  query.pageSize = pageSize
  query.pageNum = sizeChanged ? 1 : page
  void loadChatHistory()
}

function handleTableChange(_: unknown, __: unknown, sorter: unknown) {
  const nextSorter = Array.isArray(sorter) ? sorter[0] : (sorter as { field?: string; order?: string })
  if (nextSorter?.field && sortableFields.includes(nextSorter.field as (typeof sortableFields)[number])) {
    query.sortField = nextSorter.field as ChatHistoryQueryInput['sortField']
    query.sortOrder = nextSorter.order === 'ascend' ? 'ascend' : 'descend'
    query.pageNum = 1
    void loadChatHistory()
  }
}

onMounted(() => void loadChatHistory())

onBeforeUnmount(() => {
  loadSeq += 1
})
</script>

<style scoped>
.management-page { display: grid; gap: var(--space-6); }
.page-header { display: flex; align-items: end; justify-content: space-between; gap: var(--space-6); padding-bottom: var(--space-5); border-bottom: 1px solid var(--color-rule); }
.eyebrow { color: var(--color-accent-strong); font-size: 12px; font-weight: 800; letter-spacing: 0; }
.page-header h1 { margin: var(--space-1) 0; color: var(--color-ink); font-family: var(--font-display); font-size: 28px; }
.page-header p { margin: 0; color: var(--color-muted); }
.filter-bar { align-items: start; padding: var(--space-4); border: 1px solid var(--color-rule); border-radius: var(--radius-md); background: var(--color-panel-raised); }
.filter-bar :deep(.ant-form-item) { margin-bottom: var(--space-3); }
.history-table { overflow: hidden; border: 1px solid var(--color-rule); border-radius: var(--radius-md); background: var(--color-panel); }
.ellipsis { max-width: 340px; margin: 0; }
.pagination-bar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); color: var(--color-muted); }
@media (max-width: 720px) { .page-header, .pagination-bar { align-items: flex-start; flex-direction: column; } }
</style>
