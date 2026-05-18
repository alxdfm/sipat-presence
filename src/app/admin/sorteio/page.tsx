import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SorteioContent, { ColaboradorElegivel, DiaSorteioInfo } from '@/components/sorteio-content'

export default async function SorteioPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: participante } = await supabase
    .from('participantes')
    .select('role')
    .eq('id', user.id)
    .single()

  if (participante?.role !== 'organizador') redirect('/dashboard')

  const admin = createAdminSupabase()

  const [{ data: presencas }, { data: diasRaw }] = await Promise.all([
    admin.from('presencas').select('participante_id, dia_de_evento_id, participantes(nome, email)'),
    admin.from('dias_de_evento').select('id, nome, data, eventos(nome)').order('data', { ascending: true }),
  ])

  const mapa = new Map<string, { nome: string | null; email: string; dias: Set<string> }>()
  const contagemPorDia = new Map<string, number>()

  for (const p of presencas ?? []) {
    const part = Array.isArray(p.participantes) ? p.participantes[0] : p.participantes
    if (!part) continue
    const entry = mapa.get(p.participante_id) ?? {
      nome: (part as { nome: string | null }).nome ?? null,
      email: (part as { email: string }).email,
      dias: new Set<string>(),
    }
    entry.dias.add(p.dia_de_evento_id)
    mapa.set(p.participante_id, entry)
    contagemPorDia.set(p.dia_de_evento_id, (contagemPorDia.get(p.dia_de_evento_id) ?? 0) + 1)
  }

  const elegiveis: ColaboradorElegivel[] = []
  for (const [participanteId, { nome, email, dias }] of mapa) {
    if (dias.size >= 3) {
      elegiveis.push({ participanteId, nome, email, totalDias: dias.size })
    }
  }
  elegiveis.sort((a, b) => (b.totalDias ?? 0) - (a.totalDias ?? 0) || (a.nome ?? a.email).localeCompare(b.nome ?? b.email))

  const diasParaSorteio: DiaSorteioInfo[] = (diasRaw ?? []).map(d => {
    const ev = Array.isArray(d.eventos) ? d.eventos[0] : d.eventos
    return {
      id: d.id,
      nome: d.nome ?? null,
      data: d.data,
      nomeEvento: (ev as { nome: string } | null)?.nome ?? '',
      totalPresentes: contagemPorDia.get(d.id) ?? 0,
    }
  })

  return <SorteioContent elegiveis={elegiveis} diasParaSorteio={diasParaSorteio} />
}
