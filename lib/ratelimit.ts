import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis client
// For local development without Upstash, we'll use a mock implementation
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Create rate limiters for different use cases
export const rateLimiters = {
  // Auth routes: 5 attempts per 15 minutes
  auth: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: '@upstash/ratelimit:auth',
  }) : null,

  // Password reset: 3 attempts per hour
  passwordReset: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '60 m'),
    analytics: true,
    prefix: '@upstash/ratelimit:password-reset',
  }) : null,

  // Score entry: 100 per hour
  scoreEntry: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '60 m'),
    analytics: true,
    prefix: '@upstash/ratelimit:score-entry',
  }) : null,

  // Team creation: 10 per hour
  teamCreation: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 m'),
    analytics: true,
    prefix: '@upstash/ratelimit:team-creation',
  }) : null,

  // Tournament creation: 5 per hour
  tournamentCreation: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '60 m'),
    analytics: true,
    prefix: '@upstash/ratelimit:tournament-creation',
  }) : null,

  // General API: 200 requests per minute
  api: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, '60 s'),
    analytics: true,
    prefix: '@upstash/ratelimit:api',
  }) : null,
}

// Helper function to get identifier (IP address or user ID)
export function getIdentifier(request: Request, userId?: string): string {
  // Prefer user ID if authenticated
  if (userId) return `user:${userId}`
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return `ip:${ip}`
}

// Helper function to check rate limit
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // If no limiter (development mode without Upstash), allow all requests
  if (!limiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 }
  }

  const { success, limit, remaining, reset } = await limiter.limit(identifier)
  
  return { success, limit, remaining, reset }
}

// Helper to create rate limit headers
export function createRateLimitHeaders(result: {
  limit: number
  remaining: number
  reset: number
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }
}

