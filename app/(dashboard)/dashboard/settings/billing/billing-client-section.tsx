'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { translateApiError } from '@/lib/translate-api-error'

export function BillingClientSection() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleOpenPortal = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      toast({
        title: 'Erreur',
        description: translateApiError(data.error) || 'Impossible d\'ouvrir le portail de facturation.',
        variant: 'destructive',
      })
    } catch (e) {
      console.error(e)
      toast({
        title: 'Erreur',
        description: 'Erreur réseau. Vérifiez votre connexion et réessayez.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleOpenPortal}
      disabled={loading}
      className="bg-teal-600 hover:bg-teal-700 text-white border-0"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
          Ouverture...
        </>
      ) : (
        'Gérer l\'abonnement'
      )}
    </Button>
  )
}
