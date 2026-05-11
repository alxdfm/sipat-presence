import { NextRequest, NextResponse } from 'next/server'
import { verificarOrganizador, logErro} from '@/lib/supabase/api-helpers'
import { gerarQRCode, gerarUrlPresenca } from '@/lib/qr/gerar-qr'

/**
 * GET /api/qr/[id]
 *
 * Gera e retorna o Data URL (base64 PNG) do QR code de um DiaDeEvento ativado.
 * Restrito a Organizadores — o QR code embute o CodigoDoDia e não deve ser
 * acessível a Participantes via API direta.
 *
 * @param params.id - ID do DiaDeEvento.
 * @returns `{ qrCodeDataUrl: string }` ou erro 404/422/403.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  const { data: dia, error } = await auth.supabase
    .from('dias_de_evento')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !dia) {
    return NextResponse.json({ erro: 'dia_nao_encontrado' }, { status: 404 })
  }

  if (!dia.codigo_do_dia) {
    return NextResponse.json({ erro: 'dia_nao_ativado' }, { status: 422 })
  }

  const origin = new URL(request.url).origin
  const [qrCodeDataUrl, presencaUrl] = await Promise.all([
    gerarQRCode(dia.id, dia.codigo_do_dia, origin),
    Promise.resolve(gerarUrlPresenca(dia.id, dia.codigo_do_dia, origin)),
  ])

  return NextResponse.json({ qrCodeDataUrl, presencaUrl })
}
