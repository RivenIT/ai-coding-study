import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const chat = readFileSync(new URL('../views/AppChatView.vue', import.meta.url), 'utf8')
const edit = readFileSync(new URL('../views/AppEditView.vue', import.meta.url), 'utf8')
const listSection = readFileSync(new URL('../components/app/AppListSection.vue', import.meta.url), 'utf8')
const appManage = readFileSync(new URL('../views/AppManagementView.vue', import.meta.url), 'utf8')
const userManage = readFileSync(new URL('../views/UserManagementView.vue', import.meta.url), 'utf8')
const home = readFileSync(new URL('../views/HomeView.vue', import.meta.url), 'utf8')
const appRoot = readFileSync(new URL('../App.vue', import.meta.url), 'utf8')
const header = readFileSync(new URL('../components/GlobalHeader.vue', import.meta.url), 'utf8')
const tokens = readFileSync(new URL('../../tokens.css', import.meta.url), 'utf8')
const pkg = readFileSync(new URL('../../package.json', import.meta.url), 'utf8')

describe('AppChatView critical bugs', () => {
  it('wraps streaming assistant message in reactive so chunk mutations are tracked', () => {
    expect(chat).toMatch(/import\s*\{[^}]*\breactive\b[^}]*\}\s*from\s*['"]vue['"]/)
    expect(chat).toMatch(/const\s+assistantMessage\s*=\s*reactive\s*\(\s*createMessage\s*\(\s*['"]assistant['"]/)
  })

  it('gates autoStart and sendMessage with canOperate', () => {
    expect(chat).toMatch(/route\.query\.autoStart\s*===\s*['"]1['"]/)
    expect(chat).toMatch(/consumeAutoStart/)
    expect(chat).toMatch(/function\s+sendMessage\s*\([^)]*\)\s*\{[\s\S]*!canOperate\.value/)
  })

  it('only consumes autoStart after history loads successfully and keeps retry for failures', () => {
    const loadApp = chat.match(/async function loadApp\(\)[\s\S]*?\n}\n\nasync function consumeAutoStart/)
    expect(loadApp?.[0]).toMatch(/if\s*\(\s*historyMessages\s*===\s*null\s*\)\s*return/)
    expect(loadApp?.[0]).toMatch(
      /if\s*\(\s*historyMessages\s*===\s*null\s*\)\s*return[\s\S]*if\s*\(\s*autoStartRequested\s*\)\s*await\s+consumeAutoStart\(\)/,
    )
    expect(chat).toMatch(/@click="loadApp"/)
  })

  it('recovers the composer when opening an EventSource throws synchronously', () => {
    expect(chat).toMatch(/try\s*\{[\s\S]*connectAppGeneration/)
    expect(chat).toMatch(/catch\s*\(error\)[\s\S]*generating\.value\s*=\s*false/)
  })

  it('keeps the existing preview visible while a follow-up generation is running', () => {
    const sendMessage = chat.match(/function sendMessage\(content: string\)[\s\S]*?\n}\n\nfunction retryLastMessage/)

    expect(sendMessage?.[0]).not.toMatch(/previewLoading\.value\s*=\s*true/)
  })

  it('does not enable deployment until a previewable generation has completed', () => {
    expect(chat).toMatch(/const\s+canDeploy\s*=\s*computed\([\s\S]*showPreview\.value/)
    expect(chat).toMatch(/const\s+canDeploy\s*=\s*computed\([\s\S]*previewUrl\.value/)
    expect(chat).toMatch(/const\s+canDeploy\s*=\s*computed\([\s\S]*!generationError\.value/)
  })

  it('reloads when route app id changes on component reuse', () => {
    expect(chat).toMatch(/watch\s*\(\s*\(\)\s*=>\s*route\.params\.id/)
    expect(edit).toMatch(/watch\s*\(\s*\(\)\s*=>\s*route\.params\.id/)
  })

  it('resets loadingHistory when invalidating in-flight work so the retry button cannot deadlock history', () => {
    const loadApp = chat.match(/async function loadApp\(\)[\s\S]*?\n}\n\nasync function consumeAutoStart/)

    expect(loadApp?.[0]).toMatch(
      /const requestId = \+\+loadSeq[\s\S]*?loadingHistory\.value = false[\s\S]*?await loadChatHistory\(/,
    )
  })

  it('drops stale deploy responses after the workbench switches to another app', () => {
    const deploy = chat.match(/async function deployCurrentApp\(\)[\s\S]*?\n}\n\nfunction openDeployUrl/)

    expect(deploy?.[0]).toMatch(/const requestId = loadSeq/)
    expect(deploy?.[0]).toMatch(/if \(requestId !== loadSeq\) return/)
  })

  it('invalidates in-flight edit-view requests on unmount so a stale 40100 cannot redirect to login', () => {
    expect(edit).toMatch(/onBeforeUnmount\(\(\) => \{\s*loadSeq \+= 1/)
  })

  it('only bumps historyPrependVersion when a page actually adds messages', () => {
    const loadHistory = chat.match(/async function loadChatHistory[\s\S]*?\n}\n\nasync function loadMoreChatHistory/)
    const elseBranch = loadHistory?.[0].match(/else\s*\{[\s\S]*?\n\s*\}/)

    expect(elseBranch?.[0]).toMatch(/if \(historyMessages\.length > 0\)[\s\S]*historyPrependVersion\.value \+= 1/)
    expect(elseBranch?.[0]).toMatch(/messages\.value = \[\.\.\.historyMessages, \.\.\.messages\.value\]/)
  })

  it('does not treat an all-duplicate page as the end of history', () => {
    const loadHistory = chat.match(/async function loadChatHistory[\s\S]*?\n}\n\nasync function loadMoreChatHistory/)

    expect(loadHistory?.[0]).toMatch(/hasMoreHistory\.value =[\s\S]*?nextCursor !== previousCursor/)
    expect(loadHistory?.[0]).not.toMatch(/freshRecords\.length > 0/)
  })
})

describe('pagination double-load', () => {
  it('handles page and size changes through a single @change handler', () => {
    expect(listSection).not.toMatch(/@show-size-change/)
    expect(appManage).not.toMatch(/@show-size-change/)
    expect(userManage).not.toMatch(/@show-size-change/)
    expect(listSection).toMatch(/@change="changePage"/)
    expect(appManage).toMatch(/@change="changePage"/)
    expect(userManage).toMatch(/@change="changePage"/)
  })
})

describe('list request races', () => {
  it('ignores stale async list responses with a request sequence token', () => {
    expect(home).toMatch(/loadSeq|requestId|requestToken|seq\b/)
    expect(appManage).toMatch(/loadSeq|requestId|requestToken|seq\b/)
    expect(userManage).toMatch(/loadSeq|requestId|requestToken|seq\b/)
  })
})

describe('login init duplication', () => {
  it('does not fetch login user from the root App shell', () => {
    expect(appRoot).not.toMatch(/fetchLoginUser/)
    expect(appRoot).not.toMatch(/onMounted/)
  })
})

describe('mobile header and tokens/deps', () => {
  it('hides bulky user chrome on narrow screens', () => {
    expect(header).toMatch(/@media\s*\(max-width:\s*480px\)[\s\S]*user-name[\s\S]*display:\s*none/)
  })

  it('provides non-oklch fallbacks for color tokens', () => {
    expect(tokens).toMatch(/@supports\s*\(\s*color:\s*oklch\(/)
    expect(tokens).toMatch(/--color-ink:\s*#[0-9a-fA-F]{3,8}/)
  })

  it('declares @ant-design/icons-vue as a direct dependency', () => {
    const parsed = JSON.parse(pkg) as { dependencies?: Record<string, string> }
    expect(parsed.dependencies?.['@ant-design/icons-vue']).toBeTruthy()
  })
})
