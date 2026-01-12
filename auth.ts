import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

// Ensure secret is defined with fallback
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
if (!authSecret) {
  throw new Error('AUTH_SECRET or NEXTAUTH_SECRET environment variable must be defined')
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

        // Normalize email to lowercase (email addresses are case-insensitive per RFC 5321)
        const email = (credentials.email as string).toLowerCase().trim()

        const user = await prisma.user.findUnique({
          where: { email },
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

