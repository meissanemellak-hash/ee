import Stripe from 'stripe'

/**
 * Instance Stripe côté serveur (clé secrète).
 * Utiliser uniquement dans les API routes et le webhook.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key)
}

/** Plans et prix (IDs Stripe Price) - à configurer dans le Dashboard Stripe. */
export const STRIPE_PLANS = {
  starter: {
    name: 'Essentiel',
    priceId: process.env.STRIPE_PRICE_STARTER ?? '',
    amount: 1500, // 1 500 € / mois (1–5 restaurants)
  },
  growth: {
    name: 'Croissance',
    priceId: process.env.STRIPE_PRICE_GROWTH ?? '',
    amount: 3000, // 3 000 € / mois (6–10 restaurants)
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO ?? '',
    amount: 5000, // 5 000 € / mois (10+ restaurants)
  },
} as const

export type PlanId = keyof typeof STRIPE_PLANS

/**
 * Libellés d'affichage pour le plan (clé Stripe lookup_key ou PlanId → nom affiché).
 * Utilisé sur la page Facturation et partout où on affiche le nom du plan.
 */
export const PLAN_DISPLAY_NAMES: Record<string, string> = {
  // lookup_key Stripe (minuscules)
  essentiel: 'Essentiel',
  croissance: 'Croissance',
  pro: 'Pro',
  // PlanId (code)
  starter: 'Essentiel',
  growth: 'Croissance',
}

/** Retourne le libellé affiché pour un plan (lookup_key ou PlanId stocké en base). */
export function getPlanDisplayName(plan: string | null): string {
  if (!plan) return 'Aucun plan'
  const key = plan.toLowerCase().trim()
  return PLAN_DISPLAY_NAMES[key] ?? STRIPE_PLANS[key as PlanId]?.name ?? plan
}

/** Clé publique Stripe pour le client (Elements, mise à jour carte in-app). Optionnel. */
function sanitizePublishableKey(raw: string): string {
  const trimmed = raw.trim()
  return trimmed.replace(/[^a-zA-Z0-9_]/g, '')
}

export const STRIPE_PUBLISHABLE_KEY =
  typeof process !== 'undefined'
    ? sanitizePublishableKey(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? process.env.STRIPE_PUBLISHABLE_KEY ?? '')
    : ''
