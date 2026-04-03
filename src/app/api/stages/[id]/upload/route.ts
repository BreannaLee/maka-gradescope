import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const stage = await prisma.stage.findUnique({
    where: { id },
    include: { project: true },
  })

  if (!stage) return NextResponse.json({ error: 'Stage not found' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // For video stage, simulate upload (no actual storage in V1)
  if (stage.stageType === 'video') {
    await prisma.stage.update({
      where: { id },
      data: {
        uploadedFileName: file.name,
        uploadedFileUrl: `/uploads/simulated-${file.name}`,
        status: stage.status === 'not_started' ? 'draft' : stage.status,
      },
    })

    // Update project stage if needed
    if (stage.project.currentStage !== 'video') {
      await prisma.project.update({
        where: { id: stage.projectId },
        data: { currentStage: 'video', status: 'draft' },
      })
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      simulated: true,
      message: 'Video upload simulated for V1',
    })
  }

  // For idea/script stages, save the file
  const uploadsDir = path.join(process.cwd(), 'uploads')
  await mkdir(uploadsDir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = `${Date.now()}-${file.name}`
  const filePath = path.join(uploadsDir, fileName)
  await writeFile(filePath, buffer)

  await prisma.stage.update({
    where: { id },
    data: {
      uploadedFileName: file.name,
      uploadedFileUrl: `/uploads/${fileName}`,
      status: stage.status === 'not_started' ? 'draft' : stage.status,
    },
  })

  return NextResponse.json({
    success: true,
    fileName: file.name,
  })
}
