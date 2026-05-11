import { NextRequest, NextResponse } from 'next/server'
import { autenticarUsuario, logErro} from '@/lib/supabase/api-helpers'

/**
 * GET /api/certificado/[eventoId]
 *
 * Retorna todos os dias do evento com flag de presença do participante autenticado.
 * Usado pelo CertificadoButton para gerar o PDF com resumo completo (presentes e ausentes).
 *
 * @returns `{ evento, dias: DiaCertificado[], diasPresentes, totalDias }`
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventoId: string }> }
) {
  const { eventoId } = await params
  const auth = await autenticarUsuario()
  if (!auth.ok) return auth.response

  const { data: evento } = await auth.supabase
    .from('eventos')
    .select('id, nome, descricao')
    .eq('id', eventoId)
    .single()

  if (!evento) {
    return NextResponse.json({ erro: 'evento_nao_encontrado' }, { status: 404 })
  }

  const { data: dias, error: erroDias } = await auth.supabase
    .from('dias_de_evento')
    .select('id, data, nome')
    .eq('evento_id', eventoId)
    .order('data', { ascending: true })

  if (erroDias || !dias) {
    logErro('/certificado/[eventoId]', erroDias)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  const { data: presencas } = await auth.supabase
    .from('presencas')
    .select('dia_de_evento_id')
    .eq('participante_id', auth.usuario.id)
    .in('dia_de_evento_id', dias.map(d => d.id))

  const presencasSet = new Set(presencas?.map(p => p.dia_de_evento_id) ?? [])

  const diasComPresenca = dias.map(dia => ({
    data: dia.data,
    nome: dia.nome,
    presente: presencasSet.has(dia.id),
  }))

  return NextResponse.json({
    evento,
    dias: diasComPresenca,
    diasPresentes: presencasSet.size,
    totalDias: dias.length,
  })
}
