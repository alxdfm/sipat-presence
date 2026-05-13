'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useToast } from './toast'
import { Spinner } from './spinner'

export interface ColaboradorElegivel {
  participanteId: string
  nome: string | null
  email: string
  totalDias: number
}

interface Props {
  elegiveis: ColaboradorElegivel[]
}

export default function SorteioContent({ elegiveis }: Props) {
  const { showToast } = useToast()
  const [sorteando, setSorteando] = useState(false)
  const [vencedor, setVencedor] = useState<ColaboradorElegivel | null>(null)
  const [destacado, setDestacado] = useState<string | null>(null)

  function exportarCsv() {
    const escapar = (v: string) => {
      const s = v.replace(/"/g, '""')
      return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
    }
    const linhas = [
      'Nome,Email,Dias de Presença',
      ...elegiveis.map(e => `"${escapar(e.nome ?? '')}","${escapar(e.email)}","${e.totalDias}"`),
    ]
    const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'elegiveis_sorteio.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function realizarSorteio() {
    if (elegiveis.length === 0) return
    setSorteando(true)
    setVencedor(null)

    // Animação: pisca aleatoriamente por ~2 segundos
    const duracao = 2000
    const inicio = Date.now()
    const intervalo = 80

    await new Promise<void>(resolve => {
      function passo() {
        const aleatorio = elegiveis[Math.floor(Math.random() * elegiveis.length)]
        setDestacado(aleatorio.participanteId)

        const decorrido = Date.now() - inicio
        if (decorrido < duracao) {
          setTimeout(passo, intervalo)
        } else {
          resolve()
        }
      }
      passo()
    })

    const sorteado = elegiveis[Math.floor(Math.random() * elegiveis.length)]
    setDestacado(sorteado.participanteId)
    setVencedor(sorteado)
    setSorteando(false)
    showToast(`Sorteado: ${sorteado.nome ?? sorteado.email}`, 'success')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Sorteio</h1>
            <p className="text-gray-500 text-sm">
              {elegiveis.length} colaborador{elegiveis.length !== 1 ? 'es elegíveis' : ' elegível'} (≥ 3 dias de presença)
            </p>
          </div>
          <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            ← Voltar ao painel
          </Link>
        </div>

        {/* Ação do sorteio */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-semibold text-gray-800">Realizar sorteio</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Um colaborador elegível será sorteado aleatoriamente.
              </p>
            </div>
            <button
              onClick={realizarSorteio}
              disabled={sorteando || elegiveis.length === 0}
              className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
            >
              {sorteando && <Spinner size="sm" className="border-white border-t-transparent" />}
              {sorteando ? 'Sorteando...' : 'Sortear'}
            </button>
          </div>

          {vencedor && (
            <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Vencedor</p>
              <p className="text-xl font-bold text-green-800">{vencedor.nome ?? vencedor.email}</p>
              {vencedor.nome && (
                <p className="text-sm text-green-600 mt-0.5">{vencedor.email}</p>
              )}
              <p className="text-sm text-green-600 mt-1">{vencedor.totalDias} dias de presença</p>
            </div>
          )}
        </div>

        {/* Lista de elegíveis */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-semibold text-gray-800">
              Colaboradores elegíveis
            </h2>
            <button
              onClick={exportarCsv}
              disabled={elegiveis.length === 0}
              className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-40"
            >
              Exportar CSV
            </button>
          </div>

          {elegiveis.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              Nenhum colaborador com presença em 3 ou mais dias ainda.
            </p>
          ) : (
            <ul className="divide-y">
              {elegiveis.map(e => (
                <li
                  key={e.participanteId}
                  className={`py-3 flex items-center justify-between transition-colors rounded-lg px-2 -mx-2 ${
                    destacado === e.participanteId
                      ? 'bg-yellow-50 border border-yellow-300'
                      : vencedor?.participanteId === e.participanteId
                      ? 'bg-green-50 border border-green-300'
                      : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{e.nome ?? e.email}</p>
                    {e.nome && (
                      <p className="text-xs text-gray-500 truncate">{e.email}</p>
                    )}
                  </div>
                  <span className="ml-4 flex-shrink-0 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                    {e.totalDias} dias
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
