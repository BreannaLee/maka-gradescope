import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildSystemPrompt } from '@/lib/chatbot'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, stageType, message } = await request.json()

  if (!projectId || !stageType || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Get project context
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      stages: {
        include: {
          evaluations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { domainScores: true },
          },
        },
      },
    },
  })

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Update stage to draft if not_started
  const currentStage = project.stages.find((s) => s.stageType === stageType)
  if (currentStage?.status === 'not_started') {
    await prisma.stage.update({
      where: { id: currentStage.id },
      data: { status: 'draft' },
    })
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'draft', currentStage: stageType },
    })
  }

  // Build past scores summary
  const pastScores = project.stages
    .filter((s) => s.evaluations.length > 0)
    .map((s) => {
      const eval_ = s.evaluations[0]
      const domains = eval_.domainScores.map((d) => `${d.domain}: ${d.grade}`).join(', ')
      return `${s.stageType} stage: ${eval_.overallGrade} (${domains})`
    })
    .join('; ')

  // Get conversation history
  const history = await prisma.chatMessage.findMany({
    where: { projectId, stageType },
    orderBy: { createdAt: 'asc' },
  })

  // Save user message
  await prisma.chatMessage.create({
    data: { projectId, stageType, role: 'user', content: message },
  })

  // Build messages for OpenAI
  const systemPrompt = buildSystemPrompt(project.title, project.ageBracket, stageType, pastScores)

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1500,
      temperature: 0.8,
    })

    const reply = completion.choices[0]?.message?.content || 'I\'m sorry, I couldn\'t generate a response. Please try again.'

    // Save assistant message
    const saved = await prisma.chatMessage.create({
      data: { projectId, stageType, role: 'assistant', content: reply },
    })

    return NextResponse.json({ message: saved })
  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Maka is temporarily unavailable. Please try again in a few minutes.' },
      { status: 503 }
    )
  }
}

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const stageType = searchParams.get('stageType')

  if (!projectId || !stageType) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const messages = await prisma.chatMessage.findMany({
    where: { projectId, stageType },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ messages })
}
