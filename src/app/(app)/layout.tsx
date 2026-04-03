import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'
import AppShell from '@/components/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()
  if (!user) {
    redirect('/login')
  }

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  })

  return (
    <AppShell>
      <div className="h-screen flex flex-col">
        <TopBar
          user={{ name: user.name, role: user.role, creatorGrade: user.creatorGrade }}
          notificationCount={unreadCount}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            role={user.role}
            creatorGrade={user.creatorGrade}
            approvedCount={user.approvedCount}
          />
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </AppShell>
  )
}
