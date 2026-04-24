/**
 * Catálogo de fontes do editor Canvas. Todas carregadas do Google Fonts.
 *
 * Pra renderizar no <canvas>, a fonte precisa estar carregada no documento.
 * Antes de desenhar, chame ensureFontsLoaded(families) que usa document.fonts.load.
 */

export type CategoriaFonte = 'sans' | 'display' | 'serif' | 'script' | 'mono' | 'handwritten'

export type FonteDef = {
  id: string                 // identificador e family CSS (ex: "Inter", "Playfair Display")
  label: string              // nome amigável
  categoria: CategoriaFonte
  weight: number             // peso default a pedir do Google Fonts
  google: string             // fragmento Google Fonts (family=...)
  cssFamily: string          // CSS font-family com fallback
  dica?: string              // 1 palavra sobre vibe
}

export const FONTES: FonteDef[] = [
  // ═══ SANS MODERNO ═══════════════════════════════════════════════
  { id: 'Inter',               label: 'Inter',              categoria: 'sans', weight: 700, google: 'Inter:wght@400;500;600;700;800;900',        cssFamily: 'Inter, system-ui, sans-serif',            dica: 'Clean' },
  { id: 'Poppins',             label: 'Poppins',            categoria: 'sans', weight: 700, google: 'Poppins:wght@400;500;600;700;800;900',      cssFamily: 'Poppins, sans-serif',                     dica: 'Amigável' },
  { id: 'Montserrat',          label: 'Montserrat',         categoria: 'sans', weight: 700, google: 'Montserrat:wght@400;500;600;700;800;900',   cssFamily: 'Montserrat, sans-serif',                  dica: 'Polido' },
  { id: 'Raleway',             label: 'Raleway',            categoria: 'sans', weight: 700, google: 'Raleway:wght@400;500;600;700;800;900',      cssFamily: 'Raleway, sans-serif',                     dica: 'Elegante' },
  { id: 'Manrope',             label: 'Manrope',            categoria: 'sans', weight: 700, google: 'Manrope:wght@400;500;600;700;800',          cssFamily: 'Manrope, sans-serif',                     dica: 'Tech' },
  { id: 'DM Sans',             label: 'DM Sans',            categoria: 'sans', weight: 700, google: 'DM+Sans:wght@400;500;700;900',              cssFamily: '"DM Sans", sans-serif',                   dica: 'Editorial' },
  { id: 'Work Sans',           label: 'Work Sans',          categoria: 'sans', weight: 700, google: 'Work+Sans:wght@400;500;600;700;800',        cssFamily: '"Work Sans", sans-serif',                 dica: 'Pro' },
  { id: 'Plus Jakarta Sans',   label: 'Plus Jakarta',       categoria: 'sans', weight: 700, google: 'Plus+Jakarta+Sans:wght@400;500;700;800',    cssFamily: '"Plus Jakarta Sans", sans-serif',         dica: 'SaaS' },
  { id: 'Outfit',              label: 'Outfit',             categoria: 'sans', weight: 700, google: 'Outfit:wght@400;500;700;800;900',           cssFamily: 'Outfit, sans-serif',                      dica: 'Fashion' },

  // ═══ DISPLAY (IMPACTO) ═══════════════════════════════════════════
  { id: 'Oswald',              label: 'Oswald',             categoria: 'display', weight: 700, google: 'Oswald:wght@500;700',                     cssFamily: 'Oswald, sans-serif',                      dica: 'Esporte' },
  { id: 'Bebas Neue',          label: 'Bebas Neue',         categoria: 'display', weight: 400, google: 'Bebas+Neue',                              cssFamily: '"Bebas Neue", sans-serif',                dica: 'Viral' },
  { id: 'Anton',               label: 'Anton',              categoria: 'display', weight: 400, google: 'Anton',                                   cssFamily: 'Anton, sans-serif',                       dica: 'MrBeast' },
  { id: 'Archivo Black',       label: 'Archivo Black',      categoria: 'display', weight: 400, google: 'Archivo+Black',                           cssFamily: '"Archivo Black", sans-serif',             dica: 'Pesado' },
  { id: 'Teko',                label: 'Teko',               categoria: 'display', weight: 700, google: 'Teko:wght@400;500;700',                   cssFamily: 'Teko, sans-serif',                        dica: 'Técnico' },
  { id: 'Righteous',           label: 'Righteous',          categoria: 'display', weight: 400, google: 'Righteous',                               cssFamily: 'Righteous, sans-serif',                   dica: 'Gaming' },
  { id: 'Bungee',              label: 'Bungee',             categoria: 'display', weight: 400, google: 'Bungee',                                  cssFamily: 'Bungee, sans-serif',                      dica: 'Kids' },
  { id: 'Rubik Mono One',      label: 'Rubik Mono',         categoria: 'display', weight: 400, google: 'Rubik+Mono+One',                          cssFamily: '"Rubik Mono One", monospace',             dica: 'Crypto' },

  // ═══ SERIF CLÁSSICO ═════════════════════════════════════════════
  { id: 'Playfair Display',    label: 'Playfair Display',   categoria: 'serif', weight: 700, google: 'Playfair+Display:wght@400;500;700;800;900', cssFamily: '"Playfair Display", serif',               dica: 'Luxo' },
  { id: 'Merriweather',        label: 'Merriweather',       categoria: 'serif', weight: 700, google: 'Merriweather:wght@400;700;900',            cssFamily: 'Merriweather, serif',                     dica: 'Leitura' },
  { id: 'Lora',                label: 'Lora',               categoria: 'serif', weight: 700, google: 'Lora:wght@400;500;600;700',                 cssFamily: 'Lora, serif',                             dica: 'Sofisticado' },
  { id: 'PT Serif',            label: 'PT Serif',           categoria: 'serif', weight: 700, google: 'PT+Serif:wght@400;700',                     cssFamily: '"PT Serif", serif',                       dica: 'Editorial' },
  { id: 'Libre Baskerville',   label: 'Libre Baskerville',  categoria: 'serif', weight: 700, google: 'Libre+Baskerville:wght@400;700',            cssFamily: '"Libre Baskerville", serif',              dica: 'Tradição' },
  { id: 'Spectral',            label: 'Spectral',           categoria: 'serif', weight: 700, google: 'Spectral:wght@400;500;700;800',             cssFamily: 'Spectral, serif',                         dica: 'Moderno' },
  { id: 'Crimson Text',        label: 'Crimson Text',       categoria: 'serif', weight: 700, google: 'Crimson+Text:wght@400;700',                 cssFamily: '"Crimson Text", serif',                   dica: 'Livro' },
  { id: 'EB Garamond',         label: 'EB Garamond',        categoria: 'serif', weight: 700, google: 'EB+Garamond:wght@400;500;700;800',          cssFamily: '"EB Garamond", serif',                    dica: 'Clássico' },

  // ═══ SERIF DISPLAY ═══════════════════════════════════════════════
  { id: 'Cormorant Garamond',  label: 'Cormorant',          categoria: 'serif', weight: 600, google: 'Cormorant+Garamond:wght@400;500;600;700',   cssFamily: '"Cormorant Garamond", serif',             dica: 'Fashion' },
  { id: 'Abril Fatface',       label: 'Abril Fatface',      categoria: 'serif', weight: 400, google: 'Abril+Fatface',                             cssFamily: '"Abril Fatface", serif',                  dica: 'Revista' },
  { id: 'Cinzel',              label: 'Cinzel',             categoria: 'serif', weight: 700, google: 'Cinzel:wght@400;600;700;900',               cssFamily: 'Cinzel, serif',                           dica: 'Monumental' },
  { id: 'DM Serif Display',    label: 'DM Serif Display',   categoria: 'serif', weight: 400, google: 'DM+Serif+Display',                          cssFamily: '"DM Serif Display", serif',               dica: 'Impacto' },

  // ═══ SCRIPT / CASUAL ═════════════════════════════════════════════
  { id: 'Lobster',             label: 'Lobster',            categoria: 'script', weight: 400, google: 'Lobster',                                  cssFamily: 'Lobster, cursive',                        dica: 'Food' },
  { id: 'Dancing Script',      label: 'Dancing Script',     categoria: 'script', weight: 700, google: 'Dancing+Script:wght@400;700',              cssFamily: '"Dancing Script", cursive',               dica: 'Cursiva' },
  { id: 'Pacifico',            label: 'Pacifico',           categoria: 'script', weight: 400, google: 'Pacifico',                                 cssFamily: 'Pacifico, cursive',                       dica: 'Verão' },
  { id: 'Caveat',              label: 'Caveat',             categoria: 'handwritten', weight: 700, google: 'Caveat:wght@400;700',                 cssFamily: 'Caveat, cursive',                         dica: 'Rabisco' },
  { id: 'Bangers',             label: 'Bangers',            categoria: 'handwritten', weight: 400, google: 'Bangers',                             cssFamily: 'Bangers, cursive',                        dica: 'HQ' },
  { id: 'Permanent Marker',    label: 'Permanent Marker',   categoria: 'handwritten', weight: 400, google: 'Permanent+Marker',                    cssFamily: '"Permanent Marker", cursive',             dica: 'Marker' },
  { id: 'Fredoka One',         label: 'Fredoka One',        categoria: 'handwritten', weight: 400, google: 'Fredoka+One',                         cssFamily: '"Fredoka One", cursive',                  dica: 'Lifestyle' },
  { id: 'Kalam',               label: 'Kalam',              categoria: 'handwritten', weight: 700, google: 'Kalam:wght@400;700',                  cssFamily: 'Kalam, cursive',                          dica: 'Escrita' },

  // ═══ MONO ════════════════════════════════════════════════════════
  { id: 'JetBrains Mono',      label: 'JetBrains Mono',     categoria: 'mono', weight: 700, google: 'JetBrains+Mono:wght@400;500;700',            cssFamily: '"JetBrains Mono", monospace',             dica: 'Dev' },
  { id: 'Space Mono',          label: 'Space Mono',         categoria: 'mono', weight: 700, google: 'Space+Mono:wght@400;700',                    cssFamily: '"Space Mono", monospace',                 dica: 'Retro' },
]

