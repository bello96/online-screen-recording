<script setup lang="ts">
  import { watchEffect } from 'vue'
  import RecorderPanel from './components/RecorderPanel.vue'
  import OperationGuide from './components/OperationGuide.vue'
  import LanguageSwitcher from './components/LanguageSwitcher.vue'
  import { useI18n } from './i18n'

  const { t, locale } = useI18n()

  // 同步检测，避免先渲染录制面板再闪成「不支持」
  const supported =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getDisplayMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'

  watchEffect(() => {
    document.documentElement.lang = locale.value
    document.title = t('app.title')
  })
</script>

<template>
  <div class="app">
    <main class="app__main">
      <header class="app__header">
        <span class="app__header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="6" width="14" height="12" rx="2" fill="currentColor" />
            <path d="M16 10L22 7V17L16 14V10Z" fill="currentColor" />
            <circle cx="9" cy="12" r="3" fill="var(--color-on-primary)" />
          </svg>
        </span>
        <h1 class="app__title">{{ t('app.title') }}</h1>
        <LanguageSwitcher class="app__lang" />
      </header>

      <section class="app__card">
        <div v-if="!supported" class="app__unsupported">
          {{ t('app.unsupported') }}
        </div>

        <template v-else>
          <RecorderPanel />
          <hr class="app__divider" />
          <OperationGuide />
        </template>
      </section>

      <section class="app__intro">
        <h3>{{ t('app.introTitle') }}</h3>
        <p>{{ t('app.introBody') }}</p>
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
    /* backdrop-filter 会生成层叠上下文，提升层级以免语言下拉菜单被下方卡片遮住 */
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background-color: var(--color-glass);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-glass);
  }
  .app__header-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    color: var(--color-brand);
    background-color: var(--color-brand-bg);
    border-radius: 8px;
  }
  .app__title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .app__lang {
    margin-left: auto;
    flex-shrink: 0;
  }
  .app__card {
    background-color: var(--color-glass-strong);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-glass-strong);
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
    background-color: var(--color-glass);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-glass);
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
  @media (max-width: 600px) {
    .app__card {
      padding: 16px 16px 32px;
    }
  }
</style>
