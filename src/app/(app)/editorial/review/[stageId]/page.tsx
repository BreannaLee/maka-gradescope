import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ReviewDetail from './ReviewDetail'

export default async function EditorialReviewPage({ params }: { params: Promise<{ stageId: string }> }) {
  const user = await getSession()
  if (!user) redirect('/login')
  if (user.role === 'creator') redirect('/dashboard')

  const { stageId } = await params

  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: {
      project: {
        include: {
          creator: { select: { id: true, name: true, email: true, creatorGrade: true } },
          chatMessages: {
            where: { stageType: undefined },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
      evaluations: {
        orderBy: { createdAt: 'desc' },
        include: {
          domainScores: { include: { subIndicators: true } },
        },
      },
      comments: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
      safetyFlags: true,
    },
  })

  if (!stage) notFound()

  // Get chat messages for this stage
  const chatMessages = await prisma.chatMessage.findMany({
    where: { projectId: stage.projectId, stageType: stage.stageType },
    orderBy: { createdAt: 'asc' },
  })

  const autoEval = stage.evaluations.find((e) => e.evaluationType === 'auto')
  const editorialEval = stage.evaluations.find((e) => e.evaluationType === 'editorial')

  return (
    <ReviewDetail
      stage={JSON.parse(JSON.stringify(stage))}
      chatMessages={JSON.parse(JSON.stringify(chatMessages))}
      autoEval={autoEval ? JSON.parse(JSON.stringify(autoEval)) : null}
      editorialEval={editorialEval ? JSON.parse(JSON.stringify(editorialEval)) : null}
      userRole={user.role}
    />
  )
}
