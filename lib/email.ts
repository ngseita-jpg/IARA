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

function base(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{margin:0;padding:0;background:#0a0a14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#d1d1e0}
  .wrap{max-width:520px;margin:40px auto;background:#0d0d1a;border:1px solid #1e1e3a;border-radius:16px;overflow:hidden}
  .header{background:linear-gradient(135deg,#4a2c8a 0%,#2d1a6e 100%);padding:32px 36px}
  .logo{font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px}
  .logo span{color:#C9A84C}
  .body{padding:32px 36px}
  h2{margin:0 0 12px;font-size:20px;font-weight:700;color:#f1f1f8}
  p{margin:0 0 16px;font-size:15px;line-height:1.6;color:#9b9bb5}
  .highlight{color:#f1f1f8}
  .btn{display:inline-block;margin-top:8px;padding:13px 28px;background:#5b3fa0;color:#fff!important;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px}
  .footer{padding:20px 36px;border-top:1px solid #1e1e3a;font-size:12px;color:#3a3a5a;text-align:center}
</style></head>
<body><div class="wrap">
  <div class="header"><div class="logo">Iara <span>Hub</span></div></div>
  <div class="body">${body}</div>
  <div class="footer">© 2026 Iara Hub · <a href="https://iarahubapp.com.br" style="color:#5b3fa0">iarahubapp.com.br</a></div>
</div></body></html>`
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
    <h2>Nova candidatura recebida!</h2>
    <p>O criador <span class="highlight">${creatorNome}</span> se candidatou à sua campanha <span class="highlight">"${vagaTitulo}"</span>.</p>
    ${mensagem ? `<p>Mensagem: <em>"${mensagem}"</em></p>` : ''}
    <p>Acesse o painel para ver o perfil e iniciar uma conversa.</p>
    <a class="btn" href="https://iarahubapp.com.br/marca/dashboard/vagas">Ver candidaturas</a>
  `
  await send(brandEmail, `Nova candidatura: ${vagaTitulo}`, base('Nova candidatura', body))
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
    <h2>A marca quer falar com você!</h2>
    <p>Olá, <span class="highlight">${creatorNome}</span>!</p>
    <p><span class="highlight">${brandNome}</span> iniciou uma conversa com você sobre a campanha <span class="highlight">"${vagaTitulo}"</span>.</p>
    <p>Responda agora para avançar na negociação.</p>
    <a class="btn" href="https://iarahubapp.com.br/dashboard/vagas">Abrir conversa</a>
  `
  await send(creatorEmail, `${brandNome} quer falar com você`, base('Mensagem recebida', body))
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
  const valorFmt = valor ? ` de R$ ${valor.toLocaleString('pt-BR')}` : ''
  const body = `
    <h2>Você recebeu uma proposta!</h2>
    <p>Olá, <span class="highlight">${creatorNome}</span>!</p>
    <p><span class="highlight">${brandNome}</span> enviou uma proposta${valorFmt} para a campanha <span class="highlight">"${vagaTitulo}"</span>.</p>
    <p>Acesse o app para aceitar, recusar ou negociar.</p>
    <a class="btn" href="https://iarahubapp.com.br/dashboard/vagas">Ver proposta</a>
  `
  await send(creatorEmail, `Proposta recebida de ${brandNome}`, base('Nova proposta', body))
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
  const valorFmt = valor ? ` por R$ ${valor.toLocaleString('pt-BR')}` : ''
  const body = `
    <h2>Acordo fechado!</h2>
    <p>Olá, <span class="highlight">${brandNome}</span>!</p>
    <p><span class="highlight">${creatorNome}</span> aceitou a proposta para a campanha <span class="highlight">"${vagaTitulo}"</span>${valorFmt}.</p>
    <p>O acordo está fechado. Acompanhe a entrega pelo painel.</p>
    <a class="btn" href="https://iarahubapp.com.br/marca/dashboard/vagas">Ver campanha</a>
  `
  await send(brandEmail, `Acordo fechado com ${creatorNome}!`, base('Acordo fechado', body))
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
    <h2>Proposta recusada</h2>
    <p>Olá, <span class="highlight">${brandNome}</span>!</p>
    <p><span class="highlight">${creatorNome}</span> recusou a proposta para a campanha <span class="highlight">"${vagaTitulo}"</span>.</p>
    <p>A conversa continua aberta — você pode ajustar os termos e enviar uma nova proposta.</p>
    <a class="btn" href="https://iarahubapp.com.br/marca/dashboard/vagas">Continuar negociação</a>
  `
  await send(brandEmail, `Proposta recusada por ${creatorNome}`, base('Proposta recusada', body))
}
