import { NextRequest, NextResponse } from 'next/server'
import { verificarOrganizador } from '@/lib/supabase/api-helpers'
import { gerarQRCode } from '@/lib/qr/gerar-qr'

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
  _request: NextRequest,
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

  const qrCodeDataUrl = await gerarQRCode(dia.id, dia.codigo_do_dia)

  return NextResponse.json({ qrCodeDataUrl })
}
