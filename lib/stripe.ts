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

/** Plans et prix (IDs Stripe Price) - à configurer dans le Dashboard Stripe. Cohérent avec la landing (5 000 € / mois). */
export const STRIPE_PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER ?? '',
    amount: 5000, // 5 000 € / mois (aligné landing + Stripe)
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO ?? '',
    amount: 5000, // 5 000 € / mois
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
    amount: 10000, // 10 000 € / mois (devis sur mesure)
  },
} as const

export type PlanId = keyof typeof STRIPE_PLANS
