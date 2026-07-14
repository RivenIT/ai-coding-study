<template>
  <section class="management-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">ADMINISTRATION</span>
        <h1>用户管理</h1>
        <p>检索、维护和导出当前页面的用户信息</p>
      </div>
      <a-space wrap>
        <a-button :disabled="users.length === 0" @click="exportCurrentPage"><template #icon><DownloadOutlined /></template>导出当前页</a-button>
        <a-button type="primary" @click="openCreate"><template #icon><PlusOutlined /></template>新增用户</a-button>
      </a-space>
    </header>

    <a-form class="filter-bar" layout="inline" @finish="search">
      <a-form-item label="账号"><a-input v-model:value="filters.userAccount" allow-clear placeholder="账号关键词" /></a-form-item>
      <a-form-item label="昵称"><a-input v-model:value="filters.userName" allow-clear placeholder="昵称关键词" /></a-form-item>
      <a-form-item label="简介"><a-input v-model:value="filters.userProfile" allow-clear placeholder="简介关键词" /></a-form-item>
      <a-form-item label="角色"><a-select v-model:value="filters.userRole" allow-clear style="width: 120px" :options="roleOptions" placeholder="全部角色" /></a-form-item>
      <a-form-item label="用户 ID" :validate-status="idError ? 'error' : undefined" :help="idError"><a-input v-model:value="filters.id" allow-clear placeholder="精确 ID" /></a-form-item>
      <a-form-item><a-space><a-button type="primary" html-type="submit"><template #icon><SearchOutlined /></template>查询</a-button><a-button @click="reset"><template #icon><ReloadOutlined /></template>重置</a-button></a-space></a-form-item>
    </a-form>

    <a-table
      class="user-table"
      :columns="columns"
      :data-source="users"
      :loading="loading"
      :pagination="false"
      :row-key="(user: UserVO) => user.id"
      :scroll="{ x: 1120 }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'avatar'">
          <a-avatar :src="record.userAvatar || undefined"><template #icon><UserOutlined /></template></a-avatar>
        </template>
        <template v-else-if="column.key === 'profile'">
          <a-typography-paragraph class="ellipsis" :ellipsis="{ tooltip: record.userProfile || '-' }">{{ record.userProfile || '-' }}</a-typography-paragraph>
        </template>
        <template v-else-if="column.key === 'role'">
          <a-tag :color="record.userRole === 'admin' ? 'orange' : 'blue'">{{ record.userRole === 'admin' ? '管理员' : '普通用户' }}</a-tag>
        </template>
        <template v-else-if="column.key === 'createTime'">{{ formatDate(record.createTime) }}</template>
        <template v-else-if="column.key === 'actions'">
          <a-space size="small">
            <a-button type="link" size="small" @click="openDetail(record)">查看</a-button>
            <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
            <a-button danger type="link" size="small" @click="confirmDelete(record)">删除</a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <div class="pagination-bar">
      <span>共 {{ total }} 条</span>
      <a-pagination :current="query.pageNum" :page-size="query.pageSize" :total="total" :page-size-options="['10', '20', '50', '100']" show-size-changer show-quick-jumper @change="changePage" @show-size-change="changePageSize" />
    </div>

    <UserFormModal v-model:open="formOpen" :user="editingUser" @success="handleFormSuccess" />
    <UserDetailDrawer v-model:open="detailOpen" :user="selectedUser" @edit="editFromDetail" />
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { DownloadOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons-vue'
import { Modal, message } from 'ant-design-vue'
import UserDetailDrawer from '@/components/user/UserDetailDrawer.vue'
import UserFormModal from '@/components/user/UserFormModal.vue'
import { deleteUser, listUsers } from '@/services/user'
import type { UserQueryInput, UserRole, UserVO } from '@/types/user'
import { buildUserCsv, isUserId, normalizeUserQuery } from '@/utils/user'

const users = ref<UserVO[]>([])
const total = ref(0)
const loading = ref(false)
const idError = ref('')
const formOpen = ref(false)
const detailOpen = ref(false)
const editingUser = ref<UserVO | null>(null)
const selectedUser = ref<UserVO | null>(null)
const filters = reactive<{ id: string; userAccount: string; userName: string; userProfile: string; userRole?: UserRole }>({ id: '', userAccount: '', userName: '', userProfile: '', userRole: undefined })
const query = reactive<UserQueryInput>({ pageNum: 1, pageSize: 10, sortField: 'createTime', sortOrder: 'descend' })
const roleOptions = [{ label: '普通用户', value: 'user' }, { label: '管理员', value: 'admin' }]
const sortableFields = ['id', 'userAccount', 'userName', 'userRole', 'createTime'] as const
const columns = [
  { title: '用户 ID', dataIndex: 'id', key: 'id', width: 170, sorter: true },
  { title: '账号', dataIndex: 'userAccount', key: 'userAccount', width: 160, sorter: true, ellipsis: true },
  { title: '昵称', dataIndex: 'userName', key: 'userName', width: 130, sorter: true, ellipsis: true },
  { title: '头像', key: 'avatar', width: 80 },
  { title: '简介', key: 'profile', width: 220 },
  { title: '角色', key: 'role', dataIndex: 'userRole', width: 110, sorter: true },
  { title: '创建时间', key: 'createTime', dataIndex: 'createTime', width: 180, sorter: true },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 160 },
]

