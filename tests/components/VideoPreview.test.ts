import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VideoPreview from '@/components/VideoPreview.vue'

describe('VideoPreview', () => {
  it('渲染 video 元素和下载/重录按钮', () => {
    const w = mount(VideoPreview, {
      props: { videoUrl: 'blob:abc', fileName: 'test.webm' },
    })
    expect(w.find('video').exists()).toBe(true)
    expect(w.find('video').attributes('src')).toBe('blob:abc')
    expect(w.text()).toContain('下载视频')
    expect(w.text()).toContain('重新录制')
  })

  it('下载链接的 download 属性使用 fileName', () => {
    const w = mount(VideoPreview, {
      props: { videoUrl: 'blob:abc', fileName: 'rec-2026.webm' },
    })
    const a = w.find('a')
    expect(a.attributes('download')).toBe('rec-2026.webm')
    expect(a.attributes('href')).toBe('blob:abc')
  })

  it('点击重新录制 emit reset', async () => {
    const w = mount(VideoPreview, {
      props: { videoUrl: 'blob:abc', fileName: 'x.webm' },
    })
    await w.find('button.video-preview__reset').trigger('click')
    expect(w.emitted('reset')).toHaveLength(1)
  })
})
