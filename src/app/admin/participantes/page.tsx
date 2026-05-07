import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ParticipantesAdminList from '@/components/participantes-admin-list'
import { Participante } from '@/types'

/**
 * Página de gestão de Participantes.
 * Permite ao Organizador promover Participantes a Organizador e vice-versa.
 * Requer role='organizador' — redireciona para /dashboard se não autorizado.
 */
export default async function AdminParticipantesPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: participanteAtual } = await supabase
    .from('participantes')
    .select('role')
    .eq('id', user.id)
    .single()

  if (participanteAtual?.role !== 'organizador') redirect('/dashboard')

  const { data: participantes } = await createAdminSupabase()
    .from('participantes')
    .select('id, nome, email, role, criado_em')
    .order('criado_em', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/admin"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Voltar ao painel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Participantes</h1>
            <p className="text-gray-500 text-sm">
              {participantes?.length ?? 0} cadastrado{participantes?.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <ParticipantesAdminList
            participantesIniciais={(participantes ?? []) as Participante[]}
            organizadorAtualId={user.id}
          />
        </div>
      </div>
    </main>
  )
}
