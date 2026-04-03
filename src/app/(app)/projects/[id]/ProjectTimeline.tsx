'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { useToast } from '@/components/Toast'
import { DOMAINS } from '@/lib/scoring'

interface DomainScore {
  domain: string
  score: number
  grade: string
  feedback: string
}

interface Evaluation {
  id: string
  overallScore: number
  overallGrade: string
  summary: string
  suggestedSteps: string
  domainScores: DomainScore[]
  evaluationType: string
  createdAt: string
  version: number
}

interface Stage {
  id: string
  stageType: string
  status: string
  version: number
  chatbotSummary: string | null
  uploadedFileName: string | null
  evaluations: Evaluation[]
}

interface Project {
  id: string
  title: string
  seriesName: string
  season: number
  episode: number
  ageBracket: string
  estimatedDuration: string | null
  currentStage: string
  status: string
  stages: Stage[]
}

const stageConfig: Record<string, { icon: string; color: string; bgColor: string; borderColor: string }> = {
  idea: { icon: '💡', color: 'text-yellow-600', bgColor: 'bg-maka-yellow/20', borderColor: 'border-maka-yellow' },
  script: { icon: '📝', color: 'text-cyan-600', bgColor: 'bg-maka-cyan/20', borderColor: 'border-maka-cyan' },
  video: { icon: '🎬', color: 'text-maka-purple', bgColor: 'bg-maka-purple/20', borderColor: 'border-maka-purple' },
}

const statusPill: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-500',
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-amber-50 text-amber-600',
  reviewed: 'bg-maka-cyan/10 text-cyan-700',
  completed: 'bg-maka-green/20 text-green-700',
}

const gradeStyle: Record<string, string> = {
  A: 'bg-maka-green/20 text-green-700',
  B: 'bg-maka-cyan/20 text-cyan-700',
  C: 'bg-maka-yellow/20 text-yellow-700',
  D: 'bg-maka-orange/20 text-orange-700',
  F: 'bg-maka-pink/20 text-pink-700',
}

function getGradeStyle(grade: string) {
  return gradeStyle[grade[0]] || 'bg-gray-100 text-gray-600'
}

const ACCEPTED_DOCS = '.pdf,.doc,.docx'
const ACCEPTED_VIDEO = 'video/*'

