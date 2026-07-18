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

  function clearLoginUser() {
    loginUser.value = null
  }

  async function fetchLoginUser(options: { silent?: boolean } = {}) {
    if (inflightFetch) return inflightFetch

    loading.value = true
    inflightFetch = (async () => {
      try {
        loginUser.value = await userApi.getLoginUser()
        return loginUser.value
      } catch (error) {
        if (options.silent && error instanceof ApiError && error.code === 40100) {
          clearLoginUser()
          return null
        }
        throw error
      } finally {
        initialized.value = true
        loading.value = false
        inflightFetch = null
      }
    })()

    return inflightFetch
  }

  async function login(requestData: UserLoginRequest) {
    const user = await userApi.login(requestData)
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
