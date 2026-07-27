import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const login = readFileSync(new URL('../views/LoginView.vue', import.meta.url), 'utf8')
const register = readFileSync(new URL('../views/RegisterView.vue', import.meta.url), 'utf8')
const tokens = readFileSync(new URL('../../tokens.css', import.meta.url), 'utf8')

describe('auth visual consistency', () => {
  it('uses the shared auth surface utilities on both authentication pages', () => {
    expect(login).toContain('class="auth-page"')
    expect(login).toContain('class="auth-card"')
    expect(register).toContain('class="auth-page"')
    expect(register).toContain('class="auth-card"')
    expect(login).not.toContain('border-radius: 24px')
    expect(tokens).toContain('.auth-card')
    expect(tokens).toContain('var(--color-panel-raised)')
  })
})
