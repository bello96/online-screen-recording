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
- 提交信息中文（前缀 `feat:` / `fix:` / `docs:` 等保留英文），并附 `合作对象：地表最强 Claude Opus` 署名

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 类型检查 + 构建
npm test             # 单元测试
npm run lint         # ESLint
npm run typecheck    # vue-tsc + tsc(node) 类型检查
```

## 测试边界

`getDisplayMedia` / `MediaRecorder` 在 jsdom 中不存在，单元测试通过 `tests/setup.ts` 提供 mock。涉及真实录制的端到端验证只能手动在浏览器进行（已在 spec §7.3 列出用例）。

## 注意事项

- 修改 `useScreenRecorder` 时必须同步检查资源清理逻辑：`stop()` / `reset()` / 组件卸载都要确保 stream 被关闭、AudioContext 被释放、ObjectURL 被撤销
- 修改设计 token 改 `src/styles/variables.css`，不要在组件内硬编码颜色
- 录制时长上限默认软提示（30 分钟），不强制停止；如要改为强制停止，请同步更新 spec
