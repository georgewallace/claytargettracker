import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname
      
      // Public pages that don't require authentication
      const publicPaths = ['/login', '/signup', '/signup/athlete', '/signup/coach', '/']
      const isPublicPage = publicPaths.includes(pathname) ||
                          pathname.startsWith('/signup/')

      if (isPublicPage) {
        return true
      }
      
      // Require authentication for all other pages
      return isLoggedIn
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
      }
      
      // Handle session updates
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  providers: [], // Providers will be added in auth.ts
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  // Tell Next.js to use nodejs runtime for auth routes
  trustHost: true,
} satisfies NextAuthConfig

