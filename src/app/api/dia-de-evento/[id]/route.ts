import { NextRequest, NextResponse } from 'next/server'
import { autenticarUsuario, verificarOrganizador, logErro} from '@/lib/supabase/api-helpers'
import { AtualizarDiaDeEventoPayload } from '@/types'

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

/**
 * PATCH /api/dia-de-evento/[id]
 * Edita nome, data, hora de abertura e/ou duração de um DiaDeEvento. Requer role='organizador'.
 * Não altera o `codigo_do_dia` — use a rota /ativar para isso.
 *
 * @body {AtualizarDiaDeEventoPayload}
 * @returns 200 com o DiaDeEvento atualizado.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  let body: AtualizarDiaDeEventoPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'corpo_invalido' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (body.nome !== undefined) updates.nome = body.nome?.trim() || null
  if (body.data !== undefined) updates.data = body.data
  if (body.horaAbertura !== undefined) updates.hora_abertura = body.horaAbertura
  if (body.duracaoMinutos !== undefined) updates.duracao_minutos = body.duracaoMinutos

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ erro: 'nenhum_campo_para_atualizar' }, { status: 400 })
  }

  const { data: dia, error } = await auth.supabase
    .from('dias_de_evento')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ erro: 'dia_nao_encontrado' }, { status: 404 })
    }
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ dia })
}

/**
 * DELETE /api/dia-de-evento/[id]
 * Remove um DiaDeEvento e todas as suas Presenças (cascade). Requer role='organizador'.
 *
 * @returns 204 sem corpo.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  const { error } = await auth.supabase
    .from('dias_de_evento')
    .delete()
    .eq('id', id)

  if (error) {
    logErro('/dia-de-evento/[id]', error)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
