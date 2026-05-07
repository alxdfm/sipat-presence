'use client'

import { useEffect, useState } from 'react'
import { Participante, PresencaEnriquecida } from '@/types'
import CertificadoButton from './certificado-button'
import { useLogout } from '@/hooks/use-logout'

interface Props {
  participante: Participante | null
}

/**
 * Conteúdo do Dashboard do Participante.
 * Busca as Presenças registradas e exibe lista de dias participados.
 * Oferece o botão para gerarCertificado quando há pelo menos uma Presença.
 */
export default function DashboardContent({ participante }: Props) {
  const [presencas, setPresencas] = useState<PresencaEnriquecida[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const logout = useLogout()

  useEffect(() => {
    fetch('/api/presenca/minhas')
      .then(r => {
        if (!r.ok) throw new Error('Falha ao buscar presenças')
        return r.json()
      })
      .then(d => setPresencas(d.presencas ?? []))
      .catch(() => setErro(true))
      .finally(() => setCarregando(false))
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Meu Dashboard</h1>
            <p className="text-gray-500 text-sm">{participante?.email}</p>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
            Sair
          </button>
        </div>

        {carregando ? (
          <p className="text-gray-400 text-center py-8">Carregando presenças...</p>
        ) : erro ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <p className="text-red-500">Não foi possível carregar suas presenças.</p>
            <p className="text-gray-400 text-sm mt-1">Tente recarregar a página.</p>
          </div>
        ) : presencas.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <p className="text-gray-500">Nenhuma presença registrada ainda.</p>
            <p className="text-gray-400 text-sm mt-1">Escaneie o QR code do evento para registrar.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm mb-6">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-700">
                  Presenças registradas ({presencas.length} dia{presencas.length > 1 ? 's' : ''})
                </h2>
              </div>
              <ul className="divide-y">
                {presencas.map(p => (
                  <li key={p.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800">{p.dia_de_evento?.evento?.nome}</p>
                      <p className="text-sm text-gray-500">{p.dia_de_evento?.data}</p>
                    </div>
                    <span className="text-green-600 text-sm font-medium">✓ Presente</span>
                  </li>
                ))}
              </ul>
            </div>
            <CertificadoButton participante={participante} presencas={presencas} />
          </>
        )}
      </div>
    </main>
  )
}
