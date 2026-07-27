import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const appChatSource = readFileSync(
  fileURLToPath(new URL('../views/AppChatView.vue', import.meta.url)),
  'utf8',
)

describe('generation workbench layout', () => {
  it('shows the preview column while AI code is streaming', () => {
    expect(appChatSource).toContain(
      'const showPreview = computed(() => generating.value || historyMessageCount.value >= 2)',
    )
  })

  it('refreshes the generated page only after the stream completes', () => {
    expect(appChatSource).toMatch(
      /onDone:\s*\(\)\s*=>\s*\{[\s\S]*?generating\.value = false[\s\S]*?refreshPreview\(\)/,
    )
  })
})
