import { NextRequest, NextResponse } from 'next/server'
import { autenticarUsuario, logErro} from '@/lib/supabase/api-helpers'

/**
 * GET /api/certificado/dia/[diaId]
 *
 * Retorna dados para gerar o certificado de um dia específico.
 * Retorna 403 se o participante autenticado não tiver presença registrada nesse dia.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ diaId: string }> }
) {
  const { diaId } = await params
  const auth = await autenticarUsuario()
  if (!auth.ok) return auth.response

  const { data: presenca } = await auth.supabase
    .from('presencas')
    .select('id')
    .eq('participante_id', auth.usuario.id)
    .eq('dia_de_evento_id', diaId)
    .single()

  if (!presenca) {
    return NextResponse.json({ erro: 'presenca_nao_encontrada' }, { status: 403 })
  }

  const { data: dia } = await auth.supabase
    .from('dias_de_evento')
    .select('id, nome, data, evento:eventos ( id, nome )')
    .eq('id', diaId)
    .single()

  if (!dia) {
    return NextResponse.json({ erro: 'dia_nao_encontrado' }, { status: 404 })
  }

  const { data: participante } = await auth.supabase
    .from('participantes')
    .select('nome')
    .eq('id', auth.usuario.id)
    .single()

  const evento = Array.isArray(dia.evento) ? dia.evento[0] : dia.evento

  return NextResponse.json({
    nomeDia: dia.nome,
    dataDia: dia.data,
    nomeEvento: evento?.nome ?? 'SIPAT',
    nomeParticipante: participante?.nome ?? auth.usuario.email,
    emailParticipante: auth.usuario.email,
  })
}
