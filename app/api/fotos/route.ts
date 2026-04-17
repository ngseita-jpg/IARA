import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/fotos — lista fotos com URLs assinadas (privado)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: rows, error } = await supabase
    .from('user_photos')
    .select('id, storage_path, nome, tamanho_kb, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows || rows.length === 0) return NextResponse.json({ photos: [] })

  // Gera URLs assinadas em lote (válidas por 1 hora)
  const paths = rows.map((r) => r.storage_path)
  const { data: signed, error: signError } = await supabase.storage
    .from('fotos-usuario')
    .createSignedUrls(paths, 3600)

  if (signError) return NextResponse.json({ error: signError.message }, { status: 500 })

  // Mapeia cada foto com sua URL assinada
  const signedMap = Object.fromEntries(
    (signed ?? []).map((s) => [s.path, s.signedUrl])
  )

  const photos = rows.map((r) => ({
    ...r,
    signed_url: signedMap[r.storage_path] ?? null,
  }))

  return NextResponse.json({ photos })
}

// DELETE /api/fotos?id=xxx — remove foto
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 })

  const { data: photo, error: fetchError } = await supabase
    .from('user_photos')
    .select('storage_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !photo) {
    return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })
  }

  // Remove do Storage
  await supabase.storage.from('fotos-usuario').remove([photo.storage_path])

  // Remove do banco
  const { error: deleteError } = await supabase
    .from('user_photos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
