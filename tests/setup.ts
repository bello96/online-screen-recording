import { vi, beforeEach } from 'vitest'

class MockMediaStreamTrack {
  kind: string
  enabled = true
  readyState: 'live' | 'ended' = 'live'
  private listeners: Record<string, Array<() => void>> = {}

  constructor(kind: string) {
    this.kind = kind
  }

  stop() {
    this.readyState = 'ended'
    this.dispatch('ended')
  }

  addEventListener(event: string, cb: () => void) {
    ;(this.listeners[event] ||= []).push(cb)
  }

  removeEventListener(event: string, cb: () => void) {
    this.listeners[event] = (this.listeners[event] || []).filter((c) => c !== cb)
  }

  dispatch(event: string) {
    ;(this.listeners[event] || []).forEach((cb) => cb())
  }
}

class MockMediaStream {
  private tracks: MockMediaStreamTrack[]
  constructor(tracks: MockMediaStreamTrack[] = []) {
    this.tracks = tracks
  }
  getTracks() {
    return this.tracks
  }
  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === 'video')
  }
  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === 'audio')
  }
  addTrack(t: MockMediaStreamTrack) {
    this.tracks.push(t)
  }
}

class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive'
  mimeType: string
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  static isTypeSupported = vi.fn().mockReturnValue(true)

  constructor(_stream: MockMediaStream, options?: { mimeType?: string }) {
    this.mimeType = options?.mimeType ?? 'video/webm'
  }
  start(_timeslice?: number) {
    this.state = 'recording'
  }
  pause() {
    this.state = 'paused'
  }
  resume() {
    this.state = 'recording'
  }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['x'], { type: this.mimeType }) })
    this.onstop?.()
  }
}

class MockAudioContext {
  state: 'running' | 'closed' = 'running'
  destination = {} as unknown
  createMediaStreamSource = vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
  })
  createMediaStreamDestination = vi.fn().mockReturnValue({
    stream: new MockMediaStream([new MockMediaStreamTrack('audio')]),
  })
  async close() {
    this.state = 'closed'
  }
}

beforeEach(() => {
  ;(globalThis as unknown as { MediaStream: typeof MockMediaStream }).MediaStream = MockMediaStream
  ;(globalThis as unknown as { MediaStreamTrack: typeof MockMediaStreamTrack }).MediaStreamTrack =
    MockMediaStreamTrack
  ;(globalThis as unknown as { MediaRecorder: typeof MockMediaRecorder }).MediaRecorder =
    MockMediaRecorder
  ;(globalThis as unknown as { AudioContext: typeof MockAudioContext }).AudioContext =
    MockAudioContext

  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    value: {
      getDisplayMedia: vi.fn().mockResolvedValue(
        new MockMediaStream([
          new MockMediaStreamTrack('video'),
          new MockMediaStreamTrack('audio'),
        ]),
      ),
      getUserMedia: vi.fn().mockResolvedValue(
        new MockMediaStream([new MockMediaStreamTrack('audio')]),
      ),
    },
    configurable: true,
  })

  if (!globalThis.URL.createObjectURL) {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    globalThis.URL.revokeObjectURL = vi.fn()
  }
})

export { MockMediaStream, MockMediaStreamTrack, MockMediaRecorder, MockAudioContext }
