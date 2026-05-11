import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'
import { autenticarUsuario, logErro } from '@/lib/supabase/api-helpers'
import { validarCodigoDoDia } from '@/lib/qr/codigo-do-dia'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/presenca/codigo
 *
 * Registra presença a partir de código digitado manualmente.
 * Busca o dia ativo pelo código sem precisar do ID do dia.
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

  const adminSupabase = createAdminSupabase()
  const { data: autorizado } = await adminSupabase
    .from('colaboradores_autorizados')
    .select('id')
    .eq('email', auth.usuario.email)
    .maybeSingle()

  if (!autorizado) {
    return NextResponse.json({ erro: 'email_nao_autorizado' }, { status: 403 })
  }

  let codigoDoDia: string
  try {
    const body = await request.json()
    codigoDoDia = body.codigoDoDia?.trim() ?? ''
  } catch {
    return NextResponse.json({ erro: 'corpo_invalido' }, { status: 400 })
  }

  if (!codigoDoDia) {
    return NextResponse.json({ erro: 'campos_obrigatorios' }, { status: 400 })
  }

  // Busca todos os dias com esse código — pode haver mais de um evento ativo
  const { data: dias, error: erroDias } = await auth.supabase
    .from('dias_de_evento')
    .select('*')
    .eq('codigo_do_dia', codigoDoDia)

  if (erroDias) {
    logErro('presenca/codigo GET dias', erroDias)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  if (!dias || dias.length === 0) {
    return NextResponse.json({ erro: 'codigo_incorreto' }, { status: 422 })
  }

  // Usa o primeiro dia cujo código ainda está dentro da janela de tempo
  const diaValido = dias.find(d => validarCodigoDoDia(d, codigoDoDia).valido)

  if (!diaValido) {
    // Código existe mas fora da janela
    const motivo = validarCodigoDoDia(dias[0], codigoDoDia).motivo ?? 'fora_da_janela'
    return NextResponse.json({ erro: motivo }, { status: 422 })
  }

  const { data: presenca, error: erroInsercao } = await adminSupabase
    .from('presencas')
    .insert({ participante_id: auth.usuario.id, dia_de_evento_id: diaValido.id })
    .select()
    .single()

  if (erroInsercao) {
    if (erroInsercao.code === '23505') {
      return NextResponse.json({ aviso: 'presenca_duplicada' }, { status: 200 })
    }
    logErro('presenca/codigo INSERT presenca', erroInsercao)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ presenca }, { status: 201 })
}
