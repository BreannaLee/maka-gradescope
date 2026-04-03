import { cookies } from 'next/headers'
import { prisma } from './prisma'

const SESSION_COOKIE = 'maka_session'

export async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)
  if (!sessionCookie?.value) return null

  try {
    const parsed = JSON.parse(atob(sessionCookie.value))
    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
    })
    if (!user || user.status === 'deactivated') return null
    return user
  } catch {
    return null
  }
}

export function createSessionToken(userId: string) {
  return btoa(JSON.stringify({ userId, ts: Date.now() }))
}

export { SESSION_COOKIE }
