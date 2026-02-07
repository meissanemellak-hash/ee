'use client'

import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/toaster'

/**
 * Affiche le Toaster uniquement après le montage client pour éviter
 * les erreurs d'hydratation (Radix Toast utilise un Portal).
 */
export function ToasterClient() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) return null
  return <Toaster />
}
