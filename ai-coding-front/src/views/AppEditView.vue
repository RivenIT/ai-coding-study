<template>
  <main class="edit-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">APPLICATION</span>
        <h1>应用信息修改</h1>
        <p>{{ userStore.isAdmin ? '管理员可维护名称、封面和优先级' : '你可以修改自己应用的名称' }}</p>
      </div>
      <a-button @click="goBack">返回</a-button>
    </header>

    <a-spin :spinning="loading">
      <a-result v-if="loadError" status="warning" :title="loadError">
        <template #extra>
          <a-button type="primary" @click="goBack">返回</a-button>
        </template>
      </a-result>

      <a-form v-else class="edit-form" layout="vertical" @finish="save">
        <a-form-item label="应用名称" required :validate-status="nameError ? 'error' : undefined" :help="nameError">
          <a-input v-model:value="form.appName" :maxlength="128" show-count placeholder="请输入应用名称" />
        </a-form-item>

        <template v-if="userStore.isAdmin">
          <a-form-item label="应用封面" :validate-status="coverError ? 'error' : undefined" :help="coverError">
            <a-input v-model:value="form.cover" allow-clear placeholder="https://example.com/cover.png" />
          </a-form-item>
          <a-form-item label="优先级" :validate-status="priorityError ? 'error' : undefined" :help="priorityError">
            <a-input-number v-model:value="form.priority" :min="0" :precision="0" style="width: 180px" />
            <a-tag class="priority-tip" color="gold">99 为精选</a-tag>
          </a-form-item>
        </template>

        <a-space>
          <a-button type="primary" html-type="submit" :loading="saving">保存</a-button>
          <a-button @click="goBack">取消</a-button>
        </a-space>
      </a-form>
    </a-spin>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getApp, getAppByAdmin, updateApp, updateAppByAdmin } from '@/services/app'
import { ApiError } from '@/services/http'
import { useUserStore } from '@/stores/user'
import type { AppVO } from '@/types/app'
import { canEditApp, isHttpUrl, isNumericId } from '@/utils/app'
import { getSafeRedirectPath } from '@/utils/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const app = ref<AppVO | null>(null)
const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const nameError = ref('')
const coverError = ref('')
const priorityError = ref('')
let loadSeq = 0
const form = reactive({
  appName: '',
  cover: '',
  priority: 0,
})
const backTarget = computed(() => getSafeRedirectPath(route.query.from))

function resetEditState() {
  app.value = null
  loading.value = false
  saving.value = false
  loadError.value = ''
  nameError.value = ''
  coverError.value = ''
  priorityError.value = ''
  form.appName = ''
  form.cover = ''
  form.priority = 0
}

async function loadApp() {
  const requestId = ++loadSeq
  const id = String(route.params.id || '')
  if (!isNumericId(id)) {
    if (requestId === loadSeq) loadError.value = '应用 ID 不正确'
    return
  }

  loading.value = true
  try {
    const nextApp = userStore.isAdmin ? await getAppByAdmin(id) : await getApp(id)
    if (requestId !== loadSeq) return
    app.value = nextApp
    if (!canEditCurrentApp()) {
      loadError.value = '你没有权限编辑这个应用'
      return
    }
    form.appName = nextApp.appName || ''
    form.cover = nextApp.cover || ''
    form.priority = nextApp.priority
  } catch (error) {
    if (requestId !== loadSeq) return
    if (error instanceof ApiError && error.code === 40100) {
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
      return
    }
    loadError.value = error instanceof Error ? error.message : '加载应用失败'
  } finally {
    if (requestId === loadSeq) loading.value = false
  }
}

function canEditCurrentApp(): boolean {
  if (!app.value || !userStore.loginUser) return false
  return canEditApp({
    role: userStore.isAdmin ? 'admin' : 'user',
    userId: userStore.loginUser.id,
    ownerId: app.value.userId,
  })
}

function validate(): boolean {
  nameError.value = ''
  coverError.value = ''
  priorityError.value = ''
  const appName = form.appName.trim()

  if (!appName || appName.length > 128) {
    nameError.value = '应用名称长度为 1 到 128 个字符'
  }
  if (userStore.isAdmin && form.cover.trim() && !isHttpUrl(form.cover.trim())) {
    coverError.value = '封面必须是 http 或 https 链接'
  }
  if (userStore.isAdmin && !Number.isInteger(form.priority)) {
    priorityError.value = '优先级必须是整数'
  }

  return !nameError.value && !coverError.value && !priorityError.value
}

async function save() {
  if (!app.value || saving.value || !validate()) return
  saving.value = true
  try {
    if (userStore.isAdmin) {
      await updateAppByAdmin({
        id: app.value.id,
        appName: form.appName.trim(),
        cover: form.cover.trim(),
        priority: form.priority,
      })
    } else {
      await updateApp({ id: app.value.id, appName: form.appName.trim() })
    }
    message.success('保存成功')
    await router.push(backTarget.value)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}

function goBack() {
  void router.push(backTarget.value)
}

watch(
  () => route.params.id,
  () => {
    resetEditState()
    void loadApp()
  },
  { immediate: true },
)
</script>

<style scoped>
.edit-page {
  display: grid;
  gap: var(--space-6);
  max-width: 900px;
}

.page-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-6);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-rule);
}

.eyebrow {
  color: var(--color-accent-strong);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.page-header h1 {
  margin: var(--space-1) 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 28px;
}

.page-header p {
  margin: 0;
  color: var(--color-muted);
}

.edit-form {
  max-width: 760px;
  padding: var(--space-8);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-md);
  background: var(--color-panel-raised);
}

.priority-tip {
  margin-left: var(--space-3);
}

@media (max-width: 640px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .edit-form {
    padding: var(--space-4);
  }
}
</style>
