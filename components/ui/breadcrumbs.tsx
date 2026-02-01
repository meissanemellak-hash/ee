'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
  /** Conserve les params URL (ex: ?restaurant=xxx) dans les liens */
  preserveSearchParams?: boolean
}

/**
 * Fil d'Ariane pour la navigation.
 * Le dernier item est affiché sans lien (page courante).
 */
export function Breadcrumbs({ items, className, preserveSearchParams = true }: BreadcrumbsProps) {
  const searchParams = useSearchParams()
  if (items.length === 0) return null

  const toHref = (href: string) => {
    if (!preserveSearchParams || !href) return href
    const restaurant = searchParams.get('restaurant')
    if (!restaurant) return href
    const sep = href.includes('?') ? '&' : '?'
    return `${href}${sep}restaurant=${restaurant}`
  }

  return (
    <nav aria-label="Fil d'Ariane" className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const isFirst = index === 0

        return (
          <span key={index} className="flex items-center gap-1.5">
            {!isFirst && (
              <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
            )}
            {isLast ? (
              <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none" aria-current="page">
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={toHref(item.href)}
                className="hover:text-foreground truncate max-w-[120px] sm:max-w-[200px] transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="truncate max-w-[120px] sm:max-w-[200px]">{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
