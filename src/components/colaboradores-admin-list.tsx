'use client'

import { useState, FormEvent } from 'react'
import { ColaboradorAutorizado } from '@/types'
import { useToast } from './toast'
import { Spinner } from './spinner'

interface Props {
  colaboradoresIniciais: ColaboradorAutorizado[]
}

export default function ColaboradoresAdminList({ colaboradoresIniciais }: Props) {
  const [colaboradores, setColaboradores] = useState(colaboradoresIniciais)
  const [textoEmails, setTextoEmails] = useState('')
  const [adicionando, setAdicionando] = useState(false)
  const [removendo, setRemovendo] = useState<string | null>(null)
  const { showToast } = useToast()

  async function handleAdicionar(e: FormEvent) {
    e.preventDefault()
    const emails = textoEmails
      .split(/[\n,;]/)
      .map(e => e.trim())
      .filter(e => e.length > 0)

    if (emails.length === 0) return
    setAdicionando(true)

    try {
      const res = await fetch('/api/colaboradores-autorizados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      })
      const json = await res.json()
      if (!res.ok) {
        showToast('Erro ao adicionar colaboradores.', 'error')
        return
      }

      // Rebusca a lista atualizada
      const resLista = await fetch('/api/colaboradores-autorizados')
      const jsonLista = await resLista.json()
      setColaboradores(jsonLista.colaboradores ?? [])

      setTextoEmails('')
      const total = json.total ?? emails.length
      showToast(`${total} colaborador${total !== 1 ? 'es' : ''} adicionado${total !== 1 ? 's' : ''}.`, 'success')
    } catch {
      showToast('Erro de conexão.', 'error')
    } finally {
      setAdicionando(false)
    }
  }

  async function handleRemover(id: string, email: string) {
    setRemovendo(id)
    try {
      const res = await fetch(`/api/colaboradores-autorizados/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('Erro ao remover colaborador.', 'error')
        return
      }
      setColaboradores(prev => prev.filter(c => c.id !== id))
      showToast(`${email} removido.`, 'info')
    } catch {
      showToast('Erro de conexão.', 'error')
    } finally {
      setRemovendo(null)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdicionar} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adicionar colaboradores
          </label>
          <textarea
            value={textoEmails}
            onChange={e => setTextoEmails(e.target.value)}
            placeholder={"Um ou mais e-mails (um por linha ou separados por vírgula):\njoao@empresa.com\nmaria@empresa.com"}
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={adicionando || !textoEmails.trim()}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
        >
          {adicionando && <Spinner size="sm" className="border-white border-t-transparent" />}
          {adicionando ? 'Adicionando...' : 'Adicionar'}
        </button>
      </form>

      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">
          Lista atual ({colaboradores.length} e-mail{colaboradores.length !== 1 ? 's' : ''})
        </h2>

        {colaboradores.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Nenhum colaborador cadastrado ainda.</p>
        ) : (
          <ul className="divide-y border rounded-lg overflow-hidden">
            {colaboradores.map(c => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50">
                <span className="text-sm text-gray-800">{c.email}</span>
                <button
                  onClick={() => handleRemover(c.id, c.email)}
                  disabled={removendo === c.id}
                  className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50 ml-4"
                >
                  {removendo === c.id ? 'Removendo...' : 'Remover'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
