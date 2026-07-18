import { API_BASE_URL } from '@/services/http'
import type { AppQueryInput, AppQueryRequest } from '@/types/app'

const PUBLIC_PAGE_SIZES = [8, 12, 20] as const
const SORT_FIELDS = ['id', 'appName', 'priority', 'createTime', 'updateTime'] as const

function trimValue(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized || undefined
}

function normalizePageNumber(value: number | undefined): number {
  return Number.isFinite(value) && value && value > 0 ? Math.max(1, Math.floor(value)) : 1
}

function normalizeSortField(value: AppQueryInput['sortField']): AppQueryRequest['sortField'] {
  return value && (SORT_FIELDS as readonly string[]).includes(value) ? value : 'createTime'
}

function normalizeFilters(input: AppQueryInput): Partial<AppQueryRequest> {
  const id = trimValue(input.id)
  const userId = trimValue(input.userId)
  const appName = trimValue(input.appName)
  const cover = trimValue(input.cover)
  const initPrompt = trimValue(input.initPrompt)
  const codeGenType = trimValue(input.codeGenType)
  const deployKey = trimValue(input.deployKey)

  return {
    ...(id && isNumericId(id) ? { id } : {}),
    ...(appName ? { appName } : {}),
    ...(cover ? { cover } : {}),
    ...(initPrompt ? { initPrompt } : {}),
    ...(codeGenType ? { codeGenType } : {}),
    ...(deployKey ? { deployKey } : {}),
    ...(Number.isFinite(input.priority) ? { priority: input.priority } : {}),
    ...(userId && isNumericId(userId) ? { userId } : {}),
  }
}

function normalizeQuery(input: AppQueryInput, pageSize: number): AppQueryRequest {
  return {
    pageNum: normalizePageNumber(input.pageNum),
    pageSize,
    sortField: normalizeSortField(input.sortField),
    sortOrder: input.sortOrder === 'ascend' ? 'ascend' : 'descend',
    ...normalizeFilters(input),
  }
}

export function normalizePublicAppQuery(input: AppQueryInput = {}): AppQueryRequest {
  const requestedSize = input.pageSize
  const pageSize = PUBLIC_PAGE_SIZES.find((size) => size === requestedSize) ?? 20

  return normalizeQuery(input, pageSize)
}

export function normalizeAdminAppQuery(input: AppQueryInput = {}): AppQueryRequest {
  const requestedSize = input.pageSize
  const pageSize =
    Number.isFinite(requestedSize) && requestedSize && requestedSize > 0
      ? Math.floor(requestedSize)
      : 10

  return normalizeQuery(input, pageSize)
}

export function buildPreviewUrl(
  baseUrl: string = API_BASE_URL,
  codeGenType = '',
  appId = '',
  cacheKey?: string | number,
): string {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '')
  const normalizedCodeGenType = codeGenType.trim()
  const normalizedAppId = appId.trim()

  if (!isHttpUrl(normalizedBaseUrl) || !normalizedCodeGenType || !normalizedAppId) {
    return ''
  }

  const url = `${normalizedBaseUrl}/static/${encodeURIComponent(normalizedCodeGenType)}_${encodeURIComponent(normalizedAppId)}/`
  if (cacheKey === undefined || cacheKey === null || String(cacheKey) === '') {
    return url
  }

  return `${url}?${new URLSearchParams({ v: String(cacheKey) }).toString()}`
}

export function canEditApp(input: {
  role: 'user' | 'admin'
  userId: string
  ownerId: string
}): boolean {
  return (
    input.role === 'admin' ||
    Boolean(input.userId && input.ownerId && input.userId === input.ownerId)
  )
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isNumericId(value: string): boolean {
  return /^\d+$/.test(value)
}
