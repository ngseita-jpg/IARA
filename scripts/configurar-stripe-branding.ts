/**
 * Configura identidade visual do Checkout Stripe com o DNA do Iara Hub.
 * - Gera ícone (128x128) e logo horizontal em PNG via sharp (a partir de SVG)
 * - Faz upload para /v1/files (purpose: business_icon / business_logo)
 * - Atualiza settings.branding no account (cores + arquivos)
 *
 * Uso: npx tsx scripts/configurar-stripe-branding.ts
 */

import Stripe from 'stripe'
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

// ── Carrega .env.local ─────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8')
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (match) {
      const [, key, rawValue] = match
      const value = rawValue.replace(/^["']|["']$/g, '').trim()
      if (!process.env[key]) process.env[key] = value
    }
  })
}

const SECRET = process.env.STRIPE_SECRET_KEY
if (!SECRET) {
  console.error('❌ STRIPE_SECRET_KEY não encontrada no .env.local')
  process.exit(1)
}

const stripe = new Stripe(SECRET, { apiVersion: '2026-03-25.dahlia' })
const MODE = SECRET.startsWith('sk_live_') ? 'LIVE 🔴' : 'TEST 🧪'

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`  Iara Hub — Branding do Checkout Stripe (${MODE})`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

// ── SVGs do DNA Iara ──────────────────────────────────────────────
// Ícone quadrado: estrela de 4 pontas sobre fundo dark com borda discreta
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0615"/>
      <stop offset="100%" stop-color="#140820"/>
    </linearGradient>
    <linearGradient id="starGrad" x1="20%" y1="0%" x2="75%" y2="100%">
      <stop offset="0%" stop-color="#ede9fe"/>
      <stop offset="38%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#6d28d9"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.35"/>
      <stop offset="70%" stop-color="#a855f7" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bgGrad)"/>
  <circle cx="256" cy="256" r="240" fill="url(#glow)"/>
  <g transform="translate(256 256) scale(10)">
    <path d="M0 -20 L5 -5 L20 0 L5 5 L0 20 L-5 5 L-20 0 L-5 -5 Z" fill="url(#starGrad)"/>
    <path d="M0 0 L5 -5 L20 0 L5 5 Z" fill="rgba(4,2,18,0.52)"/>
  </g>
</svg>`

// Logo horizontal: estrela + wordmark "IARA" + subtitulo "HUB"
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200" viewBox="0 0 800 200">
  <defs>
    <linearGradient id="bgGradL" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#08080f"/>
      <stop offset="100%" stop-color="#0e081c"/>
    </linearGradient>
    <linearGradient id="starGradL" x1="20%" y1="0%" x2="75%" y2="100%">
      <stop offset="0%" stop-color="#ede9fe"/>
      <stop offset="38%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#6d28d9"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f1f1f8"/>
      <stop offset="50%" stop-color="#d8ccff"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="800" height="200" fill="url(#bgGradL)"/>

  <!-- Estrela -->
  <g transform="translate(100 100) scale(3.2)">
    <path d="M0 -20 L5 -5 L20 0 L5 5 L0 20 L-5 5 L-20 0 L-5 -5 Z" fill="url(#starGradL)"/>
    <path d="M0 0 L5 -5 L20 0 L5 5 Z" fill="rgba(4,2,18,0.52)"/>
  </g>

  <!-- Wordmark IARA -->
  <text x="200" y="110" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="78" fill="url(#textGrad)" letter-spacing="-2">IARA</text>

  <!-- Subtitle HUB -->
  <text x="202" y="145" font-family="Arial, sans-serif" font-weight="700" font-size="16" fill="#9b80d4" letter-spacing="8">— HUB —</text>
</svg>`

async function svgParaPng(svg: string, opts?: { width?: number; height?: number }): Promise<Buffer> {
  const png = await sharp(Buffer.from(svg))
    .resize(opts?.width, opts?.height)
    .png({ quality: 95 })
    .toBuffer()
  return png
}

