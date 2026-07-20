import { describe, expect, it } from 'vitest'
import { ApiError, assertMutationSuccess, isAuthenticationError } from '@/services/http'

describe('assertMutationSuccess', () => {
  it('rejects a successful HTTP envelope whose mutation result is false', () => {
    expect(() => assertMutationSuccess(false, '保存失败')).toThrow('保存失败')
    expect(assertMutationSuccess(true, '保存失败')).toBe(true)
  })
})

describe('isAuthenticationError', () => {
  it('only treats session expiry (40100) as an authentication failure', () => {
    expect(isAuthenticationError(new ApiError(40100, '未登录'))).toBe(true)
    expect(isAuthenticationError(new ApiError(40300, '禁止访问'))).toBe(false)
    expect(isAuthenticationError(new ApiError(40101, '无权限'))).toBe(false)
    expect(isAuthenticationError(new Error('network'))).toBe(false)
  })
})
