<template>
  <section class="not-found-page">
    <a-result status="404" title="页面不存在">
      <template #extra>
        <a-button type="primary" @click="router.replace('/')">返回首页</a-button>
      </template>
    </a-result>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
.not-found-page {
  display: grid;
  min-height: min(520px, calc(100vh - 220px));
  place-items: center;
}
</style>
