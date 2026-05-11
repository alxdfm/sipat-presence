import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'
import { autenticarUsuario, logErro} from '@/lib/supabase/api-helpers'
import { validarCodigoDoDia } from '@/lib/qr/codigo-do-dia'
import { checkRateLimit } from '@/lib/rate-limit'
import { RegistrarPresencaPayload } from '@/types'

/**
 * POST /api/presenca
 *
 * Registra a Presença de um Participante autenticado em um DiaDeEvento.
 *
 * Validações (nesta ordem):
 * 1. Rate limit por IP (10 req/min)
 * 2. Participante autenticado
 * 3. Email do participante está na lista de colaboradores autorizados
 * 4. Campos obrigatórios presentes
 * 5. DiaDeEvento existe
 * 6. CodigoDoDia está ativado e válido
 * 7. Momento atual está dentro da JanelaDeTempo
 * 8. Presença ainda não registrada — idempotente, retorna 200 se já existia
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rateLimit = checkRateLimit(`presenca:${ip}`, 10, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { erro: 'muitas_requisicoes' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
    )
  }

  const auth = await autenticarUsuario()
  if (!auth.ok) return auth.response

  // Valida se o email do participante está autorizado
  const adminSupabase = createAdminSupabase()
  const { data: autorizado } = await adminSupabase
    .from('colaboradores_autorizados')
    .select('id')
    .eq('email', auth.usuario.email)
    .maybeSingle()

  if (!autorizado) {
    return NextResponse.json({ erro: 'email_nao_autorizado' }, { status: 403 })
  }

  let body: RegistrarPresencaPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'corpo_invalido' }, { status: 400 })
  }

  const { diaDeEventoId, codigoDoDia } = body

  if (!diaDeEventoId || !codigoDoDia) {
    return NextResponse.json({ erro: 'campos_obrigatorios' }, { status: 400 })
  }

  const { data: dia, error: erroDia } = await auth.supabase
    .from('dias_de_evento')
    .select('*')
    .eq('id', diaDeEventoId)
    .single()

  if (erroDia || !dia) {
    return NextResponse.json({ erro: 'dia_nao_encontrado' }, { status: 404 })
  }

  const resultado = validarCodigoDoDia(dia, codigoDoDia)
  if (!resultado.valido) {
    return NextResponse.json({ erro: resultado.motivo }, { status: 422 })
  }

  const { data: presenca, error: erroInsercao } = await adminSupabase
    .from('presencas')
    .insert({ participante_id: auth.usuario.id, dia_de_evento_id: diaDeEventoId })
    .select()
    .single()

  if (erroInsercao) {
    if (erroInsercao.code === '23505') {
      return NextResponse.json({ aviso: 'presenca_duplicada' }, { status: 200 })
    }
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ presenca }, { status: 201 })
}
