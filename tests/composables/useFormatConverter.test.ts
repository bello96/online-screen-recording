import { describe, it, expect, vi, beforeEach } from 'vitest'

const loadMock = vi.fn(async () => undefined)
const writeFileMock = vi.fn(async () => undefined)
const execMock = vi.fn(async () => 0)
const readFileMock = vi.fn(async () => new Uint8Array([0x66, 0x61, 0x6b, 0x65]))
const deleteFileMock = vi.fn(async () => undefined)
let progressHandler: ((evt: { progress: number }) => void) | null = null

class MockFFmpeg {
  on(event: string, cb: (evt: { progress: number }) => void) {
    if (event === 'progress') {
      progressHandler = cb
    }
  }
  load = loadMock
  writeFile = writeFileMock
  exec = execMock
  readFile = readFileMock
  deleteFile = deleteFileMock
}

vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: MockFFmpeg,
}))

vi.mock('@ffmpeg/util', () => ({
  toBlobURL: vi.fn(async (url: string) => `blob:${url}`),
  fetchFile: vi.fn(async () => new Uint8Array([1, 2, 3])),
}))

const waitFor = async (cond: () => boolean, max = 100) => {
  for (let i = 0; i < max; i++) {
    if (cond()) {
      return
    }
    await Promise.resolve()
  }
}

beforeEach(() => {
  loadMock.mockClear()
  loadMock.mockImplementation(async () => undefined)
  writeFileMock.mockClear()
  execMock.mockClear()
  readFileMock.mockClear()
  deleteFileMock.mockClear()
  progressHandler = null
})

import { useFormatConverter } from '@/composables/useFormatConverter'

describe('useFormatConverter', () => {
  it('初始状态：未在转换、未加载', () => {
    const c = useFormatConverter()
    expect(c.converting.value).toBe(false)
    expect(c.progress.value).toBe(0)
    expect(c.loaded.value).toBe(false)
    expect(c.loading.value).toBe(false)
  })

  it('convert 后输出 video/mp4 类型 Blob', async () => {
    const c = useFormatConverter()
    const input = new Blob(['hello'], { type: 'video/webm' })
    const result = await c.convert(input, 'mp4')
    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('video/mp4')
    expect(loadMock).toHaveBeenCalledTimes(1)
    expect(writeFileMock).toHaveBeenCalled()
    expect(execMock).toHaveBeenCalled()
    expect(readFileMock).toHaveBeenCalled()
  })

  it('再次 convert 不重复 load ffmpeg', async () => {
    const c = useFormatConverter()
    await c.convert(new Blob(['a']), 'mp4')
    await c.convert(new Blob(['b']), 'mp4')
    expect(loadMock).toHaveBeenCalledTimes(1)
  })

  it('转换中 converting=true，结束后回 false', async () => {
    const c = useFormatConverter()
    const promise = c.convert(new Blob(['x']), 'mp4')
    expect(c.converting.value).toBe(true)
    await promise
    expect(c.converting.value).toBe(false)
  })

  it('progress 事件回调能更新 progress.value', async () => {
    const c = useFormatConverter()
    const promise = c.convert(new Blob(['x']), 'mp4')
    await waitFor(() => progressHandler !== null)
    progressHandler?.({ progress: 0.5 })
    expect(c.progress.value).toBeCloseTo(0.5)
    await promise
  })

  it('exec 失败时设置 errorMessage 并抛出', async () => {
    execMock.mockRejectedValueOnce(new Error('encode error'))
    const c = useFormatConverter()
    await expect(c.convert(new Blob(['x']), 'mp4')).rejects.toThrow('encode error')
    expect(c.errorMessage.value).toContain('MP4 转换失败')
    expect(c.converting.value).toBe(false)
  })

  it('load 失败时设置 errorMessage 并复位 loading', async () => {
    loadMock.mockRejectedValue(new Error('load broken'))
    const c = useFormatConverter()
    await expect(c.convert(new Blob(['x']), 'mp4')).rejects.toThrow()
    expect(c.errorMessage.value).toContain('加载视频转码器失败')
    expect(c.loading.value).toBe(false)
    expect(c.converting.value).toBe(false)
  })
})
