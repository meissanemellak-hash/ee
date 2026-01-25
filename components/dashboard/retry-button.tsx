'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export function RetryButton() {
  return (
    <Button
      variant="outline"
      onClick={() => window.location.reload()}
      className="w-full"
    >
      <RefreshCw className="mr-2 h-4 w-4" />
      Réessayer
    </Button>
  )
}
