import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminContent from '@/components/admin-content'

/**
 * Pagina do painel do Organizador.
 * Gerencia Eventos, DiaDeEvento e ativacao do CodigoDoDia.
 * Requer role='organizador' — redireciona para /dashboard se nao for Organizador.
 */
export default async function AdminPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: participante } = await supabase
    .from('participantes')
    .select('*')
    .eq('id', user.id)
    .single()

  if (participante?.role !== 'organizador') redirect('/dashboard')

  const { data: eventos } = await supabase
    .from('eventos')
    .select(`*, dias_de_evento(*)`)
    .order('criado_em', { ascending: false })

  return <AdminContent participante={participante} eventos={eventos ?? []} />
}
