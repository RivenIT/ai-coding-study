import { API_BASE_URL } from '@/services/http'
import type { AppId } from '@/types/app'

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
  return url.toString()
}

export function connectAppGeneration(options: AppGenerationOptions): AppGenerationConnection {
  const factory =
    options.factory ??
    ((url: string, init: EventSourceInit) => new EventSource(url, init) as EventSourceLike)
  const source = factory(buildGenerationUrl(options.appId, options.message), { withCredentials: true })
  let closed = false
  let settled = false

  const close = () => {
    if (closed) return
    closed = true
    source.close()
  }

  const settleError = (error: Error) => {
    if (settled || closed) return
    settled = true
    options.onError(error)
    close()
  }

  const settleDone = () => {
    if (settled || closed) return
    settled = true
    options.onDone()
    close()
  }

  source.onmessage = (event: MessageEvent) => {
    if (closed || settled) return
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
    const data = 'data' in event ? String((event as MessageEvent).data ?? '') : ''
    settleError(parseGenerationBusinessError(data))
  })

  source.addEventListener('done', () => {
    settleDone()
  })

  return { close }
}
