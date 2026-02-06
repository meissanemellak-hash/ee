import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Centre d'aide | AI Operations",
  description: "Documentation et guide d'utilisation d'AI Operations",
}

export default function AideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
