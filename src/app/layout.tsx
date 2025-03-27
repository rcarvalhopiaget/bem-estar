import type { Metadata } from 'next'
import { Inter } from 'next/font/google';
import './globals.css'
import { MockAuthProvider } from '@/contexts/MockAuthContext';

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
        <MockAuthProvider>
          {children}
        </MockAuthProvider>
      </body>
    </html>
  )
}