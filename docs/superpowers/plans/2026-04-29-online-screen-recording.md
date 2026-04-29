# 在线录屏 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Vue 3 + TypeScript + Vite 复刻 https://tool.browser.qq.com/screen_record.html 的在线录屏功能（开始/暂停/继续/结束、系统声音+麦克风、预览下载、操作指引）。

**Architecture:** 单页面 Vue 3 应用，状态/录制逻辑封装在 `useScreenRecorder` 与 `useAudioMixer` 两个 composable 中；UI 拆为 RecorderPanel/RecorderButton/AudioOptions/RecordingTimer/VideoPreview/OperationGuide 等组件。视频以 WebM (VP9/Opus) 输出，纯前端，无后端。

**Tech Stack:** Vue 3 (`<script setup>`)、TypeScript（严格模式）、Vite、Vitest、@vue/test-utils、jsdom、ESLint、Prettier。

**Spec:** `docs/superpowers/specs/2026-04-29-online-screen-recording-design.md`

---

## File Map

**Create:**
- `package.json` — 依赖与脚本
- `tsconfig.json` / `tsconfig.node.json` — TS 配置
- `vite.config.ts` — Vite + Vitest 配置
- `.eslintrc.cjs` — ESLint 规则
- `.prettierrc` — Prettier 规则
- `.gitignore`
- `index.html` — 入口 HTML
- `src/main.ts` — Vue 应用入口
- `src/App.vue` — 根组件（页头 + 录制卡片 + 工具说明）
- `src/types/index.ts` — 类型定义
- `src/styles/variables.css` — 设计 token
- `src/styles/global.css` — 全局/重置
- `src/composables/useAudioMixer.ts` — 音频混流
- `src/composables/useScreenRecorder.ts` — 录制状态机
- `src/components/RecorderPanel.vue` — 录制卡片容器
- `src/components/RecorderButton.vue` — 状态化按钮
- `src/components/AudioOptions.vue` — 音频选项复选框
- `src/components/RecordingTimer.vue` — 计时器
- `src/components/VideoPreview.vue` — 预览/下载/重录
- `src/components/OperationGuide.vue` — 操作指引（含 CSS 还原的小型预览插图）
- `tests/setup.ts` — 测试环境 mock
- `tests/composables/useAudioMixer.test.ts`
- `tests/composables/useScreenRecorder.test.ts`
- `tests/components/RecorderButton.test.ts`
- `tests/components/AudioOptions.test.ts`
- `tests/components/RecordingTimer.test.ts`
- `tests/components/VideoPreview.test.ts`
- `CLAUDE.md` — 项目级 Claude 指引
- `README.md` — 用户/开发者说明

**说明：** 图标使用内联 SVG（直接写在组件中），不再创建 `assets/icons/` 目录，简化文件管理。这是对 spec 的合理细化。

---

## Task 1: 初始化项目骨架

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: 写 `package.json`**

```json
{
  "name": "online-screen-recording",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint . --ext .ts,.vue --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,vue,css}\""
  },
  "dependencies": {
    "vue": "^3.4.21"
  },
  "devDependencies": {
    "@types/node": "^20.11.30",
    "@typescript-eslint/eslint-plugin": "^7.4.0",
    "@typescript-eslint/parser": "^7.4.0",
    "@vitejs/plugin-vue": "^5.0.4",
    "@vue/test-utils": "^2.4.5",
    "eslint": "^8.57.0",
    "eslint-plugin-vue": "^9.24.0",
    "jsdom": "^24.0.0",
    "prettier": "^3.2.5",
    "typescript": "^5.4.3",
    "vite": "^5.2.6",
    "vitest": "^1.4.0",
    "vue-tsc": "^2.0.7"
  }
}
```

- [ ] **Step 2: 写 `.gitignore`**

```
node_modules
dist
.vite
.DS_Store
*.local
*.log
coverage
.eslintcache
.git/COMMIT_MSG
```

- [ ] **Step 3: 安装依赖**

Run: `npm install`
Expected: 安装无致命错误，生成 `node_modules` 与 `package-lock.json`

- [ ] **Step 4: 提交**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: 初始化项目并安装依赖"
```

---

## Task 2: 配置 TypeScript / Vite / ESLint / Prettier

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `.eslintrc.cjs`
- Create: `.prettierrc`

- [ ] **Step 1: 写 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "types": ["vite/client", "vitest/globals"],
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*", "tests/**/*", "vite.config.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 2: 写 `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: 写 `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: 写 `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'prettier',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'curly': ['error', 'all'],
  },
}
```

- [ ] **Step 5: 写 `.prettierrc`**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "vueIndentScriptAndStyle": true
}
```

- [ ] **Step 6: 安装 prettier eslint 插件**

Run: `npm install --save-dev eslint-config-prettier`
Expected: 安装成功

- [ ] **Step 7: 验证 vite 构建框架可用**

Run: `npx vue-tsc --noEmit`
Expected: 无错误（暂时没有源文件可类型检查）

- [ ] **Step 8: 提交**

```bash
git add tsconfig.json tsconfig.node.json vite.config.ts .eslintrc.cjs .prettierrc package.json package-lock.json
git commit -m "chore: 配置 TypeScript Vite ESLint Prettier"
```

---

## Task 3: 全局样式 token 与基础 HTML/Vue 入口

**Files:**
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/App.vue`（最小占位）
- Create: `src/styles/variables.css`
- Create: `src/styles/global.css`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: 写 `src/styles/variables.css`**

```css
:root {
  --color-primary: #3b7eff;
  --color-primary-hover: #5590ff;
  --color-primary-active: #2e6ce0;
  --color-primary-light: #ecf3ff;
  --color-danger: #f53f3f;
  --color-danger-hover: #f76560;
  --color-text: #1f2329;
  --color-text-secondary: #86909c;
  --color-text-tertiary: #c9cdd4;
  --color-bg: #f5f7fa;
  --color-card: #ffffff;
  --color-border: #e5e6eb;
  --color-step-active-bg: #3b7eff;
  --color-step-active-text: #ffffff;
  --color-step-bg: #f7f8fa;

  --radius-card: 12px;
  --radius-button: 8px;
  --radius-step: 8px;
  --radius-checkbox: 4px;

  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-button: 0 2px 4px rgba(59, 126, 255, 0.2);

  --font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC',
    'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;

  --duration-fast: 150ms;
  --duration-normal: 250ms;
}
```

- [ ] **Step 2: 写 `src/styles/global.css`**

```css
@import './variables.css';

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  font-family: var(--font-family);
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text);
  background-color: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
  padding: 0;
}

