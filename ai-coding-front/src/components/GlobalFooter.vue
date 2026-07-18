<template>
  <div class="global-footer">
    <div class="footer-container">
      <div class="footer-content">
        <span class="footer-text">© 2024 AI 智能应用平台</span>
        <span class="footer-note">从想法到可用应用</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.global-footer {
  width: 100%;
  padding: var(--space-6) 0;
  border-top: 1px solid var(--color-rule);
  background: var(--color-paper-soft);
  margin-top: auto;
}

.footer-container {
  max-width: 1504px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.footer-text {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-muted);
  line-height: 1.6;
}

.footer-note {
  color: var(--color-subtle);
  font-size: 13px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .global-footer {
    padding: var(--space-5) 0;
  }

  .footer-container {
    padding: 0 var(--space-4);
  }

  .footer-text {
    font-size: 13px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .global-footer {
    padding: var(--space-4) 0;
  }

  .footer-container {
    padding: 0 var(--space-3);
  }

  .footer-text {
    font-size: 12px;
  }

  .footer-content {
    flex-direction: column;
    gap: var(--space-1);
  }
}
</style>
