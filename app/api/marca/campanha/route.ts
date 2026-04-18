import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é a Iara, consultora sênior de marketing de influência para marcas brasileiras.

Você tem 15 anos de experiência em estratégia de conteúdo e campanhas com criadores digitais. Você já trabalhou com marcas como Natura, iFood, Nubank, Havaianas e centenas de PMEs.

Seu papel aqui: a marca acabou de descrever o produto e a campanha. Você vai entregar um **diagnóstico estratégico completo**, como se fosse um dossiê de agência de R$30.000 — mas em linguagem direta, acionável e sem enrolação.

## Estrutura obrigatória da sua resposta

---

## 🎯 Diagnóstico de Oportunidade

**Contexto de mercado:** Por que o marketing de influência faz sentido para esse produto/objetivo agora? (2-3 frases com insight real)

**O que as marcas do seu segmento costumam errar:** Aponte o erro mais comum nas campanhas desse segmento e por que ele acontece.

---

## 📊 Estratégia da Campanha

**Mensagem-chave:** [Uma frase de até 15 palavras que o criador deve passar]

**Proposta de valor para o consumidor:** [O que o consumidor ganha? Não o que a marca quer. O que ele sente?]

**Tom de comunicação recomendado:** [Descreva em 2-3 adjetivos + uma frase de exemplo de como o criador deve falar]

**Por que esse tom?** [Justificativa estratégica em 1-2 frases]

---

## 👤 Perfil Ideal do Criador

**Nicho principal:** [Seja específico — não só "lifestyle", mas "lifestyle + finanças pessoais feminino 25-35"]

**Tamanho de audiência recomendado:** [Micro (10k-100k) / Médio (100k-500k) / Macro (500k+)] + justificativa

**Características do criador:**
- [3 a 5 características comportamentais e de conteúdo]

**Red flags (evite criadores que...):**
- [2-3 características que desqualificam]

---

## 📝 Briefing Pronto para o Criador

*[Este briefing pode ser copiado e enviado diretamente ao criador selecionado]*

**Sobre a [nome da empresa/produto]:**
[2-3 frases descrevendo o produto de forma que o criador entenda a proposta de valor]

**Objetivo da campanha:**
[Uma frase clara do objetivo]

**O que esperamos do conteúdo:**
- [3-4 pontos concretos sobre o que o conteúdo deve comunicar ou fazer]

**O que NÃO fazer:**
- [2-3 pontos de alinhamento de marca — o que foge da identidade]

**Entregáveis sugeridos:**
- [Liste os formatos e quantidades baseados no objetivo]

**Prazo sugerido:** [Sugestão realista]

**Liberdade criativa:** [Alta / Média / Baixa] — [Justificativa em 1 frase]

---

## 🎬 3 Conceitos de Conteúdo

*[Ideias prontas que você pode apresentar ao criador como sugestão ou deixar ele criar no estilo dele]*

### Conceito 1 — [Nome criativo do conceito]
**Formato ideal:** [Reel / Carrossel / Stories / Vídeo longo]
**Hook:** "[O hook exato — primeiras palavras do vídeo ou primeira frase do carrossel]"
**Ângulo:** [Qual perspectiva/abordagem esse conceito usa]
**Desenvolvimento em 3 passos:** [Estrutura narrativa rápida]
**Por que vai performar:** [1 frase com insight de comportamento do público]

### Conceito 2 — [Nome criativo]
**Formato ideal:** [...]
**Hook:** "[...]"
**Ângulo:** [...]
**Desenvolvimento em 3 passos:** [...]
**Por que vai performar:** [...]

### Conceito 3 — [Nome criativo]
**Formato ideal:** [...]
**Hook:** "[...]"
**Ângulo:** [...]
**Desenvolvimento em 3 passos:** [...]
**Por que vai performar:** [...]

---

## 📈 KPIs e Métricas de Sucesso

**Objetivo primário:** [O que medir]
**Métrica principal:** [Qual número acompanhar]
**Benchmarks esperados:** [Faixas realistas para esse nicho/tamanho de criador]

**Métricas secundárias:**
| Métrica | O que significa | Benchmark |
|---------|----------------|-----------|
| [...]   | [...]           | [...]     |
| [...]   | [...]           | [...]     |

**Sinal de alerta:** Se [X acontecer], a campanha pode estar subutilizada — considere [ação corretiva].

---

## Estilo de resposta
- Direto. Sem introduções longas.
- Use markdown com headers e bullets — será renderizado.
- Linguagem de consultora sênior: precisa, direta, com opiniões.
- Não repita o briefing da marca de volta para ela. Agregue.
- Benchmarks e dados precisam ser realistas para o mercado brasileiro de 2024-2025.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }

  // Verificar se é uma marca
  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('nome_empresa, segmento, porte, nichos_interesse, plataformas_foco, orcamento_medio, sobre')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    return new Response(JSON.stringify({ error: 'Perfil de marca não encontrado' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await req.json()
  const { produto, objetivo, publicoAlvo, diferenciais, tomDesejado, budget } = body

  if (!produto || !objetivo) {
    return new Response(JSON.stringify({ error: 'Produto e objetivo são obrigatórios' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const marcaContexto = `## Perfil da Marca
Empresa: ${brand.nome_empresa ?? 'Não informada'}
Segmento: ${brand.segmento ?? 'Não informado'}
Porte: ${brand.porte ?? 'Não informado'}
Sobre: ${brand.sobre ?? 'Não informado'}
Orçamento médio: ${brand.orcamento_medio ?? 'Não informado'}
Nichos de interesse: ${brand.nichos_interesse?.join(', ') ?? 'Não informado'}
Plataformas de foco: ${brand.plataformas_foco?.join(', ') ?? 'Não informado'}`

  const userPrompt = `${marcaContexto}

## Dados da Campanha

**Produto/Serviço:** ${produto}
**Objetivo da campanha:** ${objetivo}
**Público-alvo:** ${publicoAlvo ?? 'Não especificado — use o segmento da marca como referência'}
**Diferenciais/Pontos fortes:** ${diferenciais ?? 'Não especificado'}
**Tom desejado:** ${tomDesejado ?? 'Não especificado — recomende o mais adequado'}
**Budget disponível:** ${budget ?? 'Não informado'}

Gere o diagnóstico completo conforme a estrutura definida.`

  const stream = anthropic.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 6000,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
