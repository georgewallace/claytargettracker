import { randomBytes } from 'crypto'

/**
 * Generate a secure random password for admin password resets
 * Format: 12 characters with uppercase, lowercase, numbers, and symbols
 * Example: "Xy9#mK2$pL4!"
 */
export function generateRandomPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  const allChars = uppercase + lowercase + numbers + symbols

  // Ensure at least one of each type
  let password = ''
  password += uppercase[randomBytes(1)[0] % uppercase.length]
  password += lowercase[randomBytes(1)[0] % lowercase.length]
  password += numbers[randomBytes(1)[0] % numbers.length]
  password += symbols[randomBytes(1)[0] % symbols.length]

  // Fill remaining 8 characters randomly
  for (let i = 0; i < 8; i++) {
    password += allChars[randomBytes(1)[0] % allChars.length]
  }

  // Shuffle the password
  return password.split('').sort(() => randomBytes(1)[0] - 128).join('')
}

/**
 * Validate that password meets minimum requirements
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
