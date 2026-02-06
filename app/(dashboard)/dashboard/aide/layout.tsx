import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Centre d'aide | IA Restaurant Manager",
  description: "Documentation et guide d'utilisation d'IA Restaurant Manager",
}

export default function AideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
