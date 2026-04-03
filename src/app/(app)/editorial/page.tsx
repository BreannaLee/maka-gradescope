import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ReviewQueue from './ReviewQueue'

export default async function EditorialPage() {
  const user = await getSession()
  if (!user) redirect('/login')
  if (user.role === 'creator') redirect('/dashboard')

  const submissions = await prisma.stage.findMany({
    where: { status: 'submitted' },
    include: {
      project: {
        include: { creator: { select: { name: true } } },
      },
      evaluations: {
        where: { evaluationType: 'auto' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      safetyFlags: { where: { resolved: false } },
    },
    orderBy: { submittedAt: 'desc' },
  })

  // Quick analytics
  const allEvals = await prisma.evaluation.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    select: { overallScore: true },
  })

  const avgScore = allEvals.length > 0
    ? allEvals.reduce((sum, e) => sum + e.overallScore, 0) / allEvals.length
    : 0

  const flaggedCount = submissions.filter((s) => s.safetyFlags.length > 0).length

  return (
    <ReviewQueue
      submissions={JSON.parse(JSON.stringify(submissions))}
      avgScore={Math.round(avgScore * 10) / 10}
      flaggedCount={flaggedCount}
      totalPending={submissions.length}
    />
  )
}
