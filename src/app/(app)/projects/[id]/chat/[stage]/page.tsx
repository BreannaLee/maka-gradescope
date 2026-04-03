import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ChatInterface from './ChatInterface'

export default async function ChatPage({ params }: { params: Promise<{ id: string; stage: string }> }) {
  const user = await getSession()
  if (!user) redirect('/login')

  const { id, stage } = await params

  const project = await prisma.project.findUnique({
    where: { id },
  })

  if (!project) notFound()

  const messages = await prisma.chatMessage.findMany({
    where: { projectId: id, stageType: stage },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <ChatInterface
      projectId={id}
      projectTitle={project.title}
      stageType={stage}
      ageBracket={project.ageBracket}
      initialMessages={JSON.parse(JSON.stringify(messages))}
    />
  )
}
