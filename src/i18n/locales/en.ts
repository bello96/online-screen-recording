import type { Messages } from '../types'

const en: Messages = {
  'app.title': 'Online Screen Recorder',
  'app.unsupported':
    'Screen recording is not supported in this browser. Please use the latest desktop version of Chrome, Edge or Firefox.',
  'app.introTitle': 'About this tool',
  'app.introBody':
    'Record a browser tab, a specific window or your entire screen, right in the browser. System audio and microphone can be captured together. Preview the result online and download it with one click.',

  'lang.switch': 'Change language',

  'audio.system': 'System audio',
  'audio.microphone': 'Microphone',

  'recorder.start': 'Start recording',
  'recorder.stop': 'Stop recording',
  'recorder.requesting': 'Waiting for permission...',
  'recorder.pause': 'Pause recording',
  'recorder.resume': 'Resume recording',
  'recorder.longWarning': 'Consider stopping soon to avoid high memory usage',

  'preview.reset': 'Record again',
  'preview.downloadWebm': 'Download webm',
  'preview.downloadMp4': 'Download mp4',
  'preview.loadingConverter': 'Loading converter...',
  'preview.converting': 'Converting video... {percent}%',

  'guide.title': 'How it works',
  'guide.step1.title': 'Set up',
  'guide.step1.desc': 'Choose system audio / microphone, then click "Start recording"',
  'guide.step2.title': 'Share',
  'guide.step2.desc': 'Pick the tab / window / screen to record and click "Share"',
  'guide.step3.title': 'Record',
  'guide.step3.desc': 'Pause anytime; click "Stop recording" or "Stop sharing" to finish',
  'guide.step4.title': 'Download',
  'guide.step4.desc': 'Download the video as webm or mp4 in one click',

  'file.prefix': 'screen-recording',

  'error.unknown': 'Unknown error',
  'error.displayMedia': 'Failed to capture the screen: {reason}',
  'error.micDenied':
    'Microphone access failed ({reason}). Only the screen and system audio will be recorded',
  'error.recorderInit': 'Unable to start recording: {reason}',
  'error.recording': 'Recording error: {reason}',
  'error.emptyRecording': 'The recording is empty, please record again',
  'error.converterLoad': 'Failed to load the video converter: {reason}',
  'error.mp4Convert': 'MP4 conversion failed: {reason}',
}

export default en
