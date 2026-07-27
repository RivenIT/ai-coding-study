import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const users = readFileSync(new URL('../views/UserManagementView.vue', import.meta.url), 'utf8')
const apps = readFileSync(new URL('../views/AppManagementView.vue', import.meta.url), 'utf8')
const history = readFileSync(new URL('../views/ChatHistoryManagementView.vue', import.meta.url), 'utf8')
const tokens = readFileSync(new URL('../../tokens.css', import.meta.url), 'utf8')

describe('management view style consistency', () => {
  it('uses shared panel utilities and keeps surface tokens in the design system', () => {
    for (const source of [users, apps, history]) {
      expect(source).toContain('page-header-panel')
      expect(source).toContain('filter-panel')
      expect(source).toContain('table-panel')
    }

    expect(tokens).toContain('.page-header-panel')
    expect(tokens).toContain('.filter-panel')
    expect(tokens).toContain('.table-panel')
    expect(tokens).toContain('var(--color-panel-raised)')
    expect(tokens).toContain('var(--color-rule)')
  })
})
