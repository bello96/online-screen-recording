import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import RecorderPanel from '@/components/RecorderPanel.vue'
import { setLocale } from '@/i18n'

describe('RecorderPanel', () => {
  it('录制超过 30 分钟时在控制条下方显示提醒', async () => {
    vi.useFakeTimers({
      toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'performance'],
    })
    try {
      const w = mount(RecorderPanel)
      await w.find('.recorder-button').trigger('click')
      await flushPromises()
      expect(w.find('.recorder-panel__control-bar').exists()).toBe(true)
      expect(w.find('.recorder-panel__warning').exists()).toBe(false)

      vi.advanceTimersByTime(30 * 60 * 1000 + 500)
      await w.vm.$nextTick()
      expect(w.find('.recorder-panel__warning').text()).toContain('建议尽快结束录制')
      w.unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('录制结束后展示预览，文件名使用当前语言前缀', async () => {
    const w = mount(RecorderPanel)
    await w.find('.recorder-button').trigger('click')
    await flushPromises()
    await w.find('.recorder-panel__stop-btn').trigger('click')
    await flushPromises()
    const download = w.find('a[download]')
    expect(download.attributes('download')).toMatch(/^在线录屏-\d{8}\.webm$/)

    setLocale('en')
    await w.vm.$nextTick()
    expect(w.find('a[download]').attributes('download')).toMatch(/^screen-recording-\d{8}\.webm$/)
    w.unmount()
  })

  it('重新录制后回到初始界面', async () => {
    const w = mount(RecorderPanel)
    await w.find('.recorder-button').trigger('click')
    await flushPromises()
    await w.find('.recorder-panel__stop-btn').trigger('click')
    await flushPromises()
    await w.find('.video-preview__btn.is-secondary').trigger('click')
    expect(w.find('.recorder-button').exists()).toBe(true)
    expect(w.find('.recorder-panel__error').exists()).toBe(false)
    w.unmount()
  })
})
