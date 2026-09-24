import { ref, computed, getCurrentInstance, onBeforeUnmount, type Ref } from 'vue'
import { translateError, type I18nError } from '@/i18n'

export interface UseFormatConverter {
  converting: Ref<boolean>
  progress: Ref<number>
  loaded: Ref<boolean>
  loading: Ref<boolean>
  /** 已按当前语言翻译的错误文案，切换语言时自动更新 */
  errorMessage: Readonly<Ref<string | null>>
  convert(input: Blob, target: 'mp4'): Promise<Blob>
  clearError(): void
  /** 终止 ffmpeg worker 并释放 wasm 内存 */
  dispose(): void
}

interface FFmpegLike {
  on(event: 'progress', cb: (evt: { progress: number }) => void): void
  on(event: 'log', cb: (evt: { type: string; message: string }) => void): void
  load(config: { coreURL: string; wasmURL: string }): Promise<unknown>
  writeFile(name: string, data: Uint8Array): Promise<unknown>
  exec(args: string[]): Promise<number>
  readFile(name: string): Promise<Uint8Array | string>
  deleteFile(name: string): Promise<unknown>
  terminate?(): void
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
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timeout (>${Math.round(ms / 1000)}s)`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/** 下载文件并转为 blob URL；超时或 signal 中止时真正取消网络请求，而不是放任其在后台继续下载 */
async function fetchToBlobURL(url: string, type: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(url, { signal })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${url}`)
  }
  const buffer = await res.arrayBuffer()
  return URL.createObjectURL(new Blob([buffer], { type }))
}

export function useFormatConverter(): UseFormatConverter {
  const converting = ref(false)
  const progress = ref(0)
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref<I18nError | null>(null)
  const errorMessage = computed(() => translateError(error.value))

  let ffmpegInstance: FFmpegLike | null = null
  let loadPromise: Promise<void> | null = null

  async function tryLoadFromBase(base: string): Promise<FFmpegLike> {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg')
    // eslint-disable-next-line no-console
    console.log(`[converter] 拉取 ffmpeg core: ${base}`)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const blobUrls: string[] = []
    let instance: FFmpegLike | null = null
    try {
      // 任一文件失败即中止另一个，避免切换到下一个 CDN 时仍在后台下载约 30MB 的 wasm
      const [coreURL, wasmURL] = await Promise.all([
        fetchToBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript', controller.signal),
        fetchToBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm', controller.signal),
      ]).catch((err) => {
        const timedOut = controller.signal.aborted
        controller.abort()
        throw timedOut
          ? new Error(`download timeout (>${Math.round(FETCH_TIMEOUT_MS / 1000)}s): ${base}`)
          : err
      })
      blobUrls.push(coreURL, wasmURL)
      clearTimeout(timer)

      // eslint-disable-next-line no-console
      console.log('[converter] core 文件就绪，初始化 ffmpeg 实例')
      instance = new FFmpeg() as unknown as FFmpegLike
      instance.on('progress', ({ progress: p }) => {
        if (Number.isFinite(p)) {
          progress.value = Math.max(0, Math.min(1, p))
        }
      })
      instance.on('log', ({ message }) => {
        // eslint-disable-next-line no-console
        console.debug(`[ffmpeg] ${message}`)
      })
      await withTimeout(instance.load({ coreURL, wasmURL }), LOAD_TIMEOUT_MS, 'ffmpeg.load')
      // eslint-disable-next-line no-console
      console.log('[converter] ffmpeg 就绪')
      return instance
    } catch (err) {
      // 加载失败的实例仍持有 worker 与 wasm 内存，必须终止
      instance?.terminate?.()
      throw err
    } finally {
      clearTimeout(timer)
      // load 完成后 core 已被 worker 读入，blob URL 可以释放
      blobUrls.forEach((u) => URL.revokeObjectURL(u))
    }
  }

  async function ensureLoaded(): Promise<FFmpegLike> {
    if (ffmpegInstance) {
      return ffmpegInstance
    }
    if (!loadPromise) {
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
        error.value = {
          key: 'error.converterLoad',
          reason: lastErr instanceof Error ? lastErr.message : undefined,
        }
        // eslint-disable-next-line no-console
        console.error('[converter] 全部 CDN 失败', lastErr)
        throw lastErr instanceof Error ? lastErr : new Error('ffmpeg load failed')
      })().finally(() => {
        loading.value = false
        loadPromise = null
      })
    }
    await loadPromise
    return ffmpegInstance!
  }

  async function convert(input: Blob, target: 'mp4'): Promise<Blob> {
    if (converting.value) {
      throw new Error('A conversion is already in progress')
    }
    converting.value = true
    progress.value = 0
    error.value = null

    const inputName = 'input.webm'
    const outputName = `output.${target}`
    let ffmpeg: FFmpegLike | null = null

    try {
      ffmpeg = await ensureLoaded()
      const { fetchFile } = await import('@ffmpeg/util')
      await ffmpeg.writeFile(inputName, await fetchFile(input))

      // eslint-disable-next-line no-console
      console.log('[converter] 开始转码')
      const exitCode = await ffmpeg.exec([
        '-i',
        inputName,
        // 窗口录制的宽高可能是奇数，而 yuv420p 要求偶数宽高
        '-vf',
        'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        // 保证 QuickTime / Windows 自带播放器可以播放
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-movflags',
        '+faststart',
        outputName,
      ])
      if (exitCode !== 0) {
        throw new Error(`ffmpeg exited with code ${exitCode}`)
      }

      const out = await ffmpeg.readFile(outputName)
      const bytes = typeof out === 'string' ? new TextEncoder().encode(out) : out
      progress.value = 1
      return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'video/mp4' })
    } catch (err) {
      if (!error.value) {
        error.value = { key: 'error.mp4Convert', reason: (err as Error)?.message }
      }
      throw err
    } finally {
      // 无论成功失败都清理 MEMFS，否则大文件会一直占用 wasm 内存
      if (ffmpeg) {
        await Promise.allSettled([ffmpeg.deleteFile(inputName), ffmpeg.deleteFile(outputName)])
      }
      converting.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  function dispose() {
    ffmpegInstance?.terminate?.()
    ffmpegInstance = null
    loaded.value = false
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(dispose)
  }

  return {
    converting,
    progress,
    loaded,
    loading,
    errorMessage,
    convert,
    clearError,
    dispose,
  }
}
