'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase/client'

interface UseLogoutResult {
  logout: () => Promise<void>
  carregando: boolean
}

/**
 * Hook que encapsula o fluxo de logout: encerra a sessão Supabase,
 * exibe estado de carregamento durante a operação e redireciona para a página inicial.
 *
 * @returns `{ logout, carregando }` — use `carregando` para desabilitar o botão
 *   e exibir feedback visual enquanto a operação acontece.
 * @example
 * const { logout, carregando } = useLogout()
 * <button onClick={logout} disabled={carregando}>
 *   {carregando ? 'Saindo...' : 'Sair'}
 * </button>
 */
export function useLogout(): UseLogoutResult {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)

  async function logout() {
    setCarregando(true)
    try {
      const supabase = createClientSupabase()
      await supabase.auth.signOut()
      router.push('/')
    } finally {
      setCarregando(false)
    }
  }

  return { logout, carregando }
}
