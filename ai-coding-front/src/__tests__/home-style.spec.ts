import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const home = readFileSync(new URL('../views/HomeView.vue', import.meta.url), 'utf8')

describe('homepage visual hierarchy', () => {
  it('keeps both application collections inside a dedicated work gallery', () => {
    expect(home).toContain('work-gallery')
    expect(home).toContain('var(--color-field-cyan)')
    expect(home).toContain('var(--color-field-blue)')
  })

  it('keeps the full-bleed homepage inside the viewport on narrow screens', () => {
    expect(home).toMatch(/\.home-view\s*\{[^}]*max-width:\s*100%;/s)
    expect(home).toContain('grid-template-columns: minmax(0, 1fr)')
  })

  it('handles delete request failures from the confirmation callback', () => {
    expect(home).toMatch(/onOk:\s*async \(\) => \{\s*try \{/s)
    expect(home).toContain("handleError(error, '删除应用失败')")
  })
})
