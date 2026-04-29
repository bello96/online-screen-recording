<script setup lang="ts">
import { computed } from 'vue'
import type { RecorderState } from '@/types'

const props = defineProps<{ state: RecorderState }>()
defineEmits<{ (e: 'click'): void }>()

const label = computed(() => {
  switch (props.state) {
    case 'requesting':
      return '等待授权...'
    case 'recording':
    case 'paused':
      return '结束录制'
    default:
      return '开始录制'
  }
})

const variant = computed(() => {
  switch (props.state) {
    case 'recording':
    case 'paused':
      return 'is-danger'
    default:
      return 'is-primary'
  }
})

const disabled = computed(() => props.state === 'requesting')
</script>

<template>
  <button
    class="recorder-button"
    :class="variant"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <svg
      v-if="state === 'idle'"
      class="recorder-button__icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect x="2" y="6" width="14" height="12" rx="2" stroke="currentColor" stroke-width="2" />
      <path d="M16 10L22 7V17L16 14V10Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
    </svg>
    <svg
      v-else-if="state === 'recording' || state === 'paused'"
      class="recorder-button__icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.recorder-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  border-radius: var(--radius-button);
  transition: background-color var(--duration-fast);
}
.recorder-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.recorder-button.is-primary {
  background-color: var(--color-primary);
}
.recorder-button.is-primary:not(:disabled):hover {
  background-color: var(--color-primary-hover);
}
.recorder-button.is-primary:not(:disabled):active {
  background-color: var(--color-primary-active);
}
.recorder-button.is-danger {
  background-color: var(--color-danger);
}
.recorder-button.is-danger:not(:disabled):hover {
  background-color: var(--color-danger-hover);
}
.recorder-button__icon {
  flex-shrink: 0;
}
</style>
