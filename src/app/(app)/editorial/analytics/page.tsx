import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AnalyticsDashboard from './AnalyticsDashboard'

export default async function AnalyticsPage() {
  const user = await getSession()
  if (!user) redirect('/login')
  if (user.role === 'creator') redirect('/dashboard')

  // Fetch all evaluations with domain scores
  const evaluations = await prisma.evaluation.findMany({
    include: {
      domainScores: true,
      stage: {
        include: {
          project: {
            include: { creator: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Fetch all creators
  const creators = await prisma.user.findMany({
    where: { role: 'creator' },
    include: {
      projects: {
        include: {
          stages: {
            include: {
              evaluations: {
                include: { domainScores: true },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
    },
  })

  // Fetch submission counts by status
  const stages = await prisma.stage.findMany({
    where: { status: { in: ['submitted', 'completed', 'reviewed'] } },
    include: { project: true },
  })

  return (
    <AnalyticsDashboard
      evaluations={JSON.parse(JSON.stringify(evaluations))}
      creators={JSON.parse(JSON.stringify(creators))}
      stages={JSON.parse(JSON.stringify(stages))}
    />
  )
}
