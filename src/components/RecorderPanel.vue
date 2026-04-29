<script setup lang="ts">
  import { ref, computed } from 'vue'
  import RecorderButton from './RecorderButton.vue'
  import AudioOptions from './AudioOptions.vue'
  import RecordingTimer from './RecordingTimer.vue'
  import VideoPreview from './VideoPreview.vue'
  import { useScreenRecorder } from '@/composables/useScreenRecorder'
  import type { AudioOptions as AudioOptionsType } from '@/types'

  const audioOpts = ref<AudioOptionsType>({ systemAudio: true, microphone: false })
  const recorder = useScreenRecorder()

  const isControlling = computed(
    () => recorder.state.value === 'recording' || recorder.state.value === 'paused',
  )

  const fileName = computed(() => {
    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
    return `screen-recording-${stamp}.webm`
  })

  function handleMainClick() {
    if (recorder.state.value === 'idle') {
      recorder.start(audioOpts.value)
    } else if (isControlling.value) {
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
</script>

<template>
  <div class="recorder-panel">
    <template v-if="recorder.state.value !== 'stopped'">
      <div class="recorder-panel__main">
        <RecorderButton :state="recorder.state.value" @click="handleMainClick" />

        <button
          v-if="isControlling"
          class="recorder-panel__pause"
          type="button"
          @click="handlePauseToggle"
        >
          {{ recorder.state.value === 'paused' ? '继续录制' : '暂停录制' }}
        </button>

        <RecordingTimer v-if="isControlling" :seconds="recorder.duration.value" />
      </div>

      <AudioOptions
        v-model="audioOpts"
        :disabled="recorder.state.value !== 'idle'"
      />

      <div v-if="recorder.errorMessage.value" class="recorder-panel__error" role="alert">
        {{ recorder.errorMessage.value }}
      </div>
    </template>

    <VideoPreview
      v-else
      :video-url="recorder.resultUrl.value!"
      :file-name="fileName"
      @reset="recorder.reset"
    />
  </div>
</template>

<style scoped>
  .recorder-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 56px 0 40px;
  }
  .recorder-panel__main {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .recorder-panel__pause {
    padding: 10px 20px;
    font-size: 14px;
    color: var(--color-text);
    background-color: var(--color-step-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    transition: background-color var(--duration-fast);
  }
  .recorder-panel__pause:hover {
    background-color: var(--color-border);
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
