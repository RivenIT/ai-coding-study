import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const userFormModal = readFileSync(new URL('../components/user/UserFormModal.vue', import.meta.url), 'utf8')

describe('management dialog copy', () => {
  it('uses Chinese text for the cancel action', () => {
    expect(userFormModal).toContain('cancel-text="取消"')
  })
})
