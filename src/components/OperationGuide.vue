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
            <rect
              x="2"
              y="6"
              width="14"
              height="12"
              rx="2"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M16 10L22 7V17L16 14V10Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
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
        <li v-for="step in steps" :key="step.index" class="op-step">
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
