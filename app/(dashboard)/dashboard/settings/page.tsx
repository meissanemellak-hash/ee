'use client'

import { useState, useEffect } from 'react'
import { useOrganization, useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, Building2, User, Bell, Shield, Trash2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
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

interface OrganizationData {
  id: string
  name: string
  shrinkPct: number
  clerkOrgId?: string
  createdAt: string
  updatedAt: string
}

export default function SettingsPage() {
  const { organization, membership, isLoaded: orgLoaded } = useOrganization()
  const { user, isLoaded: userLoaded } = useUser()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [orgData, setOrgData] = useState<OrganizationData | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [serverUserId, setServerUserId] = useState<string | null>(null)
  
  // Vérifier si l'utilisateur peut modifier le nom (créateur ou admin)
  const canEditName = membership?.role === 'org:admin' || membership?.role === 'org:creator' || organization?.createdBy === user?.id
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    shrinkPct: '0.1',
  })

  useEffect(() => {
    if (orgLoaded && organization?.id) {
      loadOrganizationData()
    } else if (orgLoaded && !organization?.id) {
      setLoading(false)
    }
  }, [orgLoaded, organization?.id])

  useEffect(() => {
    // Charger l'ID utilisateur depuis le serveur pour comparaison
    const loadServerUserId = async () => {
      try {
        const response = await fetch('/api/user/current')
        if (response.ok) {
          const data = await response.json()
          setServerUserId(data.userId)
        }
      } catch (error) {
        console.error('Error loading server user ID:', error)
      }
    }
    
    if (userLoaded) {
      loadServerUserId()
    }
  }, [userLoaded])

  const loadOrganizationData = async () => {
    if (!organization?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/organizations?clerkOrgId=${organization.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrgData(data)
        setFormData({
          name: data.name || '',
          shrinkPct: (data.shrinkPct || 0.1).toString(),
        })
      } else {
        throw new Error('Failed to load organization data')
      }
    } catch (error) {
      console.error('Error loading organization:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de l\'organisation.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveOrganization = async () => {
    if (!organization?.id) return

    setSaving(true)
    try {
      const response = await fetch('/api/organizations/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          shrinkPct: parseFloat(formData.shrinkPct),
          clerkOrgId: organization.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        // Si c'est une erreur de permissions, afficher un message spécifique
        if (response.status === 403 && error.requiresAdmin) {
          throw new Error(error.details || error.error || 'Vous n\'avez pas les permissions nécessaires pour modifier le nom de l\'organisation.')
        }
        throw new Error(error.details || error.error || 'Erreur lors de la sauvegarde')
      }

      const updatedData = await response.json()
      setOrgData(updatedData)

      // Afficher un message de succès ou d'information selon le résultat
      if (updatedData.warning) {
        // Information (pas d'erreur) - la mise à jour a réussi dans l'app
        toast({
          title: '✅ Paramètres mis à jour',
          description: updatedData.warning,
          variant: 'default',
        })
      } else if (updatedData.clerkSync) {
        // Synchronisation réussie avec Clerk
        toast({
          title: '✅ Succès',
          description: 'Les paramètres de l\'organisation ont été mis à jour dans l\'application et synchronisés avec Clerk.',
          variant: 'default',
        })
      } else {
        // Mise à jour réussie dans la DB uniquement (pas de synchronisation Clerk nécessaire)
        toast({
          title: '✅ Succès',
          description: 'Les paramètres de l\'organisation ont été mis à jour avec succès.',
          variant: 'default',
        })
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFixOrgId = async () => {
    if (!organization?.id || !orgData) return

    setSaving(true)
    try {
      const response = await fetch('/api/organizations/fix-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correctClerkOrgId: organization.id, // L'ID correct depuis Clerk
          currentOrgId: orgData.clerkOrgId || orgData.id, // Le clerkOrgId actuel dans la DB
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Erreur lors de la correction de l\'ID')
      }

      toast({
        title: 'Succès',
        description: data.message || 'L\'ID de l\'organisation a été corrigé avec succès.',
        variant: 'default',
      })

      // Recharger les données de l'organisation
      await loadOrganizationData()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!orgLoaded || !userLoaded || loading) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border shadow-sm">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Chargement des paramètres...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune organisation active</h3>
            <p className="text-muted-foreground">
              Veuillez sélectionner ou créer une organisation.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header (Style Sequence) */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground mt-1">
          Gérez les paramètres de votre organisation et votre profil
        </p>
      </div>

      {/* Section Organisation (Style Sequence) */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold">Organisation</CardTitle>
          </div>
          <CardDescription className="mt-1">
            Informations et paramètres de votre organisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Nom de l'organisation</Label>
            <Input
              id="org-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom de l'organisation"
              disabled={!canEditName}
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
            />
            {!canEditName && (
              <p className="text-sm text-muted-foreground">
                ⚠️ Seul le créateur de l'organisation ou un administrateur peut modifier le nom. 
                Contactez le créateur ou demandez à être promu administrateur.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              ℹ️ Le nom modifié sera utilisé dans toute l'application. 
              En cas de limitation technique avec Clerk, vous pouvez également mettre à jour le nom directement dans le dashboard Clerk.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shrink-pct">
              Pourcentage de shrink (gaspillage) par défaut
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="shrink-pct"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.shrinkPct}
                onChange={(e) => setFormData({ ...formData, shrinkPct: e.target.value })}
                className="w-32 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
              />
              <span className="text-sm text-muted-foreground">
                ({parseFloat(formData.shrinkPct || '0') * 100}%)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ce pourcentage est utilisé pour calculer le gaspillage estimé dans les prévisions.
              Valeur entre 0 (0%) et 1 (100%).
            </p>
          </div>

          {orgData && (
            <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t">
              <p>Créée le : {new Date(orgData.createdAt).toLocaleDateString('fr-FR')}</p>
              <p>Dernière mise à jour : {new Date(orgData.updatedAt).toLocaleDateString('fr-FR')}</p>
              <div className="pt-2 space-y-1">
                <p className="font-medium">ID dans la DB : <code className="text-xs bg-muted px-1 py-0.5 rounded">{orgData.id}</code></p>
                <p className="font-medium">ID ClerkOrg dans la DB : <code className="text-xs bg-muted px-1 py-0.5 rounded">{orgData.clerkOrgId || 'Non défini'}</code></p>
                {organization?.id && (
                  <p className="font-medium">ID Clerk actuel : <code className="text-xs bg-muted px-1 py-0.5 rounded">{organization.id}</code></p>
                )}
                {organization?.id && orgData.clerkOrgId && organization.id !== orgData.clerkOrgId && (
                  <p className="text-amber-600 dark:text-amber-400 text-xs mt-2">
                    ⚠️ Les IDs ne correspondent pas ! Utilisez le bouton "Corriger l'ID" pour synchroniser.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button onClick={handleSaveOrganization} disabled={saving} className="shadow-sm">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
            
            {orgData && (
              <Button
                variant="outline"
                onClick={handleFixOrgId}
                disabled={saving}
                title="Corriger l'ID de l'organisation si il ne correspond pas à celui dans Clerk"
                className="shadow-sm"
              >
                🔧 Corriger l'ID
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Profil utilisateur (Style Sequence) */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold">Profil utilisateur</CardTitle>
          </div>
          <CardDescription className="mt-1">
            Informations sur votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <>
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input
                  value={user.fullName || 'Non défini'}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={user.primaryEmailAddress?.emailAddress || 'Non défini'}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label>ID utilisateur (Clerk)</Label>
                <Input
                  value={user.id || 'Non disponible'}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 font-mono text-xs"
                  placeholder="ID utilisateur depuis Clerk"
                />
                {serverUserId && (
                  <>
                    {user.id && serverUserId && user.id !== serverUserId && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          ⚠️ Les IDs ne correspondent pas ! Client: {user.id}, Serveur: {serverUserId}
                        </p>
                      </div>
                    )}
                    {user.id && serverUserId && user.id === serverUserId && (
                      <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-700 dark:text-green-400">
                          ✅ L'ID utilisateur est correct et correspond entre client et serveur
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-800 dark:text-blue-200 font-semibold mb-1">
                    ℹ️ Note importante :
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    L'<strong>ID utilisateur</strong> (commence par <code>user_</code>) identifie <strong>votre compte personnel</strong> dans Clerk.
                    <br />
                    L'<strong>ID organisation</strong> (commence par <code>org_</code>) identifie <strong>l'organisation</strong> dans Clerk.
                    <br />
                    <strong>Ces deux IDs sont différents par design</strong> - c'est normal et attendu. Un utilisateur peut appartenir à plusieurs organisations.
                  </p>
                </div>
              </div>

              <div className="my-4 border-t" />

              <p className="text-sm text-muted-foreground">
                Pour modifier votre profil (nom, email, mot de passe), utilisez le menu utilisateur en haut à droite.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section Préférences (Style Sequence) */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold">Préférences</CardTitle>
          </div>
          <CardDescription className="mt-1">
            Configurez vos préférences de notifications et d'affichage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-800 dark:text-purple-300 font-medium mb-2">
              Les préférences de notifications seront disponibles prochainement.
            </p>
            <p className="text-sm text-purple-700 dark:text-purple-400 mb-2">Vous pourrez configurer :</p>
            <ul className="text-sm text-purple-700 dark:text-purple-400 list-disc list-inside space-y-1">
              <li>Notifications par email pour les alertes critiques</li>
              <li>Rapports automatiques hebdomadaires</li>
              <li>Alertes en temps réel</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Section Danger Zone (Style Sequence) */}
      <Card className="border shadow-sm border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold text-red-800 dark:text-red-400">Zone de danger</CardTitle>
          </div>
          <CardDescription className="mt-1 text-red-700 dark:text-red-300">
            Actions irréversibles sur votre organisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <h4 className="font-semibold text-red-800 dark:text-red-400">Supprimer l'organisation</h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Cette action est irréversible. Toutes les données de l'organisation seront définitivement supprimées.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="shadow-sm flex-shrink-0"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement votre organisation
              et toutes les données associées (restaurants, produits, ventes, prévisions, etc.).
              <br /><br />
              <strong>Cette fonctionnalité n'est pas encore implémentée.</strong>
              <br />
              Contactez le support pour supprimer votre organisation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteDialog(false)
                toast({
                  title: 'Fonctionnalité à venir',
                  description: 'La suppression d\'organisation n\'est pas encore disponible. Contactez le support.',
                  variant: 'default',
                })
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Je comprends, supprimer quand même
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
