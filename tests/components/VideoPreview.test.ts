import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VideoPreview from '@/components/VideoPreview.vue'

describe('VideoPreview', () => {
  it('渲染 video 和三个按钮', () => {
    const w = mount(VideoPreview, {
      props: { videoUrl: 'blob:abc', fileNameBase: '在线录屏-20260430' },
    })
    expect(w.find('video').exists()).toBe(true)
    expect(w.find('video').attributes('src')).toBe('blob:abc')
    expect(w.text()).toContain('重新录制')
    expect(w.text()).toContain('下载 webm')
    expect(w.text()).toContain('下载 mp4')
  })

  it('webm 下载链接使用 fileNameBase + .webm', () => {
    const w = mount(VideoPreview, {
      props: { videoUrl: 'blob:abc', fileNameBase: '在线录屏-20260430' },
    })
    const a = w.find('a')
    expect(a.attributes('download')).toBe('在线录屏-20260430.webm')
    expect(a.attributes('href')).toBe('blob:abc')
  })

  it('点击重新录制 emit reset', async () => {
    const w = mount(VideoPreview, {
      props: { videoUrl: 'blob:abc', fileNameBase: 'x' },
    })
    await w.find('button.is-secondary').trigger('click')
    expect(w.emitted('reset')).toHaveLength(1)
  })

  it('点击下载 mp4 emit download-mp4', async () => {
    const w = mount(VideoPreview, {
      props: { videoUrl: 'blob:abc', fileNameBase: 'x' },
    })
    const buttons = w.findAll('button.is-primary')
    await buttons[0].trigger('click')
    expect(w.emitted('download-mp4')).toHaveLength(1)
  })

  it('mp4Busy 时按钮禁用且显示「视频格式转换中...」', () => {
    const w = mount(VideoPreview, {
      props: {
        videoUrl: 'blob:abc',
        fileNameBase: 'x',
        mp4Busy: true,
      },
    })
    const mp4Btn = w.findAll('button.is-primary')[0]
    expect(mp4Btn.attributes('disabled')).toBeDefined()
    expect(mp4Btn.text()).toBe('下载 mp4')
    expect(w.text()).toContain('视频格式转换中')
  })

  it('mp4Busy=false 时不显示状态行', () => {
    const w = mount(VideoPreview, {
      props: { videoUrl: 'blob:abc', fileNameBase: 'x', mp4Busy: false },
    })
    expect(w.text()).not.toContain('视频格式转换中')
  })
})
