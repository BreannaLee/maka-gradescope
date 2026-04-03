'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { scoreToGrade } from '@/lib/scoring'

interface Submission {
  id: string
  stageType: string
  submittedAt: string
  project: {
    id: string
    title: string
    ageBracket: string
    creator: { name: string }
  }
  evaluations: { overallGrade: string; overallScore: number }[]
  safetyFlags: { id: string }[]
}

const stageColors: Record<string, string> = {
  idea: 'bg-maka-yellow/20 text-yellow-700',
  script: 'bg-maka-cyan/20 text-cyan-700',
  video: 'bg-maka-purple/20 text-maka-purple',
}

export default function ReviewQueue({
  submissions,
  avgScore,
  flaggedCount,
  totalPending,
}: {
  submissions: Submission[]
  avgScore: number
  flaggedCount: number
  totalPending: number
}) {
  const router = useRouter()
  const [filter, setFilter] = useState('all')

  const filtered = submissions.filter((s) => {
    if (filter === 'all') return true
    if (filter === 'flagged') return s.safetyFlags.length > 0
    return s.stageType === filter
  })

  const avgGrade = scoreToGrade(avgScore)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-maka-dark">Review queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalPending} pending &middot; {flaggedCount} flagged
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'idea', label: 'Ideas' },
          { key: 'script', label: 'Scripts' },
          { key: 'video', label: 'Videos' },
          { key: 'flagged', label: `Flagged`, count: flaggedCount },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-maka-purple text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Queue table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Creator</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Content</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Stage</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Grade</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Flags</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-sm text-gray-400">
                  No submissions to review
                </td>
              </tr>
            ) : (
              filtered.map((sub) => {
                const grade = sub.evaluations[0]?.overallGrade || '—'
                return (
                  <tr
                    key={sub.id}
                    onClick={() => router.push(`/editorial/review/${sub.id}`)}
                    className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-maka-dark">
                      {sub.project.creator.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {sub.project.title}{' '}
                      <span className="text-gray-400">({sub.project.ageBracket})</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${stageColors[sub.stageType]}`}>
                        {sub.stageType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        grade.startsWith('A') ? 'bg-maka-green/20 text-green-700' :
                        grade.startsWith('B') ? 'bg-maka-cyan/20 text-cyan-700' :
                        grade.startsWith('C') ? 'bg-maka-yellow/20 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {grade}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sub.safetyFlags.length > 0 ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-medium">
                          {sub.safetyFlags.length}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {sub.submittedAt
                        ? new Date(sub.submittedAt).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Quick analytics */}
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick analytics</h3>
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Avg. quality this month</p>
          <p className="text-2xl font-bold text-maka-dark mt-1">{avgGrade}</p>
          <p className="text-[11px] text-maka-green mt-0.5">{avgScore}/10</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Most common domain gap</p>
          <p className="text-2xl font-bold text-maka-dark mt-1">Physical</p>
          <p className="text-[11px] text-gray-500 mt-0.5">38% of submissions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Struggling creators</p>
          <p className="text-2xl font-bold text-maka-dark mt-1">0</p>
          <p className="text-[11px] text-gray-500 mt-0.5">3+ below threshold</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Content gap</p>
          <p className="text-2xl font-bold text-maka-dark mt-1">0–2 ages</p>
          <p className="text-[11px] text-gray-500 mt-0.5">12% of library</p>
        </div>
      </div>
    </div>
  )
}
