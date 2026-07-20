import { createRouter, createWebHistory } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import HomeView from '../views/HomeView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    guestOnly?: boolean
    requiresAuth?: boolean
    requiresAdmin?: boolean
    immersive?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/user/manage',
      name: 'user-management',
      component: () => import('../views/UserManagementView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/app/:id/chat',
      name: 'app-chat',
      component: () => import('../views/AppChatView.vue'),
      meta: { requiresAuth: true, immersive: true },
    },
    {
      path: '/app/:id/edit',
      name: 'app-edit',
      component: () => import('../views/AppEditView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/chatHistory/manage',
      name: 'chat-history-management',
      component: () => import('../views/ChatHistoryManagementView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/app/manage',
      name: 'app-management',
      component: () => import('../views/AppManagementView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()
  const requiresSession = Boolean(to.meta.requiresAuth || to.meta.requiresAdmin)

  if (requiresSession && !userStore.initialized) {
    try {
      await userStore.fetchLoginUser({ silent: true })
    } catch {
      message.error('暂时无法确认登录状态，请检查网络后重试')
      return '/'
    }
  } else if (!userStore.initialized) {
    void userStore.fetchLoginUser({ silent: true }).catch(() => undefined)
  }

  if (to.meta.guestOnly && !userStore.initialized) {
    void userStore.fetchLoginUser({ silent: true })
      .then(() => {
        if (userStore.loginUser && router.currentRoute.value.fullPath === to.fullPath) {
          void router.replace('/')
        }
      })
      .catch(() => undefined)
  }

  if (to.meta.guestOnly && userStore.loginUser) {
    return '/'
  }

  if (to.meta.requiresAuth && !userStore.loginUser) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    return '/'
  }
})

export default router
