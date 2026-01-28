import { useMutation } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import type { Report, ReportType } from '@/lib/services/reports'

export interface ReportFilters {
  restaurantId?: string
  startDate?: string
  endDate?: string
  includeResolved?: boolean
}

export function useGenerateReport() {
  const { organization } = useOrganization()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (params: {
      reportType: ReportType
      filters?: ReportFilters
    }) => {
      if (!organization?.id) throw new Error('No organization selected')

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: params.reportType,
          filters: params.filters || {},
          clerkOrgId: organization.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'Erreur lors de la génération')
      }

      return response.json() as Promise<Report>
    },
    onSuccess: () => {
      toast({
        title: 'Rapport généré',
        description: 'Le rapport a été généré avec succès.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
