import { describe, it, expect } from 'vitest'
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_STORAGE_KEY,
  locale,
  setLocale,
  t,
  translateError,
} from '@/i18n'
import zhCN from '@/i18n/locales/zh-CN'
import en from '@/i18n/locales/en'
import ja from '@/i18n/locales/ja'
import es from '@/i18n/locales/es'

describe('i18n', () => {
  it('默认语言为简体中文', () => {
    expect(DEFAULT_LOCALE).toBe('zh-CN')
    expect(locale.value).toBe('zh-CN')
    expect(t('app.title')).toBe('在线录屏')
  })

  it('支持中 / 英 / 日 / 西四种语言', () => {
    expect(LOCALES.map((l) => l.code)).toEqual(['zh-CN', 'en', 'ja', 'es'])
  })

  it('各语言文案 key 与中文完全一致且非空', () => {
    const keys = Object.keys(zhCN).sort()
    for (const dict of [en, ja, es]) {
      expect(Object.keys(dict).sort()).toEqual(keys)
      Object.values(dict).forEach((v) => expect(v.trim()).not.toBe(''))
    }
  })

  it('占位符在各语言中保持一致', () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
    for (const dict of [en, ja, es]) {
      for (const key of Object.keys(zhCN) as Array<keyof typeof zhCN>) {
        expect(placeholders(dict[key]), `${key}`).toEqual(placeholders(zhCN[key]))
      }
    }
  })

  it('setLocale 切换语言并持久化到 localStorage', () => {
    setLocale('es')
    expect(locale.value).toBe('es')
    expect(t('recorder.start')).toBe('Iniciar grabación')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('es')
  })

  it('setLocale 忽略不支持的语言', () => {
    setLocale('fr' as never)
    expect(locale.value).toBe('zh-CN')
  })

  it('插值替换参数，未提供的占位符原样保留', () => {
    expect(t('preview.converting', { percent: 42 })).toBe('视频格式转换中... 42%')
    expect(t('preview.converting')).toBe('视频格式转换中... {percent}%')
  })

  it('translateError 缺少原因时使用「未知错误」', () => {
    expect(translateError({ key: 'error.recording' })).toBe('录制出错：未知错误')
    setLocale('en')
    expect(translateError({ key: 'error.recording' })).toBe('Recording error: Unknown error')
    expect(translateError(null)).toBeNull()
  })
})
