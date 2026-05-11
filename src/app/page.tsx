import Image from 'next/image'
import Link from 'next/link'

/**
 * Pagina inicial publica — apresenta o sistema e direciona ao login.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">

        {/* Logos */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <Image src="/cipa-logo-1.png" alt="CIPA" width={80} height={80} className="object-contain" />
          <div className="w-px h-12 bg-gray-200" />
          <Image src="/vixting-by-sankhya.png" alt="Vixting" width={120} height={40} className="object-contain" />
        </div>

        <h1 className="text-2xl font-bold text-blue-900 mb-2">SIPAT Vixting 2026</h1>
        <p className="text-gray-500 text-sm mb-8">
          Registro de presença via QR code com emissão de certificado.
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
