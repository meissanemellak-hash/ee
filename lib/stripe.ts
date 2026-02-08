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
 * Libellés d'affichage des plans (lookup_key Stripe → nom affiché).
 * essentiel / croissance / pro = clés utilisées dans Stripe.
 * starter / growth = anciennes clés pour rétrocompatibilité.
 */
export const PLAN_DISPLAY_NAMES: Record<string, string> = {
  essentiel: 'Essentiel',
  croissance: 'Croissance',
  pro: 'Pro',
  starter: 'Essentiel',
  growth: 'Croissance',
}

/** Retourne le libellé affichable du plan (ex. "Essentiel", "Pro") ou la valeur brute si inconnu. */
export function getPlanDisplayName(plan: string | null): string {
  if (!plan) return ''
  const normalized = plan.toLowerCase().trim()
  return PLAN_DISPLAY_NAMES[normalized] ?? plan
}

/** Clé publique Stripe pour le client (Elements, mise à jour carte in-app). Optionnel. */
function sanitizePublishableKey(raw: string): string {
  const trimmed = raw.trim()
  // Garder uniquement les caractères valides (évite BOM, espaces, retours à la ligne copiés par erreur)
  return trimmed.replace(/[^a-zA-Z0-9_]/g, '')
}

export const STRIPE_PUBLISHABLE_KEY =
  typeof process !== 'undefined'
    ? sanitizePublishableKey(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? process.env.STRIPE_PUBLISHABLE_KEY ?? '')
    : ''
