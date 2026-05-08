'use client'

import { useState, FormEvent } from 'react'
import { AtivarCodigoDoDiaPayload, DiaDeEvento } from '@/types'
import { useToast } from './toast'

interface Props {
  diaId: string
  onAtivado: (diaAtualizado: DiaDeEvento) => void
}

/**
 * Formulário para o Organizador inserir o CodigoDoDia de um DiaDeEvento.
 * Após ativação, o QR code pode ser gerado e a Presença pode ser registrada.
 */
export default function AtivarCodigoForm({ diaId, onAtivado }: Props) {
  const [codigo, setCodigo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const { showToast } = useToast()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!codigo.trim()) return
    setEnviando(true)

    try {
      const payload: AtivarCodigoDoDiaPayload = { codigoDoDia: codigo.trim() }
      const res = await fetch(`/api/dia-de-evento/${diaId}/ativar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        const mensagens: Record<string, string> = {
          dia_no_passado: 'Não é possível ativar um dia que já passou.',
          dia_nao_encontrado: 'Dia não encontrado.',
        }
        showToast(mensagens[json.erro] ?? 'Erro ao ativar código. Tente novamente.', 'error')
        return
      }
      onAtivado(json.dia)
      showToast('Código ativado com sucesso!', 'success')
    } catch {
      showToast('Erro de conexão. Tente novamente.', 'error')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={codigo}
        onChange={e => setCodigo(e.target.value)}
        placeholder="Digite o código do dia (ex: azul42)"
        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        required
      />
      <button
        type="submit"
        disabled={enviando || !codigo.trim()}
        className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50"
      >
        {enviando ? 'Ativando...' : 'Ativar'}
      </button>
    </form>
  )
}
