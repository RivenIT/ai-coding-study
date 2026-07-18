import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const header = readFileSync(new URL('../components/GlobalHeader.vue', import.meta.url), 'utf8')
const layout = readFileSync(new URL('../layouts/BasicLayout.vue', import.meta.url), 'utf8')

describe('shared chrome styling', () => {
  it('uses the shared neutral shell tokens instead of local blue gradients', () => {
    expect(header).toContain('var(--color-panel-raised)')
    expect(header).not.toContain('linear-gradient(135deg, #1890ff')
    expect(layout).toContain('var(--color-paper-soft)')
  })

  it('allows the navigation and action groups to shrink on narrow screens', () => {
    expect(header).toMatch(/\.header-menu\s*\{[^}]*min-width:\s*0;/s)
    expect(header).toMatch(/\.header-right\s*\{[^}]*min-width:\s*0;/s)
    expect(layout).toMatch(/\.layout-content\s*\{[^}]*min-width:\s*0;/s)
    expect(layout).toMatch(/\.content-wrapper\s*\{[^}]*min-width:\s*0;/s)
  })
})
