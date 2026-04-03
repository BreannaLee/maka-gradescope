import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Check for stale drafts (older than 7 days) and send reminders
export async function POST() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Find stages that are in draft status and haven't been updated in 7 days
  const staleStages = await prisma.stage.findMany({
    where: {
      status: 'draft',
      createdAt: { lt: sevenDaysAgo },
    },
    include: {
      project: {
        include: { creator: true },
      },
    },
  })

  let notificationsCreated = 0

  for (const stage of staleStages) {
    // Check if we already sent a stale reminder for this stage recently
    const existing = await prisma.notification.findFirst({
      where: {
        userId: stage.project.creatorId,
        type: 'stale_reminder',
        link: `/projects/${stage.projectId}`,
        createdAt: { gt: sevenDaysAgo },
      },
    })

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: stage.project.creatorId,
          type: 'stale_reminder',
          title: 'Draft needs attention',
          message: `Your ${stage.stageType} stage for "${stage.project.title}" has been a draft for over a week. Ready to continue?`,
          link: `/projects/${stage.projectId}`,
        },
      })
      notificationsCreated++
    }
  }

  return NextResponse.json({ checked: staleStages.length, notified: notificationsCreated })
}
