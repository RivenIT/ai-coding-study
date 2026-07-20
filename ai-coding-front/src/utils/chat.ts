import type { ChatMessage } from '@/types/app'

/**
 * Remove the trailing failed user/assistant pair so retry does not duplicate history.
 * Only strips the last two messages when they form a failed turn matching the retry content.
 */
export function removeFailedRetryTurn(messages: ChatMessage[], retryContent: string): ChatMessage[] {
  if (messages.length < 2) return messages

  const assistant = messages[messages.length - 1]
  const user = messages[messages.length - 2]
  if (
    assistant?.role === 'assistant' &&
    assistant.status === 'error' &&
    user?.role === 'user' &&
    user.content === retryContent
  ) {
    return messages.slice(0, -2)
  }

  return messages
}
