import { Suspense } from 'react'
import PresencaContent from '@/components/presenca-content'

export default function PresencaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Carregando...</p></div>}>
      <PresencaContent />
    </Suspense>
  )
}
