'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error boundary global do App Router.
 * Captura exceções não tratadas em Server Components e exibe UI de recuperação.
 * Deve ser Client Component — recebe a função `reset` para re-renderizar a árvore.
 */
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-red-700 mb-2">Algo deu errado</h1>
        <p className="text-gray-500 text-sm mb-8">
          Ocorreu um erro inesperado. Tente novamente ou recarregue a página.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="block w-full border border-gray-300 text-gray-600 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </main>
  )
}
