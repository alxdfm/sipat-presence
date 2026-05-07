import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardContent from '@/components/dashboard-content'

/**
 * Pagina do Dashboard do Participante.
 * Exibe as Presencas registradas e o botao para gerar o Certificado.
 * Rota protegida — redireciona para /login se nao autenticado.
 */
export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: participante } = await supabase
    .from('participantes')
    .select('*')
    .eq('id', user.id)
    .single()

  return <DashboardContent participante={participante} />
}
