import { describe, expect, it } from 'vitest'
import {
  buildUserCsv,
  buildUserUpdateRequest,
  isHttpUrl,
  isUserId,
  normalizeUserQuery,
  validateRegistration,
} from './user'

describe('normalizeUserQuery', () => {
  it('trims filters and removes empty values', () => {
    expect(
      normalizeUserQuery({
        pageNum: 0,
        pageSize: 5,
        userAccount: '  alice  ',
        userName: ' ',
      }),
    ).toEqual({
      pageNum: 1,
      pageSize: 10,
      sortField: 'createTime',
      sortOrder: 'descend',
      userAccount: 'alice',
    })
  })
})

describe('buildUserCsv', () => {
  it('quotes comma, quote and newline fields', () => {
    const csv = buildUserCsv([
      {
        id: '1',
        userAccount: 'alice',
        userName: 'A, "B"',
        userAvatar: null,
        userProfile: 'first\nline',
        userRole: 'user',
        createTime: null,
      },
    ])

    expect(csv).toContain('"A, ""B"""')
    expect(csv).toContain('"first\nline"')
  })
})

describe('identity validation', () => {
  it('rejects a registration password confirmation mismatch', () => {
    expect(
      validateRegistration({
        userAccount: 'alice',
        userPassword: 'password1',
        checkPassword: 'password2',
      }),
    ).toEqual({ checkPassword: '两次输入的密码不一致' })
  })

  it('accepts only numeric user IDs and HTTP(S) avatar URLs', () => {
    expect(isUserId('abc')).toBe(false)
    expect(isUserId('123456789')).toBe(true)
    expect(isHttpUrl('https://example.com/avatar.png')).toBe(true)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
  })
})

describe('managed user update payloads', () => {
  it('omits the read-only account field from update requests', () => {
    expect(
      buildUserUpdateRequest('42', {
        userAccount: 'readonly-account',
        userName: 'Alice',
        userAvatar: undefined,
        userProfile: 'Profile',
        userRole: 'user',
      }),
    ).toEqual({
      id: '42',
      userName: 'Alice',
      userAvatar: undefined,
      userProfile: 'Profile',
      userRole: 'user',
    })
  })
})
