import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function ChatbotPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  // Find the most recent active project and redirect to its chat
  const project = await prisma.project.findFirst({
    where: { creatorId: user.id, status: { not: 'approved' } },
    orderBy: { updatedAt: 'desc' },
  })

  if (project) {
    redirect(`/projects/${project.id}/chat/${project.currentStage}`)
  }

  // No active project — show message
  return (
    <div className="p-8 flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-maka-purple to-maka-pink flex items-center justify-center mb-4">
        <span className="text-white text-2xl font-bold">M</span>
      </div>
      <h2 className="text-lg font-semibold text-maka-dark mb-2">No active project</h2>
      <p className="text-sm text-gray-400 mb-4">
        Create a new project to start chatting with Maka.
      </p>
    </div>
  )
}
