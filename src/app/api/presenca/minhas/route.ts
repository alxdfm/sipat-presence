import { NextResponse } from 'next/server'
import { autenticarUsuario, logErro} from '@/lib/supabase/api-helpers'

/**
 * GET /api/presenca/minhas
 *
 * Retorna todas as Presenças do Participante autenticado,
 * enriquecidas com dados do DiaDeEvento (incluindo nome) e Evento vinculado.
 * Usado para montar o Dashboard.
 */
export async function GET() {
  const auth = await autenticarUsuario()
  if (!auth.ok) return auth.response

  const { data: presencas, error } = await auth.supabase
    .from('presencas')
    .select(`
      id,
      registrada_em,
      dia_de_evento:dias_de_evento (
        id,
        nome,
        data,
        hora_abertura,
        evento:eventos ( id, nome, descricao )
      )
    `)
    .eq('participante_id', auth.usuario.id)
    .order('registrada_em', { ascending: true })

  if (error) {
    logErro('/presenca/minhas', error)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ presencas })
}
