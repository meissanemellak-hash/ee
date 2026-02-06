'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useOrganizationList, useOrganization } from '@clerk/nextjs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function CreateOrganizationButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const { toast } = useToast()
  const router = useRouter()
  const { setActive, userMemberships, isLoaded: orgListLoaded } = useOrganizationList()
  const { organization: currentOrg } = useOrganization()
  
  // Extraire la liste des organisations depuis les membres
  const organizationList = userMemberships?.data?.map((membership) => membership.organization) || []

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un nom pour votre organisation',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Afficher le message d'erreur détaillé
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}`
          : data.error || 'Erreur lors de la création'
        throw new Error(errorMessage)
      }

      setOpen(false)
      setName('')
      
      // Afficher le toast avec instructions
      toast({
        title: 'Organisation créée',
        description: `L'organisation "${data.organization.name}" a été créée dans Clerk et la base de données. Redirection vers le dashboard...`,
        duration: 4000,
      })
      
      // Attendre un peu pour que Clerk synchronise, puis rediriger
      // L'organisation devrait maintenant apparaître dans le sélecteur Clerk
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
    } catch (error) {
      console.error('Error creating organization:', error)
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000, // Afficher plus longtemps pour voir les détails
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Créer une organisation</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une organisation</DialogTitle>
          <DialogDescription>
            Créez votre organisation pour commencer à utiliser IA Restaurant Manager.
            Vous pourrez gérer plusieurs restaurants et optimiser vos opérations.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Nom de l&apos;organisation</Label>
            <Input
              id="org-name"
              placeholder="Ex: Ma Chaîne de Restaurants"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleCreate()
                }
              }}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Ce nom sera visible dans votre interface et pour vos collaborateurs.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
