import { ref, readonly, type Ref } from 'vue'
import zhCN from './locales/zh-CN'
import en from './locales/en'
import ja from './locales/ja'
import es from './locales/es'
import type { I18nError, Locale, MessageKey, Messages } from './types'

export type { I18nError, Locale, MessageKey, Messages } from './types'

export const DEFAULT_LOCALE: Locale = 'zh-CN'
export const LOCALE_STORAGE_KEY = 'online-screen-recording:locale'

export const LOCALES: ReadonlyArray<{ code: Locale; label: string }> = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'es', label: 'Español' },
]

const MESSAGES: Record<Locale, Messages> = { 'zh-CN': zhCN, en, ja, es }

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && value in MESSAGES
}

function readStoredLocale(): Locale {
  try {
    const stored = globalThis.localStorage?.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(stored)) {
      return stored
    }
  } catch {
    /* 隐私模式等场景下 localStorage 不可用 */
  }
  return DEFAULT_LOCALE
}

const currentLocale = ref<Locale>(readStoredLocale())

export const locale: Readonly<Ref<Locale>> = readonly(currentLocale)

export function setLocale(next: Locale): void {
  if (!isLocale(next)) {
    return
  }
  currentLocale.value = next
  try {
    globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, next)
  } catch {
    /* 忽略持久化失败 */
  }
}

/** 按当前语言翻译；在 computed / 模板中调用时会随语言切换自动更新 */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const template = MESSAGES[currentLocale.value][key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key
  if (!params) {
    return template
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

export function translateError(error: I18nError | null): string | null {
  if (!error) {
    return null
  }
  return t(error.key, { reason: error.reason || t('error.unknown') })
}

export function useI18n() {
  return { locale, locales: LOCALES, t, setLocale }
}
