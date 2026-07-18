<template>
  <section class="app-list-section">
    <header class="section-header">
      <div>
        <h2>{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
      <a-input-search
        v-model:value="keyword"
        class="section-search"
        allow-clear
        :placeholder="searchPlaceholder"
        @search="submitSearch"
      />
    </header>

    <div v-if="loading" class="app-grid">
      <a-skeleton v-for="item in pageSize" :key="item" active />
    </div>
    <a-empty v-else-if="items.length === 0" :description="emptyText" />
    <div v-else class="app-grid">
      <AppCard
        v-for="app in items"
        :key="app.id"
        :app="app"
        :editable="editable"
        :deletable="deletable"
        @open="emit('open', $event)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @deploy="emit('deploy', $event)"
      />
    </div>

    <footer v-if="total > pageSize" class="pagination-row">
      <span>共 {{ total }} 个应用</span>
      <a-pagination
        :current="page"
        :page-size="pageSize"
        :total="total"
        :page-size-options="['8', '12', '20']"
        show-size-changer
        @change="changePage"
      />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppCard from '@/components/app/AppCard.vue'
import type { AppVO } from '@/types/app'

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    items: AppVO[]
    loading?: boolean
    total: number
    page: number
    pageSize: number
    editable?: boolean
    deletable?: boolean
    emptyText?: string
    searchPlaceholder?: string
  }>(),
  {
    description: '',
    loading: false,
    editable: false,
    deletable: false,
    emptyText: '暂无应用',
    searchPlaceholder: '按名称搜索',
  },
)

const emit = defineEmits<{
  search: [keyword: string]
  page: [page: number, pageSize: number]
  open: [app: AppVO]
  edit: [app: AppVO]
  delete: [app: AppVO]
  deploy: [app: AppVO]
}>()

const keyword = ref('')

function submitSearch(value: string) {
  emit('search', value.trim())
}

function changePage(page: number, pageSize: number) {
  const sizeChanged = pageSize !== props.pageSize
  emit('page', sizeChanged ? 1 : page, pageSize)
}
</script>

<style scoped>
.app-list-section {
  display: grid;
  gap: var(--space-6);
}

.section-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-4);
}

.section-header h2 {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: 28px;
  line-height: 1.2;
}

.section-header p {
  margin: var(--space-1) 0 0;
  color: var(--color-muted);
}

.section-search {
  width: min(100%, 280px);
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: var(--space-5);
}

.pagination-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  color: var(--color-muted);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-rule);
}

@media (max-width: 720px) {
  .section-header,
  .pagination-row {
    align-items: stretch;
    flex-direction: column;
  }

  .section-search {
    width: 100%;
  }
}
</style>
