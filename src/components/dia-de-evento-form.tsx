'use client'

import { useState, FormEvent } from 'react'
import { DiaDeEvento } from '@/types'
import { useToast } from './toast'
import { criarDiaDeEvento } from '@/lib/actions/evento'

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
      const resultado = await criarDiaDeEvento({
        eventoId,
        nome: nome.trim() || undefined,
        data,
        horaAbertura,
        duracaoMinutos: parseInt(duracaoMinutos) || 60,
      })
      if (!resultado.ok) {
        showToast('Erro ao criar dia. Tente novamente.', 'error')
        return
      }
      onDiaCriado(resultado.data)
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
