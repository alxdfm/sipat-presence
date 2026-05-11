'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase/client'

type Estado = 'aguardando' | 'registrando' | 'sucesso' | 'erro'
type MotivoErro = 'codigo_incorreto' | 'fora_da_janela' | 'dia_nao_ativado' | 'email_nao_autorizado' | 'muitas_requisicoes' | 'erro_interno' | null

const mensagensErro: Record<string, string> = {
  codigo_incorreto:      'Código inválido. Verifique e tente novamente.',
  fora_da_janela:        'O horário de registro de presença já encerrou ou ainda não abriu.',
  dia_nao_ativado:       'O código do dia ainda não foi ativado pelo Organizador.',
  email_nao_autorizado:  'Seu e-mail não está na lista de colaboradores autorizados. Entre em contato com o organizador.',
  muitas_requisicoes:    'Muitas tentativas. Aguarde um momento e tente novamente.',
  erro_interno:          'Erro interno. Tente novamente.',
}

export default function CodigoContent() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [codigo, setCodigo] = useState('')
  const [estado, setEstado] = useState<Estado>('aguardando')
  const [motivoErro, setMotivoErro] = useState<MotivoErro>(null)

  // Redireciona para login se não autenticado
  useEffect(() => {
    createClientSupabase().auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push(`/login?redirectTo=${encodeURIComponent('/codigo')}`)
    })
  }, [router])

  // Foca o input ao montar
  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!codigo.trim()) return

    setEstado('registrando')
    setMotivoErro(null)

    const res = await fetch('/api/presenca/codigo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigoDoDia: codigo.trim() }),
    })

    const json = await res.json()

    if (res.status === 201 || res.status === 200) {
      setEstado('sucesso')
    } else {
      setEstado('erro')
      setMotivoErro(json.erro ?? null)
    }
  }

  function tentarNovamente() {
    setCodigo('')
    setEstado('aguardando')
    setMotivoErro(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center">

        <div className="flex justify-center mb-4">
          <Image src="/cipa-logo-1.png" alt="CIPA" width={72} height={72} className="object-contain" />
        </div>

        {estado === 'registrando' ? (
          <>
            <div className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Registrando presença...</p>
          </>

        ) : estado === 'sucesso' ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-700 mb-2">Presença registrada!</h2>
            <p className="text-gray-500 text-sm mb-6">Sua presença foi confirmada com sucesso.</p>
            <a href="/dashboard" className="block w-full bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors">
              Ver meu dashboard
            </a>
          </>

        ) : estado === 'erro' ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-700 mb-2">Não foi possível registrar</h2>
            <p className="text-gray-500 text-sm mb-6">
              {motivoErro ? mensagensErro[motivoErro] ?? 'Erro desconhecido.' : 'Erro desconhecido.'}
            </p>
            <button
              onClick={tentarNovamente}
              className="w-full bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors mb-3"
            >
              Tentar novamente
            </button>
            <a href="/dashboard" className="block w-full border border-gray-300 text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
              Ir para o dashboard
            </a>
          </>

        ) : (
          <>
            <h1 className="text-xl font-bold text-blue-900 mb-1">Inserir código</h1>
            <p className="text-gray-500 text-sm mb-6">
              Digite o código exibido na tela do evento para registrar sua presença.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                ref={inputRef}
                type="text"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="Ex: azul42"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="w-full border rounded-lg px-4 py-3 text-center text-lg tracking-widest font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!codigo.trim()}
                className="w-full bg-blue-700 text-white py-3 px-4 rounded-lg hover:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Registrar presença
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
