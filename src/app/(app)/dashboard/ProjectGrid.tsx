'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import OnboardingOverlay from '@/components/OnboardingOverlay'

interface Stage {
  id: string
  stageType: string
  status: string
  evaluations: { overallGrade: string }[]
}

interface Project {
  id: string
  title: string
  seriesName: string
  season: number
  episode: number
  currentStage: string
  status: string
  ageBracket: string
  stages: Stage[]
}

const stageColors: Record<string, string> = {
  idea: 'bg-maka-yellow/20 text-yellow-700',
  script: 'bg-maka-cyan/20 text-cyan-700',
  video: 'bg-maka-purple/20 text-maka-purple',
}

const stageEmojis: Record<string, string> = {
  idea: '💡',
  script: '📝',
  video: '🎬',
}

const statusStyles: Record<string, string> = {
  new: 'bg-gray-100 text-gray-600',
  draft: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-50 text-blue-600',
  submitted: 'bg-amber-50 text-amber-600',
  reviewed: 'bg-maka-cyan/10 text-cyan-700',
  approved: 'bg-maka-green/20 text-green-700',
  declined: 'bg-red-50 text-red-600',
}

const gradeBgColors: Record<string, string> = {
  A: 'bg-maka-green/20 text-green-700',
  B: 'bg-maka-cyan/20 text-cyan-700',
  C: 'bg-maka-yellow/20 text-yellow-700',
  D: 'bg-maka-orange/20 text-orange-700',
  F: 'bg-maka-pink/20 text-pink-700',
}

function getGradeStyle(grade: string) {
  const letter = grade[0]
  return gradeBgColors[letter] || 'bg-gray-100 text-gray-600'
}

const stageBgColors: Record<string, string> = {
  idea: 'from-maka-yellow/30 to-maka-yellow/10',
  script: 'from-maka-cyan/30 to-maka-cyan/10',
  video: 'from-maka-purple/30 to-maka-purple/10',
}

export default function ProjectGrid({ projects, userName, isNewUser }: { projects: Project[]; userName?: string; isNewUser?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showOnboarding, setShowOnboarding] = useState(isNewUser || false)
  const [showModal, setShowModal] = useState(false)

  // Open new project modal from URL param (after onboarding)
  useEffect(() => {
    if (searchParams.get('newProject') === 'true') {
      setShowModal(true)
      router.replace('/dashboard')
    }
  }, [searchParams, router])
  const [form, setForm] = useState({
    title: '',
    seriesName: '',
    newSeries: '',
    season: 1,
    episode: 1,
    ageBracket: '2-4',
    estimatedDuration: '',
  })
  const [creating, setCreating] = useState(false)

  const seriesNames = [...new Set(projects.map((p) => p.seriesName))]

  // Get latest grade for a project
  function getLatestGrade(project: Project): string | null {
    for (const stage of project.stages) {
      if (stage.evaluations.length > 0) {
        return stage.evaluations[0].overallGrade
      }
    }
    return null
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          seriesName: form.newSeries || form.seriesName,
          season: form.season,
          episode: form.episode,
          ageBracket: form.ageBracket,
          estimatedDuration: form.estimatedDuration || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/projects/${data.project.id}`)
      }
    } finally {
      setCreating(false)
      setShowModal(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-maka-dark">My projects</h1>
          <p className="text-sm text-gray-500 mt-1">
            {projects.length} projects across {seriesNames.length} series
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-maka-purple text-white rounded-full text-sm font-medium hover:bg-maka-purple/90 transition-colors flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          New project
        </button>
      </div>

      {/* Project cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const grade = getLatestGrade(project)
            return (
              <button
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
              >
                {/* Thumbnail area */}
                <div className={`h-24 bg-gradient-to-br ${stageBgColors[project.currentStage]} flex items-center justify-center relative`}>
                  <span className="text-3xl">{stageEmojis[project.currentStage]}</span>
                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${stageColors[project.currentStage]}`}>
                    {project.currentStage.charAt(0).toUpperCase() + project.currentStage.slice(1)}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 relative">
                  {grade && (
                    <span className={`absolute top-4 right-4 px-2 py-0.5 rounded text-xs font-bold ${getGradeStyle(grade)}`}>
                      {grade}
                    </span>
                  )}
                  <h3 className="text-sm font-semibold text-maka-dark pr-10 group-hover:text-maka-purple transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {project.seriesName} &middot; S{project.season} E{project.episode}
                  </p>
                  <div className="mt-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyles[project.status]}`}>
                      {project.status.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-[480px] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-maka-dark mb-4">New project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Series name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Series name</label>
                {seriesNames.length > 0 ? (
                  <select
                    value={form.seriesName}
                    onChange={(e) => setForm({ ...form, seriesName: e.target.value, newSeries: '' })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-maka-purple/30 focus:border-maka-purple"
                  >
                    <option value="">Select series or create new</option>
                    {seriesNames.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="__new__">+ Create new series</option>
                  </select>
                ) : null}
                {(form.seriesName === '__new__' || seriesNames.length === 0) && (
                  <input
                    type="text"
                    value={form.newSeries}
                    onChange={(e) => setForm({ ...form, newSeries: e.target.value })}
                    placeholder="Enter series name"
                    className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-maka-purple/30 focus:border-maka-purple"
                    required
                  />
                )}
              </div>

              {/* Season & Episode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                  <input
                    type="number"
                    min={1}
                    value={form.season}
                    onChange={(e) => setForm({ ...form, season: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-maka-purple/30 focus:border-maka-purple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Episode</label>
                  <input
                    type="number"
                    min={1}
                    value={form.episode}
                    onChange={(e) => setForm({ ...form, episode: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-maka-purple/30 focus:border-maka-purple"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Benny's Bakery Adventure"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-maka-purple/30 focus:border-maka-purple"
                  required
                />
              </div>

              {/* Age bracket */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target age bracket</label>
                <div className="flex gap-3">
                  {['0-2', '2-4', '4-6'].map((bracket) => (
                    <label key={bracket} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="ageBracket"
                        value={bracket}
                        checked={form.ageBracket === bracket}
                        onChange={(e) => setForm({ ...form, ageBracket: e.target.value })}
                        className="accent-maka-purple"
                      />
                      <span className="text-sm">{bracket} years</span>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  You can span multiple, but we recommend focusing on one
                </p>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated duration <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.estimatedDuration}
                  onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })}
                  placeholder="e.g., 8 min"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-maka-purple/30 focus:border-maka-purple"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-maka-purple text-white rounded-lg text-sm font-medium hover:bg-maka-purple/90 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding overlay */}
      {showOnboarding && (
        <OnboardingOverlay
          userName={userName || 'Creator'}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}
    </div>
  )
}