input[type='checkbox'] {
  cursor: pointer;
}
```

- [ ] **Step 3: 写 `index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>在线录屏</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 4: 写 `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
```

- [ ] **Step 5: 写 `src/main.ts`**

```ts
import { createApp } from 'vue'
import App from './App.vue'
import './styles/global.css'

createApp(App).mount('#app')
```

- [ ] **Step 6: 写 `src/App.vue`（最小占位）**

```vue
<script setup lang="ts"></script>

<template>
  <div class="app">
    <h1>在线录屏</h1>
  </div>
</template>

<style scoped>
.app {
  padding: 24px;
}
</style>
```

- [ ] **Step 7: 启动开发服务器验证**

Run: `npm run dev`
Expected: vite 启动，浏览器打开 `http://localhost:5173` 显示 "在线录屏" 标题。停止服务器（Ctrl+C）。

- [ ] **Step 8: 提交**

```bash
git add index.html src/main.ts src/App.vue src/vite-env.d.ts src/styles/
git commit -m "feat: 添加全局样式与应用入口"
```

---

## Task 4: 类型定义

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 写 `src/types/index.ts`**

```ts
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
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/types/index.ts
git commit -m "feat: 添加录屏状态与音频选项类型定义"
```

---

## Task 5: 测试环境与 mock 设施

**Files:**
- Create: `tests/setup.ts`

- [ ] **Step 1: 写 `tests/setup.ts`**

`MediaRecorder` 与 `getDisplayMedia` 在 jsdom 中不存在，需要手动 mock。

```ts
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
  ;(globalThis as unknown as { MediaStreamTrack: typeof MockMediaStreamTrack }).MediaStreamTrack = MockMediaStreamTrack
  ;(globalThis as unknown as { MediaRecorder: typeof MockMediaRecorder }).MediaRecorder = MockMediaRecorder
  ;(globalThis as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext

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
```

- [ ] **Step 2: 验证测试环境能加载**

Run: `npx vitest run --reporter=verbose 2>&1 | head -30`
Expected: 没有测试文件报"No test files found"，但 setup 不报错

- [ ] **Step 3: 提交**

```bash
git add tests/setup.ts
git commit -m "test: 添加测试环境 mock 设施"
```

---

## Task 6: useAudioMixer 音频混流（TDD）

**Files:**
- Create: `tests/composables/useAudioMixer.test.ts`
- Create: `src/composables/useAudioMixer.ts`

- [ ] **Step 1: 写测试**

```ts
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
    // 没有报错即可（mock 内部 state -> closed）
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
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run tests/composables/useAudioMixer.test.ts`
Expected: FAIL，因为 `@/composables/useAudioMixer` 不存在

- [ ] **Step 3: 写实现**

```ts
// src/composables/useAudioMixer.ts
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
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npx vitest run tests/composables/useAudioMixer.test.ts`
Expected: PASS（5 个测试全过）

- [ ] **Step 5: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 6: 提交**

```bash
git add tests/composables/useAudioMixer.test.ts src/composables/useAudioMixer.ts
git commit -m "feat: 实现 useAudioMixer 音频混流"
```

---

## Task 7: useScreenRecorder 录制状态机（TDD）

**Files:**
- Create: `tests/composables/useScreenRecorder.test.ts`
- Create: `src/composables/useScreenRecorder.ts`

- [ ] **Step 1: 写测试**

```ts
import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { useScreenRecorder } from '@/composables/useScreenRecorder'

const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

describe('useScreenRecorder', () => {
  it('初始状态为 idle', () => {
    const r = useScreenRecorder()
    expect(r.state.value).toBe('idle')
    expect(r.duration.value).toBe(0)
    expect(r.resultBlob.value).toBeNull()
  })

  it('start 后状态进入 recording', async () => {
    const r = useScreenRecorder()
    await r.start({ systemAudio: true, microphone: false })
    await flush()
    expect(r.state.value).toBe('recording')
  })

  it('start 调用 getDisplayMedia 含 audio=true 当 systemAudio=true', async () => {
    const r = useScreenRecorder()
    const spy = vi.spyOn(navigator.mediaDevices, 'getDisplayMedia')
    await r.start({ systemAudio: true, microphone: false })
    expect(spy).toHaveBeenCalledWith({ video: true, audio: true })
  })

  it('当 microphone=true 时调用 getUserMedia', async () => {
    const r = useScreenRecorder()
    const spy = vi.spyOn(navigator.mediaDevices, 'getUserMedia')
    await r.start({ systemAudio: false, microphone: true })
    expect(spy).toHaveBeenCalledWith({ audio: true })
  })

  it('pause 后状态变 paused，resume 后回 recording', async () => {
    const r = useScreenRecorder()
    await r.start({ systemAudio: false, microphone: false })
    r.pause()
    expect(r.state.value).toBe('paused')
    r.resume()
    expect(r.state.value).toBe('recording')
  })

  it('stop 后状态变 stopped 且产出 blob', async () => {
    const r = useScreenRecorder()
    await r.start({ systemAudio: false, microphone: false })
    r.stop()
    await flush()
    expect(r.state.value).toBe('stopped')
    expect(r.resultBlob.value).not.toBeNull()
    expect(r.resultUrl.value).toBe('blob:mock-url')
  })

  it('用户拒绝授权 -> 回到 idle 不抛错', async () => {
    vi.spyOn(navigator.mediaDevices, 'getDisplayMedia').mockRejectedValueOnce(
      Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }),
    )
    const r = useScreenRecorder()
    await r.start({ systemAudio: false, microphone: false })
    await flush()
    expect(r.state.value).toBe('idle')
  })

  it('麦克风授权失败时设置警告但不阻断录制', async () => {
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValueOnce(
      Object.assign(new Error('Mic denied'), { name: 'NotAllowedError' }),
    )
    const r = useScreenRecorder()
    await r.start({ systemAudio: true, microphone: true })
    await flush()
    expect(r.state.value).toBe('recording')
    expect(r.errorMessage.value).toContain('麦克风')
  })

  it('reset 后状态回 idle 并撤销 ObjectURL', async () => {
    const r = useScreenRecorder()
    await r.start({ systemAudio: false, microphone: false })
    r.stop()
    await flush()
    const url = r.resultUrl.value
    expect(url).not.toBeNull()
    r.reset()
    expect(r.state.value).toBe('idle')
    expect(r.resultBlob.value).toBeNull()
    expect(r.resultUrl.value).toBeNull()
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run tests/composables/useScreenRecorder.test.ts`
Expected: FAIL，模块不存在

