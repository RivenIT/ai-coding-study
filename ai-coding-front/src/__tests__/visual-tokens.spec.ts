import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const tokens = readFileSync(new URL('../../tokens.css', import.meta.url), 'utf8')
const home = readFileSync(new URL('../views/HomeView.vue', import.meta.url), 'utf8')
const composer = readFileSync(new URL('../components/app/PromptComposer.vue', import.meta.url), 'utf8')
const messages = readFileSync(new URL('../components/app/ChatMessageList.vue', import.meta.url), 'utf8')

describe('visual token contract', () => {
  it('defines the reference-inspired field and raised-panel tokens', () => {
    expect(tokens).toContain('--color-field-cyan:')
    expect(tokens).toContain('--color-field-blue:')
    expect(tokens).toContain('--color-panel-raised:')
    expect(tokens).toContain('--shadow-workbench:')
  })

  it('keeps field and accent color values in the shared token file', () => {
    expect(tokens).toContain('--color-field-stripe:')
    expect(tokens).toContain('--color-panel-on-field:')
    expect(tokens).toContain('--color-on-accent:')
    expect(home).not.toContain('oklch(')
    expect(composer).not.toContain('oklch(')
    expect(messages).not.toContain('oklch(')
  })
})
