import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ScoreCardView from './ScoreCardView'

export default async function ScoreCardPage({ params }: { params: Promise<{ id: string; stageId: string }> }) {
  const user = await getSession()
  if (!user) redirect('/login')

  const { id, stageId } = await params

  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) notFound()

  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: {
      evaluations: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          domainScores: {
            include: { subIndicators: true },
          },
        },
      },
    },
  })

  if (!stage || stage.evaluations.length === 0) notFound()

  return (
    <ScoreCardView
      project={JSON.parse(JSON.stringify(project))}
      stage={JSON.parse(JSON.stringify(stage))}
      evaluation={JSON.parse(JSON.stringify(stage.evaluations[0]))}
    />
  )
}
