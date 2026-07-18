import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const users = readFileSync(new URL('../views/UserManagementView.vue', import.meta.url), 'utf8')
const apps = readFileSync(new URL('../views/AppManagementView.vue', import.meta.url), 'utf8')

describe('management table ellipsis', () => {
  it('passes truncated cell text through the Typography content property', () => {
    expect(users).toContain(':content="record.userProfile || \'-\'"')
    expect(apps).toContain(':content="record.appName || \'-\'"')
  })
})
