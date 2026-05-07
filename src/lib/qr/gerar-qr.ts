import QRCode from 'qrcode'

/**
 * Gera a URL que será embutida no QR code de um DiaDeEvento.
 * O CodigoDoDia é incluído como query param `code`.
 *
 * @param diaDeEventoId - ID do DiaDeEvento.
 * @param codigoDoDia - Código ativado pelo Organizador para este dia.
 * @param appUrl - URL base da aplicação. Padrão: NEXT_PUBLIC_APP_URL ou localhost:3000.
 * @returns URL completa no formato: `{appUrl}/presenca?dia={id}&code={codigo}`
 * @example
 * gerarUrlPresenca('abc-123', 'azul42')
 * // 'http://localhost:3000/presenca?dia=abc-123&code=azul42'
 */
export function gerarUrlPresenca(
  diaDeEventoId: string,
  codigoDoDia: string,
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
): string {
  const url = new URL('/presenca', appUrl)
  url.searchParams.set('dia', diaDeEventoId)
  url.searchParams.set('code', codigoDoDia)
  return url.toString()
}

/**
 * Gera a imagem do QR code como Data URL (base64 PNG) para exibição ou impressão.
 * Só deve ser chamada após o CodigoDoDia ter sido ativado pelo Organizador.
 *
 * @param diaDeEventoId - ID do DiaDeEvento.
 * @param codigoDoDia - Código ativado pelo Organizador para este dia.
 * @param appUrl - URL base da aplicação. Padrão: NEXT_PUBLIC_APP_URL ou localhost:3000.
 * @returns Promise com o Data URL da imagem PNG do QR code.
 * @throws {Error} Se a geração do QR code falhar.
 * @example
 * const dataUrl = await gerarQRCode('abc-123', 'azul42')
 * // 'data:image/png;base64,...'
 */
export async function gerarQRCode(
  diaDeEventoId: string,
  codigoDoDia: string,
  appUrl?: string
): Promise<string> {
  const url = gerarUrlPresenca(diaDeEventoId, codigoDoDia, appUrl)
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 400,
  })
}
