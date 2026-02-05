import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/**
 * Ancienne page Tarifs retirée.
 * Redirection vers l'accueil (nouveau processus : lien de paiement envoyé par l'admin).
 */
export default function PricingPage() {
  redirect('/')
}
