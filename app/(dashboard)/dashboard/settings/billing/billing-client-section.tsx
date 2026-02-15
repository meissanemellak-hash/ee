'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { translateApiError } from '@/lib/translate-api-error'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ManageSubscriptionModal } from './manage-subscription-modal'

interface BillingClientSectionProps {
  canCancel?: boolean
}

export function BillingClientSection({ canCancel = false }: BillingClientSectionProps) {
  const [manageModalOpen, setManageModalOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleConfirmCancel = async () => {
    setCancelLoading(true)
    try {
      const res = await fetch('/api/stripe/cancel-subscription', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: 'Erreur',
          description: translateApiError(data.error) || 'Impossible de résilier l\'abonnement.',
          variant: 'destructive',
        })
        return
      }
      setCancelDialogOpen(false)
      toast({
        title: 'Abonnement résilié',
        description: 'Votre accès aux produits restera actif jusqu\'à la fin de la période en cours.',
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
      setCancelLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => setManageModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white border-0"
        >
          Gérer l&apos;abonnement
        </Button>
        {canCancel && (
          <Button
            variant="outline"
            onClick={() => setCancelDialogOpen(true)}
          >
            Résilier l&apos;abonnement
          </Button>
        )}
      </div>
      <ManageSubscriptionModal
        open={manageModalOpen}
        onOpenChange={setManageModalOpen}
        onSuccess={() => router.refresh()}
      />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Résilier l&apos;abonnement</AlertDialogTitle>
            <AlertDialogDescription>
              Vous perdrez l&apos;accès aux produits à la fin de la période en cours. Souhaitez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmCancel()
              }}
              disabled={cancelLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
                  En cours...
                </>
              ) : (
                'Résilier l\'abonnement'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
