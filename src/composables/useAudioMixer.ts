export interface MixResult {
  audioTrack: MediaStreamTrack | null
  cleanup: () => Promise<void>
}

export interface AudioMixer {
  mix(streams: Array<MediaStream | null | undefined>): MixResult
}

export function useAudioMixer(): AudioMixer {
  return {
    mix(streams) {
      const validStreams = streams.filter(
        (s): s is MediaStream => Boolean(s) && s!.getAudioTracks().length > 0,
      )

      if (validStreams.length === 0) {
        return {
          audioTrack: null,
          cleanup: async () => {
            /* nothing to clean */
          },
        }
      }

      const ctx = new AudioContext()
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
          if (ctx.state !== 'closed') {
            await ctx.close()
          }
        },
      }
    },
  }
}
