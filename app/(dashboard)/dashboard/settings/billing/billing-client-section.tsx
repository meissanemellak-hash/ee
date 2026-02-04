'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function BillingClientSection() {
  const [loading, setLoading] = useState(false)

  const handleOpenPortal = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      alert(data.error ?? 'Erreur')
    } catch (e) {
      console.error(e)
      alert('Erreur réseau')
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
