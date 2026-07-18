import type { UserQueryInput, UserQueryRequest, UserUpdateRequest, UserVO } from '@/types/user'

const PAGE_SIZES = [10, 20, 50, 100] as const

const SORT_FIELDS = ['id', 'userAccount', 'userName', 'userRole', 'createTime'] as const

function trimValue(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized || undefined
}

function quoteCsvValue(value: string | null): string {
  const text = value ?? ''
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function normalizeUserQuery(input: UserQueryInput): UserQueryRequest {
  const candidateSortField = input.sortField
  const sortField = candidateSortField && SORT_FIELDS.includes(candidateSortField)
    ? candidateSortField
    : 'createTime'
  const candidatePageSize = input.pageSize
  const pageSize = candidatePageSize && PAGE_SIZES.some((size) => size === candidatePageSize) ? candidatePageSize : 10

  return {
    pageNum: Math.max(1, input.pageNum || 1),
    pageSize,
    sortField,
    sortOrder: input.sortOrder === 'ascend' ? 'ascend' : 'descend',
    ...(trimValue(input.id) ? { id: trimValue(input.id) } : {}),
    ...(trimValue(input.userAccount) ? { userAccount: trimValue(input.userAccount) } : {}),
    ...(trimValue(input.userName) ? { userName: trimValue(input.userName) } : {}),
    ...(trimValue(input.userProfile) ? { userProfile: trimValue(input.userProfile) } : {}),
    ...(input.userRole ? { userRole: input.userRole } : {}),
  }
}

export function buildUserUpdateRequest(
  id: string,
  values: Pick<UserUpdateRequest, 'userName' | 'userAvatar' | 'userProfile' | 'userRole'> & {
    userAccount?: string
  },
): UserUpdateRequest {
  return {
    id,
    userName: values.userName,
    userAvatar: values.userAvatar,
    userProfile: values.userProfile,
    userRole: values.userRole,
  }
}

export function buildUserCsv(users: UserVO[]): string {
  const header = ['用户 ID', '账号', '昵称', '头像地址', '个人简介', '角色', '创建时间']
  const rows = users.map((user) =>
    [
      user.id,
      user.userAccount,
      user.userName,
      user.userAvatar,
      user.userProfile,
      user.userRole,
      user.createTime,
    ]
      .map(quoteCsvValue)
      .join(','),
  )

  return `\uFEFF${[header.join(','), ...rows].join('\n')}`
}

export function isUserId(value: string): boolean {
  return /^\d+$/.test(value)
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function validateAccount(userAccount: string): string | undefined {
  if (!/^[A-Za-z0-9_]{4,32}$/.test(userAccount)) {
    return '账号需为 4-32 位字母、数字或下划线'
  }
}

function validatePassword(userPassword: string): string | undefined {
  if (userPassword.length < 8 || userPassword.length > 64) {
    return '密码长度需为 8-64 位'
  }
}

export function validateRegistration(input: {
  userAccount: string
  userPassword: string
  checkPassword: string
}): Record<string, string> {
  const errors: Record<string, string> = {}
  const accountError = validateAccount(input.userAccount.trim())
  const passwordError = validatePassword(input.userPassword)

  if (accountError) errors.userAccount = accountError
  if (passwordError) errors.userPassword = passwordError
  if (input.userPassword !== input.checkPassword) errors.checkPassword = '两次输入的密码不一致'

  return errors
}

export function validateLogin(input: { userAccount: string; userPassword: string }): Record<string, string> {
  const errors: Record<string, string> = {}
  const accountError = validateAccount(input.userAccount.trim())
  const passwordError = validatePassword(input.userPassword)

  if (accountError) errors.userAccount = accountError
  if (passwordError) errors.userPassword = passwordError

  return errors
}

export function validateManagedUser(input: {
  userAccount?: string
  userName: string
  userAvatar?: string
  userProfile?: string
  userRole: string
}): Record<string, string> {
  const errors: Record<string, string> = {}
  const userName = input.userName.trim()
  const avatar = input.userAvatar?.trim()
  const profile = input.userProfile?.trim()

  if (input.userAccount !== undefined) {
    const accountError = validateAccount(input.userAccount.trim())
    if (accountError) errors.userAccount = accountError
  }
  if (!userName || userName.length > 32) errors.userName = '昵称长度需为 1-32 个字符'
  if (avatar && (avatar.length > 512 || !isHttpUrl(avatar))) errors.userAvatar = '请输入有效的 HTTP(S) 头像地址'
  if (profile && profile.length > 500) errors.userProfile = '个人简介不能超过 500 个字符'
  if (input.userRole !== 'user' && input.userRole !== 'admin') errors.userRole = '请选择有效角色'

  return errors
}
