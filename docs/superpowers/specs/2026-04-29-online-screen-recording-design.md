# 在线录屏 — 设计文档

- 日期：2026-04-29
- 参考实现：https://tool.browser.qq.com/screen_record.html

## 一、目标与范围

复刻参考实现的核心功能与视觉，纯前端实现：

- 屏幕/窗口/标签页录制
- 可选录入系统声音、麦克风（可同时）
- 录制中支持暂停 / 继续 / 结束
- 录制完成后预览、下载视频文件
- 操作指引区按 4 步陈列

不在范围内：
- 后端转码（视频以浏览器原生 WebM 输出）
- mp4 输出（需要 ffmpeg.wasm，体积/复杂度不划算）
- 账号体系、云端存储
- 视频剪辑、字幕、滤镜等编辑功能
- 移动端适配（屏幕录制 API 在桌面浏览器才完整可用）

## 二、技术栈

- Vue 3（`<script setup>` + Composition API）
- TypeScript（严格模式）
- Vite（构建与开发服务器）
- 自定义 CSS（无 UI 库，确保视觉与原页面一致并控制 bundle）
- vitest + Vue Test Utils（单元测试）
- ESLint + Prettier（lint 与格式）

无后端，构建产物为静态资源，可部署到任意静态托管。

## 三、架构

### 3.1 文件结构

```
online-screen-recording/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── CLAUDE.md
├── README.md
└── src/
    ├── main.ts
    ├── App.vue
    ├── components/
    │   ├── RecorderPanel.vue
    │   ├── RecorderButton.vue
    │   ├── AudioOptions.vue
    │   ├── RecordingTimer.vue
    │   ├── OperationGuide.vue
    │   └── VideoPreview.vue
    ├── composables/
    │   ├── useScreenRecorder.ts
    │   └── useAudioMixer.ts
    ├── types/index.ts
    ├── styles/
    │   ├── variables.css
    │   └── global.css
    └── assets/icons/
```

### 3.2 状态机

```
idle ──[click 开始]──▶ requesting ──[user grants]──▶ recording ⇄ paused
  ▲                        │                            │
  │                        │                            │
  │                     [denied]               [click 结束 / track ended]
  │                        │                            │
  │                        ▼                            ▼
  └────────[click 重录]──── idle ◀───────────────── stopped (有 blob)
```

`recorder.state`: `'idle' | 'requesting' | 'recording' | 'paused' | 'stopped'`

### 3.3 组件职责

| 组件 | 职责 |
|------|------|
| `App.vue` | 整体布局：顶部"在线录屏"标题栏、中央录制卡片、操作指引、底部工具介绍。提供 `useScreenRecorder` 状态注入 |
| `RecorderPanel.vue` | 录制卡片容器；根据状态机切换"开始按钮+音频选项"与"录制中按钮组+计时器"与"预览+下载/重录" |
| `RecorderButton.vue` | 主按钮，根据 props.state 切换文案/颜色/图标；emit `click` |
| `AudioOptions.vue` | 两个复选框（系统声音/麦克风），`v-model` 绑定 `{ systemAudio, microphone }`；录制中禁用 |
| `RecordingTimer.vue` | 接受 `startTime`，每秒刷新展示 `mm:ss`；暂停时停止累加 |
| `OperationGuide.vue` | 静态展示 4 步指引（左侧用 HTML/CSS 还原一个小型录制 UI 预览 + 两个气泡提示，右侧步骤列表，第 1 步高亮） |
| `VideoPreview.vue` | `<video>` 预览 + "下载视频" + "重新录制" 按钮 |

### 3.4 Composables

#### `useScreenRecorder.ts`

封装录制状态机，向外暴露：

