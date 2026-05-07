import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cria um cliente Supabase para uso em Server Components e API Routes.
 * Usa cookies para manter a sessão do usuário entre requisições.
 *
 * @returns Cliente Supabase com acesso à sessão do usuário autenticado.
 * @example
 * const supabase = await createServerSupabase()
 * const { data: { user } } = await supabase.auth.getUser()
 */
export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

/**
 * Cria um cliente Supabase com service_role para operações administrativas server-side.
 * NUNCA use este cliente no browser — a service_role key tem acesso total ao banco.
 * Bypassa RLS — use apenas em API Routes que já validaram a autenticação.
 *
 * @returns Cliente Supabase com acesso administrativo (bypassa RLS).
 */
export function createAdminSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )
}
