<template>
  <section class="auth-page">
    <a-card class="auth-card" :bordered="false">
      <div class="auth-heading">
        <span class="eyebrow">WELCOME BACK</span>
        <h1>登录平台</h1>
        <p>登录后可继续你的 AI 编程学习之旅</p>
      </div>

      <a-alert v-if="submitError" class="submit-error" type="error" show-icon :message="submitError" />

      <a-form :model="form" layout="vertical" @finish="handleLogin">
        <a-form-item label="账号" :validate-status="errors.userAccount ? 'error' : undefined" :help="errors.userAccount">
          <a-input v-model:value="form.userAccount" size="large" autocomplete="username" placeholder="请输入账号" @input="clearError('userAccount')">
            <template #prefix><UserOutlined /></template>
          </a-input>
        </a-form-item>
        <a-form-item label="密码" :validate-status="errors.userPassword ? 'error' : undefined" :help="errors.userPassword">
          <a-input-password v-model:value="form.userPassword" size="large" autocomplete="current-password" placeholder="请输入密码" @input="clearError('userPassword')">
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>
        <a-button class="submit-button" type="primary" html-type="submit" size="large" block :loading="submitting">
          登录
        </a-button>
      </a-form>

      <p class="auth-footer">
        还没有账号？
        <router-link :to="{ path: '/register', query: getRedirectQuery() }">立即注册</router-link>
      </p>
    </a-card>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { LockOutlined, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/services/http'
import { useUserStore } from '@/stores/user'
import { getSafeRedirectPath, validateLogin } from '@/utils/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const submitting = ref(false)
const submitError = ref('')
const form = reactive({
  userAccount: typeof route.query.account === 'string' ? route.query.account : '',
  userPassword: '',
})
const errors = reactive<Record<string, string>>({})

function clearError(field: string) {
  delete errors[field]
  submitError.value = ''
}

function replaceErrors(nextErrors: Record<string, string>) {
  Object.keys(errors).forEach((key) => delete errors[key])
  Object.assign(errors, nextErrors)
}

function getRedirectPath(): string {
  return getSafeRedirectPath(route.query.redirect)
}

function getRedirectQuery(): Record<string, string> {
  const redirect = getRedirectPath()
  return redirect === '/' ? {} : { redirect }
}

async function handleLogin() {
  const payload = { userAccount: form.userAccount.trim(), userPassword: form.userPassword }
  const validationErrors = validateLogin(payload)
  replaceErrors(validationErrors)
  if (Object.keys(validationErrors).length > 0) return

  submitting.value = true
  submitError.value = ''
  try {
    await userStore.login(payload)
    message.success('登录成功')
    await router.replace(getRedirectPath())
  } catch (error) {
    form.userPassword = ''
    if (error instanceof ApiError && (error.code === 40100 || error.code === 40000)) {
      submitError.value = '账号或密码错误，请重新输入'
    } else if (error instanceof Error && error.message) {
      submitError.value = error.message
    } else {
      submitError.value = '登录失败，请稍后重试'
    }
  } finally {
    submitting.value = false
  }
}
</script>

