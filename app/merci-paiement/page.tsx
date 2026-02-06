import { CheckCircle2 } from 'lucide-react'

export const metadata = {
  title: 'Paiement reçu | IA Restaurant Manager',
  description: 'Votre paiement a bien été enregistré.',
}

export const dynamic = 'force-dynamic'

/**
 * Page affichée après un paiement Stripe réussi (lien envoyé par l'admin).
 * Juste le message : pas de lien ni bouton, le client attend l'email d'invitation.
 */
export default function MerciPaiementPage() {
  return (
    <div className="min-h-screen bg-muted/25 flex flex-col items-center justify-center px-6 py-16">
      <div className="rounded-full bg-teal-100 dark:bg-teal-900/30 p-4 mb-6" aria-hidden>
        <CheckCircle2 className="h-16 w-16 text-teal-600 dark:text-teal-400" />
      </div>
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl text-center">
        Paiement reçu
      </h1>
      <p className="mt-4 text-muted-foreground text-lg text-center max-w-xl">
        Merci pour votre souscription. Vous allez recevoir sous peu un email pour accéder à la plateforme.
      </p>
      <p className="mt-2 text-sm text-muted-foreground text-center">
        En cas de question, contactez-nous.
      </p>
    </div>
  )
}
