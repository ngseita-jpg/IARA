/**
 * Profissionais liberais — dados de cada nicho pra landing dedicada.
 *
 * Estratégia: cada profissão tem dor distinta, vocabulário próprio e
 * exemplos de conteúdo diferentes. 1 landing genérica converte 1/5 do
 * que landing nichada converte em ads pagos.
 *
 * Adicione novos nichos só preenchendo um objeto aqui — a página
 * /p/[nicho] renderiza automaticamente.
 */

export type NichoPro = {
  slug: string                    // url: /p/dentistas
  nome: string                    // "Dentistas"
  nomeSingular: string            // "dentista"
  emoji: string

  // Hero
  hero: {
    headline: string              // chamada principal (com destaque)
    headlineDestaque: string      // a parte que vai com gradient
    subheadline: string           // 1-2 linhas explicativas
  }

  // Identificação ("você é assim?")
  voceE: string[]                 // 3-5 frases curtas de identificação

  // Dores específicas — 3 cards
  dores: { titulo: string; descricao: string }[]

  // Exemplos de conteúdo que a Iara cria pra essa profissão
  exemplosPosts: { titulo: string; tipo: 'reel' | 'carrossel' | 'story' }[]

  // ROI específico (cifra realista)
  roi: {
    economiaHorasSemana: number    // ex: 8
    economiaReaisMes: number       // ex: 1800
    custoAgenciaMes: number        // ex: 2500 (referência)
  }

  // FAQ específico — 4 perguntas
  faq: { pergunta: string; resposta: string }[]

  // SEO
  seo: {
    title: string
    description: string
  }
}

