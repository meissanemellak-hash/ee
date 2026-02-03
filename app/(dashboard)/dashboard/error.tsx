'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="p-6 lg:p-8 flex items-center justify-center min-h-[50vh]" role="alert" aria-live="assertive">
      <Card className="rounded-xl border shadow-sm border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Une erreur s&apos;est produite</CardTitle>
              <CardDescription className="mt-0.5">
                Le chargement de cette page a échoué. Vous pouvez réessayer.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || 'Erreur inconnue. Vérifiez votre connexion et réessayez.'}
          </p>
          <Button
            onClick={reset}
            variant="outline"
            className="w-full sm:w-auto border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
            aria-label="Réessayer le chargement"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
