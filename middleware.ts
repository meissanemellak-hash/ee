import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/merci-paiement',
  '/mentions-legales',
  '/confidentialite',
  '/contact',
  '/demo',
  '/demo/merci',
  '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const pathname = req.nextUrl.pathname

  // Pages supprimées : redirection vers le dashboard
  if (pathname === '/pricing' || pathname.startsWith('/pricing/')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  if (pathname === '/dashboard/onboarding' || pathname.startsWith('/dashboard/onboarding/')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  if (pathname === '/dashboard/setup' || pathname.startsWith('/dashboard/setup/')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Si l'utilisateur est connecté et essaie d'accéder à sign-in, ne pas protéger
  // Clerk gérera la redirection automatiquement
  if (userId && pathname.startsWith('/sign-in')) {
    return
  }

  // Ne pas protéger les routes publiques
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
