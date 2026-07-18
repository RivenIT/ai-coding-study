import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const chat = readFileSync(new URL('../views/AppChatView.vue', import.meta.url), 'utf8')
const preview = readFileSync(new URL('../components/app/AppPreviewPanel.vue', import.meta.url), 'utf8')

describe('generation workbench style consistency', () => {
  it('uses the shared raised panel and workbench shadow tokens', () => {
    expect(chat).toContain('var(--shadow-workbench)')
    expect(preview).toContain('var(--color-panel-raised)')
  })

  it('fills the desktop viewport while reserving a row for the mobile switch only on narrow screens', () => {
    expect(chat).toMatch(/\.chat-view\s*\{[^}]*grid-template-rows:\s*72px minmax\(0, 1fr\);/s)
    expect(chat).toMatch(
      /@media \(max-width: 900px\)[\s\S]*?\.chat-view\s*\{[^}]*grid-template-rows:\s*72px auto minmax\(0, 1fr\);/s,
    )
  })
})