export const CATEGORIAS: Record<CategoriaFonte, string> = {
  sans:         'Sans Moderno',
  display:      'Display / Impacto',
  serif:        'Serif',
  script:       'Script',
  handwritten:  'Manuscrito',
  mono:         'Monoespaçada',
}

/** Retorna a URL do Google Fonts que carrega TODAS as fontes do catálogo em 1 request */
export function buildGoogleFontsUrl(fontes: FonteDef[] = FONTES): string {
  const familyParams = fontes.map(f => `family=${f.google}`).join('&')
  return `https://fonts.googleapis.com/css2?${familyParams}&display=swap`
}

/** Procura uma fonte pelo id; devolve Inter se não encontrar */
export function getFonteById(id: string): FonteDef {
  return FONTES.find(f => f.id === id) ?? FONTES[0]
}

/** Resolve a família CSS com fallback apropriado */
export function cssFamilyFor(id: string): string {
  return getFonteById(id).cssFamily
}

/**
 * Garante que as fontes foram carregadas no navegador antes de desenhar no canvas.
 * Canvas 2D renderiza com fallback silencioso se a fonte ainda não chegou.
 * Chame isso antes de renderSlide2 em qualquer contexto de export.
 */
export async function ensureFontsLoaded(ids: string[], fontSizes: number[] = [20, 40, 80, 140]): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  const jobs: Promise<FontFace[]>[] = []
  const families = Array.from(new Set(ids.map(id => {
    const f = getFonteById(id)
    return f.id
  })))
  for (const family of families) {
    for (const size of fontSizes) {
      for (const weight of [400, 700] as const) {
        jobs.push(document.fonts.load(`${weight} ${size}px "${family}"`))
      }
    }
  }
  try {
    await Promise.all(jobs)
    await document.fonts.ready
  } catch { /* falha silenciosa — fallback funciona */ }
}
