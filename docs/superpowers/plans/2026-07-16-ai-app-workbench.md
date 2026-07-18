# AI App Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Vue 3 application creation workbench: prompt creation, personal and featured lists, SSE generation, preview, deploy, editing, and administrator management.

**Architecture:** Keep HTTP and SSE transport in focused service modules, keep query and permission rules in pure tested utilities, and let Vue pages orchestrate those modules. Use custom product UI for the home and chat routes while retaining Ant Design Vue for forms, tables, drawers, pagination, and feedback.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Pinia, Ant Design Vue, Axios, native EventSource, Vitest, Vite.

---

## File Map

**Create:**

- `ai-coding-front/tokens.css` — shared colors, typography, spacing, radii, motion, and focus tokens.
- `ai-coding-front/src/types/app.ts` — application domain, pagination, request, and chat types.
- `ai-coding-front/src/utils/app.ts` — query normalization, URL creation, permission, and display helpers.
- `ai-coding-front/src/utils/app.spec.ts` — pure application rule tests.
- `ai-coding-front/src/services/app.ts` — JSON application endpoints.
- `ai-coding-front/src/services/appSse.ts` — EventSource lifecycle and payload parsing.
- `ai-coding-front/src/services/appSse.spec.ts` — SSE parsing and lifecycle tests.
- `ai-coding-front/src/components/app/AppCard.vue` — stable application card and actions.
- `ai-coding-front/src/components/app/AppListSection.vue` — search, loading, empty, grid, and pagination shell.
- `ai-coding-front/src/components/app/PromptComposer.vue` — reusable prompt input.
- `ai-coding-front/src/components/app/AppDetailDrawer.vue` — administrator detail drawer.
- `ai-coding-front/src/components/app/ChatMessageList.vue` — user and assistant message transcript.
- `ai-coding-front/src/components/app/AppPreviewPanel.vue` — iframe loading, error, refresh, and empty states.
- `ai-coding-front/src/views/AppChatView.vue` — immersive generation workbench.
- `ai-coding-front/src/views/AppEditView.vue` — permission-aware edit form.
- `ai-coding-front/src/views/AppManagementView.vue` — administrator filters, table, actions, and pagination.

**Modify:**

- `ai-coding-front/src/main.ts` — import the token stylesheet.
- `ai-coding-front/src/services/http.ts` — export the normalized API base URL.
- `ai-coding-front/src/router/index.ts` — add application routes and `requiresAuth`/`immersive` handling.
- `ai-coding-front/src/layouts/BasicLayout.vue` — render standard or immersive layout from route metadata.
- `ai-coding-front/src/components/GlobalHeader.vue` — add administrator application management navigation.
- `ai-coding-front/src/views/HomeView.vue` — replace the learning hero with the creation workspace and lists.

No backend files are modified.

### Task 1: Application Domain Rules

**Files:**

- Create: `ai-coding-front/src/types/app.ts`
- Create: `ai-coding-front/src/utils/app.ts`
- Create: `ai-coding-front/src/utils/app.spec.ts`
- Modify: `ai-coding-front/src/services/http.ts`

- [ ] **Step 1: Write the failing domain tests**

Create tests for bounded public queries, unrestricted administrator queries, preview URLs, edit permission, and URL validation:

```ts
import { describe, expect, it } from 'vitest'
import {
  buildPreviewUrl,
  canEditApp,
  isHttpUrl,
  normalizeAdminAppQuery,
  normalizePublicAppQuery,
} from './app'

describe('application rules', () => {
  it('bounds public page size and removes empty filters', () => {
    expect(normalizePublicAppQuery({ pageNum: 0, pageSize: 100, appName: '  blog  ' })).toEqual({
      pageNum: 1,
      pageSize: 20,
      sortField: 'createTime',
      sortOrder: 'descend',
      appName: 'blog',
    })
  })

  it('keeps an administrator page size and exact numeric filters', () => {
    expect(normalizeAdminAppQuery({ pageNum: 2, pageSize: 50, id: '12', priority: 99 })).toMatchObject({
      pageNum: 2,
      pageSize: 50,
      id: '12',
      priority: 99,
    })
  })

  it('creates a cache-busted preview URL', () => {
    expect(buildPreviewUrl('http://localhost:8081/', 'multi_file', '42', 7)).toBe(
      'http://localhost:8081/static/multi_file_42/?v=7',
    )
  })

  it('allows administrators and owners to edit', () => {
    expect(canEditApp({ role: 'user', userId: '1', ownerId: '2' })).toBe(false)
    expect(canEditApp({ role: 'user', userId: '2', ownerId: '2' })).toBe(true)
    expect(canEditApp({ role: 'admin', userId: '1', ownerId: '2' })).toBe(true)
  })

  it('accepts HTTP cover URLs only', () => {
    expect(isHttpUrl('https://example.com/cover.png')).toBe(true)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test and confirm the RED state**

Run: `cd ai-coding-front; npm run test:unit -- src/utils/app.spec.ts`

Expected: FAIL because `./app` does not exist.

- [ ] **Step 3: Define the application types**

Implement `AppId` as `string`; `AppVO` with nullable `appName`, `cover`, `initPrompt`, `codeGenType`, `deployKey`, dates, numeric `priority`, `userId`, and optional `UserVO`; `PageResult<T>` reuse through import from `@/types/user`; request types for add, deploy, user update, administrator update, and query; and `ChatMessage` with `id`, `role`, `content`, and `status`.

The query shape must be:

```ts
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
```

- [ ] **Step 4: Implement the pure domain rules**

Implement public page sizes as `8 | 12 | 20`, administrator page sizes as any positive integer, default sorting by `createTime desc`, trimming for text values, numeric-string validation for IDs, URL-safe segment encoding, and this permission signature:

```ts
export function canEditApp(input: {
  role: 'user' | 'admin'
  userId: string
  ownerId: string
}): boolean
```

Export `API_BASE_URL` from `services/http.ts` by removing trailing slashes once, and use it as the default first argument of `buildPreviewUrl`.

- [ ] **Step 5: Run the domain tests and type check**

Run: `cd ai-coding-front; npm run test:unit -- src/utils/app.spec.ts`

Expected: PASS, 5 tests.

Run: `cd ai-coding-front; npm run type-check`

Expected: exit code 0.

### Task 2: Application HTTP and SSE Services

**Files:**

- Create: `ai-coding-front/src/services/app.ts`
- Create: `ai-coding-front/src/services/appSse.ts`
- Create: `ai-coding-front/src/services/appSse.spec.ts`

- [ ] **Step 1: Write the failing SSE tests**

Test valid chunks, invalid payloads, `done`, transport errors, and `close()` through an injected EventSource factory:

```ts
import { describe, expect, it, vi } from 'vitest'
import { connectAppGeneration, parseGenerationChunk } from './appSse'

it('parses backend generation chunks', () => {
  expect(parseGenerationChunk('{"d":"hello"}')).toBe('hello')
  expect(parseGenerationChunk('{}')).toBe('')
  expect(() => parseGenerationChunk('not-json')).toThrow('AI 返回了无法解析的数据')
})

