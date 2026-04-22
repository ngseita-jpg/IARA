import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: 'iarahubapp@gmail.com',
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  },
})

const FROM = '"Iara Hub" <iarahubapp@gmail.com>'

function base(preheader: string, body: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Iara Hub</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    body{margin:0;padding:0;background-color:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
    table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}
    img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}
    a{color:#5b3fa0}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f8;">
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f8;">
    <tr><td align="center" style="padding:32px 16px;">

      <!-- Card -->
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#3d2080 0%,#5b3fa0 100%);padding:32px 40px;">
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <!-- Star icon -->
                <td style="vertical-align:middle;padding-right:12px;">
                  <div style="width:40px;height:40px;border-radius:50%;background:#0d0d20;border:1px solid rgba(139,92,246,0.4);display:flex;align-items:center;justify-content:center;text-align:center;line-height:40px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-top:9px;">
                      <defs>
                        <linearGradient id="sg" x1="40%" y1="0%" x2="60%" y2="100%">
                          <stop offset="0%" stop-color="#ddd6fe"/>
                          <stop offset="45%" stop-color="#a78bfa"/>
                          <stop offset="100%" stop-color="#7c3aed"/>
                        </linearGradient>
                      </defs>
                      <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="url(#sg)"/>
                    </svg>
                  </div>
                </td>
                <!-- Wordmark -->
                <td style="vertical-align:middle;">
                  <div style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:0.25em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1;">IARA</div>
                  <div style="font-size:9px;font-weight:600;color:#9b80d4;letter-spacing:0.22em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin-top:4px;">— HUB —</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            ${body}
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr><td style="border-top:1px solid #ebebf0;"></td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px 32px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#9b9bb5;">© 2026 Iara Hub · Todos os direitos reservados</p>
            <p style="margin:0;font-size:13px;color:#9b9bb5;">
              <a href="https://iarahubapp.com.br" style="color:#5b3fa0;text-decoration:none;">iarahubapp.com.br</a>
            </p>
          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td></tr>
  </table>
</body>
</html>`
}

function h1(text: string) {
  return `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0d0d1a;line-height:1.3;">${text}</h1>`
}

function p(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4a4a6a;">${text}</p>`
}

function strong(text: string) {
  return `<strong style="color:#0d0d1a;">${text}</strong>`
}

function btn(href: string, label: string) {
  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:8px;">
      <tr>
        <td style="border-radius:10px;background:#5b3fa0;">
          <a href="${href}" target="_blank"
            style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`
}

function badge(text: string, color = '#5b3fa0') {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${color}18;color:${color};font-size:12px;font-weight:700;letter-spacing:0.3px;">${text}</span>`
}

function quote(text: string) {
  return `
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin:16px 0;">
      <tr>
        <td style="border-left:3px solid #5b3fa0;padding:12px 16px;background:#f8f7ff;border-radius:0 8px 8px 0;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#4a4a6a;font-style:italic;">"${text}"</p>
        </td>
      </tr>
    </table>`
}

async function send(to: string, subject: string, html: string) {
  if (!process.env.GMAIL_REFRESH_TOKEN) return
  try {
    await transporter.sendMail({ from: FROM, to, subject, html })
  } catch {
    // Fire-and-forget — email failures should not break API responses
  }
}

export async function emailNovaCandidatura({
  brandEmail, creatorNome, vagaTitulo, mensagem,
}: {
  brandEmail: string
  creatorNome: string
  vagaTitulo: string
  mensagem?: string | null
}) {
  const body = `
    ${h1('Nova candidatura recebida! 🎉')}
    ${p(`${strong(creatorNome)} se candidatou à sua campanha ${strong('"' + vagaTitulo + '"')}.`)}
    ${mensagem ? `
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#9b9bb5;text-transform:uppercase;letter-spacing:0.5px;">Mensagem do criador</p>
      ${quote(mensagem)}
    ` : ''}
    ${p('Acesse o painel agora para ver o perfil completo do criador e iniciar uma conversa.')}
    ${btn('https://iarahubapp.com.br/marca/dashboard/vagas', 'Ver candidatura →')}
  `
  await send(brandEmail, `🎯 Nova candidatura para "${vagaTitulo}"`, base(`${creatorNome} se candidatou à sua campanha`, body))
}

export async function emailConversaIniciada({
  creatorEmail, creatorNome, brandNome, vagaTitulo,
}: {
  creatorEmail: string
  creatorNome: string
  brandNome: string
  vagaTitulo: string
}) {
  const body = `
    ${h1('Uma marca quer falar com você! 💬')}
    ${p(`Olá, ${strong(creatorNome)}!`)}
    ${p(`${strong(brandNome)} viu sua candidatura para a campanha ${strong('"' + vagaTitulo + '"')} e quer iniciar uma conversa com você.`)}
    ${p('Responda agora para avançar na negociação e fechar o acordo dentro do app.')}
    ${btn('https://iarahubapp.com.br/dashboard/vagas', 'Abrir conversa →')}
  `
  await send(creatorEmail, `💬 ${brandNome} quer falar com você`, base(`${brandNome} iniciou uma conversa sobre "${vagaTitulo}"`, body))
}

