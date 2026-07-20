import { API_BASE_URL } from '@/services/http'
import type { AppId } from '@/types/app'

const MAX_GENERATION_URL_LENGTH = 7_000
const DEFAULT_INACTIVITY_TIMEOUT_MS = 90_000

type EventSourceLike = {
  addEventListener: (type: string, listener: (event: Event) => void) => void
  close: () => void
  onmessage: ((event: MessageEvent) => void) | null
  onerror: ((event: Event) => void) | null
}

type EventSourceFactory = (url: string, init: EventSourceInit) => EventSourceLike

export interface AppGenerationOptions {
  appId: AppId
  message: string
  onChunk: (chunk: string) => void
  onDone: () => void
  onError: (error: Error) => void
  inactivityTimeoutMs?: number
  factory?: EventSourceFactory
}

export interface AppGenerationConnection {
  close: () => void
}

export function parseGenerationChunk(data: string): string {
  try {
    const parsed = JSON.parse(data) as { d?: unknown }
    return typeof parsed.d === 'string' ? parsed.d : ''
  } catch {
    throw new Error('AI 返回了无法解析的数据')
  }
}

export function parseGenerationBusinessError(data: string): Error {
  try {
    const parsed = JSON.parse(data) as { message?: unknown; code?: unknown }
    const message =
      typeof parsed.message === 'string' && parsed.message.trim()
        ? parsed.message
        : 'AI 生成失败，请稍后重试'
    return new Error(message)
  } catch {
    return new Error('AI 生成失败，请稍后重试')
  }
}

function buildGenerationUrl(appId: AppId, message: string): string {
  const url = new URL('app/chat/gen/code', `${API_BASE_URL}/`)
  url.searchParams.set('appId', appId)
  url.searchParams.set('message', message)
  const value = url.toString()
  if (value.length > MAX_GENERATION_URL_LENGTH) {
    throw new Error('提示词编码后过长，请缩短内容后重试')
  }
  return value
}

export function connectAppGeneration(options: AppGenerationOptions): AppGenerationConnection {
  const factory =
    options.factory ??
    ((url: string, init: EventSourceInit) => new EventSource(url, init) as EventSourceLike)
  const source = factory(buildGenerationUrl(options.appId, options.message), { withCredentials: true })
  let closed = false
  let settled = false
  let inactivityTimer: ReturnType<typeof setTimeout> | undefined

  const clearInactivityTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer)
    inactivityTimer = undefined
  }

  const close = () => {
    if (closed) return
    closed = true
    clearInactivityTimer()
    source.close()
  }

  const settleError = (error: Error) => {
    if (settled || closed) return
    settled = true
    try {
      options.onError(error)
    } finally {
      close()
    }
  }

  const settleDone = () => {
    if (settled || closed) return
    settled = true
    try {
      options.onDone()
    } finally {
      close()
    }
  }

  const resetInactivityTimer = () => {
    clearInactivityTimer()
    const timeout = options.inactivityTimeoutMs ?? DEFAULT_INACTIVITY_TIMEOUT_MS
    if (!Number.isFinite(timeout) || timeout <= 0) return
    inactivityTimer = setTimeout(() => {
      settleError(new Error('AI 生成响应超时，请稍后重试'))
    }, timeout)
  }

  source.onmessage = (event: MessageEvent) => {
    if (closed || settled) return
    resetInactivityTimer()
    try {
      options.onChunk(parseGenerationChunk(String(event.data ?? '')))
    } catch (error) {
      settleError(error instanceof Error ? error : new Error('AI 返回了无法解析的数据'))
    }
  }

  source.onerror = () => {
    settleError(new Error('AI 生成连接异常，请稍后重试'))
  }

  source.addEventListener('business-error', (event) => {
    resetInactivityTimer()
    const data = 'data' in event ? String((event as MessageEvent).data ?? '') : ''
    settleError(parseGenerationBusinessError(data))
  })

  source.addEventListener('done', () => {
    resetInactivityTimer()
    settleDone()
  })

  resetInactivityTimer()

  return { close }
}
