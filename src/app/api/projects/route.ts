import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projects = await prisma.project.findMany({
    where: { creatorId: user.id },
    include: {
      stages: {
        include: {
          evaluations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { domainScores: true },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ projects })
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, seriesName, season, episode, ageBracket, estimatedDuration } = body

  if (!title || !seriesName || !ageBracket) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const project = await prisma.project.create({
    data: {
      creatorId: user.id,
      title,
      seriesName,
      season: season || 1,
      episode: episode || 1,
      ageBracket,
      estimatedDuration,
      currentStage: 'idea',
      status: 'new',
      stages: {
        create: [
          { stageType: 'idea', status: 'not_started' },
          { stageType: 'script', status: 'not_started' },
          { stageType: 'video', status: 'not_started' },
        ],
      },
    },
    include: { stages: true },
  })

  return NextResponse.json({ project }, { status: 201 })
}
