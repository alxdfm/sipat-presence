import { NextResponse } from 'next/server'
import { autenticarUsuario, logErro} from '@/lib/supabase/api-helpers'

/**
 * GET /api/evento
 * Lista todos os Eventos ordenados por data de criação (mais recente primeiro).
 * Requer autenticação — qualquer Participante pode listar.
 *
 * @returns Array de Evento.
 */
export async function GET() {
  const auth = await autenticarUsuario()
  if (!auth.ok) return auth.response

  const { data: eventos, error } = await auth.supabase
    .from('eventos')
    .select('*')
    .order('criado_em', { ascending: false })

  if (error) {
    logErro('/evento', error)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return NextResponse.json({ eventos })
}
