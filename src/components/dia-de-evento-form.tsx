'use client'

import { useState, FormEvent } from 'react'
import { CriarDiaDeEventoPayload } from '@/types'

interface Props {
  eventoId: string
  onDiaCriado: (dia: any) => void
}

/**
 * Formulario para adicionar um DiaDeEvento a um Evento.
 * O CodigoDoDia nao e definido aqui — nasce como null e e ativado separadamente.
 */
export default function DiaDeEventoForm({ eventoId, onDiaCriado }: Props) {
  const [data, setData] = useState('')
  const [horaAbertura, setHoraAbertura] = useState('')
  const [duracaoMinutos, setDuracaoMinutos] = useState('60')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!data || !horaAbertura) return
    setEnviando(true)
    setErro(null)

    try {
      const payload: CriarDiaDeEventoPayload = {
        eventoId,
        data,
        horaAbertura,
        duracaoMinutos: parseInt(duracaoMinutos) || 60,
      }
      const res = await fetch('/api/dia-de-evento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { setErro('Erro ao criar dia.'); return }
      onDiaCriado(json.dia)
      setData('')
      setHoraAbertura('')
      setDuracaoMinutos('60')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <input
        type="date" value={data} onChange={e => setData(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <input
        type="time" value={horaAbertura} onChange={e => setHoraAbertura(e.target.value)}
        placeholder="Hora de abertura"
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <select
        value={duracaoMinutos} onChange={e => setDuracaoMinutos(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="30">30 min</option>
        <option value="60">60 min</option>
        <option value="90">90 min</option>
        <option value="120">120 min</option>
      </select>
      {erro && <p className="text-red-500 text-sm w-full">{erro}</p>}
      <button
        type="submit" disabled={enviando || !data || !horaAbertura}
        className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        {enviando ? 'Adicionando...' : 'Adicionar Dia'}
      </button>
    </form>
  )
}
