# 在线录屏

参考 https://tool.browser.qq.com/screen_record.html 复刻的纯前端在线屏幕录制工具。

## 功能

- 录制 Chrome 标签页 / 应用窗口 / 整个屏幕
- 可选录入系统声音 + 麦克风音频（自动混流）
- 录制中支持暂停 / 继续 / 结束
- 录制完成后内嵌预览，一键下载（WebM 格式）
- 操作指引区域

## 技术栈

- Vue 3 + TypeScript + Vite
- 浏览器原生 `getDisplayMedia` / `getUserMedia` / `MediaRecorder` / `AudioContext`
- Vitest + @vue/test-utils 单元测试

## 浏览器支持

- ✅ Chrome / Edge / Firefox 桌面版最新版本
- ❌ 移动端浏览器（API 不完整）
- ❌ Safari（getDisplayMedia 支持有限）

## 本地开发

```bash
npm install
npm run dev      # 启动开发服务器
npm run build    # 构建生产产物
npm run preview  # 预览生产构建
npm test         # 运行单元测试
npm run lint     # 代码检查
npm run format   # 代码格式化
```

## 项目结构

```
src/
├── App.vue                    # 根组件
├── main.ts                    # 应用入口
├── components/
│   ├── RecorderPanel.vue      # 录制卡片容器
│   ├── RecorderButton.vue     # 状态化按钮
│   ├── AudioOptions.vue       # 音频选项
│   ├── RecordingTimer.vue     # 录制计时器
│   ├── VideoPreview.vue       # 预览/下载
│   └── OperationGuide.vue     # 操作指引
├── composables/
│   ├── useScreenRecorder.ts   # 录制状态机
│   └── useAudioMixer.ts       # 音频混流
├── types/index.ts
└── styles/                    # 全局样式与设计 token
```

## 部署

`npm run build` 后将 `dist/` 目录上传至任意静态托管即可（Vercel / Netlify / Cloudflare Pages / GitHub Pages 等）。无需后端。

## License

MIT
