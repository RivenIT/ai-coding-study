<template>
  <div class="global-footer">
    <div class="footer-container">
      <div class="footer-content">
        <span class="footer-text">
          © 2024 AI 智能应用平台
        </span>
        <div class="footer-decoration">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 无需额外逻辑
</script>

<style scoped>
.global-footer {
  width: 100%;
  padding: 24px 0;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(100, 116, 139, 0.1);
  margin-top: auto;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-text {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  letter-spacing: 0.3px;
}

.footer-link {
  color: #1890ff;
  text-decoration: none;
  font-weight: 600;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0 4px;
}

.footer-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 4px;
  right: 4px;
  height: 2px;
  background: linear-gradient(90deg, #1890ff, #096dd9);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 1px;
}

.footer-link:hover {
  color: #096dd9;
}

.footer-link:hover::after {
  transform: scaleX(1);
}

.footer-decoration {
  display: flex;
  gap: 6px;
  align-items: center;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  animation: pulse 2s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.3s;
}

.dot:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* 响应式布局 */
@media (max-width: 768px) {
  .global-footer {
    padding: 20px 0;
  }

  .footer-container {
    padding: 0 16px;
  }

  .footer-text {
    font-size: 13px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .global-footer {
    padding: 16px 0;
  }

  .footer-container {
    padding: 0 12px;
  }

  .footer-text {
    font-size: 12px;
  }

  .footer-content {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
