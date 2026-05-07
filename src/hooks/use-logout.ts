'use client'

import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase/client'

/**
 * Hook que encapsula o fluxo de logout: encerra a sessão Supabase
 * e redireciona para a página inicial.
 *
 * Centraliza a lógica que estava duplicada em DashboardContent e AdminContent.
 *
 * @returns Função `logout` assíncrona pronta para usar em handlers de click.
 * @example
 * const logout = useLogout()
 * <button onClick={logout}>Sair</button>
 */
export function useLogout() {
  const router = useRouter()

  return async function logout() {
    const supabase = createClientSupabase()
    await supabase.auth.signOut()
    router.push('/')
  }
}
