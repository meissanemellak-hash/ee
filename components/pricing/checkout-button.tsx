'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { PlanId } from '@/lib/stripe'

type Props = {
  plan: PlanId
  label?: string
  className?: string
}

export function CheckoutButton({ plan, label = 'Choisir ce plan', className }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/sign-in?redirect_url=${encodeURIComponent('/pricing')}`)
          return
        }
        alert(data.error ?? 'Erreur lors de la création de la session')
        return
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      alert('Réponse inattendue du serveur')
    } catch (e) {
      console.error(e)
      alert('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={className}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
          Redirection...
        </>
      ) : (
        label
      )}
    </Button>
  )
}
