'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getPlanDisplayName } from '@/lib/stripe'

export default function DemoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planFromUrl = useMemo(() => {
    const p = searchParams.get('plan')?.toLowerCase().trim()
    return p && (p === 'essentiel' || p === 'croissance' || p === 'pro') ? p : null
  }, [searchParams])

  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [societe, setSociete] = useState('')
  const [nbRestaurants, setNbRestaurants] = useState('')
  const [message, setMessage] = useState('')
  const [douleurs, setDouleurs] = useState('')
  const [priorites, setPriorites] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (nom.trim()) params.set('nom', nom.trim())
    if (email.trim()) params.set('email', email.trim())
    if (societe.trim()) params.set('societe', societe.trim())
    if (nbRestaurants.trim()) params.set('nb_restaurants', nbRestaurants.trim())
    if (message.trim()) params.set('message', message.trim())
    if (douleurs.trim()) params.set('douleurs', douleurs.trim())
    if (priorites.trim()) params.set('priorites', priorites.trim())
    if (planFromUrl) params.set('plan', planFromUrl)
    router.push(`/demo/merci?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-muted/25">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-semibold text-foreground hover:opacity-90">
              IA Restaurant Manager
            </Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Demander une démo</h1>
          <p className="mt-3 text-muted-foreground">
            Remplissez le formulaire ci-dessous. Vous serez ensuite invité à choisir un créneau pour votre démo personnalisée.
          </p>
          {planFromUrl && (
            <p className="mt-2 text-sm font-medium text-teal-700 dark:text-teal-400">
              Offre concernée : {getPlanDisplayName(planFromUrl)}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-10 max-w-2xl mx-auto space-y-6 px-6 lg:px-0">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom et prénom</Label>
            <Input
              id="nom"
              type="text"
              placeholder="Jean Dupont"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jean@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="societe">Société / Groupe</Label>
            <Input
              id="societe"
              type="text"
              placeholder="Nom de votre société ou groupe"
              value={societe}
              onChange={(e) => setSociete(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nb_restaurants">Nombre de restaurants (ou établissements)</Label>
            <Input
              id="nb_restaurants"
              type="text"
              placeholder="Ex. 5"
              value={nbRestaurants}
              onChange={(e) => setNbRestaurants(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="douleurs">Quelles sont vos principales difficultés aujourd&apos;hui ?</Label>
            <textarea
              id="douleurs"
              rows={3}
              placeholder="Ex. gaspillage, ruptures de stock, suivi multi-restaurants, tableaux Excel éparpillés, alertes trop tard..."
              value={douleurs}
              onChange={(e) => setDouleurs(e.target.value)}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priorites">Qu&apos;aimeriez-vous améliorer en priorité ?</Label>
            <textarea
              id="priorites"
              rows={3}
              placeholder="Ex. réduire le gaspillage, anticiper les ruptures, centraliser les données, avoir une vue groupe en temps réel..."
              value={priorites}
              onChange={(e) => setPriorites(e.target.value)}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message ou questions (optionnel)</Label>
            <textarea
              id="message"
              rows={3}
              placeholder="Précisez votre besoin, vos questions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex justify-center pt-2">
            <Button type="submit" size="lg" className="bg-teal-600 hover:bg-teal-700 text-white border-0">
              Continuer vers le choix du créneau
            </Button>
          </div>
        </form>
      </main>

      <footer className="border-t border-border/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Accueil</Link>
          <span className="mx-2">·</span>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
        </div>
      </footer>
    </div>
  )
}
