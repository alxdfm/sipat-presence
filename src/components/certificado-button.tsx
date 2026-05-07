'use client'

import { useState } from 'react'
import { gerarCertificado, baixarCertificado } from '@/lib/pdf/certificado'
import { Participante, PresencaEnriquecida, DadosCertificado } from '@/types'

interface Props {
  participante: Participante | null
  presencas: PresencaEnriquecida[]
}

/**
 * Botão que gera e baixa o Certificado PDF do Participante no browser.
 * Toda a geração acontece client-side via pdf-lib — nenhum dado é enviado ao servidor.
 */
export default function CertificadoButton({ participante, presencas }: Props) {
  const [gerando, setGerando] = useState(false)

  async function handleGerarCertificado() {
    if (!participante || presencas.length === 0) return
    setGerando(true)

    try {
      const nomeEvento = presencas[0]?.dia_de_evento?.evento?.nome ?? 'SIPAT'

      const dados: DadosCertificado = {
        nomeParticipante: participante.nome ?? participante.email,
        emailParticipante: participante.email,
        nomeEvento,
        presencas: presencas.map(p => ({
          data: p.dia_de_evento?.data ?? '',
          registrada_em: p.registrada_em,
        })),
        totalDias: presencas.length,
      }

      const pdfBytes = await gerarCertificado(dados)
      const nomeArquivo = `certificado-sipat-${participante.nome?.toLowerCase().replace(/\s+/g, '-') ?? 'participante'}.pdf`
      baixarCertificado(pdfBytes, nomeArquivo)
    } finally {
      setGerando(false)
    }
  }

  return (
    <button
      onClick={handleGerarCertificado}
      disabled={gerando || presencas.length === 0}
      className="w-full bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {gerando ? 'Gerando certificado...' : 'Baixar Certificado PDF'}
    </button>
  )
}