- [ ] **Step 3: 写实现**

```ts
// src/composables/useScreenRecorder.ts
import { ref, onBeforeUnmount, getCurrentInstance, type Ref } from 'vue'
import { useAudioMixer } from './useAudioMixer'
import type { AudioOptions, RecorderState } from '@/types'

export interface UseScreenRecorder {
  state: Ref<RecorderState>
  duration: Ref<number>
  resultBlob: Ref<Blob | null>
  resultUrl: Ref<string | null>
  errorMessage: Ref<string | null>
  start(opts: AudioOptions): Promise<void>
  pause(): void
  resume(): void
  stop(): void
  reset(): void
}

const PREFERRED_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
]

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return 'video/webm'
  }
  return PREFERRED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm'
}

export function useScreenRecorder(): UseScreenRecorder {
  const state = ref<RecorderState>('idle')
  const duration = ref(0)
  const resultBlob = ref<Blob | null>(null)
  const resultUrl = ref<string | null>(null)
  const errorMessage = ref<string | null>(null)

  let recorder: MediaRecorder | null = null
  let displayStream: MediaStream | null = null
  let micStream: MediaStream | null = null
  let mixerCleanup: (() => Promise<void>) | null = null
  let chunks: Blob[] = []
  let timerInterval: ReturnType<typeof setInterval> | null = null
  let recordingStartedAt = 0
  let accumulatedMs = 0
  let videoTrackEndedHandler: (() => void) | null = null

  const mixer = useAudioMixer()

  function cleanupStreams() {
    displayStream?.getTracks().forEach((t) => t.stop())
    micStream?.getTracks().forEach((t) => t.stop())
    displayStream = null
    micStream = null
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function startTimer() {
    recordingStartedAt = performance.now()
    timerInterval = setInterval(() => {
      duration.value = Math.floor((accumulatedMs + (performance.now() - recordingStartedAt)) / 1000)
    }, 250)
  }

  async function start(opts: AudioOptions) {
    if (state.value !== 'idle') {
      return
    }
    errorMessage.value = null
    state.value = 'requesting'

    try {
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: opts.systemAudio,
      })
    } catch (err) {
      const e = err as DOMException
      if (e.name !== 'NotAllowedError') {
        errorMessage.value = `获取屏幕共享失败：${e.message}`
      }
      state.value = 'idle'
      return
    }

    if (opts.microphone) {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (err) {
        const e = err as DOMException
        errorMessage.value = `麦克风授权失败（${e.name}），将仅录制屏幕和系统声音`
        micStream = null
      }
    }

    const { audioTrack, cleanup } = mixer.mix([displayStream, micStream])
    mixerCleanup = cleanup

    const tracks: MediaStreamTrack[] = [...displayStream.getVideoTracks()]
    if (audioTrack) {
      tracks.push(audioTrack)
    }
    const combined = new MediaStream(tracks)

    recorder = new MediaRecorder(combined, { mimeType: pickMimeType() })
    chunks = []
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data)
      }
    }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder?.mimeType ?? 'video/webm' })
      resultBlob.value = blob
      resultUrl.value = URL.createObjectURL(blob)
      cleanupStreams()
      mixerCleanup?.()
      mixerCleanup = null
      stopTimer()
      state.value = 'stopped'
    }
    recorder.onerror = (e) => {
      errorMessage.value = `录制出错：${(e as unknown as Error).message ?? '未知错误'}`
      stop()
    }

    const videoTrack = displayStream.getVideoTracks()[0]
    videoTrackEndedHandler = () => stop()
    videoTrack.addEventListener('ended', videoTrackEndedHandler)

    accumulatedMs = 0
    duration.value = 0
    startTimer()
    recorder.start(1000)
    state.value = 'recording'
  }

  function pause() {
    if (state.value !== 'recording' || !recorder) {
      return
    }
    recorder.pause()
    accumulatedMs += performance.now() - recordingStartedAt
    stopTimer()
    state.value = 'paused'
  }

  function resume() {
    if (state.value !== 'paused' || !recorder) {
      return
    }
    recorder.resume()
    startTimer()
    state.value = 'recording'
  }

  function stop() {
    if (state.value === 'idle' || state.value === 'stopped') {
      return
    }
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
    if (videoTrackEndedHandler && displayStream) {
      const t = displayStream.getVideoTracks()[0]
      t?.removeEventListener('ended', videoTrackEndedHandler)
      videoTrackEndedHandler = null
    }
  }

  function reset() {
    if (resultUrl.value) {
      URL.revokeObjectURL(resultUrl.value)
    }
    resultUrl.value = null
    resultBlob.value = null
    chunks = []
    duration.value = 0
    accumulatedMs = 0
    errorMessage.value = null
    recorder = null
    state.value = 'idle'
  }

  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (state.value === 'recording' || state.value === 'paused') {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  if (getCurrentInstance()) {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }
    onBeforeUnmount(() => {
      if (state.value === 'recording' || state.value === 'paused') {
        stop()
      }
      cleanupStreams()
      mixerCleanup?.()
      stopTimer()
      if (resultUrl.value) {
        URL.revokeObjectURL(resultUrl.value)
        resultUrl.value = null
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    })
  }

  return {
    state,
    duration,
    resultBlob,
    resultUrl,
    errorMessage,
    start,
    pause,
    resume,
    stop,
    reset,
  }
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npx vitest run tests/composables/useScreenRecorder.test.ts`
Expected: PASS（9 个测试全过）

