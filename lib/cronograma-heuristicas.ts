/**
 * Heurísticas de cronograma — tabela curada de horários e locais por nicho.
 * Baseado em dados públicos de engajamento Instagram BR + observação de carrosseis virais.
 *
 * Filosofia: a IA não escolhe horário do nada — escolhe DENTRO destas janelas.
 * Output sempre validado contra essa tabela.
 */

export type HorarioWindow = {
  inicio: string  // 'HH:MM'
  fim: string
  razao?: string
}

export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0=domingo, 6=sábado

// ─── Horários — engajamento Instagram BR por nicho ─────────────────────────
// Maioria dos profissionais liberais segue padrão "almoço + pós-trabalho".
// Fitness/wellness foge: cedo da manhã + final de tarde.
// Lifestyle/entretenimento: noite + final de semana.

export const HORARIOS_BR_INSTAGRAM: Record<string, HorarioWindow[]> = {
  // PROFISSIONAIS LIBERAIS — saúde
  'odontologia':       [{ inicio: '12:00', fim: '13:00', razao: 'almoço' },
                        { inicio: '18:00', fim: '20:00', razao: 'pacientes saindo do trabalho' }],
  'medicina':          [{ inicio: '12:00', fim: '13:00' }, { inicio: '19:00', fim: '21:00' }],
  'nutricao':          [{ inicio: '07:00', fim: '08:30', razao: 'antes do café' },
                        { inicio: '17:30', fim: '19:30' }],
  'psicologia':        [{ inicio: '12:00', fim: '13:30' }, { inicio: '20:00', fim: '22:00', razao: 'reflexão noturna' }],
  'fisioterapia':      [{ inicio: '07:00', fim: '08:30' }, { inicio: '18:00', fim: '20:00' }],
  'esteticista':       [{ inicio: '12:00', fim: '13:30' }, { inicio: '19:00', fim: '21:30' }],
  'dermatologia':      [{ inicio: '12:00', fim: '13:30' }, { inicio: '20:00', fim: '22:00' }],

  // PROFISSIONAIS LIBERAIS — direito/finanças
  'advocacia':         [{ inicio: '12:00', fim: '14:00', razao: 'almoço executivo' },
                        { inicio: '19:00', fim: '21:00' }],
  'contabilidade':     [{ inicio: '12:00', fim: '13:30' }, { inicio: '18:00', fim: '20:00' }],
  'investimentos':     [{ inicio: '07:00', fim: '09:00', razao: 'abertura mercado' },
                        { inicio: '18:00', fim: '20:00', razao: 'pós-fechamento' }],
  'consultoria':       [{ inicio: '07:30', fim: '09:00' }, { inicio: '17:30', fim: '19:30' }],

  // FITNESS/WELLNESS
  'fitness':           [{ inicio: '06:00', fim: '08:00', razao: 'antes do treino' },
                        { inicio: '19:00', fim: '21:00', razao: 'pós-treino' }],
  'crossfit':          [{ inicio: '05:30', fim: '07:00' }, { inicio: '19:00', fim: '21:00' }],
  'yoga':              [{ inicio: '06:00', fim: '07:30' }, { inicio: '20:00', fim: '21:30' }],
  'corrida':           [{ inicio: '05:30', fim: '07:00' }, { inicio: '18:00', fim: '20:00' }],
  'personal':          [{ inicio: '06:00', fim: '08:00' }, { inicio: '18:00', fim: '20:30' }],

  // BEAUTY/MODA
  'beauty':            [{ inicio: '12:00', fim: '13:30' }, { inicio: '20:00', fim: '22:30' }],
  'moda':              [{ inicio: '12:00', fim: '13:30' }, { inicio: '20:00', fim: '23:00' }],
  'maquiagem':         [{ inicio: '12:30', fim: '14:00' }, { inicio: '20:00', fim: '22:30' }],
  'cabelo':            [{ inicio: '12:00', fim: '13:30' }, { inicio: '19:00', fim: '21:30' }],

  // ALIMENTAÇÃO/GASTRONOMIA
  'gastronomia':       [{ inicio: '11:00', fim: '13:00', razao: 'fome de almoço' },
                        { inicio: '18:00', fim: '20:30', razao: 'fome de jantar' }],
  'confeitaria':       [{ inicio: '14:00', fim: '16:00', razao: 'lanche da tarde' },
                        { inicio: '20:00', fim: '22:00' }],
  'cafe':              [{ inicio: '06:30', fim: '09:00' }, { inicio: '14:00', fim: '16:30' }],

  // CRIADORES/MARKETING
  'marketing':         [{ inicio: '08:00', fim: '10:00' }, { inicio: '17:00', fim: '19:00' }],
  'social_media':      [{ inicio: '08:00', fim: '10:00' }, { inicio: '18:00', fim: '20:00' }],
  'copywriting':       [{ inicio: '08:00', fim: '10:00' }, { inicio: '17:00', fim: '19:00' }],
  'design':            [{ inicio: '09:00', fim: '11:00' }, { inicio: '20:00', fim: '22:00' }],

  // EDUCAÇÃO
  'educacao':          [{ inicio: '07:00', fim: '08:30', razao: 'a caminho da aula' },
                        { inicio: '18:30', fim: '21:00', razao: 'estudo noturno' }],
  'concursos':         [{ inicio: '06:00', fim: '08:00' }, { inicio: '19:00', fim: '22:00' }],
  'idiomas':           [{ inicio: '07:00', fim: '08:30' }, { inicio: '20:00', fim: '22:00' }],

  // LIFESTYLE/MATERNIDADE
  'maternidade':       [{ inicio: '09:00', fim: '11:00', razao: 'mãe pós café' },
                        { inicio: '21:00', fim: '23:00', razao: 'depois das crianças dormirem' }],
  'lifestyle':         [{ inicio: '12:00', fim: '13:30' }, { inicio: '20:00', fim: '22:30' }],
  'viagem':            [{ inicio: '12:00', fim: '13:30' }, { inicio: '20:00', fim: '23:00' }],

  // TECH
  'tecnologia':        [{ inicio: '08:00', fim: '10:00' }, { inicio: '20:00', fim: '22:00' }],
  'programacao':       [{ inicio: '08:00', fim: '10:00' }, { inicio: '21:00', fim: '23:30' }],

  // PET
  'pet':               [{ inicio: '07:00', fim: '08:30', razao: 'caminhada matinal' },
                        { inicio: '18:00', fim: '20:00' }],

  '_default':          [{ inicio: '12:00', fim: '13:00' }, { inicio: '19:00', fim: '21:00' }],
}

