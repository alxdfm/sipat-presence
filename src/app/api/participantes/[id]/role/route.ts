import { NextRequest, NextResponse } from 'next/server'
import { verificarOrganizador } from '@/lib/supabase/api-helpers'
import { createAdminSupabase } from '@/lib/supabase/server'

/**
 * PATCH /api/participantes/[id]/role
 *
 * Atualiza o role de um Participante (promove a Organizador ou rebaixa a Participante).
 * Requer role='organizador'. O Organizador não pode alterar o próprio role —
 * prevenindo que o único Organizador se remova acidentalmente.
 *
 * @param params.id - ID do Participante cujo role será alterado.
 * @body `{ role: 'participante' | 'organizador' }`
 * @returns 200 com o Participante atualizado.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  if (id === auth.usuario.id) {
    return NextResponse.json({ erro: 'nao_pode_alterar_proprio_role' }, { status: 422 })
  }

  let body: { role: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'corpo_invalido' }, { status: 400 })
  }

  if (body.role !== 'participante' && body.role !== 'organizador') {
    return NextResponse.json({ erro: 'role_invalido' }, { status: 400 })
  }

  const admin = createAdminSupabase()

  const { data: participanteAtual } = await admin
    .from('participantes')
    .select('role')
    .eq('id', id)
    .single()

  if (!participanteAtual) {
    return NextResponse.json({ erro: 'participante_nao_encontrado' }, { status: 404 })
  }

  const { data: participante, error } = await admin
    .from('participantes')
    .update({ role: body.role })
    .eq('id', id)
    .select('id, nome, email, role, criado_em')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ erro: 'participante_nao_encontrado' }, { status: 404 })
    }
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  // Registra no histórico (falha silenciosa para não bloquear a resposta)
  await admin.from('historico_roles').insert({
    participante_id: id,
    role_anterior: participanteAtual.role,
    role_novo: body.role,
    alterado_por_id: auth.usuario.id,
  })

  return NextResponse.json({ participante })
}
