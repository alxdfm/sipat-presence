'use client'

import { useEffect, useState } from 'react'
import { ParticipanteComPresenca } from '@/types'

interface Props {
  diaId: string
}

interface DadosDia {
  participantes: ParticipanteComPresenca[]
  totalPresentes: number
  totalAusentes: number
}

/**
 * Componente expansível que exibe quais Participantes compareceram
 * e quais faltaram em um DiaDeEvento específico.
 *
 * Carrega os dados lazily ao expandir — evita N requisições desnecessárias
 * ao renderizar a lista de dias do admin.
 *
 * @param diaId - ID do DiaDeEvento cujos participantes serão listados.
 */
export default function ParticipantesDia({ diaId }: Props) {
  const [expandido, setExpandido] = useState(false)
  const [dados, setDados] = useState<DadosDia | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!expandido || dados) return

    setCarregando(true)
    fetch(`/api/dia-de-evento/${diaId}/participantes`)
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(d => setDados(d))
      .catch(() => setErro(true))
      .finally(() => setCarregando(false))
  }, [expandido, diaId, dados])

  const presentes = dados?.participantes.filter(p => p.presenca !== null) ?? []
  const ausentes = dados?.participantes.filter(p => p.presenca === null) ?? []

  return (
    <div className="mt-3 pt-3 border-t">
      <button
        onClick={() => setExpandido(v => !v)}
        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
      >
        <svg
          className={`w-3 h-3 transition-transform ${expandido ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {expandido ? 'Ocultar participantes' : 'Ver participantes'}
        {dados && (
          <span className="text-gray-400 font-normal">
            ({dados.totalPresentes} presentes · {dados.totalAusentes} ausentes)
          </span>
        )}
      </button>

      {expandido && (
        <div className="mt-3 space-y-3">
          {carregando && <p className="text-sm text-gray-400">Carregando...</p>}
          {erro && <p className="text-sm text-red-500">Erro ao carregar participantes.</p>}

          {dados && (
            <>
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                  Presentes ({presentes.length})
                </p>
                {presentes.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Nenhum ainda.</p>
                ) : (
                  <ul className="space-y-1">
                    {presentes.map(p => (
                      <li key={p.id} className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{p.nome ?? p.email}</span>
                        <span className="text-gray-400 text-xs truncate">{p.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">
                  Ausentes ({ausentes.length})
                </p>
                {ausentes.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Todos compareceram!</p>
                ) : (
                  <ul className="space-y-1">
                    {ausentes.map(p => (
                      <li key={p.id} className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-red-300 flex-shrink-0" />
                        <span className="text-gray-500">{p.nome ?? p.email}</span>
                        <span className="text-gray-400 text-xs truncate">{p.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
