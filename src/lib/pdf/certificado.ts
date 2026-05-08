import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { DadosCertificado, DadosCertificadoDia } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
 * - Todos os dias do evento com indicação de presença (✓) ou ausência (✗)
 * - Total de dias presentes / total de dias
 * - Data de geração
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
  const verde = rgb(0.1, 0.6, 0.2)
  const vermelho = rgb(0.7, 0.1, 0.1)

  // Bordas decorativas
  page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: azulEscuro, borderWidth: 3 })
  page.drawRectangle({ x: 28, y: 28, width: width - 56, height: height - 56, borderColor: cinzaClaro, borderWidth: 1 })

  // Título
  page.drawText('CERTIFICADO DE PARTICIPACAO', {
    x: 60, y: height - 100, size: 28, font: helveticaBold, color: azulEscuro,
  })

  // Nome do evento
  page.drawText(dados.nomeEvento, {
    x: 60, y: height - 130, size: 16, font: helvetica, color: cinzaEscuro,
  })

  page.drawLine({ start: { x: 60, y: height - 148 }, end: { x: width - 60, y: height - 148 }, thickness: 1, color: cinzaClaro })

  // Participante
  page.drawText('Certificamos que', { x: 60, y: height - 180, size: 12, font: helvetica, color: cinzaEscuro })
  page.drawText(dados.nomeParticipante, { x: 60, y: height - 205, size: 20, font: helveticaBold, color: azulEscuro })
  page.drawText(`(${dados.emailParticipante})`, { x: 60, y: height - 225, size: 11, font: helvetica, color: cinzaEscuro })

  page.drawText(
    `participou de ${dados.diasPresentes} de ${dados.totalDias} dia${dados.totalDias !== 1 ? 's' : ''} do evento.`,
    { x: 60, y: height - 252, size: 12, font: helvetica, color: cinzaEscuro }
  )

  // Linha separadora antes dos dias
  page.drawLine({ start: { x: 60, y: height - 268 }, end: { x: width / 2 - 20, y: height - 268 }, thickness: 0.5, color: cinzaClaro })

  // Lista de dias com presença/ausência (duas colunas se mais de 4 dias)
  const COL1_X = 60
  const COL2_X = width / 2
  const START_Y = height - 290
  const LINE_H = 22

  dados.dias.forEach((dia, i) => {
    const colX = i < 4 ? COL1_X : COL2_X
    const lineY = START_Y - (i % 4) * LINE_H
    const marcador = dia.presente ? '[+]' : '[ ]'
    const cor = dia.presente ? verde : vermelho
    const nomeDia = dia.nome ? `${dia.nome} — ` : ''
    const texto = `${nomeDia}${formatarDataCertificado(dia.data)}`

    page.drawText(marcador, { x: colX, y: lineY, size: 12, font: helveticaBold, color: cor })
    page.drawText(texto, { x: colX + 18, y: lineY, size: 11, font: helvetica, color: cinzaEscuro })
  })

  // Data de emissão
  const dataEmissao = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  page.drawText(`Emitido em ${dataEmissao}`, { x: 60, y: 50, size: 10, font: helvetica, color: cinzaClaro })

  return pdfDoc.save()
}

/**
 * Gera certificado de participação em um único dia do evento.
 */
export async function gerarCertificadoDia(dados: DadosCertificadoDia): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([842, 595]) // A4 landscape

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const { width, height } = page.getSize()
  const azulEscuro = rgb(0.1, 0.2, 0.5)
  const cinzaEscuro = rgb(0.3, 0.3, 0.3)
  const cinzaClaro = rgb(0.7, 0.7, 0.7)
  const verde = rgb(0.1, 0.6, 0.2)

  // Bordas decorativas
  page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: azulEscuro, borderWidth: 3 })
  page.drawRectangle({ x: 28, y: 28, width: width - 56, height: height - 56, borderColor: cinzaClaro, borderWidth: 1 })

  // Título
  page.drawText('CERTIFICADO DE PARTICIPACAO', {
    x: 60, y: height - 100, size: 28, font: helveticaBold, color: azulEscuro,
  })

  // Nome do evento
  page.drawText(dados.nomeEvento, {
    x: 60, y: height - 130, size: 16, font: helvetica, color: cinzaEscuro,
  })

  page.drawLine({ start: { x: 60, y: height - 148 }, end: { x: width - 60, y: height - 148 }, thickness: 1, color: cinzaClaro })

  // Participante
  page.drawText('Certificamos que', { x: 60, y: height - 185, size: 12, font: helvetica, color: cinzaEscuro })
  page.drawText(dados.nomeParticipante, { x: 60, y: height - 215, size: 24, font: helveticaBold, color: azulEscuro })
  page.drawText(`(${dados.emailParticipante})`, { x: 60, y: height - 240, size: 11, font: helvetica, color: cinzaEscuro })

  page.drawLine({ start: { x: 60, y: height - 265 }, end: { x: width - 60, y: height - 265 }, thickness: 0.5, color: cinzaClaro })

  // Dia participado
  const nomeDia = dados.nomeDia ?? 'Dia do evento'
  const dataFormatada = formatarDataCertificado(dados.dataDia)

  page.drawText('participou de', { x: 60, y: height - 300, size: 13, font: helvetica, color: cinzaEscuro })
  page.drawText(nomeDia, { x: 60, y: height - 328, size: 20, font: helveticaBold, color: verde })
  page.drawText(dataFormatada, { x: 60, y: height - 355, size: 14, font: helvetica, color: cinzaEscuro })

  // Data de emissão
  const dataEmissao = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  page.drawText(`Emitido em ${dataEmissao}`, { x: 60, y: 50, size: 10, font: helvetica, color: cinzaClaro })

  return pdfDoc.save()
}

/**
 * Inicia o download do Certificado PDF no browser.
 */
export function baixarCertificado(pdfBytes: Uint8Array, nomeArquivo = 'certificado-sipat.pdf'): void {
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
