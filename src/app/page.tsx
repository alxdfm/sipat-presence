import Link from 'next/link'

/**
 * Pagina inicial publica — apresenta o sistema e direciona ao login.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">SIPAT Presenca</h1>
        <p className="text-gray-600 mb-8">
          Registro de presenca em SIPAT via QR code com emissao de certificado.
        </p>
        <Link
          href="/login"
          className="block w-full bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
        >
          Entrar com Google
        </Link>
      </div>
    </main>
  )
}
