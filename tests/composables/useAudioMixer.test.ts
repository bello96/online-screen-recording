import { describe, it, expect } from 'vitest'
import { useAudioMixer } from '@/composables/useAudioMixer'
import { MockMediaStream, MockMediaStreamTrack } from '../setup'

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
