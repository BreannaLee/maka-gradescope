'use client'

import { useState } from 'react'
import { DOMAINS } from '@/lib/scoring'

interface DomainScore {
  domain: string
  score: number
  grade: string
}

interface Evaluation {
  id: string
  evaluationType: string
  overallScore: number
  overallGrade: string
  createdAt: string
  domainScores: DomainScore[]
  stage: {
    stageType: string
    project: {
      title: string
      ageBracket: string
      creator: { id: string; name: string }
    }
  }
}

interface Creator {
  id: string
  name: string
  email: string
  creatorGrade: string | null
  approvedCount: number
  projects: {
    id: string
    title: string
    status: string
    stages: {
      stageType: string
      evaluations: {
        overallScore: number
        overallGrade: string
        domainScores: DomainScore[]
      }[]
    }[]
  }[]
}

interface Stage {
  id: string
  stageType: string
  status: string
  project: { ageBracket: string }
}

const gradeColor: Record<string, string> = {
  A: 'text-green-600',
  B: 'text-cyan-600',
  C: 'text-yellow-600',
  D: 'text-orange-600',
  F: 'text-pink-600',
}

export default function AnalyticsDashboard({
  evaluations,
  creators,
  stages,
}: {
  evaluations: Evaluation[]
  creators: Creator[]
  stages: Stage[]
}) {
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '7d'>('all')

  const filteredEvals = evaluations.filter((e) => {
    if (timeRange === 'all') return true
    const days = timeRange === '30d' ? 30 : 7
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return new Date(e.createdAt) >= cutoff
  })

  // KPI calculations
  const avgScore = filteredEvals.length > 0
    ? Math.round((filteredEvals.reduce((s, e) => s + e.overallScore, 0) / filteredEvals.length) * 10) / 10
    : 0

  const totalSubmissions = stages.filter((s) => s.status === 'submitted').length
  const totalApproved = stages.filter((s) => s.status === 'completed').length
  const approvalRate = totalSubmissions + totalApproved > 0
    ? Math.round((totalApproved / (totalSubmissions + totalApproved)) * 100)
    : 0

  // Domain averages
  const domainAverages = DOMAINS.map((d) => {
    const scores = filteredEvals.flatMap((e) =>
      e.domainScores.filter((ds) => ds.domain === d.key).map((ds) => ds.score)
    )
    const avg = scores.length > 0 ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10 : 0
    return { ...d, avg, count: scores.length }
  })

  // Find weakest domain
  const weakestDomain = [...domainAverages].filter((d) => d.count > 0).sort((a, b) => a.avg - b.avg)[0]

  // Scores by stage type
  const stageBreakdown = ['idea', 'script', 'video'].map((stageType) => {
    const stageEvals = filteredEvals.filter((e) => e.stage.stageType === stageType)
    const avg = stageEvals.length > 0
      ? Math.round((stageEvals.reduce((s, e) => s + e.overallScore, 0) / stageEvals.length) * 10) / 10
      : 0
    return { stageType, avg, count: stageEvals.length }
  })

  // Scores by age bracket
  const ageBrackets = ['0-2', '2-4', '4-6']
  const ageBreakdown = ageBrackets.map((bracket) => {
    const bracketEvals = filteredEvals.filter((e) => e.stage.project.ageBracket === bracket)
    const avg = bracketEvals.length > 0
      ? Math.round((bracketEvals.reduce((s, e) => s + e.overallScore, 0) / bracketEvals.length) * 10) / 10
      : 0
    return { bracket, avg, count: bracketEvals.length }
  })

  // Grade distribution
  const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  filteredEvals.forEach((e) => {
    const letter = e.overallGrade[0]
    if (gradeDistribution[letter] !== undefined) gradeDistribution[letter]++
  })
  const maxGradeCount = Math.max(...Object.values(gradeDistribution), 1)

  // Creator leaderboard
  const creatorStats = creators.map((c) => {
    const allEvals = c.projects.flatMap((p) => p.stages.flatMap((s) => s.evaluations))
    const avgScore = allEvals.length > 0
      ? Math.round((allEvals.reduce((s, e) => s + e.overallScore, 0) / allEvals.length) * 10) / 10
      : 0
    return {
      id: c.id,
      name: c.name,
      grade: c.creatorGrade,
      projects: c.projects.length,
      avgScore,
      approved: c.approvedCount,
    }
  }).sort((a, b) => b.avgScore - a.avgScore)

  // Recent evaluations (last 10)
  const recentEvals = filteredEvals.slice(0, 10)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-maka-dark">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredEvals.length} evaluations across {creators.length} creators
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                timeRange === range ? 'bg-white text-maka-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {range === '7d' ? '7 days' : range === '30d' ? '30 days' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Avg Quality Score</p>
          <p className="text-2xl font-bold text-maka-dark mt-1">{avgScore}<span className="text-sm text-gray-400 font-normal">/10</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Approval Rate</p>
          <p className="text-2xl font-bold text-maka-dark mt-1">{approvalRate}<span className="text-sm text-gray-400 font-normal">%</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Total Evaluations</p>
          <p className="text-2xl font-bold text-maka-dark mt-1">{filteredEvals.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Weakest Domain</p>
          <p className="text-2xl font-bold text-maka-dark mt-1">
            {weakestDomain ? (
              <span>{weakestDomain.icon} <span className="text-sm">{weakestDomain.avg}</span></span>
            ) : '—'}
          </p>
          {weakestDomain && <p className="text-[11px] text-gray-400">{weakestDomain.label}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Domain Radar - Bar Chart Style */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Domain Averages</h3>
          <div className="space-y-3">
            {domainAverages.map((d) => (
              <div key={d.key} className="flex items-center gap-3">
                <span className="w-24 text-xs text-gray-600 flex items-center gap-1.5">
                  <span>{d.icon}</span> {d.label}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(d.avg / 10) * 100}%`,
                      backgroundColor: d.color,
                      opacity: 0.7,
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
                    {d.avg > 0 ? d.avg : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Grade Distribution</h3>
          <div className="flex items-end justify-around h-40 gap-2">
            {Object.entries(gradeDistribution).map(([grade, count]) => (
              <div key={grade} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[10px] font-bold text-gray-500">{count}</span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${(count / maxGradeCount) * 100}%`,
                    minHeight: count > 0 ? '8px' : '2px',
                    backgroundColor: grade === 'A' ? '#38E388' :
                      grade === 'B' ? '#4DC9FF' :
                      grade === 'C' ? '#FFE23D' :
                      grade === 'D' ? '#FF5B15' : '#FB5BC5',
                    opacity: 0.7,
                  }}
                />
                <span className={`text-sm font-bold ${gradeColor[grade]}`}>{grade}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* By Stage Type */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Avg Score by Stage</h3>
          <div className="space-y-3">
            {stageBreakdown.map((s) => (
              <div key={s.stageType} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {s.stageType === 'idea' ? '💡' : s.stageType === 'script' ? '📝' : '🎬'} {s.stageType}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-maka-dark">{s.avg || '—'}</span>
                  <span className="text-[10px] text-gray-400">({s.count})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Age Bracket */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Avg Score by Age</h3>
          <div className="space-y-3">
            {ageBreakdown.map((a) => (
              <div key={a.bracket} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{a.bracket} years</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-maka-dark">{a.avg || '—'}</span>
                  <span className="text-[10px] text-gray-400">({a.count})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Creator Leaderboard */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Creator Rankings</h3>
          <div className="space-y-2">
            {creatorStats.slice(0, 5).map((c, i) => (
              <div key={c.id} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 flex-1 truncate">{c.name}</span>
                <span className="text-sm font-bold text-maka-dark">{c.avgScore}</span>
                {c.grade && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-maka-purple/10 text-maka-purple">
                    {c.grade}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Evaluations Table */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Recent Evaluations</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
              <th className="pb-2 font-medium">Content</th>
              <th className="pb-2 font-medium">Creator</th>
              <th className="pb-2 font-medium">Stage</th>
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium">Score</th>
              <th className="pb-2 font-medium">Grade</th>
              <th className="pb-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {recentEvals.map((e) => (
              <tr key={e.id} className="border-b border-gray-50 text-sm">
                <td className="py-2 text-gray-700">{e.stage.project.title}</td>
                <td className="py-2 text-gray-500">{e.stage.project.creator.name}</td>
                <td className="py-2">
                  <span className="capitalize text-gray-500">{e.stage.stageType}</span>
                </td>
                <td className="py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    e.evaluationType === 'auto' ? 'bg-gray-100 text-gray-500' : 'bg-maka-purple/10 text-maka-purple'
                  }`}>
                    {e.evaluationType === 'auto' ? 'Auto' : 'Editorial'}
                  </span>
                </td>
                <td className="py-2 font-medium text-gray-700">{e.overallScore}</td>
                <td className="py-2">
                  <span className={`font-bold ${gradeColor[e.overallGrade[0]] || 'text-gray-500'}`}>
                    {e.overallGrade}
                  </span>
                </td>
                <td className="py-2 text-gray-400 text-xs">
                  {new Date(e.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {recentEvals.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-gray-400">
                  No evaluations yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