it('closes once after done', () => {
  const close = vi.fn()
  const listeners = new Map<string, EventListener>()
  const factory = vi.fn(() => ({
    addEventListener: (name: string, listener: EventListener) => listeners.set(name, listener),
    close,
    onmessage: null,
    onerror: null,
  }))
  const onDone = vi.fn()
  connectAppGeneration({ appId: '9', message: 'build', onChunk: vi.fn(), onDone, onError: vi.fn(), factory })
  listeners.get('done')?.(new Event('done'))
  expect(onDone).toHaveBeenCalledOnce()
  expect(close).toHaveBeenCalledOnce()
})
```

- [ ] **Step 2: Run the SSE tests and confirm the RED state**

Run: `cd ai-coding-front; npm run test:unit -- src/services/appSse.spec.ts`

Expected: FAIL because `appSse.ts` does not exist.

- [ ] **Step 3: Implement every JSON endpoint**

`services/app.ts` must expose:

```ts
addApp(requestData): Promise<string>
getApp(id): Promise<AppVO>
getAppByAdmin(id): Promise<AppVO>
updateApp(requestData): Promise<boolean>
updateAppByAdmin(requestData): Promise<boolean>
deleteApp(id): Promise<boolean>
deleteAppByAdmin(id): Promise<boolean>
deployApp(appId): Promise<string>
listMyApps(query): Promise<PageResult<AppVO>>
listGoodApps(query): Promise<PageResult<AppVO>>
listAppsByAdmin(query): Promise<PageResult<AppVO>>
```

Normalize every numeric backend ID to `string`, recursively normalize `user.id`, and coerce `totalRow` to `number` like `services/user.ts`.

- [ ] **Step 4: Implement the EventSource client**

Build the URL with `URL` and `searchParams`, set `{ withCredentials: true }`, append message chunks through `onmessage`, listen for named `done`, close exactly once, and report a user-readable `Error` for invalid data or transport failure. Return `{ close(): void }` so views can close it in `onBeforeUnmount`.

- [ ] **Step 5: Run SSE tests and all unit tests**

Run: `cd ai-coding-front; npm run test:unit -- src/services/appSse.spec.ts`

Expected: PASS.

Run: `cd ai-coding-front; npm run test:unit`

Expected: all tests pass.

### Task 3: Design Tokens, Routes, and Layout Modes

**Files:**

- Create: `ai-coding-front/tokens.css`
- Modify: `ai-coding-front/src/main.ts`
- Modify: `ai-coding-front/src/router/index.ts`
- Modify: `ai-coding-front/src/layouts/BasicLayout.vue`
- Modify: `ai-coding-front/src/components/GlobalHeader.vue`

- [ ] **Step 1: Add the shared token system**

Create a Hallmark-stamped `tokens.css` with OKLCH color tokens, the existing Chinese system font stack as `--font-body`, a distinct system display stack as `--font-display`, a 4-point spacing scale, radii no larger than 8px for cards, focus colors, and three easing/duration groups. Import it before Ant Design reset in `main.ts`.

- [ ] **Step 2: Add application routes and authorization**

Add lazy routes for `/app/:id/chat`, `/app/:id/edit`, and `/app/manage`. Extend route metadata declarations so TypeScript knows `requiresAuth`, `requiresAdmin`, and `immersive`. The guard order must initialize the user, then handle `requiresAuth`, then `requiresAdmin`, then `guestOnly`.

- [ ] **Step 3: Add immersive layout rendering**

Use `useRoute()` in `BasicLayout.vue`. When `route.meta.immersive` is true, render only the transitioning router view in a full-viewport container. Standard routes retain global header, constrained content, and footer.

- [ ] **Step 4: Add administrator navigation**

Add separate “用户管理” and “应用管理” entries to the authenticated administrator dropdown. Route `/app/manage` from an `appManage` key without changing the ordinary user menu.

- [ ] **Step 5: Verify types and build**

Run: `cd ai-coding-front; npm run type-check`

Expected: exit code 0.

Run: `cd ai-coding-front; npm run build-only`

Expected: Vite build succeeds.

### Task 4: Shared Application Components

**Files:**

- Create: `ai-coding-front/src/components/app/AppCard.vue`
- Create: `ai-coding-front/src/components/app/AppListSection.vue`
- Create: `ai-coding-front/src/components/app/PromptComposer.vue`
- Create: `ai-coding-front/src/components/app/AppDetailDrawer.vue`
- Create: `ai-coding-front/src/components/app/ChatMessageList.vue`
- Create: `ai-coding-front/src/components/app/AppPreviewPanel.vue`

- [ ] **Step 1: Implement stable application cards and list sections**

`AppCard` props: `app`, `editable`, `deletable`; emits `open`, `edit`, `delete`, `deploy`. The card uses a fixed `16 / 10` cover ratio, sanitizes cover URLs through `isHttpUrl`, and exposes a keyboard-focusable main action. `AppListSection` props: title, items, loading, total, page, pageSize, emptyText; emits search, page, open, edit, delete, deploy.

- [ ] **Step 2: Implement the prompt composer**

Props: `modelValue`, `loading`, `placeholder`, `submitLabel`, `maxLength`; emits `update:modelValue` and `submit`. Submit on button click or Ctrl/Cmd+Enter, reject blank input, keep the textarea height stable, and expose loading/disabled states.

- [ ] **Step 3: Implement detail and chat components**

`AppDetailDrawer` renders all `AppVO` fields and emits edit. `ChatMessageList` renders user messages on the right, AI messages on the left, preserves newlines, and shows generating/error states without parsing returned content as HTML.

- [ ] **Step 4: Implement the preview panel**

Props: `url`, `loading`; emits `refresh`. Show a blank-state icon before generation, a spinner while loading, a retry action on iframe error, a compact toolbar with refresh and open-new-tab, and a sandboxed iframe allowing scripts, forms, modals, popups, and same-origin content.

- [ ] **Step 5: Verify focused components**

Run: `cd ai-coding-front; npm run type-check`

Expected: exit code 0.

Run: `cd ai-coding-front; npm run lint`

Expected: exit code 0 with no new warnings.

### Task 5: Home Creation Workspace

**Files:**

- Modify: `ai-coding-front/src/views/HomeView.vue`

- [ ] **Step 1: Replace the existing learning landing page**

Build an unframed hero with product name, one-sentence subtitle, `PromptComposer`, and four prompt suggestions. Place “我的应用” and “精选应用” as full-width sections below it; do not nest cards inside section cards.

- [ ] **Step 2: Wire create and login behavior**

When logged out, preserve the entered prompt in `sessionStorage` and route to `/login?redirect=/`. On return, restore but do not auto-submit it. When logged in, call `addApp`, then route to `{ name: 'app-chat', params: { id }, query: { autoStart: '1' } }`.

- [ ] **Step 3: Wire independent paged lists**

Load personal apps only when authenticated. Always load featured apps. Keep separate page, search, loading, total, and error state. Delete personal applications through `Modal.confirm`; adjust the page when deleting the only item on a non-first page.

- [ ] **Step 4: Verify the page**

Run: `cd ai-coding-front; npm run type-check`

Expected: exit code 0.

Run: `cd ai-coding-front; npm run build-only`

Expected: Vite build succeeds.

### Task 6: SSE Chat, Preview, and Deploy Workbench

**Files:**

- Create: `ai-coding-front/src/views/AppChatView.vue`

- [ ] **Step 1: Load application context and consume auto-start once**

Validate the route ID, fetch the app, seed the transcript with `initPrompt`, detect ownership, and replace the route immediately without `autoStart` before opening SSE. A normal reload without `autoStart` must never regenerate.

- [ ] **Step 2: Implement streaming messages**

For each send, append a user message and empty assistant message. Update only that assistant message in `onChunk`. Set it to complete in `onDone`, or error in `onError` while retaining partial text. Close an existing stream before retrying and in `onBeforeUnmount`.

- [ ] **Step 3: Refresh preview only at valid times**

Before generation completes, show the preview empty state unless an existing generated URL loads successfully. On `done`, rebuild the preview URL with `Date.now()` as the cache key. Keep preview failures local to the right panel.

- [ ] **Step 4: Implement deployment**

Disable deploy while generating or deploying. After success, show the returned URL in a result modal with copy and open actions. Use `window.open(url, '_blank', 'noopener,noreferrer')` only after `isHttpUrl(url)` passes.

- [ ] **Step 5: Implement responsive workbench layout**

Use a stable 420px-to-520px conversation column and `minmax(0, 1fr)` preview column on desktop. Below 900px render a segmented “对话 / 预览” control and only one panel. Ensure message input remains reachable with viewport-height constraints.

- [ ] **Step 6: Verify chat behavior**

Run: `cd ai-coding-front; npm run test:unit`

Expected: all tests pass.

Run: `cd ai-coding-front; npm run type-check`

Expected: exit code 0.

### Task 7: Edit and Administrator Management

**Files:**

- Create: `ai-coding-front/src/views/AppEditView.vue`
- Create: `ai-coding-front/src/views/AppManagementView.vue`

- [ ] **Step 1: Implement the permission-aware edit page**

Administrators fetch with `getAppByAdmin`; users fetch with `getApp`. Reject a non-admin non-owner before rendering the form. Users edit only `appName`; administrators additionally edit `cover` and `priority`. Validate name length 1–128, HTTP(S) cover URL when present, and integer priority. Save through the role-specific endpoint.

- [ ] **Step 2: Implement administrator filters and table**

Mirror `UserManagementView.vue` structure. Include filters for ID, name, cover, initial prompt, code type, deploy key, priority, and user ID. Show columns for ID, cover, name, code type, owner, priority, deployment, created time, and actions. Use unrestricted positive page sizes 10, 20, 50, and 100.

- [ ] **Step 3: Implement administrator actions**

View opens `AppDetailDrawer`; edit navigates to `/app/{id}/edit?from=/app/manage`; delete calls the administrator endpoint after confirmation; featured calls `updateAppByAdmin({ id, priority: 99 })` directly and refreshes the current page.

- [ ] **Step 4: Verify permissions and administration**

Run: `cd ai-coding-front; npm run test:unit`

Expected: all tests pass.

Run: `cd ai-coding-front; npm run type-check`

Expected: exit code 0.

Run: `cd ai-coding-front; npm run build-only`

Expected: Vite build succeeds.

### Task 8: Final Quality and Visual Verification

**Files:**

- Modify only files already listed when verification reveals a scoped defect.
- Create: `ai-coding-front/.hallmark/preflight.json`
- Create: `ai-coding-front/.hallmark/log.json`

- [ ] **Step 1: Run the complete automated suite**

Run: `cd ai-coding-front; npm run test:unit`

Expected: all tests pass.

Run: `cd ai-coding-front; npm run type-check`

Expected: exit code 0.

Run: `cd ai-coding-front; npm run lint`

Expected: exit code 0.

Run: `cd ai-coding-front; npm run build-only`

Expected: Vite emits `dist` successfully.

- [ ] **Step 2: Start the frontend on an unused local port**

Run: `cd ai-coding-front; npm run dev -- --host 127.0.0.1 --port 5173`

Expected: Vite reports a local URL and remains running.

- [ ] **Step 3: Verify desktop and mobile layout**

Create an application through the homepage, record the returned application ID from the resulting route, then capture and inspect `/`, that application's chat route, that application's edit route, and `/app/manage` at 1440x900, 768x1024, 414x896, 375x812, and 320x720. Verify no horizontal scroll, overlapping text, blank generated preview after `done`, duplicate auto-start request, or inaccessible controls.

- [ ] **Step 4: Verify user journeys against the 8081 backend**

Test login, prompt creation, initial SSE generation, a follow-up message, preview refresh, deploy/open, personal search/pagination/delete, edit, administrator search/detail/featured/delete, and denial for non-admin and non-owner routes.

- [ ] **Step 5: Run the Hallmark handoff checks**

Run the 58-gate slop test, pre-emit critique, responsive checks, and output contract. Fix every failing gate before handoff, then record the chosen Workbench macrostructure and theme in `.hallmark/log.json`.
