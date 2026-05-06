/**
 * Comprime imagem no client antes de enviar pra API.
 * Sem isso, fotos de iPhone (8-12 MB) estouram limite Vercel (~5 MB) e
 * upload mobile trava silenciosamente.
 *
 * - Lanczos resampling preserva detalhe ao reduzir tamanho
 * - JPEG @ quality default 0.85 (sweet spot tamanho vs qualidade)
 * - maxDim default 1600 cobre uso geral (banco de fotos, mídia kit, etc)
 *
 * Pra carrosséis profissionais use 2400/0.92 (já implementado inline lá).
 */

export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.85,
): Promise<string> {
  // Le o arquivo como DataURL primeiro
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  return new Promise<string>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(dataUrl)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}
