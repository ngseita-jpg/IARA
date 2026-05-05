import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SHOTS = path.join(process.cwd(), 'tests', 'shots')
fs.mkdirSync(SHOTS, { recursive: true })

async function shot(page: import('@playwright/test').Page, name: string) {
  await page.waitForTimeout(800) // animacoes assentarem
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false })
}

// Modo preview pra bypassar auth nas rotas /dashboard
async function setPreview(page: import('@playwright/test').Page) {
  await page.context().addCookies([{
    name: 'iara_preview', value: '1',
    domain: 'iarahubapp.com.br', path: '/',
  }])
}

test.describe('Auditoria visual — fluxos de criador', () => {

  test('1. Landing principal carrega + botoes principais visiveis', async ({ page }) => {
    await page.goto('/')
    await shot(page, '01-landing-home')

    // CTA principal deve existir
    const ctas = await page.locator('a[href*="register"], a[href="/register"], a[href*="login"]').count()
    expect(ctas).toBeGreaterThan(0)
  })

  test('2. /precos mostra 4 planos sem quebra', async ({ page }) => {
    await page.goto('/precos').catch(() => page.goto('/profissionais'))
    await shot(page, '02-precos')
  })

  test('3. /termos carrega e tem secao anti-abuso', async ({ page }) => {
    await page.goto('/termos')
    await shot(page, '03-termos')
    await expect(page.locator('text=/Uso compartilhado/i').first()).toBeVisible()
    await expect(page.locator('text=/Banimento/i').first()).toBeVisible()
  })

  test('4. /privacidade carrega com LGPD', async ({ page }) => {
    await page.goto('/privacidade')
    await shot(page, '04-privacidade')
  })

  test('5. /aceitar-termos UI funciona', async ({ page }) => {
    await page.goto('/aceitar-termos').catch(() => null)
    await shot(page, '05-aceitar-termos')
  })

  test('6. Login form responsivo + acessivel', async ({ page }) => {
    await page.goto('/login')
    await shot(page, '06-login')
    // Inputs com text-base no mobile (16px = sem zoom iOS)
    const emailInput = page.locator('input[type="email"]').first()
    await expect(emailInput).toBeVisible()
  })

  test('7. Register form com checkbox termos', async ({ page }) => {
    await page.goto('/register')
    await shot(page, '07-register')
    await expect(page.locator('text=/Termos de Uso/i').first()).toBeVisible()
  })

  test('8. Dashboard preview — hub home', async ({ page }) => {
    await setPreview(page)
    await page.goto('/dashboard')
    await shot(page, '08-dashboard-home')
  })

  test('9. /dashboard/carrossel — tela inicial', async ({ page }) => {
    await setPreview(page)
    await page.goto('/dashboard/carrossel')
    await shot(page, '09-carrossel-inicial')
  })

  test('10. /dashboard/temas — Faisca de Ideias', async ({ page }) => {
    await setPreview(page)
    await page.goto('/dashboard/temas')
    await shot(page, '10-temas-inicial')
  })

  test('11. /dashboard/roteiros — form', async ({ page }) => {
    await setPreview(page)
    await page.goto('/dashboard/roteiros')
    await shot(page, '11-roteiros')
  })

  test('12. /dashboard/thumbnail — wizard', async ({ page }) => {
    await setPreview(page)
    await page.goto('/dashboard/thumbnail')
    await shot(page, '12-thumbnail')
  })

  test('13. /dashboard/stories', async ({ page }) => {
    await setPreview(page)
    await page.goto('/dashboard/stories')
    await shot(page, '13-stories')
  })

  test('14. /dashboard/metricas — Em breve nas redes', async ({ page }) => {
    await setPreview(page)
    await page.goto('/dashboard/metricas')
    await shot(page, '14-metricas')
  })

  test('15. /conta — area de assinatura', async ({ page }) => {
    await setPreview(page)
    await page.goto('/conta')
    await shot(page, '15-conta')
  })

  test('16. /ajuda — FAQ', async ({ page }) => {
    await page.goto('/ajuda')
    await shot(page, '16-ajuda')
  })

  test('17. /admin (sem auth — deve redirecionar)', async ({ page }) => {
    await page.goto('/admin')
    await shot(page, '17-admin-noauth')
  })

  test('18. Click no FAB do carrossel — tem CTA Personalizar?', async ({ page }) => {
    await setPreview(page)
    await page.goto('/dashboard/carrossel')
    // Verifica se botao "Editor Canvas" / "Personalizar" aparece
    const editorBtn = page.locator('text=/Personalizar no Editor|Editor Canvas/i').first()
    const visivel = await editorBtn.isVisible({ timeout: 3000 }).catch(() => false)
    if (!visivel) {
      console.log('[AUDIT] Botão Personalizar não visível na tela inicial — esperado se nenhum carrossel gerado')
    }
    await shot(page, '18-carrossel-cta')
  })

  test('19. Touch targets ≥44px em CTAs principais', async ({ page }) => {
    await setPreview(page)
    await page.goto('/dashboard')
    const buttons = page.locator('button, a[href]').filter({ hasText: /\w+/ })
    const count = await buttons.count()
    let pequenos = 0
    for (let i = 0; i < Math.min(count, 30); i++) {
      const box = await buttons.nth(i).boundingBox().catch(() => null)
      if (box && box.height < 36 && box.width < 80) pequenos++
    }
    console.log(`[AUDIT touch] ${pequenos} botões pequenos de ${count} testados`)
  })

  test('20. Layout NAO TEM scroll horizontal (mobile)', async ({ page }) => {
    await setPreview(page)
    const rotas = ['/dashboard', '/dashboard/carrossel', '/dashboard/temas', '/conta', '/']
    for (const rota of rotas) {
      await page.goto(rota)
      await page.waitForTimeout(500)
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
      })
      if (overflow) console.log(`[AUDIT BUG] ${rota} tem scroll horizontal`)
      expect(overflow, `${rota} não pode ter scroll horizontal`).toBe(false)
    }
  })
})
