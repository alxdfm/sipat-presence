'use client'

import { useEffect, useState } from 'react'

interface Props {
  diaId: string
}

/**
 * Componente que busca e exibe o QR code de um DiaDeEvento ativado.
 * Chama GET /api/qr/[id] para obter o Data URL da imagem.
 * So renderiza se o DiaDeEvento tiver CodigoDoDia ativado.
 */
export default function QrCodeDisplay({ diaId }: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/qr/${diaId}`)
      .then(r => r.json())
      .then(d => {
        if (d.qrCodeDataUrl) setQrUrl(d.qrCodeDataUrl)
        else setErro('Nao foi possivel gerar o QR code.')
      })
      .catch(() => setErro('Erro ao buscar QR code.'))
      .finally(() => setCarregando(false))
  }, [diaId])

  if (carregando) return <p className="text-sm text-gray-400">Gerando QR code...</p>
  if (erro) return <p className="text-sm text-red-500">{erro}</p>
  if (!qrUrl) return null

  return (
    <div className="flex flex-col items-center gap-3">
      <img src={qrUrl} alt="QR Code do dia" className="w-48 h-48" />
      <a
        href={qrUrl}
        download={`qrcode-${diaId}.png`}
        className="text-sm text-blue-600 hover:underline"
      >
        Baixar QR code
      </a>
    </div>
  )
}
