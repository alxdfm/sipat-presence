'use server'

import { verificarOrganizador } from '@/lib/supabase/api-helpers'
import { createAdminSupabase } from '@/lib/supabase/server'
import { Participante } from '@/types'

type R<T> = { ok: true; data: T } | { ok: false; erro: string }

export async function alterarRole(
  id: string,
  role: 'participante' | 'organizador'
): Promise<R<Participante>> {
  const auth = await verificarOrganizador()
  if (!auth.ok) return { ok: false, erro: 'sem_permissao' }

  if (id === auth.usuario.id) return { ok: false, erro: 'nao_pode_alterar_proprio_role' }

  if (role !== 'participante' && role !== 'organizador') return { ok: false, erro: 'role_invalido' }

  const admin = createAdminSupabase()

  const { data: participanteAtual } = await admin
    .from('participantes')
    .select('role')
    .eq('id', id)
    .single()

  if (!participanteAtual) return { ok: false, erro: 'participante_nao_encontrado' }

  const { data: participante, error } = await admin
    .from('participantes')
    .update({ role })
    .eq('id', id)
    .select('id, nome, email, role, criado_em')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return { ok: false, erro: 'participante_nao_encontrado' }
    return { ok: false, erro: 'erro_interno' }
  }

  await admin.from('historico_roles').insert({
    participante_id: id,
    role_anterior: participanteAtual.role,
    role_novo: role,
    alterado_por_id: auth.usuario.id,
  })

  return { ok: true, data: participante }
}
