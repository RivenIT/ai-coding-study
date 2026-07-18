<template>
  <div class="about-view">
    <div class="about-header">
      <h1 class="about-title">关于我们</h1>
      <p class="about-subtitle">致力于打造最优质的 AI 编程学习平台</p>
    </div>

    <div class="about-content">
      <a-card class="info-card" :bordered="false">
        <template #title>
          <div class="card-title">
            <span class="card-icon">🎓</span>
            <span>平台简介</span>
          </div>
        </template>
        <p class="card-text">
          本平台是一个基于人工智能的应用生成平台，旨在通过 AI 技术简化应用开发流程，
          为用户提供高效、便捷的应用创建体验。
        </p>
      </a-card>

      <a-card class="info-card" :bordered="false">
        <template #title>
          <div class="card-title">
            <span class="card-icon">🌟</span>
            <span>核心特色</span>
          </div>
        </template>
        <ul class="feature-list">
          <li>智能 AI 助手，全程辅导学习</li>
          <li>系统化课程体系，循序渐进</li>
          <li>真实项目实战，积累经验</li>
          <li>活跃社区交流，共同成长</li>
        </ul>
      </a-card>

      <a-card class="info-card" :bordered="false">
        <template #title>
          <div class="card-title">
            <span class="card-icon">🚀</span>
            <span>技术架构</span>
          </div>
        </template>
        <p class="card-text">
          本平台采用现代化的前后端分离架构，前端使用 Vue 3 + TypeScript + Ant Design Vue，
          后端使用 Spring Boot + MySQL，集成 AI 能力，为用户提供稳定可靠的服务。
        </p>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
// 关于页面逻辑
</script>

<style scoped>
.about-view {
  width: 100%;
  min-height: 100%;
}

.about-header {
  margin-bottom: var(--space-10);
  padding: var(--space-10) var(--space-8);
  border-bottom: 1px solid var(--color-rule);
  background: var(--color-panel-raised);
}

.about-title {
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 42px;
  font-weight: 800;
  margin-bottom: var(--space-3);
}

.about-subtitle {
  font-size: 18px;
  color: var(--color-muted);
  font-weight: 400;
}

.about-content {
  display: grid;
  gap: var(--space-4);
  max-width: 800px;
  margin: 0 auto;
}

.info-card {
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-md);
  background: var(--color-panel);
  overflow: hidden;
}

.info-card :deep(.ant-card-head) {
  min-height: 48px;
  background: var(--color-panel-raised);
  border-bottom: 1px solid var(--color-rule);
}

.card-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: 18px;
  font-weight: 800;
  color: var(--color-ink);
}

.card-icon {
  font-size: 22px;
}

.card-text {
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-muted);
  margin: 0;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  font-size: 15px;
  line-height: 2;
  color: var(--color-muted);
  padding-left: var(--space-5);
  position: relative;
}

.feature-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--color-accent-strong);
  font-weight: 700;
  font-size: 16px;
}

@media (max-width: 768px) {
  .about-header {
    padding: var(--space-8) var(--space-5);
    margin-bottom: var(--space-8);
  }

  .about-title {
    font-size: 32px;
  }

  .about-subtitle {
    font-size: 16px;
  }

  .about-content {
    gap: var(--space-3);
  }

  .card-title {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .about-header {
    padding: var(--space-6) var(--space-4);
  }

  .about-title {
    font-size: 28px;
  }

  .card-text,
  .feature-list li {
    font-size: 14px;
  }
}
</style>
