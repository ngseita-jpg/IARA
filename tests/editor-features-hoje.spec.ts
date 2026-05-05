import { test } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SHOTS = path.join(process.cwd(), 'tests', 'shots-hoje')
fs.mkdirSync(SHOTS, { recursive: true })

const CARROSSEL_MOCK = {
  v: 1,
  ts: Date.now(),
  ttlHours: 24,
  data: {
    step: 'preview',
    modoConteudo: 'texto',
    url: '',
    textoManual: 'Teste features de hoje',
    leitura: null,
    numSlides: 3,
    instrucoes: '',
    modo: 'criador',
    plataforma: 'instagram',
    showWatermark: false,
    fonteCarrossel: 'Inter',
    incluirEncerramento: false,
    carrossel: {
      slides: [
        {
          ordem: 1, tipo: 'capa', arquetipo: 'closing',
          titulo: 'Texto com várias palavras pra testar',
          corpo: 'Outra linha de texto',
          layout: 'centro', tamanho_fonte: 'gigante',
          cor_texto: '#ffffff', fonte_override: 'Anton',
        },
        {
          ordem: 2, tipo: 'conteudo', arquetipo: 'closing',
          titulo: 'Slide 2',
          corpo: 'Conteúdo de teste',
          layout: 'centro', tamanho_fonte: 'medio',
          cor_texto: '#facc15', fonte_override: 'DM Serif Display',
        },
      ],
      paleta: { primaria: '#0a0a14', secundaria: '#facc15', texto: '#ffffff' },
      fonte_sugerida: 'Anton',
      raciocinio: 'Mock teste',
    },
  },
}

test.describe('Editor — features de hoje (visual)', () => {

  test('1. Abrir editor + capturar topbar com SALVAR + safe-area', async ({ page, context }) => {
    await context.addCookies([{ name: 'iara_preview', value: '1', domain: 'iarahubapp.com.br', path: '/' }])
    await context.addCookies([{ name: 'iara_cookie_consent', value: 'accepted', domain: 'iarahubapp.com.br', path: '/' }])
    await page.addInitScript((mock) => {
      try { window.localStorage.setItem('iara:draft:carrossel-v1', JSON.stringify(mock)) } catch {/* */}
    }, CARROSSEL_MOCK)

    await page.goto('/dashboard/carrossel')
    await page.waitForTimeout(2500)

    // Tenta clicar no banner "Personalizar no Editor"
    const editorBtn = page.locator('text=/Personalizar no Editor/i').first()
    if (await editorBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editorBtn.click()
      await page.waitForTimeout(2500)
    }
    await page.screenshot({ path: path.join(SHOTS, '01-editor-topbar.png') })
  })

  test('2. Editor aberto: vê painel CAMADAS quando nada selecionado', async ({ page, context }) => {
    await context.addCookies([
      { name: 'iara_preview', value: '1', domain: 'iarahubapp.com.br', path: '/' },
      { name: 'iara_cookie_consent', value: 'accepted', domain: 'iarahubapp.com.br', path: '/' },
    ])
    await page.addInitScript((mock) => {
      try { window.localStorage.setItem('iara:draft:carrossel-v1', JSON.stringify(mock)) } catch {/* */}
    }, CARROSSEL_MOCK)

    await page.goto('/dashboard/carrossel')
    await page.waitForTimeout(2500)
    const editorBtn = page.locator('text=/Personalizar no Editor/i').first()
    if (await editorBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editorBtn.click()
      await page.waitForTimeout(2500)
    }
    await page.screenshot({ path: path.join(SHOTS, '02-editor-canvas.png') })

    // No mobile o painel Camadas só aparece após user tocar em qualquer lugar
    // (deselect) e depois abrir "Mais" / FAB +. Vou capturar o estado inicial.
    // Procura pelo texto "Camadas" no DOM
    const temCamadas = await page.locator('text=/Camadas \\(/i').first().isVisible({ timeout: 2000 }).catch(() => false)
    console.log('[FEATURE] Painel Camadas visivel inicialmente:', temCamadas)
  })

  test('3. Render manual: aplica cor com execCommand em selecao parcial', async ({ page }) => {
    // Test puro de execCommand pra confirmar que o helper aplicarNoTrechoSelecionado
    // funciona em Chromium iOS UA mode.
    await page.goto('/')
    const result = await page.evaluate(() => {
      const div = document.createElement('div')
      div.contentEditable = 'true'
      div.innerHTML = '<span data-run="1" style="color: #ffffff; font-size: 40px">Texto verde no meio</span>'
      document.body.appendChild(div)
      div.focus()

      // Seleciona "verde" (palavra do meio)
      const range = document.createRange()
      const span = div.firstChild as HTMLElement
      const textNode = span.firstChild as Text
      const idx = textNode.textContent!.indexOf('verde')
      range.setStart(textNode, idx)
      range.setEnd(textNode, idx + 5) // "verde"
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)

      // Aplica cor verde via execCommand
      const ok = document.execCommand('foreColor', false, '#22c55e')

      const html = div.innerHTML
      document.body.removeChild(div)
      return { ok, html }
    })
    console.log('[FEATURE execCommand]', JSON.stringify(result))
  })
})
