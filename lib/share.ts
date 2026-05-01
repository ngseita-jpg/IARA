/**
 * Helpers de compartilhamento:
 *  - shareText / shareFiles: Web Share API com fallback graceful
 *  - downloadZip: empacota array de blobs num .zip e dispara download
 *  - downloadFile: força download de blob ou data URL
 *
 * Uso (client-only):
 *   import { shareText, downloadZip } from '@/lib/share'
 */

export function downloadFile(data: Blob | string, filename: string) {
  const url = typeof data === 'string' ? data : URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  if (typeof data !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

/** Converte data URL (base64) em Blob */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.+?);/)?.[1] ?? 'application/octet-stream'
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

export async function downloadZip(
  files: { name: string; data: Blob | string }[],
  zipName: string,
): Promise<void> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const f of files) {
    const blob = typeof f.data === 'string' ? dataUrlToBlob(f.data) : f.data
    zip.file(f.name, blob)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  downloadFile(blob, zipName)
}

/** Retorna true se a API de share está disponível (mobile geralmente) */
export function canShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

/** Retorna true se o navegador suporta share com files (iOS Safari, Chrome Android moderno) */
export function canShareFiles(files: File[]): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
  if (!nav.canShare) return false
  try {
    return nav.canShare({ files })
  } catch {
    return false
  }
}

/** Tenta share nativo, fallback pra clipboard */
export async function shareText(opts: { title?: string; text: string; url?: string }): Promise<'shared' | 'copied' | 'failed'> {
  if (canShare()) {
    try {
      await navigator.share(opts)
      return 'shared'
    } catch (e) {
      // user cancelled — sem ação
      if (e instanceof Error && e.name === 'AbortError') return 'failed'
    }
  }
  try {
    const compose = [opts.title, opts.text, opts.url].filter(Boolean).join('\n\n')
    await navigator.clipboard.writeText(compose)
    return 'copied'
  } catch {
    return 'failed'
  }
}

/** Compartilha arquivos via Web Share API Level 2 */
export async function shareFiles(opts: {
  title?: string
  text?: string
  files: File[]
}): Promise<'shared' | 'unavailable' | 'failed'> {
  if (!canShareFiles(opts.files)) return 'unavailable'
  try {
    await navigator.share({
      title: opts.title,
      text: opts.text,
      files: opts.files,
    })
    return 'shared'
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return 'failed'
    return 'failed'
  }
}

/** Converte data URL → File (pra usar em shareFiles) */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const blob = dataUrlToBlob(dataUrl)
  return new File([blob], filename, { type: blob.type })
}
