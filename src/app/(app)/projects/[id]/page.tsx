import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProjectTimeline from './ProjectTimeline'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) redirect('/login')

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      stages: {
        include: {
          evaluations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              domainScores: { include: { subIndicators: true } },
            },
          },
        },
        orderBy: { stageType: 'asc' },
      },
    },
  })

  if (!project) notFound()

  // Sort stages in order: idea, script, video
  const stageOrder = ['idea', 'script', 'video']
  const sortedStages = [...project.stages].sort(
    (a, b) => stageOrder.indexOf(a.stageType) - stageOrder.indexOf(b.stageType)
  )

  return (
    <ProjectTimeline
      project={JSON.parse(JSON.stringify({ ...project, stages: sortedStages }))}
    />
  )
}
