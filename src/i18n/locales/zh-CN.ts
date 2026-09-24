const zhCN = {
  'app.title': '在线录屏',
  'app.unsupported': '当前浏览器不支持屏幕录制，请使用 Chrome / Edge / Firefox 桌面版最新版本。',
  'app.introTitle': '工具介绍及使用方法',
  'app.introBody':
    '在线录屏，支持录制指定浏览器标签页、指定窗口以及整个屏幕。可同时录入系统声音与麦克风音频，录制完成后可在线预览并一键下载到本地。',

  'lang.switch': '切换语言',

  'audio.system': '系统声音',
  'audio.microphone': '麦克风',

  'recorder.start': '开始录制',
  'recorder.stop': '结束录制',
  'recorder.requesting': '等待授权...',
  'recorder.pause': '暂停录制',
  'recorder.resume': '继续录制',
  'recorder.longWarning': '建议尽快结束录制以避免内存占用过高',

  'preview.reset': '重新录制',
  'preview.downloadWebm': '下载 webm',
  'preview.downloadMp4': '下载 mp4',
  'preview.loadingConverter': '正在加载转码器...',
  'preview.converting': '视频格式转换中... {percent}%',

  'guide.title': '操作指引',
  'guide.step1.title': '设置',
  'guide.step1.desc': '勾选系统声音 / 麦克风，点击「开始录制」',
  'guide.step2.title': '分享',
  'guide.step2.desc': '选择要录制的标签页 / 窗口 / 屏幕，点击「分享」',
  'guide.step3.title': '录制',
  'guide.step3.desc': '过程中可暂停，点击「结束录制」或「停止共享」完成',
  'guide.step4.title': '下载',
  'guide.step4.desc': '一键下载 webm 或 mp4 格式视频',

  'file.prefix': '在线录屏',

  'error.unknown': '未知错误',
  'error.displayMedia': '获取屏幕共享失败：{reason}',
  'error.micDenied': '麦克风授权失败（{reason}），将仅录制屏幕和系统声音',
  'error.recorderInit': '无法启动录制：{reason}',
  'error.recording': '录制出错：{reason}',
  'error.emptyRecording': '录制内容为空，请重新录制',
  'error.converterLoad': '加载视频转码器失败：{reason}',
  'error.mp4Convert': 'MP4 转换失败：{reason}',
}

export default zhCN
