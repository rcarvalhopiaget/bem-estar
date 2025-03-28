import type { Metadata } from 'next'
import { Inter } from 'next/font/google';
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext';
import ClientLayout from '@/components/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bem Estar',
  description: 'Sistema de Gestão de Refeições',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ClientLayout>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ClientLayout>
      </body>
    </html>
  )
}