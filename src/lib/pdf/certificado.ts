import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { DadosCertificado } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Formata uma data ISO para exibição no Certificado.
 *
 * @param dataIso - Data no formato "YYYY-MM-DD".
 * @returns Data formatada em português, ex: "07 de maio de 2026".
 */
function formatarDataCertificado(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)
  return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

/**
 * Gera o Certificado de participação em SIPAT como PDF no browser usando pdf-lib.
 * O PDF é criado inteiramente client-side — nenhum dado é enviado a um servidor.
 *
 * O Certificado inclui:
 * - Nome e email do Participante
 * - Nome do Evento
 * - Lista de dias com Presença registrada
 * - Total de dias participados
 * - Data de geração
 *
 * @param dados - Dados do Participante, Evento e Presenças para montar o certificado.
 * @returns Promise com o Uint8Array do arquivo PDF gerado.
 * @throws {Error} Se a geração do PDF falhar por qualquer motivo interno do pdf-lib.
 * @example
 * const pdfBytes = await gerarCertificado({
 *   nomeParticipante: 'João Silva',
 *   emailParticipante: 'joao@empresa.com',
 *   nomeEvento: 'SIPAT 2026',
 *   presencas: [{ data: '2026-05-07', registrada_em: '2026-05-07T08:15:00Z' }],
 *   totalDias: 1,
 * })
 * // Use para download: URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }))
 */
export async function gerarCertificado(dados: DadosCertificado): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([842, 595]) // A4 landscape

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const { width, height } = page.getSize()
  const azulEscuro = rgb(0.1, 0.2, 0.5)
  const cinzaEscuro = rgb(0.3, 0.3, 0.3)
  const cinzaClaro = rgb(0.7, 0.7, 0.7)

  // Borda decorativa
  page.drawRectangle({
    x: 20, y: 20,
    width: width - 40, height: height - 40,
    borderColor: azulEscuro,
    borderWidth: 3,
  })
  page.drawRectangle({
    x: 28, y: 28,
    width: width - 56, height: height - 56,
    borderColor: cinzaClaro,
    borderWidth: 1,
  })

  // Título
  page.drawText('CERTIFICADO DE PARTICIPACAO', {
    x: 60, y: height - 100,
    size: 28,
    font: helveticaBold,
    color: azulEscuro,
  })

  // Subtítulo (nome do evento)
  page.drawText(dados.nomeEvento, {
    x: 60, y: height - 135,
    size: 16,
    font: helvetica,
    color: cinzaEscuro,
  })

  // Linha separadora
  page.drawLine({
    start: { x: 60, y: height - 150 },
    end: { x: width - 60, y: height - 150 },
    thickness: 1,
    color: cinzaClaro,
  })

  // Texto principal
  page.drawText('Certificamos que', {
    x: 60, y: height - 190,
    size: 12,
    font: helvetica,
    color: cinzaEscuro,
  })

  page.drawText(dados.nomeParticipante, {
    x: 60, y: height - 215,
    size: 20,
    font: helveticaBold,
    color: azulEscuro,
  })

  page.drawText(`(${dados.emailParticipante})`, {
    x: 60, y: height - 238,
    size: 11,
    font: helvetica,
    color: cinzaEscuro,
  })

  page.drawText(
    `participou de ${dados.totalDias} dia${dados.totalDias > 1 ? 's' : ''} do evento.`,
    {
      x: 60, y: height - 265,
      size: 12,
      font: helvetica,
      color: cinzaEscuro,
    }
  )

  // Lista de presenças
  page.drawText('Dias com presenca registrada:', {
    x: 60, y: height - 300,
    size: 11,
    font: helveticaBold,
    color: cinzaEscuro,
  })

  dados.presencas.forEach((p, index) => {
    page.drawText(`- ${formatarDataCertificado(p.data)}`, {
      x: 75, y: height - 320 - index * 18,
      size: 11,
      font: helvetica,
      color: cinzaEscuro,
    })
  })

  // Data de emissão
  const dataEmissao = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  page.drawText(`Emitido em ${dataEmissao}`, {
    x: 60, y: 60,
    size: 10,
    font: helvetica,
    color: cinzaClaro,
  })

  return pdfDoc.save()
}

/**
 * Inicia o download do Certificado PDF no browser.
 * Cria um link temporário, clica automaticamente e o remove.
 *
 * @param pdfBytes - Bytes do PDF gerado por `gerarCertificado`.
 * @param nomeArquivo - Nome sugerido para o arquivo. Padrão: "certificado-sipat.pdf".
 * @example
 * const bytes = await gerarCertificado(dados)
 * baixarCertificado(bytes, 'certificado-joao-silva.pdf')
 */
export function baixarCertificado(
  pdfBytes: Uint8Array,
  nomeArquivo = 'certificado-sipat.pdf'
): void {
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
