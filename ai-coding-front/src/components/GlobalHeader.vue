<template>
  <div class="global-header">
    <div class="header-container">
      <!-- 左侧：Logo 和标题 -->
      <div class="header-left">
        <router-link to="/" class="logo-section">
          <img src="@/assets/logo.png" alt="Logo" class="logo-image" />
          <span class="site-title">AI 编程学习平台</span>
        </router-link>

        <!-- 菜单导航 -->
        <a-menu
          :selected-keys="selectedKeys"
          mode="horizontal"
          class="header-menu"
          :items="menuItems"
          @click="handleMenuClick"
        />
      </div>

      <!-- 右侧：用户操作区 -->
      <div class="header-right">
        <a-space v-if="!userStore.loginUser" :size="8">
          <a-button type="text" @click="router.push('/register')">注册</a-button>
          <a-button type="primary" class="login-button" @click="router.push('/login')">
            <template #icon><UserOutlined /></template>
            登录
          </a-button>
        </a-space>
        <a-dropdown v-else placement="bottomRight" :trigger="['click']">
          <button class="user-trigger" type="button">
            <a-avatar :src="userStore.loginUser.userAvatar || undefined">
              <template #icon><UserOutlined /></template>
            </a-avatar>
            <span class="user-name">{{ userStore.loginUser.userName || userStore.loginUser.userAccount }}</span>
            <a-tag :color="userStore.isAdmin ? 'orange' : 'blue'">{{ userStore.isAdmin ? '管理员' : '普通用户' }}</a-tag>
            <DownOutlined />
          </button>
          <template #overlay>
            <a-menu @click="handleUserMenuClick">
              <a-menu-item v-if="userStore.isAdmin" key="userManage">用户管理</a-menu-item>
              <a-menu-item v-if="userStore.isAdmin" key="appManage">应用管理</a-menu-item>
              <a-menu-item v-if="userStore.isAdmin" key="chatHistoryManage">对话管理</a-menu-item>
              <a-menu-divider v-if="userStore.isAdmin" />
              <a-menu-item key="logout">退出登录</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { DownOutlined, UserOutlined } from '@ant-design/icons-vue'
import { ApiError } from '@/services/http'
import { useUserStore } from '@/stores/user'
import { message, Modal } from 'ant-design-vue'
import type { MenuProps } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 菜单配置
const menuItems: MenuProps['items'] = [
  {
    key: '/',
    label: '首页',
    title: '首页',
  },
  {
    key: '/about',
    label: '关于',
    title: '关于',
  },
]

// 当前选中的菜单项
const selectedKeys = computed(() => [route.path])

// 菜单点击事件
const handleMenuClick = ({ key }: { key: string }) => {
  router.push(key)
}

async function logout() {
  try {
    await userStore.logout()
    message.success('已退出登录')
    await router.push('/')
  } catch (error) {
    if (error instanceof ApiError && error.code === 40100) {
      userStore.clearLoginUser()
      await router.push('/')
      return
    }
    message.error(error instanceof Error ? error.message : '退出登录失败')
  }
}

function handleUserMenuClick({ key }: { key: string }) {
  if (key === 'userManage') {
    void router.push('/user/manage')
    return
  }
  if (key === 'appManage') {
    void router.push('/app/manage')
    return
  }
  if (key === 'chatHistoryManage') {
    void router.push('/chatHistory/manage')
    return
  }
  if (key === 'logout') {
    Modal.confirm({
      title: '确认退出登录？',
      content: '退出后需要重新登录才能访问管理功能。',
      okText: '确认退出',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: logout,
    })
  }
}
</script>

<style scoped>
.global-header {
  width: 100%;
  height: 100%;
}

.header-container {
  min-width: 0;
  max-width: 1504px;
  height: 100%;
  margin: 0 auto;
  padding: 0 var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-md);
  background: var(--color-panel-raised);
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: var(--space-8);
  flex: 1;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-decoration: none;
}

.logo-image {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.site-title {
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 800;
  white-space: nowrap;
}

.header-menu {
  min-width: 0;
  flex: 1;
  border: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: 14px;
}

.header-menu :deep(.ant-menu-item) {
  padding: 0 var(--space-4);
  margin: 0 var(--space-1);
  font-weight: 600;
  color: var(--color-muted);
  transition: color var(--dur-fast) var(--ease-out);
}

.header-menu :deep(.ant-menu-item:hover) {
  color: var(--color-ink);
  background: transparent;
}

.header-menu :deep(.ant-menu-item-selected) {
  color: var(--color-accent-strong);
  background: transparent;
  font-weight: 700;
}

.header-menu :deep(.ant-menu-item::after) {
  right: var(--space-4);
  left: var(--space-4);
  border-bottom-color: var(--color-accent-strong);
}

.header-right {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.login-button {
  height: 34px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 700;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0;
  color: var(--color-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  border: 0;
  background: transparent;
}

.user-trigger:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 3px;
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .header-container {
    padding: 0 var(--space-4);
  }

  .header-left {
    gap: var(--space-4);
  }

  .site-title {
    display: none;
  }

  .logo-image {
    width: 28px;
    height: 28px;
  }

  .header-menu {
    font-size: 14px;
  }

  .header-menu :deep(.ant-menu-item) {
    padding: 0 var(--space-3);
  }

  .login-button {
    padding: 0 var(--space-3);
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 0 var(--space-3);
  }

  .header-left {
    gap: var(--space-3);
  }

  .header-menu :deep(.ant-menu-item) {
    padding: 0 var(--space-2);
    margin: 0;
  }

  .login-button {
    padding: 0 12px;
  }

  .user-name {
    display: none;
  }

  .user-trigger :deep(.ant-tag) {
    display: none;
  }
}
</style>
