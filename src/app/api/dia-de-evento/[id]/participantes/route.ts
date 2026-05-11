import { NextRequest, NextResponse } from 'next/server'
import { verificarOrganizador, logErro} from '@/lib/supabase/api-helpers'
import { createAdminSupabase } from '@/lib/supabase/server'
import { ParticipanteComPresenca } from '@/types'

/**
 * GET /api/dia-de-evento/[id]/participantes
 *
 * Retorna a lista de colaboradores autorizados com status de presença no dia.
 * A base é `colaboradores_autorizados` — quem é esperado aparecer.
 * Nome é preenchido se o colaborador já fez login (existe em `participantes`).
 *
 * @param params.id - ID do DiaDeEvento.
 * @returns `{ participantes: ParticipanteComPresenca[], totalPresentes, totalAusentes }`
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  const admin = createAdminSupabase()

  const [
    { data: colaboradores, error: erroC },
    { data: presencas, error: erroP },
    { data: participantes, error: erroR },
  ] = await Promise.all([
    admin.from('colaboradores_autorizados').select('id, email').order('email'),
    admin.from('presencas').select('participante_id, id, registrada_em').eq('dia_de_evento_id', id),
    admin.from('participantes').select('id, email, nome'),
  ])

  if (erroC || erroP || erroR) {
    logErro('/dia-de-evento/[id]/participantes', {erroC, erroP, erroR})
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  // Mapas para lookup O(1)
  const presencaPorEmail = new Map<string, { id: string; registrada_em: string }>()
  const nomePorEmail = new Map<string, string | null>()

  for (const part of participantes ?? []) {
    nomePorEmail.set(part.email, part.nome)
  }

  // Cruza participante_id da presença com email via tabela participantes
  const participanteById = new Map((participantes ?? []).map(p => [p.id, p]))
  for (const p of presencas ?? []) {
    const part = participanteById.get(p.participante_id)
    if (part) presencaPorEmail.set(part.email, { id: p.id, registrada_em: p.registrada_em })
  }

  const resultado: ParticipanteComPresenca[] = (colaboradores ?? []).map(c => ({
    id: c.id,
    email: c.email,
    nome: nomePorEmail.get(c.email) ?? null,
    presenca: presencaPorEmail.get(c.email) ?? null,
  }))

  const totalPresentes = resultado.filter(p => p.presenca !== null).length

  return NextResponse.json({
    participantes: resultado,
    totalPresentes,
    totalAusentes: resultado.length - totalPresentes,
  })
}
