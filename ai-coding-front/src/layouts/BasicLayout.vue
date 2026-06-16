<template>
  <a-layout class="basic-layout">
    <a-layout-header class="layout-header">
      <GlobalHeader />
    </a-layout-header>

    <a-layout-content class="layout-content">
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </a-layout-content>

    <a-layout-footer class="layout-footer">
      <GlobalFooter />
    </a-layout-footer>
  </a-layout>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
</script>

<style scoped>
.basic-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
}

.layout-header {
  position: sticky;
  top: 0;
  z-index: 999;
  width: 100%;
  padding: 0;
  height: 64px;
  line-height: 64px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 16px rgba(100, 116, 139, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.layout-header:hover {
  box-shadow: 0 4px 24px rgba(100, 116, 139, 0.12);
}

.layout-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
  animation: fadeIn 0.6s ease-out;
}

.layout-footer {
  padding: 0;
  background: transparent;
}

/* 页面切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 响应式布局 */
@media (max-width: 768px) {
  .layout-header {
    height: 56px;
    line-height: 56px;
  }

  .content-wrapper {
    padding: 20px 16px;
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    padding: 16px 12px;
  }
}
</style>
