import { ref, type Ref } from 'vue'

export interface UseFormatConverter {
  converting: Ref<boolean>
  progress: Ref<number>
  loaded: Ref<boolean>
  loading: Ref<boolean>
  errorMessage: Ref<string | null>
  convert(input: Blob, target: 'mp4'): Promise<Blob>
}

const FFMPEG_CORE_VERSION = '0.12.10'
const CDN_BASES = [
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`,
  `https://fastly.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`,
  `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`,
]
const FETCH_TIMEOUT_MS = 60_000
const LOAD_TIMEOUT_MS = 60_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} 超时（>${Math.round(ms / 1000)}s）`)), ms)
    }),
  ])
}

export function useFormatConverter(): UseFormatConverter {
  const converting = ref(false)
  const progress = ref(0)
  const loaded = ref(false)
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  let ffmpegInstance: unknown | null = null
  let loadPromise: Promise<void> | null = null

  async function tryLoadFromBase(base: string): Promise<unknown> {
    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import('@ffmpeg/ffmpeg'),
      import('@ffmpeg/util'),
    ])
    // eslint-disable-next-line no-console
    console.log(`[converter] 拉取 ffmpeg core: ${base}`)
    const [coreURL, wasmURL] = await Promise.all([
      withTimeout(
        toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
        FETCH_TIMEOUT_MS,
        '下载 ffmpeg-core.js',
      ),
      withTimeout(
        toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
        FETCH_TIMEOUT_MS,
        '下载 ffmpeg-core.wasm',
      ),
    ])
    // eslint-disable-next-line no-console
    console.log('[converter] core 文件就绪，初始化 ffmpeg 实例')
    const instance = new FFmpeg()
    instance.on('progress', ({ progress: p }: { progress: number }) => {
      if (Number.isFinite(p)) {
        progress.value = Math.max(0, Math.min(1, p))
      }
    })
    instance.on('log', ({ message }: { type: string; message: string }) => {
      // eslint-disable-next-line no-console
      console.debug(`[ffmpeg] ${message}`)
    })
    await withTimeout(instance.load({ coreURL, wasmURL }), LOAD_TIMEOUT_MS, 'ffmpeg.load')
    // eslint-disable-next-line no-console
    console.log('[converter] ffmpeg 就绪')
    return instance
  }

  async function ensureLoaded() {
    if (loaded.value && ffmpegInstance) {
      return
    }
    if (loadPromise) {
      await loadPromise
      return
    }

    loading.value = true
    loadPromise = (async () => {
      let lastErr: unknown = null
      for (const base of CDN_BASES) {
        try {
          ffmpegInstance = await tryLoadFromBase(base)
          loaded.value = true
          return
        } catch (err) {
          lastErr = err
          // eslint-disable-next-line no-console
          console.warn(`[converter] CDN ${base} 失败，尝试下一个`, err)
        }
      }
      const e = lastErr instanceof Error ? lastErr : new Error('未知错误')
      errorMessage.value = `加载视频转码器失败：${e.message}`
      // eslint-disable-next-line no-console
      console.error('[converter] 全部 CDN 失败', lastErr)
      throw e
    })().finally(() => {
      loading.value = false
      loadPromise = null
    })

    await loadPromise
  }

  async function convert(input: Blob, target: 'mp4'): Promise<Blob> {
    if (converting.value) {
      throw new Error('已有转换任务正在进行')
    }
    converting.value = true
    progress.value = 0
    errorMessage.value = null

    try {
      await ensureLoaded()
      const { fetchFile } = await import('@ffmpeg/util')
      const ffmpeg = ffmpegInstance as {
        writeFile(name: string, data: Uint8Array): Promise<void>
        exec(args: string[]): Promise<number>
        readFile(name: string): Promise<Uint8Array | string>
        deleteFile(name: string): Promise<void>
      }

      const inputName = 'input.webm'
      const outputName = `output.${target}`
      // eslint-disable-next-line no-console
      console.log('[converter] 写入源文件')
      const data = await fetchFile(input)
      await ffmpeg.writeFile(inputName, data)
      // eslint-disable-next-line no-console
      console.log('[converter] 开始转码')
      await ffmpeg.exec([
        '-i',
        inputName,
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-c:a',
        'aac',
        '-movflags',
        '+faststart',
        outputName,
      ])
      // eslint-disable-next-line no-console
      console.log('[converter] 读取产物')
      const out = await ffmpeg.readFile(outputName)
      const bytes = typeof out === 'string' ? new TextEncoder().encode(out) : out
      const arrayBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer
      const blob = new Blob([arrayBuffer], { type: 'video/mp4' })

      try {
        await ffmpeg.deleteFile(inputName)
        await ffmpeg.deleteFile(outputName)
      } catch {
        /* 忽略清理失败 */
      }

      progress.value = 1
      return blob
    } catch (err) {
      if (!errorMessage.value) {
        const e = err as Error
        errorMessage.value = `MP4 转换失败：${e.message ?? '未知错误'}`
      }
      throw err
    } finally {
      converting.value = false
    }
  }

  return {
    converting,
    progress,
    loaded,
    loading,
    errorMessage,
    convert,
  }
}
