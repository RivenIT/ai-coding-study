import type { PageResult } from '@/types/user'

export interface ChatHistory {
  id: string
  message: string
  messageType: 'user' | 'ai'
  appId: string
  userId: string
  createTime: string | null
  updateTime: string | null
}

export interface ChatHistoryQueryRequest {
  pageNum: number
  pageSize: number
  sortField: 'id' | 'appId' | 'userId' | 'messageType' | 'createTime' | 'updateTime'
  sortOrder: 'ascend' | 'descend'
  id?: string
  message?: string
  messageType?: 'user' | 'ai'
  appId?: string
  userId?: string
}

export type ChatHistoryQueryInput = Partial<ChatHistoryQueryRequest>
export type ChatHistoryPageResult = PageResult<ChatHistory>
