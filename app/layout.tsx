import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/toaster'
import { ReactQueryProvider } from '@/lib/react-query/provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Operations Manager - Chaînes de Fast-Casual',
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
    <ClerkProvider>
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
