import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bem-Estar | Gestão de Refeições',
  description: 'Sistema de gestão de refeições escolares com controle de cotas semanais',
  keywords: ['refeições', 'escola', 'gestão', 'cotas', 'alunos'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} h-full antialiased touch-manipulation`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}