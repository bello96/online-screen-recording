<script setup lang="ts">
  import { computed } from 'vue'
  import type { AudioOptions } from '@/types'

  const props = defineProps<{
    modelValue: AudioOptions
    disabled: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: AudioOptions): void
  }>()

  const systemAudio = computed({
    get: () => props.modelValue.systemAudio,
    set: (v) => emit('update:modelValue', { ...props.modelValue, systemAudio: v }),
  })

  const microphone = computed({
    get: () => props.modelValue.microphone,
    set: (v) => emit('update:modelValue', { ...props.modelValue, microphone: v }),
  })
</script>

<template>
  <div class="audio-options">
    <label class="audio-options__item">
      <input v-model="systemAudio" type="checkbox" :disabled="disabled" />
      <span>系统声音</span>
    </label>
    <label class="audio-options__item">
      <input v-model="microphone" type="checkbox" :disabled="disabled" />
      <span>麦克风</span>
    </label>
  </div>
</template>

<style scoped>
  .audio-options {
    display: flex;
    justify-content: center;
    gap: 64px;
  }
  .audio-options__item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--color-text);
    cursor: pointer;
    user-select: none;
  }
  .audio-options__item input {
    width: 16px;
    height: 16px;
    accent-color: var(--color-primary);
  }
  .audio-options__item input:disabled + span {
    color: var(--color-text-tertiary);
  }
  .audio-options__item input:disabled {
    cursor: not-allowed;
  }
</style>
