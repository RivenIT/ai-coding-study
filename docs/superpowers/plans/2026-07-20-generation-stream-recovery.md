# Generation Stream Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure a failed AI generation stream reports an actionable error and never removes an already rendered preview indefinitely.

**Architecture:** The backend converts any asynchronous generation failure into a `business-error` SSE event followed by `done`. The frontend preserves the existing iframe while a generation is running and settles the stream after an inactivity timeout, exposing the existing retry action.

**Tech Stack:** Spring MVC, Reactor, Server-Sent Events, Vue 3, TypeScript, Vitest.

---

### Task 1: SSE Error Contract

**Files:**
- Modify: `src/main/java/com/zlj/aicodingstudy/controller/AppController.java`
- Test: `src/test/java/com/zlj/aicodingstudy/controller/AppControllerTest.java`

- [ ] Write a controller test for a failing `Flux` that expects `business-error` followed by `done`.
- [ ] Run `mvn -Dtest=AppControllerTest test` and confirm the test fails before the operator is added.
- [ ] Add `onErrorResume` after chunk mapping to emit the two terminal SSE events.
- [ ] Re-run `mvn -Dtest=AppControllerTest test` and confirm it passes.

### Task 2: Preview Preservation and Stream Timeout

**Files:**
- Modify: `ai-coding-front/src/services/appSse.ts`
- Modify: `ai-coding-front/src/views/AppChatView.vue`
- Modify: `ai-coding-front/src/components/app/AppPreviewPanel.vue`
- Test: `ai-coding-front/src/__tests__/app-sse.spec.ts`
- Test: `ai-coding-front/src/__tests__/app-chat-bugs.spec.ts`

- [ ] Write a failing `appSse` test that advances a fake timer and expects `onError` and source closure after stream inactivity.
- [ ] Write a failing chat-view regression assertion that sending a message does not pass generation state as preview loading.
- [ ] Run the two Vitest files and confirm both tests fail before implementation.
- [ ] Add a resettable inactivity timer to `connectAppGeneration`, resetting it on each received SSE event and clearing it on settlement.
- [ ] Stop assigning `previewLoading` when a message is sent; refresh only after the successful `done` event.
- [ ] Keep the current iframe mounted while a replacement URL is being checked, using a non-blocking loading overlay.
- [ ] Re-run focused Vitest files and confirm they pass.

### Task 3: Verification

**Files:**
- Verify: backend and frontend test suites

- [ ] Run `mvn test`.
- [ ] Run `npm run test:unit` in `ai-coding-front`.
- [ ] Run `npm run build` in `ai-coding-front`.
- [ ] Manually send one prompt against a Redis-authenticated backend and confirm either updated preview content or a visible retry error without losing the existing preview.
