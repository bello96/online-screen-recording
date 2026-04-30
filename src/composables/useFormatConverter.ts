import { ref, type Ref } from 'vue'

export interface UseFormatConverter {
  converting: Ref<boolean>
  progress: Ref<number>
  loaded: Ref<boolean>
  loading: Ref<boolean>
  loadingProgress: Ref<number>
  errorMessage: Ref<string | null>
  convert(input: Blob, target: 'mp4'): Promise<Blob>
}

const FFMPEG_CORE_VERSION = '0.12.10'
const CDN_BASES = [
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`,
  `https://fastly.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`,
  `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`,
]
const PER_FILE_TIMEOUT_MS = 60_000

async function fetchToBlobURLWithProgress(
  url: string,
  mime: string,
  onProgress?: (p: number) => void,
): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PER_FILE_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} (${url})`)
    }
    const total = Number(res.headers.get('content-length')) || 0
    const reader = res.body?.getReader()
    if (!reader) {
      const ab = await res.arrayBuffer()
      return URL.createObjectURL(new Blob([ab], { type: mime }))
    }
    const chunks: BlobPart[] = []
    let received = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      chunks.push(value as BlobPart)
      received += value.length
      if (total > 0 && onProgress) {
        onProgress(received / total)
      }
    }
    if (onProgress) {
      onProgress(1)
    }
    return URL.createObjectURL(new Blob(chunks, { type: mime }))
  } finally {
    clearTimeout(timer)
  }
}

export function useFormatConverter(): UseFormatConverter {
  const converting = ref(false)
  const progress = ref(0)
  const loaded = ref(false)
  const loading = ref(false)
  const loadingProgress = ref(0)
  const errorMessage = ref<string | null>(null)

  let ffmpegInstance: unknown | null = null
  let loadPromise: Promise<void> | null = null

  async function loadCoreFromCDN(): Promise<{ coreURL: string; wasmURL: string }> {
    let lastErr: unknown = null
    for (const base of CDN_BASES) {
      try {
        loadingProgress.value = 0
        const [coreURL, wasmURL] = await Promise.all([
          fetchToBlobURLWithProgress(`${base}/ffmpeg-core.js`, 'text/javascript'),
          fetchToBlobURLWithProgress(`${base}/ffmpeg-core.wasm`, 'application/wasm', (p) => {
            loadingProgress.value = p
          }),
        ])
        return { coreURL, wasmURL }
      } catch (err) {
        lastErr = err
        // eslint-disable-next-line no-console
        console.warn(`[useFormatConverter] CDN ${base} 加载失败，尝试下一个`, err)
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('所有 CDN 加载均失败')
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
    loadingProgress.value = 0
    loadPromise = (async () => {
      try {
        const { FFmpeg } = await import('@ffmpeg/ffmpeg')
        const instance = new FFmpeg()
        instance.on('progress', ({ progress: p }: { progress: number }) => {
          if (Number.isFinite(p)) {
            progress.value = Math.max(0, Math.min(1, p))
          }
        })
        const { coreURL, wasmURL } = await loadCoreFromCDN()
        await instance.load({ coreURL, wasmURL })
        ffmpegInstance = instance
        loaded.value = true
      } catch (err) {
        const e = err as Error
        const reason =
          e.name === 'AbortError'
            ? '下载超时（>60s），请检查网络或代理'
            : (e.message ?? '未知错误')
        errorMessage.value = `加载 ffmpeg 失败：${reason}`
        // eslint-disable-next-line no-console
        console.error('[useFormatConverter] 加载失败:', err)
        throw err
      }
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
      const data = await fetchFile(input)
      await ffmpeg.writeFile(inputName, data)
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
    loadingProgress,
    errorMessage,
    convert,
  }
}
