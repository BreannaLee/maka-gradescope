import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function ScoreCardIndexPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  // Find the most recent evaluation and redirect to it
  const latestStage = await prisma.stage.findFirst({
    where: {
      project: { creatorId: user.id },
      evaluations: { some: {} },
    },
    include: {
      evaluations: { orderBy: { createdAt: 'desc' }, take: 1 },
      project: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (latestStage) {
    redirect(`/projects/${latestStage.project.id}/scorecard/${latestStage.id}`)
  }

  return (
    <div className="p-8 flex flex-col items-center justify-center h-full text-center">
      <span className="text-4xl mb-4">📊</span>
      <h2 className="text-lg font-semibold text-maka-dark mb-2">No score cards yet</h2>
      <p className="text-sm text-gray-400">
        Submit a stage for evaluation to see your first score card.
      </p>
    </div>
  )
}
