import { NextResponse } from 'next/server'
import { verificarOrganizador, logErro } from '@/lib/supabase/api-helpers'
import { createAdminSupabase } from '@/lib/supabase/server'

export interface ColaboradorElegivel {
  participanteId: string
  nome: string | null
  email: string
  totalDias: number
}

/**
 * GET /api/relatorios/elegiveis
 * Retorna participantes com presença em pelo menos 3 dias distintos.
 * Requer role='organizador'.
 */
export async function GET() {
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  const admin = createAdminSupabase()

  const { data: presencas, error } = await admin
    .from('presencas')
    .select('participante_id, dia_de_evento_id, participantes(nome, email)')

  if (error) {
    logErro('/relatorios/elegiveis', error)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  // Agrupa por participante e conta dias distintos
  const mapa = new Map<string, { nome: string | null; email: string; dias: Set<string> }>()

  for (const p of presencas ?? []) {
    const part = Array.isArray(p.participantes) ? p.participantes[0] : p.participantes
    if (!part) continue

    const entry = mapa.get(p.participante_id) ?? {
      nome: part.nome ?? null,
      email: part.email,
      dias: new Set<string>(),
    }
    entry.dias.add(p.dia_de_evento_id)
    mapa.set(p.participante_id, entry)
  }

  const elegiveis: ColaboradorElegivel[] = []
  for (const [participanteId, { nome, email, dias }] of mapa) {
    if (dias.size >= 3) {
      elegiveis.push({ participanteId, nome, email, totalDias: dias.size })
    }
  }

  elegiveis.sort((a, b) => b.totalDias - a.totalDias || (a.nome ?? a.email).localeCompare(b.nome ?? b.email))

  return NextResponse.json(elegiveis)
}
