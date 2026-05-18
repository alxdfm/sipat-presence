'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useToast } from './toast'

export interface ColaboradorElegivel {
  participanteId: string
  nome: string | null
  email: string
  totalDias?: number
}

export interface DiaSorteioInfo {
  id: string
  nome: string | null
  data: string
  nomeEvento: string
  totalPresentes: number
}

interface Props {
  elegiveis: ColaboradorElegivel[]
  titulo?: string
  subtitulo?: string
  backHref?: string
  backLabel?: string
  csvNomeArquivo?: string
  diasParaSorteio?: DiaSorteioInfo[]
}

type Fase = 'idle' | 'rolando' | 'concluido'

// Sequência de intervalos (ms): rápido → desacelera → para
const PASSOS = [
  ...Array<number>(18).fill(55),
  75, 95, 120, 150, 185, 225, 270, 320, 380, 450,
  540, 650,
]

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export default function SorteioContent({
  elegiveis,
  titulo = 'Sorteio',
  subtitulo,
  backHref = '/admin',
  backLabel = '← Voltar ao painel',
  csvNomeArquivo = 'elegiveis_sorteio.csv',
  diasParaSorteio,
}: Props) {
  const { showToast } = useToast()
  const [fase, setFase] = useState<Fase>('idle')
  const [candidato, setCandidato] = useState<ColaboradorElegivel | null>(null)
  const [vencedor, setVencedor] = useState<ColaboradorElegivel | null>(null)
  const [frameKey, setFrameKey] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const subtituloResolvido = subtitulo ?? `${elegiveis.length} colaborador${elegiveis.length !== 1 ? 'es elegíveis' : ' elegível'} (≥ 3 dias de presença)`

  function exportarCsv() {
    const esc = (v: string) => {
      const s = v.replace(/"/g, '""')
      return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
    }
    const temDias = elegiveis.some(e => e.totalDias !== undefined)
    const linhas = [
      temDias ? 'Nome,Email,Dias de Presença' : 'Nome,Email',
      ...elegiveis.map(e =>
        temDias
          ? `"${esc(e.nome ?? '')}","${esc(e.email)}","${e.totalDias ?? ''}"`
          : `"${esc(e.nome ?? '')}","${esc(e.email)}"`,
      ),
    ]
    const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = csvNomeArquivo
    a.click()
    URL.revokeObjectURL(url)
  }

  function realizarSorteio() {
    if (elegiveis.length === 0 || fase === 'rolando') return

    const sorteado = elegiveis[Math.floor(Math.random() * elegiveis.length)]
    setFase('rolando')
    setVencedor(null)

    let idx = 0
    function tick() {
      setCandidato(elegiveis[Math.floor(Math.random() * elegiveis.length)])
      setFrameKey(k => k + 1)
      idx++
      if (idx < PASSOS.length) {
        timerRef.current = setTimeout(tick, PASSOS[idx])
      } else {
        timerRef.current = setTimeout(() => {
          setCandidato(sorteado)
          setFrameKey(k => k + 1)
          setVencedor(sorteado)
          setFase('concluido')
          showToast(`Sorteado: ${sorteado.nome ?? sorteado.email}`, 'success')
        }, 900)
      }
    }
    timerRef.current = setTimeout(tick, PASSOS[0])
  }

  const mostraDisplay = fase === 'rolando' || fase === 'concluido'

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop {
          0%   { opacity: 0; transform: scale(0.75); }
          65%  { transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.3; }
        }
        .anim-slide { animation: slideUp 0.12s ease-out both; }
        .anim-pop   { animation: pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .anim-shimmer { animation: shimmer 0.9s ease-in-out infinite; }
      `}</style>

      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">

          {/* Cabeçalho */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">{titulo}</h1>
              <p className="text-gray-500 text-sm">{subtituloResolvido}</p>
            </div>
            <Link href={backHref} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              {backLabel}
            </Link>
          </div>

          {/* Display do tambor */}
          {mostraDisplay && candidato && (
            <div
              className={`relative overflow-hidden rounded-2xl mb-6 p-8 text-center shadow-lg transition-all duration-500 ${
                fase === 'concluido'
                  ? 'bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-400'
                  : 'bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900'
              }`}
            >
              {/* Shimmer de fundo durante o giro */}
              {fase === 'rolando' && (
                <div className="anim-shimmer absolute inset-0 bg-white rounded-2xl pointer-events-none" />
              )}

              {fase === 'concluido' ? (
                <div className="anim-pop">
                  <p className="text-4xl mb-3">🏆</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-800 mb-2">
                    Sorteado
                  </p>
                  <p className="text-3xl font-extrabold text-amber-900 leading-tight">
                    {candidato.nome ?? candidato.email}
                  </p>
                  {candidato.nome && (
                    <p className="text-sm text-amber-700 mt-2">{candidato.email}</p>
                  )}
                  {candidato.totalDias !== undefined && (
                    <p className="text-sm font-semibold text-amber-800 mt-1">
                      {candidato.totalDias} dias de presença
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-3">
                    Sorteando...
                  </p>
                  {/* Linha-guia */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-64 h-px bg-blue-500/40 rounded-full" />
                  <p
                    key={frameKey}
                    className="anim-slide text-2xl font-bold text-white leading-tight"
                  >
                    {candidato.nome ?? candidato.email}
                  </p>
                  {candidato.nome && (
                    <p key={`email-${frameKey}`} className="anim-slide text-sm text-blue-300 mt-1">
                      {candidato.email}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Card de ação */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-semibold text-gray-800">Realizar sorteio</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Um colaborador elegível será sorteado aleatoriamente.
                </p>
              </div>
              <button
                onClick={fase === 'concluido' ? realizarSorteio : realizarSorteio}
                disabled={fase === 'rolando' || elegiveis.length === 0}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                  fase === 'concluido'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-blue-700 hover:bg-blue-800 text-white'
                }`}
              >
                {fase === 'rolando'
                  ? 'Sorteando...'
                  : fase === 'concluido'
                  ? 'Sortear novamente'
                  : 'Sortear'}
              </button>
            </div>
          </div>

          {/* Lista de elegíveis */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="font-semibold text-gray-800">Colaboradores elegíveis</h2>
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
                {elegiveis.map(e => {
                  const eVencedor = vencedor?.participanteId === e.participanteId
                  const eAtual = fase === 'rolando' && candidato?.participanteId === e.participanteId
                  return (
                    <li
                      key={e.participanteId}
                      className={`py-3 flex items-center justify-between px-2 -mx-2 rounded-lg transition-colors duration-150 ${
                        eVencedor
                          ? 'bg-amber-50 border border-amber-300'
                          : eAtual
                          ? 'bg-blue-50 border border-blue-200'
                          : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{e.nome ?? e.email}</p>
                        {e.nome && (
                          <p className="text-xs text-gray-500 truncate">{e.email}</p>
                        )}
                      </div>
                      {e.totalDias !== undefined && (
                        <span className={`ml-4 flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          eVencedor ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {e.totalDias} dias
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Sorteio por dia */}
          {diasParaSorteio && diasParaSorteio.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h2 className="font-semibold text-gray-800 mb-4">Sorteio por dia</h2>
              <ul className="divide-y">
                {diasParaSorteio.map(dia => (
                  <li key={dia.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {dia.nome ?? formatarData(dia.data)}
                        {dia.nome && (
                          <span className="text-gray-400 font-normal"> · {formatarData(dia.data)}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{dia.nomeEvento}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-500">{dia.totalPresentes} presente{dia.totalPresentes !== 1 ? 's' : ''}</span>
                      <Link
                        href={`/admin/sorteio/dia/${dia.id}`}
                        className="text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 font-medium"
                      >
                        Sortear
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </main>
    </>
  )
}
