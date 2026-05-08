import { NextRequest, NextResponse } from 'next/server'
import { verificarOrganizador } from '@/lib/supabase/api-helpers'
import { CriarDiaDeEventoPayload } from '@/types'

/**
 * POST /api/dia-de-evento
 * Cria um novo DiaDeEvento vinculado a um Evento. Requer role='organizador'.
 * O campo `codigo_do_dia` nasce como NULL — precisa ser ativado separadamente
 * via PATCH /api/dia-de-evento/[id]/ativar.
 *
 * @body {CriarDiaDeEventoPayload}
 * @returns 201 com o DiaDeEvento criado, ou 404 se o Evento não existir.
 */
export async function POST(request: NextRequest) {
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  let body: CriarDiaDeEventoPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'corpo_invalido' }, { status: 400 })
  }

  const { eventoId, nome, data, horaAbertura, duracaoMinutos = 60 } = body

  if (!eventoId || !data || !horaAbertura) {
    return NextResponse.json({ erro: 'campos_obrigatorios' }, { status: 400 })
  }

  const { data: evento } = await auth.supabase
    .from('eventos')
    .select('id')
    .eq('id', eventoId)
    .single()

  if (!evento) {
    return NextResponse.json({ erro: 'evento_nao_encontrado' }, { status: 404 })
  }

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

  if (error) {
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ dia }, { status: 201 })
}
