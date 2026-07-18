<template>
  <a-modal
    :open="open"
    :title="isEdit ? '编辑用户' : '新增用户'"
    :mask-closable="false"
    :confirm-loading="submitting"
    :ok-text="isEdit ? '保存修改' : '创建用户'"
    cancel-text="取消"
    width="560px"
    @cancel="close"
    @ok="submit"
  >
    <a-alert
      v-if="!isEdit"
      class="password-notice"
      type="info"
      show-icon
      message="新用户初始密码由服务端统一设置为 12345678。"
      description="当前后端尚未提供修改密码接口，请将初始密码通过安全渠道告知用户。"
    />
    <a-alert v-if="submitError" class="submit-error" type="error" show-icon :message="submitError" />

    <a-form layout="vertical">
      <a-form-item v-if="!isEdit" label="账号" :validate-status="errors.userAccount ? 'error' : undefined" :help="errors.userAccount">
        <a-input v-model:value="form.userAccount" placeholder="4-32 位字母、数字或下划线" @input="clearError('userAccount')" />
      </a-form-item>
      <a-form-item v-else label="账号">
        <a-input :value="user?.userAccount" disabled />
      </a-form-item>
      <a-form-item label="昵称" required :validate-status="errors.userName ? 'error' : undefined" :help="errors.userName">
        <a-input v-model:value="form.userName" :maxlength="32" show-count placeholder="请输入昵称" @input="clearError('userName')" />
      </a-form-item>
      <a-form-item label="头像地址" :validate-status="errors.userAvatar ? 'error' : undefined" :help="errors.userAvatar">
        <a-input v-model:value="form.userAvatar" :maxlength="512" placeholder="https://example.com/avatar.png" @input="clearError('userAvatar')" />
      </a-form-item>
      <a-form-item label="个人简介" :validate-status="errors.userProfile ? 'error' : undefined" :help="errors.userProfile">
        <a-textarea v-model:value="form.userProfile" :maxlength="500" :rows="4" show-count placeholder="请输入个人简介" @input="clearError('userProfile')" />
      </a-form-item>
      <a-form-item label="角色" required :validate-status="errors.userRole ? 'error' : undefined" :help="errors.userRole">
        <a-select v-model:value="form.userRole" :options="roleOptions" @change="clearError('userRole')" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { addUser, updateUser } from '@/services/user'
import type { UserRole, UserVO } from '@/types/user'
import { buildUserUpdateRequest, validateManagedUser } from '@/utils/user'

const props = defineProps<{ open: boolean; user: UserVO | null }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; success: [] }>()

const form = reactive({ userAccount: '', userName: '', userAvatar: '', userProfile: '', userRole: 'user' as UserRole })
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)
const submitError = ref('')
const isEdit = computed(() => props.user !== null)
const roleOptions = [
  { label: '普通用户', value: 'user' },
  { label: '管理员', value: 'admin' },
]

function resetForm() {
  form.userAccount = props.user?.userAccount ?? ''
  form.userName = props.user?.userName ?? ''
  form.userAvatar = props.user?.userAvatar ?? ''
  form.userProfile = props.user?.userProfile ?? ''
  form.userRole = props.user?.userRole ?? 'user'
  Object.keys(errors).forEach((key) => delete errors[key])
  submitError.value = ''
}

watch(() => [props.open, props.user] as const, resetForm, { immediate: true })

function clearError(field: string) {
  delete errors[field]
  submitError.value = ''
}

function close() {
  if (!submitting.value) emit('update:open', false)
}

function getOptionalValue(value: string): string | undefined {
  return value.trim() || undefined
}

async function submit() {
  const values = {
    userAccount: form.userAccount.trim(),
    userName: form.userName.trim(),
    userAvatar: getOptionalValue(form.userAvatar),
    userProfile: getOptionalValue(form.userProfile),
    userRole: form.userRole,
  }
  const validationErrors = validateManagedUser({
    ...values,
    userAccount: isEdit.value ? undefined : values.userAccount,
  })
  Object.keys(errors).forEach((key) => delete errors[key])
  Object.assign(errors, validationErrors)
  if (Object.keys(validationErrors).length > 0) return

  submitting.value = true
    submitError.value = ''
  try {
    if (props.user) {
      await updateUser(buildUserUpdateRequest(props.user.id, values))
      message.success('用户信息已更新')
    } else {
      await addUser(values)
      message.success('用户已创建')
    }
    emit('update:open', false)
    emit('success')
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : '操作失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.password-notice, .submit-error { margin-bottom: var(--space-4); }
</style>