function formatDate(value: string | null): string {
  return value ? value.replace('T', ' ') : '-'
}

function getRequestQuery() {
  return normalizeUserQuery({ ...query, ...filters })
}

async function loadUsers() {
  if (filters.id && !isUserId(filters.id.trim())) {
    idError.value = '用户 ID 必须是数字'
    return
  }
  idError.value = ''
  loading.value = true
  try {
    const page = await listUsers(getRequestQuery())
    users.value = page.records
    total.value = page.totalRow
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载用户列表失败')
  } finally {
    loading.value = false
  }
}

function search() {
  query.pageNum = 1
  void loadUsers()
}

function reset() {
  filters.id = ''
  filters.userAccount = ''
  filters.userName = ''
  filters.userProfile = ''
  filters.userRole = undefined
  query.pageNum = 1
  query.pageSize = 10
  query.sortField = 'createTime'
  query.sortOrder = 'descend'
  void loadUsers()
}

function changePage(page: number) {
  query.pageNum = page
  void loadUsers()
}

function changePageSize(_: number, pageSize: number) {
  query.pageNum = 1
  query.pageSize = pageSize
  void loadUsers()
}

function handleTableChange(_: unknown, __: unknown, sorter: unknown) {
  const nextSorter = Array.isArray(sorter) ? sorter[0] : sorter as { field?: string; order?: string }
  if (nextSorter?.field && sortableFields.includes(nextSorter.field as (typeof sortableFields)[number])) {
    query.sortField = nextSorter.field as UserQueryInput['sortField']
    query.sortOrder = nextSorter.order === 'ascend' ? 'ascend' : 'descend'
    query.pageNum = 1
    void loadUsers()
  }
}

function openCreate() {
  editingUser.value = null
  formOpen.value = true
}

function openEdit(user: UserVO) {
  editingUser.value = user
  detailOpen.value = false
  formOpen.value = true
}

function openDetail(user: UserVO) {
  selectedUser.value = user
  detailOpen.value = true
}

function editFromDetail() {
  if (selectedUser.value) openEdit(selectedUser.value)
}

function handleFormSuccess() {
  query.pageNum = 1
  void loadUsers()
}

function confirmDelete(user: UserVO) {
  Modal.confirm({
    title: '确认删除用户？',
    content: `将删除用户“${user.userName || user.userAccount}”，该操作不可撤销。`,
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: async () => {
      await deleteUser(user.id)
      if (users.value.length === 1 && query.pageNum && query.pageNum > 1) query.pageNum -= 1
      message.success('删除成功')
      await loadUsers()
    },
  })
}

function exportCurrentPage() {
  const blob = new Blob([buildUserCsv(users.value)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `users-${new Date().toISOString().slice(0, 19).replaceAll(':', '-')}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

onMounted(() => void loadUsers())
</script>

<style scoped>
.management-page { display: grid; gap: 20px; }
.page-header { display: flex; align-items: end; justify-content: space-between; gap: 24px; }
.eyebrow { color: #1677ff; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; }
.page-header h1 { color: #1e293b; font-size: 28px; margin: 4px 0; }
.page-header p { color: #64748b; margin: 0; }
.filter-bar { align-items: start; background: #fff; border: 1px solid #e2e8f0; padding: 16px; }
.filter-bar :deep(.ant-form-item) { margin-bottom: 12px; }
.user-table { overflow: hidden; background: #fff; border: 1px solid #e2e8f0; }
.ellipsis { margin: 0; max-width: 200px; }
.pagination-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; color: #64748b; }
@media (max-width: 720px) { .page-header, .pagination-bar { align-items: flex-start; flex-direction: column; } .page-header :deep(.ant-space) { width: 100%; } }
</style>