export async function emailPropostaEnviada({
  creatorEmail, creatorNome, brandNome, vagaTitulo, valor,
}: {
  creatorEmail: string
  creatorNome: string
  brandNome: string
  vagaTitulo: string
  valor?: number | null
}) {
  const valorFmt = valor
    ? `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : null

  const body = `
    ${h1('Você recebeu uma proposta! 💰')}
    ${p(`Olá, ${strong(creatorNome)}!`)}
    ${p(`${strong(brandNome)} enviou uma proposta de parceria para a campanha ${strong('"' + vagaTitulo + '"')}.`)}
    ${valorFmt ? `
      <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin:16px 0;">
        <tr>
          <td style="background:#f0ebff;border-radius:12px;padding:20px 24px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#5b3fa0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Valor proposto</p>
            <p style="margin:0;font-size:32px;font-weight:800;color:#3d2080;">${valorFmt}</p>
          </td>
        </tr>
      </table>
    ` : ''}
    ${p('Acesse o app para aceitar, recusar ou continuar negociando.')}
    ${btn('https://iarahubapp.com.br/dashboard/vagas', 'Ver proposta →')}
  `
  await send(creatorEmail, `💰 Proposta de ${brandNome}: ${valorFmt ?? vagaTitulo}`, base(`${brandNome} enviou uma proposta para "${vagaTitulo}"`, body))
}

export async function emailPropostaAceita({
  brandEmail, brandNome, creatorNome, vagaTitulo, valor,
}: {
  brandEmail: string
  brandNome: string
  creatorNome: string
  vagaTitulo: string
  valor?: number | null
}) {
  const valorFmt = valor
    ? `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : null

  const body = `
    ${h1('Acordo fechado! ✅')}
    ${p(`Olá, ${strong(brandNome)}!`)}
    ${p(`${strong(creatorNome)} aceitou sua proposta para a campanha ${strong('"' + vagaTitulo + '"')}.`)}
    ${valorFmt ? `
      <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin:16px 0;">
        <tr>
          <td style="background:#f0fff4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Valor acordado</p>
            <p style="margin:0;font-size:32px;font-weight:800;color:#15803d;">${valorFmt}</p>
          </td>
        </tr>
      </table>
    ` : ''}
    ${p('O acordo está registrado na plataforma. Acompanhe a entrega pelo painel.')}
    ${btn('https://iarahubapp.com.br/marca/dashboard/vagas', 'Ver campanha →')}
  `
  await send(brandEmail, `✅ Acordo fechado com ${creatorNome}!`, base(`${creatorNome} aceitou a proposta para "${vagaTitulo}"`, body))
}

export async function emailBoasVindasPago({
  userEmail, userNome, plano,
}: {
  userEmail: string
  userNome: string | null
  plano: 'plus' | 'premium' | 'profissional'
}) {
  const PLANO_INFO: Record<string, { label: string; preco: string; cor: string; destaque: string }> = {
    plus:         { label: 'Plus',         preco: 'R$ 49,90/mês',  cor: '#6366f1', destaque: '10 roteiros, 7 carrosseis, 7 thumbnails e muito mais por mês' },
    premium:      { label: 'Premium',      preco: 'R$ 89,00/mês',  cor: '#a855f7', destaque: '20 roteiros, 18 carrosseis, métricas com IA e suporte prioritário' },
    profissional: { label: 'Profissional', preco: 'R$ 179,90/mês', cor: '#10b981', destaque: 'Tudo ilimitado, acesso antecipado a novos módulos e suporte VIP' },
  }
  const info = PLANO_INFO[plano]
  const nome = userNome?.split(' ')[0] || 'Criador'

  const body = `
    ${h1(`Bem-vindo ao Iara ${info.label}! 🎉`)}
    ${p(`Olá, ${strong(nome)}!`)}
    ${p(`Seu pagamento foi confirmado e seu acesso ao ${strong('Plano ' + info.label)} já está ativo. A partir de agora, você tem ${info.destaque}.`)}
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin:20px 0;">
      <tr>
        <td style="background:linear-gradient(135deg,${info.cor}15,${info.cor}08);border:1px solid ${info.cor}30;border-radius:12px;padding:20px 24px;text-align:center;">
          <p style="margin:0 0 6px;font-size:13px;color:${info.cor};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Plano ativo</p>
          <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#0d0d1a;">Iara ${info.label}</p>
          <p style="margin:0;font-size:14px;color:#6b6b8a;">${info.preco}</p>
        </td>
      </tr>
    </table>
    ${p(strong('Dicas para começar com o pé direito:'))}
    <ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.8;color:#4a4a6a;">
      <li>Configure sua <strong style="color:#0d0d1a;">Persona IA</strong> para a Iara aprender sua voz e nicho</li>
      <li>Use a <strong style="color:#0d0d1a;">Faísca Criativa</strong> para destravar as primeiras ideias</li>
      <li>Gere seu primeiro <strong style="color:#0d0d1a;">roteiro ou carrossel</strong> e sinta a diferença</li>
      <li>Configure <strong style="color:#0d0d1a;">Metas</strong> e ative a gamificação — consistência vira hábito</li>
    </ul>
    ${p('Qualquer dúvida, é só responder este email. Estamos aqui para te ajudar a crescer.')}
    ${btn('https://iarahubapp.com.br/dashboard', 'Acessar minha conta →')}
  `
  await send(userEmail, `🎉 Bem-vindo ao Iara ${info.label}!`, base(`Seu plano ${info.label} está ativo — comece agora`, body))
}

