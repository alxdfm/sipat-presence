import { NextResponse } from 'next/server'
import { verificarOrganizador, logErro} from '@/lib/supabase/api-helpers'
import { createAdminSupabase } from '@/lib/supabase/server'

/**
 * GET /api/participantes
 *
 * Lista todos os Participantes do sistema. Requer role='organizador'.
 * Usa service_role para bypassar a RLS que restringe Participantes
 * a ver apenas o próprio registro.
 *
 * @returns `{ participantes: Participante[] }` ordenados por data de criação desc.
 */
export async function GET() {
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  const { data: participantes, error } = await createAdminSupabase()
    .from('participantes')
    .select('id, nome, email, role, criado_em')
    .order('criado_em', { ascending: false })

  if (error) {
    logErro('/participantes', error)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ participantes })
}
