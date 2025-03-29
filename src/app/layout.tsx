import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext' // Descomentado
import { Toaster } from "@/components/ui/toaster" // Mantido importado

export const metadata = {
  title: 'Bem Estar - Plataforma de Alimentação Saudável',
  description: 'Plataforma para conectar pessoas a restaurantes com alimentação saudável',
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