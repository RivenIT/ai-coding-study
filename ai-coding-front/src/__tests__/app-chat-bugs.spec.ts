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
    expect(chat).toMatch(/shouldAutoStart[\s\S]*canOperate\.value/)
    expect(chat).toMatch(/function\s+sendMessage\s*\([^)]*\)\s*\{[\s\S]*!canOperate\.value/)
  })

  it('reloads when route app id changes on component reuse', () => {
    expect(chat).toMatch(/watch\s*\(\s*\(\)\s*=>\s*route\.params\.id/)
    expect(edit).toMatch(/watch\s*\(\s*\(\)\s*=>\s*route\.params\.id/)
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
