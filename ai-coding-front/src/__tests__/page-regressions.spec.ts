import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function readSource(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

const home = readSource('views/HomeView.vue')
const appList = readSource('components/app/AppListSection.vue')
const appCard = readSource('components/app/AppCard.vue')
const appPreview = readSource('components/app/AppPreviewPanel.vue')
const header = readSource('components/GlobalHeader.vue')
const login = readSource('views/LoginView.vue')
const register = readSource('views/RegisterView.vue')
const userUtils = readSource('utils/user.ts')
const appChat = readSource('views/AppChatView.vue')
const managementPages = [
  readSource('views/AppManagementView.vue'),
  readSource('views/UserManagementView.vue'),
  readSource('views/ChatHistoryManagementView.vue'),
]

describe('home page data state', () => {
  it('invalidates an in-flight private-list request before checking the login state', () => {
    const loadMyApps = home.match(/async function loadMyApps\(\)[\s\S]*?\n}\n\nasync function loadGoodApps/)

    expect(loadMyApps?.[0].indexOf('const requestId = ++myLoadSeq')).toBeLessThan(
      loadMyApps?.[0].indexOf('if (!userStore.loginUser)') ?? -1,
    )
  })

  it('clears or reloads private applications when the signed-in user changes', () => {
    expect(home).toMatch(/watch\(\s*\(\) => userStore\.loginUser\?\.id/)
  })

  it('shows a retryable error state instead of the empty state for failed lists', () => {
    expect(home).toMatch(/myLoadError/)
    expect(home).toMatch(/goodLoadError/)
    expect(appList).toMatch(/error-message/)
    expect(home).toMatch(/@retry=/)
  })
})

describe('admin page request lifecycle', () => {
  it('invalidates in-flight work when validation fails or the page unmounts', () => {
    for (const page of managementPages) {
      expect(page).toMatch(/const requestId = \+\+loadSeq/)
      expect(page).toMatch(/onBeforeUnmount\(\(\) => \{\s*loadSeq \+= 1/)
    }
  })

  it('clears client state and redirects when an administrative request loses its session', () => {
    for (const page of managementPages) {
      expect(page).toMatch(/isAuthenticationError/)
      expect(page).toMatch(/userStore\.clearLoginUser\(\)/)
      expect(page).toMatch(/router\.replace\(/)
    }
  })
})

describe('preview and media fallbacks', () => {
  it('checks same-origin preview responses and times out unresolved frames', () => {
    expect(appPreview).toMatch(/AbortController/)
    expect(appPreview).toMatch(/response\.ok/)
    expect(appPreview).toMatch(/setTimeout/)
    expect(appPreview).toMatch(/onBeforeUnmount/)
  })

  it('replaces failed card and management cover images with a fallback', () => {
    expect(appCard).toMatch(/@error="imageFailed = true"/)
    expect(readSource('views/AppManagementView.vue')).toMatch(/@error="handleCoverError\(record\.id\)"/)
  })
})

describe('navigation and command contracts', () => {
  it('uses click-triggered semantic controls for the user menu', () => {
    expect(header).toMatch(/:selected-keys="selectedKeys"/)
    expect(header).toMatch(/:trigger="\['click'\]"/)
    expect(header).toMatch(/<button class="user-trigger" type="button">/)
  })

  it('preserves safe redirect values across login and registration', () => {
    expect(login).toMatch(/getSafeRedirectPath/)
    expect(register).toMatch(/useRoute/)
    expect(register).toMatch(/getSafeRedirectPath/)
    expect(register).toMatch(/redirect/)
  })

  it('does not expose a deploy action that only opens the editor', () => {
    expect(appCard).not.toMatch(/CloudUploadOutlined/)
    expect(appCard).not.toMatch(/deploy: \[app: AppVO\]/)
    expect(appList).not.toMatch(/deploy: \[app: AppVO\]/)
    expect(home).not.toMatch(/@deploy=/)
  })
})

describe('browser compatibility guards', () => {
  it('avoids replaceAll in browser-facing source and uses dynamic viewport height for the chat workspace', () => {
    expect(userUtils).not.toMatch(/replaceAll/)
    expect(appChat).toMatch(/100dvh/)
    expect(appChat).toMatch(/safe-area-inset-bottom/)
  })
})
