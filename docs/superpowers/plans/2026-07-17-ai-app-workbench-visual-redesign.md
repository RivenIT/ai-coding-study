# AI App Workbench Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved reference-inspired product-workbench visual system to every frontend route without changing frontend behavior or backend contracts.

**Architecture:** Centralize the visual language in `tokens.css` and global Ant Design overrides, then consume those tokens in shared layout components and each route-specific scoped stylesheet. Preserve all script blocks, request modules, stores, router definitions, form bindings, and event handlers; change template structure only where required to establish the homepage gallery and consistent visual hierarchy.

**Tech Stack:** Vue 3, TypeScript, Vite, Ant Design Vue, Pinia, Vitest, CSS custom properties.

---

### Task 1: Establish the Shared Visual Foundation

**Files:**
- Modify: `ai-coding-front/tokens.css`
- Modify: `ai-coding-front/src/main.ts`
- Modify: `ai-coding-front/src/App.vue`
- Test: `ai-coding-front/src/__tests__/visual-tokens.spec.ts`

- [ ] **Step 1: Write the failing token contract test**

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const tokens = readFileSync(new URL('../../tokens.css', import.meta.url), 'utf8')

describe('visual token contract', () => {
  it('defines the paper, cyan-blue action, rule, and focus tokens used by the workbench', () => {
    expect(tokens).toContain('--color-paper:')
    expect(tokens).toContain('--color-field-cyan:')
    expect(tokens).toContain('--color-field-blue:')
    expect(tokens).toContain('--color-rule:')
    expect(tokens).toContain('--color-focus:')
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails before the new field tokens exist**

Run: `npm run test:unit -- src/__tests__/visual-tokens.spec.ts`

Expected: FAIL because `--color-field-cyan` and `--color-field-blue` are absent.

- [ ] **Step 3: Implement the shared token and Ant Design foundation**

Update `tokens.css` to expose neutral paper/panel/ink values, cyan-blue field/action values, compact radii, shadows, font stacks, focus rules, reduced-motion rules, and normalized Ant Design control/table/pagination styles. Keep the import in `src/main.ts` before application mount and reset global element sizing in `src/App.vue` without changing application setup.

- [ ] **Step 4: Re-run the focused test**

Run: `npm run test:unit -- src/__tests__/visual-tokens.spec.ts`

Expected: PASS.

### Task 2: Rebuild the Standard Shell and Navigation

**Files:**
- Modify: `ai-coding-front/src/layouts/BasicLayout.vue`
- Modify: `ai-coding-front/src/components/GlobalHeader.vue`
- Modify: `ai-coding-front/src/components/GlobalFooter.vue`
- Test: `ai-coding-front/src/__tests__/header-style.spec.ts`

- [ ] **Step 1: Write the failing shared chrome test**

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const header = readFileSync(new URL('../components/GlobalHeader.vue', import.meta.url), 'utf8')
const layout = readFileSync(new URL('../layouts/BasicLayout.vue', import.meta.url), 'utf8')

describe('shared chrome styling', () => {
  it('uses the shared paper and rule tokens instead of local blue gradients', () => {
    expect(header).toContain('var(--color-paper)')
    expect(header).not.toContain('linear-gradient(135deg, #1890ff')
    expect(layout).toContain('var(--color-paper-soft)')
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails against the existing gradient header**

Run: `npm run test:unit -- src/__tests__/header-style.spec.ts`

Expected: FAIL because the header still contains its local blue gradient.

- [ ] **Step 3: Implement the framed shared shell**

Restyle the shell, navigation, user controls, active menu state, and footer using the global tokens. Keep existing navigation destinations, login/logout behavior, dropdown options, and responsive menu semantics intact. Remove purely decorative logo float, dot pulse, and hover elevation effects.

- [ ] **Step 4: Re-run the focused test**

Run: `npm run test:unit -- src/__tests__/header-style.spec.ts`

Expected: PASS.

### Task 3: Redesign the Homepage Creation and Gallery Flow

**Files:**
- Modify: `ai-coding-front/src/views/HomeView.vue`
- Modify: `ai-coding-front/src/components/app/PromptComposer.vue`
- Modify: `ai-coding-front/src/components/app/AppListSection.vue`
- Modify: `ai-coding-front/src/components/app/AppCard.vue`
- Test: `ai-coding-front/src/__tests__/home-style.spec.ts`

- [ ] **Step 1: Write the failing homepage style test**

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const home = readFileSync(new URL('../views/HomeView.vue', import.meta.url), 'utf8')

describe('homepage visual hierarchy', () => {
  it('keeps the app lists inside a dedicated work gallery after the field hero', () => {
    expect(home).toContain('work-gallery')
    expect(home).toContain('var(--color-field-cyan)')
    expect(home).toContain('var(--color-field-blue)')
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails before the gallery surface exists**

Run: `npm run test:unit -- src/__tests__/home-style.spec.ts`

Expected: FAIL because the page does not yet contain `work-gallery`.

- [ ] **Step 3: Implement the creation field and gallery surface**

Keep all existing home view loading, prompt submit, routing, search, paging, edit, delete, and deploy handlers. Replace only the presentation structure and CSS so the hero uses the original cyan-blue field treatment and both list sections sit in one white gallery surface. Restyle the composer and card components into compatible gallery elements using tokens.

- [ ] **Step 4: Re-run the focused test**

Run: `npm run test:unit -- src/__tests__/home-style.spec.ts`

Expected: PASS.

### Task 4: Apply the System to Authentication and Informational Routes

**Files:**
- Modify: `ai-coding-front/src/views/LoginView.vue`
- Modify: `ai-coding-front/src/views/RegisterView.vue`
- Modify: `ai-coding-front/src/views/AboutView.vue`
- Test: `ai-coding-front/src/__tests__/auth-surface.spec.ts`

- [ ] **Step 1: Write the failing authentication style test**

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const login = readFileSync(new URL('../views/LoginView.vue', import.meta.url), 'utf8')
const register = readFileSync(new URL('../views/RegisterView.vue', import.meta.url), 'utf8')

describe('auth visual consistency', () => {
  it('uses the shared surface tokens in both authentication pages', () => {
    expect(login).toContain('var(--color-panel)')
    expect(register).toContain('var(--color-panel)')
    expect(login).not.toContain('border-radius: 24px')
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails against the old auth card styles**

Run: `npm run test:unit -- src/__tests__/auth-surface.spec.ts`

Expected: FAIL because the login page uses a local 24 pixel card radius.

- [ ] **Step 3: Implement calm form and information surfaces**

Retain all forms, validation messages, redirects, and submit handlers. Update only the visual structure and styles to use the shared neutral canvas, compact framed panels, type hierarchy, and action colors; bring the about route into the same system.

- [ ] **Step 4: Re-run the focused test**

Run: `npm run test:unit -- src/__tests__/auth-surface.spec.ts`

Expected: PASS.

### Task 5: Apply Dense Operational Styling to Management and Editing

**Files:**
- Modify: `ai-coding-front/src/views/UserManagementView.vue`
- Modify: `ai-coding-front/src/views/AppManagementView.vue`
- Modify: `ai-coding-front/src/views/AppEditView.vue`
- Modify: `ai-coding-front/src/components/user/UserFormModal.vue`
- Modify: `ai-coding-front/src/components/user/UserDetailDrawer.vue`
- Modify: `ai-coding-front/src/components/app/AppDetailDrawer.vue`
- Test: `ai-coding-front/src/__tests__/management-style.spec.ts`

- [ ] **Step 1: Write the failing operational view style test**

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const users = readFileSync(new URL('../views/UserManagementView.vue', import.meta.url), 'utf8')
const apps = readFileSync(new URL('../views/AppManagementView.vue', import.meta.url), 'utf8')

describe('management view style consistency', () => {
  it('uses the shared rule and panel tokens in both management filters', () => {
    expect(users).toContain('var(--color-rule)')
    expect(users).toContain('var(--color-panel)')
    expect(apps).toContain('var(--color-rule)')
    expect(apps).toContain('var(--color-panel)')
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails while user management uses hard-coded colors**

Run: `npm run test:unit -- src/__tests__/management-style.spec.ts`

Expected: FAIL because `UserManagementView.vue` contains hard-coded filter colors.

- [ ] **Step 3: Implement the dense operational treatment**

Use shared title bands, query surfaces, table borders, field spacing, drawer summaries, and responsive stacking. Preserve all filter bindings, sortable columns, form submit behavior, delete confirmations, paging, CSV export, and edit navigation.

- [ ] **Step 4: Re-run the focused test**

Run: `npm run test:unit -- src/__tests__/management-style.spec.ts`

Expected: PASS.

### Task 6: Bring the Generation Workbench into the Shared System

**Files:**
- Modify: `ai-coding-front/src/views/AppChatView.vue`
- Modify: `ai-coding-front/src/components/app/ChatMessageList.vue`
- Modify: `ai-coding-front/src/components/app/AppPreviewPanel.vue`
- Test: `ai-coding-front/src/__tests__/workbench-style.spec.ts`

- [ ] **Step 1: Write the failing workbench style test**

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const chat = readFileSync(new URL('../views/AppChatView.vue', import.meta.url), 'utf8')
const messages = readFileSync(new URL('../components/app/ChatMessageList.vue', import.meta.url), 'utf8')

describe('generation workbench style consistency', () => {
  it('uses the shared paper surface and cyan-blue user message tokens', () => {
    expect(chat).toContain('var(--color-paper-soft)')
    expect(messages).toContain('var(--color-accent-strong)')
    expect(messages).toContain('var(--color-rule)')
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails if the shared workbench tokens are not present**

Run: `npm run test:unit -- src/__tests__/workbench-style.spec.ts`

Expected: FAIL until the shared visual rules are in place.

- [ ] **Step 3: Implement the workbench treatment**

Keep generation streaming, retry, deployment, preview, responsive panel switch, and modal behavior exactly as implemented. Update the topbar, pane borders, message bubble hierarchy, composer framing, and preview controls to use the common panel and rule system without adding decorative browser chrome.

- [ ] **Step 4: Re-run the focused test**

Run: `npm run test:unit -- src/__tests__/workbench-style.spec.ts`

Expected: PASS.

### Task 7: Run Full Verification and Visual Inspection

**Files:**
- Modify: none
- Test: existing frontend test suite

- [ ] **Step 1: Run all frontend unit tests**

Run: `npm run test:unit`

Expected: all Vitest tests pass.

- [ ] **Step 2: Run type checking and production build**

Run: `npm run build`

Expected: Vue type-check and Vite build complete successfully.

- [ ] **Step 3: Inspect all route groups in the running frontend**

Open `http://localhost:5173` and inspect the homepage, login, register, about, management, application edit, and app chat at desktop plus 320, 375, 414, and 768 pixel widths. Confirm no horizontal scrolling, no text overlap, and no behavior regressions in route transitions or form controls.

- [ ] **Step 4: Review the final diff for behavior scope**

Run: `git diff -- ai-coding-front`

Expected: visual/component structure and focused style tests change; API service, store, and route behavior remain intact.
