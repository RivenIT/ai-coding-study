import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/services/http'
import * as userApi from '@/services/user'
import type { LoginUserVO, UserLoginRequest } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const loginUser = ref<LoginUserVO | null>(null)
  const initialized = ref(false)
  const loading = ref(false)
  const isAdmin = computed(() => loginUser.value?.userRole === 'admin')
  let inflightFetch: Promise<LoginUserVO | null> | null = null
  /** 登录态变更代数：丢弃过期的 getLoginUser 响应，避免覆盖新登录结果。 */
  let authEpoch = 0

  function bumpAuthEpoch() {
    authEpoch += 1
    return authEpoch
  }

  function clearLoginUser() {
    bumpAuthEpoch()
    inflightFetch = null
    loginUser.value = null
  }

  async function fetchLoginUser(options: { silent?: boolean } = {}) {
    if (inflightFetch) return inflightFetch

    const epoch = authEpoch
    loading.value = true
    const thisFetch = (async () => {
      try {
        const user = await userApi.getLoginUser()
        if (epoch !== authEpoch) return loginUser.value
        loginUser.value = user
        initialized.value = true
        return loginUser.value
      } catch (error) {
        if (epoch !== authEpoch) {
          // 过期响应（例如登录成功后迟到的 40100）不得清掉新会话。
          if (options.silent && error instanceof ApiError && error.code === 40100) {
            return null
          }
          throw error
        }
        if (options.silent && error instanceof ApiError && error.code === 40100) {
          clearLoginUser()
          initialized.value = true
          return null
        }
        throw error
      } finally {
        loading.value = false
        if (inflightFetch === thisFetch) inflightFetch = null
      }
    })()
    inflightFetch = thisFetch

    return thisFetch
  }

  async function login(requestData: UserLoginRequest) {
    const user = await userApi.login(requestData)
    bumpAuthEpoch()
    inflightFetch = null
    loginUser.value = user
    initialized.value = true
    return user
  }

  async function logout() {
    await userApi.logout()
    clearLoginUser()
  }

  return {
    loginUser,
    initialized,
    loading,
    isAdmin,
    clearLoginUser,
    fetchLoginUser,
    login,
    logout,
  }
})
