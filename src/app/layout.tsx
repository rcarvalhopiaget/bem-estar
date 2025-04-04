import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext' // Descomentado
import { Toaster } from "@/components/ui/toaster" // Mantido importado
import type { Metadata, Viewport } from 'next'; // Adicionar Viewport

export const metadata: Metadata = {
  title: 'Bem Estar - Plataforma de Alimentação Saudável',
  description: 'Plataforma para conectar pessoas a restaurantes com alimentação saudável',
  manifest: '/manifest.json', // Link para o manifest
}

// Adicionar exportação de Viewport
export const viewport: Viewport = {
  themeColor: '#317EFB', // Definido aqui (usando a cor do manifest)
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider> {/* Descomentado */}
          {children}
        </AuthProvider> {/* Descomentado */}
        <Toaster /> {/* Descomentado */}
      </body>
    </html>
  )
}