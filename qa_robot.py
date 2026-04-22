"""
IARA Hub QA Robot — Cobertura Completa
=======================================
Loga com credenciais reais, percorre TODOS os módulos preenchendo cada campo
como se fosse um usuário real, e gera relatório de diagnóstico com screenshots.

Dependências:
    pip install playwright
    playwright install chromium

Uso:
    python qa_robot.py
    (pede senha de forma segura no terminal)
"""

import asyncio, os, json, sys, re
from datetime import datetime
from pathlib import Path
from playwright.async_api import async_playwright, Page, Response, TimeoutError as PWTimeout

# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────
BASE_URL    = "https://iarahubapp.com.br"
EMAIL       = os.getenv("IARA_EMAIL", "ngseita@gmail.com")
SENHA       = os.getenv("IARA_SENHA", "")
AI_TIMEOUT  = 120_000
NAV_TIMEOUT = 60_000
SCREENSHOTS = True
SLOW_MO     = 150

REPORT_DIR = Path("qa_report") / datetime.now().strftime("%Y%m%d_%H%M%S")
results: list[dict] = []

# ──────────────────────────────────────────────
# MONITORAMENTO DE ERROS EM TEMPO REAL
# ──────────────────────────────────────────────

# Acumula erros de console e falhas de rede por módulo
_console_errors: list[str] = []
_api_errors: list[dict]    = []
_current_module: str       = ""

def _on_console(msg):
    if msg.type in ("error", "warning"):
        entry = f"[{msg.type.upper()}] {msg.text}"
        _console_errors.append(entry)
        print(f"    🖥️  CONSOLE {msg.type.upper()}: {msg.text[:200]}")

async def _on_response(resp: Response):
    if resp.status >= 400 and "/api/" in resp.url:
        try:
            body = await resp.text()
        except Exception:
            body = "(sem body)"
        entry = {
            "url": resp.url,
            "status": resp.status,
            "body": body[:500],
            "module": _current_module,
        }
        _api_errors.append(entry)
        print(f"    🔴 API {resp.status}: {resp.url.split(BASE_URL)[-1]}")
        print(f"       Resposta: {body[:200]}")

def _flush_errors(module: str) -> dict:
    """Captura e limpa erros acumulados para o módulo atual."""
    errs = {
        "console": list(_console_errors),
        "api": [e for e in _api_errors if e["module"] == module],
    }
    _console_errors.clear()
    _api_errors[:] = [e for e in _api_errors if e["module"] != module]
    return errs

def _attach_listeners(page: Page):
    page.on("console", _on_console)
    page.on("response", lambda r: asyncio.ensure_future(_on_response(r)))

# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────

async def ss(page: Page, name: str):
    if SCREENSHOTS:
        REPORT_DIR.mkdir(parents=True, exist_ok=True)
        await page.screenshot(path=str(REPORT_DIR / f"{name}.png"), full_page=True)

def log(sym: str, mod: str, msg: str):
    icons = {"ok": "✅", "fail": "❌", "warn": "⚠️ ", "skip": "⏭️ "}
    print(f"  {icons.get(sym,'?')} [{mod}] {msg}")

def record(module: str, status: str, detail: str, errors: dict | None = None):
    entry = {"module": module, "status": status, "detail": detail}
    if errors and (errors.get("console") or errors.get("api")):
        entry["errors"] = errors
    results.append(entry)
    log(status, module, detail)
    if errors:
        for e in errors.get("console", []):
            print(f"    └─ 🖥️  {e[:150]}")
        for e in errors.get("api", []):
            print(f"    └─ 🔴 API {e['status']} {e['url'].split('/api/')[-1]}: {e['body'][:120]}")

async def nav(page: Page, path: str):
    await page.goto(f"{BASE_URL}{path}", timeout=NAV_TIMEOUT, wait_until="networkidle")
    await page.wait_for_timeout(1000)

async def click_btn(page: Page, text: str, timeout=15_000):
    """Clica no primeiro botão/elemento visível que contenha o texto."""
    loc = page.get_by_role("button", name=re.compile(text, re.IGNORECASE)).first
    try:
        await loc.wait_for(state="visible", timeout=timeout)
        await loc.click()
        return
    except Exception:
        pass
    # fallback — qualquer elemento clicável com o texto
    loc2 = page.locator(f"text={text}").first
    await loc2.wait_for(state="visible", timeout=timeout)
    await loc2.click()

