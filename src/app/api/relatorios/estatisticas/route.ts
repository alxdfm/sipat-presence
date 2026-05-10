import { NextResponse } from 'next/server'
import { verificarOrganizador } from '@/lib/supabase/api-helpers'
import { createAdminSupabase } from '@/lib/supabase/server'

/**
 * GET /api/relatorios/estatisticas
 * Retorna estatísticas de presença por dia de evento. Requer role='organizador'.
 *
 * @returns Array de { diaId, dataDia, nomeDia, eventoId, nomeEvento, totalPresentes, totalColaboradores }
 */
export async function GET() {
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  const admin = createAdminSupabase()

  const [{ data: dias, error: erroDias }, { count: totalColaboradores }] = await Promise.all([
    admin
      .from('dias_de_evento')
      .select('id, nome, data, evento_id, eventos(id, nome), presencas(id)')
      .order('evento_id')
      .order('data'),
    admin.from('colaboradores_autorizados').select('id', { count: 'exact', head: true }),
  ])

  if (erroDias) {
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  const total = totalColaboradores ?? 0

  const estatisticas = (dias ?? []).map(dia => {
    const presentes = Array.isArray(dia.presencas) ? dia.presencas.length : 0
    const evento = Array.isArray(dia.eventos) ? dia.eventos[0] : dia.eventos
    return {
      diaId: dia.id,
      dataDia: dia.data,
      nomeDia: dia.nome ?? null,
      eventoId: evento?.id ?? dia.evento_id,
      nomeEvento: evento?.nome ?? '—',
      totalPresentes: presentes,
      totalColaboradores: total,
      percentual: total > 0 ? Math.round((presentes / total) * 100) : null,
    }
  })

  return NextResponse.json({ estatisticas })
}