```ts
interface AudioOptions {
  systemAudio: boolean
  microphone: boolean
}

interface UseScreenRecorder {
  state: Ref<RecorderState>
  duration: Ref<number>          // 已录秒数
  resultBlob: Ref<Blob | null>
  resultUrl: Ref<string | null>  // ObjectURL，stopped 后可用
  errorMessage: Ref<string | null>
  start(opts: AudioOptions): Promise<void>
  pause(): void
  resume(): void
  stop(): void
  reset(): void                  // 回到 idle，释放 ObjectURL
}
```

内部责任：
- 调用 `getDisplayMedia` / `getUserMedia`
- 通过 `useAudioMixer` 合并音频轨
- 创建 `MediaRecorder`，处理 `dataavailable` / `stop` / `error`
- 监听视频轨 `ended`（用户在浏览器停止共享）
- 维护计时器（`requestAnimationFrame` 或 `setInterval`，暂停时停表）
- 在 `stop` / `reset` / 卸载时清理：撤销 ObjectURL、关闭 AudioContext、停掉所有轨

#### `useAudioMixer.ts`

```ts
interface AudioMixer {
  mix(streams: MediaStream[]): { audioTrack: MediaStreamTrack | null; cleanup: () => void }
}
```

- 创建 `AudioContext` + `MediaStreamDestination`
- 对每个有音频轨的 stream，创建 `MediaStreamSource` 并 `connect(destination)`
- 返回单一混音轨；零音频源时返回 `null`
- `cleanup` 关闭 context 并断开节点

## 四、关键流程

### 4.1 开始录制

1. `App.vue` 监听 `RecorderButton` click，调用 `recorder.start({ systemAudio, microphone })`
2. `useScreenRecorder.start`:
   1. `state = 'requesting'`
   2. `displayStream = await getDisplayMedia({ video: true, audio: systemAudio })`
   3. 若 `microphone`：`micStream = await getUserMedia({ audio: true })`（失败仅警告，不中断）
   4. `{ audioTrack, cleanup } = mixer.mix([displayStream, micStream])`
   5. `combinedStream = new MediaStream([...displayStream.getVideoTracks(), audioTrack].filter(Boolean))`
   6. `recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus' })`
      - fallback 链：`vp9,opus` → `vp8,opus` → `'video/webm'`
   7. `recorder.ondataavailable = e => chunks.push(e.data)`
   8. 监听 `displayStream.getVideoTracks()[0].onended = () => stop()`
   9. `recorder.start(1000)`，记录 `startTime = performance.now()`，`state = 'recording'`

### 4.2 暂停 / 继续

- `pause()`: `recorder.pause()`，停表，`state = 'paused'`
- `resume()`: `recorder.resume()`，记下"继续时刻"以便计时器累加，`state = 'recording'`

### 4.3 结束录制

1. `recorder.stop()`（异步触发 `onstop`）
2. `onstop`:
   - `blob = new Blob(chunks, { type: recorder.mimeType })`
   - `resultUrl = URL.createObjectURL(blob)`
   - 关停所有原始轨、调用 mixer.cleanup
   - `state = 'stopped'`

### 4.4 下载

`VideoPreview` 中：

```html
<a :href="resultUrl" :download="`screen-recording-${timestamp}.webm`">下载视频</a>
```

### 4.5 重录

`reset()`：撤销 ObjectURL、清空 chunks/blob、`state = 'idle'`，回到初始页面。

## 五、错误与边界

| 场景 | 行为 |
|------|------|
| `navigator.mediaDevices.getDisplayMedia` 不存在（含 iOS Safari、旧版 Safari） | 启动时检测，禁用按钮并提示"当前浏览器不支持屏幕录制，请使用 Chrome / Edge / Firefox 桌面版最新版本" |
| 用户在系统对话框点取消（`NotAllowedError`） | 静默回到 idle，不弹错误 |
| `getUserMedia` 麦克风失败 | 提示一次"麦克风授权失败，将仅录制屏幕和系统声音"，继续录制 |
| 视频轨 `ended` | 自动 `stop()` |
| MediaRecorder `error` 事件 | `stop()`，记录错误信息到 `errorMessage` 并展示 |
| 录制时长达到 30 分钟后 | 在计时器旁持续显示红色提示"建议尽快结束录制以避免内存占用过高" |
| 录制中刷新 / 关闭页面 | `beforeunload` 监听，录制状态下返回非空字符串触发原生确认 |
| 组件卸载 | `onBeforeUnmount` 调用 `reset()` 释放资源 |

