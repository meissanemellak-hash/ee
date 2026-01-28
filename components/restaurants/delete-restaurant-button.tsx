'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useDeleteRestaurant } from '@/lib/react-query/hooks/use-restaurants'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface DeleteRestaurantButtonProps {
  restaurantId: string
  restaurantName: string
}

export function DeleteRestaurantButton({
  restaurantId,
  restaurantName,
}: DeleteRestaurantButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { organization } = useOrganization()
  const [open, setOpen] = useState(false)
  const deleteRestaurant = useDeleteRestaurant()

  const handleDelete = () => {
    if (!organization?.id) {
      toast({
        title: 'Erreur',
        description: 'Aucune organisation active. Veuillez sélectionner une organisation.',
        variant: 'destructive',
      })
      return
    }

    deleteRestaurant.mutate(restaurantId, {
      onSuccess: () => {
        setOpen(false)
        router.push('/dashboard/restaurants')
      },
      onError: () => {
        setOpen(false)
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Cela supprimera définitivement le restaurant{' '}
            <strong>{restaurantName}</strong> et toutes ses données associées (ventes, stocks, alertes, etc.).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRestaurant.isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteRestaurant.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteRestaurant.isPending ? 'Suppression...' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
