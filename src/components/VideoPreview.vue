<script setup lang="ts">
  import { computed } from 'vue'
  import { t } from '@/i18n'

  const props = withDefaults(
    defineProps<{
      videoUrl: string
      fileNameBase: string
      mp4Busy?: boolean
      /** 正在下载 / 初始化转码器（此阶段没有进度） */
      mp4Loading?: boolean
      /** 转码进度 0~1 */
      mp4Progress?: number
    }>(),
    { mp4Busy: false, mp4Loading: false, mp4Progress: 0 },
  )

  defineEmits<{
    (e: 'reset'): void
    (e: 'download-mp4'): void
  }>()

  const webmFileName = computed(() => `${props.fileNameBase}.webm`)

  const statusText = computed(() =>
    props.mp4Loading
      ? t('preview.loadingConverter')
      : t('preview.converting', {
          percent: Math.round(Math.max(0, Math.min(1, props.mp4Progress)) * 100),
        }),
  )

  /**
   * MediaRecorder 产出的 webm 头部不含时长，Chrome 下 duration 为 Infinity，进度条无法拖动。
   * 先跳到极大时间点让浏览器扫描出真实时长，再跳回开头。
   */
  function handleLoadedMetadata(e: Event) {
    const video = e.target as HTMLVideoElement
    if (video.duration !== Infinity) {
      return
    }
    const restore = () => {
      video.removeEventListener('durationchange', restore)
      video.currentTime = 0
    }
    video.addEventListener('durationchange', restore)
    video.currentTime = Number.MAX_SAFE_INTEGER
  }
</script>

<template>
  <div class="video-preview">
    <video
      :src="videoUrl"
      controls
      preload="metadata"
      class="video-preview__video"
      @loadedmetadata="handleLoadedMetadata"
    />
    <div class="video-preview__actions">
      <button class="video-preview__btn is-secondary" type="button" @click="$emit('reset')">
        {{ t('preview.reset') }}
      </button>
      <a :href="videoUrl" :download="webmFileName" class="video-preview__btn is-primary">
        {{ t('preview.downloadWebm') }}
      </a>
      <button
        class="video-preview__btn is-primary"
        type="button"
        :disabled="mp4Busy"
        @click="$emit('download-mp4')"
      >
        {{ t('preview.downloadMp4') }}
      </button>
    </div>
    <div v-if="mp4Busy" class="video-preview__status" role="status">
      <span class="video-preview__spinner" aria-hidden="true" />
      <span>{{ statusText }}</span>
    </div>
  </div>
</template>

<style scoped>
  .video-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
  }
  .video-preview__video {
    width: 100%;
    max-width: 720px;
    border-radius: var(--radius-card);
    background-color: var(--color-video-bg);
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
    color: var(--color-on-primary);
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
    font-variant-numeric: tabular-nums;
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
