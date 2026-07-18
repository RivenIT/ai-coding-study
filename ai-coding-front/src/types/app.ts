import type { PageResult, UserVO } from '@/types/user'

export type AppId = string

export interface AppVO {
  id: AppId
  appName: string | null
  cover: string | null
  initPrompt: string | null
  codeGenType: string | null
  deployKey: string | null
  deployedTime: string | null
  priority: number
  userId: string
  createTime: string | null
  updateTime: string | null
  user?: UserVO
}

export interface AppAddRequest {
  initPrompt: string
}

export interface AppDeployRequest {
  appId: AppId
}

export interface AppUpdateRequest {
  id: AppId
  appName: string
}

export interface AppAdminUpdateRequest {
  id: AppId
  appName?: string
  cover?: string
  priority?: number
}

export interface AppQueryRequest {
  pageNum: number
  pageSize: number
  sortField: 'id' | 'appName' | 'priority' | 'createTime' | 'updateTime'
  sortOrder: 'ascend' | 'descend'
  id?: AppId
  appName?: string
  cover?: string
  initPrompt?: string
  codeGenType?: string
  deployKey?: string
  priority?: number
  userId?: string
}

export type AppQueryInput = Partial<AppQueryRequest>

export type AppPageResult = PageResult<AppVO>

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  status: 'streaming' | 'complete' | 'error'
}
