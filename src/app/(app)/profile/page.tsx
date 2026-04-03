import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfileView from './ProfileView'

export default async function ProfilePage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const projects = await prisma.project.findMany({
    where: { creatorId: user.id },
    include: {
      stages: {
        include: {
          evaluations: {
            include: { domainScores: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <ProfileView
      user={JSON.parse(JSON.stringify(user))}
      projects={JSON.parse(JSON.stringify(projects))}
    />
  )
}
