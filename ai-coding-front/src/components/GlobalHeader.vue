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
  gap: var(--space-3);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-rule) 80%, white);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-panel-raised) 88%, white);
  box-shadow: var(--shadow-header);
  backdrop-filter: blur(14px);
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: var(--space-8);
  flex: 1 1 auto;
  overflow: hidden;
}

.logo-section {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: var(--space-2);
  text-decoration: none;
  transition: opacity var(--dur-fast) var(--ease-out);
}

.logo-section:hover {
  opacity: 0.88;
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
  flex: 1 1 auto;
  overflow: hidden;
  border: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: 14px;
}

.header-menu :deep(.ant-menu-overflow) {
  min-width: 0;
}

.header-menu :deep(.ant-menu-item) {
  padding: 0 var(--space-4);
  margin: 0 var(--space-1);
  font-weight: 600;
  color: var(--color-muted);
  border-radius: 999px;
  transition:
    color var(--dur-fast) var(--ease-out),
    background-color var(--dur-fast) var(--ease-out);
}

.header-menu :deep(.ant-menu-item:hover) {
  color: var(--color-ink);
  background: var(--color-chip);
}

.header-menu :deep(.ant-menu-item-selected) {
  color: var(--color-accent-strong);
  background: var(--color-chip);
  font-weight: 700;
}

.header-menu :deep(.ant-menu-item::after) {
  right: var(--space-4);
  left: var(--space-4);
  border-bottom-color: transparent;
}

.header-right {
  min-width: 0;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.login-button {
  height: 34px;
  padding: 0 var(--space-4);
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 40px;
  padding: 2px 10px 2px 2px;
  color: var(--color-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  transition:
    background-color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out);
}

.user-trigger:hover {
  border-color: var(--color-rule);
  background: var(--color-panel);
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

/* 中等宽度：先收标题与角色标签，给菜单/操作区腾空间 */
@media (max-width: 960px) {
  .header-left {
    gap: var(--space-4);
  }

  .site-title {
    display: none;
  }

  .user-trigger :deep(.ant-tag) {
    display: none;
  }
}

/* 响应式布局 */
@media (max-width: 768px) {
  .header-container {
    padding: 0 var(--space-4);
  }

  .header-left {
    gap: var(--space-3);
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

  /* 注册按钮保留入口，窄屏只压缩尺寸 */
  .header-right :deep(.ant-btn-text) {
    padding: 0 var(--space-2);
    font-size: 13px;
  }

  .login-button {
    padding: 0 var(--space-3);
    font-size: 13px;
  }

  .user-name {
    max-width: 72px;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 0 var(--space-3);
  }

  .header-left {
    gap: var(--space-2);
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

  .user-trigger {
    padding: 2px;
  }
}
</style>
