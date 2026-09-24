<script setup lang="ts">
  import { computed } from 'vue'
  import { t } from '@/i18n'
  import type { OperationStep } from '@/types'

  const STEP_KEYS = [
    { title: 'guide.step1.title', description: 'guide.step1.desc' },
    { title: 'guide.step2.title', description: 'guide.step2.desc' },
    { title: 'guide.step3.title', description: 'guide.step3.desc' },
    { title: 'guide.step4.title', description: 'guide.step4.desc' },
  ] as const

  const steps = computed<OperationStep[]>(() =>
    STEP_KEYS.map((keys, i) => ({
      index: i + 1,
      title: t(keys.title),
      description: t(keys.description),
    })),
  )
</script>

<template>
  <section class="operation-guide">
    <h2 class="operation-guide__title">{{ t('guide.title') }}</h2>
    <ol class="operation-guide__steps">
      <li v-for="step in steps" :key="step.index" class="op-step">
        <div class="op-step__badge">{{ step.index }}</div>
        <div class="op-step__title">{{ step.title }}</div>
        <div class="op-step__desc">{{ step.description }}</div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
  .operation-guide {
    padding: 32px 0 8px;
  }
  .operation-guide__title {
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 28px;
    color: var(--color-text);
  }
  .operation-guide__steps {
    list-style: none;
    padding: 0;
    margin: 0 auto;
    max-width: 960px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  .op-step {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 28px 20px 24px;
    background-color: var(--color-step-bg);
    border: 1px solid transparent;
    border-radius: var(--radius-card);
    transition:
      transform var(--duration-fast),
      box-shadow var(--duration-fast),
      border-color var(--duration-fast);
  }
  .op-step:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(59, 126, 255, 0.08);
    border-color: var(--color-primary-light);
  }
  .op-step__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin-bottom: 14px;
    color: var(--color-primary);
    background-color: var(--color-primary-light);
    border-radius: 50%;
    font-size: 16px;
    font-weight: 600;
  }
  .op-step__title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--color-text);
  }
  .op-step__desc {
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-text-secondary);
    /* 西语等长单词在窄卡片中允许断行，避免溢出 */
    overflow-wrap: anywhere;
  }
  @media (max-width: 720px) {
    .operation-guide__steps {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 420px) {
    .operation-guide__steps {
      grid-template-columns: 1fr;
    }
  }
</style>