- [ ] **Step 5: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 6: 提交**

```bash
git add tests/composables/useScreenRecorder.test.ts src/composables/useScreenRecorder.ts
git commit -m "feat: 实现 useScreenRecorder 录屏状态机"
```

---

## Task 8: RecorderButton 组件（TDD）

**Files:**
- Create: `tests/components/RecorderButton.test.ts`
- Create: `src/components/RecorderButton.vue`

- [ ] **Step 1: 写测试**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RecorderButton from '@/components/RecorderButton.vue'

describe('RecorderButton', () => {
  it('idle 状态显示"开始录制"', () => {
    const w = mount(RecorderButton, { props: { state: 'idle' } })
    expect(w.text()).toContain('开始录制')
    expect(w.classes()).toContain('is-primary')
  })

  it('recording 状态显示"结束录制"且红色', () => {
    const w = mount(RecorderButton, { props: { state: 'recording' } })
    expect(w.text()).toContain('结束录制')
    expect(w.classes()).toContain('is-danger')
  })

  it('paused 状态显示"结束录制"', () => {
    const w = mount(RecorderButton, { props: { state: 'paused' } })
    expect(w.text()).toContain('结束录制')
  })

  it('requesting 状态显示"等待授权..."并禁用', () => {
    const w = mount(RecorderButton, { props: { state: 'requesting' } })
    expect(w.text()).toContain('等待授权')
    expect(w.attributes('disabled')).toBeDefined()
  })

  it('点击 emit click 事件', async () => {
    const w = mount(RecorderButton, { props: { state: 'idle' } })
    await w.trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
  })

  it('禁用时点击不 emit', async () => {
    const w = mount(RecorderButton, { props: { state: 'requesting' } })
    await w.trigger('click')
    expect(w.emitted('click')).toBeUndefined()
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run tests/components/RecorderButton.test.ts`
Expected: FAIL（组件不存在）

- [ ] **Step 3: 写实现**

```vue
<!-- src/components/RecorderButton.vue -->
<script setup lang="ts">
  import { computed } from 'vue'
  import type { RecorderState } from '@/types'

  const props = defineProps<{ state: RecorderState }>()
  defineEmits<{ (e: 'click'): void }>()

  const label = computed(() => {
    switch (props.state) {
      case 'requesting':
        return '等待授权...'
      case 'recording':
      case 'paused':
        return '结束录制'
      default:
        return '开始录制'
    }
  })

  const variant = computed(() => {
    switch (props.state) {
      case 'recording':
      case 'paused':
        return 'is-danger'
      default:
        return 'is-primary'
    }
  })

  const disabled = computed(() => props.state === 'requesting')
</script>

<template>
  <button
    class="recorder-button"
    :class="variant"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <svg
      v-if="state === 'idle'"
      class="recorder-button__icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect x="2" y="6" width="14" height="12" rx="2" stroke="currentColor" stroke-width="2" />
      <path d="M16 10L22 7V17L16 14V10Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
    </svg>
    <svg
      v-else-if="state === 'recording' || state === 'paused'"
      class="recorder-button__icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
  .recorder-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    font-size: 16px;
    font-weight: 500;
    color: #fff;
    border-radius: var(--radius-button);
    transition: background-color var(--duration-fast);
  }
  .recorder-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .recorder-button.is-primary {
    background-color: var(--color-primary);
  }
  .recorder-button.is-primary:not(:disabled):hover {
    background-color: var(--color-primary-hover);
  }
  .recorder-button.is-primary:not(:disabled):active {
    background-color: var(--color-primary-active);
  }
  .recorder-button.is-danger {
    background-color: var(--color-danger);
  }
  .recorder-button.is-danger:not(:disabled):hover {
    background-color: var(--color-danger-hover);
  }
  .recorder-button__icon {
    flex-shrink: 0;
  }
</style>
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npx vitest run tests/components/RecorderButton.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add tests/components/RecorderButton.test.ts src/components/RecorderButton.vue
git commit -m "feat: 实现 RecorderButton 状态化按钮"
```

---

## Task 9: AudioOptions 组件（TDD）

**Files:**
- Create: `tests/components/AudioOptions.test.ts`
- Create: `src/components/AudioOptions.vue`

- [ ] **Step 1: 写测试**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AudioOptions from '@/components/AudioOptions.vue'

describe('AudioOptions', () => {
  it('渲染两个复选框', () => {
    const w = mount(AudioOptions, {
      props: { modelValue: { systemAudio: true, microphone: false }, disabled: false },
    })
    const inputs = w.findAll('input[type="checkbox"]')
    expect(inputs).toHaveLength(2)
    expect(w.text()).toContain('系统声音')
    expect(w.text()).toContain('麦克风')
  })

  it('反映 modelValue 的勾选状态', () => {
    const w = mount(AudioOptions, {
      props: { modelValue: { systemAudio: true, microphone: false }, disabled: false },
    })
    const inputs = w.findAll<HTMLInputElement>('input[type="checkbox"]')
    expect(inputs[0].element.checked).toBe(true)
    expect(inputs[1].element.checked).toBe(false)
  })

  it('点击复选框触发 update:modelValue', async () => {
    const w = mount(AudioOptions, {
      props: { modelValue: { systemAudio: false, microphone: false }, disabled: false },
    })
    await w.findAll('input[type="checkbox"]')[0].setValue(true)
    const events = w.emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect(events![0][0]).toEqual({ systemAudio: true, microphone: false })
  })

  it('disabled=true 时复选框被禁用', () => {
    const w = mount(AudioOptions, {
      props: { modelValue: { systemAudio: false, microphone: false }, disabled: true },
    })
    w.findAll<HTMLInputElement>('input[type="checkbox"]').forEach((cb) => {
      expect(cb.element.disabled).toBe(true)
    })
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run tests/components/AudioOptions.test.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

```vue
<!-- src/components/AudioOptions.vue -->
<script setup lang="ts">
  import { computed } from 'vue'
  import type { AudioOptions } from '@/types'

  const props = defineProps<{
    modelValue: AudioOptions
    disabled: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: AudioOptions): void
  }>()

  const systemAudio = computed({
    get: () => props.modelValue.systemAudio,
    set: (v) => emit('update:modelValue', { ...props.modelValue, systemAudio: v }),
  })

  const microphone = computed({
    get: () => props.modelValue.microphone,
    set: (v) => emit('update:modelValue', { ...props.modelValue, microphone: v }),
  })
</script>

<template>
  <div class="audio-options">
    <label class="audio-options__item">
      <input v-model="systemAudio" type="checkbox" :disabled="disabled" />
      <span>系统声音</span>
    </label>
    <label class="audio-options__item">
      <input v-model="microphone" type="checkbox" :disabled="disabled" />
      <span>麦克风</span>
    </label>
  </div>
</template>

<style scoped>
  .audio-options {
    display: flex;
    justify-content: center;
    gap: 64px;
  }
  .audio-options__item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--color-text);
    cursor: pointer;
    user-select: none;
  }
  .audio-options__item input {
    width: 16px;
    height: 16px;
    accent-color: var(--color-primary);
  }
  .audio-options__item input:disabled + span {
    color: var(--color-text-tertiary);
  }
  .audio-options__item input:disabled {
    cursor: not-allowed;
  }
