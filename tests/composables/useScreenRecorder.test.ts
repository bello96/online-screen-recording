import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useScreenRecorder, type UseScreenRecorder } from '@/composables/useScreenRecorder'
import { setLocale } from '@/i18n'
import { MockMediaRecorder, MockMediaStream, MockMediaStreamTrack } from '../setup'

const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

describe('useScreenRecorder', () => {
  it('初始状态为 idle', () => {
    const r = useScreenRecorder()
    expect(r.state.value).toBe('idle')
    expect(r.duration.value).toBe(0)
    expect(r.resultBlob.value).toBeNull()
  })

  it('start 后状态进入 recording', async () => {
    const r = useScreenRecorder()
    await r.start({ systemAudio: true, microphone: false })
    await flush()
    expect(r.state.value).toBe('recording')
  })

  it('start 调用 getDisplayMedia 含 audio=true 当 systemAudio=true', async () => {
    const r = useScreenRecorder()
    const spy = vi.spyOn(navigator.mediaDevices, 'getDisplayMedia')
    await r.start({ systemAudio: true, microphone: false })
    expect(spy).toHaveBeenCalledWith({ video: true, audio: true })
  })

  it('当 microphone=true 时调用 getUserMedia', async () => {
    const r = useScreenRecorder()
    const spy = vi.spyOn(navigator.mediaDevices, 'getUserMedia')
    await r.start({ systemAudio: false, microphone: true })
    expect(spy).toHaveBeenCalledWith({ audio: true })
  })

  it('pause 后状态变 paused，resume 后回 recording', async () => {
    const r = useScreenRecorder()
    await r.start({ systemAudio: false, microphone: false })
    r.pause()
    expect(r.state.value).toBe('paused')
    r.resume()
    expect(r.state.value).toBe('recording')
  })

  it('stop 后状态变 stopped 且产出 blob', async () => {
    const r = useScreenRecorder()
    await r.start({ systemAudio: false, microphone: false })
    r.stop()
    await flush()
    expect(r.state.value).toBe('stopped')
    expect(r.resultBlob.value).not.toBeNull()
    expect(r.resultUrl.value).toBe('blob:mock-url')
  })

  it('用户拒绝授权 -> 回到 idle 不抛错', async () => {
    vi.spyOn(navigator.mediaDevices, 'getDisplayMedia').mockRejectedValueOnce(
      Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }),
    )
    const r = useScreenRecorder()
    await r.start({ systemAudio: false, microphone: false })
    await flush()
    expect(r.state.value).toBe('idle')
  })

  it('麦克风授权失败时设置警告但不阻断录制', async () => {
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValueOnce(
      Object.assign(new Error('Mic denied'), { name: 'NotAllowedError' }),
    )
    const r = useScreenRecorder()
    await r.start({ systemAudio: true, microphone: true })
    await flush()
    expect(r.state.value).toBe('recording')
    expect(r.errorMessage.value).toContain('麦克风')
  })

  it('reset 后状态回 idle 并撤销 ObjectURL', async () => {
    const r = useScreenRecorder()
    await r.start({ systemAudio: false, microphone: false })
    r.stop()
    await flush()
    const url = r.resultUrl.value
    expect(url).not.toBeNull()
    r.reset()
    expect(r.state.value).toBe('idle')
    expect(r.resultBlob.value).toBeNull()
    expect(r.resultUrl.value).toBeNull()
  })
})

