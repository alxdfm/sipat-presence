import { createBrowserClient } from '@supabase/ssr'

/**
 * Cria um cliente Supabase para uso no browser (Client Components).
 * Usa as variáveis públicas NEXT_PUBLIC_* — seguro expor no cliente.
 *
 * @returns Cliente Supabase configurado para o browser com sessão gerenciada via cookies.
 * @example
 * const supabase = createClientSupabase()
 * const { data } = await supabase.from('eventos').select('*')
 */
export function createClientSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
