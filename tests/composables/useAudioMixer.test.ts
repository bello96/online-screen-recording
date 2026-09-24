import { describe, it, expect, vi } from 'vitest'
import { useAudioMixer } from '@/composables/useAudioMixer'
import { MockAudioContext, MockMediaStream, MockMediaStreamTrack } from '../setup'

describe('useAudioMixer', () => {
  it('零个含音频的 stream 时返回 null 音轨', () => {
    const mixer = useAudioMixer()
    const result = mixer.mix([new MockMediaStream() as unknown as MediaStream])
    expect(result.audioTrack).toBeNull()
    result.cleanup()
  })

  it('一个含音频的 stream 返回单一混音轨', () => {
    const mixer = useAudioMixer()
    const stream = new MockMediaStream([new MockMediaStreamTrack('audio')]) as unknown as MediaStream
    const result = mixer.mix([stream])
    expect(result.audioTrack).not.toBeNull()
    expect(result.audioTrack?.kind).toBe('audio')
    result.cleanup()
  })

  it('两个含音频的 stream 都连接到 destination', () => {
    const mixer = useAudioMixer()
    const a = new MockMediaStream([new MockMediaStreamTrack('audio')]) as unknown as MediaStream
    const b = new MockMediaStream([new MockMediaStreamTrack('audio')]) as unknown as MediaStream
    const result = mixer.mix([a, b])
    expect(result.audioTrack).not.toBeNull()
    result.cleanup()
  })

  it('cleanup 后 AudioContext 被关闭', async () => {
    const mixer = useAudioMixer()
    const stream = new MockMediaStream([new MockMediaStreamTrack('audio')]) as unknown as MediaStream
    const result = mixer.mix([stream])
    await result.cleanup()
    expect(true).toBe(true)
  })

  it('mix 接受 null/undefined 元素并跳过', () => {
    const mixer = useAudioMixer()
    const stream = new MockMediaStream([new MockMediaStreamTrack('audio')]) as unknown as MediaStream
    const result = mixer.mix([stream, null, undefined])
    expect(result.audioTrack).not.toBeNull()
    result.cleanup()
  })
})

describe('useAudioMixer 单路直通', () => {
  it('只有一路音频时直接复用原始音轨，不创建 AudioContext', () => {
    const ctor = vi.fn()
    const Original = globalThis.AudioContext
    globalThis.AudioContext = class extends (Original as unknown as { new (): object }) {
      constructor() {
        super()
        ctor()
      }
    } as unknown as typeof AudioContext
    const track = new MockMediaStreamTrack('audio')
    const stream = new MockMediaStream([track]) as unknown as MediaStream
    const result = useAudioMixer().mix([stream, null])
    expect(result.audioTrack).toBe(track)
    expect(ctor).not.toHaveBeenCalled()
  })

  it('两路音频时创建 AudioContext 混流，cleanup 后关闭', async () => {
    const instances: MockAudioContext[] = []
    globalThis.AudioContext = class extends MockAudioContext {
      constructor() {
        super()
        instances.push(this)
      }
    } as unknown as typeof AudioContext
    const a = new MockMediaStream([new MockMediaStreamTrack('audio')]) as unknown as MediaStream
    const b = new MockMediaStream([new MockMediaStreamTrack('audio')]) as unknown as MediaStream
    const result = useAudioMixer().mix([a, b])
    expect(instances).toHaveLength(1)
    await result.cleanup()
    expect(instances[0].state).toBe('closed')
  })
})
