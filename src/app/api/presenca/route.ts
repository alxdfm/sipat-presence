import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'
import { autenticarUsuario } from '@/lib/supabase/api-helpers'
import { validarCodigoDoDia } from '@/lib/qr/codigo-do-dia'
import { RegistrarPresencaPayload } from '@/types'

/**
 * POST /api/presenca
 *
 * Registra a Presença de um Participante autenticado em um DiaDeEvento.
 *
 * Validações realizadas (server-side, nesta ordem):
 * 1. Participante autenticado
 * 2. Campos obrigatórios presentes
 * 3. DiaDeEvento existe
 * 4. CodigoDoDia está ativado (não null)
 * 5. CodigoDoDia recebido bate com o armazenado
 * 6. Momento atual está dentro da JanelaDeTempo
 * 7. Presença ainda não registrada — idempotente, retorna 200 se já existia
 *
 * @body {RegistrarPresencaPayload} - diaDeEventoId + codigoDoDia
 * @returns 201 com a Presença criada, 200 com aviso se já existia, ou erro com motivo.
 */
export async function POST(request: NextRequest) {
  const auth = await autenticarUsuario()
  if (!auth.ok) return auth.response

  let body: RegistrarPresencaPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'corpo_invalido' }, { status: 400 })
  }

  const { diaDeEventoId, codigoDoDia } = body

  if (!diaDeEventoId || !codigoDoDia) {
    return NextResponse.json({ erro: 'campos_obrigatorios' }, { status: 400 })
  }

  const { data: dia, error: erroDia } = await auth.supabase
    .from('dias_de_evento')
    .select('*')
    .eq('id', diaDeEventoId)
    .single()

  if (erroDia || !dia) {
    return NextResponse.json({ erro: 'dia_nao_encontrado' }, { status: 404 })
  }

  const resultado = validarCodigoDoDia(dia, codigoDoDia)
  if (!resultado.valido) {
    return NextResponse.json({ erro: resultado.motivo }, { status: 422 })
  }

  // Service role bypassa RLS para inserção — a autenticação já foi validada acima
  const adminSupabase = createAdminSupabase()
  const { data: presenca, error: erroInsercao } = await adminSupabase
    .from('presencas')
    .insert({ participante_id: auth.usuario.id, dia_de_evento_id: diaDeEventoId })
    .select()
    .single()

  if (erroInsercao) {
    // Constraint UNIQUE violada = presença duplicada (idempotente)
    if (erroInsercao.code === '23505') {
      return NextResponse.json({ aviso: 'presenca_duplicada' }, { status: 200 })
    }
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ presenca }, { status: 201 })
}
