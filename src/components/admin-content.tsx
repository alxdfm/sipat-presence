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
import { useToast } from './toast'
import { Spinner } from './spinner'

const DIAS_POR_PAGINA = 5

interface EventoComDias extends Evento {
  dias_de_evento: DiaDeEvento[]
}

interface Props {
  participante: Participante
  eventos: EventoComDias[]
}

export default function AdminContent({ participante, eventos: eventosIniciais }: Props) {
  const [eventos, setEventos] = useState(eventosIniciais)
  const [diaQrAberto, setDiaQrAberto] = useState<string | null>(null)
  const [paginasDias, setPaginasDias] = useState<Record<string, number>>({})
  const { logout, carregando: saindo } = useLogout()
  const { showToast } = useToast()

  // estado de edição de evento
  const [eventoEditando, setEventoEditando] = useState<string | null>(null)
  const [editEventoNome, setEditEventoNome] = useState('')
  const [editEventoDescricao, setEditEventoDescricao] = useState('')
  const [salvandoEvento, setSalvandoEvento] = useState(false)

  // estado de exclusão de evento
  const [eventoExcluindo, setEventoExcluindo] = useState<string | null>(null)
  const [excluindoEvento, setExcluindoEvento] = useState(false)

  // estado de edição de dia
  const [diaEditando, setDiaEditando] = useState<string | null>(null)
  const [editDiaNome, setEditDiaNome] = useState('')
  const [editDiaData, setEditDiaData] = useState('')
  const [editDiaHora, setEditDiaHora] = useState('')
  const [editDiaDuracao, setEditDiaDuracao] = useState('60')
  const [salvandoDia, setSalvandoDia] = useState(false)

  // estado de exclusão de dia
  const [diaExcluindo, setDiaExcluindo] = useState<string | null>(null)
  const [excluindoDia, setExcluindoDia] = useState(false)

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
        e.id === eventoId ? { ...e, dias_de_evento: [...e.dias_de_evento, novoDia] } : e
      )
    )
  }

  function handleDiaAtivado(diaAtualizado: DiaDeEvento) {
    setEventos(prev =>
      prev.map(e => ({
        ...e,
        dias_de_evento: e.dias_de_evento.map(d => d.id === diaAtualizado.id ? diaAtualizado : d),
      }))
    )
  }

  function abrirEditEvento(evento: Evento) {
    setEventoEditando(evento.id)
    setEditEventoNome(evento.nome)
    setEditEventoDescricao(evento.descricao ?? '')
  }

  async function salvarEvento(eventoId: string) {
    if (!editEventoNome.trim()) return
    setSalvandoEvento(true)
    try {
      const res = await fetch(`/api/evento/${eventoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: editEventoNome, descricao: editEventoDescricao || null }),
      })
      const json = await res.json()
      if (!res.ok) { showToast('Erro ao salvar evento.', 'error'); return }
      setEventos(prev => prev.map(e => e.id === eventoId ? { ...e, ...json.evento } : e))
      setEventoEditando(null)
      showToast('Evento atualizado.', 'success')
    } catch {
      showToast('Erro de conexão.', 'error')
    } finally {
      setSalvandoEvento(false)
    }
  }

  async function excluirEvento(eventoId: string) {
    setExcluindoEvento(true)
    try {
      const res = await fetch(`/api/evento/${eventoId}`, { method: 'DELETE' })
      if (!res.ok) { showToast('Erro ao excluir evento.', 'error'); return }
      setEventos(prev => prev.filter(e => e.id !== eventoId))
      setEventoExcluindo(null)
      showToast('Evento excluído.', 'info')
    } catch {
      showToast('Erro de conexão.', 'error')
    } finally {
      setExcluindoEvento(false)
    }
  }

  function abrirEditDia(dia: DiaDeEvento) {
    setDiaEditando(dia.id)
    setEditDiaNome(dia.nome ?? '')
    setEditDiaData(dia.data)
    setEditDiaHora(dia.hora_abertura.slice(0, 5))
    setEditDiaDuracao(String(dia.duracao_minutos))
  }

  async function salvarDia(diaId: string) {
    if (!editDiaData || !editDiaHora) return
    setSalvandoDia(true)
    try {
      const res = await fetch(`/api/dia-de-evento/${diaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editDiaNome || null,
          data: editDiaData,
          horaAbertura: editDiaHora,
          duracaoMinutos: parseInt(editDiaDuracao) || 60,
        }),
      })
      const json = await res.json()
      if (!res.ok) { showToast('Erro ao salvar dia.', 'error'); return }
      setEventos(prev =>
        prev.map(e => ({
          ...e,
          dias_de_evento: e.dias_de_evento.map(d => d.id === diaId ? json.dia : d),
        }))
      )
      setDiaEditando(null)
      showToast('Dia atualizado.', 'success')
    } catch {
      showToast('Erro de conexão.', 'error')
    } finally {
      setSalvandoDia(false)
    }
  }

  async function excluirDia(eventoId: string, diaId: string) {
    setExcluindoDia(true)
    try {
      const res = await fetch(`/api/dia-de-evento/${diaId}`, { method: 'DELETE' })
      if (!res.ok) { showToast('Erro ao excluir dia.', 'error'); return }
      setEventos(prev =>
        prev.map(e =>
          e.id === eventoId
            ? { ...e, dias_de_evento: e.dias_de_evento.filter(d => d.id !== diaId) }
            : e
        )
      )
      setDiaExcluindo(null)
      showToast('Dia excluído.', 'info')
    } catch {
      showToast('Erro de conexão.', 'error')
    } finally {
      setExcluindoDia(false)
    }
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
            <Link href="/admin/relatorios" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Relatórios
            </Link>
            <Link href="/admin/colaboradores" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Colaboradores
            </Link>
            <Link href="/admin/participantes" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Participantes
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
              {/* Cabeçalho do evento: normal ou modo edição */}
              {eventoEditando === evento.id ? (
                <div className="mb-4 space-y-2">
                  <input
                    type="text"
                    value={editEventoNome}
                    onChange={e => setEditEventoNome(e.target.value)}
                    placeholder="Nome do evento"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={editEventoDescricao}
                    onChange={e => setEditEventoDescricao(e.target.value)}
                    placeholder="Descrição (opcional)"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => salvarEvento(evento.id)}
                      disabled={salvandoEvento || !editEventoNome.trim()}
                      className="bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {salvandoEvento && <Spinner size="sm" className="border-white border-t-transparent" />}
                      {salvandoEvento ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={() => setEventoEditando(null)}
                      className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : eventoExcluindo === evento.id ? (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium mb-2">
                    Excluir &ldquo;{evento.nome}&rdquo;? Todos os dias e presenças serão removidos.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => excluirEvento(evento.id)}
                      disabled={excluindoEvento}
                      className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {excluindoEvento && <Spinner size="sm" className="border-white border-t-transparent" />}
                      {excluindoEvento ? 'Excluindo...' : 'Confirmar exclusão'}
                    </button>
                    <button
                      onClick={() => setEventoExcluindo(null)}
                      className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="font-bold text-lg text-blue-900">{evento.nome}</h3>
                    {evento.descricao && (
                      <p className="text-gray-500 text-sm">{evento.descricao}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-4">
                    <button
                      onClick={() => abrirEditEvento(evento)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setEventoExcluindo(evento.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-4 mt-4">
                {diasDaPagina.map(dia => (
                  <div key={dia.id} className="border rounded-lg p-3">
                    {/* Modo edição do dia */}
                    {diaEditando === dia.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editDiaNome}
                          onChange={e => setEditDiaNome(e.target.value)}
                          placeholder="Nome do dia (opcional)"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex flex-wrap gap-2">
                          <input
                            type="date"
                            value={editDiaData}
                            onChange={e => setEditDiaData(e.target.value)}
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          <input
                            type="time"
                            value={editDiaHora}
                            onChange={e => setEditDiaHora(e.target.value)}
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          <select
                            value={editDiaDuracao}
                            onChange={e => setEditDiaDuracao(e.target.value)}
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="30">30 min</option>
                            <option value="60">60 min</option>
                            <option value="90">90 min</option>
                            <option value="120">120 min</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => salvarDia(dia.id)}
                            disabled={salvandoDia || !editDiaData || !editDiaHora}
                            className="bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {salvandoDia && <Spinner size="sm" className="border-white border-t-transparent" />}
                            {salvandoDia ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            onClick={() => setDiaEditando(null)}
                            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : diaExcluindo === dia.id ? (
                      /* Confirmação de exclusão do dia */
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-700 font-medium mb-2">
                          Excluir dia {dia.data}{dia.nome ? ` — ${dia.nome}` : ''}? Todas as presenças serão removidas.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => excluirDia(evento.id, dia.id)}
                            disabled={excluindoDia}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {excluindoDia && <Spinner size="sm" className="border-white border-t-transparent" />}
                            {excluindoDia ? 'Excluindo...' : 'Confirmar'}
                          </button>
                          <button
                            onClick={() => setDiaExcluindo(null)}
                            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Visualização normal do dia */
                      <>
                        <div className="flex justify-between items-start">
                          <div>
                            {dia.nome && (
                              <p className="font-semibold text-gray-800">{dia.nome}</p>
                            )}
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
                          <div className="flex gap-2 flex-shrink-0 ml-4">
                            {dia.codigo_do_dia && (
                              <button
                                onClick={() => setDiaQrAberto(diaQrAberto === dia.id ? null : dia.id)}
                                className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-100"
                              >
                                {diaQrAberto === dia.id ? 'Fechar QR' : 'Ver QR'}
                              </button>
                            )}
                            <button
                              onClick={() => abrirEditDia(dia)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setDiaExcluindo(dia.id)}
                              className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                            >
                              Excluir
                            </button>
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

                        {dia.codigo_do_dia && (
                          <ParticipantesDia diaId={dia.id} />
                        )}
                      </>
                    )}
                  </div>
                ))}

                {totalDias === 0 && (
                  <p className="text-sm text-gray-400 italic">Nenhum dia cadastrado ainda.</p>
                )}
              </div>

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
