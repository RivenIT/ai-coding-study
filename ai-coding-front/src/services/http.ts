import axios, { type AxiosRequestConfig } from 'axios'
import type { BaseResponse } from '@/types/user'

export class ApiError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081',
  withCredentials: true,
  timeout: 15_000,
})

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await http.request<BaseResponse<T>>(config)
    const body = response.data

    if (body.code !== 0) {
      throw new ApiError(body.code, body.message || '请求失败')
    }

    return body.data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || '网络异常，请稍后重试'
      throw new ApiError(error.response?.status ?? 50000, message)
    }

    throw new ApiError(50000, '系统异常，请稍后重试')
  }
}
