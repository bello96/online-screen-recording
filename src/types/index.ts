export type RecorderState =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'paused'
  | 'stopped'

export interface AudioOptions {
  systemAudio: boolean
  microphone: boolean
}

export interface OperationStep {
  index: number
  title: string
  description: string
}
