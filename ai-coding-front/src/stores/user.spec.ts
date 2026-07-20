import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/services/http'
import { getLoginUser, login as loginApi } from '@/services/user'
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

  it('keeps authentication unresolved after a transport error so a later navigation can retry', async () => {
    vi.mocked(getLoginUser).mockRejectedValue(new ApiError(50000, '网络异常'))
    const store = useUserStore()

    await expect(store.fetchLoginUser({ silent: true })).rejects.toThrow('网络异常')

    expect(store.initialized).toBe(false)
    expect(store.loading).toBe(false)
  })

  it('ignores a stale silent 401 response that finishes after a successful login', async () => {
    type LoginUser = Awaited<ReturnType<typeof getLoginUser>>
    const loggedInUser: LoginUser = {
      id: '1',
      userAccount: 'alice',
      userName: 'Alice',
      userAvatar: null,
      userProfile: null,
      userRole: 'user',
      createTime: null,
      updateTime: null,
    }
    let rejectBootstrap!: (error: ApiError) => void
    vi.mocked(getLoginUser).mockImplementationOnce(
      () =>
        new Promise<LoginUser>((_resolve, reject) => {
          rejectBootstrap = reject
        }),
    )
    vi.mocked(loginApi).mockResolvedValue(loggedInUser)

    const store = useUserStore()
    const bootstrap = store.fetchLoginUser({ silent: true })

    await store.login({
      userAccount: 'alice',
      userPassword: 'secret-password',
    })

    expect(store.loginUser?.userAccount).toBe('alice')
    expect(store.initialized).toBe(true)

    rejectBootstrap(new ApiError(40100, '未登录'))
    await expect(bootstrap).resolves.toBeNull()

    expect(store.loginUser?.userAccount).toBe('alice')
    expect(store.initialized).toBe(true)
  })
})
