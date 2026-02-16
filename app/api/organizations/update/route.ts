import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/organizations/update
 * Met à jour les paramètres de l'organisation
 */
export async function PATCH(request: NextRequest) {
  try {
    if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string | null = null
    let authOrgId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const authResult = auth()
      userId = authResult.userId ?? null
      authOrgId = authResult.orgId ?? null
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { getCurrentOrganization } = await import('@/lib/auth')
    const { checkApiPermission } = await import('@/lib/auth-role')
    const { prisma } = await import('@/lib/db/prisma')
    const { logger } = await import('@/lib/logger')

    const body = await request.json()
    const { name, shrinkPct, clerkOrgId } = body
    const orgIdToUse = authOrgId || clerkOrgId

    let organization: any = null

    if (orgIdToUse) {
      organization = await prisma.organization.findUnique({
        where: { clerkOrgId: orgIdToUse },
      })
      
      if (!organization) {
        try {
          const { clerkClient } = await import('@clerk/nextjs/server')
          const client = await clerkClient()
          const clerkOrg = await client.organizations.getOrganization({ organizationId: orgIdToUse })
          
          const userMemberships = await client.users.getOrganizationMembershipList({ userId })
          const isMember = userMemberships.data?.some(m => m.organization.id === orgIdToUse)
          
          if (isMember) {
            try {
              organization = await prisma.organization.create({
                data: {
                  name: clerkOrg.name,
                  clerkOrgId: orgIdToUse,
                  shrinkPct: 0.1,
                },
              })
            } catch (dbError) {
              if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
                organization = await prisma.organization.findUnique({
                  where: { clerkOrgId: orgIdToUse },
                })
              }
            }
          }
        } catch (error) {
          logger.error('[PATCH /api/organizations/update] Erreur synchronisation:', error)
        }
      }
    } else {
      organization = await getCurrentOrganization()
    }

    if (!organization) {
      return NextResponse.json(
        { 
          error: 'Organization not found',
          details: 'L\'organisation n\'a pas pu être trouvée. Veuillez rafraîchir la page.'
        },
        { status: 404 }
      )
    }

    const forbidden = await checkApiPermission(userId, organization.clerkOrgId, 'settings:edit')
    if (forbidden) return forbidden

    // Vérifier que l'utilisateur est membre et a les permissions admin dans Clerk
    let hasAdminRole = false
    let membershipRole = null
    try {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      const userMemberships = await client.users.getOrganizationMembershipList({ userId })
      const membership = userMemberships.data?.find(m => m.organization.id === organization.clerkOrgId)
      
      if (!membership) {
        return NextResponse.json(
          { error: 'You are not a member of this organization' },
          { status: 403 }
        )
      }

      membershipRole = membership.role
      // Vérifier si l'utilisateur est admin (role: 'org:admin' ou créateur 'org:creator')
      hasAdminRole = membershipRole === 'org:admin' || membershipRole === 'org:creator'
      
      logger.log('[PATCH /api/organizations/update] Rôle utilisateur:', membershipRole, 'Admin:', hasAdminRole)
    } catch (error) {
      logger.error('[PATCH /api/organizations/update] Erreur vérification membre:', error)
      // On continue quand même, mais on ne pourra pas mettre à jour Clerk
    }

    // Préparer les données à mettre à jour
    const updateData: any = {}
    
    // Déclarer clerkOrg au niveau supérieur pour qu'il soit accessible partout
    let clerkOrg: any = null
    
    // Si on essaie de changer le nom, vérifier les permissions AVANT
    if (name !== undefined && name.trim().length > 0 && name.trim() !== organization.name) {
      // Récupérer l'organisation depuis Clerk pour vérifier les permissions
      try {
        const { clerkClient } = await import('@clerk/nextjs/server')
        const client = await clerkClient()
        clerkOrg = await client.organizations.getOrganization({ 
          organizationId: organization.clerkOrgId 
        })
        
        // Vérifier si l'utilisateur est le créateur
        const isCreator = clerkOrg.createdBy === userId
        
        // Si l'utilisateur n'est ni créateur ni admin, refuser le changement
        if (!isCreator && !hasAdminRole) {
          return NextResponse.json(
            { 
              error: 'Vous n\'avez pas les permissions nécessaires pour modifier le nom de l\'organisation.',
              details: 'Seul le créateur de l\'organisation ou un administrateur peut modifier le nom. ' +
                'Contactez le créateur de l\'organisation ou demandez à être promu administrateur pour effectuer cette action.',
              requiresAdmin: true
            },
            { status: 403 }
          )
        }
        
        logger.log('[PATCH /api/organizations/update] ✅ Permissions vérifiées, changement de nom autorisé:', {
          isCreator,
          hasAdminRole,
          currentName: organization.name,
          newName: name.trim(),
        })
      } catch (error: any) {
        logger.error('[PATCH /api/organizations/update] ❌ Erreur vérification permissions:', error)
        // Si on ne peut pas vérifier les permissions, on refuse par sécurité
        return NextResponse.json(
          { 
            error: 'Impossible de vérifier vos permissions pour modifier le nom de l\'organisation.',
            details: 'Une erreur est survenue lors de la vérification de vos permissions. Veuillez réessayer ou contacter le support.'
          },
          { status: 500 }
        )
      }
      
      updateData.name = name.trim()
      
      // Mettre à jour aussi dans Clerk si le nom change
      // Note: Clerk permet la mise à jour si l'utilisateur est membre, pas forcément admin
      let clerkUpdateSuccess = false
      let isCreator = false // Déclarer au niveau supérieur pour être accessible dans le catch
      
      try {
        const { clerkClient } = await import('@clerk/nextjs/server')
        const client = await clerkClient()
        
        // Si clerkOrg n'a pas encore été récupéré (dans la vérification des permissions), le récupérer maintenant
        if (!clerkOrg) {
          try {
            clerkOrg = await client.organizations.getOrganization({ 
              organizationId: organization.clerkOrgId 
            })
            logger.log('[PATCH /api/organizations/update] Organisation trouvée dans Clerk:', {
              id: clerkOrg.id,
              name: clerkOrg.name,
              createdBy: clerkOrg.createdBy,
              slug: clerkOrg.slug,
            })
          } catch (getError: any) {
            logger.error('[PATCH /api/organizations/update] ❌ Erreur récupération organisation Clerk:', {
              error: getError,
              code: getError?.code,
              status: getError?.status,
              message: getError?.message,
            })
            throw new Error(`L'organisation n'existe pas dans Clerk ou l'ID est incorrect: ${organization.clerkOrgId}`)
          }
        }
        
        // Vérifier si l'utilisateur est le créateur de l'organisation
        isCreator = clerkOrg.createdBy === userId
        logger.log('[PATCH /api/organizations/update] Vérification créateur:', {
          clerkOrgCreatedBy: clerkOrg.createdBy,
          currentUserId: userId,
          isCreator,
          userRole: membershipRole,
          hasAdminRole,
        })
        
        // Si l'utilisateur n'est ni créateur ni admin, on ne peut pas mettre à jour Clerk
        // Mais on continue quand même pour mettre à jour la DB
        if (!isCreator && !hasAdminRole) {
          logger.warn('[PATCH /api/organizations/update] ⚠️ Utilisateur non-créateur et non-admin, impossible de mettre à jour Clerk')
          logger.warn('[PATCH /api/organizations/update] ⚠️ Mise à jour DB uniquement (pas de permissions Clerk)')
          // On ne lance pas d'erreur, on continue pour mettre à jour la DB
          // Le warning sera retourné dans la réponse
        } else {
          // L'utilisateur a les permissions, on peut essayer de mettre à jour Clerk
          logger.log('[PATCH /api/organizations/update] Tentative mise à jour Clerk:', {
            organizationId: organization.clerkOrgId,
            clerkOrgIdFromDB: organization.clerkOrgId,
            clerkOrgIdFromClerk: clerkOrg.id,
            idsMatch: organization.clerkOrgId === clerkOrg.id,
            currentClerkName: clerkOrg.name,
            newName: name.trim(),
            userRole: membershipRole,
            hasAdminRole,
            isCreator,
          })
          
          // Vérifier que les IDs correspondent
          if (organization.clerkOrgId !== clerkOrg.id) {
            throw new Error(`ID mismatch: DB has ${organization.clerkOrgId} but Clerk returned ${clerkOrg.id}`)
          }
          
          // Vérifier si le nom est déjà le même dans Clerk (pas besoin de mettre à jour)
          if (clerkOrg.name === name.trim()) {
            logger.log('[PATCH /api/organizations/update] ✅ Nom déjà synchronisé dans Clerk:', clerkOrg.name)
            clerkUpdateSuccess = true
          } else {
            // Utiliser l'ID de Clerk pour être sûr
            // Note: Seul le créateur ou un admin peut modifier le nom dans Clerk
            logger.log('[PATCH /api/organizations/update] 🔄 Appel updateOrganization avec:', {
              organizationId: clerkOrg.id,
              newName: name.trim(),
              currentClerkName: clerkOrg.name,
              isCreator,
              hasAdminRole,
              membershipRole,
            })
            
            try {
              // Essayer d'abord avec l'ID de la DB
              let orgIdToUse = organization.clerkOrgId
              
              // Si les IDs diffèrent, utiliser celui de Clerk
              if (organization.clerkOrgId !== clerkOrg.id) {
                logger.warn('[PATCH /api/organizations/update] ⚠️ IDs différents, utilisation de celui de Clerk')
                orgIdToUse = clerkOrg.id
              }
              
              logger.log('[PATCH /api/organizations/update] 🔄 Tentative updateOrganization avec ID:', orgIdToUse)
              
              const updatedClerkOrg = await client.organizations.updateOrganization(orgIdToUse, {
                name: name.trim(),
              })
              
              logger.log('[PATCH /api/organizations/update] ✅ Nom mis à jour dans Clerk avec succès:', updatedClerkOrg.name)
              clerkUpdateSuccess = true
            } catch (updateError: any) {
              // Log détaillé de l'erreur
              logger.error('[PATCH /api/organizations/update] ❌ Erreur spécifique updateOrganization:', {
                error: updateError,
                code: updateError?.code,
                status: updateError?.status,
                statusCode: updateError?.statusCode,
                clerkError: updateError?.clerkError,
                message: updateError?.message,
                errors: updateError?.errors,
                organizationIdFromDB: organization.clerkOrgId,
                organizationIdFromClerk: clerkOrg.id,
                organizationIdUsed: clerkOrg.id,
                userId,
                isCreator,
                hasAdminRole,
                membershipRole,
                clerkOrgName: clerkOrg.name,
                newName: name.trim(),
              })
              
              // Si l'erreur est resource_not_found, essayer avec l'ID de la DB (même si les IDs correspondent)
              if (updateError?.code === 'resource_not_found' || updateError?.status === 404) {
                // Si on a utilisé l'ID de Clerk et qu'il diffère de celui de la DB, essayer avec l'ID de la DB
                if (orgIdToUse === clerkOrg.id && organization.clerkOrgId !== clerkOrg.id) {
                  logger.log('[PATCH /api/organizations/update] 🔄 Retry avec l\'ID de la DB:', organization.clerkOrgId)
                  try {
const retryUpdatedClerkOrg = await client.organizations.updateOrganization(organization.clerkOrgId, {
                        name: name.trim(),
                      })
                    logger.log('[PATCH /api/organizations/update] ✅ Nom mis à jour dans Clerk avec succès (retry DB ID):', retryUpdatedClerkOrg.name)
                    clerkUpdateSuccess = true
                  } catch (retryError: any) {
                    logger.error('[PATCH /api/organizations/update] ❌ Erreur retry avec ID DB:', retryError)
                    // Essayer une dernière fois avec l'ID de Clerk si on avait utilisé l'ID de la DB
                    if (orgIdToUse === organization.clerkOrgId && clerkOrg.id !== organization.clerkOrgId) {
                      logger.log('[PATCH /api/organizations/update] 🔄 Dernier retry avec l\'ID de Clerk:', clerkOrg.id)
                      try {
                        const finalRetry = await client.organizations.updateOrganization(clerkOrg.id, {
                          name: name.trim(),
                        })
                        logger.log('[PATCH /api/organizations/update] ✅ Nom mis à jour dans Clerk avec succès (retry Clerk ID):', finalRetry.name)
                        clerkUpdateSuccess = true
                      } catch (finalError: any) {
                        logger.error('[PATCH /api/organizations/update] ❌ Erreur retry final:', finalError)
                        throw updateError // Relancer l'erreur originale
                      }
                    } else {
                      throw updateError // Relancer l'erreur originale
                    }
                  }
                } else {
                  // Les IDs correspondent déjà, mais l'erreur persiste - probablement un bug de l'API Clerk
                  logger.error('[PATCH /api/organizations/update] ❌ Erreur resource_not_found même avec l\'ID correct. Probable bug de l\'API Clerk.')
                  throw updateError
                }
              } else {
                // Relancer l'erreur pour qu'elle soit gérée par le catch externe
                throw updateError
              }
            }
          }
        }
      } catch (error: any) {
        logger.error('[PATCH /api/organizations/update] ❌ Erreur mise à jour Clerk:', {
          error,
          code: error?.code,
          status: error?.status,
          statusCode: error?.statusCode,
          clerkError: error?.clerkError,
          message: error?.message,
          errors: error?.errors,
          // Informations de contexte
          organizationId: organization.clerkOrgId,
          userId,
          isCreator,
          hasAdminRole,
          membershipRole,
        })
        
        // Analyser l'erreur pour donner un message plus précis
        let errorDetails = 'Erreur inconnue'
        const errorObj = error as any
        
        // Vérifier si c'est vraiment une erreur de permissions ou un problème technique
        if (errorObj?.status === 404 || errorObj?.code === 'resource_not_found' || errorObj?.clerkError) {
          // Si l'utilisateur est admin/créateur mais qu'on a resource_not_found, c'est probablement un problème technique
          if (hasAdminRole || isCreator) {
            errorDetails = 'Le nom a été mis à jour avec succès dans l\'application. ' +
              'Une limitation technique de l\'API Clerk empêche la synchronisation automatique avec Clerk, ' +
              'mais cela n\'affecte pas le fonctionnement de l\'application. ' +
              'Le nom affiché dans l\'application sera utilisé partout. ' +
              'Vous pouvez mettre à jour le nom directement dans le dashboard Clerk si nécessaire.'
          } else {
            errorDetails = 'Le nom a été mis à jour dans l\'application. ' +
              'La synchronisation avec Clerk nécessite les permissions administrateur. ' +
              'Le nom dans l\'application sera utilisé partout.'
          }
        } else if (errorObj?.status === 403 || errorObj?.code === 'forbidden') {
          errorDetails = 'Le nom a été mis à jour dans l\'application. ' +
            'La synchronisation avec Clerk nécessite les permissions administrateur. ' +
            'Le nom dans l\'application sera utilisé partout.'
        } else if (errorObj?.message) {
          errorDetails = 'Le nom a été mis à jour dans l\'application. ' +
            'Une erreur est survenue lors de la synchronisation avec Clerk : ' + errorObj.message + '. ' +
            'Le nom dans l\'application sera utilisé partout.'
        } else if (typeof error === 'string') {
          errorDetails = 'Le nom a été mis à jour dans l\'application. ' +
            'Une erreur est survenue lors de la synchronisation avec Clerk. ' +
            'Le nom dans l\'application sera utilisé partout.'
        }
        
        logger.warn('[PATCH /api/organizations/update] ⚠️ Mise à jour DB uniquement (Clerk échoué):', errorDetails)
        
        // On continue quand même la mise à jour dans la DB
        // Le warning sera retourné dans la réponse
      }
    }
    
    if (shrinkPct !== undefined) {
      const shrinkValue = parseFloat(shrinkPct)
      if (!isNaN(shrinkValue) && shrinkValue >= 0 && shrinkValue <= 1) {
        updateData.shrinkPct = shrinkValue
      } else {
        return NextResponse.json(
          { error: 'shrinkPct must be a number between 0 and 1' },
          { status: 400 }
        )
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Mettre à jour l'organisation dans la DB
    const updatedOrganization = await prisma.organization.update({
      where: { id: organization.id },
      data: updateData,
    })

    // Vérifier si le nom dans Clerk correspond
    let clerkNameMatch = false
    let finalClerkOrg: any = null
    
    // Si on n'a pas déjà récupéré clerkOrg, le récupérer maintenant
    if (!clerkOrg) {
      try {
        const { clerkClient } = await import('@clerk/nextjs/server')
        const client = await clerkClient()
        finalClerkOrg = await client.organizations.getOrganization({ 
          organizationId: organization.clerkOrgId 
        })
      } catch (error) {
        logger.error('[PATCH /api/organizations/update] Erreur récupération finale Clerk:', error)
      }
    } else {
      finalClerkOrg = clerkOrg
    }
    
    if (finalClerkOrg) {
      clerkNameMatch = finalClerkOrg.name === updatedOrganization.name
      logger.log('[PATCH /api/organizations/update] Vérification finale Clerk:', {
        dbName: updatedOrganization.name,
        clerkName: finalClerkOrg.name,
        match: clerkNameMatch,
      })
    }

    // Construire la réponse avec les informations de synchronisation
    const response: any = { ...updatedOrganization }
    
    if (updateData.name) {
      response.clerkSync = clerkNameMatch
      // Ne retourner un warning que si la synchronisation a vraiment échoué
      // (les noms ne correspondent pas ET on a réussi à récupérer l'org depuis Clerk)
      if (!clerkNameMatch && finalClerkOrg) {
        // Vérifier si c'est un problème de permissions
        const isPermissionIssue = !hasAdminRole && finalClerkOrg.createdBy !== userId
        
        if (isPermissionIssue) {
          response.warning = 'Le nom a été mis à jour avec succès dans l\'application. ' +
            'La synchronisation avec Clerk nécessite les permissions administrateur. ' +
            'Le nom dans l\'application sera utilisé partout. ' +
            'Pour modifier le nom dans Clerk, contactez le créateur de l\'organisation ou demandez à être promu administrateur.'
        } else {
          // Admin/créateur mais synchronisation échouée - probablement un bug Clerk
          response.warning = 'Le nom a été mis à jour avec succès dans l\'application. ' +
            'Une limitation technique de l\'API Clerk empêche la synchronisation automatique, ' +
            'mais cela n\'affecte pas le fonctionnement de l\'application. ' +
            'Le nom affiché dans l\'application sera utilisé partout. ' +
            'Vous pouvez mettre à jour le nom directement dans le dashboard Clerk si nécessaire.'
        }
      } else if (clerkNameMatch) {
        // Si les noms correspondent, pas de warning nécessaire
        // La synchronisation est réussie
        logger.log('[PATCH /api/organizations/update] ✅ Synchronisation réussie, pas de warning nécessaire')
      }
    }
    
    return NextResponse.json(response)
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('[PATCH /api/organizations/update] Erreur:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
