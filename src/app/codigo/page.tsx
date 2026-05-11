import { Suspense } from 'react'
import CodigoContent from './codigo-content'

export default function CodigoPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <CodigoContent />
    </Suspense>
  )
}
