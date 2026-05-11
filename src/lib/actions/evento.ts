'use server'

import { verificarOrganizador } from '@/lib/supabase/api-helpers'
import { Evento, DiaDeEvento } from '@/types'

type R<T> = { ok: true; data: T } | { ok: false; erro: string }

export async function criarEvento(nome: string, descricao?: string): Promise<R<Evento>> {
  const auth = await verificarOrganizador()
  if (!auth.ok) return { ok: false, erro: 'sem_permissao' }

  const nomeTrimmed = nome.trim()
  if (!nomeTrimmed) return { ok: false, erro: 'nome_obrigatorio' }

  const { data: evento, error } = await auth.supabase
    .from('eventos')
    .insert({ nome: nomeTrimmed, descricao: descricao?.trim() ?? null })
    .select()
    .single()

  if (error) return { ok: false, erro: 'erro_interno' }
  return { ok: true, data: evento }
}

export async function atualizarEvento(
  id: string,
  nome?: string,
  descricao?: string | null
): Promise<R<Evento>> {
  const auth = await verificarOrganizador()
  if (!auth.ok) return { ok: false, erro: 'sem_permissao' }

  const updates: { nome?: string; descricao?: string | null } = {}
  if (nome !== undefined) {
    const n = nome.trim()
    if (!n) return { ok: false, erro: 'nome_obrigatorio' }
    updates.nome = n
  }
  if (descricao !== undefined) updates.descricao = descricao?.trim() ?? null

  if (Object.keys(updates).length === 0) return { ok: false, erro: 'nenhum_campo_para_atualizar' }

  const { data: evento, error } = await auth.supabase
    .from('eventos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return { ok: false, erro: 'evento_nao_encontrado' }
    return { ok: false, erro: 'erro_interno' }
  }

  return { ok: true, data: evento }
}

export async function excluirEvento(id: string): Promise<R<null>> {
  const auth = await verificarOrganizador()
  if (!auth.ok) return { ok: false, erro: 'sem_permissao' }

  const { error } = await auth.supabase.from('eventos').delete().eq('id', id)
  if (error) return { ok: false, erro: 'erro_interno' }
  return { ok: true, data: null }
}

export async function criarDiaDeEvento(payload: {
  eventoId: string
  nome?: string
  data: string
  horaAbertura: string
  duracaoMinutos?: number
}): Promise<R<DiaDeEvento>> {
  const auth = await verificarOrganizador()
  if (!auth.ok) return { ok: false, erro: 'sem_permissao' }

  const { eventoId, nome, data, horaAbertura, duracaoMinutos = 60 } = payload

  if (!eventoId || !data || !horaAbertura) return { ok: false, erro: 'campos_obrigatorios' }

  const { data: evento } = await auth.supabase
    .from('eventos')
    .select('id')
    .eq('id', eventoId)
    .single()

  if (!evento) return { ok: false, erro: 'evento_nao_encontrado' }

  const { data: dia, error } = await auth.supabase
    .from('dias_de_evento')
    .insert({
      evento_id: eventoId,
      nome: nome?.trim() || null,
      data,
      hora_abertura: horaAbertura,
      duracao_minutos: duracaoMinutos,
      codigo_do_dia: null,
    })
    .select()
    .single()

  if (error) return { ok: false, erro: 'erro_interno' }
  return { ok: true, data: dia }
}

export async function atualizarDiaDeEvento(
  id: string,
  payload: {
    nome?: string | null
    data?: string
    horaAbertura?: string
    duracaoMinutos?: number
  }
): Promise<R<DiaDeEvento>> {
  const auth = await verificarOrganizador()
  if (!auth.ok) return { ok: false, erro: 'sem_permissao' }

  const updates: Record<string, unknown> = {}
  if (payload.nome !== undefined) updates.nome = payload.nome?.trim() || null
  if (payload.data !== undefined) updates.data = payload.data
  if (payload.horaAbertura !== undefined) updates.hora_abertura = payload.horaAbertura
  if (payload.duracaoMinutos !== undefined) updates.duracao_minutos = payload.duracaoMinutos

  if (Object.keys(updates).length === 0) return { ok: false, erro: 'nenhum_campo_para_atualizar' }

  const { data: dia, error } = await auth.supabase
    .from('dias_de_evento')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return { ok: false, erro: 'dia_nao_encontrado' }
    return { ok: false, erro: 'erro_interno' }
  }

  return { ok: true, data: dia }
}

export async function excluirDiaDeEvento(id: string): Promise<R<null>> {
  const auth = await verificarOrganizador()
  if (!auth.ok) return { ok: false, erro: 'sem_permissao' }

  const { error } = await auth.supabase.from('dias_de_evento').delete().eq('id', id)
  if (error) return { ok: false, erro: 'erro_interno' }
  return { ok: true, data: null }
}

export async function ativarCodigoDoDia(id: string, codigoDoDia: string): Promise<R<DiaDeEvento>> {
  const auth = await verificarOrganizador()
  if (!auth.ok) return { ok: false, erro: 'sem_permissao' }

  const codigo = codigoDoDia.trim()
  if (!codigo) return { ok: false, erro: 'codigo_obrigatorio' }
  if (codigo.length > 100) return { ok: false, erro: 'codigo_muito_longo' }

  const { data: diaAtual } = await auth.supabase
    .from('dias_de_evento')
    .select('data')
    .eq('id', id)
    .single()

  if (!diaAtual) return { ok: false, erro: 'dia_nao_encontrado' }

  const hojeStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  if (diaAtual.data < hojeStr) return { ok: false, erro: 'dia_no_passado' }

  const { data: dia, error } = await auth.supabase
    .from('dias_de_evento')
    .update({ codigo_do_dia: codigo })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return { ok: false, erro: 'dia_nao_encontrado' }
    return { ok: false, erro: 'erro_interno' }
  }

  if (!dia) return { ok: false, erro: 'dia_nao_encontrado' }
  return { ok: true, data: dia }
}
