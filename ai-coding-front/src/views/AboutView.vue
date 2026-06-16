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
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.about-header {
  text-align: center;
  margin-bottom: 48px;
  padding: 48px 20px;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(9, 109, 217, 0.05) 100%);
  border-radius: 24px;
}

.about-title {
  font-size: 42px;
  font-weight: 700;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
}

.about-subtitle {
  font-size: 18px;
  color: #64748b;
  font-weight: 400;
}

.about-content {
  display: grid;
  gap: 32px;
  max-width: 800px;
  margin: 0 auto;
}

.info-card {
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(100, 116, 139, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(100, 116, 139, 0.15);
}

.info-card :deep(.ant-card-head) {
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(9, 109, 217, 0.05) 100%);
  border-bottom: 1px solid rgba(100, 116, 139, 0.1);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.card-icon {
  font-size: 28px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.card-text {
  font-size: 15px;
  line-height: 1.8;
  color: #475569;
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
  color: #475569;
  padding-left: 24px;
  position: relative;
}

.feature-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #1890ff;
  font-weight: 700;
  font-size: 16px;
}

.learn-more {
  margin-top: 16px;
  padding: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1890ff;
  transition: all 0.3s ease;
}

.learn-more:hover {
  color: #096dd9;
  transform: translateX(4px);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .about-header {
    padding: 36px 20px;
    margin-bottom: 32px;
  }

  .about-title {
    font-size: 32px;
  }

  .about-subtitle {
    font-size: 16px;
  }

  .about-content {
    gap: 24px;
  }

  .card-title {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .about-header {
    padding: 28px 16px;
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
