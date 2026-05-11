import { NextResponse } from 'next/server'
import { verificarOrganizador, logErro} from '@/lib/supabase/api-helpers'

/**
 * GET /api/colaboradores-autorizados
 * Lista todos os colaboradores autorizados. Requer role='organizador'.
 */
export async function GET() {
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  const { data: colaboradores, error } = await auth.supabase
    .from('colaboradores_autorizados')
    .select('id, email, criado_em')
    .order('email', { ascending: true })

  if (error) {
    logErro('/colaboradores-autorizados', error)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ colaboradores })
}
