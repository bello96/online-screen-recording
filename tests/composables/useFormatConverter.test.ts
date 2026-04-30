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

function makeFakeResponse(bytes: Uint8Array) {
  let sent = false
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-length' ? String(bytes.length) : null,
    },
    body: {
      getReader: () => ({
        async read() {
          if (sent) {
            return { done: true, value: undefined }
          }
          sent = true
          return { done: false, value: bytes }
        },
      }),
    },
    async arrayBuffer() {
      return bytes.buffer
    },
  }
}

const flushAll = async () => {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve()
  }
}

beforeEach(() => {
  loadMock.mockClear()
  writeFileMock.mockClear()
  execMock.mockClear()
  readFileMock.mockClear()
  deleteFileMock.mockClear()
  progressHandler = null
  ;(globalThis as unknown as { fetch: typeof fetch }).fetch = vi.fn(
    async () => makeFakeResponse(new Uint8Array([1, 2, 3])) as unknown as Response,
  )
})

import { useFormatConverter } from '@/composables/useFormatConverter'

describe('useFormatConverter', () => {
  it('初始状态：未在转换、未加载', () => {
    const c = useFormatConverter()
    expect(c.converting.value).toBe(false)
    expect(c.progress.value).toBe(0)
    expect(c.loaded.value).toBe(false)
    expect(c.loadingProgress.value).toBe(0)
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

  it('progress 事件更新 progress.value', async () => {
    const c = useFormatConverter()
    const promise = c.convert(new Blob(['x']), 'mp4')
    await flushAll()
    progressHandler?.({ progress: 0.5 })
    expect(c.progress.value).toBeCloseTo(0.5)
    await promise
    expect(c.progress.value).toBe(1)
  })

  it('exec 失败时设置 errorMessage 并抛出', async () => {
    execMock.mockRejectedValueOnce(new Error('encode error'))
    const c = useFormatConverter()
    await expect(c.convert(new Blob(['x']), 'mp4')).rejects.toThrow('encode error')
    expect(c.errorMessage.value).toContain('MP4 转换失败')
    expect(c.converting.value).toBe(false)
  })

  it('CDN 全部失败时记录错误', async () => {
    ;(globalThis as unknown as { fetch: typeof fetch }).fetch = vi.fn(async () => {
      throw new Error('network down')
    }) as unknown as typeof fetch
    const c = useFormatConverter()
    await expect(c.convert(new Blob(['x']), 'mp4')).rejects.toThrow()
    expect(c.errorMessage.value).toContain('加载 ffmpeg 失败')
    expect(c.loading.value).toBe(false)
  })
})
