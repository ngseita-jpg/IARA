import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { imagem_base64, nome } = await req.json() as {
    imagem_base64: string
    nome?: string
  }

  if (!imagem_base64) {
    return NextResponse.json({ error: 'Imagem não informada' }, { status: 400 })
  }

  // Converte base64 para buffer
  const matches = imagem_base64.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!matches) {
    return NextResponse.json({ error: 'Formato de imagem inválido' }, { status: 400 })
  }

  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
  const buffer = Buffer.from(matches[2], 'base64')
  const tamanhoKb = Math.round(buffer.byteLength / 1024)

  const fileName = `${Date.now()}.${ext}`
  const storagePath = `${user.id}/${fileName}`

  // Upload para Supabase Storage
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

  // Pega URL pública
  const { data: urlData } = supabase.storage
    .from('fotos-usuario')
    .getPublicUrl(storagePath)

  const publicUrl = urlData.publicUrl

  // Salva metadados no banco
  const { data: photo, error: dbError } = await supabase
    .from('user_photos')
    .insert({
      user_id: user.id,
      storage_path: storagePath,
      public_url: publicUrl,
      nome: nome ?? fileName,
      tamanho_kb: tamanhoKb,
    })
    .select()
    .single()

  if (dbError) {
    // Remove do storage se falhou no banco
    await supabase.storage.from('fotos-usuario').remove([storagePath])
    return NextResponse.json({ error: 'Erro ao salvar metadados' }, { status: 500 })
  }

  return NextResponse.json({ photo })
}
