# Frontend User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Vue 3 user identity and administrator user-management experience defined in `docs/frontend-user-management-requirements.md`.

**Architecture:** Keep API contracts, session handling, user state, and presentation separate. `services/` owns Axios calls, the Pinia store owns the current session, and views/components own form and table interactions. API-only constraints, including current-page CSV export and string user IDs, stay in a small utility module shared by the management view.

**Tech Stack:** Vue 3 Composition API, TypeScript, Pinia, Vue Router, Axios, Ant Design Vue, Vitest.

---

### Task 1: Create Frontend Test Harness and Core User Utilities

**Files:**
- Modify: `ai-coding-front/package.json`
- Create: `ai-coding-front/vitest.config.ts`
- Create: `ai-coding-front/src/utils/user.ts`
- Create: `ai-coding-front/src/utils/user.spec.ts`

- [ ] **Step 1: Add a failing test for API input normalization and CSV escaping**

```ts
import { describe, expect, it } from 'vitest'
import { buildUserCsv, normalizeUserQuery } from './user'

describe('normalizeUserQuery', () => {
  it('trims filters and removes empty values', () => {
    expect(normalizeUserQuery({ pageNum: 0, pageSize: 5, userAccount: '  alice  ', userName: ' ' }))
      .toEqual({ pageNum: 1, pageSize: 10, sortField: 'createTime', sortOrder: 'descend', userAccount: 'alice' })
  })
})

describe('buildUserCsv', () => {
  it('quotes comma, quote and newline fields', () => {
    expect(buildUserCsv([{ id: '1', userAccount: 'alice', userName: 'A, "B"', userAvatar: null, userProfile: 'first\nline', userRole: 'user', createTime: null }]))
      .toContain('"A, ""B"""')
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails because the utility module does not exist**

Run: `npm run test:unit -- src/utils/user.spec.ts`

Expected: FAIL with module resolution error for `./user`.

- [ ] **Step 3: Add the minimal shared types and utility implementation**

```ts
export function normalizeUserQuery(input: UserQueryInput): UserQueryRequest {
  return {
    pageNum: Math.max(1, input.pageNum || 1),
    pageSize: [10, 20, 50, 100].includes(input.pageSize) ? input.pageSize : 10,
    sortField: input.sortField || 'createTime',
    sortOrder: input.sortOrder || 'descend',
    ...removeBlankFilters(input),
  }
}
```

Implement `buildUserCsv` with a UTF-8 BOM and CSV quote escaping. Keep all user IDs as `string`.

- [ ] **Step 4: Re-run the focused test and verify it passes**

Run: `npm run test:unit -- src/utils/user.spec.ts`

Expected: PASS, 2 tests.

### Task 2: Add Typed User API and Session Store

**Files:**
- Create: `ai-coding-front/src/types/user.ts`
- Create: `ai-coding-front/src/services/http.ts`
- Create: `ai-coding-front/src/services/user.ts`
- Create: `ai-coding-front/src/stores/user.ts`
- Create: `ai-coding-front/src/stores/user.spec.ts`

- [ ] **Step 1: Add a failing store test for a silent unauthenticated bootstrap**

```ts
it('treats 40100 while bootstrapping as a logged-out state', async () => {
  mockGetLoginUser.mockRejectedValue(new ApiError(40100, '未登录'))
  const store = useUserStore()
  await store.fetchLoginUser({ silent: true })
  expect(store.loginUser).toBeNull()
  expect(store.initialized).toBe(true)
})
```

- [ ] **Step 2: Run the store test and verify it fails because the store does not exist**

Run: `npm run test:unit -- src/stores/user.spec.ts`

Expected: FAIL with module resolution error for `./user`.

- [ ] **Step 3: Implement contracts, Axios envelope handling, user API, and store**

```ts
export const useUserStore = defineStore('user', () => {
  const loginUser = ref<LoginUserVO | null>(null)
  const initialized = ref(false)
  async function fetchLoginUser(options: { silent?: boolean } = {}) { /* getLoginUser + 40100 handling */ }
  async function login(request: UserLoginRequest) { /* persist returned LoginUserVO */ }
  async function logout() { /* clear local state only after request resolves */ }
  return { loginUser, initialized, fetchLoginUser, login, logout, clearLoginUser }
})
```

Axios must use `baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'`, `withCredentials: true`, and throw `ApiError` for non-zero response envelopes.

- [ ] **Step 4: Re-run the store test and verify it passes**

Run: `npm run test:unit -- src/stores/user.spec.ts`

Expected: PASS.

### Task 3: Implement Identity Pages and Route Guards

