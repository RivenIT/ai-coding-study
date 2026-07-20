import { request, requestSuccess } from '@/services/http'
import type {
  AppAddRequest,
  AppAdminUpdateRequest,
  AppDeployRequest,
  AppPageResult,
  AppQueryRequest,
  AppUpdateRequest,
  AppVO,
} from '@/types/app'
import type { UserVO } from '@/types/user'

type NumericId = string | number
type UserWithNumericId = Omit<UserVO, 'id'> & { id: NumericId }
type AppWithNumericIds = Omit<AppVO, 'id' | 'userId' | 'priority' | 'user'> & {
  id: NumericId
  userId: NumericId
  priority?: number | null
  user?: UserWithNumericId
}

function normalizeUser(user: UserWithNumericId): UserVO {
  return { ...user, id: String(user.id) }
}

function normalizeApp(app: AppWithNumericIds): AppVO {
  return {
    ...app,
    id: String(app.id),
    userId: String(app.userId),
    priority: Number(app.priority ?? 0),
    user: app.user ? normalizeUser(app.user) : undefined,
  }
}

function normalizeAppPage(page: AppPageResult | { records: AppWithNumericIds[]; totalRow: number | string }): AppPageResult {
  return {
    ...page,
    records: page.records.map((app) => normalizeApp(app)),
    totalRow: Number(page.totalRow),
  }
}

export async function addApp(requestData: AppAddRequest): Promise<string> {
  const id = await request<NumericId>({ method: 'POST', url: '/app/add', data: requestData })
  return String(id)
}

export async function getApp(id: string): Promise<AppVO> {
  const app = await request<AppWithNumericIds>({
    method: 'GET',
    url: '/app/get/vo',
    params: { id },
  })
  return normalizeApp(app)
}

export async function getAppByAdmin(id: string): Promise<AppVO> {
  const app = await request<AppWithNumericIds>({
    method: 'GET',
    url: '/app/admin/get/vo',
    params: { id },
  })
  return normalizeApp(app)
}

export function updateApp(requestData: AppUpdateRequest): Promise<true> {
  return requestSuccess({ method: 'POST', url: '/app/update', data: requestData }, '保存应用失败')
}

export function updateAppByAdmin(requestData: AppAdminUpdateRequest): Promise<true> {
  return requestSuccess({ method: 'POST', url: '/app/admin/update', data: requestData }, '保存应用失败')
}

export function deleteApp(id: string): Promise<true> {
  return requestSuccess({ method: 'POST', url: '/app/delete', data: { id } }, '删除应用失败')
}

export function deleteAppByAdmin(id: string): Promise<true> {
  return requestSuccess({ method: 'POST', url: '/app/admin/delete', data: { id } }, '删除应用失败')
}

export async function deployApp(appId: string): Promise<string> {
  return request<string>({
    method: 'POST',
    url: '/app/deploy',
    data: { appId } satisfies AppDeployRequest,
  })
}

export async function listMyApps(query: AppQueryRequest): Promise<AppPageResult> {
  const page = await request<{ records: AppWithNumericIds[]; totalRow: number | string }>({
    method: 'POST',
    url: '/app/my/list/page/vo',
    data: query,
  })
  return normalizeAppPage(page)
}

export async function listGoodApps(query: AppQueryRequest): Promise<AppPageResult> {
  const page = await request<{ records: AppWithNumericIds[]; totalRow: number | string }>({
    method: 'POST',
    url: '/app/good/list/page/vo',
    data: query,
  })
  return normalizeAppPage(page)
}

export async function listAppsByAdmin(query: AppQueryRequest): Promise<AppPageResult> {
  const page = await request<{ records: AppWithNumericIds[]; totalRow: number | string }>({
    method: 'POST',
    url: '/app/admin/list/page/vo',
    data: query,
  })
  return normalizeAppPage(page)
}