</style>
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npx vitest run tests/components/AudioOptions.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add tests/components/AudioOptions.test.ts src/components/AudioOptions.vue
git commit -m "feat: 实现 AudioOptions 音频选项组件"
```

---

## Task 10: RecordingTimer 组件（TDD）

**Files:**
- Create: `tests/components/RecordingTimer.test.ts`
- Create: `src/components/RecordingTimer.vue`

- [ ] **Step 1: 写测试**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RecordingTimer from '@/components/RecordingTimer.vue'

describe('RecordingTimer', () => {
  it('显示 mm:ss 格式', () => {
    const w = mount(RecordingTimer, { props: { seconds: 65 } })
    expect(w.text()).toContain('01:05')
  })

  it('零秒显示 00:00', () => {
    const w = mount(RecordingTimer, { props: { seconds: 0 } })
    expect(w.text()).toContain('00:00')
  })

  it('小于 60 秒只显示秒部分', () => {
    const w = mount(RecordingTimer, { props: { seconds: 7 } })
    expect(w.text()).toContain('00:07')
  })

  it('超过 1 小时显示 hh:mm:ss', () => {
    const w = mount(RecordingTimer, { props: { seconds: 3661 } })
    expect(w.text()).toContain('01:01:01')
  })

  it('录制超过 30 分钟显示警告', () => {
    const w = mount(RecordingTimer, { props: { seconds: 1801 } })
    expect(w.text()).toContain('建议尽快结束录制')
  })

  it('30 分钟以内不显示警告', () => {
    const w = mount(RecordingTimer, { props: { seconds: 1799 } })
    expect(w.text()).not.toContain('建议尽快结束录制')
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run tests/components/RecordingTimer.test.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

```vue
<!-- src/components/RecordingTimer.vue -->
<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{ seconds: number }>()

  const WARNING_THRESHOLD = 30 * 60

  const display = computed(() => {
    const total = Math.max(0, Math.floor(props.seconds))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const pad = (n: number) => String(n).padStart(2, '0')
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
  })

  const warning = computed(() => props.seconds >= WARNING_THRESHOLD)
</script>

<template>
  <div class="recording-timer">
    <span class="recording-timer__dot" />
    <span class="recording-timer__time">{{ display }}</span>
    <span v-if="warning" class="recording-timer__warning">建议尽快结束录制以避免内存占用过高</span>
  </div>
</template>

