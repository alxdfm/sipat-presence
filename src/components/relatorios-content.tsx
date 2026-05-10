'use client'

import Link from 'next/link'
import { EstatisticasDia, HistoricoRole } from '@/types'
import { useToast } from './toast'

interface Props {
  estatisticas: EstatisticasDia[]
  historico: HistoricoRole[]
  totalColaboradores: number
}

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function RelatoriosContent({ estatisticas, historico, totalColaboradores }: Props) {
  const { showToast } = useToast()

  async function baixarCsv(diaId: string, nomeDia: string | null, dataDia: string) {
    try {
      const res = await fetch(`/api/relatorios/presencas/${diaId}`)
      if (!res.ok) { showToast('Erro ao gerar CSV.', 'error'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `presencas_${dataDia}_${(nomeDia ?? 'dia').replace(/\s+/g, '_')}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast('Erro de conexão.', 'error')
    }
  }

  // Agrupar estatísticas por evento
  const porEvento = estatisticas.reduce<Record<string, { nomeEvento: string; dias: EstatisticasDia[] }>>(
    (acc, e) => {
      if (!acc[e.eventoId]) acc[e.eventoId] = { nomeEvento: e.nomeEvento, dias: [] }
      acc[e.eventoId].dias.push(e)
      return acc
    },
    {}
  )

  const totalGeral = estatisticas.reduce((s, e) => s + e.totalPresentes, 0)

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Relatórios</h1>
            <p className="text-gray-500 text-sm">{totalColaboradores} colaboradores autorizados</p>
          </div>
          <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            ← Voltar ao painel
          </Link>
        </div>

        {/* Resumo geral */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-blue-900">{totalColaboradores}</p>
            <p className="text-xs text-gray-500 mt-1">Colaboradores</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-blue-900">{estatisticas.length}</p>
            <p className="text-xs text-gray-500 mt-1">Dias de evento</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-blue-900">{totalGeral}</p>
            <p className="text-xs text-gray-500 mt-1">Presenças registradas</p>
          </div>
        </div>

        {/* Estatísticas por evento */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Presenças por dia</h2>

          {Object.keys(porEvento).length === 0 && (
            <p className="text-sm text-gray-400 italic">Nenhum evento ou dia cadastrado ainda.</p>
          )}

          {Object.entries(porEvento).map(([eventoId, { nomeEvento, dias }]) => (
            <div key={eventoId} className="bg-white rounded-xl shadow-sm p-5 mb-4">
              <h3 className="font-bold text-blue-900 mb-4">{nomeEvento}</h3>
              <div className="space-y-4">
                {dias.map(dia => {
                  const pct = dia.percentual ?? 0
                  return (
                    <div key={dia.diaId}>
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          {dia.nomeDia && (
                            <p className="text-sm font-medium text-gray-800">{dia.nomeDia}</p>
                          )}
                          <p className="text-sm text-gray-500">{formatarData(dia.dataDia)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-700">
                            {dia.totalPresentes}/{dia.totalColaboradores}
                            {dia.percentual !== null && (
                              <span className="text-gray-400 font-normal ml-1">({pct}%)</span>
                            )}
                          </span>
                          <button
                            onClick={() => baixarCsv(dia.diaId, dia.nomeDia, dia.dataDia)}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 font-medium"
                          >
                            CSV
                          </button>
                        </div>
                      </div>
                      {/* Barra de progresso */}
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : pct >= 25 ? 'bg-yellow-500' : 'bg-red-400'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </section>

        {/* Histórico de alterações de role */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Histórico de permissões</h2>

          {historico.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-400 italic">Nenhuma alteração de permissão registrada ainda.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <ul className="divide-y">
                {historico.map(h => (
                  <li key={h.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {h.nomeParticipante ?? h.emailParticipante}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{h.emailParticipante}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          por {h.nomeAlteradoPor ?? h.emailAlteradoPor}
                        </p>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <span className={`px-2 py-0.5 rounded-full ${
                            h.roleAnterior === 'organizador' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {h.roleAnterior === 'organizador' ? 'Organizador' : 'Participante'}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className={`px-2 py-0.5 rounded-full ${
                            h.roleNovo === 'organizador' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {h.roleNovo === 'organizador' ? 'Organizador' : 'Participante'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{formatarDataHora(h.alteradoEm)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
