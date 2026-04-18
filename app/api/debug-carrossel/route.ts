import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const resultado: Record<string, unknown> = {}

  // 1. Env vars
  const apiKey = process.env.ANTHROPIC_API_KEY
  resultado.anthropic_key_length = apiKey?.length ?? 0
  resultado.anthropic_key_prefix = apiKey?.slice(0, 15) ?? 'MISSING'
  resultado.anthropic_key_suffix = apiKey?.slice(-4) ?? ''
  resultado.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40) ?? 'MISSING'

  // 2. Supabase auth
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    resultado.supabase_user = user ? user.id.slice(0, 8) + '...' : null
    resultado.supabase_auth_error = error?.message ?? null
  } catch (e) {
    resultado.supabase_error = e instanceof Error ? e.message : String(e)
  }

  // 3. Anthropic API call
  try {
    const anthropic = new Anthropic({ apiKey })
    const resp = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Di "OK"' }],
    })
    resultado.anthropic_ok = true
    resultado.anthropic_response = resp.content[0].type === 'text' ? resp.content[0].text : 'non-text'
  } catch (e) {
    resultado.anthropic_ok = false
    resultado.anthropic_error = e instanceof Error ? e.message : String(e)
    resultado.anthropic_error_type = e?.constructor?.name
  }

  return NextResponse.json(resultado)
}