export default function ProjectTimeline({ project }: { project: Project }) {
  const router = useRouter()
  const { addToast } = useToast()
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [showVersions, setShowVersions] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  async function handleSubmitForReview(stageId: string) {
    setSubmitting(stageId)
    try {
      const res = await fetch(`/api/stages/${stageId}/submit`, { method: 'POST' })
      if (res.ok) {
        addToast({ type: 'success', title: 'Submitted for review', message: 'Your submission has been evaluated and sent to the editorial team.' })
      } else {
        addToast({ type: 'error', title: 'Submission failed', message: 'Please try again.' })
      }
      router.refresh()
    } finally {
      setSubmitting(null)
    }
  }

  async function handleResubmit(stageId: string) {
    const res = await fetch(`/api/stages/${stageId}/resubmit`, { method: 'POST' })
    if (res.ok) {
      addToast({ type: 'info', title: 'Ready for revision', message: 'You can now update and resubmit this stage.' })
      router.refresh()
    }
  }

  async function handleFileUpload(stageId: string, stageType: string, file: File) {
    setUploading(stageId)
    setUploadProgress(0)

    // Simulate progress for video uploads
    if (stageType === 'video') {
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) { clearInterval(interval); return 95 }
          return prev + Math.random() * 15
        })
      }, 200)

      // Simulate 2s upload
      await new Promise((resolve) => setTimeout(resolve, 2000))
      clearInterval(interval)
      setUploadProgress(100)
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/stages/${stageId}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        addToast({
          type: 'success',
          title: 'File uploaded',
          message: data.simulated ? `${file.name} (simulated for V1)` : file.name,
        })
        router.refresh()
      } else {
        addToast({ type: 'error', title: 'Upload failed', message: 'Please try again.' })
      }
    } finally {
      setUploading(null)
      setUploadProgress(0)
    }
  }

  function triggerFileInput(stageId: string) {
    fileInputRefs.current[stageId]?.click()
  }

  async function handleDelete() {
    await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
    addToast({ type: 'info', title: 'Project deleted' })
    router.push('/dashboard')
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <button
        onClick={() => router.push('/dashboard')}
        className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1 transition-colors"
      >
        &larr; Back to projects
      </button>

      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
            {project.seriesName} &middot; Season {project.season} &middot; Episode {project.episode}
          </p>
          <h1 className="text-2xl font-bold text-maka-dark mt-1">{project.title}</h1>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-0.5 bg-maka-purple/10 text-maka-purple rounded-full text-xs font-medium">
              Ages {project.ageBracket}
            </span>
            {project.estimatedDuration && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                {project.estimatedDuration}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/projects/${project.id}/chat/${project.currentStage}`)}
            className="px-4 py-2 bg-maka-purple text-white rounded-lg text-sm font-medium hover:bg-maka-purple/90 transition-colors"
          >
            Open chatbot
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="px-3 py-2 text-gray-400 hover:text-red-500 transition-colors text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-8 relative">
        <div className="absolute left-[17px] top-6 bottom-6 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {project.stages.map((stage) => {
            const config = stageConfig[stage.stageType]
            const eval_ = stage.evaluations[0] || null
            const isCurrentStage = project.currentStage === stage.stageType
            const isReviewed = stage.status === 'reviewed'
            const acceptType = stage.stageType === 'video' ? ACCEPTED_VIDEO : ACCEPTED_DOCS

            return (
              <div key={stage.id} className="flex gap-4">
                {/* Stage node */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${
                  isCurrentStage ? config.borderColor : 'border-gray-200'
                } ${isCurrentStage ? config.bgColor : 'bg-white'}`}>
                  <span className="text-sm">{config.icon}</span>
                </div>

                {/* Stage card */}
                <div className={`flex-1 bg-white rounded-xl border p-5 ${
                  isCurrentStage ? 'border-gray-200 shadow-sm' : 'border-gray-100'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-maka-dark capitalize">{stage.stageType} Stage</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusPill[stage.status]}`}>
                        {stage.status.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
                      </span>
                      {stage.version > 1 && (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded text-[10px]">
                          v{stage.version}
                        </span>
                      )}
                    </div>
                    {eval_ && (
                      <div className="flex items-center gap-2">
                        {eval_.evaluationType === 'editorial' && (
                          <span className="text-[10px] text-gray-400">Reviewer</span>
                        )}
                        <span className={`px-2.5 py-1 rounded text-sm font-bold ${getGradeStyle(eval_.overallGrade)}`}>
                          {eval_.overallGrade}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {stage.chatbotSummary && (
                    <p className="text-sm text-gray-500 mb-3">{stage.chatbotSummary}</p>
                  )}

                  {/* Uploaded file indicator */}
                  {stage.uploadedFileName && (
                    <div className="flex items-center gap-2 mb-3 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm">📎</span>
                      <span className="text-xs text-gray-600">{stage.uploadedFileName}</span>
                      {stage.stageType === 'video' && (
                        <span className="text-[10px] bg-maka-purple/10 text-maka-purple px-1.5 py-0.5 rounded ml-auto">
                          Simulated
                        </span>
                      )}
                    </div>
                  )}

                  {/* Upload progress bar */}
                  {uploading === stage.id && (
                    <div className="mb-3">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-maka-purple rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{Math.round(uploadProgress)}% uploaded</p>
                    </div>
                  )}

                  {/* Domain mini-bars */}
                  {eval_ && eval_.domainScores.length > 0 && (
                    <div className="mb-3">
                      <div className="flex gap-1">
                        {DOMAINS.map((d) => {
                          const ds = eval_.domainScores.find((s) => s.domain === d.key)
                          return (
                            <div key={d.key} className="flex-1 group relative">
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${((ds?.score || 0) / 10) * 100}%`,
                                    backgroundColor: d.color,
                                    opacity: 0.7,
                                  }}
                                />
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                                {d.icon} {d.label}: {ds?.score || 0}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Feedback block */}
                  {eval_ && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-gray-400 mb-1">Feedback</p>
                      <p className="text-sm text-gray-600 italic">{eval_.summary}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {eval_ && (
                      <button
                        onClick={() => router.push(`/projects/${project.id}/scorecard/${stage.id}`)}
                        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        View score card
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/projects/${project.id}/chat/${stage.stageType}`)}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Discuss with chatbot
                    </button>

                    {/* File upload button */}
                    {isCurrentStage && stage.status !== 'submitted' && stage.status !== 'completed' && (
                      <>
                        <input
                          ref={(el) => { fileInputRefs.current[stage.id] = el }}
                          type="file"
                          accept={acceptType}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(stage.id, stage.stageType, file)
                          }}
                        />
                        <button
                          onClick={() => triggerFileInput(stage.id)}
                          disabled={uploading === stage.id}
                          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          {uploading === stage.id ? 'Uploading...' : `Upload ${stage.stageType === 'video' ? 'video' : 'file'}`}
                        </button>
                      </>
                    )}

                    {/* Submit for review */}
                    {(stage.status === 'draft' || stage.status === 'not_started') && isCurrentStage && (
                      <button
                        onClick={() => handleSubmitForReview(stage.id)}
                        disabled={submitting === stage.id}
                        className="px-3 py-1.5 text-xs bg-maka-purple text-white rounded-lg hover:bg-maka-purple/90 transition-colors disabled:opacity-50"
                      >
                        {submitting === stage.id ? 'Submitting...' : 'Submit for review'}
                      </button>
                    )}

                    {/* Resubmit after revision */}
                    {isReviewed && isCurrentStage && project.status !== 'declined' && (
                      <button
                        onClick={() => handleResubmit(stage.id)}
                        className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                      >
                        Start revision
                      </button>
                    )}

                    {/* Version history */}
                    {stage.evaluations.length > 1 && (
                      <button
                        onClick={() => setShowVersions(showVersions === stage.id ? null : stage.id)}
                        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Version history ({stage.evaluations.length})
                      </button>
                    )}
                  </div>

                  {/* Version history panel */}
                  {showVersions === stage.id && stage.evaluations.length > 1 && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <p className="text-xs font-medium text-gray-400 mb-2">Version History</p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400">
                            <th className="text-left pb-1">Version</th>
                            <th className="text-left pb-1">Date</th>
                            <th className="text-left pb-1">Type</th>
                            <th className="text-left pb-1">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stage.evaluations.map((ev, i) => (
                            <tr key={ev.id} className={i === 0 ? 'font-medium text-maka-dark' : 'text-gray-500'}>
                              <td className="py-1">v{ev.version}</td>
                              <td className="py-1">{new Date(ev.createdAt).toLocaleDateString()}</td>
                              <td className="py-1 capitalize">{ev.evaluationType}</td>
                              <td className="py-1">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getGradeStyle(ev.overallGrade)}`}>
                                  {ev.overallGrade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[400px] p-6 shadow-xl">
            <h3 className="text-lg font-bold text-maka-dark mb-2">Delete project?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete this project and all its data. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
