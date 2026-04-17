import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/fotos — lista fotos do usuário
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: photos, error } = await supabase
    .from('user_photos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ photos: photos ?? [] })
}

// DELETE /api/fotos?id=xxx — remove foto
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 })

  // Busca a foto para pegar o storage_path
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
