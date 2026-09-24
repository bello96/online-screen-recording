import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import { locale } from '@/i18n'

describe('LanguageSwitcher', () => {
  it('默认显示简体中文，菜单收起', () => {
    const w = mount(LanguageSwitcher)
    expect(w.find('.lang-switcher__trigger').text()).toContain('简体中文')
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    expect(w.find('.lang-switcher__trigger').attributes('aria-expanded')).toBe('false')
  })

  it('点击展开四个语言选项，当前语言标记为选中', async () => {
    const w = mount(LanguageSwitcher)
    await w.find('.lang-switcher__trigger').trigger('click')
    const options = w.findAll('[role="option"]')
    expect(options.map((o) => o.text())).toEqual(['简体中文', 'English', '日本語', 'Español'])
    expect(options[0].attributes('aria-selected')).toBe('true')
  })

  it('选择语言后切换并收起菜单', async () => {
    const w = mount(LanguageSwitcher)
    await w.find('.lang-switcher__trigger').trigger('click')
    await w.findAll('[role="option"]')[2].trigger('click')
    expect(locale.value).toBe('ja')
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    expect(w.find('.lang-switcher__trigger').text()).toContain('日本語')
    expect(w.find('.lang-switcher__trigger').attributes('aria-label')).toBe('言語を切り替える')
  })

  it('按 Escape 收起菜单', async () => {
    const w = mount(LanguageSwitcher)
    await w.find('.lang-switcher__trigger').trigger('click')
    await w.trigger('keydown', { key: 'Escape' })
    expect(w.find('[role="listbox"]').exists()).toBe(false)
  })

  it('点击组件外部收起菜单', async () => {
    const w = mount(LanguageSwitcher, { attachTo: document.body })
    await w.find('.lang-switcher__trigger').trigger('click')
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await w.vm.$nextTick()
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    w.unmount()
  })
})
