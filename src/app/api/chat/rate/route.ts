import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messageId, rating } = await request.json()

  await prisma.chatMessage.update({
    where: { id: messageId },
    data: { rating },
  })

  return NextResponse.json({ success: true })
}