// ─── Sugestões de local pra vídeo ─────────────────────────────────────────
// Por nicho, qual fundo/local funciona pra dar credibilidade visual.

export const LOCAIS_POR_NICHO: Record<string, string[]> = {
  'odontologia':   ['consultório com cadeira ao fundo desfocada', 'parede branca com diploma visível', 'recepção iluminada'],
  'medicina':      ['consultório clean', 'jaleco branco com fundo neutro', 'área externa do prédio do consultório'],
  'nutricao':      ['cozinha clara com plantas', 'mesa com alimentos coloridos', 'feira ao ar livre'],
  'psicologia':    ['poltrona com luz natural lateral', 'estante de livros desfocada', 'ambiente com plantas'],
  'fisioterapia': ['estúdio com equipamentos ao fundo', 'parede neutra com diploma', 'consultório com maca'],
  'advocacia':     ['escritório com livros ao fundo', 'mesa executiva com terno', 'fórum (área externa permitida)'],
  'contabilidade': ['mesa com calculadora e papéis', 'tela com gráfico ao fundo', 'escritório clean'],
  'investimentos': ['mesa com 2 monitores e gráficos', 'sala home office com vista', 'café com notebook'],
  'fitness':       ['academia com equipamento ao fundo', 'área externa com nascer/pôr do sol', 'studio com espelho'],
  'crossfit':      ['box com equipamentos ao fundo', 'área de treino externa', 'ginásio com luz natural'],
  'beauty':        ['salão com luz ring light suave', 'penteadeira com produtos visíveis', 'parede em cor pastel'],
  'moda':          ['loja com araras ao fundo', 'rua com prédios urbanos', 'closet bem iluminado'],
  'gastronomia':   ['cozinha com bancada limpa', 'restaurante (com permissão)', 'feira/mercado'],
  'marketing':     ['home office clean', 'co-working com plantas', 'mesa de reunião'],
  'design':        ['mesa com setup criativo', 'estúdio com luz natural', 'parede colorida minimalista'],
  'maternidade':   ['quarto da criança com luz suave', 'sala de estar com almofadas', 'parque (vídeos externos)'],
  'tecnologia':    ['setup gamer/dev com 2 monitores', 'mesa minimalista com notebook', 'área de coworking'],
  'pet':           ['parque com pet ao lado', 'sala de estar com pet visível', 'pet shop (com permissão)'],
  '_default':      ['fundo neutro bem iluminado', 'área externa com luz natural', 'home office clean com plantas'],
}

