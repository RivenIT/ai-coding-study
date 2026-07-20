import { request } from '@/services/http'
import type { ChatHistory, ChatHistoryPageResult, ChatHistoryQueryRequest } from '@/types/chatHistory'

type NumericId = string | number

type ChatHistoryWithNumericIds = Omit<ChatHistory, 'id' | 'appId' | 'userId'> & {
  id: NumericId
  appId: NumericId
  userId: NumericId
}

function normalizeChatHistory(record: ChatHistoryWithNumericIds): ChatHistory {
  return {
    ...record,
    id: String(record.id),
    appId: String(record.appId),
    userId: String(record.userId),
  }
}

function normalizeChatHistoryPage(page: { records: ChatHistoryWithNumericIds[]; totalRow: number | string }): ChatHistoryPageResult {
  return {
    ...page,
    records: page.records.map((record) => normalizeChatHistory(record)),
    totalRow: Number(page.totalRow),
  }
}

export async function getAppChatHistory(
  appId: string,
  options: { pageSize?: number; lastCreateTime?: string } = {},
): Promise<ChatHistoryPageResult> {
  const page = await request<{ records: ChatHistoryWithNumericIds[]; totalRow: number | string }>({
    method: 'GET',
    url: `/chatHistory/app/${appId}`,
    params: {
      pageSize: options.pageSize ?? 10,
      lastCreateTime: options.lastCreateTime,
    },
  })
  return normalizeChatHistoryPage(page)
}

export async function listChatHistoryByAdmin(query: ChatHistoryQueryRequest): Promise<ChatHistoryPageResult> {
  const page = await request<{ records: ChatHistoryWithNumericIds[]; totalRow: number | string }>({
    method: 'POST',
    url: '/chatHistory/admin/list/page/vo',
    data: query,
  })
  return normalizeChatHistoryPage(page)
}
