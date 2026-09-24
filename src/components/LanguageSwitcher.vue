<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { useI18n, type Locale } from '@/i18n'

  const { locale, locales, t, setLocale } = useI18n()

  const open = ref(false)
  const rootRef = ref<HTMLElement | null>(null)
  const triggerRef = ref<HTMLButtonElement | null>(null)

  const currentLabel = computed(
    () => locales.find((l) => l.code === locale.value)?.label ?? locale.value,
  )

  function toggle() {
    open.value = !open.value
  }

  function select(code: Locale) {
    setLocale(code)
    open.value = false
    triggerRef.value?.focus()
  }

  function handleDocumentMouseDown(e: MouseEvent) {
    if (open.value && rootRef.value && !rootRef.value.contains(e.target as Node)) {
      open.value = false
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open.value) {
      open.value = false
      triggerRef.value?.focus()
    }
  }

  onMounted(() => {
    document.addEventListener('mousedown', handleDocumentMouseDown)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleDocumentMouseDown)
  })
</script>

<template>
  <div ref="rootRef" class="lang-switcher" @keydown="handleKeydown">
    <button
      ref="triggerRef"
      type="button"
      class="lang-switcher__trigger"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-label="t('lang.switch')"
      :title="t('lang.switch')"
      @click="toggle"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
        <path
          d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linejoin="round"
        />
      </svg>
      <span class="lang-switcher__current">{{ currentLabel }}</span>
      <svg
        class="lang-switcher__chevron"
        :class="{ 'is-open': open }"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="m6 9 6 6 6-6"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <ul v-if="open" class="lang-switcher__menu" role="listbox" :aria-label="t('lang.switch')">
      <li v-for="item in locales" :key="item.code" role="presentation">
        <button
          type="button"
          role="option"
          class="lang-switcher__option"
          :class="{ 'is-active': item.code === locale }"
          :aria-selected="item.code === locale"
          :lang="item.code"
          @click="select(item.code)"
        >
          <span>{{ item.label }}</span>
          <svg
            v-if="item.code === locale"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m5 12.5 4.5 4.5L19 7.5"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
  .lang-switcher {
    position: relative;
  }
  .lang-switcher__trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 10px;
    font-size: 13px;
    color: var(--color-text-secondary);
    border-radius: var(--radius-button);
    transition:
      background-color var(--duration-fast),
      color var(--duration-fast);
  }
  .lang-switcher__trigger:hover,
  .lang-switcher__trigger[aria-expanded='true'] {
    color: var(--color-primary);
    background-color: var(--color-primary-light);
  }
  .lang-switcher__trigger:focus-visible,
  .lang-switcher__option:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  .lang-switcher__chevron {
    transition: transform var(--duration-fast);
  }
  .lang-switcher__chevron.is-open {
    transform: rotate(180deg);
  }
  .lang-switcher__menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 10;
    min-width: 140px;
    margin: 0;
    padding: 4px;
    list-style: none;
    background-color: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    box-shadow: var(--shadow-popover);
  }
  .lang-switcher__option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
    text-align: left;
    color: var(--color-text);
    border-radius: 6px;
  }
  .lang-switcher__option:hover {
    background-color: var(--color-step-bg);
  }
  .lang-switcher__option.is-active {
    color: var(--color-primary);
    font-weight: 500;
  }
  @media (max-width: 420px) {
    .lang-switcher__current {
      display: none;
    }
  }
</style>
