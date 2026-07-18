import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function readView(name: string): string {
  return readFileSync(new URL(`../views/${name}`, import.meta.url), 'utf8')
}

describe('authentication form contracts', () => {
  it('binds the registration form model so Ant Design can emit finish', () => {
    expect(readView('RegisterView.vue')).toMatch(/<a-form[^>]*:model="form"/)
  })

  it('binds the login form model so Ant Design can emit finish', () => {
    expect(readView('LoginView.vue')).toMatch(/<a-form[^>]*:model="form"/)
  })
})
