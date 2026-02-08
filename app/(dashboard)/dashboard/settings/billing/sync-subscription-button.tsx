'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { translateApiError } from '@/lib/translate-api-error'

export function SyncSubscriptionButton() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSync = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/sync-subscription', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: 'Synchronisation impossible',
          description: translateApiError(data.error) || data.error || 'Aucun abonnement actif trouvé.',
          variant: 'destructive',
        })
        return
      }
      toast({
        title: 'Abonnement synchronisé',
        description: 'Votre abonnement est maintenant affiché ci-dessous.',
      })
      router.refresh()
    } catch (e) {
      console.error(e)
      toast({
        title: 'Erreur',
        description: 'Erreur réseau. Réessayez plus tard.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSync}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Synchronisation...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" aria-hidden />
          J&apos;ai déjà payé — synchroniser mon abonnement
        </>
      )}
    </Button>
  )
}