describe('useScreenRecorder 边界', () => {
  function mockDisplayStream() {
    const video = new MockMediaStreamTrack('video')
    const audio = new MockMediaStreamTrack('audio')
    const stream = new MockMediaStream([video, audio])
    vi.spyOn(navigator.mediaDevices, 'getDisplayMedia').mockResolvedValueOnce(
      stream as unknown as MediaStream,
    )
    return { stream, video, audio }
  }

  it('MediaRecorder 构造失败 -> 回到 idle、给出错误并释放屏幕流', async () => {
    const { video } = mockDisplayStream()
    const Original = globalThis.MediaRecorder
    globalThis.MediaRecorder = class {
      static isTypeSupported = () => true
      constructor() {
        throw new Error('not supported')
      }
    } as unknown as typeof MediaRecorder
    try {
      const r = useScreenRecorder()
      await r.start({ systemAudio: true, microphone: false })
      expect(r.state.value).toBe('idle')
      expect(r.errorMessage.value).toContain('无法启动录制')
      expect(video.readyState).toBe('ended')
      expect(r.displayStream.value).toBeNull()
    } finally {
      globalThis.MediaRecorder = Original
    }
  })

  it('浏览器不支持任何首选 mimeType 时不传 mimeType', async () => {
    const isTypeSupported = vi
      .spyOn(MockMediaRecorder, 'isTypeSupported')
      .mockReturnValue(false)
    const r = useScreenRecorder()
    await r.start({ systemAudio: false, microphone: false })
    expect(r.state.value).toBe('recording')
    isTypeSupported.mockReturnValue(true)
  })

  it('等待麦克风授权期间停止共享 -> 不开始录制', async () => {
    const { video } = mockDisplayStream()
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockImplementationOnce(async () => {
      video.stop()
      return new MockMediaStream([new MockMediaStreamTrack('audio')]) as unknown as MediaStream
    })
    const r = useScreenRecorder()
    await r.start({ systemAudio: true, microphone: true })
    expect(r.state.value).toBe('idle')
    expect(r.displayStream.value).toBeNull()
  })

  it('用户点击「停止共享」触发 ended -> 自动结束录制', async () => {
    const { video } = mockDisplayStream()
    const r = useScreenRecorder()
    await r.start({ systemAudio: true, microphone: false })
    video.dispatch('ended')
    await flush()
    expect(r.state.value).toBe('stopped')
  })

  it('录制结果为空时回到 idle 并提示', async () => {
    const stopSpy = vi.spyOn(MockMediaRecorder.prototype, 'stop').mockImplementationOnce(function (
      this: MockMediaRecorder,
    ) {
      this.state = 'inactive'
      this.onstop?.()
    })
    const r = useScreenRecorder()
    await r.start({ systemAudio: false, microphone: false })
    r.stop()
    expect(r.state.value).toBe('idle')
    expect(r.resultUrl.value).toBeNull()
    expect(r.errorMessage.value).toContain('录制内容为空')
    stopSpy.mockRestore()
  })

  it('停止后释放屏幕流与麦克风流', async () => {
    const { video, audio } = mockDisplayStream()
    const micTrack = new MockMediaStreamTrack('audio')
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValueOnce(
      new MockMediaStream([micTrack]) as unknown as MediaStream,
    )
    const r = useScreenRecorder()
    await r.start({ systemAudio: true, microphone: true })
    r.stop()
    expect(video.readyState).toBe('ended')
    expect(audio.readyState).toBe('ended')
    expect(micTrack.readyState).toBe('ended')
  })

  it('授权过程中 reset -> 迟到的屏幕流被关闭且不进入录制', async () => {
    let resolve!: (s: MediaStream) => void
    vi.spyOn(navigator.mediaDevices, 'getDisplayMedia').mockImplementationOnce(
      () => new Promise<MediaStream>((r) => (resolve = r)),
    )
    const r = useScreenRecorder()
    const pending = r.start({ systemAudio: false, microphone: false })
    expect(r.state.value).toBe('requesting')
    r.reset()
    const video = new MockMediaStreamTrack('video')
    resolve(new MockMediaStream([video]) as unknown as MediaStream)
    await pending
    expect(r.state.value).toBe('idle')
    expect(video.readyState).toBe('ended')
  })

  it('pause 时 duration 精确到暂停时刻', async () => {
    vi.useFakeTimers({
      toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'performance'],
    })
    try {
      const r = useScreenRecorder()
      await r.start({ systemAudio: false, microphone: false })
      vi.advanceTimersByTime(3100)
      r.pause()
      expect(r.duration.value).toBe(3)
      vi.advanceTimersByTime(5000)
      expect(r.duration.value).toBe(3)
    } finally {
      vi.useRealTimers()
    }
  })

  it('组件卸载时停止录制且不再生成 ObjectURL', async () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL')
    createSpy.mockClear()
    let recorder!: UseScreenRecorder
    const Host = defineComponent({
      setup() {
        recorder = useScreenRecorder()
        return () => h('div')
      },
    })
    const { video } = mockDisplayStream()
    const w = mount(Host)
    await recorder.start({ systemAudio: true, microphone: false })
    w.unmount()
    expect(createSpy).not.toHaveBeenCalled()
    expect(video.readyState).toBe('ended')
    expect(recorder.state.value).toBe('idle')
  })

  it('errorMessage 随语言切换', async () => {
    vi.spyOn(navigator.mediaDevices, 'getDisplayMedia').mockRejectedValueOnce(
      Object.assign(new Error('boom'), { name: 'NotReadableError' }),
    )
    const r = useScreenRecorder()
    await r.start({ systemAudio: false, microphone: false })
    expect(r.errorMessage.value).toBe('获取屏幕共享失败：boom')
    setLocale('ja')
    expect(r.errorMessage.value).toBe('画面共有を取得できませんでした：boom')
  })
})
