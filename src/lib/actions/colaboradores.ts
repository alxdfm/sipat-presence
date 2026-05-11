'use server'

import { verificarOrganizador } from '@/lib/supabase/api-helpers'
import { createAdminSupabase } from '@/lib/supabase/server'
import { ColaboradorAutorizado } from '@/types'

type R<T> = { ok: true; data: T } | { ok: false; erro: string }

export async function adicionarColaboradores(
  emails: string[]
): Promise<R<{ inseridos: ColaboradorAutorizado[]; total: number }>> {
  const auth = await verificarOrganizador()
  if (!auth.ok) return { ok: false, erro: 'sem_permissao' }

  if (!Array.isArray(emails) || emails.length === 0) return { ok: false, erro: 'emails_obrigatorios' }

  const emailsValidos = emails
    .map(e => e.trim().toLowerCase())
    .filter(e => e.includes('@'))

  if (emailsValidos.length === 0) return { ok: false, erro: 'nenhum_email_valido' }

  const { data: inseridos, error } = await createAdminSupabase()
    .from('colaboradores_autorizados')
    .upsert(emailsValidos.map(email => ({ email })), { onConflict: 'email', ignoreDuplicates: true })
    .select('id, email, criado_em')

  if (error) return { ok: false, erro: 'erro_interno' }
  return { ok: true, data: { inseridos: inseridos ?? [], total: inseridos?.length ?? 0 } }
}

export async function removerColaborador(id: string): Promise<R<null>> {
  const auth = await verificarOrganizador()
  if (!auth.ok) return { ok: false, erro: 'sem_permissao' }

  const { error } = await createAdminSupabase()
    .from('colaboradores_autorizados')
    .delete()
    .eq('id', id)

  if (error) return { ok: false, erro: 'erro_interno' }
  return { ok: true, data: null }
}

export async function atualizarColaborador(
  id: string,
  email: string
): Promise<R<ColaboradorAutorizado>> {
  const auth = await verificarOrganizador()
  if (!auth.ok) return { ok: false, erro: 'sem_permissao' }

  const emailTrimmed = email.trim().toLowerCase()
  if (!emailTrimmed || !emailTrimmed.includes('@')) return { ok: false, erro: 'email_invalido' }

  const { data: colaborador, error } = await createAdminSupabase()
    .from('colaboradores_autorizados')
    .update({ email: emailTrimmed })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return { ok: false, erro: 'email_ja_cadastrado' }
    if (error.code === 'PGRST116') return { ok: false, erro: 'colaborador_nao_encontrado' }
    return { ok: false, erro: 'erro_interno' }
  }

  return { ok: true, data: colaborador }
}
