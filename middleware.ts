import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/pricing',
  '/merci-paiement',
  '/mentions-legales',
  '/confidentialite',
  '/contact',
  '/demo',
  '/demo/merci',
  '/api/webhooks(.*)',
  '/dashboard/setup(.*)', // Permettre l'accès à la page setup
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  
  // Si l'utilisateur est connecté et essaie d'accéder à sign-in, ne pas protéger
  // Clerk gérera la redirection automatiquement
  if (userId && req.nextUrl.pathname.startsWith('/sign-in')) {
    return
  }
  
  // Ne pas protéger les routes publiques (y compris /dashboard/setup)
  if (!isPublicRoute(req)) {
    await auth().protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
