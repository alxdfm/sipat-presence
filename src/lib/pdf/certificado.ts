import { PDFDocument, PDFPage, PDFFont, PDFImage, StandardFonts, rgb } from 'pdf-lib'
import { DadosCertificado, DadosCertificadoDia } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function formatarDataCertificado(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)
  return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

type PdfColor = ReturnType<typeof rgb>

// Paleta da identidade visual Vixting / CIPA
const AZUL    = rgb(0,        174 / 255, 239 / 255) // #00AEEF — azul Vixting
const TEAL    = rgb(0,        181 / 255, 157 / 255) // #00B59D — verde CIPA/Vixting
const CINZA_E = rgb(0.15, 0.15, 0.15)
const CINZA_M = rgb(0.42, 0.42, 0.42)
const CINZA_C = rgb(0.82, 0.82, 0.82)
const BRANCO  = rgb(1, 1, 1)

async function carregarImg(pdfDoc: PDFDocument, caminho: string): Promise<PDFImage | null> {
  try {
    const bytes = await fetch(caminho).then(r => r.arrayBuffer())
    return pdfDoc.embedPng(bytes)
  } catch {
    return null
  }
}

interface Recursos {
  pdfDoc:      PDFDocument
  page:        PDFPage
  width:       number
  height:      number
  bold:        PDFFont
  regular:     PDFFont
  italic:      PDFFont
  centralizar: (text: string, y: number, size: number, font: PDFFont, color: PdfColor) => void
}

async function criarBase(): Promise<Recursos> {
  const pdfDoc = await PDFDocument.create()
  const page   = pdfDoc.addPage([842, 595]) // A4 paisagem
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const italic  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
  const { width, height } = page.getSize()

  function centralizar(text: string, y: number, size: number, font: PDFFont, color: PdfColor) {
    const tw = font.widthOfTextAtSize(text, size)
    page.drawText(text, { x: Math.round((width - tw) / 2), y, size, font, color })
  }

  return { pdfDoc, page, width, height, bold, regular, italic, centralizar }
}

// Desenha a estrutura visual comum (bordas, faixa, logos, linha separadora).
// Retorna o Y da linha separadora abaixo dos logos.
async function desenharEstrutura(
  rec:         Recursos,
  logoCipa:    PDFImage | null,
  logoVixting: PDFImage | null,
): Promise<number> {
  const { page, width, height, bold, centralizar } = rec

  // Borda dupla: azul externa + teal interna
  page.drawRectangle({ x: 12, y: 12, width: width - 24, height: height - 24, borderColor: AZUL, borderWidth: 2.5 })
  page.drawRectangle({ x: 19, y: 19, width: width - 38, height: height - 38, borderColor: TEAL, borderWidth: 1 })

  // Faixa teal de cabeçalho
  const FAIXA_H = 34
  const FAIXA_Y = height - 12 - FAIXA_H
  page.drawRectangle({ x: 12, y: FAIXA_Y, width: width - 24, height: FAIXA_H, color: TEAL })
  centralizar(
    '',
    FAIXA_Y + Math.round((FAIXA_H - 11) / 2) - 1,
    11, bold, BRANCO,
  )

  // Área de logos entre a faixa e o conteúdo (70 px de altura)
  const LOGO_TOP = FAIXA_Y       // topo da área = fundo da faixa
  const LOGO_H   = 72
  const LOGO_BOT = LOGO_TOP - LOGO_H

  // Logo CIPA (esquerda)
  if (logoCipa) {
    const h = 62
    const w = (logoCipa.width / logoCipa.height) * h
    page.drawImage(logoCipa, { x: 30, y: LOGO_BOT + Math.round((LOGO_H - h) / 2), width: w, height: h })
  }

  // Logo Vixting (direita) — exibido grande para boa visibilidade
  if (logoVixting) {
    const h = 50
    const w = (logoVixting.width / logoVixting.height) * h
    page.drawImage(logoVixting, { x: width - 32 - w, y: LOGO_BOT + Math.round((LOGO_H - h) / 2), width: w, height: h })
  }

  // Linha teal separando logos do conteúdo
  page.drawLine({ start: { x: 22, y: LOGO_BOT }, end: { x: width - 22, y: LOGO_BOT }, thickness: 1.2, color: TEAL })

  return LOGO_BOT
}

