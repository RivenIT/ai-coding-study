<template>
  <section class="management-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">ADMINISTRATION</span>
        <h1>应用管理</h1>
        <p>检索、维护和精选站内应用</p>
      </div>
    </header>

    <a-form class="filter-bar" layout="inline" @finish="search">
      <a-form-item label="应用 ID" :validate-status="idError ? 'error' : undefined" :help="idError">
        <a-input v-model:value="filters.id" allow-clear placeholder="精确 ID" />
      </a-form-item>
      <a-form-item label="名称">
        <a-input v-model:value="filters.appName" allow-clear placeholder="名称关键词" />
      </a-form-item>
      <a-form-item label="封面">
        <a-input v-model:value="filters.cover" allow-clear placeholder="封面关键词" />
      </a-form-item>
      <a-form-item label="提示词">
        <a-input v-model:value="filters.initPrompt" allow-clear placeholder="提示词关键词" />
      </a-form-item>
      <a-form-item label="生成类型">
        <a-select
          v-model:value="filters.codeGenType"
          allow-clear
          style="width: 150px"
          :options="codeTypeOptions"
          placeholder="全部类型"
        />
      </a-form-item>
      <a-form-item label="部署标识">
        <a-input v-model:value="filters.deployKey" allow-clear placeholder="部署标识" />
      </a-form-item>
      <a-form-item label="优先级">
        <a-input-number v-model:value="filters.priority" :min="0" :precision="0" style="width: 120px" />
      </a-form-item>
      <a-form-item label="用户 ID" :validate-status="userIdError ? 'error' : undefined" :help="userIdError">
        <a-input v-model:value="filters.userId" allow-clear placeholder="创建者 ID" />
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
      class="app-table"
      :columns="columns"
      :data-source="apps"
      :loading="loading"
      :pagination="false"
      :row-key="(record: AppVO) => record.id"
      :scroll="{ x: 1320 }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'cover'">
          <img v-if="record.cover && isHttpUrl(record.cover)" class="cover-thumb" :src="record.cover" :alt="record.appName || '应用封面'" />
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'appName'">
          <a-typography-paragraph class="ellipsis" :ellipsis="{ tooltip: record.appName || '-' }" :content="record.appName || '-'" />
        </template>
        <template v-else-if="column.key === 'owner'">
          {{ record.user?.userName || record.user?.userAccount || record.userId }}
        </template>
        <template v-else-if="column.key === 'priority'">
          <a-tag :color="record.priority >= 99 ? 'gold' : 'blue'">{{ record.priority }}</a-tag>
        </template>
        <template v-else-if="column.key === 'deploy'">
          <a-tag :color="record.deployKey ? 'green' : 'default'">{{ record.deployKey ? '已部署' : '未部署' }}</a-tag>
        </template>
        <template v-else-if="column.key === 'createTime'">{{ formatDate(record.createTime) }}</template>
        <template v-else-if="column.key === 'actions'">
          <a-space size="small">
            <a-button type="link" size="small" @click="openDetail(record)">查看</a-button>
            <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
            <a-button type="link" size="small" @click="markGood(record)">精选</a-button>
            <a-button danger type="link" size="small" @click="confirmDelete(record)">删除</a-button>
          </a-space>
        </template>
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

    <AppDetailDrawer v-model:open="detailOpen" :app="selectedApp" @edit="editFromDetail" />
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue'
import { Modal, message } from 'ant-design-vue'
import AppDetailDrawer from '@/components/app/AppDetailDrawer.vue'
import { deleteAppByAdmin, listAppsByAdmin, updateAppByAdmin } from '@/services/app'
import type { AppQueryInput, AppVO } from '@/types/app'
import { isHttpUrl, isNumericId, normalizeAdminAppQuery } from '@/utils/app'

const router = useRouter()
const route = useRoute()
const apps = ref<AppVO[]>([])
const total = ref(0)
const loading = ref(false)
const detailOpen = ref(false)
const selectedApp = ref<AppVO | null>(null)
const idError = ref('')
const userIdError = ref('')
let loadSeq = 0
const query = reactive<AppQueryInput>({ pageNum: 1, pageSize: 10, sortField: 'createTime', sortOrder: 'descend' })
const filters = reactive<{
  id: string
  appName: string
  cover: string
  initPrompt: string
  codeGenType?: string
  deployKey: string
  priority?: number
  userId: string
}>({
  id: '',
  appName: '',
  cover: '',
  initPrompt: '',
  codeGenType: undefined,
  deployKey: '',
  priority: undefined,
  userId: '',
})
const codeTypeOptions = [
  { label: 'HTML', value: 'html' },
  { label: '多文件', value: 'multi_file' },
]
const sortableFields = ['id', 'appName', 'priority', 'createTime', 'updateTime'] as const
const columns = [
  { title: '应用 ID', dataIndex: 'id', key: 'id', width: 160, sorter: true },
  { title: '封面', key: 'cover', width: 110 },
  { title: '名称', dataIndex: 'appName', key: 'appName', width: 190, sorter: true },
  { title: '生成类型', dataIndex: 'codeGenType', key: 'codeGenType', width: 120 },
  { title: '创建者', key: 'owner', width: 160 },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 100, sorter: true },
  { title: '部署', key: 'deploy', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180, sorter: true },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 210 },
]