**Files:**
- Create: `ai-coding-front/src/views/LoginView.vue`
- Create: `ai-coding-front/src/views/RegisterView.vue`
- Modify: `ai-coding-front/src/router/index.ts`
- Modify: `ai-coding-front/src/views/HomeView.vue`

- [ ] **Step 1: Add failing validation tests for shared account and password rules**

```ts
it('rejects a registration password confirmation mismatch', () => {
  expect(validateRegistration({ userAccount: 'alice', userPassword: 'password1', checkPassword: 'password2' }))
    .toEqual({ checkPassword: '两次输入的密码不一致' })
})
```

- [ ] **Step 2: Run the test and verify it fails because validation is not implemented**

Run: `npm run test:unit -- src/utils/user.spec.ts`

Expected: FAIL because `validateRegistration` is not exported.

- [ ] **Step 3: Implement pages and guards**

```ts
router.beforeEach(async (to) => {
  const store = useUserStore()
  if (!store.initialized) await store.fetchLoginUser({ silent: true })
  if (to.meta.requiresAdmin && store.loginUser?.userRole !== 'admin') {
    return store.loginUser ? '/' : { path: '/login', query: { redirect: to.fullPath } }
  }
})
```

Login and registration forms must disable duplicate submissions, show field-level Ant Design errors, trim accounts, and never retain a password after a failed submit. Home actions navigate to the new routes.

- [ ] **Step 4: Re-run unit tests and type checking**

Run: `npm run test:unit -- src/utils/user.spec.ts && npm run type-check`

Expected: PASS and exit code 0.

### Task 4: Build Administrator User Management Components

**Files:**
- Create: `ai-coding-front/src/components/user/UserFormModal.vue`
- Create: `ai-coding-front/src/components/user/UserDetailDrawer.vue`
- Create: `ai-coding-front/src/views/UserManagementView.vue`
- Modify: `ai-coding-front/src/router/index.ts`

- [ ] **Step 1: Add failing CSV and ID validation tests used by the management page**

```ts
it('rejects a non-numeric ID filter', () => {
  expect(isUserId('abc')).toBe(false)
  expect(isUserId('123456789')).toBe(true)
})
```

- [ ] **Step 2: Run the test and verify it fails because `isUserId` is missing**

Run: `npm run test:unit -- src/utils/user.spec.ts`

Expected: FAIL because `isUserId` is not exported.

- [ ] **Step 3: Implement management view and controlled components**

```ts
async function loadUsers() {
  loading.value = true
  try {
    const page = await listUsers(normalizeUserQuery(query.value))
    users.value = page.records
    total.value = Number(page.totalRow)
  } finally {
    loading.value = false
  }
}
```

Use `POST /user/list/page/vo`, client-side current-page CSV export, and a whitelist of sortable fields. The form modal must use separate create and edit payloads; it must never include an account or password in an update request. The detail drawer consumes the selected `UserVO` and never calls `/user/get`.

- [ ] **Step 4: Re-run focused tests and type checking**

Run: `npm run test:unit -- src/utils/user.spec.ts && npm run type-check`

Expected: PASS and exit code 0.

### Task 5: Integrate Session-Aware Global Header and Verify the UI

**Files:**
- Modify: `ai-coding-front/src/components/GlobalHeader.vue`
- Modify: `ai-coding-front/src/layouts/BasicLayout.vue`
- Modify: `ai-coding-front/src/App.vue`

- [ ] **Step 1: Implement conditional header actions**

```ts
const isAdmin = computed(() => userStore.loginUser?.userRole === 'admin')
async function confirmLogout() {
  await userStore.logout()
  await router.push('/')
}
```

The header must display login/register for visitors; display a user dropdown, role tag, management action for administrators, and a confirmation-backed logout action for authenticated users.

- [ ] **Step 2: Build the frontend and run all unit checks**

Run: `npm run test:unit && npm run type-check && npm run build-only`

Expected: all commands exit 0.

- [ ] **Step 3: Run Vite and verify responsive routes in the browser**

Run: `npm run dev -- --host 127.0.0.1 --port 5173`

Verify: `/login`, `/register`, and `/user/manage` render without layout overlap on desktop and mobile viewports; unauthenticated navigation to `/user/manage` redirects to `/login`.

### Task 6: Review Requirement Coverage

**Files:**
- Modify: `docs/frontend-user-management-requirements.md` only if an implemented behavior differs from the approved contract.

- [ ] **Step 1: Compare the implementation against sections 1 through 9 of the requirements document**

Check identity pages, session behavior, routing, forms, list operations, mapping, CSV scope, error behavior, and UI interactions one by one.

- [ ] **Step 2: Run final verification**

Run: `npm run test:unit && npm run type-check && npm run build`

Expected: all commands exit 0.