function desenharRodape({ page, width, regular }: Recursos) {
  page.drawLine({ start: { x: 22, y: 38 }, end: { x: width - 22, y: 38 }, thickness: 0.8, color: TEAL })
  const dataEmissao = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  page.drawText(`Emitido em ${dataEmissao}`, { x: 30, y: 22, size: 8, font: regular, color: CINZA_M })
}

/**
 * Gera o certificado de participação em um único dia da SIPAT.
 */
export async function gerarCertificadoDia(dados: DadosCertificadoDia): Promise<Uint8Array> {
  const rec = await criarBase()
  const { pdfDoc, page, width, bold, regular, italic, centralizar } = rec

  const [logoCipa, logoVixting] = await Promise.all([
    carregarImg(pdfDoc, '/cipa-logo-1.png'),
    carregarImg(pdfDoc, '/vixting-by-sankhya.png'),
  ])

  const BASE = await desenharEstrutura(rec, logoCipa, logoVixting)

  // ── Título ────────────────────────────────────────────────
  centralizar('CERTIFICADO DE PARTICIPAÇÃO', BASE - 42, 28, bold, AZUL)
  const titleW = bold.widthOfTextAtSize('CERTIFICADO DE PARTICIPAÇÃO', 28)
  page.drawLine({
    start: { x: Math.round((width - titleW) / 2), y: BASE - 51 },
    end:   { x: Math.round((width + titleW) / 2), y: BASE - 51 },
    thickness: 2.5, color: TEAL,
  })

  // ── Texto institucional ───────────────────────────────────
  centralizar('A Comissão Interna de Prevenção de Acidentes', BASE - 77, 11, regular, CINZA_M)
  centralizar('CIPA — Gestão 1.25/26', BASE - 92,  11, bold,    TEAL)
  centralizar('certifica que',          BASE - 118, 12, italic,  CINZA_M)

  // ── Nome do participante ──────────────────────────────────
  page.drawLine({ start: { x: 55, y: BASE - 131 }, end: { x: width - 55, y: BASE - 131 }, thickness: 0.8, color: CINZA_C })
  const nomeSize = dados.nomeParticipante.length > 36 ? 19
                 : dados.nomeParticipante.length > 26 ? 22 : 26
  centralizar(dados.nomeParticipante, BASE - 163, nomeSize, bold, CINZA_E)
  page.drawLine({ start: { x: 55, y: BASE - 174 }, end: { x: width - 55, y: BASE - 174 }, thickness: 0.8, color: CINZA_C })
  centralizar(dados.emailParticipante, BASE - 189, 9.5, regular, CINZA_M)

  // ── Dia participado ───────────────────────────────────────
  centralizar('participou do dia', BASE - 215, 12, italic, CINZA_M)

  const nomeDia = dados.nomeDia ?? 'Dia do Evento'
  centralizar(nomeDia, BASE - 245, 22, bold, AZUL)
  centralizar(formatarDataCertificado(dados.dataDia), BASE - 268, 13, regular, CINZA_E)

  // ── Contexto SIPAT ────────────────────────────────────────
  page.drawLine({ start: { x: 100, y: BASE - 284 }, end: { x: width - 100, y: BASE - 284 }, thickness: 0.5, color: CINZA_C })
  centralizar('da Semana Interna de Prevenção de Acidentes do Trabalho — SIPAT', BASE - 304, 10, regular, CINZA_M)
  centralizar('realizada de 18 a 22 de maio de 2026, organizada pela CIPA.',     BASE - 319, 10, regular, CINZA_M)
  centralizar(dados.nomeEvento, BASE - 334, 10, bold, CINZA_E)

  desenharRodape(rec)
  return rec.pdfDoc.save()
}

/**
 * Gera o certificado com resumo de presença em todos os dias da SIPAT.
 */
