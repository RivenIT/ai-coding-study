import axios, { type AxiosRequestConfig } from 'axios'
import JSONBig from 'json-bigint'
import type { BaseResponse } from '@/types/user'

const FALLBACK_API_BASE_URL = 'http://localhost:8081/api'

interface LocationLike {
  protocol: string
  hostname: string
}

export function getDefaultApiBaseUrl(location?: LocationLike): string {
  const browserLocation =
    location ?? (typeof window === 'undefined' ? undefined : window.location)
  const hostname = browserLocation?.hostname

  if (!hostname) {
    return FALLBACK_API_BASE_URL
  }

  const protocol = browserLocation.protocol === 'https:' ? 'https:' : 'http:'
  const formattedHostname = hostname.includes(':') ? `[${hostname}]` : hostname

  return `${protocol}//${formattedHostname}:8081/api`
}

const DEFAULT_API_BASE_URL = getDefaultApiBaseUrl()

export function normalizeApiBaseUrl(value: string | undefined, origin?: string): string {
  const candidate = value?.trim().replace(/\/+$/, '')
  if (!candidate) return DEFAULT_API_BASE_URL

  const resolvedOrigin =
    origin ?? (typeof window === 'undefined' ? undefined : window.location.origin)
  if (!resolvedOrigin || !candidate.startsWith('/')) return candidate

  try {
    return new URL(candidate, resolvedOrigin).toString().replace(/\/+$/, '')
  } catch {
    return candidate
  }
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

const jsonBig = JSONBig({ storeAsString: true })

export function parseApiResponse(data: unknown): unknown {
  if (typeof data !== 'string' || !data.trim()) {
    return data
  }

  return jsonBig.parse(data)
}

export class ApiError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** 仅会话失效（未登录）应清登录态并跳登录页；禁止访问/无权限不算会话过期。 */
export function isAuthenticationError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.code === 40100
}

const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15_000,
  transformResponse: [parseApiResponse],
})

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await http.request<BaseResponse<T>>(config)
    const body = response.data

    if (body.code !== 0) {
      throw new ApiError(body.code, body.message || '请求失败')
    }

    return body.data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || '网络异常，请稍后重试'
      throw new ApiError(error.response?.status ?? 50000, message)
    }

    throw new ApiError(50000, '系统异常，请稍后重试')
  }
}

export async function requestSuccess(
  config: AxiosRequestConfig,
  fallbackMessage: string,
): Promise<true> {
  const success = await request<boolean>(config)
  return assertMutationSuccess(success, fallbackMessage)
}

export function assertMutationSuccess(success: boolean, fallbackMessage: string): true {
  if (success !== true) throw new Error(fallbackMessage)
  return true
}
