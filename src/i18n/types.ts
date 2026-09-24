import type zhCN from './locales/zh-CN'

/** 所有文案 key 以简体中文字典为准，其它语言缺 key 会在类型检查时报错 */
export type MessageKey = keyof typeof zhCN
export type Messages = Record<MessageKey, string>

export type Locale = 'zh-CN' | 'en' | 'ja' | 'es'

/** composable 内部保存的可翻译错误，渲染时再按当前语言翻译 */
export interface I18nError {
  key: MessageKey
  /** 浏览器 / 第三方返回的原始原因，不做翻译 */
  reason?: string
}
