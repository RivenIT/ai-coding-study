import { createRouter, createWebHistory } from 'vue-router'
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
      path: '/app/manage',
      name: 'app-management',
      component: () => import('../views/AppManagementView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()

  if (!userStore.initialized) {
    try {
      await userStore.fetchLoginUser({ silent: true })
    } catch {
      userStore.clearLoginUser()
    }
  }

  if (to.meta.requiresAuth && !userStore.loginUser) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    return '/'
  }

  if (to.meta.guestOnly && userStore.loginUser) {
    return '/'
  }
})

export default router
