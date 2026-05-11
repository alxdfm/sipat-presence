import { NextRequest, NextResponse } from 'next/server'
import { verificarOrganizador, logErro} from '@/lib/supabase/api-helpers'
import { AtivarCodigoDoDiaPayload } from '@/types'

/** Limite máximo de caracteres do CodigoDoDia para evitar dados malformados. */
const CODIGO_MAX_LENGTH = 100

/**
 * PATCH /api/dia-de-evento/[id]/ativar
 *
 * Define o CodigoDoDia de um DiaDeEvento, "ativando-o" para o dia atual.
 * Após esta ação, o QR code pode ser gerado e o registro de Presença é habilitado.
 *
 * Pode ser chamado novamente para corrigir o código caso o Organizador tenha
 * digitado errado — o valor anterior é sobrescrito.
 *
 * @param params.id - ID do DiaDeEvento a ativar.
 * @body {AtivarCodigoDoDiaPayload} - codigoDoDia: string não vazia (máx. 100 chars).
 * @returns 200 com o DiaDeEvento atualizado, ou 400/403/404 em caso de erro.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  let body: AtivarCodigoDoDiaPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'corpo_invalido' }, { status: 400 })
  }

  const codigo = body.codigoDoDia?.trim()

  if (!codigo) {
    return NextResponse.json({ erro: 'codigo_obrigatorio' }, { status: 400 })
  }

  if (codigo.length > CODIGO_MAX_LENGTH) {
    return NextResponse.json(
      { erro: 'codigo_muito_longo', limite: CODIGO_MAX_LENGTH },
      { status: 400 }
    )
  }

  // Busca o DiaDeEvento para verificar se a data já passou
  const { data: diaAtual } = await auth.supabase
    .from('dias_de_evento')
    .select('data')
    .eq('id', id)
    .single()

  if (!diaAtual) {
    return NextResponse.json({ erro: 'dia_nao_encontrado' }, { status: 404 })
  }

  const hojeStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

  if (diaAtual.data < hojeStr) {
    return NextResponse.json({ erro: 'dia_no_passado' }, { status: 422 })
  }

  const { data: dia, error } = await auth.supabase
    .from('dias_de_evento')
    .update({ codigo_do_dia: codigo })
    .eq('id', id)
    .select()
    .single()

  // Supabase retorna error se o UPDATE não encontrar a linha (PGRST116)
  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ erro: 'dia_nao_encontrado' }, { status: 404 })
    }
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  if (!dia) {
    return NextResponse.json({ erro: 'dia_nao_encontrado' }, { status: 404 })
  }

  return NextResponse.json({ dia })
}
