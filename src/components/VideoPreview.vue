<script setup lang="ts">
  import { computed } from 'vue'

  const props = withDefaults(
    defineProps<{
      videoUrl: string
      fileNameBase: string
      mp4Converting?: boolean
      mp4Progress?: number
      mp4LoadingFfmpeg?: boolean
    }>(),
    {
      mp4Converting: false,
      mp4Progress: 0,
      mp4LoadingFfmpeg: false,
    },
  )

  defineEmits<{
    (e: 'reset'): void
    (e: 'download-mp4'): void
  }>()

  const webmFileName = computed(() => `${props.fileNameBase}.webm`)

  const mp4ButtonLabel = computed(() => {
    if (props.mp4LoadingFfmpeg) {
      return '加载转换器...'
    }
    if (props.mp4Converting) {
      const pct = Math.round(props.mp4Progress * 100)
      return `转换中 ${pct}%`
    }
    return '下载 mp4'
  })

  const mp4Disabled = computed(() => props.mp4Converting || props.mp4LoadingFfmpeg)
</script>

<template>
  <div class="video-preview">
    <video :src="videoUrl" controls class="video-preview__video" />
    <div class="video-preview__actions">
      <button class="video-preview__btn is-secondary" type="button" @click="$emit('reset')">
        重新录制
      </button>
      <a
        :href="videoUrl"
        :download="webmFileName"
        class="video-preview__btn is-primary"
      >
        下载 webm
      </a>
      <button
        class="video-preview__btn is-primary"
        type="button"
        :disabled="mp4Disabled"
        @click="$emit('download-mp4')"
      >
        {{ mp4ButtonLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
  .video-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
  .video-preview__video {
    width: 100%;
    max-width: 720px;
    border-radius: var(--radius-card);
    background-color: #000;
  }
  .video-preview__actions {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .video-preview__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 120px;
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 500;
    border-radius: var(--radius-button);
    text-decoration: none;
    transition: background-color var(--duration-fast), color var(--duration-fast);
    cursor: pointer;
  }
  .video-preview__btn.is-primary {
    color: #fff;
    background-color: var(--color-primary);
  }
  .video-preview__btn.is-primary:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }
  .video-preview__btn.is-primary:active:not(:disabled) {
    background-color: var(--color-primary-active);
  }
  .video-preview__btn.is-primary:disabled {
    background-color: var(--color-primary);
    opacity: 0.7;
    cursor: progress;
  }
  .video-preview__btn.is-secondary {
    color: var(--color-text);
    background-color: var(--color-card);
    border: 1px solid var(--color-border);
  }
  .video-preview__btn.is-secondary:hover {
    background-color: var(--color-step-bg);
  }
</style>
