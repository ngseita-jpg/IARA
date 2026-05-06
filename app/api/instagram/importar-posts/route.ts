import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 30

// SALVAGUARDAS hard-coded:
// 1. Cap de 60 posts por user (suficiente pra detectar padrao + barato)
// 2. Refresh maximo 1x/dia por user (poupa cota Graph API + custo)
// 3. Token expirado -> 410, user precisa reconectar
const HARD_CAP_POSTS = 60
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24h

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

type IgPost = {
  id: string
  permalink?: string
  media_type?: string
  thumbnail_url?: string
  media_url?: string
  caption?: string
  timestamp?: string
  like_count?: number
  comments_count?: number
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // 1. Pega conexao do Instagram
  const { data: conn } = await supabaseAdmin
    .from('social_connections')
    .select('access_token, platform_user_id, token_expires_at, posts_importados_em')
    .eq('user_id', user.id)
    .eq('platform', 'instagram')
    .maybeSingle()

  if (!conn || !conn.access_token || !conn.platform_user_id) {
    return NextResponse.json(
      { error: 'Instagram não conectado. Conecte sua conta primeiro.' },
      { status: 400 },
    )
  }

  // 2. SALVAGUARDA token expirado
  if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'Conexão expirou. Reconecte o Instagram pra importar.', expirado: true },
      { status: 410 },
    )
  }

  // 3. SALVAGUARDA rate limit 1x/dia
  const force = req.nextUrl.searchParams.get('force') === '1'
  if (!force && conn.posts_importados_em) {
    const idade = Date.now() - new Date(conn.posts_importados_em).getTime()
    if (idade < REFRESH_INTERVAL_MS) {
      const horasFalta = Math.ceil((REFRESH_INTERVAL_MS - idade) / (60 * 60 * 1000))
      return NextResponse.json(
        {
          error: `Você importou recentemente. Tente de novo em ${horasFalta}h.`,
          rate_limited: true,
          horas_restantes: horasFalta,
        },
        { status: 429 },
      )
    }
  }

  // 4. Busca posts via Graph API (limite 60 = SALVAGUARDA cota)
  const fields = 'id,permalink,media_type,thumbnail_url,media_url,caption,timestamp,like_count,comments_count'
  const graphUrl = `https://graph.facebook.com/v18.0/${conn.platform_user_id}/media`
    + `?fields=${fields}`
    + `&limit=${HARD_CAP_POSTS}`
    + `&access_token=${encodeURIComponent(conn.access_token)}`

  let postsRaw: IgPost[] = []
  try {
    const res = await fetch(graphUrl, { cache: 'no-store' })
    const data = await res.json()

    if (data.error) {
      // Token invalido / expirado pelo lado do Meta
      if (data.error.code === 190) {
        return NextResponse.json(
          { error: 'Conexão expirou. Reconecte o Instagram.', expirado: true },
          { status: 410 },
        )
      }
      return NextResponse.json(
        { error: `Instagram: ${data.error.message ?? 'falha desconhecida'}` },
        { status: 502 },
      )
    }

    postsRaw = (data.data ?? []).slice(0, HARD_CAP_POSTS)
  } catch {
    return NextResponse.json({ error: 'Falha ao chamar Instagram. Tente em alguns minutos.' }, { status: 502 })
  }

  if (postsRaw.length === 0) {
    return NextResponse.json({ ok: true, importados: 0, msg: 'Nenhum post encontrado na sua conta.' })
  }

  // 5. Upsert no Supabase (ig_post_id é unique por user)
  const rows = postsRaw.map((p) => ({
    user_id: user.id,
    ig_post_id: p.id,
    permalink: p.permalink ?? null,
    media_type: p.media_type ?? null,
    thumbnail_url: p.thumbnail_url ?? p.media_url ?? null,
    caption: p.caption ? p.caption.slice(0, 2000) : null,
    posted_at: p.timestamp ? new Date(p.timestamp).toISOString() : null,
    like_count: p.like_count ?? 0,
    comments_count: p.comments_count ?? 0,
  }))

  const { error: upErr } = await supabaseAdmin
    .from('instagram_posts_user')
    .upsert(rows, { onConflict: 'user_id,ig_post_id' })

  if (upErr) {
    // Tabela nao criada no Supabase ainda
    if (upErr.message?.includes('relation') && upErr.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Setup pendente — tabela instagram_posts_user nao existe. Rode schema_instagram_posts.sql.', setup_pendente: true },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: `Erro ao salvar: ${upErr.message}` }, { status: 500 })
  }

  // 6. Marca timestamp pra rate limit
  await supabaseAdmin
    .from('social_connections')
    .update({ posts_importados_em: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('platform', 'instagram')

  return NextResponse.json({
    ok: true,
    importados: rows.length,
    msg: `${rows.length} posts importados. Próxima importação em 24h.`,
  })
}

// GET = lista posts importados pro user (pra UI mostrar grid)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: posts } = await supabase
    .from('instagram_posts_user')
    .select('id, ig_post_id, permalink, media_type, thumbnail_url, caption, posted_at, like_count, comments_count')
    .eq('user_id', user.id)
    .order('posted_at', { ascending: false, nullsFirst: false })
    .limit(HARD_CAP_POSTS)

  const { data: conn } = await supabase
    .from('social_connections')
    .select('posts_importados_em, token_expires_at, platform_username')
    .eq('user_id', user.id)
    .eq('platform', 'instagram')
    .maybeSingle()

  return NextResponse.json({
    posts: posts ?? [],
    conexao: conn ?? null,
  })
}
