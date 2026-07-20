import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { removeFailedRetryTurn } from '@/utils/chat'
import type { ChatMessage } from '@/types/app'

const chat = readFileSync(new URL('../views/AppChatView.vue', import.meta.url), 'utf8')
const messages = readFileSync(new URL('../components/app/ChatMessageList.vue', import.meta.url), 'utf8')
const preview = readFileSync(new URL('../components/app/AppPreviewPanel.vue', import.meta.url), 'utf8')
const edit = readFileSync(new URL('../views/AppEditView.vue', import.meta.url), 'utf8')

describe('workbench regressions', () => {
  it('uses a single chat column until a preview actually exists', () => {
    expect(chat).toMatch(/with-preview/)
    expect(chat).toMatch(/\.workbench\.with-preview\s*\{[\s\S]*grid-template-columns/)
    expect(chat).toMatch(/\.workbench\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  })

  it('stops loading history when the total is exhausted or the cursor cannot advance', () => {
    expect(chat).toMatch(/loadedHistoryIds/)
    expect(chat).toMatch(/page\.records\[page\.records\.length\s*-\s*1\]/)
    expect(chat).toMatch(/loadedHistoryIds\.size\s*<\s*page\.totalRow/)
    expect(chat).not.toMatch(/\.at\(-1\)/)
  })

  it('only follows streaming output while the reader was already near the bottom', () => {
    expect(messages).toMatch(/wasNearBottom/)
    expect(messages).toMatch(/else if\s*\(wasNearBottom\)/)
  })

  it('does not report a successful deployment as failed when only app refresh fails', () => {
    const deployFunction = chat.match(/async function deployCurrentApp\(\)[\s\S]*?\n}\n\nfunction openDeployUrl/)
    expect(deployFunction?.[0]).toMatch(/deployModalOpen\.value\s*=\s*true[\s\S]*try\s*\{[\s\S]*await getApp/)
  })

  it('retries a failed generation by replacing the previous failed turn', () => {
    const seed: ChatMessage[] = [
      { id: 'u1', role: 'user', content: '做个博客', status: 'complete' },
      { id: 'a1', role: 'assistant', content: '', status: 'error' },
    ]

    expect(removeFailedRetryTurn(seed, '做个博客')).toEqual([])
    expect(chat).toMatch(/removeFailedRetryTurn/)
    expect(chat).toMatch(/function\s+retryLastMessage[\s\S]*removeFailedRetryTurn/)
  })

  it('probes same-origin previews with GET instead of HEAD', () => {
    expect(preview).toMatch(/method:\s*['"]GET['"]/)
    expect(preview).not.toMatch(/method:\s*['"]HEAD['"]/)
  })

  it('returns from the editor through the shared safe redirect helper', () => {
    expect(edit).toMatch(/getSafeRedirectPath/)
    expect(edit).not.toMatch(/from\.startsWith\('\/'\)/)
  })
})
