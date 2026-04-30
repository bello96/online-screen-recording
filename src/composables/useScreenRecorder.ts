import { ref, onBeforeUnmount, getCurrentInstance, type Ref } from 'vue'
import { useAudioMixer } from './useAudioMixer'
import type { AudioOptions, RecorderState } from '@/types'

export interface UseScreenRecorder {
  state: Ref<RecorderState>
  duration: Ref<number>
  resultBlob: Ref<Blob | null>
  resultUrl: Ref<string | null>
  errorMessage: Ref<string | null>
  displayStream: Ref<MediaStream | null>
  start(opts: AudioOptions): Promise<void>
  pause(): void
  resume(): void
  stop(): void
  reset(): void
}

const PREFERRED_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
]

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return 'video/webm'
  }
  return PREFERRED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm'
}

export function useScreenRecorder(): UseScreenRecorder {
  const state = ref<RecorderState>('idle')
  const duration = ref(0)
  const resultBlob = ref<Blob | null>(null)
  const resultUrl = ref<string | null>(null)
  const errorMessage = ref<string | null>(null)
  const displayStream = ref<MediaStream | null>(null)

  let recorder: MediaRecorder | null = null
  let micStream: MediaStream | null = null
  let mixerCleanup: (() => Promise<void>) | null = null
  let chunks: Blob[] = []
  let timerInterval: ReturnType<typeof setInterval> | null = null
  let recordingStartedAt = 0
  let accumulatedMs = 0
  let videoTrackEndedHandler: (() => void) | null = null

  const mixer = useAudioMixer()

  function cleanupStreams() {
    displayStream.value?.getTracks().forEach((t) => t.stop())
    micStream?.getTracks().forEach((t) => t.stop())
    displayStream.value = null
    micStream = null
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function startTimer() {
    recordingStartedAt = performance.now()
    timerInterval = setInterval(() => {
      duration.value = Math.floor((accumulatedMs + (performance.now() - recordingStartedAt)) / 1000)
    }, 250)
  }

  async function start(opts: AudioOptions) {
    if (state.value !== 'idle') {
      return
    }
    errorMessage.value = null
    state.value = 'requesting'

    try {
      displayStream.value = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: opts.systemAudio,
      })
    } catch (err) {
      const e = err as DOMException
      if (e.name !== 'NotAllowedError') {
        errorMessage.value = `获取屏幕共享失败：${e.message}`
      }
      state.value = 'idle'
      return
    }

    if (opts.microphone) {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (err) {
        const e = err as DOMException
        errorMessage.value = `麦克风授权失败（${e.name}），将仅录制屏幕和系统声音`
        micStream = null
      }
    }

    const { audioTrack, cleanup } = mixer.mix([displayStream.value, micStream])
    mixerCleanup = cleanup

    const tracks: MediaStreamTrack[] = [...displayStream.value.getVideoTracks()]
    if (audioTrack) {
      tracks.push(audioTrack)
    }
    const combined = new MediaStream(tracks)

    recorder = new MediaRecorder(combined, { mimeType: pickMimeType() })
    chunks = []
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data)
      }
    }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder?.mimeType ?? 'video/webm' })
      resultBlob.value = blob
      resultUrl.value = URL.createObjectURL(blob)
      cleanupStreams()
      mixerCleanup?.()
      mixerCleanup = null
      stopTimer()
      state.value = 'stopped'
    }
    recorder.onerror = (e) => {
      errorMessage.value = `录制出错：${(e as unknown as Error).message ?? '未知错误'}`
      stop()
    }

    const videoTrack = displayStream.value.getVideoTracks()[0]
    videoTrackEndedHandler = () => stop()
    videoTrack.addEventListener('ended', videoTrackEndedHandler)

    accumulatedMs = 0
    duration.value = 0
    startTimer()
    recorder.start(1000)
    state.value = 'recording'
  }

  function pause() {
    if (state.value !== 'recording' || !recorder) {
      return
    }
    recorder.pause()
    accumulatedMs += performance.now() - recordingStartedAt
    stopTimer()
    state.value = 'paused'
  }

  function resume() {
    if (state.value !== 'paused' || !recorder) {
      return
    }
    recorder.resume()
    startTimer()
    state.value = 'recording'
  }

  function stop() {
    if (state.value === 'idle' || state.value === 'stopped') {
      return
    }
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
    if (videoTrackEndedHandler && displayStream.value) {
      const t = displayStream.value.getVideoTracks()[0]
      t?.removeEventListener('ended', videoTrackEndedHandler)
      videoTrackEndedHandler = null
    }
  }

  function reset() {
    if (resultUrl.value) {
      URL.revokeObjectURL(resultUrl.value)
    }
    resultUrl.value = null
    resultBlob.value = null
    chunks = []
    duration.value = 0
    accumulatedMs = 0
    errorMessage.value = null
    recorder = null
    state.value = 'idle'
  }

  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (state.value === 'recording' || state.value === 'paused') {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  if (getCurrentInstance()) {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }
    onBeforeUnmount(() => {
      if (state.value === 'recording' || state.value === 'paused') {
        stop()
      }
      cleanupStreams()
      mixerCleanup?.()
      stopTimer()
      if (resultUrl.value) {
        URL.revokeObjectURL(resultUrl.value)
        resultUrl.value = null
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    })
  }

  return {
    state,
    duration,
    resultBlob,
    resultUrl,
    errorMessage,
    displayStream,
    start,
    pause,
    resume,
    stop,
    reset,
  }
}
