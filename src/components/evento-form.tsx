'use client'

import { useState, FormEvent } from 'react'
import { Evento, CriarEventoPayload } from '@/types'

interface Props {
  onEventoCriado: (evento: Evento) => void
}

/**
 * Formulario para criar um novo Evento.
 * Chama POST /api/evento e notifica o pai com o Evento criado.
 */
export default function EventoForm({ onEventoCriado }: Props) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setEnviando(true)
    setErro(null)

    try {
      const payload: CriarEventoPayload = { nome: nome.trim(), descricao: descricao.trim() || undefined }
      const res = await fetch('/api/evento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { setErro('Erro ao criar evento.'); return }
      onEventoCriado(json.evento)
      setNome('')
      setDescricao('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text" value={nome} onChange={e => setNome(e.target.value)}
        placeholder="Nome do evento (ex: SIPAT 2026)"
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <input
        type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
        placeholder="Descricao (opcional)"
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {erro && <p className="text-red-500 text-sm">{erro}</p>}
      <button
        type="submit" disabled={enviando || !nome.trim()}
        className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
      >
        {enviando ? 'Criando...' : 'Criar Evento'}
      </button>
    </form>
  )
}
