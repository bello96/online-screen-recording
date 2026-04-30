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
const FFMPEG_CORE_BASE = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`

export function useFormatConverter(): UseFormatConverter {
  const converting = ref(false)
  const progress = ref(0)
  const loaded = ref(false)
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  let ffmpegInstance: unknown | null = null
  let loadPromise: Promise<void> | null = null

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
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
        import('@ffmpeg/ffmpeg'),
        import('@ffmpeg/util'),
      ])
      const instance = new FFmpeg()
      instance.on('progress', ({ progress: p }: { progress: number }) => {
        if (Number.isFinite(p)) {
          progress.value = Math.max(0, Math.min(1, p))
        }
      })
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
        toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
      ])
      await instance.load({ coreURL, wasmURL })
      ffmpegInstance = instance
      loaded.value = true
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
      const e = err as Error
      errorMessage.value = `MP4 转换失败：${e.message ?? '未知错误'}`
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
