'use client'

import { useEffect, useState } from 'react'
import { useToast } from './toast'

interface Props {
  diaId: string
}

export default function QrCodeDisplay({ diaId }: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [presencaUrl, setPresencaUrl] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    fetch(`/api/qr/${diaId}`)
      .then(r => r.json())
      .then(d => {
        if (d.qrCodeDataUrl) {
          setQrUrl(d.qrCodeDataUrl)
          setPresencaUrl(d.presencaUrl ?? null)
        } else {
          setErro('Não foi possível gerar o QR code.')
        }
      })
      .catch(() => setErro('Erro ao buscar QR code.'))
      .finally(() => setCarregando(false))
  }, [diaId])

  async function copiarLink() {
    if (!presencaUrl) return
    try {
      await navigator.clipboard.writeText(presencaUrl)
      showToast('Link copiado!', 'success')
    } catch {
      showToast('Não foi possível copiar.', 'error')
    }
  }

  if (carregando) return <p className="text-sm text-gray-400">Gerando QR code...</p>
  if (erro) return <p className="text-sm text-red-500">{erro}</p>
  if (!qrUrl) return null

  return (
    <div className="flex flex-col items-center gap-3">
      <img src={qrUrl} alt="QR Code do dia" className="w-48 h-48" />

      {presencaUrl && (
        <div className="w-full max-w-sm">
          <p className="text-xs text-gray-500 mb-1">Link de presença</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1.5 rounded break-all">
              {presencaUrl}
            </code>
            <button
              onClick={copiarLink}
              className="flex-shrink-0 text-xs bg-blue-50 text-blue-700 px-2 py-1.5 rounded hover:bg-blue-100 font-medium"
            >
              Copiar
            </button>
          </div>
        </div>
      )}

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
