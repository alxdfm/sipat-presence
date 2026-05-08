import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/toast'

export const metadata: Metadata = {
  title: 'SIPAT Presença',
  description: 'Registro de presença em SIPAT com geração de certificado',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