## 六、视觉规范

### 6.1 设计 token（CSS variables）

```css
:root {
  --color-primary: #3b7eff;
  --color-primary-hover: #5590ff;
  --color-primary-active: #2e6ce0;
  --color-danger: #f53f3f;
  --color-text: #1f2329;
  --color-text-secondary: #86909c;
  --color-bg: #f5f7fa;
  --color-card: #ffffff;
  --color-border: #e5e6eb;
  --color-step-active-bg: #3b7eff;
  --color-step-active-text: #ffffff;
  --color-step-bg: #f7f8fa;

  --radius-card: 12px;
  --radius-button: 8px;
  --radius-step: 8px;

  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.04);

  --font-family: -apple-system, BlinkMacSystemFont, "PingFang SC",
    "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
}
```

### 6.2 布局

- 整页背景 `--color-bg`
- 主体居中，宽度 `min(1200px, 100% - 48px)`
- 顶部"在线录屏"卡片：左侧图标 + 标题（粗体 18px）
- 录制卡片内：上下两块用 1px `--color-border` 分隔
  - 上块：开始按钮居中，下方两组复选框横向排列
  - 下块：操作指引（标题居中，下方左右两栏：左插图 240×240，右步骤列表 480 宽）
- 步骤列表项：12px 内距，圆角 `--radius-step`；选中项蓝底白字，未选项 `--color-step-bg`

### 6.3 状态切换的卡片内容

- `idle`: 大蓝按钮"开始录制" + 音频选项
- `requesting`: 按钮变 loading（保留蓝色，文案"等待授权..."）
- `recording`/`paused`: 红按钮"结束录制" + 旁边次按钮"暂停/继续" + 计时器 `mm:ss`，音频选项禁用
- `stopped`: `<video controls>` 预览（最大宽 720）+ "下载视频"（蓝主按钮）+ "重新录制"（次按钮）

## 七、测试

### 7.1 单元（vitest）

- `useAudioMixer`
  - 0 / 1 / 2 个有音频轨的 stream → 返回 `null` / 单轨 / 单轨
  - `cleanup()` 后 `AudioContext.state === 'closed'`
- `useScreenRecorder`
  - mock `navigator.mediaDevices` 与 `MediaRecorder`
  - 状态转换：idle → recording → paused → recording → stopped
  - 用户取消授权 → 回 idle
  - 视频轨 `ended` 事件 → 转 stopped
  - `reset()` 撤销 ObjectURL

### 7.2 组件（Vue Test Utils）

- `RecorderButton`：state 切换文案/className 正确
- `AudioOptions`：v-model 双向绑定，recording 时禁用
- `OperationGuide`：4 步全部渲染，第 1 步含 active class

### 7.3 手动验证

屏幕录制需要真实浏览器授权，自动化无法完成。手动用例：

1. Chrome 最新版：标签页 + 系统声音 → 录制 10s → 下载，本地播放器能播
2. Chrome：窗口 + 麦克风 → 暂停后继续 → 时长正确累加
3. Chrome：整个屏幕 + 两路音都开 → 视频中能听到两路混音
4. 录制中点浏览器原生"停止共享" → 自动转 stopped
5. 拒绝授权 → UI 不卡死，回 idle
6. Firefox / Edge 烟雾测试

## 八、可扩展性（暂不实现，仅设计预留）

- 视频文件名前缀可配置
- 录制中悬浮迷你控制条
- 摄像头小窗叠加（`getUserMedia({ video: true })` + 画布合成）
- 时长达限自动停止

均不在本次实现范围。
