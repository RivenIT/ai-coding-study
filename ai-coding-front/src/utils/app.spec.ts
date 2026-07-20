import { describe, expect, it } from 'vitest'
import { normalizeApiBaseUrl } from '@/services/http'
import {
  buildPreviewUrl,
  canEditApp,
  isHttpUrl,
  isNumericId,
  normalizeAdminAppQuery,
  normalizePublicAppQuery,
} from './app'

describe('application query rules', () => {
  it('bounds public page size and removes empty text filters', () => {
    expect(
      normalizePublicAppQuery({
        pageNum: 0,
        pageSize: 100,
        appName: '  blog  ',
        codeGenType: ' ',
      }),
    ).toEqual({
      pageNum: 1,
      pageSize: 20,
      sortField: 'createTime',
      sortOrder: 'descend',
      appName: 'blog',
    })
  })

  it('defaults public page size to 20 for missing and unsupported smaller sizes', () => {
    expect(normalizePublicAppQuery({}).pageSize).toBe(20)
    expect(normalizePublicAppQuery({ pageSize: 10 }).pageSize).toBe(20)
  })

  it('keeps a positive fractional page number at one or above', () => {
    expect(normalizePublicAppQuery({ pageNum: 0.5 }).pageNum).toBe(1)
  })

  it('accepts supported public page sizes and safe sorting', () => {
    expect(
      normalizePublicAppQuery({
        pageNum: 3,
        pageSize: 12,
        sortField: 'appName',
        sortOrder: 'ascend',
      }),
    ).toMatchObject({
      pageNum: 3,
      pageSize: 12,
      sortField: 'appName',
      sortOrder: 'ascend',
    })
  })

  it('keeps an administrator page size and exact numeric filters', () => {
    expect(
      normalizeAdminAppQuery({
        pageNum: 2,
        pageSize: 50,
        id: ' 12 ',
        priority: 99,
        userId: ' 7 ',
      }),
    ).toMatchObject({
      pageNum: 2,
      pageSize: 50,
      id: '12',
      priority: 99,
      userId: '7',
    })
  })

  it('falls back from invalid administrator pagination and sorting', () => {
    expect(
      normalizeAdminAppQuery({
        pageNum: -2,
        pageSize: 0,
        sortField: 'unsafe' as 'id',
        sortOrder: 'unsafe' as 'ascend',
      }),
    ).toEqual({
      pageNum: 1,
      pageSize: 10,
      sortField: 'createTime',
      sortOrder: 'descend',
    })
  })

  it('removes non-numeric ID filters after trimming', () => {
    expect(normalizeAdminAppQuery({ id: 'abc', userId: '-1' })).toEqual({
      pageNum: 1,
      pageSize: 10,
      sortField: 'createTime',
      sortOrder: 'descend',
    })
  })
})

describe('API base URL normalization', () => {
  it('removes trailing slashes and supplies the local API default', () => {
    expect(normalizeApiBaseUrl('http://localhost:8081/api///')).toBe('http://localhost:8081/api')
    expect(normalizeApiBaseUrl(undefined)).toBe('http://localhost:8081/api')
  })

  it('resolves a relative API base against the browser origin', () => {
    const normalizeWithOrigin = normalizeApiBaseUrl as (value: string, origin: string) => string

    expect(normalizeWithOrigin('/api/', 'https://preview.example.com')).toBe(
      'https://preview.example.com/api',
    )
  })
})

describe('application preview URLs', () => {
  it('creates a cache-busted preview URL', () => {
    expect(buildPreviewUrl('http://localhost:8081/api/', 'multi_file', '42', 7)).toBe(
      'http://localhost:8081/api/static/multi_file_42/?v=7',
    )
  })

  it('encodes path segments without allowing path traversal', () => {
    expect(buildPreviewUrl('https://api.example.com/base/', 'vue app', '../42', 'now')).toBe(
      'https://api.example.com/base/static/vue%20app_..%2F42/?v=now',
    )
  })

  it('returns an empty URL when a required path segment is missing', () => {
    expect(buildPreviewUrl('http://localhost:8081/api', '', '42')).toBe('')
    expect(buildPreviewUrl('http://localhost:8081/api', 'multi_file', ' ')).toBe('')
  })
})

describe('application validation and permissions', () => {
  it('allows administrators and exact owners to edit', () => {
    expect(canEditApp({ role: 'user', userId: '1', ownerId: '2' })).toBe(false)
    expect(canEditApp({ role: 'user', userId: '2', ownerId: '2' })).toBe(true)
    expect(canEditApp({ role: 'admin', userId: '1', ownerId: '2' })).toBe(true)
    expect(canEditApp({ role: 'user', userId: '', ownerId: '' })).toBe(false)
  })

  it('accepts HTTP URLs only', () => {
    expect(isHttpUrl('https://example.com/cover.png')).toBe(true)
    expect(isHttpUrl('http://localhost:8081/deploy')).toBe(true)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('ftp://example.com/file')).toBe(false)
    expect(isHttpUrl('not a url')).toBe(false)
  })

  it('accepts only non-empty numeric IDs', () => {
    expect(isNumericId('123456789')).toBe(true)
    expect(isNumericId('')).toBe(false)
    expect(isNumericId(' 12 ')).toBe(false)
    expect(isNumericId('-1')).toBe(false)
    expect(isNumericId('12a')).toBe(false)
  })
})
