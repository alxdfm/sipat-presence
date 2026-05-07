import { NextResponse } from 'next/server'
import { autenticarUsuario } from '@/lib/supabase/api-helpers'

/**
 * GET /api/presenca/minhas
 *
 * Retorna todas as Presenças do Participante autenticado,
 * enriquecidas com dados do DiaDeEvento e Evento vinculado.
 * Usado para montar o Dashboard e gerar o Certificado.
 *
 * O `codigo_do_dia` é excluído explicitamente da seleção — Participantes
 * não devem ter acesso ao código fora do QR code.
 *
 * @returns `{ presencas: PresencaEnriquecida[] }` ordenadas por data crescente.
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
        data,
        hora_abertura,
        evento:eventos ( id, nome, descricao )
      )
    `)
    .eq('participante_id', auth.usuario.id)
    .order('registrada_em', { ascending: true })

  if (error) {
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ presencas })
}
