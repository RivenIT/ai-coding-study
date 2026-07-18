<template>
  <form class="prompt-composer" @submit.prevent="submit">
    <a-textarea
      v-model:value="value"
      class="prompt-input"
      :maxlength="maxLength"
      :placeholder="placeholder"
      :disabled="loading || disabled"
      :auto-size="{ minRows: 4, maxRows: 7 }"
      show-count
      @keydown="handleKeydown"
    />
    <div class="prompt-actions">
      <slot name="tools" />
      <a-button
        class="submit-button"
        type="primary"
        html-type="submit"
        shape="circle"
        :loading="loading"
        :disabled="disabled || !value.trim()"
        :aria-label="submitLabel"
      >
        <template #icon><SendOutlined /></template>
      </a-button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SendOutlined } from '@ant-design/icons-vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    loading?: boolean
    disabled?: boolean
    placeholder?: string
    submitLabel?: string
    maxLength?: number
  }>(),
  {
    loading: false,
    disabled: false,
    placeholder: '描述你想生成的应用或网站',
    submitLabel: '发送',
    maxLength: 2000,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()

const value = computed({
  get: () => props.modelValue,
  set: (next: string) => emit('update:modelValue', next),
})

function submit() {
  if (!value.value.trim() || props.loading || props.disabled) return
  emit('submit')
}

function handleKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    submit()
  }
}
</script>

<style scoped>
.prompt-composer {
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 176px;
  padding: var(--space-5);
  border: 1px solid var(--color-rule-on-field-strong);
  border-radius: var(--radius-md);
  background: var(--color-panel-raised);
  box-shadow: var(--shadow-workbench);
}

.prompt-input {
  padding: 0 0 58px;
  color: var(--color-ink);
  font-size: 17px;
  line-height: 1.7;
  resize: none;
  border: 0;
  box-shadow: none;
}

.prompt-input:focus {
  box-shadow: none;
}

.prompt-actions {
  position: absolute;
  right: var(--space-5);
  bottom: var(--space-5);
  left: var(--space-5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  pointer-events: none;
}

.prompt-actions :deep(*) {
  pointer-events: auto;
}

.submit-button {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
}

@media (max-width: 520px) {
  .prompt-composer {
    min-height: 160px;
    padding: var(--space-3);
  }

  .prompt-actions {
    right: var(--space-3);
    bottom: var(--space-3);
    left: var(--space-3);
  }
}
</style>
