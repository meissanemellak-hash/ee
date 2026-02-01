import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Formate une quantité de recette pour l'affichage.
 * Convertit kg→g et L→ml quand la valeur est petite pour une meilleure lisibilité.
 */
export function formatRecipeQuantity(quantity: number, unit: string): { value: number; unit: string } {
  const u = unit.trim().toLowerCase()
  if ((u === 'kg' || u === 'kilogramme' || u === 'kilogrammes') && quantity > 0 && quantity < 1) {
    const g = Math.round(quantity * 1000 * 100) / 100 // éviter 60.0000001
    return { value: g % 1 === 0 ? Math.round(g) : g, unit: 'g' }
  }
  if ((u === 'l' || u === 'litre' || u === 'litres') && quantity > 0 && quantity < 1) {
    const ml = Math.round(quantity * 1000 * 100) / 100
    return { value: ml % 1 === 0 ? Math.round(ml) : ml, unit: 'ml' }
  }
  return { value: quantity, unit: unit }
}

/**
 * Exporte un tableau d'objets vers un fichier CSV et déclenche le téléchargement.
 * @param data - Tableau d'objets à exporter
 * @param filename - Nom du fichier (ex: ingredients_2026-01-31.csv)
 * @param columns - Colonnes à exporter : { key: string, header: string }[] (optionnel, utilise toutes les clés sinon)
 */
export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; header: string }[]
): void {
  if (data.length === 0) return
  const keys = columns ?? (Object.keys(data[0]) as (keyof T)[])
  const headers = columns ? columns.map((c) => c.header) : (keys as string[])
  const escape = (val: unknown): string => {
    const str = val == null ? '' : String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  const rows = data.map((row) =>
    (columns ? columns.map((c) => escape(row[c.key])) : (keys as (keyof T)[]).map((k) => escape(row[k]))).join(',')
  )
  const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
