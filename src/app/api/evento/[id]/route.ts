import { NextRequest, NextResponse } from 'next/server'
import { verificarOrganizador, logErro} from '@/lib/supabase/api-helpers'

/**
 * PATCH /api/evento/[id]
 * Edita nome e/ou descrição de um Evento existente. Requer role='organizador'.
 *
 * @body `{ nome?: string; descricao?: string | null }`
 * @returns 200 com o Evento atualizado, ou 404 se não encontrado.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  let body: { nome?: string; descricao?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'corpo_invalido' }, { status: 400 })
  }

  const updates: { nome?: string; descricao?: string | null } = {}
  if (body.nome !== undefined) {
    const nome = body.nome.trim()
    if (!nome) return NextResponse.json({ erro: 'nome_obrigatorio' }, { status: 400 })
    updates.nome = nome
  }
  if (body.descricao !== undefined) {
    updates.descricao = body.descricao?.trim() ?? null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ erro: 'nenhum_campo_para_atualizar' }, { status: 400 })
  }

  const { data: evento, error } = await auth.supabase
    .from('eventos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ erro: 'evento_nao_encontrado' }, { status: 404 })
    }
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ evento })
}

/**
 * DELETE /api/evento/[id]
 * Remove um Evento e todos os seus DiaDeEvento e Presenças (cascade). Requer role='organizador'.
 *
 * @returns 204 sem corpo, ou 404 se não encontrado.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  const { error } = await auth.supabase
    .from('eventos')
    .delete()
    .eq('id', id)

  if (error) {
    logErro('/evento/[id]', error)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
