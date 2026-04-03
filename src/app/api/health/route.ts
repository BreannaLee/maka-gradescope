import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client/web'

export async function GET() {
  try {
    let url = (process.env.TURSO_DATABASE_URL || 'NOT SET').trim()
    const authToken = (process.env.TURSO_AUTH_TOKEN || '').trim()

    // Show exact bytes for debugging
    const urlBytes = Array.from(url).map(c => c.charCodeAt(0))
    const lastBytes = urlBytes.slice(-5)

    // Convert libsql:// to https:// for web client
    if (url.startsWith('libsql://')) {
      url = url.replace('libsql://', 'https://')
    }

    // Test raw libsql connection (bypass Prisma)
    const client = createClient({ url, authToken })
    const result = await client.execute('SELECT COUNT(*) as count FROM User')
    const count = result.rows[0]?.count

    return NextResponse.json({
      status: 'ok',
      userCount: count,
    })
  } catch (err) {
    const url = (process.env.TURSO_DATABASE_URL || 'NOT SET').trim()
    return NextResponse.json({
      status: 'error',
      error: String(err),
      urlLength: url.length,
      urlStart: url.slice(0, 15),
      urlEnd: url.slice(-15),
      lastCharCode: url.charCodeAt(url.length - 1),
    }, { status: 500 })
  }
}
