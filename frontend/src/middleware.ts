import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Routes that don't require authentication
const publicRoutes = ['/sign-in', '/sign-up']
const isPublicRoute = createRouteMatcher(publicRoutes)

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth()
    
    // If user is not authenticated and trying to access protected routes (including /), 
    // redirect to sign-in
    if (!userId && !isPublicRoute(req)) {
        const signInUrl = new URL('/sign-in', req.url)
        return Response.redirect(signInUrl)
    }

    // If user is authenticated and trying to access auth pages, redirect to root
    if (userId && isPublicRoute(req)) {
        const homeUrl = new URL('/', req.url)
        return Response.redirect(homeUrl)
    }
})

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
}