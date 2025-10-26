import { NextResponse } from 'next/server'

/**
 * Security headers to add to all responses
 * These headers help protect against common web vulnerabilities
 */
export const securityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection in older browsers
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (formerly Feature-Policy)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Next.js dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
}

/**
 * Add security headers to a Response object
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

/**
 * CSRF token validation
 * Validates that the request origin matches the expected origin
 */
export function validateCSRF(request: Request): boolean {
  // Only validate POST, PUT, DELETE, PATCH requests
  const method = request.method
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return true
  }

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  
  // If no origin header (can happen with some requests), check referer
  if (!origin) {
    const referer = request.headers.get('referer')
    if (!referer) {
      // No origin or referer, could be a direct API call - be cautious
      // In production, you might want to reject these
      return true // For now, allow
    }
    
    try {
      const refererURL = new URL(referer)
      return refererURL.host === host
    } catch {
      return false
    }
  }

  // Check if origin matches host
  try {
    const originURL = new URL(origin)
    return originURL.host === host
  } catch {
    return false
  }
}

/**
 * Input sanitization helpers
 */
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Validate password strength
 * Minimum 8 characters, at least one letter and one number
 */
export function isStrongPassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (password.length > 100) {
    errors.push('Password must be less than 100 characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Check if request is from a trusted source
 */
export function isTrustedRequest(request: Request): boolean {
  // Check if request has proper headers
  const userAgent = request.headers.get('user-agent')
  
  // Block requests without user agent (likely bots)
  if (!userAgent) {
    return false
  }
  
  // Add more sophisticated bot detection if needed
  return true
}

/**
 * Generate secure random string for tokens
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }
  
  return result
}

