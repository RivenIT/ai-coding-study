import { request, requestSuccess } from '@/services/http'
import type {
  LoginUserVO,
  PageResult,
  UserAddRequest,
  UserLoginRequest,
  UserQueryRequest,
  UserRegisterRequest,
  UserUpdateRequest,
  UserVO,
} from '@/types/user'

type UserWithNumericId<T> = Omit<T, 'id'> & { id: string | number }

function normalizeUser<T extends LoginUserVO | UserVO>(user: UserWithNumericId<T>): T {
  return { ...user, id: String(user.id) } as T
}

export async function registerUser(requestData: UserRegisterRequest): Promise<string> {
  const id = await request<string | number>({
    method: 'POST',
    url: '/user/register',
    data: requestData,
  })
  return String(id)
}

export async function login(requestData: UserLoginRequest): Promise<LoginUserVO> {
  const user = await request<UserWithNumericId<LoginUserVO>>({
    method: 'POST',
    url: '/user/login',
    data: requestData,
  })
  return normalizeUser<LoginUserVO>(user)
}

export async function getLoginUser(): Promise<LoginUserVO> {
  const user = await request<UserWithNumericId<LoginUserVO>>({
    method: 'GET',
    url: '/user/get/login',
  })
  return normalizeUser<LoginUserVO>(user)
}

export function logout(): Promise<true> {
  return requestSuccess({ method: 'POST', url: '/user/logout' }, '退出登录失败')
}

export async function addUser(requestData: UserAddRequest): Promise<string> {
  const id = await request<string | number>({ method: 'POST', url: '/user/add', data: requestData })
  return String(id)
}

export function updateUser(requestData: UserUpdateRequest): Promise<true> {
  return requestSuccess({ method: 'POST', url: '/user/update', data: requestData }, '更新用户失败')
}

export function deleteUser(id: string): Promise<true> {
  return requestSuccess({ method: 'POST', url: '/user/delete', data: { id } }, '删除用户失败')
}

export async function listUsers(query: UserQueryRequest): Promise<PageResult<UserVO>> {
  const page = await request<PageResult<UserWithNumericId<UserVO>>>({
    method: 'POST',
    url: '/user/list/page/vo',
    data: query,
  })

  return {
    ...page,
    records: page.records.map((user) => normalizeUser<UserVO>(user)),
    totalRow: Number(page.totalRow),
  }
}