function formatDate(value: string | null): string {
  return value ? value.replace('T', ' ').slice(0, 19) : '-'
}

function validateIds(): boolean {
  idError.value = filters.id.trim() && !isNumericId(filters.id.trim()) ? '应用 ID 必须是数字' : ''
  userIdError.value = filters.userId.trim() && !isNumericId(filters.userId.trim()) ? '用户 ID 必须是数字' : ''
  return !idError.value && !userIdError.value
}

function getRequestQuery() {
  return normalizeAdminAppQuery({ ...query, ...filters })
}

async function loadApps() {
  if (!validateIds()) return
  const requestId = ++loadSeq
  loading.value = true
  try {
    const page = await listAppsByAdmin(getRequestQuery())
    if (requestId !== loadSeq) return
    apps.value = page.records
    total.value = page.totalRow
  } catch (error) {
    if (requestId !== loadSeq) return
    message.error(error instanceof Error ? error.message : '加载应用列表失败')
  } finally {
    if (requestId === loadSeq) loading.value = false
  }
}

function search() {
  query.pageNum = 1
  void loadApps()
}

function reset() {
  filters.id = ''
  filters.appName = ''
  filters.cover = ''
  filters.initPrompt = ''
  filters.codeGenType = undefined
  filters.deployKey = ''
  filters.priority = undefined
  filters.userId = ''
  query.pageNum = 1
  query.pageSize = 10
  query.sortField = 'createTime'
  query.sortOrder = 'descend'
  void loadApps()
}

function changePage(page: number, pageSize: number) {
  const sizeChanged = pageSize !== query.pageSize
  query.pageSize = pageSize
  query.pageNum = sizeChanged ? 1 : page
  void loadApps()
}

function handleTableChange(_: unknown, __: unknown, sorter: unknown) {
  const nextSorter = Array.isArray(sorter)
    ? sorter[0]
    : (sorter as { field?: string; order?: string })
  if (nextSorter?.field && sortableFields.includes(nextSorter.field as (typeof sortableFields)[number])) {
    query.sortField = nextSorter.field as AppQueryInput['sortField']
    query.sortOrder = nextSorter.order === 'ascend' ? 'ascend' : 'descend'
    query.pageNum = 1
    void loadApps()
  }
}

function openDetail(record: AppVO) {
  selectedApp.value = record
  detailOpen.value = true
}

function openEdit(record: AppVO) {
  void router.push({ name: 'app-edit', params: { id: record.id }, query: { from: route.fullPath } })
}

function editFromDetail(app: AppVO) {
  detailOpen.value = false
  openEdit(app)
}

function markGood(record: AppVO) {
  updateAppByAdmin({ id: record.id, priority: 99 })
    .then(async () => {
      message.success('已设为精选')
      await loadApps()
    })
    .catch((error: unknown) => {
      message.error(error instanceof Error ? error.message : '设置精选失败')
    })
}

function confirmDelete(record: AppVO) {
  Modal.confirm({
    title: '确认删除应用？',
    content: `将删除“${record.appName || '未命名应用'}”，该操作不可撤销。`,
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: async () => {
      try {
        await deleteAppByAdmin(record.id)
        if (apps.value.length === 1 && query.pageNum && query.pageNum > 1) query.pageNum -= 1
        message.success('删除成功')
        await loadApps()
      } catch (error) {
        message.error(error instanceof Error ? error.message : '删除应用失败')
        throw error
      }
    },
  })
}

onMounted(() => void loadApps())
</script>

<style scoped>
.management-page {
  display: grid;
  gap: var(--space-6);
}

.page-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-6);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-rule);
}

.eyebrow {
  color: var(--color-accent-strong);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.page-header h1 {
  margin: var(--space-1) 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 28px;
}

.page-header p {
  margin: 0;
  color: var(--color-muted);
}

.filter-bar {
  align-items: start;
  padding: var(--space-4);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-md);
  background: var(--color-panel-raised);
}

.filter-bar :deep(.ant-form-item) {
  margin-bottom: var(--space-3);
}

.app-table {
  overflow: hidden;
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-md);
  background: var(--color-panel);
}

.cover-thumb {
  width: 72px;
  height: 44px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-rule);
}

.ellipsis {
  max-width: 160px;
  margin: 0;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  color: var(--color-muted);
}

@media (max-width: 720px) {
  .page-header,
  .pagination-bar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
