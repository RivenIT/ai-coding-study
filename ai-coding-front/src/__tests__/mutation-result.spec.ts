import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/http', () => ({
  request: vi.fn(),
  requestSuccess: vi.fn(),
}))

import { deleteApp, updateApp } from '@/services/app'
import { requestSuccess } from '@/services/http'
import { deleteUser, logout, updateUser } from '@/services/user'

describe('boolean mutation responses', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the shared application mutation failure boundary', async () => {
    vi.mocked(requestSuccess).mockRejectedValue(new Error('保存应用失败'))

    await expect(updateApp({ id: '1', appName: 'new name' })).rejects.toThrow('保存应用失败')
    expect(requestSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/app/update' }),
      '保存应用失败',
    )

    vi.mocked(requestSuccess).mockRejectedValue(new Error('删除应用失败'))
    await expect(deleteApp('1')).rejects.toThrow('删除应用失败')
  })

  it('uses the shared user mutation failure boundary', async () => {
    vi.mocked(requestSuccess).mockRejectedValue(new Error('退出登录失败'))

    await expect(logout()).rejects.toThrow('退出登录失败')

    vi.mocked(requestSuccess).mockRejectedValue(new Error('删除用户失败'))
    await expect(deleteUser('1')).rejects.toThrow('删除用户失败')

    vi.mocked(requestSuccess).mockRejectedValue(new Error('更新用户失败'))
    await expect(updateUser({ id: '1', userName: 'Alice', userRole: 'user' })).rejects.toThrow('更新用户失败')
  })
})
