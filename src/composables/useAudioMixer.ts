export interface MixResult {
  audioTrack: MediaStreamTrack | null
  cleanup: () => Promise<void>
}

export interface AudioMixer {
  mix(streams: Array<MediaStream | null | undefined>): MixResult
}

const noop = async () => {
  /* nothing to clean */
}

export function useAudioMixer(): AudioMixer {
  return {
    mix(streams) {
      const validStreams = streams.filter(
        (s): s is MediaStream => Boolean(s) && s!.getAudioTracks().length > 0,
      )

      if (validStreams.length === 0) {
        return { audioTrack: null, cleanup: noop }
      }

      // 单路音频无需混流：直接复用原始音轨，省掉 AudioContext 的重采样开销；
      // 原始音轨由调用方随源 stream 一起关闭
      if (validStreams.length === 1) {
        return { audioTrack: validStreams[0].getAudioTracks()[0], cleanup: noop }
      }

      const ctx = new AudioContext()
      // 用户授权弹窗停留过久时 AudioContext 可能处于 suspended，导致录成静音
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {
          /* 无法恢复时保持现状，由浏览器决定 */
        })
      }
      const destination = ctx.createMediaStreamDestination()
      const sources = validStreams.map((s) => ctx.createMediaStreamSource(s))
      sources.forEach((src) => src.connect(destination))

      const [audioTrack] = destination.stream.getAudioTracks()

      return {
        audioTrack: audioTrack ?? null,
        cleanup: async () => {
          sources.forEach((src) => {
            try {
              src.disconnect()
            } catch {
              /* already disconnected */
            }
          })
          audioTrack?.stop()
          if (ctx.state !== 'closed') {
            await ctx.close()
          }
        },
      }
    },
  }
}