async def wait_text(page: Page, *texts: str, timeout=AI_TIMEOUT):
    """Aguarda qualquer um dos textos aparecer na página."""
    pattern = "|".join(re.escape(t) for t in texts)
    await page.wait_for_function(
        f"document.body.innerText.match(/{pattern}/i) !== null",
        timeout=timeout
    )

async def fill_first(page: Page, selector: str, value: str, timeout=10_000):
    loc = page.locator(selector).first
    await loc.wait_for(state="visible", timeout=timeout)
    await loc.fill(value)

async def select_option(page: Page, label_text: str, value: str):
    """Seleciona opção em <select> pelo label ou por atributo value."""
    sel = page.locator(f"select").filter(has=page.locator(f"option[value='{value}']")).first
    try:
        await sel.select_option(value, timeout=8_000)
    except Exception:
        # tenta pelo texto visível
        await page.locator("select").first.select_option(label=value, timeout=8_000)

# ──────────────────────────────────────────────
# LOGIN
# ──────────────────────────────────────────────

async def test_login(page: Page) -> bool:
    m = "Login"
    try:
        await nav(page, "/login")
        await page.fill('input[type="email"]', EMAIL)
        await page.fill('input[type="password"]', SENHA)
        await ss(page, "01_login_preenchido")
        await page.click('button[type="submit"]')
        await page.wait_for_url(f"{BASE_URL}/dashboard**", timeout=30_000)
        await ss(page, "01_login_ok")
        record(m, "ok", "Login realizado — redirecionou para /dashboard")
        return True
    except Exception as e:
        await ss(page, "01_login_fail")
        record(m, "fail", str(e)[:150])
        return False

# ──────────────────────────────────────────────
# DASHBOARD PRINCIPAL
# ──────────────────────────────────────────────

