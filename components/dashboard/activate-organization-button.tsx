'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ArrowUpLeft } from 'lucide-react'

interface ActivateOrganizationButtonProps {
  organizationName: string
}

/**
 * SOLUTION FINALE ET SIMPLE :
 * Le problème est que userMemberships est vide, donc l'organisation n'est pas dans la liste Clerk.
 * La seule solution qui fonctionne est d'utiliser le OrganizationSwitcher de Clerk qui est déjà dans le header.
 * On guide simplement l'utilisateur à cliquer dessus.
 */
export function ActivateOrganizationButton({ organizationName }: ActivateOrganizationButtonProps) {
  const { toast } = useToast()

  const handleActivate = () => {
    toast({
      title: 'Utilisez le sélecteur d\'organisation',
      description: (
        <div className="space-y-2">
          <p>Pour activer &quot;{organizationName}&quot;, cliquez sur le sélecteur d&apos;organisation en haut à gauche (à côté de &quot;meiss food&quot;).</p>
          <p className="text-xs text-muted-foreground">Le sélecteur vous permettra de choisir et d&apos;activer votre organisation.</p>
        </div>
      ),
      duration: 8000,
    })
  }

  return (
    <Button onClick={handleActivate} variant="outline">
      <ArrowUpLeft className="mr-2 h-4 w-4" />
      Utiliser le sélecteur
    </Button>
  )
}
