import { NextRequest, NextResponse } from 'next/server'
import { verificarOrganizador } from '@/lib/supabase/api-helpers'
import { createAdminSupabase } from '@/lib/supabase/server'

/**
 * DELETE /api/colaboradores-autorizados/[id]
 * Remove um colaborador autorizado pelo ID. Requer role='organizador'.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verificarOrganizador()
  if (!auth.ok) return auth.response

  const { error } = await createAdminSupabase()
    .from('colaboradores_autorizados')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
