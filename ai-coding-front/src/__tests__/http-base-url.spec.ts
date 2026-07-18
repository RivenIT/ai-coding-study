import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getDefaultApiBaseUrl, parseApiResponse } from '@/services/http'

const http = readFileSync(new URL('../services/http.ts', import.meta.url), 'utf8')

describe('getDefaultApiBaseUrl', () => {
  it('builds a host-aware local API base URL for IPv4 and IPv6 hostnames', () => {
    expect(getDefaultApiBaseUrl({ protocol: 'http:', hostname: '192.168.1.8' })).toBe(
      'http://192.168.1.8:8081/api',
    )
    expect(getDefaultApiBaseUrl({ protocol: 'https:', hostname: '::1' })).toBe(
      'https://[::1]:8081/api',
    )
  })
})

describe('API response parsing', () => {
  it('configures a lossless parser for 64-bit application IDs', () => {
    expect(http).toContain("JSONBig({ storeAsString: true })")
    expect(http).toContain('transformResponse: [parseApiResponse]')
  })

  it('preserves 64-bit IDs exactly as strings', () => {
    expect(parseApiResponse('{"code":0,"data":{"id":435753066709344256,"userId":435644777132650496}}')).toEqual({
      code: 0,
      data: {
        id: '435753066709344256',
        userId: '435644777132650496',
      },
    })
  })
})
