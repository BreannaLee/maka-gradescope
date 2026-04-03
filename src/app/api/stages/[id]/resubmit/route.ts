import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const stage = await prisma.stage.findUnique({
    where: { id },
    include: { project: true },
  })

  if (!stage) return NextResponse.json({ error: 'Stage not found' }, { status: 404 })

  // Increment version and reset status to draft
  await prisma.stage.update({
    where: { id },
    data: {
      version: stage.version + 1,
      status: 'draft',
      submittedAt: null,
      reviewedAt: null,
    },
  })

  // Update project status
  await prisma.project.update({
    where: { id: stage.projectId },
    data: { status: 'in_progress' },
  })

  return NextResponse.json({ success: true, newVersion: stage.version + 1 })
}
