import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-muted/25 flex items-center justify-center p-6">
      <Card className="rounded-xl border shadow-sm max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <FileQuestion className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
          <h1 className="text-xl font-semibold">Page introuvable</h1>
          <p className="text-muted-foreground text-sm">
            Cette page n&apos;existe pas ou a été déplacée.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white border-0">
              <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Retour à l&apos;accueil</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
