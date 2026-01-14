import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Check if user must change password
  if (session?.user?.mustChangePassword && pathname !== '/change-password') {
    const url = req.nextUrl.clone()
    url.pathname = '/change-password'
    url.searchParams.set('forced', 'true')
    return NextResponse.redirect(url)
  }

  // Don't allow access to change-password page if not needed
  if (pathname === '/change-password' && session?.user && !session.user.mustChangePassword) {
    const url = req.nextUrl.clone()
    url.pathname = '/profile'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
}

