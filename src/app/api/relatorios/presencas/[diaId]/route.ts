import { NextRequest, NextResponse } from 'next/server'
import { verificarOrganizador } from '@/lib/supabase/api-helpers'
import { createAdminSupabase } from '@/lib/supabase/server'

/**
 * GET /api/relatorios/presencas/[diaId]
 * Exporta a lista de presenças de um DiaDeEvento como CSV. Requer role='organizador'.
 *
 * @param params.diaId - ID do DiaDeEvento.
 * @returns Arquivo CSV com nome, email e horário de registro.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ diaId: string }> }
) {
  const { diaId } = await params
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  const admin = createAdminSupabase()

  const { data: dia, error: erroDia } = await admin
    .from('dias_de_evento')
    .select('nome, data, eventos(nome)')
    .eq('id', diaId)
    .single()

  if (erroDia || !dia) {
    return NextResponse.json({ erro: 'dia_nao_encontrado' }, { status: 404 })
  }

  const { data: presencas, error } = await admin
    .from('presencas')
    .select('registrada_em, participantes(nome, email)')
    .eq('dia_de_evento_id', diaId)
    .order('registrada_em')

  if (error) {
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  const evento = Array.isArray(dia.eventos) ? dia.eventos[0] : dia.eventos
  const nomeArquivo = `presencas_${dia.data}_${(dia.nome ?? evento?.nome ?? 'dia').replace(/\s+/g, '_')}.csv`

  const linhas = [
    'Nome,Email,Horário de Registro',
    ...(presencas ?? []).map(p => {
      const part = Array.isArray(p.participantes) ? p.participantes[0] : p.participantes
      const nome = part?.nome ?? ''
      const email = part?.email ?? ''
      const horario = new Date(p.registrada_em).toLocaleString('pt-BR')
      return `"${nome}","${email}","${horario}"`
    }),
  ]

  return new NextResponse(linhas.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
    },
  })
}
