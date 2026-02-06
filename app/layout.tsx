import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { frFR } from '@clerk/localizations'
import { Toaster } from '@/components/ui/toaster'
import { ReactQueryProvider } from '@/lib/react-query/provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Override "S'inscrire" par "Demander une démo" sur la page de connexion
const localization = {
  ...frFR,
  signIn: {
    ...frFR.signIn,
    start: {
      ...frFR.signIn?.start,
      actionLink: 'Demander une démo',
    },
  },
}

export const metadata: Metadata = {
  title: 'IA Restaurant Manager - Chaînes de Fast-Casual',
  description: 'Optimisez les opérations de votre chaîne de restaurants',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider localization={localization}>
      <ReactQueryProvider>
        <html lang="fr" suppressHydrationWarning>
          <body className={inter.className} suppressHydrationWarning>
            {children}
            <Toaster />
          </body>
        </html>
      </ReactQueryProvider>
    </ClerkProvider>
  )
}
