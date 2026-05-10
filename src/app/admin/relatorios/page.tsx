import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createAdminSupabase } from '@/lib/supabase/server'
import RelatoriosContent from '@/components/relatorios-content'
import { EstatisticasDia, HistoricoRole } from '@/types'

/**
 * Página de relatórios do Organizador.
 * Exibe estatísticas de presença por dia, exportação CSV e histórico de roles.
 */
export default async function RelatoriosPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: participante } = await supabase
    .from('participantes')
    .select('*')
    .eq('id', user.id)
    .single()

  if (participante?.role !== 'organizador') redirect('/dashboard')

  const admin = createAdminSupabase()

  const [
    { data: dias },
    { count: totalColaboradores },
    { data: historicoRaw },
  ] = await Promise.all([
    admin
      .from('dias_de_evento')
      .select('id, nome, data, evento_id, eventos(id, nome), presencas(id)')
      .order('evento_id')
      .order('data'),
    admin.from('colaboradores_autorizados').select('id', { count: 'exact', head: true }),
    admin
      .from('historico_roles')
      .select(`
        id, role_anterior, role_novo, alterado_em,
        participante:participante_id(id, nome, email),
        alterado_por:alterado_por_id(id, nome, email)
      `)
      .order('alterado_em', { ascending: false })
      .limit(200),
  ])

  const total = totalColaboradores ?? 0

  const estatisticas: EstatisticasDia[] = (dias ?? []).map(dia => {
    const presentes = Array.isArray(dia.presencas) ? dia.presencas.length : 0
    const evento = Array.isArray(dia.eventos) ? dia.eventos[0] : dia.eventos
    return {
      diaId: dia.id,
      dataDia: dia.data,
      nomeDia: dia.nome ?? null,
      eventoId: (evento as { id: string } | null)?.id ?? dia.evento_id,
      nomeEvento: (evento as { nome: string } | null)?.nome ?? '—',
      totalPresentes: presentes,
      totalColaboradores: total,
      percentual: total > 0 ? Math.round((presentes / total) * 100) : null,
    }
  })

  const historico: HistoricoRole[] = (historicoRaw ?? []).map(h => {
    const part = Array.isArray(h.participante) ? h.participante[0] : h.participante
    const por = Array.isArray(h.alterado_por) ? h.alterado_por[0] : h.alterado_por
    return {
      id: h.id,
      roleAnterior: h.role_anterior as 'participante' | 'organizador',
      roleNovo: h.role_novo as 'participante' | 'organizador',
      alteradoEm: h.alterado_em,
      participanteId: (part as { id: string } | null)?.id ?? null,
      nomeParticipante: (part as { nome: string } | null)?.nome ?? null,
      emailParticipante: (part as { email: string } | null)?.email ?? '—',
      alteradoPorId: (por as { id: string } | null)?.id ?? null,
      nomeAlteradoPor: (por as { nome: string } | null)?.nome ?? null,
      emailAlteradoPor: (por as { email: string } | null)?.email ?? '—',
    }
  })

  return <RelatoriosContent estatisticas={estatisticas} historico={historico} totalColaboradores={total} />
}
