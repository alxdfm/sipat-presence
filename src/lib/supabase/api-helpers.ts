import { NextResponse } from 'next/server'
import { createServerSupabase } from './server'

/**
 * Loga erros de API no console do servidor com rota e detalhes do erro.
 * Em produção substitua por um serviço de observabilidade (Sentry, Datadog, etc.).
 */
export function logErro(rota: string, erro: unknown) {
  console.error(`[API] ${rota}`, erro)
}

/** Cliente Supabase já resolvido — evita re-await nos callers. */
type SupabaseClient = Awaited<ReturnType<typeof createServerSupabase>>

/** Usuário mínimo necessário nas rotas de API. */
export interface UsuarioAutenticado {
  id: string
  email: string
}

/**
 * Resultado de uma verificação de autenticação ou autorização.
 * Usar discriminated union permite narrowing seguro nos callers:
 *
 * @example
 * const auth = await autenticarUsuario()
 * if (!auth.ok) return auth.response
 * // auth.usuario e auth.supabase disponíveis aqui
 */
export type ResultadoAuth =
  | { ok: true; usuario: UsuarioAutenticado; supabase: SupabaseClient }
  | { ok: false; response: NextResponse }

/**
 * Verifica se há um usuário autenticado na requisição atual via cookie de sessão.
 * Deve ser chamado no início de toda API Route que exige autenticação.
 *
 * @returns `{ ok: true, usuario, supabase }` se autenticado,
 *          ou `{ ok: false, response }` com status 401 pronto para retornar.
 * @example
 * const auth = await autenticarUsuario()
 * if (!auth.ok) return auth.response
 */
export async function autenticarUsuario(): Promise<ResultadoAuth> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ erro: 'nao_autenticado' }, { status: 401 }),
    }
  }

  return { ok: true, usuario: { id: user.id, email: user.email! }, supabase }
}

/**
 * Verifica se o usuário autenticado tem role='organizador'.
 * Combina `autenticarUsuario` + consulta de role em uma única chamada.
 *
 * @returns `{ ok: true, usuario, supabase }` se for Organizador,
 *          ou `{ ok: false, response }` com status 401 (não autenticado) ou 403 (sem permissão).
 * @example
 * const auth = await verificarOrganizador()
 * if (!auth.ok) return auth.response
 */
export async function verificarOrganizador(): Promise<ResultadoAuth> {
  const auth = await autenticarUsuario()
  if (!auth.ok) return auth

  const { data: participante } = await auth.supabase
    .from('participantes')
    .select('role')
    .eq('id', auth.usuario.id)
    .single()

  if (participante?.role !== 'organizador') {
    return {
      ok: false,
      response: NextResponse.json({ erro: 'sem_permissao' }, { status: 403 }),
    }
  }

  return auth
}
