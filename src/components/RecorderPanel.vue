<script setup lang="ts">
  import { ref, computed, watchEffect } from 'vue'
  import RecorderButton from './RecorderButton.vue'
  import AudioOptions from './AudioOptions.vue'
  import RecordingTimer from './RecordingTimer.vue'
  import VideoPreview from './VideoPreview.vue'
  import { useScreenRecorder } from '@/composables/useScreenRecorder'
  import { useFormatConverter } from '@/composables/useFormatConverter'
  import type { AudioOptions as AudioOptionsType } from '@/types'

  const audioOpts = ref<AudioOptionsType>({ systemAudio: true, microphone: false })
  const recorder = useScreenRecorder()
  const converter = useFormatConverter()

  const liveVideoRef = ref<HTMLVideoElement | null>(null)

  const isControlling = computed(
    () => recorder.state.value === 'recording' || recorder.state.value === 'paused',
  )

  const fileNameBase = computed(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `在线录屏-${y}${m}${d}`
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
    if (!recorder.resultBlob.value) {
      return
    }
    try {
      const mp4Blob = await converter.convert(recorder.resultBlob.value, 'mp4')
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
          :aria-label="recorder.state.value === 'paused' ? '继续录制' : '暂停录制'"
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
          aria-label="结束录制"
          @click="handleStopClick"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>
      </div>
    </template>

    <template v-else-if="recorder.state.value !== 'stopped'">
      <div class="recorder-panel__main">
        <RecorderButton :state="recorder.state.value" @click="handleStartClick" />
      </div>
      <AudioOptions v-model="audioOpts" :disabled="recorder.state.value !== 'idle'" />
    </template>

    <VideoPreview
      v-else
      :video-url="recorder.resultUrl.value!"
      :file-name-base="fileNameBase"
      :mp4-converting="converter.converting.value"
      :mp4-progress="converter.progress.value"
      :mp4-loading-ffmpeg="converter.loading.value"
      :mp4-loading-progress="converter.loadingProgress.value"
      @reset="recorder.reset"
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
    background-color: #000;
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
    color: #fff;
    background: transparent;
    transition: background-color var(--duration-fast);
  }
  .recorder-panel__pause-btn:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }
  .recorder-panel__timer {
    padding: 0 12px;
    font-size: 18px;
    font-weight: 500;
    color: #fff;
  }
  .recorder-panel__stop-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    color: var(--color-primary);
    background-color: #fff;
    transition: background-color var(--duration-fast);
  }
  .recorder-panel__stop-btn:hover {
    background-color: #eef3ff;
  }
  .recorder-panel__error {
    color: var(--color-danger);
    font-size: 13px;
    background-color: #fff2f0;
    border: 1px solid #ffccc7;
    padding: 8px 16px;
    border-radius: var(--radius-button);
    max-width: 480px;
    text-align: center;
  }
</style>
