<script setup lang="ts">
  import { ref, computed, watch, watchEffect } from 'vue'
  import RecorderButton from './RecorderButton.vue'
  import AudioOptions from './AudioOptions.vue'
  import RecordingTimer from './RecordingTimer.vue'
  import VideoPreview from './VideoPreview.vue'
  import { useScreenRecorder } from '@/composables/useScreenRecorder'
  import { useFormatConverter } from '@/composables/useFormatConverter'
  import { t } from '@/i18n'
  import { RECORDING_WARNING_SECONDS } from '@/constants'
  import type { AudioOptions as AudioOptionsType } from '@/types'

  const audioOpts = ref<AudioOptionsType>({ systemAudio: true, microphone: false })
  const recorder = useScreenRecorder()
  const converter = useFormatConverter()

  const liveVideoRef = ref<HTMLVideoElement | null>(null)
  // 录制完成的时间，用于生成文件名（每次录制结束时刷新，而不是页面首次渲染时）
  const recordedAt = ref(new Date())

  const isControlling = computed(
    () => recorder.state.value === 'recording' || recorder.state.value === 'paused',
  )

  const showLongWarning = computed(
    () => isControlling.value && recorder.duration.value >= RECORDING_WARNING_SECONDS,
  )

  const fileNameBase = computed(() => {
    const date = recordedAt.value
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${t('file.prefix')}-${y}${m}${d}`
  })

  watch(recorder.state, (state) => {
    if (state === 'stopped') {
      recordedAt.value = new Date()
    }
  })

  watchEffect(() => {
    const el = liveVideoRef.value
    const stream = recorder.displayStream.value
    if (el) {
      el.srcObject = stream
    }
  })

  function handleStartClick() {
    if (recorder.state.value === 'idle') {
      converter.clearError()
      recorder.start(audioOpts.value)
    }
  }

  function handleStopClick() {
    if (isControlling.value) {
      recorder.stop()
    }
  }

  function handlePauseToggle() {
    if (recorder.state.value === 'recording') {
      recorder.pause()
    } else if (recorder.state.value === 'paused') {
      recorder.resume()
    }
  }

  function handleReset() {
    converter.clearError()
    recorder.reset()
  }

  function triggerDownload(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function handleMp4Download() {
    const source = recorder.resultBlob.value
    if (!source) {
      return
    }
    try {
      const mp4Blob = await converter.convert(source, 'mp4')
      // 转码期间用户可能已点「重新录制」，此时不再下载旧视频
      if (recorder.resultBlob.value !== source) {
        return
      }
      triggerDownload(mp4Blob, `${fileNameBase.value}.mp4`)
    } catch {
      /* errorMessage 由 converter 内部设置 */
    }
  }

  const errorText = computed(() => recorder.errorMessage.value || converter.errorMessage.value)
</script>

<template>
  <div class="recorder-panel">
    <template v-if="isControlling">
      <div class="recorder-panel__live">
        <video ref="liveVideoRef" autoplay muted playsinline class="recorder-panel__live-video" />
      </div>
      <div class="recorder-panel__control-bar">
        <button
          class="recorder-panel__pause-btn"
          type="button"
          :aria-label="recorder.state.value === 'paused' ? t('recorder.resume') : t('recorder.pause')"
          :title="recorder.state.value === 'paused' ? t('recorder.resume') : t('recorder.pause')"
          @click="handlePauseToggle"
        >
          <svg
            v-if="recorder.state.value === 'recording'"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        </button>
        <RecordingTimer :seconds="recorder.duration.value" compact class="recorder-panel__timer" />
        <button
          class="recorder-panel__stop-btn"
          type="button"
          :aria-label="t('recorder.stop')"
          :title="t('recorder.stop')"
          @click="handleStopClick"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>
      </div>
      <p v-if="showLongWarning" class="recorder-panel__warning" role="status">
        {{ t('recorder.longWarning') }}
      </p>
    </template>

    <template v-else-if="recorder.state.value !== 'stopped' || !recorder.resultUrl.value">
      <div class="recorder-panel__main">
        <RecorderButton :state="recorder.state.value" @click="handleStartClick" />
      </div>
      <AudioOptions v-model="audioOpts" :disabled="recorder.state.value !== 'idle'" />
    </template>

    <VideoPreview
      v-else
      :video-url="recorder.resultUrl.value"
      :file-name-base="fileNameBase"
      :mp4-busy="converter.loading.value || converter.converting.value"
      :mp4-loading="converter.loading.value"
      :mp4-progress="converter.progress.value"
      @reset="handleReset"
      @download-mp4="handleMp4Download"
    />

    <div v-if="errorText" class="recorder-panel__error" role="alert">
      {{ errorText }}
    </div>
  </div>
</template>
<style scoped>
  .recorder-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 40px 0;
  }
  .recorder-panel__main {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .recorder-panel__live {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .recorder-panel__live-video {
    width: 100%;
    max-width: 720px;
    max-height: 480px;
    border-radius: var(--radius-card);
    background-color: var(--color-video-bg);
    object-fit: contain;
  }
  .recorder-panel__control-bar {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 6px 6px 12px;
    background-color: var(--color-primary);
    border-radius: 999px;
    box-shadow: var(--shadow-button);
  }
  .recorder-panel__pause-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: var(--color-on-primary);
    background: transparent;
    transition: background-color var(--duration-fast);
  }
  .recorder-panel__pause-btn:hover {
    background-color: var(--color-overlay-hover);
  }
  .recorder-panel__timer {
    padding: 0 12px;
    font-size: 18px;
    font-weight: 500;
    color: var(--color-on-primary);
  }
  .recorder-panel__stop-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    color: var(--color-primary);
    background-color: var(--color-on-primary);
    transition: background-color var(--duration-fast);
  }
  .recorder-panel__stop-btn:hover {
    background-color: var(--color-primary-lighter);
  }
  .recorder-panel__warning {
    margin: -8px 0 0;
    color: var(--color-danger);
    font-size: 13px;
    text-align: center;
  }
  .recorder-panel__error {
    color: var(--color-danger);
    font-size: 13px;
    background-color: var(--color-danger-bg);
    border: 1px solid var(--color-danger-border);
    padding: 8px 16px;
    border-radius: var(--radius-button);
    max-width: 480px;
    text-align: center;
  }
</style>
