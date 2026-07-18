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

  it('deduplicates concurrent fetchLoginUser calls into one network request', async () => {
    type LoginUser = Awaited<ReturnType<typeof getLoginUser>>
    let resolveFetch!: (value: LoginUser) => void
    vi.mocked(getLoginUser).mockImplementation(
      () =>
        new Promise<LoginUser>((resolve) => {
          resolveFetch = resolve
        }),
    )
    const store = useUserStore()

    const first = store.fetchLoginUser({ silent: true })
    const second = store.fetchLoginUser({ silent: true })
    expect(getLoginUser).toHaveBeenCalledTimes(1)

    resolveFetch({
      id: '1',
      userAccount: 'alice',
      userName: 'Alice',
      userAvatar: null,
      userProfile: null,
      userRole: 'user',
      createTime: null,
      updateTime: null,
    })

    await expect(first).resolves.toMatchObject({ id: '1' })
    await expect(second).resolves.toMatchObject({ id: '1' })
    expect(store.loginUser?.userAccount).toBe('alice')
  })
})