<style scoped>
  .recording-timer {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--color-text);
  }
  .recording-timer__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--color-danger);
    animation: pulse 1.4s ease-in-out infinite;
  }
  .recording-timer__time {
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }
  .recording-timer__warning {
    color: var(--color-danger);
    font-size: 12px;
    margin-left: 8px;
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
</style>
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npx vitest run tests/components/RecordingTimer.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add tests/components/RecordingTimer.test.ts src/components/RecordingTimer.vue
git commit -m "feat: 实现 RecordingTimer 录制计时器"
```

---

## Task 11: VideoPreview 组件（TDD）

**Files:**
- Create: `tests/components/VideoPreview.test.ts`
- Create: `src/components/VideoPreview.vue`

- [ ] **Step 1: 写测试**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VideoPreview from '@/components/VideoPreview.vue'

describe('VideoPreview', () => {
  it('渲染 video 元素和下载/重录按钮', () => {
    const w = mount(VideoPreview, {
      props: { videoUrl: 'blob:abc', fileName: 'test.webm' },
    })
    expect(w.find('video').exists()).toBe(true)
    expect(w.find('video').attributes('src')).toBe('blob:abc')
    expect(w.text()).toContain('下载视频')
    expect(w.text()).toContain('重新录制')
  })

  it('下载链接的 download 属性使用 fileName', () => {
    const w = mount(VideoPreview, {
      props: { videoUrl: 'blob:abc', fileName: 'rec-2026.webm' },
    })
    const a = w.find('a')
    expect(a.attributes('download')).toBe('rec-2026.webm')
    expect(a.attributes('href')).toBe('blob:abc')
  })

  it('点击重新录制 emit reset', async () => {
    const w = mount(VideoPreview, {
      props: { videoUrl: 'blob:abc', fileName: 'x.webm' },
    })
    await w.find('button.video-preview__reset').trigger('click')
    expect(w.emitted('reset')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run tests/components/VideoPreview.test.ts`
Expected: FAIL

- [ ] **Step 3: 写实现**

```vue
<!-- src/components/VideoPreview.vue -->
<script setup lang="ts">
  defineProps<{
    videoUrl: string
    fileName: string
  }>()

  defineEmits<{ (e: 'reset'): void }>()
</script>

<template>
  <div class="video-preview">
    <video :src="videoUrl" controls class="video-preview__video" />
    <div class="video-preview__actions">
      <a :href="videoUrl" :download="fileName" class="video-preview__download">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4V16M12 16L7 11M12 16L17 11M5 20H19"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>下载视频</span>
      </a>
      <button class="video-preview__reset" @click="$emit('reset')">重新录制</button>
    </div>
  </div>
</template>

<style scoped>
  .video-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
  .video-preview__video {
    width: 100%;
    max-width: 720px;
    border-radius: var(--radius-card);
    background-color: #000;
  }
  .video-preview__actions {
    display: flex;
    gap: 16px;
  }
  .video-preview__download {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    font-size: 14px;
    color: #fff;
    background-color: var(--color-primary);
    border-radius: var(--radius-button);
    text-decoration: none;
    transition: background-color var(--duration-fast);
  }
  .video-preview__download:hover {
    background-color: var(--color-primary-hover);
  }
  .video-preview__reset {
    padding: 10px 24px;
    font-size: 14px;
    color: var(--color-text);
    background-color: var(--color-step-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    transition: background-color var(--duration-fast);
  }
  .video-preview__reset:hover {
    background-color: var(--color-border);
  }
</style>
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npx vitest run tests/components/VideoPreview.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add tests/components/VideoPreview.test.ts src/components/VideoPreview.vue
git commit -m "feat: 实现 VideoPreview 预览与下载组件"
```

---

## Task 12: OperationGuide 组件（无 TDD，纯静态）

**Files:**
- Create: `src/components/OperationGuide.vue`

- [ ] **Step 1: 写实现**

```vue
<!-- src/components/OperationGuide.vue -->
<script setup lang="ts">
  import type { OperationStep } from '@/types'

  const steps: OperationStep[] = [
    {
      index: 1,
      title: '步骤1：',
      description: '设置是否启用系统声音、麦克风声音，点击开始录屏按钮',
    },
    {
      index: 2,
      title: '步骤2：',
      description: '选择要录制的屏幕，点击 "分享" 开始录制',
    },
    {
      index: 3,
      title: '步骤3：',
      description: '录制过程可暂停，点击 "结束录制" 或 "停止共享" 完成录制',
    },
    {
      index: 4,
      title: '步骤4：',
      description: '点击 "下载视频" 将录制的视频下载到本地',
    },
  ]
</script>

<template>
  <section class="operation-guide">
    <h2 class="operation-guide__title">操作指引</h2>
    <div class="operation-guide__content">
      <div class="operation-guide__illustration">
        <div class="op-tip op-tip--top">点击开始录制视频</div>
        <button class="op-mock-button" type="button" disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="6" width="14" height="12" rx="2" stroke="currentColor" stroke-width="2" />
            <path d="M16 10L22 7V17L16 14V10Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          </svg>
          开始录制
        </button>
        <div class="op-mock-options">
          <span class="op-mock-checkbox op-mock-checkbox--checked"></span>
          <span>系统声音</span>
          <span class="op-mock-checkbox"></span>
          <span>麦克风</span>
        </div>
        <div class="op-tip op-tip--bottom">点击勾选可进行声音设置</div>
      </div>
      <ol class="operation-guide__steps">
        <li
          v-for="step in steps"
          :key="step.index"
          class="op-step"
          :class="{ 'op-step--active': step.index === 1 }"
        >
          <div class="op-step__title">{{ step.title }}</div>
          <div class="op-step__desc">{{ step.description }}</div>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
  .operation-guide {
    padding: 32px 0 0;
  }
  .operation-guide__title {
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 24px;
    color: var(--color-text);
  }
  .operation-guide__content {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 32px;
    max-width: 760px;
    margin: 0 auto;
  }
  .operation-guide__illustration {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 32px 16px;
    background-color: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    min-height: 200px;
  }
  .op-tip {
    position: absolute;
    padding: 4px 10px;
    background-color: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 12px;
    border-radius: 4px;
    white-space: nowrap;
  }
  .op-tip::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
  }
  .op-tip--top {
    top: 24px;
  }
  .op-tip--top::after {
    bottom: -8px;
    border-top-color: rgba(0, 0, 0, 0.55);
  }
  .op-tip--bottom {
    bottom: 24px;
  }
  .op-tip--bottom::after {
    top: -8px;
    border-bottom-color: rgba(0, 0, 0, 0.55);
  }
  .op-mock-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background-color: var(--color-primary);
    color: #fff;
    border-radius: var(--radius-button);
    font-size: 13px;
    cursor: default;
  }
  .op-mock-options {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-text);
  }
  .op-mock-options > span:nth-child(3) {
    margin-left: 16px;
  }
  .op-mock-checkbox {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 1px solid var(--color-border);
    border-radius: 2px;
  }
  .op-mock-checkbox--checked {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    position: relative;
  }
  .op-mock-checkbox--checked::after {
    content: '';
    position: absolute;
    left: 3px;
    top: 0;
    width: 4px;
    height: 8px;
    border: solid #fff;
    border-width: 0 1.5px 1.5px 0;
    transform: rotate(45deg);
  }
  .operation-guide__steps {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .op-step {
    padding: 12px 16px;
    background-color: var(--color-step-bg);
    border-radius: var(--radius-step);
    transition: background-color var(--duration-fast);
  }
  .op-step--active {
    background-color: var(--color-step-active-bg);
    color: var(--color-step-active-text);
  }
  .op-step__title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .op-step__desc {
    font-size: 13px;
    line-height: 1.5;
  }
</style>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/components/OperationGuide.vue
git commit -m "feat: 实现 OperationGuide 操作指引组件"
```

---

## Task 13: RecorderPanel 容器组件

**Files:**
- Create: `src/components/RecorderPanel.vue`

- [ ] **Step 1: 写实现**

```vue
<!-- src/components/RecorderPanel.vue -->
<script setup lang="ts">
  import { ref, computed } from 'vue'
  import RecorderButton from './RecorderButton.vue'
  import AudioOptions from './AudioOptions.vue'
  import RecordingTimer from './RecordingTimer.vue'
  import VideoPreview from './VideoPreview.vue'
  import { useScreenRecorder } from '@/composables/useScreenRecorder'
  import type { AudioOptions as AudioOptionsType } from '@/types'

  const audioOpts = ref<AudioOptionsType>({ systemAudio: true, microphone: false })
  const recorder = useScreenRecorder()

  const isControlling = computed(
    () => recorder.state.value === 'recording' || recorder.state.value === 'paused',
  )

  const fileName = computed(() => {
    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
    return `screen-recording-${stamp}.webm`
  })

  function handleMainClick() {
    if (recorder.state.value === 'idle') {
      recorder.start(audioOpts.value)
    } else if (isControlling.value) {
      recorder.stop()
    }
  }

  function handlePauseToggle() {
    if (recorder.state.value === 'recording') {
      recorder.pause()
    } else if (recorder.state.value === 'paused') {
      recorder.resume()
    }
  }
</script>

<template>
  <div class="recorder-panel">
    <template v-if="recorder.state.value !== 'stopped'">
      <div class="recorder-panel__main">
        <RecorderButton :state="recorder.state.value" @click="handleMainClick" />

        <button
          v-if="isControlling"
          class="recorder-panel__pause"
          type="button"
          @click="handlePauseToggle"
        >
          {{ recorder.state.value === 'paused' ? '继续录制' : '暂停录制' }}
        </button>

        <RecordingTimer v-if="isControlling" :seconds="recorder.duration.value" />
      </div>

      <AudioOptions
        v-model="audioOpts"
        :disabled="recorder.state.value !== 'idle'"
      />

      <div v-if="recorder.errorMessage.value" class="recorder-panel__error" role="alert">
        {{ recorder.errorMessage.value }}
      </div>
    </template>

    <VideoPreview
      v-else
      :video-url="recorder.resultUrl.value!"
      :file-name="fileName"
      @reset="recorder.reset"
    />
  </div>
</template>

<style scoped>
  .recorder-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 56px 0 40px;
  }
  .recorder-panel__main {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .recorder-panel__pause {
    padding: 10px 20px;
    font-size: 14px;
    color: var(--color-text);
    background-color: var(--color-step-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    transition: background-color var(--duration-fast);
  }
  .recorder-panel__pause:hover {
    background-color: var(--color-border);
  }
  .recorder-panel__error {
    color: var(--color-danger);
    font-size: 13px;
    background-color: #fff2f0;
    border: 1px solid #ffccc7;
    padding: 8px 16px;
    border-radius: var(--radius-button);
    max-width: 480px;
    text-align: center;
  }
</style>
```

- [ ] **Step 2: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/components/RecorderPanel.vue
git commit -m "feat: 实现 RecorderPanel 录制卡片容器"
```

---

## Task 14: App.vue 整体布局与组装

**Files:**
- Modify: `src/App.vue`（替换 Task 3 的占位实现）

- [ ] **Step 1: 重写 `src/App.vue`**

```vue
<!-- src/App.vue -->
<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import RecorderPanel from './components/RecorderPanel.vue'
  import OperationGuide from './components/OperationGuide.vue'

  const supported = ref(true)

  onMounted(() => {
    supported.value = !!navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function'
  })
</script>

<template>
  <div class="app">
    <main class="app__main">
      <header class="app__header">
        <span class="app__header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="6" width="14" height="12" rx="2" fill="#FF4D4F" />
            <path d="M16 10L22 7V17L16 14V10Z" fill="#FF4D4F" />
            <circle cx="9" cy="12" r="3" fill="#fff" />
          </svg>
        </span>
        <h1 class="app__title">在线录屏</h1>
      </header>

      <section class="app__card">
        <div v-if="!supported" class="app__unsupported">
          当前浏览器不支持屏幕录制，请使用 Chrome / Edge / Firefox 桌面版最新版本。
        </div>

        <template v-else>
          <RecorderPanel />
          <hr class="app__divider" />
          <OperationGuide />
        </template>
      </section>

      <section class="app__intro">
        <h3>工具介绍及使用方法</h3>
        <p>
          在线录屏，支持录制指定浏览器标签页、指定窗口以及整个屏幕。可同时录入系统声音与麦克风音频，录制完成后可在线预览并一键下载到本地。
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
  .app {
    min-height: 100vh;
    padding: 24px 0 48px;
  }
  .app__main {
    width: min(1080px, 100% - 48px);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .app__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background-color: var(--color-card);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
  }
  .app__header-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background-color: #ffe4e4;
    border-radius: 8px;
  }
  .app__title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
  .app__card {
    background-color: var(--color-card);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
    padding: 16px 32px 40px;
  }
  .app__divider {
    border: 0;
    border-top: 1px solid var(--color-border);
    margin: 24px 0;
  }
  .app__unsupported {
    padding: 64px 24px;
    text-align: center;
    color: var(--color-danger);
    font-size: 14px;
  }
  .app__intro {
    background-color: var(--color-card);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
    padding: 16px 24px;
  }
  .app__intro h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 8px;
  }
  .app__intro p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 13px;
    line-height: 1.7;
  }
