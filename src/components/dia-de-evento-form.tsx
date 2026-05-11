'use client'

import { useState, FormEvent } from 'react'
import { CriarDiaDeEventoPayload, DiaDeEvento } from '@/types'
import { useToast } from './toast'

interface Props {
  eventoId: string
  onDiaCriado: (dia: DiaDeEvento) => void
}

/**
 * Formulário para adicionar um DiaDeEvento a um Evento.
 * O CodigoDoDia não é definido aqui — nasce como null e é ativado separadamente.
 */
export default function DiaDeEventoForm({ eventoId, onDiaCriado }: Props) {
  const [nome, setNome] = useState('')
  const [data, setData] = useState('')
  const [horaAbertura, setHoraAbertura] = useState('')
  const [duracaoMinutos, setDuracaoMinutos] = useState('60')
  const [enviando, setEnviando] = useState(false)
  const { showToast } = useToast()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!data || !horaAbertura) return
    setEnviando(true)

    try {
      const payload: CriarDiaDeEventoPayload = {
        eventoId,
        nome: nome.trim() || undefined,
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
      if (!res.ok) {
        showToast('Erro ao criar dia. Tente novamente.', 'error')
        return
      }
      onDiaCriado(json.dia)
      setNome('')
      setData('')
      setHoraAbertura('')
      setDuracaoMinutos('60')
      showToast('Dia adicionado com sucesso.', 'success')
    } catch {
      showToast('Erro de conexão. Tente novamente.', 'error')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        value={nome}
        onChange={e => setNome(e.target.value)}
        placeholder="Nome do dia (ex: Palestra sobre assédio)"
        className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={data}
          onChange={e => setData(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="time"
          value={horaAbertura}
          onChange={e => setHoraAbertura(e.target.value)}
          placeholder="Hora de abertura"
          className="border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <select
          value={duracaoMinutos}
          onChange={e => setDuracaoMinutos(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="30">30 min</option>
          <option value="60">60 min</option>
          <option value="90">90 min</option>
          <option value="120">120 min</option>
        </select>
        <button
          type="submit"
          disabled={enviando || !data || !horaAbertura}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {enviando ? 'Adicionando...' : 'Adicionar Dia'}
        </button>
      </div>
    </form>
  )
}
