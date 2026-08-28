import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import AppCard from './AppCard.vue'
import { observePreviewVisibility } from './previewVisibility'
import type { AppVO } from '@/types/app'

const generatedApp: AppVO = {
  id: '42',
  appName: '一个个人博客',
  cover: null,
  initPrompt: '创建个人博客',
  codeGenType: 'multi_file',
  deployKey: 'blog-42',
  deployedTime: null,
  priority: 0,
  userId: '7',
  createTime: '2026-07-18T13:31:00',
  updateTime: '2026-07-18T13:31:00',
}

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []

  readonly disconnect = vi.fn()
  readonly observe = vi.fn()

  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    MockIntersectionObserver.instances.push(this)
  }

  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}

function getObserver() {
  const observer = MockIntersectionObserver.instances.at(-1)
  expect(observer).toBeDefined()
  return observer!
}

function renderAppCard() {
  const app = createSSRApp(AppCard, { app: generatedApp })
  app.config.warnHandler = () => undefined

  return renderToString(app)
}

function enableIntersectionObserver() {
  vi.stubGlobal('window', {})
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
}

afterEach(() => {
  MockIntersectionObserver.instances = []
  vi.unstubAllGlobals()
})

describe('AppCard preview', () => {
  it('renders the generated project when the app has no uploaded cover', async () => {
    const html = await renderAppCard()

    // SSR 无 IntersectionObserver：直接挂载 iframe；浏览器端会延迟到进入视口
    expect(html).toContain('class="cover-preview-frame"')
    expect(html).toContain('/static/multi_file_42/')
    expect(html).not.toContain('class="cover-placeholder"')
  })

  it('marks the preview iframe for mounting after the card enters the viewport', () => {
    enableIntersectionObserver()
    let shouldMountIframe = false

    const stopObserving = observePreviewVisibility({} as Element, () => {
      shouldMountIframe = true
    })
    const observer = getObserver()

    expect(stopObserving).toEqual(expect.any(Function))
    expect(observer.options).toEqual({ rootMargin: '240px 0px', threshold: 0.01 })

    observer.trigger(false)
    expect(shouldMountIframe).toBe(false)

    observer.trigger(true)
    expect(shouldMountIframe).toBe(true)
    expect(observer.disconnect).toHaveBeenCalledTimes(1)

    stopObserving?.()
    expect(observer.disconnect).toHaveBeenCalledTimes(1)
  })

  it('disconnects the preview observer when the card unmounts before entering the viewport', () => {
    enableIntersectionObserver()
    const onVisible = vi.fn()
    const stopObserving = observePreviewVisibility({} as Element, onVisible)
    const observer = getObserver()

    stopObserving?.()
    observer.trigger(true)

    expect(observer.disconnect).toHaveBeenCalledTimes(1)
    expect(onVisible).not.toHaveBeenCalled()
  })

  it('renders the preview iframe without allow-same-origin so generated code cannot reuse the session', async () => {
    const html = await renderAppCard()

    expect(html).toMatch(/sandbox="[^"]*allow-scripts[^"]*"/)
    expect(html).not.toContain('allow-same-origin')
  })
})
