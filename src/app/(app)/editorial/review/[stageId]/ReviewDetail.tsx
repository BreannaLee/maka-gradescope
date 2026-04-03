'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DOMAINS } from '@/lib/scoring'

interface DomainScore {
  domain: string
  score: number
  grade: string
  feedback: string
  benchmark: number
  subIndicators: { indicatorName: string; score: number; maxScore: number }[]
}

interface Evaluation {
  id: string
  evaluationType: string
  overallScore: number
  overallGrade: string
  summary: string
  suggestedSteps: string
  domainScores: DomainScore[]
  createdAt: string
}

interface ChatMsg {
  id: string
  role: string
  content: string
  createdAt: string
}

interface Comment {
  id: string
  content: string
  anchor: string
  commentType: string
  resolved: boolean
  author: { name: string }
  createdAt: string
}

interface SafetyFlag {
  id: string
  flagType: string
  severity: string
  description: string
  resolved: boolean
}

interface Stage {
  id: string
  stageType: string
  status: string
  version: number
  uploadedFileName: string | null
  chatbotSummary: string | null
  project: {
    id: string
    title: string
    ageBracket: string
    seriesName: string
    season: number
    episode: number
    creator: { id: string; name: string; email: string; creatorGrade: string | null }
  }
  comments: Comment[]
  safetyFlags: SafetyFlag[]
}

const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']

function MiniRadarChart({ domainScores }: { domainScores: DomainScore[] }) {
  const size = 180
  const center = size / 2
  const radius = 70
  const domains = DOMAINS.map((d) => d.key)
  const angleStep = (2 * Math.PI) / domains.length

  function getPoint(index: number, value: number) {
    const angle = angleStep * index - Math.PI / 2
    const r = (value / 10) * radius
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }
  }

  const scorePoints = domains
    .map((domain, i) => {
      const ds = domainScores.find((d) => d.domain === domain)
      return getPoint(i, ds?.score || 0)
    })
    .map((p) => `${p.x},${p.y}`)
    .join(' ')

  const gridLevels = [5, 10]

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[180px]">
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={domains.map((_, i) => { const p = getPoint(i, level); return `${p.x},${p.y}` }).join(' ')}
          fill="none" stroke="#e5e7eb" strokeWidth="0.5"
        />
      ))}
      {domains.map((_, i) => {
        const p = getPoint(i, 10)
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="0.5" />
      })}
      <polygon points={scorePoints} fill="#6E55FF" fillOpacity="0.18" stroke="#6E55FF" strokeWidth="1.5" />
      {domains.map((domain, i) => {
        const ds = domainScores.find((d) => d.domain === domain)
        const point = getPoint(i, ds?.score || 0)
        const domainInfo = DOMAINS.find((d) => d.key === domain)
        return <circle key={domain} cx={point.x} cy={point.y} r="3" fill={domainInfo?.color || '#6E55FF'} />
      })}
    </svg>
  )
}