export async function gerarCertificado(dados: DadosCertificado): Promise<Uint8Array> {
  const rec = await criarBase()
  const { pdfDoc, page, width, bold, regular, italic, centralizar } = rec

  const [logoCipa, logoVixting] = await Promise.all([
    carregarImg(pdfDoc, '/cipa-logo-1.png'),
    carregarImg(pdfDoc, '/vixting-by-sankhya.png'),
  ])

  const BASE = await desenharEstrutura(rec, logoCipa, logoVixting)

  // ── Título ────────────────────────────────────────────────
  centralizar('CERTIFICADO DE PARTICIPAÇÃO', BASE - 42, 28, bold, AZUL)
  const titleW = bold.widthOfTextAtSize('CERTIFICADO DE PARTICIPAÇÃO', 28)
  page.drawLine({
    start: { x: Math.round((width - titleW) / 2), y: BASE - 51 },
    end:   { x: Math.round((width + titleW) / 2), y: BASE - 51 },
    thickness: 2.5, color: TEAL,
  })

  // ── Texto institucional ───────────────────────────────────
  centralizar('A Comissão Interna de Prevenção de Acidentes — CIPA — Gestão 1.25/26', BASE - 77, 11, regular, CINZA_M)
  centralizar('certifica que', BASE - 100, 12, italic, CINZA_M)

  // ── Nome do participante ──────────────────────────────────
  page.drawLine({ start: { x: 55, y: BASE - 113 }, end: { x: width - 55, y: BASE - 113 }, thickness: 0.8, color: CINZA_C })
  const nomeSize = dados.nomeParticipante.length > 36 ? 19
                 : dados.nomeParticipante.length > 26 ? 22 : 25
  centralizar(dados.nomeParticipante, BASE - 143, nomeSize, bold, CINZA_E)
  page.drawLine({ start: { x: 55, y: BASE - 154 }, end: { x: width - 55, y: BASE - 154 }, thickness: 0.8, color: CINZA_C })
  centralizar(dados.emailParticipante, BASE - 168, 9.5, regular, CINZA_M)

  // ── Resumo de presença ────────────────────────────────────
  const resumo = `participou de ${dados.diasPresentes} de ${dados.totalDias} dia${dados.totalDias !== 1 ? 's' : ''} da SIPAT`
  centralizar(resumo, BASE - 193, 12, italic, CINZA_M)

  // ── Lista de dias (duas colunas) ──────────────────────────
  const LINE_H    = 19
  const colsCount = Math.ceil(dados.dias.length / 2)
  const COL1_X    = Math.round(width / 2 - 270)
  const COL2_X    = Math.round(width / 2 + 10)
  const LISTA_Y   = BASE - 222

  dados.dias.forEach((dia, i) => {
    const colX  = i < colsCount ? COL1_X : COL2_X
    const lineY = LISTA_Y - (i % colsCount) * LINE_H
    const cor   = dia.presente ? TEAL : CINZA_C
    const marker = dia.presente ? '[+]' : '[ ]'
    const texto  = `${dia.nome ? dia.nome + ' — ' : ''}${formatarDataCertificado(dia.data)}`
    page.drawText(marker, { x: colX, y: lineY, size: 10, font: bold,    color: cor })
    page.drawText(texto,  { x: colX + 26, y: lineY, size: 9.5, font: regular, color: CINZA_E })
  })

  // ── Contexto SIPAT ────────────────────────────────────────
  const botLista = LISTA_Y - Math.max(0, colsCount - 1) * LINE_H - 22
  page.drawLine({ start: { x: 100, y: botLista }, end: { x: width - 100, y: botLista }, thickness: 0.5, color: CINZA_C })
  centralizar('Semana Interna de Prevenção de Acidentes do Trabalho — SIPAT', botLista - 18, 10, regular, CINZA_M)
  centralizar('18 a 22 de maio de 2026 — ' + dados.nomeEvento, botLista - 32, 10, bold, CINZA_E)

  desenharRodape(rec)
  return rec.pdfDoc.save()
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
