import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RecordingTimer from '@/components/RecordingTimer.vue'

describe('RecordingTimer', () => {
  it('显示 mm:ss 格式', () => {
    const w = mount(RecordingTimer, { props: { seconds: 65 } })
    expect(w.text()).toContain('01:05')
  })

  it('零秒显示 00:00', () => {
    const w = mount(RecordingTimer, { props: { seconds: 0 } })
    expect(w.text()).toContain('00:00')
  })

  it('小于 60 秒只显示秒部分', () => {
    const w = mount(RecordingTimer, { props: { seconds: 7 } })
    expect(w.text()).toContain('00:07')
  })

  it('超过 1 小时显示 hh:mm:ss', () => {
    const w = mount(RecordingTimer, { props: { seconds: 3661 } })
    expect(w.text()).toContain('01:01:01')
  })

  it('录制超过 30 分钟显示警告', () => {
    const w = mount(RecordingTimer, { props: { seconds: 1801 } })
    expect(w.text()).toContain('建议尽快结束录制')
  })

  it('30 分钟以内不显示警告', () => {
    const w = mount(RecordingTimer, { props: { seconds: 1799 } })
    expect(w.text()).not.toContain('建议尽快结束录制')
  })
})