export default function ReviewDetail({
  stage,
  chatMessages,
  autoEval,
  editorialEval,
  userRole,
}: {
  stage: Stage
  chatMessages: ChatMsg[]
  autoEval: Evaluation | null
  editorialEval: Evaluation | null
  userRole: string
}) {
  const router = useRouter()
  const [scores, setScores] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    DOMAINS.forEach((d) => {
      const autoScore = autoEval?.domainScores.find((ds) => ds.domain === d.key)
      initial[d.key] = autoScore?.grade || 'B'
    })
    return initial
  })
  const [notes, setNotes] = useState('')
  const [decision, setDecision] = useState<'approve' | 'revision' | 'decline' | null>(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentAnchor, setCommentAnchor] = useState('')

  // Score override state (Tier 2 only)
  const [overrideMode, setOverrideMode] = useState(false)

  async function handleSubmitReview() {
    if (!decision || !decisionReason.trim()) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/editorial/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: stage.id,
          domainScores: scores,
          notes,
          decision,
          decisionReason,
          isOverride: overrideMode,
        }),
      })

      if (res.ok) {
        router.push('/editorial')
        router.refresh()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return

    await fetch('/api/editorial/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stageId: stage.id,
        content: newComment,
        anchor: commentAnchor || '0',
        commentType: stage.stageType === 'video' ? 'timestamped' : 'inline',
      }),
    })

    setNewComment('')
    setCommentAnchor('')
    router.refresh()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/editorial')} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <p className="text-sm font-semibold text-maka-dark">{stage.project.title}</p>
            <p className="text-[11px] text-gray-400">
              {stage.project.creator.name} &middot; {stage.stageType} stage &middot; Ages {stage.project.ageBracket}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stage.safetyFlags.filter((f) => !f.resolved).length > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-[11px] font-medium">
              {stage.safetyFlags.filter((f) => !f.resolved).length} safety flags
            </span>
          )}
          <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${
            stage.status === 'submitted' ? 'bg-amber-50 text-amber-600' :
            stage.status === 'reviewed' ? 'bg-maka-green/20 text-green-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            {stage.status}
          </span>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Content (60%) */}
        <div className="w-[60%] border-r border-gray-200 overflow-y-auto">
          {/* Safety flags banner */}
          {stage.safetyFlags.filter((f) => !f.resolved).length > 0 && (
            <div className="bg-red-50 border-b border-red-100 px-6 py-3">
              <p className="text-xs font-semibold text-red-600 mb-2">Safety Flags</p>
              {stage.safetyFlags.filter((f) => !f.resolved).map((flag) => (
                <div key={flag.id} className="flex items-center gap-2 mb-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    flag.severity === 'hard_reject' ? 'bg-red-200 text-red-800' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {flag.severity === 'hard_reject' ? 'HARD REJECT' : 'WARNING'}
                  </span>
                  <span className="text-xs text-red-700">{flag.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Content area */}
          <div className="p-6">
            {/* Chatbot summary */}
            {stage.chatbotSummary && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Summary</h3>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">{stage.chatbotSummary}</p>
              </div>
            )}

            {/* Uploaded file */}
            {stage.uploadedFileName && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Uploaded File</h3>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <span className="text-lg">📎</span>
                  <span className="text-sm text-gray-600">{stage.uploadedFileName}</span>
                </div>
              </div>
            )}

            {/* Chat conversation transcript */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Conversation Transcript ({chatMessages.length} messages)
              </h3>
              {chatMessages.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No conversation for this stage.</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-maka-purple/10 text-maka-dark'
                          : 'bg-gray-50 text-gray-600'
                      }`}>
                        <p className="text-[10px] font-medium mb-1 ${msg.role === 'user' ? 'text-maka-purple' : 'text-gray-400'}">
                          {msg.role === 'user' ? 'Creator' : 'Maka'}
                        </p>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments section */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Comments ({stage.comments.length})
              </h3>
              {stage.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 mb-3">
                  <div className="w-6 h-6 rounded-full bg-maka-cyan/20 text-cyan-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {comment.author.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-maka-dark">{comment.author.name}</span>
                      {comment.anchor !== '0' && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                          {stage.stageType === 'video' ? comment.anchor : `Line ${comment.anchor}`}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}

              {/* Add comment */}
              <div className="flex gap-2 mt-3">
                {stage.stageType === 'video' && (
                  <input
                    type="text"
                    value={commentAnchor}
                    onChange={(e) => setCommentAnchor(e.target.value)}
                    placeholder="0:00"
                    className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-maka-purple/30 focus:border-maka-purple"
                  />
                )}
                {stage.stageType === 'script' && (
                  <input
                    type="text"
                    value={commentAnchor}
                    onChange={(e) => setCommentAnchor(e.target.value)}
                    placeholder="Line #"
                    className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-maka-purple/30 focus:border-maka-purple"
                  />
                )}
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-maka-purple/30 focus:border-maka-purple"
                />
                <button
                  onClick={handleAddComment}
                  className="px-3 py-1.5 bg-maka-purple text-white rounded-lg text-xs font-medium hover:bg-maka-purple/90"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — Evaluation (40%) */}
        <div className="w-[40%] overflow-y-auto bg-gray-50/50">
          <div className="p-6 space-y-5">
            {/* Algorithm assessment */}
            {autoEval && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Algorithm Assessment</h3>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">Auto-generated</span>
                </div>
                <div className="flex items-center justify-center mb-3">
                  <MiniRadarChart domainScores={autoEval.domainScores} />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Overall</span>
                  <span className={`px-2 py-0.5 rounded text-sm font-bold ${
                    autoEval.overallGrade.startsWith('A') ? 'bg-maka-green/20 text-green-700' :
                    autoEval.overallGrade.startsWith('B') ? 'bg-maka-cyan/20 text-cyan-700' :
                    'bg-maka-yellow/20 text-yellow-700'
                  }`}>
                    {autoEval.overallGrade} ({autoEval.overallScore})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {autoEval.domainScores.map((ds) => {
                    const domainInfo = DOMAINS.find((d) => d.key === ds.domain)
                    return (
                      <div key={ds.domain} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{domainInfo?.icon} {domainInfo?.label}</span>
                        <span className="font-medium text-gray-700">{ds.grade}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Your evaluation form */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Your Evaluation</h3>
                {userRole === 'editorial_t2' && (
                  <button
                    onClick={() => setOverrideMode(!overrideMode)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      overrideMode ? 'bg-maka-orange/20 text-orange-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {overrideMode ? 'Override ON' : 'Score Override'}
                  </button>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {DOMAINS.map((d) => (
                  <div key={d.key} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{d.icon} {d.label}</span>
                    <select
                      value={scores[d.key]}
                      onChange={(e) => setScores({ ...scores, [d.key]: e.target.value })}
                      className="px-2 py-1 border border-gray-200 rounded text-xs font-medium focus:ring-2 focus:ring-maka-purple/30 focus:border-maka-purple"
                    >
                      {GRADE_OPTIONS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Overall notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Your assessment notes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-maka-purple/30 focus:border-maka-purple resize-none"
                />
              </div>
            </div>

            {/* Decision */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Decision</h3>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => setDecision('approve')}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors border ${
                    decision === 'approve'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'border-gray-200 text-gray-500 hover:border-green-200 hover:text-green-600'
                  }`}
                >
                  Approve
                </button>
                <button
                  onClick={() => setDecision('revision')}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors border ${
                    decision === 'revision'
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'border-gray-200 text-gray-500 hover:border-amber-200 hover:text-amber-600'
                  }`}
                >
                  Request Revision
                </button>
                <button
                  onClick={() => setDecision('decline')}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors border ${
                    decision === 'decline'
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600'
                  }`}
                >
                  Decline
                </button>
              </div>

              {decision && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Reasoning <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    rows={3}
                    placeholder={
                      decision === 'approve' ? 'Why this content meets Maka standards...' :
                      decision === 'revision' ? 'What specific changes are needed...' :
                      'Why this content does not meet standards...'
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-maka-purple/30 focus:border-maka-purple resize-none"
                  />
                </div>
              )}

              <button
                onClick={handleSubmitReview}
                disabled={!decision || !decisionReason.trim() || submitting}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${
                  decision === 'approve' ? 'bg-green-600 text-white hover:bg-green-700' :
                  decision === 'revision' ? 'bg-amber-500 text-white hover:bg-amber-600' :
                  decision === 'decline' ? 'bg-red-500 text-white hover:bg-red-600' :
                  'bg-gray-200 text-gray-400'
                }`}
              >
                {submitting ? 'Submitting...' :
                  decision === 'approve' ? 'Approve Submission' :
                  decision === 'revision' ? 'Request Revision' :
                  decision === 'decline' ? 'Decline Submission' :
                  'Select a decision'}
              </button>
            </div>

            {/* Previous editorial evaluation */}
            {editorialEval && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Previous Editorial Review</h3>
                <p className="text-sm text-gray-600">{editorialEval.summary}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">
                    {new Date(editorialEval.createdAt).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-maka-cyan/20 text-cyan-700">
                    {editorialEval.overallGrade}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
