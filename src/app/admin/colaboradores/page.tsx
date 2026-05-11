import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ColaboradoresAdminList from '@/components/colaboradores-admin-list'
import { ColaboradorAutorizado } from '@/types'

/**
 * Página de gestão de colaboradores autorizados.
 * O Organizador pode adicionar e remover emails da lista de acesso.
 */
export default async function AdminColaboradoresPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: participanteAtual } = await supabase
    .from('participantes')
    .select('role')
    .eq('id', user.id)
    .single()

  if (participanteAtual?.role !== 'organizador') redirect('/dashboard')

  const { data: colaboradores } = await createAdminSupabase()
    .from('colaboradores_autorizados')
    .select('id, email, criado_em')
    .order('email', { ascending: true })

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
          <Image src="/cipa-logo-1.png" alt="CIPA" width={40} height={40} className="object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Colaboradores Autorizados</h1>
            <p className="text-gray-500 text-sm">
              {colaboradores?.length ?? 0} cadastrado{colaboradores?.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <ColaboradoresAdminList
            colaboradoresIniciais={(colaboradores ?? []) as ColaboradorAutorizado[]}
          />
        </div>
      </div>
    </main>
  )
}
