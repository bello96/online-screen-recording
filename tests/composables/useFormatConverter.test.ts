import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setLocale } from '@/i18n'

const loadMock = vi.fn(async () => undefined)
const writeFileMock = vi.fn(async () => undefined)
const execMock = vi.fn(async () => 0)
const readFileMock = vi.fn(async () => new Uint8Array([0x66, 0x61, 0x6b, 0x65]))
const deleteFileMock = vi.fn(async () => undefined)
const terminateMock = vi.fn()
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
  terminate = terminateMock
}

vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: MockFFmpeg,
}))

vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn(async () => new Uint8Array([1, 2, 3])),
}))

const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({
  ok: true,
  status: 200,
  arrayBuffer: async () => new ArrayBuffer(4),
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
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockClear()
  loadMock.mockReset()
  loadMock.mockImplementation(async () => undefined)
  writeFileMock.mockClear()
  execMock.mockReset()
  execMock.mockImplementation(async () => 0)
  readFileMock.mockClear()
  deleteFileMock.mockClear()
  terminateMock.mockClear()
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
    expect(c.errorMessage.value).toBeNull()
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

  it('转码参数保证偶数宽高与 yuv420p', async () => {
    const c = useFormatConverter()
    await c.convert(new Blob(['x']), 'mp4')
    const args = (execMock.mock.calls[0] as unknown as [string[]])[0]
    expect(args).toContain('scale=trunc(iw/2)*2:trunc(ih/2)*2')
    expect(args).toContain('yuv420p')
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

  it('exec 失败时设置 errorMessage 并抛出，且清理 MEMFS 文件', async () => {
    execMock.mockRejectedValueOnce(new Error('encode error'))
    const c = useFormatConverter()
    await expect(c.convert(new Blob(['x']), 'mp4')).rejects.toThrow('encode error')
    expect(c.errorMessage.value).toContain('MP4 转换失败')
    expect(c.converting.value).toBe(false)
    expect(deleteFileMock).toHaveBeenCalledWith('input.webm')
    expect(deleteFileMock).toHaveBeenCalledWith('output.mp4')
  })

  it('ffmpeg 返回非 0 退出码视为失败', async () => {
    execMock.mockResolvedValueOnce(1)
    const c = useFormatConverter()
    await expect(c.convert(new Blob(['x']), 'mp4')).rejects.toThrow('code 1')
    expect(readFileMock).not.toHaveBeenCalled()
    expect(c.errorMessage.value).toContain('MP4 转换失败')
  })

  it('load 失败时设置 errorMessage、复位 loading 并终止 worker', async () => {
    loadMock.mockRejectedValue(new Error('load broken'))
    const c = useFormatConverter()
    await expect(c.convert(new Blob(['x']), 'mp4')).rejects.toThrow()
    expect(c.errorMessage.value).toContain('加载视频转码器失败')
    expect(c.loading.value).toBe(false)
    expect(c.converting.value).toBe(false)
    // 每个 CDN 失败的实例都要 terminate
    expect(terminateMock).toHaveBeenCalledTimes(3)
  })

  it('首个 CDN 返回 HTTP 错误时切换到下一个', async () => {
    fetchMock.mockImplementationOnce(async () => ({
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
    }))
    const c = useFormatConverter()
    await c.convert(new Blob(['x']), 'mp4')
    const urls = fetchMock.mock.calls.map((call) => call[0])
    expect(urls.some((u) => u.includes('fastly.jsdelivr.net'))).toBe(true)
    expect(c.loaded.value).toBe(true)
  })

  it('下载请求携带 AbortSignal，可被取消', async () => {
    const c = useFormatConverter()
    await c.convert(new Blob(['x']), 'mp4')
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it('errorMessage 随语言切换', async () => {
    execMock.mockRejectedValueOnce(new Error('boom'))
    const c = useFormatConverter()
    await expect(c.convert(new Blob(['x']), 'mp4')).rejects.toThrow()
    setLocale('en')
    expect(c.errorMessage.value).toBe('MP4 conversion failed: boom')
  })

  it('clearError 清空错误', async () => {
    execMock.mockRejectedValueOnce(new Error('boom'))
    const c = useFormatConverter()
    await expect(c.convert(new Blob(['x']), 'mp4')).rejects.toThrow()
    c.clearError()
    expect(c.errorMessage.value).toBeNull()
  })

  it('dispose 终止 ffmpeg worker', async () => {
    const c = useFormatConverter()
    await c.convert(new Blob(['x']), 'mp4')
    c.dispose()
    expect(terminateMock).toHaveBeenCalledTimes(1)
    expect(c.loaded.value).toBe(false)
  })
})