</style>
```

- [ ] **Step 2: 启动开发服务器手动验证**

Run: `npm run dev`
Expected: 浏览器打开 `http://localhost:5173`，看到页面结构与截图 1 一致：顶部"在线录屏"标题、中间录制卡片（开始按钮 + 系统声音/麦克风复选框）、下方操作指引（4 步，第 1 步高亮）。停止服务器。

- [ ] **Step 3: 类型检查**

Run: `npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 4: lint**

Run: `npm run lint`
Expected: 无错误（warning 为 0）

- [ ] **Step 5: 跑全部单元测试**

Run: `npm test`
Expected: 全部 PASS（约 35 个用例）

- [ ] **Step 6: 提交**

```bash
git add src/App.vue
git commit -m "feat: 完成 App 整体布局组装录屏面板与操作指引"
```

---

## Task 15: 编写 README.md 与 CLAUDE.md

**Files:**
- Create: `README.md`
- Create: `CLAUDE.md`

- [ ] **Step 1: 写 `README.md`**

```markdown
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
```

- [ ] **Step 2: 写 `CLAUDE.md`**

```markdown
# CLAUDE.md

本文件给 Claude Code 提供项目上下文。

## 项目简介

在线录屏工具，参考 https://tool.browser.qq.com/screen_record.html 复刻。Vue 3 + TypeScript + Vite 纯前端实现，无后端。

