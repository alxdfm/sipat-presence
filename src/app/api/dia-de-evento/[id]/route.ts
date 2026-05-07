import { NextRequest, NextResponse } from 'next/server'
import { autenticarUsuario, verificarOrganizador } from '@/lib/supabase/api-helpers'

/**
 * GET /api/dia-de-evento/[id]
 * Busca um DiaDeEvento por ID. Requer autenticação.
 *
 * O campo `codigo_do_dia` só é retornado para Organizadores.
 * Participantes recebem o mesmo objeto com `codigo_do_dia` omitido,
 * impedindo que obtenham o código sem escanear o QR.
 *
 * @param params.id - ID do DiaDeEvento.
 * @returns DiaDeEvento (com ou sem `codigo_do_dia`) ou 404.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await autenticarUsuario()
  if (!auth.ok) return auth.response

  const { data: dia, error } = await auth.supabase
    .from('dias_de_evento')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !dia) {
    return NextResponse.json({ erro: 'dia_nao_encontrado' }, { status: 404 })
  }

  // Verifica se é Organizador para decidir se expõe o codigo_do_dia
  const authOrg = await verificarOrganizador()
  if (authOrg.ok) {
    return NextResponse.json({ dia })
  }

  // Participante: omite o código para não vazar via chamada direta à API
  const { codigo_do_dia: _, ...diaPublico } = dia
  return NextResponse.json({ dia: diaPublico })
}
