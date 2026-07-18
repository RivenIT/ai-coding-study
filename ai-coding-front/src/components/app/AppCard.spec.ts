import { describe, expect, it } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import AppCard from './AppCard.vue'
import type { AppVO } from '@/types/app'

const generatedApp: AppVO = {
  id: '42',
  appName: '一个个人博客',
  cover: null,
  initPrompt: '创建个人博客',
  codeGenType: 'multi_file',
  deployKey: 'blog-42',
  deployedTime: null,
  priority: 0,
  userId: '7',
  createTime: '2026-07-18T13:31:00',
  updateTime: '2026-07-18T13:31:00',
}

describe('AppCard preview', () => {
  it('renders the generated project when the app has no uploaded cover', async () => {
    const app = createSSRApp(AppCard, { app: generatedApp })
    app.config.warnHandler = () => undefined

    const html = await renderToString(app)

    expect(html).toContain('class="cover-preview-frame"')
    expect(html).toContain('/static/multi_file_42/')
    expect(html).not.toContain('class="cover-placeholder"')
  })
})
