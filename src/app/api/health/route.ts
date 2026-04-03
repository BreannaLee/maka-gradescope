import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const url = process.env.TURSO_DATABASE_URL || 'NOT SET'
    const hasToken = !!process.env.TURSO_AUTH_TOKEN

    // Try a simple query
    const userCount = await prisma.user.count()

    return NextResponse.json({
      status: 'ok',
      dbUrl: url.slice(0, 30) + '...',
      hasToken,
      userCount,
    })
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      error: String(err),
      dbUrl: (process.env.TURSO_DATABASE_URL || 'NOT SET').slice(0, 30) + '...',
      hasToken: !!process.env.TURSO_AUTH_TOKEN,
    }, { status: 500 })
  }
}