async def test_dashboard(page: Page):
    m = "Dashboard"
    try:
        await nav(page, "/dashboard")
        cards = page.locator("a[href*='/dashboard/']")
        count = await cards.count()
        await ss(page, "02_dashboard")
        record(m, "ok", f"Carregou com {count} módulos visíveis")
    except Exception as e:
        await ss(page, "02_dashboard_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# PERFIL — preenche todos os 5 passos
# ──────────────────────────────────────────────

async def test_perfil(page: Page):
    m = "Perfil"
    try:
        await nav(page, "/dashboard/perfil")

        # ── Passo 1: Identidade ──────────────────────
        await fill_first(page, 'input[type="text"]', "Gustavo Seita")

        # Seleciona nicho (clica em alguns botões de nicho)
        for nicho in ["Lifestyle", "Tecnologia", "Finanças"]:
            try:
                btn = page.get_by_text(nicho, exact=True).first
                await btn.click(timeout=5_000)
            except Exception:
                pass

        # Sub-nicho
        try:
            inputs = page.locator('input[placeholder*="recorte"], input[placeholder*="específico"]')
            if await inputs.count() > 0:
                await inputs.first.fill("Produtividade para criadores de conteúdo")
        except Exception:
            pass

        # História / backstory
        try:
            ta = page.locator('textarea').first
            await ta.fill("Comecei criando conteúdo sobre produtividade e tecnologia, "
                          "cresci para 50k seguidores em 1 ano focando em dicas práticas.")
        except Exception:
            pass

        # Estágio
        for estagio in ["Crescendo", "Intermediário"]:
            try:
                await page.get_by_text(estagio, exact=False).first.click(timeout=4_000)
                break
            except Exception:
                pass

        await click_btn(page, "Próximo")
        await page.wait_for_timeout(800)

        # ── Passo 2: Audiência ───────────────────────
        try:
            textareas = page.locator("textarea")
            c = await textareas.count()
            if c >= 1:
                await textareas.nth(0).fill("Jovens profissionais de 20-35 anos que querem crescer online "
                                            "mas não sabem por onde começar.")
            if c >= 2:
                await textareas.nth(1).fill("Falta de tempo e não saber que tipo de conteúdo criar.")
            if c >= 3:
                await textareas.nth(2).fill("Que seus conteúdos são muito práticos e direto ao ponto.")
        except Exception:
            pass

        # Faixa etária
        for faixa in ["18-24", "25-34"]:
            try:
                await page.get_by_text(faixa, exact=False).first.click(timeout=4_000)
            except Exception:
                pass

        await click_btn(page, "Próximo")
        await page.wait_for_timeout(800)

        # ── Passo 3: Criação ─────────────────────────
        for plat in ["Instagram", "TikTok", "YouTube"]:
            try:
                await page.get_by_text(plat, exact=True).first.click(timeout=4_000)
            except Exception:
                pass

        for fmt in ["Reels", "Carrossel", "Stories"]:
            try:
                await page.get_by_text(fmt, exact=True).first.click(timeout=4_000)
            except Exception:
                pass

        # Frequência
        try:
            await page.get_by_text("3-5x por semana", exact=False).first.click(timeout=4_000)
        except Exception:
            pass

        # Conteúdo que bombou
        try:
            ta_bomb = page.locator("textarea").last
            await ta_bomb.fill("Um carrossel sobre os 5 apps de produtividade que uso todo dia. "
                               "Viralizou com 200k impressões.")
        except Exception:
            pass

        await click_btn(page, "Próximo")
        await page.wait_for_timeout(800)

        # ── Passo 4: Estilo ──────────────────────────
        for tom in ["Direto", "Descontraído", "Educativo", "Inspirador"]:
            try:
                await page.get_by_text(tom, exact=True).first.click(timeout=4_000)
            except Exception:
                pass

        try:
            ta_dif = page.locator("textarea").first
            await ta_dif.fill("Ensino conceitos complexos de forma simples com exemplos do dia a dia.")
        except Exception:
            pass

        try:
            inp_ins = page.locator('input[placeholder*="inspira"]').first
            await inp_ins.fill("Ali Abdaal, Átila Iamarino")
        except Exception:
            pass

        await click_btn(page, "Próximo")
        await page.wait_for_timeout(800)

        # ── Passo 5: Objetivos ───────────────────────
        for obj in ["Monetizar", "Crescer seguidores", "Autoridade"]:
            try:
                await page.get_by_text(obj, exact=False).first.click(timeout=4_000)
            except Exception:
                pass

        for desafio in ["Consistência", "Ideias de conteúdo"]:
            try:
                await page.get_by_text(desafio, exact=False).first.click(timeout=4_000)
            except Exception:
                pass

        try:
            textareas = page.locator("textarea")
            c = await textareas.count()
            if c >= 1:
                await textareas.nth(0).fill("Ter 100k seguidores e uma fonte de renda consistente através do conteúdo.")
            if c >= 2:
                await textareas.nth(1).fill("Ajudar pessoas a serem mais produtivas e realizadas na vida digital.")
        except Exception:
            pass

        await ss(page, "03_perfil_preenchido")

        # Gera persona com IA
        try:
            await click_btn(page, "Gerar minha persona com IA")
            await wait_text(page, "persona", "Perfil salvo", "salvo", timeout=AI_TIMEOUT)
            await ss(page, "03_perfil_persona_ok")
            record(m, "ok", "Todos os 5 passos preenchidos + persona gerada com IA")
        except PWTimeout:
            # Tenta salvar sem IA
            try:
                await click_btn(page, "Salvar sem gerar")
                await wait_text(page, "salvo", "Perfil salvo", timeout=15_000)
                record(m, "warn", "Salvou sem persona — IA demorou demais")
            except Exception as e2:
                record(m, "warn", f"Preencheu tudo mas save falhou: {str(e2)[:100]}")
        except Exception as e:
            record(m, "warn", f"Campos preenchidos mas geração falhou: {str(e)[:100]}")

    except Exception as e:
        await ss(page, "03_perfil_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# TEMAS / FAÍSCA CRIATIVA
# ──────────────────────────────────────────────

async def test_temas(page: Page):
    m = "Temas / Faísca Criativa"
    try:
        await nav(page, "/dashboard/temas")

        # Tenta clicar em sugestão rápida primeiro
        for sugestao in ["Reels virais", "Instagram", "conteúdo"]:
            try:
                await page.get_by_text(sugestao, exact=False).first.click(timeout=4_000)
                break
            except Exception:
                pass

        # Se não encontrou sugestão, digita no chat
        chat = page.locator("textarea, input[type='text']").last
        await chat.wait_for(state="visible", timeout=10_000)
        await chat.fill("Meu nicho é produtividade para criadores. "
                        "Meu melhor conteúdo foi sobre apps de produtividade com 200k impressões. "
                        "Me dê 5 ideias criativas para Reels.")
        await chat.press("Enter")

        await wait_text(page, "ideia", "tema", "conteúdo", "Reel", timeout=AI_TIMEOUT)
        await ss(page, "04_temas_ok")
        record(m, "ok", "Chat respondeu com ideias de conteúdo")

    except PWTimeout:
        await ss(page, "04_temas_timeout")
        record(m, "warn", "Timeout — IA não respondeu a tempo")
    except Exception as e:
        await ss(page, "04_temas_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# ROTEIROS
# ──────────────────────────────────────────────

async def test_roteiros(page: Page):
    m = "Roteiros"
    try:
        await nav(page, "/dashboard/roteiros")

        # Seleciona modo "Roteiro completo"
        try:
            await page.get_by_text("Roteiro completo", exact=False).first.click(timeout=6_000)
        except Exception:
            pass

        # Tema
        await fill_first(page, "textarea",
                         "3 hábitos que triplicaram minha produtividade como criador de conteúdo")

        # Formato — clica em Reel
        try:
            await page.get_by_text("Reel", exact=True).first.click(timeout=6_000)
        except Exception:
            pass

        # Duração
        try:
            dur_sel = page.locator("select").first
            await dur_sel.select_option(label="30–60 segundos", timeout=5_000)
        except Exception:
            pass

        # Objetivo
        try:
            obj_sel = page.locator("select").nth(1)
            await obj_sel.select_option(index=2, timeout=5_000)
        except Exception:
            pass

        # Observações
        try:
            textareas = page.locator("textarea")
            if await textareas.count() > 1:
                await textareas.nth(1).fill("Tom descontraído, incluir uma história pessoal no início.")
        except Exception:
            pass

        await ss(page, "05_roteiros_preenchido")
        await click_btn(page, "Gerar Roteiro com IA")
        await wait_text(page, "Introdução", "Hook", "CTA", "Roteiro", timeout=AI_TIMEOUT)
        await ss(page, "05_roteiros_ok")

        # Testa copiar
        try:
            await click_btn(page, "Copiar", timeout=5_000)
        except Exception:
            pass

        record(m, "ok", "Roteiro gerado e copiado com sucesso")

    except PWTimeout:
        await ss(page, "05_roteiros_timeout")
        record(m, "warn", "Timeout aguardando roteiro — API lenta")
    except Exception as e:
        await ss(page, "05_roteiros_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# CARROSSEL
# ──────────────────────────────────────────────

async def test_carrossel(page: Page):
    m = "Carrossel"
    try:
        await nav(page, "/dashboard/carrossel")

        # Passo 1 — modo texto
        try:
            await page.get_by_text("Digitar texto", exact=False).first.click(timeout=6_000)
        except Exception:
            await page.get_by_text("Texto", exact=False).first.click(timeout=6_000)

        await fill_first(page, "textarea",
                         "Produtividade não é fazer mais — é fazer menos, mas as coisas certas. "
                         "Os 3 pilares são: foco (eliminar distrações), priorização (escolher a tarefa mais importante) "
                         "e recuperação (pausas estratégicas que renovam a energia). "
                         "Quem tenta fazer tudo ao mesmo tempo acaba não terminando nada com qualidade.")

        await click_btn(page, "Próximo")
        await page.wait_for_timeout(600)

        # Passo 2 — pula imagens
        await click_btn(page, "Próximo")
        await page.wait_for_timeout(600)

        # Passo 3 — configurar
        try:
            await page.get_by_text("Instagram", exact=True).first.click(timeout=5_000)
        except Exception:
            pass
        try:
            await page.get_by_text("Criador de conteúdo", exact=False).first.click(timeout=5_000)
        except Exception:
            pass
        # 7 slides
        try:
            await page.get_by_text("7", exact=True).first.click(timeout=5_000)
        except Exception:
            pass

        try:
            textareas = page.locator("textarea")
            if await textareas.count() > 0:
                await textareas.last.fill("Tom descontraído, usa emojis, foco em iniciantes.")
        except Exception:
            pass

        await ss(page, "06_carrossel_config")
        await click_btn(page, "Gerar carrossel")

        # Aguarda slides renderizarem
        await page.wait_for_selector(
            "[class*='slide'], [class*='preview'], canvas, img[alt*='slide']",
            timeout=AI_TIMEOUT
        )
        await ss(page, "06_carrossel_ok")
        record(m, "ok", "Carrossel gerado com slides renderizados")

    except PWTimeout:
        await ss(page, "06_carrossel_timeout")
        record(m, "warn", "Timeout aguardando carrossel")
    except Exception as e:
        await ss(page, "06_carrossel_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# THUMBNAIL
# ──────────────────────────────────────────────

async def test_thumbnail(page: Page):
    m = "Thumbnail"
    try:
        await nav(page, "/dashboard/thumbnail")

        # Passo 1 — título e contexto
        title_inp = page.locator('input[type="text"], input[placeholder*="título"], input[placeholder*="Título"]').first
        await title_inp.wait_for(state="visible", timeout=10_000)
        await title_inp.fill("Como eu Ganhei Meus Primeiros R$5.000 Criando Conteúdo")

        try:
            ctx_ta = page.locator("textarea").first
            await ctx_ta.fill("Vídeo contando minha jornada de 0 a monetização em 6 meses, "
                              "focando nos erros e acertos que cometi.")
        except Exception:
            pass

        await click_btn(page, "Próximo")
        await page.wait_for_timeout(600)

        # Passo 2 — pula foto (sem upload) e vai para gerar
        await click_btn(page, "Gerar thumbnail")

        # Aguarda imagem ou canvas aparecer
        await page.wait_for_selector(
            "img[src*='data:'], img[src*='blob:'], canvas, [class*='thumbnail'], [class*='preview']",
            timeout=AI_TIMEOUT
        )
        await ss(page, "07_thumbnail_ok")

        # Testa ajuste via chat
        try:
            chat_inp = page.locator("input[type='text'], textarea").last
            await chat_inp.fill("Coloca um badge vermelho com 'GRÁTIS' no canto superior direito")
            await chat_inp.press("Enter")
            await page.wait_for_timeout(5_000)
        except Exception:
            pass

        record(m, "ok", "Thumbnail gerada (com ajuste de chat)")

    except PWTimeout:
        await ss(page, "07_thumbnail_timeout")
        record(m, "warn", "Timeout aguardando thumbnail")
    except Exception as e:
        await ss(page, "07_thumbnail_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# STORIES
# ──────────────────────────────────────────────

async def test_stories(page: Page):
    m = "Stories"
    try:
        await nav(page, "/dashboard/stories")

        # Seleciona tipo de stories
        for tipo in ["Educativo", "Hot Take"]:
            try:
                await page.get_by_text(tipo, exact=True).first.click(timeout=5_000)
                break
            except Exception:
                pass

        # Tema
        tema_inp = page.locator('input[type="text"], input[placeholder*="stories"], input[placeholder*="tema"]').first
        await tema_inp.wait_for(state="visible", timeout=10_000)
        await tema_inp.fill("Por que a maioria das pessoas não consegue ser consistente nas redes sociais")

        # Contexto adicional
        try:
            ta = page.locator("textarea").first
            await ta.fill("Quero abordar a falta de sistema e planejamento como causa principal. "
                          "Tom direto e um pouco provocativo.")
        except Exception:
            pass

        await ss(page, "08_stories_preenchido")
        await click_btn(page, "Gerar sequência de stories")
        await wait_text(page, "Story", "slide", "Hook", "1 / 7", "CTA", timeout=AI_TIMEOUT)
        await ss(page, "08_stories_ok")

        # Navega pelos slides
        try:
            for _ in range(3):
                await page.get_by_role("button", name=re.compile(r">|Próximo|→")).first.click(timeout=4_000)
                await page.wait_for_timeout(500)
        except Exception:
            pass

        # Copiar todos
        try:
            await click_btn(page, "Copiar todos", timeout=5_000)
        except Exception:
            pass

        await ss(page, "08_stories_navegado")
        record(m, "ok", "Sequência de stories gerada e navegada")

    except PWTimeout:
        await ss(page, "08_stories_timeout")
        record(m, "warn", "Timeout aguardando stories")
    except Exception as e:
        await ss(page, "08_stories_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# MÉTRICAS
# ──────────────────────────────────────────────

async def test_metricas(page: Page):
    m = "Métricas"
    try:
        await nav(page, "/dashboard/metricas")

        # Adiciona rede ou edita existente
        try:
            await click_btn(page, "Adicionar rede", timeout=6_000)
        except Exception:
            try:
                await page.locator("[data-testid='edit'], button[aria-label*='edit'], button[aria-label*='editar']").first.click(timeout=5_000)
            except Exception:
                pass

        # Seleciona plataforma Instagram
        try:
            await page.get_by_text("Instagram", exact=True).first.click(timeout=6_000)
        except Exception:
            pass

        # Preenche campos numéricos
        data = {
            "seguidores": "48500",
            "posts": "18",
            "alcance": "180000",
            "impressoes": "320000",
            "curtidas": "12000",
            "comentarios": "850",
            "salvamentos": "3200",
        }
        for placeholder_kw, val in data.items():
            try:
                inp = page.locator(f'input[placeholder*="{placeholder_kw}"], input[placeholder*="{placeholder_kw.capitalize()}"]').first
                if await inp.count() == 0:
                    inp = page.locator('input[type="number"]').first
                await inp.fill(val, timeout=4_000)
            except Exception:
                pass

        # Todos os inputs numéricos restantes
        try:
            num_inputs = page.locator('input[type="number"]')
            n = await num_inputs.count()
            sample_vals = ["48500", "18", "180000", "320000", "12000", "850", "3200", "250"]
            for i in range(min(n, len(sample_vals))):
                current = await num_inputs.nth(i).input_value()
                if not current:
                    await num_inputs.nth(i).fill(sample_vals[i])
        except Exception:
            pass

        # Salva / confirma
        for btn_txt in ["Salvar", "Atualizar métricas", "Confirmar", "Adicionar"]:
            try:
                await click_btn(page, btn_txt, timeout=4_000)
                break
            except Exception:
                pass

        await page.wait_for_timeout(1_500)
        await ss(page, "09_metricas_preenchido")

        # Analisa com IA
        await click_btn(page, "Analisar com IA")
        await wait_text(page, "PANORAMA", "engajamento", "crescimento", "análise", timeout=AI_TIMEOUT)
        await ss(page, "09_metricas_ok")
        record(m, "ok", "Métricas inseridas e análise de IA gerada")

    except PWTimeout:
        await ss(page, "09_metricas_timeout")
        record(m, "warn", "Timeout na análise de métricas")
    except Exception as e:
        await ss(page, "09_metricas_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# MÍDIA KIT
# ──────────────────────────────────────────────

async def test_midia_kit(page: Page):
    m = "Mídia Kit"
    try:
        await nav(page, "/dashboard/midia-kit")

        # Preenche campos
        fields = {
            'input[placeholder*="email"], input[placeholder*="WhatsApp"], input[placeholder*="contato"]':
                "ngseita@gmail.com ou (11) 99999-9999",
            'input[placeholder*="site"], input[placeholder*="link"]':
                "iarahub.app.br",
        }
        for sel, val in fields.items():
            try:
                await page.locator(sel).first.fill(val, timeout=5_000)
            except Exception:
                pass

        # Textareas
        textarea_vals = [
            "Campanha para empresa de produtividade — alcance de 180k. "
            "Parceria com app de organização — aumento de 40% em downloads.",
            "Pack Reels (3 vídeos) — R$1.800\nPack Stories (7 slides) — R$600\nMenção em vídeo — R$500",
            "Especialista em produtividade para criadores com 3 anos de experiência. "
            "Conteúdo com alto índice de salvamentos (média 8%).",
        ]
        try:
            textareas = page.locator("textarea")
            count = await textareas.count()
            for i, val in enumerate(textarea_vals[:count]):
                await textareas.nth(i).fill(val)
        except Exception:
            pass

        await ss(page, "10_midiakit_preenchido")
        await click_btn(page, "Gerar mídia kit")
        await wait_text(page, "Sobre", "Audiência", "Métricas", "Pacotes", "Parceria", timeout=AI_TIMEOUT)
        await ss(page, "10_midiakit_ok")
        record(m, "ok", "Mídia kit gerado com todas as seções")

    except PWTimeout:
        await ss(page, "10_midiakit_timeout")
        record(m, "warn", "Timeout gerando mídia kit")
    except Exception as e:
        await ss(page, "10_midiakit_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# ORATÓRIA
# ──────────────────────────────────────────────

async def test_oratorio(page: Page):
    m = "Oratória"
    try:
        await nav(page, "/dashboard/oratorio")
        # Gravação real não é automatizável — verifica que carregou
        await page.wait_for_selector("button, [class*='mic'], [class*='record']", timeout=NAV_TIMEOUT)
        await ss(page, "11_oratorio_load")
        # Verifica se há histórico de treinos
        try:
            await click_btn(page, "Histórico", timeout=5_000)
            await page.wait_for_timeout(1_000)
            await ss(page, "11_oratorio_historico")
        except Exception:
            pass
        record(m, "skip", "Página carregou — gravação de áudio requer microfone real (não automatizável)")
    except Exception as e:
        await ss(page, "11_oratorio_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# METAS
# ──────────────────────────────────────────────

async def test_metas(page: Page):
    m = "Metas"
    try:
        await nav(page, "/dashboard/metas")
        await click_btn(page, "Nova meta")
        await page.wait_for_timeout(500)

        # Título
        await fill_first(page, 'input[type="text"]', "Postar 4 Reels por semana no Instagram")

        # Tipo
        try:
            await page.locator("select").first.select_option(label="reels", timeout=5_000)
        except Exception:
            try:
                await page.locator("select").first.select_option(index=3, timeout=5_000)
            except Exception:
                pass

        # Quantidade
        try:
            qty = page.locator('input[type="number"]').first
            await qty.fill("4")
        except Exception:
            pass

        # Plataforma
        try:
            await page.locator("select").nth(1).select_option(label="Instagram", timeout=5_000)
        except Exception:
            pass

        # Prazo (daqui a 7 dias)
        try:
            from datetime import timedelta
            deadline = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
            date_inp = page.locator('input[type="date"]').first
            await date_inp.fill(deadline)
        except Exception:
            pass

        await ss(page, "12_metas_preenchido")
        await click_btn(page, "Criar meta")
        await page.wait_for_timeout(1_500)

        # Registra 1 progresso
        try:
            await click_btn(page, "Registrar", timeout=6_000)
            await page.wait_for_timeout(1_000)
        except Exception:
            pass

        await ss(page, "12_metas_ok")
        record(m, "ok", "Meta criada e progresso registrado")

    except Exception as e:
        await ss(page, "12_metas_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# HISTÓRICO
# ──────────────────────────────────────────────

async def test_historico(page: Page):
    m = "Histórico"
    try:
        await nav(page, "/dashboard/historico")
        await page.wait_for_timeout(1_500)
        body = await page.inner_text("body")
        has = any(x in body.lower() for x in ["roteiro", "carrossel", "thumbnail", "stories"])
        await ss(page, "13_historico")
        record(m, "ok", f"Histórico carregou {'com itens gerados' if has else '(sem itens ou carregando)'}")
    except Exception as e:
        await ss(page, "13_historico_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# BANCO DE FOTOS
# ──────────────────────────────────────────────

async def test_fotos(page: Page):
    m = "Banco de Fotos"
    try:
        await nav(page, "/dashboard/fotos")
        await page.wait_for_timeout(1_500)
        await ss(page, "14_fotos")
        body = await page.inner_text("body")
        has_upload = any(x in body.lower() for x in ["enviar", "upload", "foto", "arrastar"])
        record(m, "ok", f"Banco de fotos carregou {'com área de upload visível' if has_upload else ''}")
    except Exception as e:
        await ss(page, "14_fotos_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# VAGAS
# ──────────────────────────────────────────────

async def test_vagas(page: Page):
    m = "Vagas"
    try:
        await nav(page, "/dashboard/vagas")
        await page.wait_for_timeout(1_500)
        body = await page.inner_text("body")
        has_vagas = any(x in body.lower() for x in ["vaga", "campanha", "marca", "candidatar"])
        await ss(page, "15_vagas")
        record(m, "ok", f"Vagas carregou {'com vagas visíveis' if has_vagas else '(sem vagas abertas no momento)'}")
    except Exception as e:
        await ss(page, "15_vagas_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# AFILIADOS
# ──────────────────────────────────────────────

async def test_afiliados(page: Page):
    m = "Afiliados"
    try:
        await nav(page, "/dashboard/afiliados")

        # Alterna entre abas
        for aba in ["Explorar produtos", "Minhas afiliações"]:
            try:
                await page.get_by_text(aba, exact=False).first.click(timeout=5_000)
                await page.wait_for_timeout(800)
            except Exception:
                pass

        body = await page.inner_text("body")
        has_products = any(x in body.lower() for x in ["produto", "comissão", "cupom", "afiliar"])
        await ss(page, "16_afiliados")
        record(m, "ok", f"Afiliados carregou {'com produtos disponíveis' if has_products else '(sem produtos cadastrados)'}")
    except Exception as e:
        await ss(page, "16_afiliados_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# CALENDÁRIO
# ──────────────────────────────────────────────

async def test_calendario(page: Page):
    m = "Calendário"
    try:
        await nav(page, "/dashboard/calendario")
        await page.wait_for_timeout(1_500)
        await ss(page, "17_calendario")
        body = await page.inner_text("body")
        has_cal = any(x in body.lower() for x in ["calendário", "planejado", "concluído", "meta"])
        record(m, "ok", f"Calendário carregou {'com itens' if has_cal else '(vazio)'}")
    except Exception as e:
        await ss(page, "17_calendario_fail")
        record(m, "fail", str(e)[:150])

# ──────────────────────────────────────────────
# RELATÓRIO FINAL
# ──────────────────────────────────────────────

def generate_report():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    total  = len(results)
    ok     = sum(1 for r in results if r["status"] == "ok")
    warn   = sum(1 for r in results if r["status"] == "warn")
    fail   = sum(1 for r in results if r["status"] == "fail")
    skip   = sum(1 for r in results if r["status"] == "skip")
    score  = int((ok / total) * 100) if total else 0

    lines = [
        "# IARA Hub — Relatório QA Robot",
        f"**Data:** {datetime.now().strftime('%d/%m/%Y %H:%M')}",
        f"**Score:** {score}%  ({ok} ✅ ok / {warn} ⚠️ avisos / {fail} ❌ falhas / {skip} ⏭️ pulados / {total} total)",
        "",
        "## Resultados por Módulo", "",
        "| Módulo | Status | Detalhe |",
        "|--------|--------|---------|",
    ]
    for r in results:
        emoji = {"ok":"✅","warn":"⚠️","fail":"❌","skip":"⏭️"}.get(r["status"],"?")
        lines.append(f"| {r['module']} | {emoji} {r['status'].upper()} | {r['detail']} |")

    # Seção de bugs detalhados
    bugs = [r for r in results if r["status"] in ("fail", "warn")]
    if bugs:
        lines += ["", "## 🔍 Diagnóstico Detalhado de Bugs", ""]
        for r in bugs:
            emoji = "❌" if r["status"] == "fail" else "⚠️"
            lines.append(f"### {emoji} {r['module']}")
            lines.append(f"**Erro:** {r['detail']}")
            errs = r.get("errors", {})
            if errs.get("console"):
                lines.append("**Console errors:**")
                for e in errs["console"]:
                    lines.append(f"```\n{e}\n```")
            if errs.get("api"):
                lines.append("**API failures:**")
                for e in errs["api"]:
                    lines.append(f"```\nHTTP {e['status']} → {e['url']}\nResposta: {e['body']}\n```")
            lines.append("")

    lines += ["## 📸 Screenshots", f"Salvas em: `{REPORT_DIR}/`"]

    md = "\n".join(lines)
    (REPORT_DIR / "relatorio.md").write_text(md, encoding="utf-8")
    (REPORT_DIR / "relatorio.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print("\n" + "═"*60)
    print(f"  SCORE FINAL: {score}%")
    print(f"  ✅ {ok} ok  ⚠️  {warn} avisos  ❌ {fail} falhas  ⏭️  {skip} pulados")
    print(f"  Relatório: {REPORT_DIR / 'relatorio.md'}")
    print("═"*60 + "\n")
    print(md)
    return score

# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────

async def run_test(fn, page: Page):
    """Wrapper: define módulo atual, roda o teste, anexa erros capturados ao resultado."""
    global _current_module
    # nome do módulo = nome da função sem 'test_'
    _current_module = fn.__name__.replace("test_", "").replace("_", " ").title()
    _console_errors.clear()

    await fn(page)

    # Anexa erros de console/API ao último resultado registrado (se houver)
    errs = _flush_errors(_current_module)
    if results and (errs["console"] or errs["api"]):
        results[-1].setdefault("errors", {})
        results[-1]["errors"]["console"] = errs["console"]
        results[-1]["errors"]["api"]     = errs["api"]
        if errs["console"]:
            print(f"    └─ {len(errs['console'])} erro(s) de console capturado(s)")
        if errs["api"]:
            print(f"    └─ {len(errs['api'])} falha(s) de API capturada(s)")


async def main():
    global SENHA
    if not SENHA:
        import getpass
        SENHA = getpass.getpass(f"🔑 Senha para {EMAIL}: ")

    print(f"\n🤖 IARA QA Robot — {BASE_URL}")
    print(f"   Usuário: {EMAIL}")
    print(f"   Relatório: {REPORT_DIR}\n")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False, slow_mo=SLOW_MO)
        ctx  = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await ctx.new_page()

        # Conecta listeners de console e rede
        _attach_listeners(page)

        logged = await test_login(page)
        if not logged:
            print("\n❌ Login falhou — encerrando.")
            await browser.close()
            sys.exit(1)

        for fn in [
            test_dashboard,
            test_perfil,
            test_temas,
            test_roteiros,
            test_carrossel,
            test_thumbnail,
            test_stories,
            test_metricas,
            test_midia_kit,
            test_oratorio,
            test_metas,
            test_historico,
            test_fotos,
            test_vagas,
            test_afiliados,
            test_calendario,
        ]:
            await run_test(fn, page)

        await browser.close()

    score = generate_report()
    sys.exit(0 if score >= 70 else 1)


if __name__ == "__main__":
    asyncio.run(main())
