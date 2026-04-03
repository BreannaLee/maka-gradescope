import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client/web'

export async function GET() {
  try {
    let url = process.env.TURSO_DATABASE_URL || 'NOT SET'
    const authToken = process.env.TURSO_AUTH_TOKEN || ''

    // Convert libsql:// to https:// for web client
    if (url.startsWith('libsql://')) {
      url = url.replace('libsql://', 'https://')
    }

    // Test raw libsql connection first (bypass Prisma)
    const client = createClient({ url, authToken })
    const result = await client.execute('SELECT COUNT(*) as count FROM User')
    const count = result.rows[0]?.count

    return NextResponse.json({
      status: 'ok',
      dbUrl: url.slice(0, 40) + '...',
      hasToken: authToken.length > 0,
      tokenLength: authToken.length,
      userCount: count,
    })
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      error: String(err),
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 3) : undefined,
    }, { status: 500 })
  }
}