export const NICHOS_PRO: NichoPro[] = [
  {
    slug: 'dentistas',
    nome: 'Dentistas',
    nomeSingular: 'dentista',
    emoji: '🦷',
    hero: {
      headline: 'Você atende o dia inteiro. A Iara cuida do',
      headlineDestaque: 'marketing do seu consultório',
      subheadline: 'Roteiros, carrosseis e stories profissionais sobre odontologia gerados em segundos — no seu tom, com sua especialidade. Sem agência, sem perder noite editando.',
    },
    voceE: [
      'Cabeças cheias de Botox, lentes, ortodontia — mas posta 1 vez por semana, no chute',
      'Sabe que conteúdo trás paciente, mas não tem tempo nem cabeça',
      'Já contratou agência e pagou caro pra postar foto genérica de banco de imagens',
      'Concorrente do bairro tá bombando no Instagram e você tá ficando pra trás',
    ],
    dores: [
      { titulo: 'Agência custa R$ 2-5k/mês', descricao: 'E ainda assim entrega conteúdo genérico que parece de qualquer dentista. O paciente não sente diferença.' },
      { titulo: 'Você atende 8h+ por dia', descricao: 'Voltar pra casa e abrir Canva é a última coisa que tu quer fazer. O resultado: posta na semana de quando lembra.' },
      { titulo: 'IA genérica não conhece odonto', descricao: 'ChatGPT escreve "consulte um profissional" pra tudo. A Iara conhece protocolo, ética CFO e termos da área.' },
    ],
    exemplosPosts: [
      { titulo: '5 sinais que sua gengiva tá pedindo socorro', tipo: 'carrossel' },
      { titulo: 'Lentes de contato dental: vale a pena ou não?', tipo: 'reel' },
      { titulo: 'Antes/depois de paciente real (com autorização)', tipo: 'story' },
      { titulo: 'Por que clarear dente em casa pode dar errado', tipo: 'carrossel' },
      { titulo: 'O que a Anvisa proíbe na propaganda odonto', tipo: 'reel' },
      { titulo: 'Mitos sobre canal — sem dor não tem cárie?', tipo: 'carrossel' },
    ],
    roi: {
      economiaHorasSemana: 8,
      economiaReaisMes: 2200,
      custoAgenciaMes: 2500,
    },
    faq: [
      { pergunta: 'A Iara conhece terminologia odontológica?', resposta: 'Sim. Ela foi treinada com vocabulário médico e respeita o Código de Ética do CFO. Não inventa diagnóstico nem promete resultado.' },
      { pergunta: 'Posso usar mesmo se sou clínico geral?', resposta: 'Pode. No onboarding você diz sua especialidade (clínico, ortodontia, implante, estética, endodontia, etc) e a Iara adapta tudo.' },
      { pergunta: 'E a regulamentação CFO sobre marketing?', resposta: 'A Iara segue as normas do Conselho Federal de Odontologia: nada de "antes/depois" sem contexto, nada de promessa de resultado, nada de promoção de procedimento estético sem cadastro.' },
      { pergunta: 'Quanto tempo leva pra eu ver resultado?', resposta: 'Conteúdo entra na primeira semana. Engajamento sobe na 3ª-4ª semana de postagem consistente. Pacientes começam a chegar via Instagram em 60-90 dias.' },
    ],
    seo: {
      title: 'Marketing pra Dentistas com IA | Iara Hub',
      description: 'Iara é a IA que escreve conteúdo de Instagram pro seu consultório odonto — sem agência, com ética CFO. 3 dias grátis.',
    },
  },
  {
    slug: 'advogados',
    nome: 'Advogados',
    nomeSingular: 'advogado(a)',
    emoji: '⚖️',
    hero: {
      headline: 'Cliente pesquisa o problema dele no Google. Quem',
      headlineDestaque: 'aparece na frente, fecha',
      subheadline: 'A Iara cria conteúdo jurídico sério (sem captação) — para você atrair causas dentro da OAB, sem pagar agência e sem virar a noite.',
    },
    voceE: [
      'Sabe que conteúdo no Insta/LinkedIn traz cliente — mas não tem fôlego pra postar',
      'Tem medo de "captação ilícita" e fica paralisado',
      'Já viu colega bombando com vídeos de Direito do Consumidor / Trabalhista',
      'Pagou agência e ela escreveu "ENTRE EM CONTATO!!" (era exatamente o que não devia)',
    ],
    dores: [
      { titulo: 'Marketing jurídico tem regra', descricao: 'Provimento OAB 205/2021. A maioria das ferramentas/agências não conhece — você termina apagando posts depois.' },
      { titulo: 'Tempo é sua matéria-prima', descricao: 'Hora gasta em Canva é hora não-faturada. R$ 250/h fora da audiência vira R$ 0 produzindo post.' },
      { titulo: 'IA genérica não conhece OAB', descricao: 'A Iara foi treinada respeitando os limites do marketing jurídico. Sem promessa de resultado, sem "garantimos", sem mercantilização.' },
    ],
    exemplosPosts: [
      { titulo: '5 erros que quase todo CLT comete na demissão', tipo: 'carrossel' },
      { titulo: 'O que a empresa NÃO pode descontar do seu salário', tipo: 'reel' },
      { titulo: 'Pensão alimentícia: como o juiz calcula', tipo: 'carrossel' },
      { titulo: 'Compra de imóvel: 3 cláusulas que protegem você', tipo: 'reel' },
      { titulo: 'Direito do Consumidor — quando dá pra cancelar', tipo: 'carrossel' },
      { titulo: 'O que mudou na reforma trabalhista (resumido)', tipo: 'reel' },
    ],
    roi: {
      economiaHorasSemana: 6,
      economiaReaisMes: 6000,
      custoAgenciaMes: 3500,
    },
    faq: [
      { pergunta: 'A Iara respeita o Provimento 205/2021 da OAB?', resposta: 'Sim. Sem promessa de resultado, sem "ganhei a causa", sem garantia. Foco em informação preventiva/educativa, que é o permitido.' },
      { pergunta: 'Funciona pra todas áreas do direito?', resposta: 'Sim — Trabalhista, Família, Consumidor, Tributário, Empresarial, Penal, Imobiliário, Previdenciário. Você define no onboarding.' },
      { pergunta: 'Vou aparecer "em qualquer lista" de marketing jurídico?', resposta: 'Não. A Iara não é diretório. É só sua ferramenta interna pra gerar conteúdo. Você posta nos seus perfis.' },
      { pergunta: 'Posso citar casos reais?', resposta: 'A Iara nunca cita. E te lembra: caso real só com autorização escrita do cliente, e ainda assim sem dados que identifiquem.' },
    ],
    seo: {
      title: 'Marketing Jurídico com IA | Iara Hub',
      description: 'Conteúdo de Instagram e LinkedIn pra advogados — dentro da OAB, sem captação. 3 dias grátis.',
    },
  },
  {
    slug: 'nutricionistas',
    nome: 'Nutricionistas',
    nomeSingular: 'nutricionista',
    emoji: '🥗',
    hero: {
      headline: 'Influencer fitness sem registro tá faturando. Você,',
      headlineDestaque: 'com CRN, deveria estar na frente',
      subheadline: 'A Iara cria conteúdo nutricional sério, dentro do CFN, no seu tom. Sem promessa milagrosa, sem dieta da moda. Atrai paciente que paga.',
    },
    voceE: [
      'Vê influencer sem CRN vendendo emagrecimento e te dá raiva',
      'Sabe que precisa postar mas não tem tempo (atende o dia todo)',
      'Tem medo de errar e o CFN cair em cima',
      'Quer atrair paciente que valoriza ciência, não promessa',
    ],
    dores: [
      { titulo: 'Conteúdo de nutrição é um campo minado', descricao: 'CFN tem norma estrita. ChatGPT te coloca em risco — a Iara foi calibrada pra respeitar a Resolução CFN 599/2018.' },
      { titulo: 'Concorrência desleal de "fit influencer"', descricao: 'Eles inventam, prometem 10kg em 30 dias, e crescem mais rápido. Você precisa de conteúdo bom O DOBRO de frequente pra reverter isso.' },
      { titulo: 'Você cobra por consulta, não por hora de Canva', descricao: 'Hora produzindo post é hora não atendendo. Iara reduz isso de 1h pra 5 minutos por publicação.' },
    ],
    exemplosPosts: [
      { titulo: 'Por que dieta low carb não é pra todo mundo', tipo: 'carrossel' },
      { titulo: '4 mitos sobre carboidrato que precisam morrer', tipo: 'reel' },
      { titulo: 'O que comer ANTES de treinar (não é banana)', tipo: 'carrossel' },
      { titulo: 'Suplemento sim ou não? Depende disso aqui', tipo: 'reel' },
      { titulo: 'Como ler rótulo de alimento sem cair em armadilha', tipo: 'carrossel' },
      { titulo: 'Detox de fim de semana é mito (assista até o fim)', tipo: 'reel' },
    ],
    roi: {
      economiaHorasSemana: 7,
      economiaReaisMes: 1800,
      custoAgenciaMes: 2200,
    },
    faq: [
      { pergunta: 'Respeita o CFN?', resposta: 'Sim. Sem promessa de emagrecimento em X dias, sem prescrição genérica, sem suplemento sem indicação. Foco em educação alimentar.' },
      { pergunta: 'Posso usar mesmo sendo de área específica (esportiva, clínica, materno-infantil)?', resposta: 'Sim — você define sua área de atuação no onboarding e a Iara adapta tudo.' },
      { pergunta: 'Vou postar receita?', resposta: 'Sim, dá. Mas a Iara também cria conteúdo educativo (mitos, decifrando rótulo, etc) que converte mais que receita pura.' },
      { pergunta: 'Como evitar parecer "mais um nutri"?', resposta: 'No onboarding você descreve sua história e abordagem. A Iara aprende seu tom único — não escreve genérico nem em primeira pessoa do plural.' },
    ],
    seo: {
      title: 'Marketing pra Nutricionistas com IA | Iara Hub',
      description: 'Conteúdo nutricional sério pro Instagram, dentro do CFN. Sem promessa milagrosa, sem dieta da moda. 3 dias grátis.',
    },
  },
  {
    slug: 'psicologos',
    nome: 'Psicólogos',
    nomeSingular: 'psicólogo(a)',
    emoji: '🧠',
    hero: {
      headline: 'Saúde mental tá em alta. Quem produz conteúdo sério',
      headlineDestaque: 'lota a agenda',
      subheadline: 'A Iara cria conteúdo psicoeducativo (sem prometer cura, sem terapia online furada) — dentro da Resolução CFP 11/2018. Atrai paciente certo.',
    },
    voceE: [
      'Vê coach vendendo "cura ansiedade em 7 dias" e te dá taquicardia',
      'Sabe que precisa postar mas tem medo de "pegar mal" perante o CRP',
      'Sua agenda tem buracos e você não sabe atrair quem pode pagar',
      'Já tentou ChatGPT mas escreve genérico demais — paciente não se identifica',
    ],
    dores: [
      { titulo: 'Resolução CFP 11/2018 é restritiva', descricao: 'Não pode prometer cura, não pode mostrar paciente, não pode "seguir tendências" sem técnica. A Iara respeita tudo.' },
      { titulo: 'Concorrência de coach é desleal', descricao: 'Eles vendem solução em 7 dias. Você só pode oferecer processo. Mas conteúdo bom converte quem busca solução verdadeira — e é mais valioso.' },
      { titulo: 'Você é o instrumento do trabalho', descricao: 'Não dá pra delegar produção a alguém que não conhece psicanálise vs TCC vs ACT. A Iara conhece e adapta ao seu approach.' },
    ],
    exemplosPosts: [
      { titulo: '3 mitos sobre ansiedade que pioram tudo', tipo: 'carrossel' },
      { titulo: 'Por que terapia não é "conversa cara"', tipo: 'reel' },
      { titulo: 'Sinais de burnout que você ignora', tipo: 'carrossel' },
      { titulo: 'TCC vs psicanálise: pra quem é cada uma', tipo: 'reel' },
      { titulo: 'Ansiedade x medo: a diferença que ninguém ensina', tipo: 'carrossel' },
      { titulo: 'O que a infância tem a ver com seus relacionamentos', tipo: 'reel' },
    ],
    roi: {
      economiaHorasSemana: 5,
      economiaReaisMes: 2500,
      custoAgenciaMes: 2000,
    },
    faq: [
      { pergunta: 'Respeita CFP/CRP?', resposta: 'Sim. Sem promessa de cura, sem nome/foto de paciente, sem "técnica milagrosa". Conteúdo psicoeducativo dentro do permitido.' },
      { pergunta: 'Funciona pra abordagens diferentes?', resposta: 'Sim — psicanálise, TCC, ACT, gestalt, sistêmica. Você diz no onboarding e a Iara adapta linguagem e referenciais.' },
      { pergunta: 'Posso usar pra grupo (terapia de casal, infantil)?', resposta: 'Pode. Você seleciona seu público no onboarding (adulto, casal, adolescente, infantil) e a Iara escreve adequado.' },
      { pergunta: 'Como falar de assuntos delicados (suicídio, depressão grave)?', resposta: 'A Iara segue as normas da OMS pra abordagem desses temas — fala de prevenção, recursos de ajuda, sem detalhes que possam gatilhar.' },
    ],
    seo: {
      title: 'Marketing pra Psicólogos com IA | Iara Hub',
      description: 'Conteúdo psicoeducativo dentro do CFP. Atrai paciente certo, sem promessa. 3 dias grátis.',
    },
  },
  {
    slug: 'medicos',
    nome: 'Médicos',
    nomeSingular: 'médico(a)',
    emoji: '🩺',
    hero: {
      headline: 'Paciente decide médico no Instagram. Especialista que',
      headlineDestaque: 'não posta, não existe',
      subheadline: 'A Iara cria conteúdo médico dentro do CFM — sem antes/depois, sem promessa, sem "milagre". Posicione sua especialidade.',
    },
    voceE: [
      'É especialista mas concorre com generalista que posta mais',
      'Tem medo do CRM/CFM por causa da Resolução 1.974/2011',
      'Vê dermatologista bombando com receita-sem-receita e fica injuriado',
      'Quer paciente que valoriza ciência, não influencer',
    ],
    dores: [
      { titulo: 'Resolução CFM 1.974/2011 é dura', descricao: 'Sem antes/depois, sem nome de paciente, sem "milagre". A maioria das ferramentas não conhece — a Iara conhece.' },
      { titulo: 'Tempo médico custa caro', descricao: 'Sua hora vale R$ 400-1.500 dependendo da especialidade. Hora produzindo post é hora não atendendo (e não faturando).' },
      { titulo: 'Conteúdo genérico não atrai', descricao: 'Paciente quer ouvir você falando da SUA especialidade — cardio, derma, gineco — não "saúde em geral". Iara segue sua área.' },
    ],
    exemplosPosts: [
      { titulo: 'Quando dor de cabeça vira problema sério', tipo: 'reel' },
      { titulo: 'Sinais de pré-diabetes que ninguém te ensinou', tipo: 'carrossel' },
      { titulo: 'O que é "check-up" e o que NÃO é', tipo: 'carrossel' },
      { titulo: 'Mitos sobre vacina explicados', tipo: 'reel' },
      { titulo: 'Como ler exame de sangue (básico)', tipo: 'carrossel' },
      { titulo: 'Quando ir pro pronto-socorro de verdade', tipo: 'reel' },
    ],
    roi: {
      economiaHorasSemana: 5,
      economiaReaisMes: 4000,
      custoAgenciaMes: 3000,
    },
    faq: [
      { pergunta: 'Respeita Resolução CFM 1.974/2011?', resposta: 'Sim. Sem antes/depois de paciente, sem promessa de cura, sem auto-promoção sensacionalista. Conteúdo educativo, ético.' },
      { pergunta: 'Funciona pra todas especialidades?', resposta: 'Sim — clínica geral, dermato, ginecologia, cardio, ortopedia, pediatria, etc. Você define no onboarding.' },
      { pergunta: 'E o NRP da Anvisa pra estética/dermato?', resposta: 'A Iara conhece e respeita: sem promessa de resultado em procedimento, sem comparativo, sem "antes/depois" mesmo com autorização.' },
      { pergunta: 'Vou aparecer em busca?', resposta: 'A Iara cria SEO básico (hashtags certas, palavras-chave) que ajuda no algoritmo do Instagram/Google. Mas o crescimento depende da consistência das postagens.' },
    ],
    seo: {
      title: 'Marketing Médico com IA | Iara Hub',
      description: 'Conteúdo de Instagram pra médicos especialistas — dentro do CFM, sem promessa. 3 dias grátis.',
    },
  },
  {
    slug: 'personal-trainers',
    nome: 'Personal Trainers',
    nomeSingular: 'personal trainer',
    emoji: '💪',
    hero: {
      headline: 'Você treina aluno na hora do almoço, não no Canva.',
      headlineDestaque: 'Iara posta por você',
      subheadline: 'Conteúdo fitness sério (CREF aprovado) — sem dieta, sem suplemento sem prescrição. Posiciona seu método e enche sua agenda.',
    },
    voceE: [
      'Atende 8-12 alunos/dia e ainda quer postar — não dá conta',
      'Vê influencer sem CREF vendendo método milagroso',
      'Quer aluno que paga R$ 250/sessão, não R$ 50',
      'Pagou agência e te deram foto de halter genérica',
    ],
    dores: [
      { titulo: 'Conteúdo fit é cheio de armadilha', descricao: 'Você não pode prescrever dieta (é nutri), não pode receitar suplemento (é nutri/médico), não pode prometer resultado. A Iara respeita.' },
      { titulo: 'Sua moeda é tempo de aluno', descricao: 'Hora gasta em post é hora não-treinando ninguém. Iara reduz produção de 1h pra 5 min por conteúdo.' },
      { titulo: 'Concorrência só cresce', descricao: 'Quem posta diariamente lota agenda. Você precisa de sistema, não força bruta.' },
    ],
    exemplosPosts: [
      { titulo: '3 erros que travam sua hipertrofia', tipo: 'reel' },
      { titulo: 'Como periodizar treino pra resultado real', tipo: 'carrossel' },
      { titulo: 'Cardio antes ou depois do peso? (depende disso)', tipo: 'reel' },
      { titulo: 'Treino A/B/C/D ainda funciona em 2026?', tipo: 'carrossel' },
      { titulo: 'Por que séries de 12 reps NÃO é regra', tipo: 'reel' },
      { titulo: 'Mobilidade x flexibilidade — não é a mesma coisa', tipo: 'carrossel' },
    ],
    roi: {
      economiaHorasSemana: 6,
      economiaReaisMes: 1500,
      custoAgenciaMes: 1800,
    },
    faq: [
      { pergunta: 'Respeita CREF?', resposta: 'Sim. Foco em treino, biomecânica, fisiologia. Sem prescrever dieta, sem suplemento sem indicação médica/nutri.' },
      { pergunta: 'Funciona pra modalidade específica (musculação, funcional, crossfit, corrida, etc)?', resposta: 'Sim — você define sua especialidade no onboarding.' },
      { pergunta: 'Posso atrair aluno fora da minha cidade?', resposta: 'Pode. Online consultoria é seu mercado também. A Iara escreve pra atrair tanto presencial quanto remoto.' },
      { pergunta: 'Como diferenciar do "fit influencer" sem registro?', resposta: 'Mostre técnica, fundamento, ciência. A Iara escreve no tom de "instrutor sério", não de "vendedor de transformação".' },
    ],
    seo: {
      title: 'Marketing pra Personal Trainer com IA | Iara Hub',
      description: 'Conteúdo fitness profissional, dentro do CREF. Atrai aluno premium. 3 dias grátis.',
    },
  },
  {
    slug: 'arquitetos',
    nome: 'Arquitetos',
    nomeSingular: 'arquiteto(a)',
    emoji: '🏛️',
    hero: {
      headline: 'Cliente bom acha arquiteto no Instagram. Quem',
      headlineDestaque: 'mostra processo, fecha projeto',
      subheadline: 'A Iara cria conteúdo de arquitetura/interiores no seu estilo — sem clichê, sem ser mais um perfil de feed bonitinho. Posiciona seu trabalho.',
    },
    voceE: [
      'Tem trabalho ótimo mas Instagram tá igual ao do colega',
      'Não tem tempo de transformar foto de obra em narrativa',
      'Quer cliente que valoriza projeto, não desconto',
      'Já contratou social media — escreveu legendinha clichê',
    ],
    dores: [
      { titulo: 'Foto bonita não vende', descricao: 'Todo mundo posta foto bonita. O que vende é a HISTÓRIA por trás — desafio, escolha, processo. Iara escreve isso.' },
      { titulo: 'Você não é redator', descricao: 'Mostrar projeto exige texto que vende sem parecer venda. A Iara aprende seu approach (autoral, sustentável, residencial, etc) e escreve nesse tom.' },
      { titulo: 'Cliente bom precisa ver autoridade', descricao: 'Conteúdo educativo (escolha de material, decisões técnicas) atrai 3x mais que foto sem contexto.' },
    ],
    exemplosPosts: [
      { titulo: '5 erros que encarecem reforma sem necessidade', tipo: 'carrossel' },
      { titulo: 'Como pensei a iluminação dessa sala (passo a passo)', tipo: 'reel' },
      { titulo: 'Madeira de demolição: pros e contras reais', tipo: 'carrossel' },
      { titulo: 'Por que cozinha aberta NÃO serve pra todo mundo', tipo: 'reel' },
      { titulo: 'Antes/durante/depois: reforma de R$ 80mil', tipo: 'carrossel' },
      { titulo: 'O detalhe que você não nota mas muda tudo', tipo: 'reel' },
    ],
    roi: {
      economiaHorasSemana: 6,
      economiaReaisMes: 3000,
      custoAgenciaMes: 2500,
    },
    faq: [
      { pergunta: 'Funciona pra arquitetura residencial e comercial?', resposta: 'Sim — você define no onboarding (residencial, comercial, hospitality, varejo, sustentável, etc) e a Iara adapta.' },
      { pergunta: 'Vou postar projeto sem autorização do cliente?', resposta: 'Não. A Iara só cria a narrativa — você decide o que mostrar. Inclusive ela sugere abordagem quando você quer mostrar processo sem revelar cliente.' },
      { pergunta: 'CAU tem regulamentação?', resposta: 'Sim, mas branda — basta ter número CAU visível. A Iara não promete resultado nem usa termos proibidos ("garanto", "milagre").' },
      { pergunta: 'Posso usar pra urbanismo / paisagismo?', resposta: 'Sim — adicione no onboarding como sub-especialidade e a Iara adapta linguagem e referenciais.' },
    ],
    seo: {
      title: 'Marketing pra Arquitetos com IA | Iara Hub',
      description: 'Conteúdo de arquitetura/interiores no seu estilo. Atrai cliente que valoriza projeto. 3 dias grátis.',
    },
  },
  {
    slug: 'corretores',
    nome: 'Corretores de Imóveis',
    nomeSingular: 'corretor(a)',
    emoji: '🔑',
    hero: {
      headline: 'Cliente decide imóvel no celular, não na imobiliária.',
      headlineDestaque: 'Quem posta certo vende',
      subheadline: 'A Iara cria conteúdo imobiliário dentro do CRECI — sem promessa, sem captação ilícita. Posiciona você como autoridade local.',
    },
    voceE: [
      'Tem imóvel bom mas posta foto sem texto vendedor',
      'Vê colega bombando com vídeo "tour pelo apê"',
      'Não tem tempo nem cabeça pra escrever caption boa',
      'Quer cliente que escolhe pelo seu trabalho, não pelo preço',
    ],
    dores: [
      { titulo: 'Foto + "agende sua visita" não vende mais', descricao: 'Cliente quer narrativa: bairro, lifestyle, comparação, decisão. A Iara escreve esse texto que parece de gente, não de robô.' },
      { titulo: 'CRECI tem regra', descricao: 'Sem captação ilícita, sem mentir metragem, sem fingir não ser corretor. A Iara respeita tudo.' },
      { titulo: 'Tempo é proporcional ao número de leads', descricao: 'Hora gasta em post é hora não atendendo lead. Você precisa de sistema que produza 5x mais conteúdo no mesmo tempo.' },
    ],
    exemplosPosts: [
      { titulo: '3 sinais que o imóvel tá supervalorizado', tipo: 'carrossel' },
      { titulo: 'O que ninguém te conta sobre financiamento', tipo: 'reel' },
      { titulo: 'Vila Mariana ou Pinheiros? Comparativo real', tipo: 'carrossel' },
      { titulo: 'Tour pelo apê de R$ 800 mil em SP — vale?', tipo: 'reel' },
      { titulo: 'ITBI, escritura, registro: o que cada um custa', tipo: 'carrossel' },
      { titulo: 'Cláusula que protege quem aluga (e quem aluga)', tipo: 'reel' },
    ],
    roi: {
      economiaHorasSemana: 5,
      economiaReaisMes: 2500,
      custoAgenciaMes: 1800,
    },
    faq: [
      { pergunta: 'Respeita CRECI?', resposta: 'Sim. Sem captação ilícita, sem ocultar dados do imóvel, sem promessa de valorização garantida.' },
      { pergunta: 'Funciona pra mercado de luxo e popular?', resposta: 'Sim — você define seu segmento no onboarding (luxo, médio, popular, comercial, locação) e a Iara adapta tom.' },
      { pergunta: 'Posso usar dentro de imobiliária?', resposta: 'Pode. Conteúdo é seu, perfil é seu. Você se posiciona como corretor com expertise.' },
      { pergunta: 'Vou conseguir crescer sem pagar tráfego?', resposta: 'Conteúdo orgânico bom + consistência crescem. Mas se quiser turbo, tráfego pago em cima de conteúdo bom converte muito mais que sem.' },
    ],
    seo: {
      title: 'Marketing pra Corretores de Imóveis com IA | Iara Hub',
      description: 'Conteúdo imobiliário dentro do CRECI. Atrai cliente que escolhe pelo seu trabalho. 3 dias grátis.',
    },
  },
  {
    slug: 'coaches',
    nome: 'Coaches',
    nomeSingular: 'coach',
    emoji: '🎯',
    hero: {
      headline: 'Mercado de coaching tá saturado.',
      headlineDestaque: 'Quem se posiciona, lota mentoria',
      subheadline: 'A Iara cria conteúdo de coaching com método (sem fórmula mágica, sem "destrava sua mente"). Atrai cliente que paga ticket alto.',
    },
    voceE: [
      'Tem método sério mas tá no mesmo bolo de "coach motivacional"',
      'Sabe que precisa postar — não tem fôlego',
      'Quer cliente que paga R$ 5-15k em mentoria, não R$ 200 em curso',
      'Quer parecer profissional, não guru',
    ],
    dores: [
      { titulo: 'Coaching tá com má fama por causa de "guru"', descricao: 'Pra escapar disso você precisa demonstrar METODOLOGIA. A Iara escreve com fundamento (PNL, OKR, GROW, etc — você escolhe).' },
      { titulo: 'Você é a marca', descricao: 'Não dá pra delegar voz/posicionamento pra agência genérica. A Iara aprende SUA visão de mundo e escreve nesse tom.' },
      { titulo: 'Cliente bom valida método', descricao: 'Quem paga R$ 10k em mentoria quer ver processo, framework, base. Conteúdo educativo bate frase de efeito.' },
    ],
    exemplosPosts: [
      { titulo: '3 perguntas que mudam um plano estratégico', tipo: 'carrossel' },
      { titulo: 'Por que metas SMART não funcionam pra todo mundo', tipo: 'reel' },
      { titulo: 'OKR vs KPI: qual usar e quando', tipo: 'carrossel' },
      { titulo: 'O bias mental que sabota toda decisão grande', tipo: 'reel' },
      { titulo: 'Como dar feedback sem virar inimigo', tipo: 'carrossel' },
      { titulo: 'Liderança em 2026: o que mudou de verdade', tipo: 'reel' },
    ],
    roi: {
      economiaHorasSemana: 7,
      economiaReaisMes: 5000,
      custoAgenciaMes: 2500,
    },
    faq: [
      { pergunta: 'Funciona pra qual tipo de coaching?', resposta: 'Executivo, carreira, vida, saúde, esportivo. Você define sua especialidade no onboarding e a Iara adapta linguagem e referenciais.' },
      { pergunta: 'Vai parecer "mais um coach"?', resposta: 'Não. No onboarding você descreve sua visão, casos reais, abordagem. A Iara aprende isso e escreve no SEU tom — não genérico.' },
      { pergunta: 'Posso citar Federer, Bezos, Naval na piada?', resposta: 'A Iara cita figuras públicas com cuidado (sem inventar fala). Foco maior é nas suas referências teóricas (Drucker, Senge, Goleman, etc).' },
      { pergunta: 'Tem como atrair cliente PJ (mentoria empresarial)?', resposta: 'Sim — no onboarding você define (PF/PJ/misto). Pra PJ a Iara usa linguagem mais técnica e formato LinkedIn-friendly.' },
    ],
    seo: {
      title: 'Marketing pra Coaches com IA | Iara Hub',
      description: 'Conteúdo de coaching com método (sem guru). Atrai cliente premium. 3 dias grátis.',
    },
  },
  {
    slug: 'fisioterapeutas',
    nome: 'Fisioterapeutas',
    nomeSingular: 'fisioterapeuta',
    emoji: '🦴',
    hero: {
      headline: 'Paciente sente dor e googla. Fisio que',
      headlineDestaque: 'aparece primeiro, atende',
      subheadline: 'A Iara cria conteúdo dentro do COFFITO (Resolução 405/2011) — sem promessa de cura, sem "técnica milagrosa". Posiciona sua especialidade.',
    },
    voceE: [
      'Atende paciente o dia todo, posta 1 vez no mês',
      'Vê fisio jovem bombando no Insta com mais ostentação que conteúdo',
      'Quer paciente que paga R$ 200/sessão particular',
      'Não tem cabeça pra escrever caption depois das atendimentos',
    ],
    dores: [
      { titulo: 'COFFITO 405/2011 é específico', descricao: 'Sem promessa de cura, sem mostrar paciente, sem "antes/depois" sem autorização. A Iara conhece e respeita.' },
      { titulo: 'Conteúdo de fisio é técnico', descricao: 'Tem que falar de biomecânica, dor neuropática, articular, sem virar palestra. A Iara achou esse equilíbrio.' },
      { titulo: 'Sua agenda é sua moeda', descricao: 'Hora produzindo post é hora não tratando. Iara reduz pra 5 min por publicação e mantém 4-6 posts/semana.' },
    ],
    exemplosPosts: [
      { titulo: '3 sinais que sua dor é hérnia (não é "torcicolo")', tipo: 'carrossel' },
      { titulo: 'Por que alongar sem aquecer machuca', tipo: 'reel' },
      { titulo: 'Joelho de corredor: o que ninguém te ensina', tipo: 'carrossel' },
      { titulo: 'Quando RPG funciona e quando é dinheiro jogado fora', tipo: 'reel' },
      { titulo: 'Cervicalgia ou enxaqueca? Como diferenciar', tipo: 'carrossel' },
      { titulo: 'Postura no home office em 90 segundos', tipo: 'reel' },
    ],
    roi: {
      economiaHorasSemana: 5,
      economiaReaisMes: 2000,
      custoAgenciaMes: 2000,
    },
    faq: [
      { pergunta: 'Respeita COFFITO/CREFITO?', resposta: 'Sim. Resolução 405/2011: sem promessa, sem mostrar paciente sem autorização, sem técnica fora da prática profissional.' },
      { pergunta: 'Funciona pra todas especialidades?', resposta: 'Sim — ortopédica, esportiva, neuro, respiratória, geriátrica, dermato funcional. Você define no onboarding.' },
      { pergunta: 'Posso atender online (telesaúde)?', resposta: 'Sim, COFFITO autoriza. A Iara escreve conteúdo que fala de presencial e remoto se você atender ambos.' },
      { pergunta: 'Como diferenciar de personal/educador físico?', resposta: 'A Iara separa o que é fisio (reabilitação, dor) de PT (treino, performance). Você fica no seu escopo, sem cruzar linhas.' },
    ],
    seo: {
      title: 'Marketing pra Fisioterapeutas com IA | Iara Hub',
      description: 'Conteúdo dentro do COFFITO. Posiciona sua especialidade fisio. 3 dias grátis.',
    },
  },
]

export function getNicho(slug: string): NichoPro | undefined {
  return NICHOS_PRO.find(n => n.slug === slug)
}