// ─── Sequência narrativa da semana — arquétipo pedagógico ─────────────────
// Cada dia tem um ARQUÉTIPO predefinido pra dar ritmo à semana.
// Mistura formatos pra não cansar o feed do follower.

export const ARQUETIPO_DIA_SEMANA: Record<DiaSemana, {
  arquetipo: string
  formato_sugerido: string
  vibe: string
}> = {
  1: { arquetipo: 'problema_doloroso',  formato_sugerido: 'reel',      vibe: 'Apresenta o erro/dor mais comum do nicho. Hook agressivo.' },         // segunda
  2: { arquetipo: 'dica_acionavel',     formato_sugerido: 'carrossel', vibe: 'Tutorial prático, salvável. 5-7 slides.' },                            // terça
  3: { arquetipo: 'historia_pessoal',   formato_sugerido: 'reel',      vibe: 'Story do criador, vulnerabilidade, conexão emocional.' },             // quarta
  4: { arquetipo: 'case_resultado',     formato_sugerido: 'reel',      vibe: 'Antes/depois ou estudo de caso. Prova social.' },                     // quinta
  5: { arquetipo: 'cta_engajamento',    formato_sugerido: 'post',      vibe: 'Pergunta provocativa pra comentários. Polêmica controlada.' },        // sexta
  6: { arquetipo: 'leve_humano',        formato_sugerido: 'story',     vibe: 'Conteúdo descontraído, bastidor, dia a dia.' },                       // sábado
  0: { arquetipo: 'reflexao_inspiracao', formato_sugerido: 'post',     vibe: 'Frase forte, citação, reflexão pra começar a semana renovado.' },    // domingo
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Normaliza nicho (lowercase, sem acentos) pra match contra a tabela */
function normalizarNicho(nicho: string): string {
  return nicho.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // remove acentos
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
}

/** Procura janelas de horário pro nicho. Faz fallback inteligente. */
export function janelasHorarios(nicho: string | null | undefined): HorarioWindow[] {
  if (!nicho) return HORARIOS_BR_INSTAGRAM._default
  const norm = normalizarNicho(nicho)
  // match exato
  if (HORARIOS_BR_INSTAGRAM[norm]) return HORARIOS_BR_INSTAGRAM[norm]
  // match por palavra-chave (ex: "advogada criminal" → advocacia)
  for (const [chave, janelas] of Object.entries(HORARIOS_BR_INSTAGRAM)) {
    if (chave === '_default') continue
    if (norm.includes(chave) || chave.includes(norm.split('_')[0])) return janelas
  }
  return HORARIOS_BR_INSTAGRAM._default
}

/** Sugere local pro nicho. */
export function sugerirLocais(nicho: string | null | undefined): string[] {
  if (!nicho) return LOCAIS_POR_NICHO._default
  const norm = normalizarNicho(nicho)
  if (LOCAIS_POR_NICHO[norm]) return LOCAIS_POR_NICHO[norm]
  for (const [chave, locais] of Object.entries(LOCAIS_POR_NICHO)) {
    if (chave === '_default') continue
    if (norm.includes(chave)) return locais
  }
  return LOCAIS_POR_NICHO._default
}

/** Pega a SEGUNDA-feira da SEMANA ATUAL (ou hoje se for segunda). YYYY-MM-DD.
 * Use isso pra cronograma que cobre a semana corrente. */
export function inicioSemanaAtual(referencia: Date = new Date()): string {
  const d = new Date(referencia)
  const dia = d.getDay()  // 0=dom, 1=seg, ..., 6=sab
  // Quantos dias VOLTAR ate a segunda dessa semana
  // dom (0) -> volta 6, seg (1) -> 0, ter (2) -> 1, etc
  const diasParaVoltar = dia === 0 ? 6 : dia - 1
  d.setDate(d.getDate() - diasParaVoltar)
  return d.toISOString().slice(0, 10)
}

/** Pega a PROXIMA segunda-feira (sempre futura). Mantido pra retrocompatibilidade. */
export function proximaSegunda(referencia: Date = new Date()): string {
  const d = new Date(referencia)
  const dia = d.getDay()
  const diasAteSegunda = dia === 1 ? 0 : (8 - dia) % 7
  d.setDate(d.getDate() + diasAteSegunda)
  return d.toISOString().slice(0, 10)
}

/** Adiciona N dias a uma data ISO 'YYYY-MM-DD'. */
export function addDias(dataIso: string, n: number): string {
  const d = new Date(dataIso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
