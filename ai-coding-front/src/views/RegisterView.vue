<template>
  <section class="auth-page">
    <a-card class="auth-card" :bordered="false">
      <div class="auth-heading">
        <span class="eyebrow">START LEARNING</span>
        <h1>创建账号</h1>
        <p>用一个账号开启 AI 编程学习之旅</p>
      </div>

      <a-alert v-if="submitError" class="submit-error" type="error" show-icon :message="submitError" />

      <a-form :model="form" layout="vertical" @finish="handleRegister">
        <a-form-item label="账号" :validate-status="errors.userAccount ? 'error' : undefined" :help="errors.userAccount">
          <a-input v-model:value="form.userAccount" size="large" autocomplete="username" placeholder="4-32 位字母、数字或下划线" @input="clearError('userAccount')">
            <template #prefix><UserOutlined /></template>
          </a-input>
        </a-form-item>
        <a-form-item label="密码" :validate-status="errors.userPassword ? 'error' : undefined" :help="errors.userPassword">
          <a-input-password v-model:value="form.userPassword" size="large" autocomplete="new-password" placeholder="8-64 位密码" @input="clearError('userPassword')">
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>
        <a-form-item label="确认密码" :validate-status="errors.checkPassword ? 'error' : undefined" :help="errors.checkPassword">
          <a-input-password v-model:value="form.checkPassword" size="large" autocomplete="new-password" placeholder="请再次输入密码" @input="clearError('checkPassword')">
            <template #prefix><SafetyOutlined /></template>
          </a-input-password>
        </a-form-item>
        <a-button class="submit-button" type="primary" html-type="submit" size="large" block :loading="submitting">
          注册账号
        </a-button>
      </a-form>

      <p class="auth-footer">已有账号？<router-link to="/login">返回登录</router-link></p>
    </a-card>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { LockOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { registerUser } from '@/services/user'
import { validateRegistration } from '@/utils/user'

const router = useRouter()
const submitting = ref(false)
const submitError = ref('')
const form = reactive({ userAccount: '', userPassword: '', checkPassword: '' })
const errors = reactive<Record<string, string>>({})

function clearError(field: string) {
  delete errors[field]
  submitError.value = ''
}

function replaceErrors(nextErrors: Record<string, string>) {
  Object.keys(errors).forEach((key) => delete errors[key])
  Object.assign(errors, nextErrors)
}

async function handleRegister() {
  const payload = { ...form, userAccount: form.userAccount.trim() }
  const validationErrors = validateRegistration(payload)
  replaceErrors(validationErrors)
  if (Object.keys(validationErrors).length > 0) return

  submitting.value = true
  submitError.value = ''
  try {
    await registerUser(payload)
    message.success('注册成功，请登录')
    await router.push({ path: '/login', query: { account: payload.userAccount } })
  } catch (error) {
    form.userPassword = ''
    form.checkPassword = ''
    submitError.value = error instanceof Error ? error.message : '注册失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auth-page { min-height: calc(100vh - 220px); display: grid; place-items: center; padding: var(--space-12) 0; }
.auth-card { width: min(100%, 460px); padding: var(--space-4); border: 1px solid var(--color-rule); border-radius: var(--radius-md); background: var(--color-panel-raised); box-shadow: var(--shadow-card); }
.auth-heading { margin-bottom: var(--space-8); text-align: left; }
.eyebrow { color: var(--color-accent-strong); font-size: 12px; font-weight: 800; letter-spacing: 0; }
.auth-heading h1 { margin: var(--space-2) 0; color: var(--color-ink); font-family: var(--font-display); font-size: 30px; }
.auth-heading p, .auth-footer { color: var(--color-muted); margin: 0; }
.submit-error { margin-bottom: var(--space-4); }
.submit-button { height: 44px; border-radius: var(--radius-sm); font-weight: 700; }
.auth-footer { margin-top: var(--space-6); text-align: center; }
.auth-footer a { color: var(--color-accent-strong); font-weight: 700; }
</style>
