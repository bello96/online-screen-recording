import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AudioOptions from '@/components/AudioOptions.vue'

describe('AudioOptions', () => {
  it('渲染两个复选框', () => {
    const w = mount(AudioOptions, {
      props: { modelValue: { systemAudio: true, microphone: false }, disabled: false },
    })
    const inputs = w.findAll('input[type="checkbox"]')
    expect(inputs).toHaveLength(2)
    expect(w.text()).toContain('系统声音')
    expect(w.text()).toContain('麦克风')
  })

  it('反映 modelValue 的勾选状态', () => {
    const w = mount(AudioOptions, {
      props: { modelValue: { systemAudio: true, microphone: false }, disabled: false },
    })
    const inputs = w.findAll<HTMLInputElement>('input[type="checkbox"]')
    expect(inputs[0].element.checked).toBe(true)
    expect(inputs[1].element.checked).toBe(false)
  })

  it('点击复选框触发 update:modelValue', async () => {
    const w = mount(AudioOptions, {
      props: { modelValue: { systemAudio: false, microphone: false }, disabled: false },
    })
    await w.findAll('input[type="checkbox"]')[0].setValue(true)
    const events = w.emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect(events![0][0]).toEqual({ systemAudio: true, microphone: false })
  })

  it('disabled=true 时复选框被禁用', () => {
    const w = mount(AudioOptions, {
      props: { modelValue: { systemAudio: false, microphone: false }, disabled: true },
    })
    w.findAll<HTMLInputElement>('input[type="checkbox"]').forEach((cb) => {
      expect(cb.element.disabled).toBe(true)
    })
  })
})
