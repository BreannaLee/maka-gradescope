import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const user = await getSession()
  if (!user || user.role === 'creator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { stageId, content, anchor, commentType } = await request.json()

  if (!stageId || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: {
      stageId,
      authorId: user.id,
      commentType: commentType || 'inline',
      content,
      anchor: anchor || '0',
    },
  })

  return NextResponse.json({ comment })
}
