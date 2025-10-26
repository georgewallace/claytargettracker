import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

// Debug: Log environment variable status
console.log('[Auth Config] AUTH_SECRET exists:', !!process.env.AUTH_SECRET)
console.log('[Auth Config] AUTH_SECRET length:', process.env.AUTH_SECRET?.length || 0)

// Ensure AUTH_SECRET is defined
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
if (!authSecret) {
  console.error('[Auth Config] ERROR: No AUTH_SECRET or NEXTAUTH_SECRET found in environment')
  throw new Error('AUTH_SECRET environment variable is not set. Please add it to your environment variables.')
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: authSecret,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) {
          return null
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
})

