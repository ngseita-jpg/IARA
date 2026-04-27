/**
 * Helper para cortar vídeo client-side via FFmpeg.wasm.
 *
 * Lazy-loaded — o FFmpeg core (~30MB) só é baixado quando o usuário clica
 * pra cortar o primeiro trecho. Depois fica em memória pra reutilizar.
 *
 * Vantagens:
 *  - Zero compute no servidor (zero $ Vercel)
 *  - Vídeo nunca sai do browser (privacidade)
 *  - Funciona em qualquer navegador moderno (Chrome, Firefox, Safari, Edge)
 *
 * Limitação: o usuário precisa SUBIR o vídeo manualmente. Não baixamos do
 * YouTube por restrições de TOS. Sugerimos serviços externos (Cobalt etc)
 * pra ele baixar o mp4 antes de subir aqui.
 */

import type { FFmpeg } from '@ffmpeg/ffmpeg'

let ffmpegInstance: FFmpeg | null = null
let loadingPromise: Promise<FFmpeg> | null = null

export type FFmpegProgress = (info: { progress: number; time: number }) => void

/** Carrega o FFmpeg.wasm sob demanda. Singleton — só carrega uma vez por sessão. */
export async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    const { FFmpeg: FFmpegClass } = await import('@ffmpeg/ffmpeg')
    const { toBlobURL } = await import('@ffmpeg/util')

    const ffmpeg = new FFmpegClass()
    if (onLog) ffmpeg.on('log', ({ message }) => onLog(message))

    // unpkg CDN — single-thread version (sem SharedArrayBuffer, mais portável)
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd'
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })

    ffmpegInstance = ffmpeg
    return ffmpeg
  })()
  return loadingPromise
}

/**
 * Corta um trecho de vídeo. Usa stream copy (sem re-encode) quando possível
 * pra ser rápido. Pode haver pequeno snap pro keyframe mais próximo.
 *
 * @param video Arquivo MP4 fonte do user
 * @param inicioSeg tempo de início em segundos (decimal aceito)
 * @param fimSeg tempo de fim em segundos
 * @param progresso Callback opcional pra UI mostrar progresso (0-1)
 */
export async function cortarVideo(
  video: File,
  inicioSeg: number,
  fimSeg: number,
  progresso?: FFmpegProgress,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg()

  if (progresso) {
    const handler = ({ progress, time }: { progress: number; time: number }) => progresso({ progress, time })
    ffmpeg.on('progress', handler)
  }

  const inputName = 'input.mp4'
  const outputName = 'output.mp4'

  // Escreve arquivo no FS virtual do FFmpeg
  const buffer = new Uint8Array(await video.arrayBuffer())
  await ffmpeg.writeFile(inputName, buffer)

  const duracao = (fimSeg - inicioSeg).toFixed(2)

  // -ss antes do -i = seek rápido (sample-accurate em mp4 keyframes)
  // -c copy = sem re-encode (instantâneo)
  // -avoid_negative_ts make_zero = corrige timestamps quando -ss não cai em keyframe
  await ffmpeg.exec([
    '-ss', inicioSeg.toFixed(2),
    '-i', inputName,
    '-t', duracao,
    '-c', 'copy',
    '-avoid_negative_ts', 'make_zero',
    outputName,
  ])

  const data = await ffmpeg.readFile(outputName)
  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  // data é Uint8Array; converter pra Blob mp4
  // Cast porque a tipagem do ffmpeg pode retornar string em alguns formatos
  const arr = data as Uint8Array
  return new Blob([new Uint8Array(arr)], { type: 'video/mp4' })
}

/**
 * Corta o vídeo com re-encoding (mais lento ~1x duração) e converte para 9:16
 * (1080×1920) pronto pra Reels/Shorts/TikTok. Use quando o vídeo original é 16:9.
 */
export async function cortarVideoVertical(
  video: File,
  inicioSeg: number,
  fimSeg: number,
  progresso?: FFmpegProgress,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg()

  if (progresso) {
    const handler = ({ progress, time }: { progress: number; time: number }) => progresso({ progress, time })
    ffmpeg.on('progress', handler)
  }

  const inputName = 'input.mp4'
  const outputName = 'output_vert.mp4'
  const buffer = new Uint8Array(await video.arrayBuffer())
  await ffmpeg.writeFile(inputName, buffer)

  const duracao = (fimSeg - inicioSeg).toFixed(2)

  // Crop centralizado vertical (9:16) + escala 1080×1920
  // crop=ih*9/16:ih corta no centro mantendo altura, depois scale
  await ffmpeg.exec([
    '-ss', inicioSeg.toFixed(2),
    '-i', inputName,
    '-t', duracao,
    '-vf', 'crop=ih*9/16:ih,scale=1080:1920',
    '-c:a', 'copy',
    '-preset', 'ultrafast',
    '-crf', '23',
    outputName,
  ])

  const data = await ffmpeg.readFile(outputName)
  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  const arr = data as Uint8Array
  return new Blob([new Uint8Array(arr)], { type: 'video/mp4' })
}

/** Verifica se o navegador suporta FFmpeg.wasm */
export function browserSuportaFFmpeg(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof WebAssembly === 'undefined') return false
  return true
}
