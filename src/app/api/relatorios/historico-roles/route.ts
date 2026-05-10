import { NextResponse } from 'next/server'
import { verificarOrganizador } from '@/lib/supabase/api-helpers'
import { createAdminSupabase } from '@/lib/supabase/server'

/**
 * GET /api/relatorios/historico-roles
 * Retorna o histórico de alterações de role, mais recente primeiro. Requer role='organizador'.
 */
export async function GET() {
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  const { data, error } = await createAdminSupabase()
    .from('historico_roles')
    .select(`
      id,
      role_anterior,
      role_novo,
      alterado_em,
      participante:participante_id(id, nome, email),
      alterado_por:alterado_por_id(id, nome, email)
    `)
    .order('alterado_em', { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  const historico = (data ?? []).map(h => {
    const part = Array.isArray(h.participante) ? h.participante[0] : h.participante
    const por = Array.isArray(h.alterado_por) ? h.alterado_por[0] : h.alterado_por
    return {
      id: h.id,
      roleAnterior: h.role_anterior,
      roleNovo: h.role_novo,
      alteradoEm: h.alterado_em,
      participanteId: part?.id ?? null,
      nomeParticipante: part?.nome ?? null,
      emailParticipante: part?.email ?? '—',
      alteradoPorId: por?.id ?? null,
      nomeAlteradoPor: por?.nome ?? null,
      emailAlteradoPor: por?.email ?? '—',
    }
  })

  return NextResponse.json({ historico })
}
