import Link from 'next/link'

/**
 * Página 404 global — renderizada pelo Next.js quando nenhuma rota bate.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-6xl font-bold text-blue-200 mb-4">404</p>
        <h1 className="text-xl font-bold text-blue-900 mb-2">Página não encontrada</h1>
        <p className="text-gray-500 text-sm mb-8">
          O endereço que você acessou não existe ou foi removido.
        </p>
        <Link
          href="/"
          className="block w-full bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  )
}
