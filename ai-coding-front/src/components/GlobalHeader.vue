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
          v-model:selectedKeys="selectedKeys"
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
        <a-dropdown v-else placement="bottomRight">
          <a class="user-trigger" @click.prevent>
            <a-avatar :src="userStore.loginUser.userAvatar || undefined">
              <template #icon><UserOutlined /></template>
            </a-avatar>
            <span class="user-name">{{ userStore.loginUser.userName || userStore.loginUser.userAccount }}</span>
            <a-tag :color="userStore.isAdmin ? 'orange' : 'blue'">{{ userStore.isAdmin ? '管理员' : '普通用户' }}</a-tag>
            <DownOutlined />
          </a>
          <template #overlay>
            <a-menu @click="handleUserMenuClick">
              <a-menu-item v-if="userStore.isAdmin" key="manage">用户管理</a-menu-item>
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
  if (key === 'manage') {
    void router.push('/user/manage')
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
  position: relative;
}

.header-container {
  max-width: 1400px;
  height: 100%;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 左侧区域 */
.header-left {
  display: flex;
  align-items: center;
  gap: 48px;
  flex: 1;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo-section:hover {
  transform: translateY(-1px);
}

.logo-image {
  width: 36px;
  height: 36px;
  object-fit: contain;
  animation: logoFloat 3s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.site-title {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.logo-section:hover .site-title {
  letter-spacing: 1px;
}

/* 菜单样式 */
.header-menu {
  flex: 1;
  border: none;
  background: transparent;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 15px;
}

.header-menu :deep(.ant-menu-item) {
  padding: 0 20px;
  margin: 0 4px;
  border-radius: 8px;
  font-weight: 500;
  color: #475569;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-menu :deep(.ant-menu-item:hover) {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.08);
}

.header-menu :deep(.ant-menu-item-selected) {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.12);
  font-weight: 600;
}

.header-menu :deep(.ant-menu-item::after) {
  display: none;
}

/* 右侧区域 */
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.login-button {
  height: 36px;
  padding: 0 24px;
  border-radius: 18px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.3);
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #334155;
  cursor: pointer;
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
    padding: 0 16px;
  }

  .header-left {
    gap: 24px;
  }

  .site-title {
    display: none;
  }

  .logo-image {
    width: 32px;
    height: 32px;
  }

  .header-menu {
    font-size: 14px;
  }

  .header-menu :deep(.ant-menu-item) {
    padding: 0 12px;
  }

  .login-button {
    padding: 0 16px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 0 12px;
  }

  .header-left {
    gap: 16px;
  }

  .header-menu :deep(.ant-menu-item) {
    padding: 0 8px;
    margin: 0 2px;
  }

  .login-button {
    padding: 0 12px;
  }
}
</style>
