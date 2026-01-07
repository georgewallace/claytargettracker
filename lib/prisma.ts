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

// Helper function to check if error is a connection error (including Neon DB suspend/wake)
function isConnectionError(error: any): boolean {
  const errorMessage = error?.message || ''
  const errorCode = error?.code || ''

  return (
    errorMessage.includes("Can't reach database server") ||
    errorMessage.includes('Connection terminated unexpectedly') ||
    errorMessage.includes('Connection refused') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('ENOTFOUND') ||
    errorCode === 'P1001' || // Can't reach database server
    errorCode === 'P1008' || // Operations timed out
    errorCode === 'P1017' || // Server has closed the connection
    error?.name === 'PrismaClientInitializationError'
  )
}

// Helper function to retry an operation with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Only retry on connection errors
      if (!isConnectionError(error) || attempt === maxRetries) {
        throw error
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(
        `Database connection error (attempt ${attempt + 1}/${maxRetries + 1}). ` +
        `Retrying in ${delay}ms... Error: ${error?.message}`
      )

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Create Prisma client with retry logic
const basePrisma = new PrismaClient()

// Extend Prisma client with retry middleware
export const prisma = basePrisma.$extends({
  name: 'retry-connection',
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        // Wrap the query in retry logic
        return retryOperation(() => query(args))
      }
    }
  }
}) as unknown as PrismaClient

// Store in global for dev hot-reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = basePrisma
}

