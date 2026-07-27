const previewObserverOptions: IntersectionObserverInit = {
  rootMargin: '240px 0px',
  threshold: 0.01,
}

export function canObservePreviewVisibility(): boolean {
  return typeof window !== 'undefined' && typeof IntersectionObserver !== 'undefined'
}

export function observePreviewVisibility(
  element: Element | null,
  onVisible: () => void,
): (() => void) | null {
  if (!element || !canObservePreviewVisibility()) return null

  let observing = true
  let observer: IntersectionObserver | null = null

  const disconnect = () => {
    if (!observing) return
    observing = false
    observer?.disconnect()
    observer = null
  }

  observer = new IntersectionObserver((entries) => {
    if (!observing || !entries.some((entry) => entry.isIntersecting)) return

    disconnect()
    onVisible()
  }, previewObserverOptions)
  observer.observe(element)

  return disconnect
}
