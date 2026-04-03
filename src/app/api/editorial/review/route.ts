import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DOMAINS, scoreToGrade } from '@/lib/scoring'
import { calculateCreatorGrade } from '@/lib/safety'

const GRADE_TO_SCORE: Record<string, number> = {
  'A+': 9.7, 'A': 9.2, 'A-': 8.7,
  'B+': 8.2, 'B': 7.5, 'B-': 6.7,
  'C+': 6.2, 'C': 5.7, 'C-': 5.2,
  'D': 4.0, 'F': 1.5,
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user || user.role === 'creator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { stageId, domainScores, notes, decision, decisionReason, isOverride } = await request.json()

  if (!stageId || !decision || !decisionReason) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Only Tier 2 can override
  if (isOverride && user.role !== 'editorial_t2') {
    return NextResponse.json({ error: 'Only senior reviewers can override scores' }, { status: 403 })
  }

  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: { project: true },
  })

  if (!stage) return NextResponse.json({ error: 'Stage not found' }, { status: 404 })

  // Calculate scores from grades
  const domainScoreEntries = DOMAINS.map((d) => {
    const grade = domainScores[d.key] || 'B'
    const score = GRADE_TO_SCORE[grade] || 7.5
    return {
      domain: d.key,
      score,
      grade,
      feedback: notes || `Editorial evaluation: ${grade}`,
      benchmark: 7.0,
    }
  })

  const overallScore = Math.round(
    (domainScoreEntries.reduce((sum, d) => sum + d.score, 0) / domainScoreEntries.length) * 10
  ) / 10

  // Create editorial evaluation
  const evaluation = await prisma.evaluation.create({
    data: {
      stageId,
      evaluationType: 'editorial',
      evaluatorId: user.id,
      overallScore,
      overallGrade: scoreToGrade(overallScore),
      summary: `${decisionReason}${notes ? `\n\nNotes: ${notes}` : ''}`,
      suggestedSteps: JSON.stringify([]),
      isOverride: isOverride || false,
      version: stage.version,
      domainScores: {
        create: domainScoreEntries,
      },
    },
  })

  // Update stage status
  let newStageStatus: string
  let newProjectStatus: string

  switch (decision) {
    case 'approve':
      newStageStatus = 'completed'
      // Advance to next stage or mark project approved
      if (stage.stageType === 'video') {
        newProjectStatus = 'approved'
      } else {
        const nextStage = stage.stageType === 'idea' ? 'script' : 'video'
        newProjectStatus = 'in_progress'
        // Update project current stage
        await prisma.project.update({
          where: { id: stage.projectId },
          data: { currentStage: nextStage },
        })
      }
      break
    case 'revision':
      newStageStatus = 'reviewed'
      newProjectStatus = 'reviewed'
      break
    case 'decline':
      newStageStatus = 'reviewed'
      newProjectStatus = 'declined'
      break
    default:
      newStageStatus = 'reviewed'
      newProjectStatus = 'reviewed'
  }

  await prisma.stage.update({
    where: { id: stageId },
    data: { status: newStageStatus, reviewedAt: new Date() },
  })

  await prisma.project.update({
    where: { id: stage.projectId },
    data: { status: newProjectStatus },
  })

  // Update creator's approved count and recalculate grade
  if (decision === 'approve' && stage.stageType === 'video') {
    await prisma.user.update({
      where: { id: stage.project.creatorId },
      data: { approvedCount: { increment: 1 } },
    })
  }

  // Recalculate creator grade from all their evaluations
  const creatorEvals = await prisma.evaluation.findMany({
    where: {
      stage: { project: { creatorId: stage.project.creatorId } },
    },
    orderBy: { createdAt: 'asc' },
    select: { overallScore: true },
  })
  const newGrade = calculateCreatorGrade(creatorEvals.map((e) => e.overallScore))
  if (newGrade) {
    await prisma.user.update({
      where: { id: stage.project.creatorId },
      data: { creatorGrade: newGrade },
    })
  }

  // Create notification for creator
  const notifTitleMap: Record<string, string> = {
    approve: 'Submission Approved',
    revision: 'Revision Requested',
    decline: 'Submission Declined',
  }

  await prisma.notification.create({
    data: {
      userId: stage.project.creatorId,
      type: 'review_complete',
      title: notifTitleMap[decision] || 'Review Complete',
      message: `Your ${stage.stageType} for "${stage.project.title}" has been ${
        decision === 'approve' ? 'approved' :
        decision === 'revision' ? 'sent back for revisions' :
        'declined'
      }. ${decisionReason}`,
      link: `/projects/${stage.projectId}`,
    },
  })

  return NextResponse.json({ evaluation, decision })
}
