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
  /** 在途请求序号：finally 中用它判断自己是否仍是最新请求，避免误复位后来者的 loading 或误清其在途标记。 */
  let inflightSeq = 0
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
    // 以序号标识本次请求：finally 只在自己仍是最新在途请求时清理，避免误清后来者。
    const seq = ++inflightSeq
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
        if (seq === inflightSeq) {
          loading.value = false
          inflightFetch = null
        }
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