async function uploadFileToStripe(buffer: Buffer, purpose: 'business_icon' | 'business_logo', filename: string): Promise<string> {
  // Usa multipart/form-data manualmente via fetch pra files.stripe.com
  // O SDK v2 do Node tem bugs com buffer direto em algumas versões
  const boundary = `----IaraHub${Date.now()}`
  const parts: Buffer[] = []

  // Campo: purpose
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="purpose"\r\n\r\n${purpose}\r\n`))

  // Campo: file
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`))
  parts.push(buffer)
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`))

  const body = Buffer.concat(parts)

  const res = await fetch('https://files.stripe.com/v1/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SECRET}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': String(body.length),
    },
    body,
  })
  const json = await res.json() as { id?: string; error?: { message: string } }
  if (!res.ok || !json.id) {
    throw new Error(json.error?.message ?? `HTTP ${res.status}`)
  }
  return json.id
}

async function main() {
  // 1. Verifica account atual (via endpoint singular /v1/account)
  const accRes = await fetch('https://api.stripe.com/v1/account', {
    headers: { 'Authorization': `Bearer ${SECRET}` },
  })
  const account = await accRes.json() as {
    id: string
    email?: string
    settings?: { branding?: Record<string, string> }
  }
  console.log(`📋 Conta: ${account.email ?? account.id}`)
  console.log(`   Status atual do branding:`)
  console.log(`   - primary_color:   ${account.settings?.branding?.primary_color ?? '(não definido)'}`)
  console.log(`   - secondary_color: ${account.settings?.branding?.secondary_color ?? '(não definido)'}`)
  console.log(`   - icon file id:    ${account.settings?.branding?.icon ?? '(não definido)'}`)
  console.log(`   - logo file id:    ${account.settings?.branding?.logo ?? '(não definido)'}`)
  console.log()

  // 2. Gera PNGs
  console.log('🎨 Gerando PNGs a partir de SVG...')
  const iconBuffer = await svgParaPng(ICON_SVG, { width: 512, height: 512 })
  const logoBuffer = await svgParaPng(LOGO_SVG, { width: 800, height: 200 })
  console.log(`   ✓ Ícone: ${(iconBuffer.length / 1024).toFixed(1)} KB`)
  console.log(`   ✓ Logo:  ${(logoBuffer.length / 1024).toFixed(1)} KB`)
  console.log()

  // Salva localmente pra você inspecionar
  fs.writeFileSync('scripts/iara-icon.png', iconBuffer)
  fs.writeFileSync('scripts/iara-logo.png', logoBuffer)
  console.log('   (salvos em scripts/iara-icon.png e scripts/iara-logo.png para conferência)')
  console.log()

  // 3. Upload pro Stripe
  console.log('📤 Enviando para Stripe...')
  const iconFileId = await uploadFileToStripe(iconBuffer, 'business_icon', 'iara-icon.png')
  console.log(`   ✓ Ícone uploaded: ${iconFileId}`)
  const logoFileId = await uploadFileToStripe(logoBuffer, 'business_logo', 'iara-logo.png')
  console.log(`   ✓ Logo uploaded:  ${logoFileId}`)
  console.log()

  // 4. Atualiza account branding (endpoint singular /v1/account para self-account)
  console.log('⚙️  Atualizando configurações da conta...')
  const params = new URLSearchParams()
  params.append('settings[branding][primary_color]',   '#6366f1')
  params.append('settings[branding][secondary_color]', '#a855f7')
  params.append('settings[branding][icon]',            iconFileId)
  params.append('settings[branding][logo]',            logoFileId)

  const upd = await fetch('https://api.stripe.com/v1/account', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SECRET}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  const updJson = await upd.json() as { settings?: { branding?: Record<string, string> }; error?: { message: string } }
  if (!upd.ok) {
    throw new Error(updJson.error?.message ?? `HTTP ${upd.status}`)
  }

  console.log(`✅ Branding aplicado com sucesso!`)
  console.log()
  console.log(`   Novas configurações:`)
  console.log(`   - primary_color:   ${updJson.settings?.branding?.primary_color}`)
  console.log(`   - secondary_color: ${updJson.settings?.branding?.secondary_color}`)
  console.log(`   - icon:            ${updJson.settings?.branding?.icon}`)
  console.log(`   - logo:            ${updJson.settings?.branding?.logo}`)
  console.log()
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  Pra ver o checkout com o novo branding, use qualquer`)
  console.log(`  link de pagamento do Iara Hub ou teste direto em:`)
  console.log(`  https://buy.stripe.com/test_...`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message)
  if (err.raw) console.error('   Detalhe:', err.raw.message)
  process.exit(1)
})
