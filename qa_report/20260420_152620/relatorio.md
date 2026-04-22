# IARA Hub — Relatório QA Robot
**Data:** 20/04/2026 15:32
**Score:** 41% (7 ok / 7 avisos / 3 falhas / 17 total)

## Resultados por Módulo

| Módulo | Status | Detalhe |
|--------|--------|---------|
| Login | ✅ OK | Login realizado com sucesso |
| Dashboard | ❌ FAIL | Page.wait_for_selector: Timeout 60000ms exceeded.
Call log:
  - waiting for locator("a[href*='/dashboard/']") to be visi |
| Roteiros | ⚠️ WARN | Timeout aguardando roteiro — API pode estar lenta |
| Temas / Faísca | ⚠️ WARN | Timeout — resposta do chat demorou demais |
| Thumbnail | ⚠️ WARN | Timeout aguardando thumbnail |
| Carrossel | ⚠️ WARN | Timeout aguardando carrossel |
| Stories | ⚠️ WARN | Timeout aguardando stories |
| Métricas | ⚠️ WARN | Timeout na análise de métricas |
| Mídia Kit | ⚠️ WARN | Timeout no mídia kit |
| Oratória | ❌ FAIL | Page.wait_for_selector: Unexpected token "=" while parsing css selector "button, [class*='record'], [class*='mic'], text |
| Metas | ❌ FAIL | Locator.wait_for: Timeout 10000ms exceeded.
Call log:
  - waiting for get_by_text("Nova meta").first to be visible
 |
| Histórico | ✅ OK | Histórico carregou com itens |
| Perfil | ✅ OK | Perfil carregou |
| Banco de Fotos | ✅ OK | Banco de fotos carregou |
| Vagas | ✅ OK | Vagas carregou |
| Afiliados | ✅ OK | Afiliados carregou |
| Calendário | ✅ OK | Calendário carregou |

## ❌ Falhas que precisam de correção

- **Dashboard**: Page.wait_for_selector: Timeout 60000ms exceeded.
Call log:
  - waiting for locator("a[href*='/dashboard/']") to be visi
- **Oratória**: Page.wait_for_selector: Unexpected token "=" while parsing css selector "button, [class*='record'], [class*='mic'], text
- **Metas**: Locator.wait_for: Timeout 10000ms exceeded.
Call log:
  - waiting for get_by_text("Nova meta").first to be visible


## ⚠️ Avisos (podem ser lentidão ou comportamento esperado)

- **Roteiros**: Timeout aguardando roteiro — API pode estar lenta
- **Temas / Faísca**: Timeout — resposta do chat demorou demais
- **Thumbnail**: Timeout aguardando thumbnail
- **Carrossel**: Timeout aguardando carrossel
- **Stories**: Timeout aguardando stories
- **Métricas**: Timeout na análise de métricas
- **Mídia Kit**: Timeout no mídia kit

## Screenshots
Salvas em `qa_report\20260420_152620/`