export async function emailTicketNovoAdmin({
  ticketId, userEmail, userNome, categoria, assunto, mensagem, userPlano,
}: {
  ticketId: number
  userEmail: string
  userNome?: string | null
  categoria: string
  assunto: string
  mensagem: string
  userPlano?: string | null
}) {
  const CAT_LABEL: Record<string, string> = {
    conta: 'Conta', pagamento: 'Pagamento', modulo: 'Módulo / Feature',
    bug: 'Bug', sugestao: 'Sugestão', outro: 'Outro',
  }
  const body = `
    ${h1(`Novo ticket de suporte · #${ticketId}`)}
    ${p(`${strong(userNome || userEmail)} abriu um chamado na categoria ${strong(CAT_LABEL[categoria] || categoria)}.`)}
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#9b9bb5;text-transform:uppercase;letter-spacing:0.5px;">Assunto</p>
    ${p(strong(assunto))}
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#9b9bb5;text-transform:uppercase;letter-spacing:0.5px;">Mensagem</p>
    ${quote(mensagem)}
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin:16px 0;">
      <tr>
        <td style="background:#f8f7ff;border-radius:10px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#4a4a6a;"><strong>Email:</strong> ${userEmail}</p>
          ${userPlano ? `<p style="margin:6px 0 0;font-size:13px;color:#4a4a6a;"><strong>Plano:</strong> ${userPlano}</p>` : ''}
          <p style="margin:6px 0 0;font-size:13px;color:#4a4a6a;"><strong>Ticket ID:</strong> #${ticketId}</p>
        </td>
      </tr>
    </table>
    ${btn('https://supabase.com/dashboard/project/_/editor', 'Abrir Supabase →')}
  `
  await send('ngseita@gmail.com', `[SAC] #${ticketId} · ${assunto}`, base(`Novo ticket de ${userNome || userEmail}`, body))
}

export async function emailTicketRespondidoUsuario({
  userEmail, userNome, assunto, resposta,
}: {
  userEmail: string
  userNome?: string | null
  assunto: string
  resposta: string
}) {
  const nome = userNome?.split(' ')[0] || 'Criador'
  const body = `
    ${h1('Resposta ao seu ticket ✉️')}
    ${p(`Olá, ${strong(nome)}!`)}
    ${p(`Recebemos seu ticket ${strong('"' + assunto + '"')} e aqui está nossa resposta:`)}
    ${quote(resposta)}
    ${p('Se ainda tiver dúvidas, é só responder este email ou abrir outro ticket pela área de Ajuda.')}
    ${btn('https://iarahubapp.com.br/dashboard/ajuda', 'Acessar Ajuda →')}
  `
  await send(userEmail, `Resposta ao seu ticket: ${assunto}`, base(`Sua dúvida sobre "${assunto}" foi respondida`, body))
}

export async function emailPropostaRecusada({
  brandEmail, brandNome, creatorNome, vagaTitulo,
}: {
  brandEmail: string
  brandNome: string
  creatorNome: string
  vagaTitulo: string
}) {
  const body = `
    ${h1('Proposta recusada')}
    ${p(`Olá, ${strong(brandNome)}!`)}
    ${p(`${strong(creatorNome)} recusou a proposta para a campanha ${strong('"' + vagaTitulo + '"')}.`)}
    ${p('Não desanime — a conversa continua aberta. Você pode ajustar os termos e enviar uma nova proposta com um valor diferente.')}
    ${btn('https://iarahubapp.com.br/marca/dashboard/vagas', 'Continuar negociação →')}
  `
  await send(brandEmail, `Proposta recusada por ${creatorNome}`, base(`${creatorNome} recusou a proposta para "${vagaTitulo}"`, body))
}