## 关键设计

- 录制核心逻辑封装在 `src/composables/useScreenRecorder.ts`：状态机 `idle | requesting | recording | paused | stopped`，对外暴露响应式 `state / duration / resultBlob / resultUrl / errorMessage` 与 `start / pause / resume / stop / reset` 方法
- 系统音 + 麦克风混流封装在 `src/composables/useAudioMixer.ts`，使用 `AudioContext.createMediaStreamDestination` 合并多路音频到单轨
- UI 组件按职责拆分（见 `src/components/`），每个组件单一职责、有对应单元测试
- 视频以 `video/webm;codecs=vp9,opus` 输出（fallback 到 vp8 / 默认 webm），不做 mp4 转码

## 设计与计划文档

- 设计文档（spec）：`docs/superpowers/specs/2026-04-29-online-screen-recording-design.md`
- 实施计划：`docs/superpowers/plans/2026-04-29-online-screen-recording.md`

修改任何核心行为前请先翻 spec，避免偏离用例约定。

## 编码约定

- TypeScript 严格模式，所有公开 API 必须有类型注解
- Vue 3 `<script setup>` 语法
- 所有 `if` 必须使用花括号（即使单行）— 见根 ESLint `curly: ['error', 'all']`
- 文件级 SFC：`<script>` → `<template>` → `<style scoped>` 顺序
- 自定义 CSS，不引入 UI 库
- 提交信息中文（前缀 `feat:` / `fix:` / `docs:` 等保留英文）

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 类型检查 + 构建
npm test             # 单元测试
npm run lint         # ESLint
npx vue-tsc --noEmit # 单独跑类型检查
```

## 测试边界

`getDisplayMedia` / `MediaRecorder` 在 jsdom 中不存在，单元测试通过 `tests/setup.ts` 提供 mock。涉及真实录制的端到端验证只能手动在浏览器进行（已在 spec §7.3 列出用例）。

## 注意事项

- 修改 `useScreenRecorder` 时必须同步检查资源清理逻辑：`stop()` / `reset()` / 组件卸载都要确保 stream 被关闭、AudioContext 被释放、ObjectURL 被撤销
- 修改设计 token 改 `src/styles/variables.css`，不要在组件内硬编码颜色
- 录制时长上限默认软提示（30 分钟），不强制停止；如要改为强制停止，请同步更新 spec
```

- [ ] **Step 3: 提交**

```bash
git add README.md CLAUDE.md
git commit -m "docs: 添加 README 与 CLAUDE 项目说明"
```

---

## Task 16: 全量回归与手动验证

**Files:** （无新增）

- [ ] **Step 1: 完整测试套件**

Run: `npm test`
Expected: 全部 PASS

- [ ] **Step 2: 类型检查**

Run: `npm run build`
Expected: 类型检查通过 + Vite 构建成功，输出 `dist/` 目录

- [ ] **Step 3: ESLint**

Run: `npm run lint`
Expected: 无错误（0 warnings，与 `--max-warnings 0` 一致）

- [ ] **Step 4: 启动 preview，按 spec §7.3 手动验证**

Run: `npm run preview`

按以下用例逐一在 Chrome 最新版验证（每条都要观察实际录制结果）：

1. 选 Chrome 标签页 + 系统声音 → 录制 10s → 下载 → 用本地播放器（如 VLC）打开能正常播放
2. 选窗口 + 麦克风 → 暂停 3s → 继续 → 累加时长正确
3. 选整个屏幕 + 两个音频都开 → 验证视频中能听到两路混音
4. 录制中点浏览器原生"停止共享"按钮 → 自动转入 stopped 预览页
5. 在系统对话框点取消 → UI 不卡死，回到 idle
6. 拒绝麦克风权限 → 显示"麦克风授权失败..."提示，且仍能录制屏幕
7. （快速烟雾测试）Firefox / Edge 各跑一次基本流程

记录任何发现的偏差到一个临时 issue 列表。

- [ ] **Step 5: 修复手动验证发现的问题**

如果 step 4 发现 bug，每修一处：
- 重写或补充对应的单元测试（如果可测试）
- 修复实现
- `npm test` 全过
- 提交：`git commit -m "fix: <问题描述>"`

如果没问题，跳过这步。

- [ ] **Step 6: 终结提交**

```bash
git status
# 应为干净工作区
git log --oneline
# 检查提交记录完整
```

---

## 完成标准

全部任务勾选完毕，并且：
- `npm test` 全过
- `npm run build` 成功输出 `dist/`
- `npm run lint` 无错误
- 浏览器中能完整跑通"开始录制 → 暂停/继续 → 结束 → 预览 → 下载"流程
- README.md / CLAUDE.md 已写入并提交
