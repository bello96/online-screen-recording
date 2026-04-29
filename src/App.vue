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
