<template>
  <div class="home-view">
    <div class="hero-section">
      <h1 class="hero-title">欢迎来到 AI 编程学习平台</h1>
      <p class="hero-subtitle">探索人工智能与编程的无限可能</p>
      <div class="hero-actions">
        <a-button type="primary" size="large" class="action-button">
          开始学习
        </a-button>
        <a-button size="large" class="action-button-outline">
          了解更多
        </a-button>
      </div>
    </div>

    <div class="features-section">
      <div class="feature-card">
        <div class="feature-icon">🚀</div>
        <h3 class="feature-title">快速上手</h3>
        <p class="feature-description">零基础也能轻松入门，系统化学习路径助你成长</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">💡</div>
        <h3 class="feature-title">智能辅导</h3>
        <p class="feature-description">AI 助手全程陪伴，实时解答编程疑惑</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🎯</div>
        <h3 class="feature-title">实战项目</h3>
        <p class="feature-description">真实项目驱动学习，积累实战经验</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 首页逻辑
</script>

<style scoped>
.home-view {
  width: 100%;
  min-height: 100%;
}

.hero-section {
  text-align: center;
  padding: 80px 20px;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(9, 109, 217, 0.05) 100%);
  border-radius: 24px;
  margin-bottom: 60px;
  animation: slideUp 0.8s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
  letter-spacing: -0.5px;
}

.hero-subtitle {
  font-size: 20px;
  color: #64748b;
  margin-bottom: 40px;
  font-weight: 400;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-button {
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 24px;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(24, 144, 255, 0.4);
}

.action-button-outline {
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 24px;
  border: 2px solid #1890ff;
  color: #1890ff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-button-outline:hover {
  transform: translateY(-3px);
  background: rgba(24, 144, 255, 0.05);
  border-color: #096dd9;
  color: #096dd9;
}

.features-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
  animation: fadeIn 1s ease-out 0.3s both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.feature-card {
  background: white;
  padding: 40px 32px;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(100, 116, 139, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(100, 116, 139, 0.08);
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(100, 116, 139, 0.15);
  border-color: rgba(24, 144, 255, 0.3);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 20px;
  animation: bounce 2s ease-in-out infinite;
}

.feature-card:nth-child(2) .feature-icon {
  animation-delay: 0.2s;
}

.feature-card:nth-child(3) .feature-icon {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.feature-title {
  font-size: 22px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.feature-description {
  font-size: 15px;
  color: #64748b;
  line-height: 1.7;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .hero-section {
    padding: 60px 20px;
  }

  .hero-title {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 18px;
  }

  .features-section {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 40px 16px;
  }

  .hero-title {
    font-size: 28px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .action-button,
  .action-button-outline {
    width: 100%;
    max-width: 280px;
  }
}
</style>
