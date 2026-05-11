import { NextRequest, NextResponse } from 'next/server'
import { verificarOrganizador, logErro} from '@/lib/supabase/api-helpers'
import { createAdminSupabase } from '@/lib/supabase/server'

/**
 * GET /api/colaboradores-autorizados
 * Lista todos os colaboradores autorizados. Requer role='organizador'.
 */
export async function GET() {
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  const { data: colaboradores, error } = await auth.supabase
    .from('colaboradores_autorizados')
    .select('id, email, criado_em')
    .order('email', { ascending: true })

  if (error) {
    logErro('/colaboradores-autorizados', error)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ colaboradores })
}

/**
 * POST /api/colaboradores-autorizados
 * Adiciona um ou mais emails à lista de colaboradores autorizados.
 * Requer role='organizador'.
 *
 * @body `{ emails: string[] }` — lista de emails a adicionar (duplicatas ignoradas).
 */
export async function POST(request: NextRequest) {
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  let body: { emails: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'corpo_invalido' }, { status: 400 })
  }

  if (!Array.isArray(body.emails) || body.emails.length === 0) {
    return NextResponse.json({ erro: 'emails_obrigatorios' }, { status: 400 })
  }

  const emails = body.emails
    .map(e => e.trim().toLowerCase())
    .filter(e => e.includes('@'))

  if (emails.length === 0) {
    return NextResponse.json({ erro: 'nenhum_email_valido' }, { status: 400 })
  }

  // onConflict: ignora duplicatas silenciosamente
  const { data: inseridos, error } = await createAdminSupabase()
    .from('colaboradores_autorizados')
    .upsert(emails.map(email => ({ email })), { onConflict: 'email', ignoreDuplicates: true })
    .select('id, email, criado_em')

  if (error) {
    logErro('/colaboradores-autorizados', error)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ inseridos, total: inseridos?.length ?? 0 }, { status: 201 })
}
