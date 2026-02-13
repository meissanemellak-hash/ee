'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { translateApiError } from '@/lib/translate-api-error'
import { Loader2, FileText, ExternalLink } from 'lucide-react'

interface ManageSubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface InvoiceRow {
  id: string
  created: number
  amountPaid: number
  currency: string
  status: string
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
}

function invoiceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    paid: 'Payé',
    open: 'Ouvert',
    draft: 'Brouillon',
    uncollectible: 'Irrécupérable',
    void: 'Annulé',
  }
  return labels[status.toLowerCase()] ?? status
}

export function ManageSubscriptionModal({
  open,
  onOpenChange,
  onSuccess,
}: ManageSubscriptionModalProps) {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const { toast } = useToast()

  const openStripePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: 'Erreur',
          description: translateApiError(data.error) || data.error || 'Impossible d\'ouvrir le portail.',
          variant: 'destructive',
        })
        return
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      toast({
        title: 'Erreur',
        description: 'Réponse invalide du serveur.',
        variant: 'destructive',
      })
    } catch {
      toast({
        title: 'Erreur',
        description: 'Erreur réseau. Réessayez plus tard.',
        variant: 'destructive',
      })
    } finally {
      setPortalLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    setLoadingInvoices(true)
    fetch('/api/stripe/invoices')
      .then((r) => r.json())
      .then((data) => setInvoices(data.invoices ?? []))
      .catch(() => setInvoices([]))
      .finally(() => setLoadingInvoices(false))
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gérer l&apos;abonnement</DialogTitle>
          <DialogDescription>
            Consultez vos factures ici ou ouvrez le portail Stripe pour modifier votre moyen de paiement.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          {/* Portail Stripe */}
          <section className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Pour modifier votre carte bancaire, mettre à jour votre abonnement ou gérer vos préférences de facturation, utilisez le portail sécurisé Stripe.
            </p>
            <Button
              type="button"
              onClick={openStripePortal}
              disabled={portalLoading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {portalLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
                  Ouverture...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" aria-hidden />
                  Ouvrir le portail Stripe
                </>
              )}
            </Button>
          </section>

          {/* Factures */}
          <section>
            <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
              <FileText className="h-4 w-4" />
              Factures
            </h3>
            {loadingInvoices ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Chargement...
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune facture pour le moment.</p>
            ) : (
              <>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left p-2 font-medium">Date</th>
                        <th className="text-left p-2 font-medium">Montant</th>
                        <th className="text-left p-2 font-medium">Statut</th>
                        <th className="text-right p-2 font-medium">Télécharger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="border-b last:border-0">
                          <td className="p-2">
                            {new Date(inv.created * 1000).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="p-2">
                            {(inv.amountPaid / 100).toFixed(2)} {inv.currency.toUpperCase()}
                          </td>
                          <td className="p-2">{invoiceStatusLabel(inv.status)}</td>
                          <td className="p-2 text-right">
                            {(inv.invoicePdf || inv.hostedInvoiceUrl) && (
                              <a
                                href={`/api/stripe/invoice-pdf?invoiceId=${encodeURIComponent(inv.id)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-600 hover:underline"
                              >
                                PDF
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
