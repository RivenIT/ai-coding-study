import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const login = readFileSync(new URL('../views/LoginView.vue', import.meta.url), 'utf8')
const register = readFileSync(new URL('../views/RegisterView.vue', import.meta.url), 'utf8')

describe('auth visual consistency', () => {
  it('uses the shared raised surface in both authentication pages', () => {
    expect(login).toContain('var(--color-panel-raised)')
    expect(register).toContain('var(--color-panel-raised)')
    expect(login).not.toContain('border-radius: 24px')
  })
})
