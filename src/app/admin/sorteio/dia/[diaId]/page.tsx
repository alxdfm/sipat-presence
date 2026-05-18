import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import SorteioContent, { ColaboradorElegivel } from '@/components/sorteio-content'

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

interface Props {
  params: Promise<{ diaId: string }>
}

export default async function SorteioDiaPage({ params }: Props) {
  const { diaId } = await params

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

  const { data: dia } = await admin
    .from('dias_de_evento')
    .select('id, nome, data, eventos(nome)')
    .eq('id', diaId)
    .single()

  if (!dia) notFound()

  const { data: presencas } = await admin
    .from('presencas')
    .select('participante_id, participantes(nome, email)')
    .eq('dia_de_evento_id', diaId)

  const elegiveis: ColaboradorElegivel[] = (presencas ?? []).flatMap(p => {
    const part = Array.isArray(p.participantes) ? p.participantes[0] : p.participantes
    if (!part) return []
    return [{
      participanteId: p.participante_id,
      nome: (part as { nome: string | null }).nome ?? null,
      email: (part as { email: string }).email,
    }]
  })

  elegiveis.sort((a, b) => (a.nome ?? a.email).localeCompare(b.nome ?? b.email))

  const ev = Array.isArray(dia.eventos) ? dia.eventos[0] : dia.eventos
  const nomeEvento = (ev as { nome: string } | null)?.nome ?? ''
  const nomeDia = dia.nome ?? formatarData(dia.data)
  const dataFormatada = formatarData(dia.data)

  const titulo = `Sorteio · ${nomeDia}`
  const subtitulo = `${elegiveis.length} participante${elegiveis.length !== 1 ? 's' : ''} presente${elegiveis.length !== 1 ? 's' : ''} · ${nomeEvento}${dia.nome ? ` · ${dataFormatada}` : ''}`
  const csvNomeArquivo = `sorteio_${dia.data}_${(nomeDia).replace(/\s+/g, '_')}.csv`

  return (
    <SorteioContent
      elegiveis={elegiveis}
      titulo={titulo}
      subtitulo={subtitulo}
      backHref="/admin/sorteio"
      backLabel="← Voltar ao sorteio"
      csvNomeArquivo={csvNomeArquivo}
    />
  )
}
