<script setup lang="ts">
  import { computed } from 'vue'

  const props = withDefaults(
    defineProps<{
      videoUrl: string
      fileNameBase: string
      mp4Busy?: boolean
    }>(),
    { mp4Busy: false },
  )

  defineEmits<{
    (e: 'reset'): void
    (e: 'download-mp4'): void
  }>()

  const webmFileName = computed(() => `${props.fileNameBase}.webm`)
</script>

<template>
  <div class="video-preview">
    <video :src="videoUrl" controls class="video-preview__video" />
    <div class="video-preview__actions">
      <button class="video-preview__btn is-secondary" type="button" @click="$emit('reset')">
        重新录制
      </button>
      <a :href="videoUrl" :download="webmFileName" class="video-preview__btn is-primary">
        下载 webm
      </a>
      <button
        class="video-preview__btn is-primary"
        type="button"
        :disabled="mp4Busy"
        @click="$emit('download-mp4')"
      >
        下载 mp4
      </button>
    </div>
    <div v-if="mp4Busy" class="video-preview__status">
      <span class="video-preview__spinner" aria-hidden="true" />
      <span>视频格式转换中...</span>
    </div>
  </div>
</template>

<style scoped>
  .video-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
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
    margin-top: 8px;
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
    transition:
      background-color var(--duration-fast),
      color var(--duration-fast);
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
    opacity: 0.55;
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
  .video-preview__status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    color: var(--color-text-secondary);
    font-size: 13px;
  }
  .video-preview__spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
