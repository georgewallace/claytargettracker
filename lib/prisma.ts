import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// In production Lambda, try to load .env.production if it exists
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  const envPaths = [
    resolve(process.cwd(), '.env.production'),
    resolve(process.cwd(), '.next/.env.production'),
    resolve(__dirname, '../.env.production'),
    resolve(__dirname, '../../.env.production'),
  ]
  
  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      console.log(`Loading environment from: ${envPath}`)
      config({ path: envPath })
      break
    }
  }
  
  // If still no DATABASE_URL, log available env vars for debugging
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found after loading .env files')
    console.error('Available env vars:', Object.keys(process.env).filter(k => !k.includes('SECRET')))
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

