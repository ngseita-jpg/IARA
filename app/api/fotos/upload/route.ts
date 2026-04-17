import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { imagem_base64, nome } = await req.json() as {
    imagem_base64: string
    nome?: string
  }

  if (!imagem_base64) {
    return NextResponse.json({ error: 'Imagem não informada' }, { status: 400 })
  }

  // Verificar limite de fotos (conta total no banco, não mensal)
  const { count } = await supabase
    .from('user_photos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { getLimite } = await import('@/lib/limites')
  const limite = getLimite('free', 'fotos') // TODO: ler plano real do perfil quando Stripe for integrado
  if (limite !== null && (count ?? 0) >= limite) {
    return NextResponse.json({
      error: 'limite_atingido',
      mensagem: `Você atingiu o limite de ${limite} fotos no plano Gratuito. Faça upgrade para continuar.`,
      limite,
      usado: count ?? 0,
      plano: 'Gratuito',
    }, { status: 429 })
  }

  const matches = imagem_base64.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!matches) {
    return NextResponse.json({ error: 'Formato de imagem inválido' }, { status: 400 })
  }

  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
  const buffer = Buffer.from(matches[2], 'base64')
  const tamanhoKb = Math.round(buffer.byteLength / 1024)
  const fileName = `${Date.now()}.${ext}`
  const storagePath = `${user.id}/${fileName}`

  // Upload para o bucket privado
  const { error: uploadError } = await supabase.storage
    .from('fotos-usuario')
    .upload(storagePath, buffer, {
      contentType: `image/${matches[1]}`,
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return NextResponse.json({ error: 'Erro ao salvar a foto' }, { status: 500 })
  }

  // Salva metadados (sem URL — gerada sob demanda)
  const { data: photo, error: dbError } = await supabase
    .from('user_photos')
    .insert({
      user_id: user.id,
      storage_path: storagePath,
      nome: nome ?? fileName,
      tamanho_kb: tamanhoKb,
    })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from('fotos-usuario').remove([storagePath])
    return NextResponse.json({ error: 'Erro ao salvar metadados' }, { status: 500 })
  }

  // Gera URL assinada (válida por 1 hora) para exibição imediata
  const { data: signed } = await supabase.storage
    .from('fotos-usuario')
    .createSignedUrl(storagePath, 3600)

  return NextResponse.json({
    photo: { ...photo, signed_url: signed?.signedUrl ?? null },
  })
}
