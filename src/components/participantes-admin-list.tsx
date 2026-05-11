'use client'

import { useState } from 'react'
import { Participante } from '@/types'
import { alterarRole } from '@/lib/actions/participantes'

interface Props {
  participantesIniciais: Participante[]
  organizadorAtualId: string
}

/**
 * Lista de Participantes para o painel de gestão do Organizador.
 * Permite promover um Participante a Organizador ou rebaixar um Organizador a Participante.
 * O Organizador logado não pode alterar o próprio role.
 *
 * @param participantesIniciais - Lista carregada via SSR.
 * @param organizadorAtualId - ID do Organizador logado (para desabilitar o próprio item).
 */
export default function ParticipantesAdminList({ participantesIniciais, organizadorAtualId }: Props) {
  const [participantes, setParticipantes] = useState(participantesIniciais)
  const [carregandoId, setCarregandoId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function handleAlterarRole(id: string, novoRole: 'participante' | 'organizador') {
    setCarregandoId(id)
    setErro(null)

    try {
      const resultado = await alterarRole(id, novoRole)

      if (!resultado.ok) {
        setErro(resultado.erro ?? 'Erro ao alterar role.')
        return
      }

      setParticipantes(prev =>
        prev.map(p => (p.id === id ? { ...p, role: resultado.data.role } : p))
      )
    } finally {
      setCarregandoId(null)
    }
  }

  return (
    <div>
      {erro && (
        <p className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">{erro}</p>
      )}

      <ul className="divide-y">
        {participantes.map(p => {
          const eEuMesmo = p.id === organizadorAtualId
          const eOrganizador = p.role === 'organizador'
          const carregando = carregandoId === p.id

          return (
            <li key={p.id} className="py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">{p.nome ?? '—'}</p>
                <p className="text-sm text-gray-500 truncate">{p.email}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  eOrganizador
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {eOrganizador ? 'Organizador' : 'Participante'}
                </span>

                {!eEuMesmo && (
                  <button
                    onClick={() => handleAlterarRole(p.id, eOrganizador ? 'participante' : 'organizador')}
                    disabled={carregando}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                      eOrganizador
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {carregando
                      ? '...'
                      : eOrganizador
                        ? 'Remover acesso'
                        : 'Tornar Organizador'}
                  </button>
                )}

                {eEuMesmo && (
                  <span className="text-xs text-gray-400 italic">você</span>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {participantes.length === 0 && (
        <p className="text-gray-400 text-center py-8">
          Nenhum participante cadastrado ainda.
        </p>
      )}
    </div>
  )
}
