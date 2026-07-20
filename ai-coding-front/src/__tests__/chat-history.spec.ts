import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const chat = readFileSync(new URL('../views/AppChatView.vue', import.meta.url), 'utf8')
const api = readFileSync(new URL('../services/chatHistory.ts', import.meta.url), 'utf8')
const router = readFileSync(new URL('../router/index.ts', import.meta.url), 'utf8')
const management = readFileSync(new URL('../views/ChatHistoryManagementView.vue', import.meta.url), 'utf8')

describe('chat history integration', () => {
  it('loads cursor-based history and prepends older records in chronological order', () => {
    expect(api).toMatch(/url:\s*`\/chatHistory\/app\/\$\{appId\}`/)
    expect(api).toMatch(/lastCreateTime/)
    expect(chat).toMatch(/loadChatHistory/)
    expect(chat).toMatch(/messages\.value\s*=\s*\[\.\.\.historyMessages,\s*\.\.\.messages\.value\]/)
    expect(chat).toMatch(/:preserve-scroll-version="historyPrependVersion"/)
  })

  it('only auto-starts the initial prompt for an owner without history', () => {
    expect(chat).toMatch(/historyMessages\.length\s*===\s*0/)
    expect(chat).toMatch(/shouldAutoStart[\s\S]*isOwner\.value/)
    expect(chat).not.toMatch(/route\.query\.view/)
  })

  it('shows the preview when at least two persisted messages exist', () => {
    expect(chat).toMatch(/historyMessageCount\.value\s*>=\s*2/)
  })
})

describe('chat history management', () => {
  it('registers an admin management page that uses the generated history list API', () => {
    expect(router).toMatch(/path:\s*['"]\/chatHistory\/manage['"]/)
    expect(management).toMatch(/listChatHistoryByAdmin/)
    expect(management).toMatch(/@change="changePage"/)
  })
})