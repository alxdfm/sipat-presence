'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Participante, Evento, DiaDeEvento } from '@/types'
import EventoForm from './evento-form'
import DiaDeEventoForm from './dia-de-evento-form'
import AtivarCodigoForm from './ativar-codigo-form'
import QrCodeDisplay from './qr-code-display'
import ParticipantesDia from './participantes-dia'
import { useLogout } from '@/hooks/use-logout'

/** Quantos DiaDeEvento exibir por vez antes de paginar. */
const DIAS_POR_PAGINA = 5

interface EventoComDias extends Evento {
  dias_de_evento: DiaDeEvento[]
}

interface Props {
  participante: Participante
  eventos: EventoComDias[]
}

/**
 * Painel do Organizador.
 * Permite criar Eventos, adicionar DiaDeEvento, ativar CodigoDoDia,
 * visualizar QR codes, ver participantes por dia e acessar gestão de Participantes.
 *
 * A lista de dias é paginada (DIAS_POR_PAGINA) para não sobrecarregar a tela
 * em Eventos com muitos dias.
 */
export default function AdminContent({ participante, eventos: eventosIniciais }: Props) {
  const [eventos, setEventos] = useState(eventosIniciais)
  const [diaQrAberto, setDiaQrAberto] = useState<string | null>(null)
  /** Página atual de dias por evento: eventoId → página (base 0) */
  const [paginasDias, setPaginasDias] = useState<Record<string, number>>({})
  const { logout, carregando: saindo } = useLogout()

  function paginaAtual(eventoId: string) {
    return paginasDias[eventoId] ?? 0
  }

  function setPagina(eventoId: string, pagina: number) {
    setPaginasDias(prev => ({ ...prev, [eventoId]: pagina }))
  }

  function handleEventoCriado(novoEvento: Evento) {
    setEventos(prev => [{ ...novoEvento, dias_de_evento: [] }, ...prev])
  }

  function handleDiaCriado(eventoId: string, novoDia: DiaDeEvento) {
    setEventos(prev =>
      prev.map(e =>
        e.id === eventoId
          ? { ...e, dias_de_evento: [...e.dias_de_evento, novoDia] }
          : e
      )
    )
  }

  function handleDiaAtivado(diaAtualizado: DiaDeEvento) {
    setEventos(prev =>
      prev.map(e => ({
        ...e,
        dias_de_evento: e.dias_de_evento.map(d =>
          d.id === diaAtualizado.id ? diaAtualizado : d
        ),
      }))
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Painel do Organizador</h1>
            <p className="text-gray-500 text-sm">{participante.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/participantes"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Gerenciar participantes
            </Link>
            <button
              onClick={logout}
              disabled={saindo}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              {saindo ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">Criar novo Evento</h2>
          <EventoForm onEventoCriado={handleEventoCriado} />
        </div>

        {eventos.map(evento => {
          const pagina = paginaAtual(evento.id)
          const totalDias = evento.dias_de_evento.length
          const totalPaginas = Math.ceil(totalDias / DIAS_POR_PAGINA)
          const diasDaPagina = evento.dias_de_evento.slice(
            pagina * DIAS_POR_PAGINA,
            (pagina + 1) * DIAS_POR_PAGINA
          )

          return (
            <div key={evento.id} className="bg-white rounded-xl shadow-sm p-6 mb-4">
              <h3 className="font-bold text-lg text-blue-900 mb-1">{evento.nome}</h3>
              {evento.descricao && (
                <p className="text-gray-500 text-sm mb-4">{evento.descricao}</p>
              )}

              <div className="space-y-3 mb-4">
                {diasDaPagina.map(dia => (
                  <div key={dia.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-700">{dia.data}</p>
                        <p className="text-sm text-gray-500">
                          Abertura: {dia.hora_abertura} · {dia.duracao_minutos} min
                        </p>
                        <p className="text-sm mt-1">
                          {dia.codigo_do_dia
                            ? <span className="text-green-600 font-medium">✓ Ativado</span>
                            : <span className="text-yellow-600">Aguardando ativação</span>
                          }
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {dia.codigo_do_dia && (
                          <button
                            onClick={() => setDiaQrAberto(diaQrAberto === dia.id ? null : dia.id)}
                            className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-100"
                          >
                            {diaQrAberto === dia.id ? 'Fechar QR' : 'Ver QR'}
                          </button>
                        )}
                      </div>
                    </div>

                    {!dia.codigo_do_dia && (
                      <div className="mt-3 pt-3 border-t">
                        <AtivarCodigoForm diaId={dia.id} onAtivado={handleDiaAtivado} />
                      </div>
                    )}

                    {diaQrAberto === dia.id && (
                      <div className="mt-3 pt-3 border-t">
                        <QrCodeDisplay diaId={dia.id} />
                      </div>
                    )}

                    {/* Lista de presentes/ausentes — só faz sentido após ativação */}
                    {dia.codigo_do_dia && (
                      <ParticipantesDia diaId={dia.id} />
                    )}
                  </div>
                ))}

                {totalDias === 0 && (
                  <p className="text-sm text-gray-400 italic">Nenhum dia cadastrado ainda.</p>
                )}
              </div>

              {/* Paginação de dias */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between mb-4 px-1">
                  <button
                    onClick={() => setPagina(evento.id, pagina - 1)}
                    disabled={pagina === 0}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>
                  <span className="text-sm text-gray-500">
                    Dias {pagina * DIAS_POR_PAGINA + 1}–{Math.min((pagina + 1) * DIAS_POR_PAGINA, totalDias)} de {totalDias}
                  </span>
                  <button
                    onClick={() => setPagina(evento.id, pagina + 1)}
                    disabled={pagina >= totalPaginas - 1}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                  >
                    Próximo →
                  </button>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-600 mb-3">Adicionar dia</p>
                <DiaDeEventoForm
                  eventoId={evento.id}
                  onDiaCriado={dia => handleDiaCriado(evento.id, dia)}
                />
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
