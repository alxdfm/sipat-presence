'use client'

import { useState } from 'react'
import { gerarCertificadoDia, baixarCertificado } from '@/lib/pdf/certificado'
import { DadosCertificadoDia } from '@/types'
import { useToast } from './toast'

interface Props {
  diaDeEventoId: string
  nomeDia: string | null
  dataDia: string
}

export default function CertificadoDiaButton({ diaDeEventoId, nomeDia, dataDia }: Props) {
  const [gerando, setGerando] = useState(false)
  const { showToast } = useToast()

  async function handleGerar() {
    setGerando(true)
    try {
      const res = await fetch(`/api/certificado/dia/${diaDeEventoId}`)
      if (!res.ok) {
        showToast('Erro ao buscar dados do certificado.', 'error')
        return
      }

      const dados: DadosCertificadoDia = await res.json()
      const pdfBytes = await gerarCertificadoDia(dados)

      const slug = (nomeDia ?? dataDia).toLowerCase().replace(/\s+/g, '-')
      baixarCertificado(pdfBytes, `certificado-sipat-${slug}.pdf`)
    } catch {
      showToast('Falha ao gerar o certificado. Tente novamente.', 'error')
    } finally {
      setGerando(false)
    }
  }

  return (
    <button
      onClick={handleGerar}
      disabled={gerando}
      className="text-xs text-blue-700 hover:text-blue-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {gerando ? 'Gerando...' : 'Baixar certificado'}
    </button>
  )
}
