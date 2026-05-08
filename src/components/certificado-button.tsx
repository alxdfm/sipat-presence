'use client'

import { useState } from 'react'
import { gerarCertificado, baixarCertificado } from '@/lib/pdf/certificado'
import { Participante, PresencaEnriquecida, DadosCertificado } from '@/types'
import { useToast } from './toast'

interface Props {
  participante: Participante | null
  presencas: PresencaEnriquecida[]
}

/**
 * Botão que gera e baixa o Certificado PDF do Participante no browser.
 * Busca todos os dias do evento (presentes e ausentes) antes de gerar o PDF.
 */
export default function CertificadoButton({ participante, presencas }: Props) {
  const [gerando, setGerando] = useState(false)
  const { showToast } = useToast()

  const eventoId = presencas[0]?.dia_de_evento?.evento?.id
  const podeGerar = !!participante && presencas.length > 0 && !!eventoId

  async function handleGerarCertificado() {
    if (!podeGerar) return
    setGerando(true)

    try {
      const res = await fetch(`/api/certificado/${eventoId}`)
      if (!res.ok) {
        showToast('Erro ao buscar dados do certificado. Tente novamente.', 'error')
        return
      }

      const { evento, dias, diasPresentes, totalDias } = await res.json()

      const dados: DadosCertificado = {
        nomeParticipante: participante!.nome ?? participante!.email,
        emailParticipante: participante!.email,
        nomeEvento: evento?.nome ?? 'SIPAT',
        dias,
        diasPresentes,
        totalDias,
      }

      const pdfBytes = await gerarCertificado(dados)
      const nomeArquivo = `certificado-sipat-${participante!.nome?.toLowerCase().replace(/\s+/g, '-') ?? 'participante'}.pdf`
      baixarCertificado(pdfBytes, nomeArquivo)
    } catch {
      showToast('Falha ao gerar o certificado. Tente novamente.', 'error')
    } finally {
      setGerando(false)
    }
  }

  return (
    <button
      onClick={handleGerarCertificado}
      disabled={gerando || !podeGerar}
      className="w-full bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {gerando ? 'Gerando certificado...' : 'Baixar Certificado PDF'}
    </button>
  )
}
