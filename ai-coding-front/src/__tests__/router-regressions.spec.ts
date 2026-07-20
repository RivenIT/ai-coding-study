import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const router = readFileSync(new URL('../router/index.ts', import.meta.url), 'utf8')

describe('route bootstrap regressions', () => {
  it('does not await login bootstrap before rendering public routes', () => {
    expect(router).toMatch(/const\s+requiresSession\s*=\s*Boolean\(/)
    expect(router).toMatch(/if\s*\(requiresSession\s*&&\s*!userStore\.initialized\)/)
    expect(router).toMatch(/void\s+userStore\.fetchLoginUser\(\{\s*silent:\s*true\s*\}\)\.catch/)
  })

  it('provides a catch-all route instead of leaving the router-view empty', () => {
    expect(router).toMatch(/path:\s*['"]\/:pathMatch\(\.\*\)\*['"]/) 
  })
})
