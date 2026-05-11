import { NextRequest, NextResponse } from 'next/server'
import { autenticarUsuario, verificarOrganizador, logErro} from '@/lib/supabase/api-helpers'
import { CriarEventoPayload } from '@/types'

/**
 * GET /api/evento
 * Lista todos os Eventos ordenados por data de criação (mais recente primeiro).
 * Requer autenticação — qualquer Participante pode listar.
 *
 * @returns Array de Evento.
 */
export async function GET() {
  const auth = await autenticarUsuario()
  if (!auth.ok) return auth.response

  const { data: eventos, error } = await auth.supabase
    .from('eventos')
    .select('*')
    .order('criado_em', { ascending: false })

  if (error) {
    logErro('/evento', error)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ eventos })
}

/**
 * POST /api/evento
 * Cria um novo Evento. Requer role='organizador'.
 *
 * @body {CriarEventoPayload} - nome (obrigatório) + descricao (opcional)
 * @returns 201 com o Evento criado.
 */
export async function POST(request: NextRequest) {
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  let body: CriarEventoPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'corpo_invalido' }, { status: 400 })
  }

  if (!body.nome?.trim()) {
    return NextResponse.json({ erro: 'nome_obrigatorio' }, { status: 400 })
  }

  const { data: evento, error } = await auth.supabase
    .from('eventos')
    .insert({ nome: body.nome.trim(), descricao: body.descricao?.trim() ?? null })
    .select()
    .single()

  if (error) {
    logErro('/evento', error)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ evento }, { status: 201 })
}
