<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{ seconds: number }>()

  const WARNING_THRESHOLD = 30 * 60

  const display = computed(() => {
    const total = Math.max(0, Math.floor(props.seconds))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const pad = (n: number) => String(n).padStart(2, '0')
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
  })

  const warning = computed(() => props.seconds >= WARNING_THRESHOLD)
</script>

<template>
  <div class="recording-timer">
    <span class="recording-timer__dot" />
    <span class="recording-timer__time">{{ display }}</span>
    <span v-if="warning" class="recording-timer__warning">建议尽快结束录制以避免内存占用过高</span>
  </div>
</template>

<style scoped>
  .recording-timer {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--color-text);
  }
  .recording-timer__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--color-danger);
    animation: pulse 1.4s ease-in-out infinite;
  }
  .recording-timer__time {
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }
  .recording-timer__warning {
    color: var(--color-danger);
    font-size: 12px;
    margin-left: 8px;
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
</style>
