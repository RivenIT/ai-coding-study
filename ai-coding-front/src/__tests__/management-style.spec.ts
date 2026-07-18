import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const users = readFileSync(new URL('../views/UserManagementView.vue', import.meta.url), 'utf8')
const apps = readFileSync(new URL('../views/AppManagementView.vue', import.meta.url), 'utf8')

describe('management view style consistency', () => {
  it('uses the shared panel and rule tokens in both management filters', () => {
    expect(users).toContain('var(--color-panel-raised)')
    expect(users).toContain('var(--color-rule)')
    expect(apps).toContain('var(--color-panel-raised)')
    expect(apps).toContain('var(--color-rule)')
  })
})
