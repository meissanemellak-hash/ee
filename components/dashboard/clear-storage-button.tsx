'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Trash2 } from 'lucide-react'

export function ClearStorageButton() {
  const { toast } = useToast()

  const handleClear = () => {
    try {
      localStorage.clear()
      toast({
        title: 'localStorage nettoyé',
        description: 'Tous les flags de synchronisation ont été supprimés. Vous pouvez réessayer.',
      })
      // Recharger la page après un court délai
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de nettoyer le localStorage.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleClear}
      className="w-full"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Nettoyer le cache (localStorage)
    </Button>
  )
}
