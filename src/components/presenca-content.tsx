'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase/client'
import { registrarPresenca } from '@/lib/actions/presenca'

type Estado = 'verificando' | 'nao_autenticado' | 'registrando' | 'sucesso' | 'erro'
type MotivoErro = 'codigo_incorreto' | 'fora_da_janela' | 'dia_nao_ativado' | 'dia_nao_encontrado' | 'email_nao_autorizado' | 'muitas_requisicoes' | 'erro_interno' | null

/**
 * Componente client-side da pagina de registro de Presenca.
 *
 * Fluxo:
 * 1. Le `dia` e `code` da query string (embutidos no QR code)
 * 2. Verifica se o Participante esta autenticado
 * 3. Se nao, redireciona para /login preservando a URL atual
 * 4. Se sim, chama POST /api/presenca automaticamente
 * 5. Exibe resultado: sucesso ou erro com mensagem clara
 */
export default function PresencaContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>('verificando')
  const [motivoErro, setMotivoErro] = useState<MotivoErro>(null)

  const diaId = searchParams.get('dia')
  const code = searchParams.get('code')

  useEffect(() => {
    if (!diaId || !code) {
      setEstado('erro')
      setMotivoErro('dia_nao_encontrado')
      return
    }

    async function registrar() {
      const supabase = createClientSupabase()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        const urlAtual = window.location.pathname + window.location.search
        router.push(`/login?redirectTo=${encodeURIComponent(urlAtual)}`)
        return
      }

      setEstado('registrando')

      const resultado = await registrarPresenca(diaId!, code!)

      if (resultado.ok) {
        setEstado('sucesso')
      } else {
        setEstado('erro')
        setMotivoErro(resultado.erro as MotivoErro)
      }
    }

    registrar()
  }, [diaId, code, router])

  const mensagensErro: Record<string, string> = {
    codigo_incorreto: 'Código do QR code inválido.',
    fora_da_janela: 'O horário de registro de presença já encerrou ou ainda não abriu.',
    dia_nao_ativado: 'O código do dia ainda não foi ativado pelo Organizador.',
    dia_nao_encontrado: 'QR code inválido ou expirado.',
    email_nao_autorizado: 'Seu e-mail não está na lista de colaboradores autorizados. Entre em contato com o organizador.',
    muitas_requisicoes: 'Muitas tentativas. Aguarde um momento e tente novamente.',
    erro_interno: 'Erro interno. Tente novamente.',
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {estado === 'verificando' || estado === 'registrando' ? (
          <>
            <div className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">
              {estado === 'verificando' ? 'Verificando autenticacao...' : 'Registrando presenca...'}
            </p>
          </>
        ) : estado === 'sucesso' ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-700 mb-2">Presenca registrada!</h2>
            <p className="text-gray-500 text-sm mb-6">Sua presenca foi confirmada com sucesso.</p>
            <a href="/dashboard" className="block w-full bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors">
              Ver meu dashboard
            </a>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-700 mb-2">Não foi possível registrar</h2>
            <p className="text-gray-500 text-sm mb-4">
              {motivoErro ? mensagensErro[motivoErro] ?? 'Erro desconhecido.' : 'Erro desconhecido.'}
            </p>
            <a href="/codigo" className="block w-full bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors mb-3">
              Inserir código manualmente
            </a>
            <a href="/dashboard" className="block w-full border border-gray-300 text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
              Ir para o dashboard
            </a>
          </>
        )}
      </div>
    </main>
  )
}
