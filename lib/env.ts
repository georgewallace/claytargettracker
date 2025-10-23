import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

// Cache for environment variables
const envCache: Record<string, string> = {}

/**
 * Get environment variable from process.env or AWS SSM Parameter Store
 * For Amplify SSR, environment variables aren't passed to Lambda, so we fetch from SSM
 */
export async function getEnvVar(key: string): Promise<string | undefined> {
  // Check if already in process.env (for local dev)
  if (process.env[key]) {
    return process.env[key]
  }

  // Check cache
  if (envCache[key]) {
    return envCache[key]
  }

  // In production (Lambda), fetch from SSM Parameter Store
  if (process.env.NODE_ENV === 'production' && process.env.AWS_REGION) {
    try {
      const client = new SSMClient({ region: process.env.AWS_REGION })
      const command = new GetParameterCommand({
        Name: `/amplify/${process.env.AWS_AMPLIFY_DEPLOYMENT_ID || 'default'}/${key}`,
        WithDecryption: true,
      })
      
      const response = await client.send(command)
      const value = response.Parameter?.Value
      
      if (value) {
        envCache[key] = value
        return value
      }
    } catch (error) {
      console.error(`Failed to fetch ${key} from SSM:`, error)
    }
  }

  return undefined
}

/**
 * Get DATABASE_URL synchronously (must be called after initialization)
 */
export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  
  if (envCache.DATABASE_URL) {
    return envCache.DATABASE_URL
  }

  throw new Error('DATABASE_URL not available. Call initializeEnv() first.')
}

/**
 * Initialize environment variables (call this on cold start)
 */
export async function initializeEnv() {
  if (!process.env.DATABASE_URL) {
    const dbUrl = await getEnvVar('DATABASE_URL')
    if (dbUrl) {
      process.env.DATABASE_URL = dbUrl
      envCache.DATABASE_URL = dbUrl
    }
  }
}

