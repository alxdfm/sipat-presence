'use client'

import { useEffect, useState } from 'react'
import { Participante, PresencaEnriquecida } from '@/types'
import CertificadoDiaButton from './certificado-dia-button'
import { useLogout } from '@/hooks/use-logout'
import { CardSkeleton } from './spinner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const MINIMO_DIAS_SORTEIO = 3

interface Props {
  participante: Participante | null
}

function formatarData(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split('-').map(Number)
  return format(new Date(ano, mes - 1, dia), "dd 'de' MMMM", { locale: ptBR })
}

export default function DashboardContent({ participante }: Props) {
  const [presencas, setPresencas] = useState<PresencaEnriquecida[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const { logout, carregando: saindo } = useLogout()

  useEffect(() => {
    fetch('/api/presenca/minhas')
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(d => setPresencas(d.presencas ?? []))
      .catch(() => setErro(true))
      .finally(() => setCarregando(false))
  }, [])

  const totalDias = presencas.length
  const elegivel = totalDias >= MINIMO_DIAS_SORTEIO
  const faltam = MINIMO_DIAS_SORTEIO - totalDias

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Minha Área</h1>
            <p className="text-gray-500 text-sm">{participante?.email}</p>
          </div>
          <button
            onClick={logout}
            disabled={saindo}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            {saindo ? 'Saindo...' : 'Sair'}
          </button>
        </div>

        {carregando ? (
          <CardSkeleton />
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
            {elegivel ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-green-800">Você é elegível para o sorteio!</p>
                  <p className="text-green-600 text-sm">
                    Participou de {totalDias} dia{totalDias > 1 ? 's' : ''} — mínimo de {MINIMO_DIAS_SORTEIO} atingido.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                <span className="text-amber-500 text-xl">◎</span>
                <div>
                  <p className="font-semibold text-amber-800">Ainda não elegível para o sorteio</p>
                  <p className="text-amber-600 text-sm">
                    Participe de mais {faltam} dia{faltam > 1 ? 's' : ''} para se qualificar.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-700">
                  Meus certificados ({totalDias} dia{totalDias > 1 ? 's' : ''})
                </h2>
              </div>
              <ul className="divide-y">
                {presencas.map(p => {
                  const dia = p.dia_de_evento
                  if (!dia) return null
                  return (
                    <li key={p.id} className="p-4 flex justify-between items-center gap-4">
                      <div>
                        <p className="font-medium text-gray-800">
                          {dia.nome ?? dia.evento?.nome ?? 'Dia do evento'}
                        </p>
                        <p className="text-sm text-gray-500">{formatarData(dia.data)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-green-600 text-sm font-medium">✓ Presente</span>
                        <CertificadoDiaButton
                          diaDeEventoId={dia.id}
                          nomeDia={dia.nome}
                          dataDia={dia.data}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
