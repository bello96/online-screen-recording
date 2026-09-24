import { ref, computed, onBeforeUnmount, getCurrentInstance, type Ref } from 'vue'
import { useAudioMixer } from './useAudioMixer'
import { translateError, type I18nError } from '@/i18n'
import type { AudioOptions, RecorderState } from '@/types'

export interface UseScreenRecorder {
  state: Ref<RecorderState>
  duration: Ref<number>
  resultBlob: Ref<Blob | null>
  resultUrl: Ref<string | null>
  /** 已按当前语言翻译的错误文案，切换语言时自动更新 */
  errorMessage: Readonly<Ref<string | null>>
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

/** 返回 undefined 表示交给浏览器选择默认格式，避免传入不支持的 mimeType 导致构造函数抛错 */
function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined
  }
  return PREFERRED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t))
}

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop())
}

export function useScreenRecorder(): UseScreenRecorder {
  const state = ref<RecorderState>('idle')
  const duration = ref(0)
  const resultBlob = ref<Blob | null>(null)
  const resultUrl = ref<string | null>(null)
  const error = ref<I18nError | null>(null)
  const errorMessage = computed(() => translateError(error.value))
  const displayStream = ref<MediaStream | null>(null)

  let recorder: MediaRecorder | null = null
  let micStream: MediaStream | null = null
  let mixerCleanup: (() => Promise<void>) | null = null
  let chunks: Blob[] = []
  let timerInterval: ReturnType<typeof setInterval> | null = null
  let recordingStartedAt = 0
  let accumulatedMs = 0
  let watchedVideoTrack: MediaStreamTrack | null = null
  // 每次 start / reset / 卸载都会递增；异步流程恢复时据此判断自己是否已过期
  let session = 0
  let disposed = false

  const mixer = useAudioMixer()

  function handleVideoTrackEnded() {
    stop()
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function startTimer() {
    stopTimer()
    recordingStartedAt = performance.now()
    timerInterval = setInterval(() => {
      duration.value = Math.floor((accumulatedMs + (performance.now() - recordingStartedAt)) / 1000)
    }, 250)
  }

  /** 释放录制期间持有的所有媒体资源（stream / AudioContext / 计时器 / 事件监听），可重复调用 */
  function releaseMedia() {
    stopTimer()
    // 先解绑再关闭轨道，避免 track.stop() 触发 ended 回调重入 stop()
    watchedVideoTrack?.removeEventListener('ended', handleVideoTrackEnded)
    watchedVideoTrack = null
    stopTracks(displayStream.value)
    stopTracks(micStream)
    displayStream.value = null
    micStream = null
    const cleanup = mixerCleanup
    mixerCleanup = null
    cleanup?.().catch(() => {
      /* AudioContext 关闭失败不影响后续流程 */
    })
  }

  function detachRecorder() {
    if (!recorder) {
      return
    }
    recorder.ondataavailable = null
    recorder.onstop = null
    recorder.onerror = null
    if (recorder.state !== 'inactive') {
      try {
        recorder.stop()
      } catch {
        /* 已经停止 */
      }
    }
    recorder = null
  }

  function isStale(current: number) {
    return disposed || current !== session
  }

  async function start(opts: AudioOptions) {
    if (state.value !== 'idle') {
      return
    }
    const current = ++session
    error.value = null
    state.value = 'requesting'

    let screen: MediaStream
    try {
      screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: opts.systemAudio,
      })
    } catch (err) {
      if (isStale(current)) {
        return
      }
      const e = err as DOMException
      // 用户主动取消不算错误
      if (e?.name !== 'NotAllowedError') {
        error.value = { key: 'error.displayMedia', reason: e?.message }
      }
      state.value = 'idle'
      return
    }
    if (isStale(current)) {
      stopTracks(screen)
      return
    }
    displayStream.value = screen

    if (opts.microphone) {
      try {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (isStale(current)) {
          stopTracks(mic)
          return
        }
        micStream = mic
      } catch (err) {
        if (isStale(current)) {
          return
        }
        error.value = { key: 'error.micDenied', reason: (err as DOMException)?.name }
        micStream = null
      }
    }

    const videoTrack = screen.getVideoTracks()[0]
    // 等待麦克风授权期间用户可能已经点了「停止共享」
    if (!videoTrack || videoTrack.readyState === 'ended') {
      releaseMedia()
      state.value = 'idle'
      return
    }

    let rec: MediaRecorder
    try {
      const { audioTrack, cleanup } = mixer.mix([screen, micStream])
      mixerCleanup = cleanup

      const tracks: MediaStreamTrack[] = [videoTrack]
      if (audioTrack) {
        tracks.push(audioTrack)
      }
      const mimeType = pickMimeType()
      rec = new MediaRecorder(new MediaStream(tracks), mimeType ? { mimeType } : undefined)
      chunks = []
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      rec.onstop = () => handleRecorderStop(rec)
      rec.onerror = (e) => {
        const reason = (e as Event & { error?: DOMException }).error?.message
        error.value = { key: 'error.recording', reason }
        stop()
      }
      recorder = rec
      rec.start(1000)
    } catch (err) {
      recorder = null
      releaseMedia()
      error.value = { key: 'error.recorderInit', reason: (err as Error)?.message }
      state.value = 'idle'
      return
    }

    watchedVideoTrack = videoTrack
    videoTrack.addEventListener('ended', handleVideoTrackEnded)

    accumulatedMs = 0
    duration.value = 0
    startTimer()
    state.value = 'recording'
  }

  function handleRecorderStop(rec: MediaRecorder) {
    if (rec !== recorder) {
      return
    }
    const blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' })
    chunks = []
    recorder = null
    releaseMedia()
    if (disposed) {
      return
    }
    if (blob.size === 0) {
      error.value = { key: 'error.emptyRecording' }
      state.value = 'idle'
      return
    }
    resultBlob.value = blob
    resultUrl.value = URL.createObjectURL(blob)
    state.value = 'stopped'
  }

  function pause() {
    if (state.value !== 'recording' || !recorder) {
      return
    }
    recorder.pause()
    accumulatedMs += performance.now() - recordingStartedAt
    duration.value = Math.floor(accumulatedMs / 1000)
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
    if (state.value !== 'recording' && state.value !== 'paused') {
      return
    }
    if (state.value === 'recording') {
      accumulatedMs += performance.now() - recordingStartedAt
      duration.value = Math.floor(accumulatedMs / 1000)
    }
    stopTimer()
    if (recorder && recorder.state !== 'inactive') {
      // 产物在 onstop 中生成
      recorder.stop()
      return
    }
    // recorder 已意外失效，没有 onstop 可等，直接回收
    recorder = null
    releaseMedia()
    state.value = 'idle'
  }

  /** 丢弃当前产物与一切进行中的流程，回到 idle；任意状态下调用都安全 */
  function reset() {
    session++
    detachRecorder()
    releaseMedia()
    if (resultUrl.value) {
      URL.revokeObjectURL(resultUrl.value)
    }
    resultUrl.value = null
    resultBlob.value = null
    chunks = []
    duration.value = 0
    accumulatedMs = 0
    error.value = null
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
      disposed = true
      reset()
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
