import { cookies } from 'next/headers'

export async function createSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set('userId', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete('userId')
}

