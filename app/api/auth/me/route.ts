import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'


export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json(user, {
      status: 200,
      headers: {
        // Cache user data for 5 minutes, revalidate in background for up to 10 minutes
        'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Error getting current user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

