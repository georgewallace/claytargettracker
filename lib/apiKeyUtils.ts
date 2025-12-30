import { randomBytes } from 'crypto'

/**
 * Generate a secure API key
 * Format: ctt_live_[32 random hex characters]
 * Example: ctt_live_a1b2c3d4e5f6789012345678901234567890abcd
 */
export function generateApiKey(): string {
  const randomPart = randomBytes(20).toString('hex') // 40 hex characters
  return `ctt_live_${randomPart}`
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^ctt_live_[a-f0-9]{40}$/.test(key)
}

/**
 * Mask API key for display (show only first 12 and last 4 characters)
 * Example: ctt_live_a1b2c3d4e5f6789012345678901234567890abcd -> ctt_live_a1b2...abcd
 */
export function maskApiKey(key: string): string {
  if (key.length < 20) return key
  const prefix = key.substring(0, 16) // "ctt_live_" + 7 chars
  const suffix = key.substring(key.length - 4)
  return `${prefix}...${suffix}`
}
