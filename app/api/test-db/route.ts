import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Simple query to test database connection
    await prisma.$connect()
    const userCount = await prisma.user.count()

    return NextResponse.json({
      status: 'ok',
      userCount,
      message: 'Database connection successful'
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
