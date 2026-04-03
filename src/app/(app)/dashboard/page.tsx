import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProjectGrid from './ProjectGrid'

export default async function DashboardPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const projects = await prisma.project.findMany({
    where: { creatorId: user.id },
    include: {
      stages: {
        include: {
          evaluations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="p-8">
      <ProjectGrid
        projects={JSON.parse(JSON.stringify(projects))}
        userName={user.name}
        isNewUser={projects.length === 0}
      />
    </div>
  )
}
