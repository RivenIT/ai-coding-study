import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/services/http'
import { getLoginUser } from '@/services/user'
import { useUserStore } from './user'

vi.mock('@/services/user', () => ({
  getLoginUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('treats a silent 40100 bootstrap response as a logged-out state', async () => {
    vi.mocked(getLoginUser).mockRejectedValue(new ApiError(40100, '未登录'))
    const store = useUserStore()

    await store.fetchLoginUser({ silent: true })

    expect(store.loginUser).toBeNull()
    expect(store.initialized).toBe(true)
  })
})
