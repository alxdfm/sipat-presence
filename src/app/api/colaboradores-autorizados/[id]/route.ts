import { NextRequest, NextResponse } from 'next/server'
import { verificarOrganizador, logErro} from '@/lib/supabase/api-helpers'
import { createAdminSupabase } from '@/lib/supabase/server'

/**
 * PATCH /api/colaboradores-autorizados/[id]
 * Atualiza o email de um colaborador autorizado. Requer role='organizador'.
 *
 * @body `{ email: string }`
 * @returns 200 com o colaborador atualizado.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  let body: { email: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'corpo_invalido' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ erro: 'email_invalido' }, { status: 400 })
  }

  const { data: colaborador, error } = await createAdminSupabase()
    .from('colaboradores_autorizados')
    .update({ email })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ erro: 'email_ja_cadastrado' }, { status: 409 })
    }
    if (error.code === 'PGRST116') {
      return NextResponse.json({ erro: 'colaborador_nao_encontrado' }, { status: 404 })
    }
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ colaborador })
}

/**
 * DELETE /api/colaboradores-autorizados/[id]
 * Remove um colaborador autorizado pelo ID. Requer role='organizador'.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  const { error } = await createAdminSupabase()
    .from('colaboradores_autorizados')
    .delete()
    .eq('id', id)

  if (error) {
    logErro('/colaboradores-autorizados/[id]', error)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
