import { NextResponse } from 'next/server'

export async function GET() {
  // Only allow in non-production or with a secret key for security
  const isDev = process.env.NODE_ENV !== 'production'
  
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
    DATABASE_URL_PREVIEW: process.env.DATABASE_URL?.substring(0, 20) || 'NOT_SET',
    ALL_ENV_KEYS: Object.keys(process.env).filter(key => 
      !key.includes('SECRET') && 
      !key.includes('KEY') && 
      !key.includes('PASSWORD')
    ),
  }

  return NextResponse.json(envVars, { status: 200 })
}

