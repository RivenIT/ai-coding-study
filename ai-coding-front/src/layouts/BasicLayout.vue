<template>
  <div v-if="route.meta.immersive" class="immersive-layout">
    <router-view v-slot="{ Component }">
      <transition name="fade-slide" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>

  <a-layout v-else class="basic-layout">
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
import { RouterView, useRoute } from 'vue-router'
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'

const route = useRoute()
</script>

<style scoped>
.basic-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-paper-soft);
}

.immersive-layout {
  width: 100%;
  min-height: 100vh;
  background: var(--color-paper-soft);
}

.layout-header {
  position: sticky;
  top: 0;
  z-index: 999;
  width: 100%;
  height: 80px;
  padding: var(--space-1) var(--space-2) 0;
  line-height: normal;
  background: transparent;
}

.layout-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  min-width: 0;
  width: 100%;
  max-width: 1520px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6) var(--space-12);
}

.layout-footer {
  padding: 0;
  background: transparent;
}

/* 页面切换动画 */
.fade-slide-enter-active {
  transition: opacity var(--dur-med) var(--ease-out), transform var(--dur-med) var(--ease-out);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .layout-header {
    height: 68px;
    padding: var(--space-1) var(--space-1) 0;
  }

  .content-wrapper {
    padding: var(--space-5) var(--space-4) var(--space-8);
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    padding: var(--space-4) var(--space-3) var(--space-6);
  }
}
</style>
