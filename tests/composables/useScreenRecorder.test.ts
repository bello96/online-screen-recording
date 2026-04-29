import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { useScreenRecorder } from '@/composables/useScreenRecorder'

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
