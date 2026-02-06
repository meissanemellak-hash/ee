import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Demander une démo | IA Restaurant Manager',
  description: 'Demandez une démo personnalisée de la plateforme IA Restaurant Manager pour piloter vos restaurants.',
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
