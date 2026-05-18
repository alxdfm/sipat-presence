'use server'

import { headers } from 'next/headers'
import { createAdminSupabase } from '@/lib/supabase/server'
import { autenticarUsuario } from '@/lib/supabase/api-helpers'
import { validarCodigoDoDia } from '@/lib/qr/codigo-do-dia'
import { checkRateLimit } from '@/lib/rate-limit'

type Resultado = { ok: true; duplicada?: boolean } | { ok: false; erro: string }

async function verificarRateLimit(): Promise<{ bloqueado: false } | { bloqueado: true; erro: string }> {
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(`presenca:${ip}`, 10, 60_000)
  return rl.allowed ? { bloqueado: false } : { bloqueado: true, erro: 'muitas_requisicoes' }
}

export async function registrarPresenca(
  diaDeEventoId: string,
  codigoDoDia: string
): Promise<Resultado> {
  const rl = await verificarRateLimit()
  if (rl.bloqueado) return { ok: false, erro: rl.erro }

  const auth = await autenticarUsuario()
  if (!auth.ok) return { ok: false, erro: 'nao_autenticado' }

  const admin = createAdminSupabase()
  const { data: autorizado } = await admin
    .from('colaboradores_autorizados')
    .select('id')
    .eq('email', auth.usuario.email)
    .maybeSingle()

  if (!autorizado) return { ok: false, erro: 'email_nao_autorizado' }

  if (!diaDeEventoId || !codigoDoDia) return { ok: false, erro: 'campos_obrigatorios' }

  const { data: dia, error: erroDia } = await auth.supabase
    .from('dias_de_evento')
    .select('*')
    .eq('id', diaDeEventoId)
    .single()

  if (erroDia || !dia) return { ok: false, erro: 'dia_nao_encontrado' }

  const resultado = validarCodigoDoDia(dia, codigoDoDia)
  if (!resultado.valido) return { ok: false, erro: resultado.motivo }

  const { error: erroInsercao } = await admin
    .from('presencas')
    .insert({ participante_id: auth.usuario.id, dia_de_evento_id: diaDeEventoId })

  if (erroInsercao) {
    if (erroInsercao.code === '23505') return { ok: true, duplicada: true }
    return { ok: false, erro: 'erro_interno' }
  }

  return { ok: true }
}

export async function registrarPresencaPorCodigo(codigoDoDia: string): Promise<Resultado> {
  const rl = await verificarRateLimit()
  if (rl.bloqueado) return { ok: false, erro: rl.erro }

  const auth = await autenticarUsuario()
  if (!auth.ok) return { ok: false, erro: 'nao_autenticado' }

  const admin = createAdminSupabase()
  const { data: autorizado } = await admin
    .from('colaboradores_autorizados')
    .select('id')
    .eq('email', auth.usuario.email)
    .maybeSingle()

  if (!autorizado) return { ok: false, erro: 'email_nao_autorizado' }

  if (!codigoDoDia) return { ok: false, erro: 'campos_obrigatorios' }

  const { data: dias, error: erroDias } = await auth.supabase
    .from('dias_de_evento')
    .select('*')
    .eq('codigo_do_dia', codigoDoDia)

  if (erroDias) return { ok: false, erro: 'erro_interno' }

  if (!dias || dias.length === 0) return { ok: false, erro: 'codigo_incorreto' }

  const diaValido = dias.find(d => validarCodigoDoDia(d, codigoDoDia).valido)

  if (!diaValido) {
    const r = validarCodigoDoDia(dias[0], codigoDoDia)
    return { ok: false, erro: !r.valido ? r.motivo : 'fora_da_janela' }
  }

  const { error: erroInsercao } = await admin
    .from('presencas')
    .insert({ participante_id: auth.usuario.id, dia_de_evento_id: diaValido.id })

  if (erroInsercao) {
    if (erroInsercao.code === '23505') return { ok: true, duplicada: true }
    return { ok: false, erro: 'erro_interno' }
  }

  return { ok: true }
}

export async function registrarPresencaManual(
  colaboradorEmail: string,
  diaDeEventoId: string
): Promise<Resultado> {
  const auth = await autenticarUsuario()
  if (!auth.ok) return { ok: false, erro: 'nao_autenticado' }

  const admin = createAdminSupabase()

  const { data: organizador } = await admin
    .from('participantes')
    .select('role')
    .eq('id', auth.usuario.id)
    .single()

  if (organizador?.role !== 'organizador') return { ok: false, erro: 'sem_permissao' }

  const { data: participante } = await admin
    .from('participantes')
    .select('id')
    .eq('email', colaboradorEmail)
    .maybeSingle()

  if (!participante) return { ok: false, erro: 'nao_cadastrado' }

  const { error } = await admin
    .from('presencas')
    .insert({ participante_id: participante.id, dia_de_evento_id: diaDeEventoId })

  if (error) {
    if (error.code === '23505') return { ok: true, duplicada: true }
    return { ok: false, erro: 'erro_interno' }
  }

  return { ok: true }
}
