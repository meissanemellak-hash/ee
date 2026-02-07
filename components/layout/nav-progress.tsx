'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

/**
 * Barre de progression fine en haut de page au changement de route.
 * Donne un retour visuel immédiat au clic et améliore la perception de vitesse.
 */
export function NavProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const prevPathname = useRef(pathname)
  const isFirstMount = useRef(true)

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      prevPathname.current = pathname
      return
    }
    if (prevPathname.current === pathname) return
    prevPathname.current = pathname
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 500)
    return () => clearTimeout(t)
  }, [pathname])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 z-[100] h-0.5 w-0 bg-teal-500 dark:bg-teal-400 animate-nav-progress pointer-events-none"
      role="progressbar"
      aria-hidden
    />
  )
}
