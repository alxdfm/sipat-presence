import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Callback do OAuth Google via Supabase.
 * Troca o `code` por uma sessão e redireciona para o destino original.
 *
 * O parâmetro `next` é validado para aceitar apenas caminhos relativos,
 * prevenindo open redirect para domínios externos.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Aceita apenas caminhos relativos — descarta qualquer URL absoluta
  const destino = next.startsWith('/') ? next : '/dashboard'

  if (code) {
    const supabase = await createServerSupabase()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${destino}`)
}
