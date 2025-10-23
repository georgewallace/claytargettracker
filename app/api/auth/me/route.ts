import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = "force-static"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error('Error getting current user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

