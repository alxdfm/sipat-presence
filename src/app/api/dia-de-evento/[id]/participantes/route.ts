import { NextRequest, NextResponse } from 'next/server'
import { verificarOrganizador } from '@/lib/supabase/api-helpers'
import { createAdminSupabase } from '@/lib/supabase/server'
import { ParticipanteComPresenca } from '@/types'

/**
 * GET /api/dia-de-evento/[id]/participantes
 *
 * Retorna todos os Participantes do sistema com seu status de presença
 * no DiaDeEvento especificado. Permite ao Organizador ver quem compareceu
 * e quem não compareceu.
 *
 * Usa service_role para ler todos os participantes — a RLS padrão restringe
 * cada participante a ver apenas o próprio registro.
 *
 * @param params.id - ID do DiaDeEvento.
 * @returns `{ participantes: ParticipanteComPresenca[], totalPresentes: number, totalAusentes: number }`
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  const adminSupabase = createAdminSupabase()

  const [{ data: participantes, error: erroP }, { data: presencas, error: erroR }] =
    await Promise.all([
      adminSupabase
        .from('participantes')
        .select('id, nome, email')
        .order('nome', { ascending: true }),
      adminSupabase
        .from('presencas')
        .select('id, participante_id, registrada_em')
        .eq('dia_de_evento_id', id),
    ])

  if (erroP || erroR) {
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  const presencaMap = new Map(
    (presencas ?? []).map(p => [p.participante_id, { id: p.id, registrada_em: p.registrada_em }])
  )

  const resultado: ParticipanteComPresenca[] = (participantes ?? []).map(p => ({
    ...p,
    presenca: presencaMap.get(p.id) ?? null,
  }))

  const totalPresentes = resultado.filter(p => p.presenca !== null).length

  return NextResponse.json({
    participantes: resultado,
    totalPresentes,
    totalAusentes: resultado.length - totalPresentes,
  })
}
