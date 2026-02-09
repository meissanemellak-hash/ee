'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { translateApiError } from '@/lib/translate-api-error'
import type { PlanId } from '@/lib/stripe'
import { Loader2, Copy, Check } from 'lucide-react'

const PLAN_OPTIONS: { value: PlanId; label: string }[] = [
  { value: 'starter', label: 'Essentiel (1–5 restos)' },
  { value: 'growth', label: 'Croissance (6–10 restos)' },
  { value: 'pro', label: 'Pro (10+ restos)' },
]

type Props = {
  /** ID de l'organisation dans Clerk (org_xxx). Utilisé pour lister les orgs depuis Clerk puis synchro à la génération. */
  clerkOrgId: string
  organizationName: string
}

export function GenerateCheckoutLinkButton({ clerkOrgId, organizationName }: Props) {
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [plan, setPlan] = useState<PlanId>('pro')
  const { toast } = useToast()

  const handleGenerate = async () => {
    setLoading(true)
    setUrl(null)
    try {
      const res = await fetch('/api/admin/create-checkout-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkOrgId, plan }),
      })
      const raw = await res.text()
      let data: { url?: string; error?: string } = {}
      try {
        data = raw ? JSON.parse(raw) : {}
      } catch {
        // Réponse non-JSON (ex. page d'erreur HTML)
        toast({
          title: 'Erreur',
          description: res.ok ? 'Réponse invalide du serveur.' : `Erreur serveur (${res.status}). Vérifiez la console et les variables d\'environnement (Stripe, SUPER_ADMIN_EMAIL).`,
          variant: 'destructive',
        })
        return
      }
      if (!res.ok) {
        toast({
          title: 'Erreur',
          description: translateApiError(data.error) || data.error || 'Impossible de générer le lien',
          variant: 'destructive',
        })
        return
      }
      if (data.url) {
        setUrl(data.url)
        toast({
          title: 'Lien généré',
          description: `Lien pour ${organizationName} prêt à être copié.`,
        })
      }
    } catch (e) {
      console.error(e)
      toast({
        title: 'Erreur',
        description: 'Erreur réseau. Vérifiez que le serveur tourne et que Stripe est configuré (.env.local).',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({ title: 'Copié', description: 'Lien copié dans le presse-papier.' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: 'Erreur',
        description: 'Copie impossible',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
      <Select value={plan} onValueChange={(v) => setPlan(v as PlanId)}>
        <SelectTrigger className="min-w-[220px] w-[240px] h-9 shrink-0" aria-label="Choisir le plan">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PLAN_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={handleGenerate}
        disabled={loading}
        variant="default"
        size="sm"
        className="bg-teal-600 hover:bg-teal-700 text-white border-0 shrink-0"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
            Génération...
          </>
        ) : (
          'Générer le lien'
        )}
      </Button>
      {url && (
        <div className="flex gap-2 min-w-0">
          <Input
            readOnly
            value={url}
            className="font-mono text-xs bg-muted/50"
            aria-label="URL du lien de paiement"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            aria-label="Copier le lien"
            className="shrink-0"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}
