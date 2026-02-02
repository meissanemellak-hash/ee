'use client'

import { useState, useEffect, useRef } from 'react'
import { useOrganization, useUser, useClerk } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { Loader2, Save, Building2, User, Bell, Shield, Trash2, AlertCircle, LogOut } from 'lucide-react'
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
import { useOrganizationData, useUpdateOrganization, useFixOrganizationId, useCurrentUser } from '@/lib/react-query/hooks/use-organization'
import { useUserRole } from '@/lib/react-query/hooks/use-user-role'
import { permissions } from '@/lib/roles'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Skeleton } from '@/components/ui/skeleton'
import { MembersSection } from '@/components/settings/members-section'

function SettingsPageSkeleton() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" role="main" aria-label="Paramètres">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-28" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-36 mb-2" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function SettingsPage() {
  const { organization, membership, isLoaded: orgLoaded } = useOrganization()
  const { user, isLoaded: userLoaded } = useUser()
  const { signOut } = useClerk()
  const { toast } = useToast()
  const hasToastedError = useRef(false)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: orgData, isLoading: loadingOrg, isError: orgError, refetch: refetchOrg } = useOrganizationData()
  const { data: currentUserData } = useCurrentUser()
  const { data: roleData, isFetched: roleFetched } = useUserRole()
  const serverUserId = currentUserData?.userId ?? null

  const updateOrganization = useUpdateOrganization()
  const fixOrgId = useFixOrganizationId()

  const currentRole = roleData ?? 'staff'
  const canViewSettings = permissions.canViewSettings(currentRole)
  const canEditSettings = permissions.canEditSettings(currentRole)
  const canEditName = canEditSettings && (membership?.role === 'org:admin' || membership?.role === 'org:creator' || (organization as { createdBy?: string } | null)?.createdBy === user?.id)

  const [formData, setFormData] = useState({
    name: '',
    shrinkPct: '0.1',
  })

  useEffect(() => {
    if (orgData) {
      setFormData({
        name: orgData.name || '',
        shrinkPct: (orgData.shrinkPct ?? 0.1).toString(),
      })
    }
  }, [orgData])

  useEffect(() => {
    if (orgError && !hasToastedError.current) {
      hasToastedError.current = true
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les paramètres de l\'organisation.',
        variant: 'destructive',
      })
    }
    if (!orgError) hasToastedError.current = false
  }, [orgError, toast])

  const handleSaveOrganization = () => {
    if (!organization?.id) return
    updateOrganization.mutate({
      name: formData.name,
      shrinkPct: parseFloat(formData.shrinkPct),
    })
  }

  const handleFixOrgId = () => {
    if (!organization?.id || !orgData) return
    fixOrgId.mutate({
      correctClerkOrgId: organization.id,
      currentOrgId: orgData.clerkOrgId || orgData.id,
    })
  }

  const saving = updateOrganization.isPending || fixOrgId.isPending

  if (!roleFetched || !canViewSettings) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25" role="main" aria-label="Paramètres">
        <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center space-y-4">
              <p className="text-muted-foreground">
                Vous n&apos;avez pas accès à cette page. Seuls les administrateurs et managers peuvent consulter les paramètres.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard">Retour au tableau de bord</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (!orgLoaded || !userLoaded || (loadingOrg && !orgData)) {
    return <SettingsPageSkeleton />
  }

  if (!organization) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25" role="main" aria-label="Paramètres">
        <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
            <p className="text-muted-foreground mt-1.5">Gérez les paramètres de votre organisation et votre profil</p>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4" aria-hidden="true">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Aucune organisation active</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Veuillez sélectionner ou créer une organisation pour accéder aux paramètres.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (orgError && organization?.id) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/25" role="main" aria-label="Paramètres">
        <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
          <header className="pb-6 border-b border-border/60">
            <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
            <p className="text-muted-foreground mt-1.5">Gérez les paramètres de votre organisation et votre profil</p>
          </header>
          <Card className="rounded-xl border shadow-sm bg-card">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4" aria-hidden="true">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Erreur de chargement</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Impossible de charger les paramètres de l&apos;organisation. Vérifiez votre connexion et réessayez.
              </p>
              <Button onClick={() => refetchOrg()} variant="default" className="bg-teal-600 hover:bg-teal-700">
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/25" role="main" aria-label="Paramètres">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Paramètres' }]} className="mb-4" />
        <header className="pb-6 border-b border-border/60">
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground mt-1.5">
            Gérez les paramètres de votre organisation et votre profil
          </p>
        </header>

        {/* Section Organisation */}
        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center" aria-hidden="true">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold" id="org-section-title">Organisation</CardTitle>
            </div>
          <CardDescription className="mt-1" aria-describedby="org-section-title">
            Informations et paramètres de votre organisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Nom de l&apos;organisation</Label>
            <Input
              id="org-name"
              aria-label="Nom de l&apos;organisation"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom de l&apos;organisation"
              disabled={!canEditName}
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors"
            />
            {!canEditName && (
              <p className="text-sm text-muted-foreground">
                ⚠️ Seul le créateur de l&apos;organisation ou un administrateur peut modifier le nom. 
                Contactez le créateur ou demandez à être promu administrateur.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              ℹ️ Le nom modifié sera utilisé dans toute l&apos;application. 
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
                aria-label="Pourcentage de shrink (gaspillage) par défaut"
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
                    ⚠️ Les IDs ne correspondent pas ! Utilisez le bouton &quot;Corriger l&apos;ID&quot; pour synchroniser.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <Button
              onClick={handleSaveOrganization}
              disabled={saving}
              className="shadow-sm bg-teal-600 hover:bg-teal-700"
              aria-label={saving ? 'Enregistrement en cours' : 'Enregistrer les modifications'}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
            {orgData && (
              <Button
                variant="outline"
                onClick={handleFixOrgId}
                disabled={saving}
                title="Corriger l&apos;ID de l&apos;organisation si il ne correspond pas à celui dans Clerk"
                className="shadow-sm"
                aria-label="Corriger l&apos;ID de l&apos;organisation"
              >
                🔧 Corriger l&apos;ID
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Membres (rôles admin, manager, staff) */}
      <MembersSection />

      {/* Section Profil utilisateur */}
        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center" aria-hidden="true">
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
                <Label htmlFor="profile-fullname">Nom complet</Label>
                <Input
                  id="profile-fullname"
                  value={user.fullName || 'Non défini'}
                  disabled
                  readOnly
                  aria-readonly="true"
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  value={user.primaryEmailAddress?.emailAddress || 'Non défini'}
                  disabled
                  readOnly
                  aria-readonly="true"
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-user-id">ID utilisateur (Clerk)</Label>
                <Input
                  id="profile-user-id"
                  value={user.id || 'Non disponible'}
                  disabled
                  readOnly
                  aria-readonly="true"
                  className="bg-muted border-border font-mono text-xs"
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
                      <div className="mt-2 p-2 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
                        <p className="text-xs text-teal-700 dark:text-teal-400">
                          ✅ L&apos;ID utilisateur est correct et correspond entre client et serveur
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                  <p className="text-xs text-teal-800 dark:text-teal-200 font-semibold mb-1">
                    ℹ️ Note importante :
                  </p>
                  <p className="text-xs text-teal-700 dark:text-teal-300">
                    L&apos;<strong>ID utilisateur</strong> (commence par <code>user_</code>) identifie <strong>votre compte personnel</strong> dans Clerk.
                    <br />
                    L&apos;<strong>ID organisation</strong> (commence par <code>org_</code>) identifie <strong>l&apos;organisation</strong> dans Clerk.
                    <br />
                    <strong>Ces deux IDs sont différents par design</strong> - c&apos;est normal et attendu. Un utilisateur peut appartenir à plusieurs organisations.
                  </p>
                </div>
              </div>

              <div className="my-4 border-t" />

              <p className="text-sm text-muted-foreground">
                Pour modifier votre profil (nom, email, mot de passe), utilisez le menu utilisateur en haut à droite.
              </p>
              <div className="mt-6 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signOut({ redirectUrl: '/' })}
                  className="border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                  aria-label="Se déconnecter"
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  Déconnexion
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section Préférences */}
        <Card className="rounded-xl border shadow-sm bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center" aria-hidden="true">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold">Préférences</CardTitle>
            </div>
          <CardDescription className="mt-1">
            Configurez vos préférences de notifications et d&apos;affichage
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

      {/* Section Danger Zone */}
        <Card className="rounded-xl border shadow-sm border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
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
                <h4 className="font-semibold text-red-800 dark:text-red-400">Supprimer l&apos;organisation</h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Cette action est irréversible. Toutes les données de l&apos;organisation seront définitivement supprimées.
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
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement votre organisation
              et toutes les données associées (restaurants, produits, ventes, prévisions, etc.).
              <br /><br />
              <strong>Cette fonctionnalité n&apos;est pas encore implémentée.</strong>
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
    </main>
  )
}
