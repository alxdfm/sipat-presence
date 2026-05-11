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
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [salvandoId, setSalvandoId] = useState<string | null>(null)
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

  function abrirEdicao(c: ColaboradorAutorizado) {
    setEditandoId(c.id)
    setEditEmail(c.email)
  }

  async function salvarEdicao(id: string) {
    const email = editEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      showToast('E-mail inválido.', 'error')
      return
    }
    setSalvandoId(id)
    try {
      const res = await fetch(`/api/colaboradores-autorizados/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json.erro === 'email_ja_cadastrado') {
          showToast('Esse e-mail já está na lista.', 'error')
        } else {
          showToast('Erro ao atualizar e-mail.', 'error')
        }
        return
      }
      setColaboradores(prev => prev.map(c => c.id === id ? json.colaborador : c))
      setEditandoId(null)
      showToast('E-mail atualizado.', 'success')
    } catch {
      showToast('Erro de conexão.', 'error')
    } finally {
      setSalvandoId(null)
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
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
              <li key={c.id} className="px-4 py-3 bg-white hover:bg-gray-50">
                {editandoId === c.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      className="flex-1 border rounded-lg px-2 py-1 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => salvarEdicao(c.id)}
                      disabled={salvandoId === c.id}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {salvandoId === c.id && <Spinner size="sm" className="border-white border-t-transparent" />}
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-800">{c.email}</span>
                    <div className="flex gap-3 ml-4">
                      <button
                        onClick={() => abrirEdicao(c)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleRemover(c.id, c.email)}
                        disabled={removendo === c.id}
                        className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        {removendo === c.id ? 'Removendo...' : 'Remover'}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
