import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RecorderButton from '@/components/RecorderButton.vue'

describe('RecorderButton', () => {
  it('idle 状态显示"开始录制"', () => {
    const w = mount(RecorderButton, { props: { state: 'idle' } })
    expect(w.text()).toContain('开始录制')
    expect(w.classes()).toContain('is-primary')
  })

  it('recording 状态显示"结束录制"且红色', () => {
    const w = mount(RecorderButton, { props: { state: 'recording' } })
    expect(w.text()).toContain('结束录制')
    expect(w.classes()).toContain('is-danger')
  })

  it('paused 状态显示"结束录制"', () => {
    const w = mount(RecorderButton, { props: { state: 'paused' } })
    expect(w.text()).toContain('结束录制')
  })

  it('requesting 状态显示"等待授权..."并禁用', () => {
    const w = mount(RecorderButton, { props: { state: 'requesting' } })
    expect(w.text()).toContain('等待授权')
    expect(w.attributes('disabled')).toBeDefined()
  })

  it('点击 emit click 事件', async () => {
    const w = mount(RecorderButton, { props: { state: 'idle' } })
    await w.trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
  })

  it('禁用时点击不 emit', async () => {
    const w = mount(RecorderButton, { props: { state: 'requesting' } })
    await w.trigger('click')
    expect(w.emitted('click')).toBeUndefined()
  })
})
