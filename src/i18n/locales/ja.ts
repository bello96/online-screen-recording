import type { Messages } from '../types'

const ja: Messages = {
  'app.title': 'オンライン画面録画',
  'app.unsupported':
    'このブラウザは画面録画に対応していません。最新のデスクトップ版 Chrome / Edge / Firefox をご利用ください。',
  'app.introTitle': 'ツールの紹介と使い方',
  'app.introBody':
    'ブラウザのタブ、特定のウィンドウ、または画面全体を録画できます。システム音声とマイク音声を同時に収録でき、録画後はオンラインでプレビューしてワンクリックでダウンロードできます。',

  'lang.switch': '言語を切り替える',

  'audio.system': 'システム音声',
  'audio.microphone': 'マイク',

  'recorder.start': '録画を開始',
  'recorder.stop': '録画を終了',
  'recorder.requesting': '許可を待っています...',
  'recorder.pause': '録画を一時停止',
  'recorder.resume': '録画を再開',
  'recorder.longWarning': 'メモリ使用量が増えるため、早めに録画を終了することをおすすめします',

  'preview.reset': 'もう一度録画',
  'preview.downloadWebm': 'webm をダウンロード',
  'preview.downloadMp4': 'mp4 をダウンロード',
  'preview.loadingConverter': '変換ツールを読み込み中...',
  'preview.converting': '動画を変換中... {percent}%',

  'guide.title': '操作ガイド',
  'guide.step1.title': '設定',
  'guide.step1.desc': 'システム音声 / マイクを選び、「録画を開始」をクリック',
  'guide.step2.title': '共有',
  'guide.step2.desc': '録画するタブ / ウィンドウ / 画面を選び、「共有」をクリック',
  'guide.step3.title': '録画',
  'guide.step3.desc': '途中で一時停止でき、「録画を終了」または「共有を停止」で完了',
  'guide.step4.title': 'ダウンロード',
  'guide.step4.desc': 'webm または mp4 形式でワンクリックでダウンロード',

  'file.prefix': '画面録画',

  'error.unknown': '不明なエラー',
  'error.displayMedia': '画面共有を取得できませんでした：{reason}',
  'error.micDenied': 'マイクの許可に失敗しました（{reason}）。画面とシステム音声のみ録画します',
  'error.recorderInit': '録画を開始できません：{reason}',
  'error.recording': '録画エラー：{reason}',
  'error.emptyRecording': '録画内容が空です。もう一度録画してください',
  'error.converterLoad': '動画変換ツールの読み込みに失敗しました：{reason}',
  'error.mp4Convert': 'MP4 への変換に失敗しました：{reason}',
}

export default ja
