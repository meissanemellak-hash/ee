'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Store, Package, Beaker, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react'

const STEPS = [
  {
    id: 'welcome',
    title: 'Bienvenue sur AI Operations',
    description: 'Configurez votre espace en quelques instants.',
  },
  {
    id: 'discover',
    title: 'Tout ce dont vous avez besoin',
    description: 'Une seule plateforme pour piloter vos restaurants.',
  },
  {
    id: 'ready',
    title: "Vous êtes prêt",
    description: "Accédez à votre tableau de bord.",
  },
] as const

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)
  const router = useRouter()

  const currentStepId = STEPS[step]?.id ?? 'welcome'
  const isLastStep = step === STEPS.length - 1

  async function handleFinish() {
    setIsCompleting(true)
    try {
      const res = await fetch('/api/organizations/complete-onboarding', {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Erreur')
      router.replace('/dashboard')
      router.refresh()
    } catch {
      setIsCompleting(false)
    }
  }

  return (
    <main
      className="min-h-[calc(100vh-4rem)] bg-muted/25 flex items-center justify-center p-6"
      role="main"
      aria-label="Configuration initiale"
    >
      <div className="w-full max-w-2xl">
        {/* Indicateur d'étapes */}
        <div className="flex justify-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`
                h-2 rounded-full transition-all duration-300
                ${i < step ? 'w-8 bg-teal-600' : i === step ? 'w-10 bg-teal-500' : 'w-2 bg-muted-foreground/25'}
              `}
              aria-hidden
            />
          ))}
        </div>

        <Card className="rounded-2xl border shadow-lg overflow-hidden bg-card">
          {/* Étape 1 : Bienvenue */}
          {currentStepId === 'welcome' && (
            <>
              <div className="h-2 bg-gradient-to-r from-teal-500 to-emerald-600" />
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Bienvenue sur AI Operations
                </CardTitle>
                <CardDescription className="text-base mt-2 max-w-md mx-auto">
                  Pilotez vos restaurants sur une seule plateforme : ventes, stocks, achats et recommandations en temps réel.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <p className="text-muted-foreground text-center text-sm">
                  Ce court parcours vous présente les bases. Vous pourrez ensuite ajouter vos restaurants, produits et ingrédients à tout moment.
                </p>
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-8"
                    onClick={() => setStep(1)}
                  >
                    Commencer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Étape 2 : Découvrir */}
          {currentStepId === 'discover' && (
            <>
              <div className="h-2 bg-gradient-to-r from-teal-500 to-emerald-600" />
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Tout ce dont vous avez besoin
                </CardTitle>
                <CardDescription className="text-base mt-2 max-w-md mx-auto">
                  Une seule plateforme pour maîtriser vos coûts et réduire le gaspillage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <ul className="grid gap-4 sm:grid-cols-2 text-left">
                  <li className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/60">
                    <Store className="h-6 w-6 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Restaurants</span>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Gérez vos établissements et leurs stocks par site.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/60">
                    <Package className="h-6 w-6 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Produits</span>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Catalogue de ventes et recettes (nomenclature).
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/60">
                    <Beaker className="h-6 w-6 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Ingrédients</span>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Achats, coûts et seuils d&apos;alerte par ingrédient.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/60">
                    <TrendingUp className="h-6 w-6 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Ventes & prévisions</span>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Analyse des ventes et recommandations d&apos;achat.
                      </p>
                    </div>
                  </li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setStep(0)}
                    className="rounded-xl"
                  >
                    Retour
                  </Button>
                  <Button
                    size="lg"
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-8"
                    onClick={() => setStep(2)}
                  >
                    Continuer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Étape 3 : C'est parti */}
          {currentStepId === 'ready' && (
            <>
              <div className="h-2 bg-gradient-to-r from-teal-500 to-emerald-600" />
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30">
                  <CheckCircle2 className="h-8 w-8 text-teal-600" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Vous êtes prêt
                </CardTitle>
                <CardDescription className="text-base mt-2 max-w-md mx-auto">
                  Accédez à votre tableau de bord pour commencer à configurer vos restaurants, produits et ingrédients.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isCompleting}
                    className="rounded-xl"
                  >
                    Retour
                  </Button>
                  <Button
                    size="lg"
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-8"
                    onClick={handleFinish}
                    disabled={isCompleting}
                  >
                    {isCompleting ? 'Redirection...' : 'Accéder au tableau de bord'}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Vous pourrez modifier ces paramètres à tout moment dans les réglages.
        </p>
      </div>
    </main>
  )
}
