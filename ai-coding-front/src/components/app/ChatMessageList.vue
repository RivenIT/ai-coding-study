<template>
  <div ref="listRef" class="message-list">
    <div
      v-for="message in messages"
      :key="message.id"
      class="message-row"
      :class="message.role === 'user' ? 'is-user' : 'is-assistant'"
    >
      <a-avatar v-if="message.role === 'assistant'" :src="aiAvatar" class="message-avatar" />
      <div class="message-bubble">
        <div class="message-role">{{ message.role === 'user' ? '你' : 'AI' }}</div>
        <p class="message-content">{{ message.content || streamingText(message.status) }}</p>
        <div v-if="message.status !== 'complete'" class="message-status">
          <a-spin v-if="message.status === 'streaming'" size="small" />
          <span>{{ message.status === 'streaming' ? '生成中' : '生成失败' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import aiAvatar from '@/assets/aiAvatar.png'
import type { ChatMessage } from '@/types/app'

const props = defineProps<{
  messages: ChatMessage[]
  preserveScrollVersion?: number
}>()

const listRef = ref<HTMLElement | null>(null)
const AUTO_SCROLL_THRESHOLD = 48
let lastHandledPreserveScrollVersion = props.preserveScrollVersion ?? 0
let preservedBottomOffset = 0

function streamingText(status: ChatMessage['status']): string {
  return status === 'streaming' ? '正在整理代码变更...' : '这条回复没有生成完整内容'
}

watch(
  () => props.preserveScrollVersion,
  () => {
    if (!listRef.value) return
    preservedBottomOffset = listRef.value.scrollHeight - listRef.value.scrollTop
  },
)

watch(
  () => props.messages.map((message) => `${message.id}:${message.content.length}:${message.status}`).join('|'),
  async () => {
    const list = listRef.value
    if (!list) return
    const preserveScrollVersion = props.preserveScrollVersion ?? 0
    const wasNearBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight <= AUTO_SCROLL_THRESHOLD
    await nextTick()
    const currentList = listRef.value
    if (!currentList) return
    if (preserveScrollVersion !== lastHandledPreserveScrollVersion) {
      currentList.scrollTop = currentList.scrollHeight - preservedBottomOffset
      lastHandledPreserveScrollVersion = preserveScrollVersion
    } else if (wasNearBottom) {
      currentList.scrollTop = currentList.scrollHeight
    }
  },
)
</script>

<style scoped>
.message-list {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  align-content: start;
  gap: var(--space-5);
  padding: var(--space-4);
}

.message-row {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.message-row.is-user {
  justify-content: flex-end;
}

.message-avatar {
  flex: 0 0 auto;
}

.message-bubble {
  max-width: min(82%, 680px);
  min-width: 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-sm);
  background: var(--color-panel);
}

.is-user .message-bubble {
  color: var(--color-on-accent);
  border-color: var(--color-accent-strong);
  background: var(--color-accent-strong);
}

.message-role {
  margin-bottom: var(--space-1);
  font-size: 12px;
  font-weight: 700;
  opacity: 0.72;
}

.message-content {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.75;
}

.message-status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  color: var(--color-muted);
  font-size: 12px;
}

.is-user .message-status {
  color: var(--color-on-accent-muted);
}

@media (max-width: 560px) {
  .message-list {
    padding: var(--space-3);
  }

  .message-bubble {
    max-width: 88%;
  }
}
</style>
