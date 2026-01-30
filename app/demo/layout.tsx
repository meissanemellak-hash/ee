import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Demander une démo | AI Operations',
  description: 'Demandez une démo personnalisée de la plateforme AI Operations pour piloter vos restaurants.',
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
