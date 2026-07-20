import { describe, expect, it, vi } from 'vitest'
import { connectAppGeneration, parseGenerationBusinessError } from '@/services/appSse'

type Listener = (event: Event) => void

function createMockSource() {
  const listeners = new Map<string, Listener[]>()
  const source = {
    addEventListener: (type: string, listener: Listener) => {
      const bucket = listeners.get(type) ?? []
      bucket.push(listener)
      listeners.set(type, bucket)
    },
    close: vi.fn(),
    onmessage: null as ((event: MessageEvent) => void) | null,
    onerror: null as ((event: Event) => void) | null,
    emit(type: string, data = '') {
      if (type === 'message') {
        source.onmessage?.({ data } as MessageEvent)
        return
      }
      if (type === 'error') {
        source.onerror?.(new Event('error'))
        return
      }
      for (const listener of listeners.get(type) ?? []) {
        listener({ data } as MessageEvent)
      }
    },
  }
  return source
}

describe('connectAppGeneration', () => {
  it('keeps the API context path when building the SSE URL', () => {
    let requestedUrl = ''
    let withCredentials = false

    connectAppGeneration({
      appId: '435753066709344256',
      message: '波普风电商页面',
      onChunk: () => undefined,
      onDone: () => undefined,
      onError: () => undefined,
      factory: (url, init) => {
        requestedUrl = url
        withCredentials = Boolean(init.withCredentials)
        return createMockSource()
      },
    })

    const url = new URL(requestedUrl)
    expect(url.pathname).toBe('/api/app/chat/gen/code')
    expect(url.searchParams.get('appId')).toBe('435753066709344256')
    expect(url.searchParams.get('message')).toBe('波普风电商页面')
    expect(withCredentials).toBe(true)
  })

  it('surfaces backend business-error events instead of treating them as success', () => {
    const source = createMockSource()
    const onDone = vi.fn()
    const onError = vi.fn()

    connectAppGeneration({
      appId: '1',
      message: 'hello',
      onChunk: () => undefined,
      onDone,
      onError,
      factory: () => source,
    })

    source.emit('business-error', JSON.stringify({ error: true, code: 40101, message: '无权限访问该应用' }))
    source.emit('done', '{}')

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(onError.mock.calls[0][0].message).toBe('无权限访问该应用')
    expect(onDone).not.toHaveBeenCalled()
    expect(source.close).toHaveBeenCalledTimes(1)
  })

  it('ignores transport errors after the stream has already settled', () => {
    const source = createMockSource()
    const onDone = vi.fn()
    const onError = vi.fn()

    connectAppGeneration({
      appId: '1',
      message: 'hello',
      onChunk: () => undefined,
      onDone,
      onError,
      factory: () => source,
    })

    source.emit('done')
    source.emit('error')

    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onError).not.toHaveBeenCalled()
  })

  it('settles with an error when the stream stays inactive beyond its timeout', () => {
    vi.useFakeTimers()
    try {
      const source = createMockSource()
      const onError = vi.fn()

      connectAppGeneration({
        appId: '1',
        message: 'hello',
        onChunk: () => undefined,
        onDone: () => undefined,
        onError,
        inactivityTimeoutMs: 1_000,
        factory: () => source,
      })

      vi.advanceTimersByTime(1_000)

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError.mock.calls[0][0].message).toContain('AI 生成响应超时')
      expect(source.close).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects prompts whose encoded SSE URL would exceed the transport limit', () => {
    expect(() =>
      connectAppGeneration({
        appId: '1',
        message: '中'.repeat(2_000),
        onChunk: () => undefined,
        onDone: () => undefined,
        onError: () => undefined,
        factory: () => createMockSource(),
      }),
    ).toThrow('提示词编码后过长')
  })

  it('closes the EventSource even when a completion callback throws', () => {
    const source = createMockSource()

    connectAppGeneration({
      appId: '1',
      message: 'hello',
      onChunk: () => undefined,
      onDone: () => {
        throw new Error('render failed')
      },
      onError: () => undefined,
      factory: () => source,
    })

    expect(() => source.emit('done')).toThrow('render failed')
    expect(source.close).toHaveBeenCalledTimes(1)
  })
})

describe('parseGenerationBusinessError', () => {
  it('extracts the backend message when present', () => {
    expect(parseGenerationBusinessError(JSON.stringify({ message: '应用不存在' })).message).toBe(
      '应用不存在',
    )
  })
})
