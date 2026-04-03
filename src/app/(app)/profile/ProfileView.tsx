'use client'

import { DOMAINS } from '@/lib/scoring'

interface DomainScore {
  domain: string
  score: number
  grade: string
}

interface Evaluation {
  id: string
  overallScore: number
  overallGrade: string
  evaluationType: string
  createdAt: string
  domainScores: DomainScore[]
}

interface Stage {
  stageType: string
  evaluations: Evaluation[]
}

interface Project {
  id: string
  title: string
  seriesName: string
  status: string
  currentStage: string
  updatedAt: string
  stages: Stage[]
}

interface User {
  id: string
  name: string
  email: string
  bio: string | null
  creatorGrade: string | null
  approvedCount: number
}

const gradeBg: Record<string, string> = {
  A: 'bg-maka-green/20 text-green-700',
  B: 'bg-maka-cyan/20 text-cyan-700',
  C: 'bg-maka-yellow/20 text-yellow-700',
  D: 'bg-maka-orange/20 text-orange-700',
  F: 'bg-maka-pink/20 text-pink-700',
}

export default function ProfileView({ user, projects }: { user: User; projects: Project[] }) {
  const approvedProjects = projects.filter((p) => p.status === 'approved')

  // Gather all evaluations in chronological order for the score history
  const allEvals = projects
    .flatMap((p) => p.stages.flatMap((s) => s.evaluations))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  // Domain averages across all evaluations
  const domainAverages = DOMAINS.map((d) => {
    const scores = allEvals.flatMap((e) =>
      e.domainScores.filter((ds) => ds.domain === d.key).map((ds) => ds.score)
    )
    const avg = scores.length > 0
      ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
      : 0
    return { ...d, avg }
  })

  // Score history data for SVG line chart
  const chartData = allEvals.map((e, i) => ({
    index: i,
    score: e.overallScore,
    grade: e.overallGrade,
    date: new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    type: e.evaluationType,
  }))

  const chartWidth = 500
  const chartHeight = 120
  const padding = { top: 10, right: 10, bottom: 20, left: 30 }
  const plotW = chartWidth - padding.left - padding.right
  const plotH = chartHeight - padding.top - padding.bottom

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-maka-purple/10 text-maka-purple flex items-center justify-center text-2xl font-bold">
          {user.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-maka-dark">{user.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{user.bio || 'No bio yet'}</p>
          {user.creatorGrade && (
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-3 py-1 rounded-lg text-lg font-bold ${gradeBg[user.creatorGrade[0]] || 'bg-gray-100 text-gray-600'}`}>
                {user.creatorGrade}
              </span>
              <span className="text-xs text-gray-400">
                {user.approvedCount} approved &middot; {projects.length} total projects
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Score History Chart */}
      <h2 className="text-lg font-bold text-maka-dark mb-4">Score history</h2>
      {chartData.length >= 2 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-8">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
            {/* Y-axis grid lines */}
            {[0, 2.5, 5, 7.5, 10].map((v) => {
              const y = padding.top + plotH - (v / 10) * plotH
              return (
                <g key={v}>
                  <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#f3f4f6" strokeWidth="1" />
                  <text x={padding.left - 5} y={y + 3} textAnchor="end" className="text-[8px] fill-gray-400">{v}</text>
                </g>
              )
            })}

            {/* Line */}
            <polyline
              fill="none"
              stroke="#6E55FF"
              strokeWidth="2"
              points={chartData.map((d, i) => {
                const x = padding.left + (i / (chartData.length - 1)) * plotW
                const y = padding.top + plotH - (d.score / 10) * plotH
                return `${x},${y}`
              }).join(' ')}
            />

            {/* Area fill */}
            <polygon
              fill="#6E55FF"
              fillOpacity="0.08"
              points={[
                `${padding.left},${padding.top + plotH}`,
                ...chartData.map((d, i) => {
                  const x = padding.left + (i / (chartData.length - 1)) * plotW
                  const y = padding.top + plotH - (d.score / 10) * plotH
                  return `${x},${y}`
                }),
                `${padding.left + plotW},${padding.top + plotH}`,
              ].join(' ')}
            />

            {/* Data points */}
            {chartData.map((d, i) => {
              const x = padding.left + (i / (chartData.length - 1)) * plotW
              const y = padding.top + plotH - (d.score / 10) * plotH
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill={d.type === 'editorial' ? '#FB5BC5' : '#6E55FF'} />
                  <text x={x} y={chartHeight - 3} textAnchor="middle" className="text-[7px] fill-gray-400">
                    {d.date}
                  </text>
                </g>
              )
            })}
          </svg>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="w-2 h-2 rounded-full bg-maka-purple inline-block" /> Auto
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="w-2 h-2 rounded-full bg-maka-pink inline-block" /> Editorial
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center mb-8">
          <p className="text-sm text-gray-400">Score history chart will appear after more evaluations.</p>
        </div>
      )}

      {/* Domain Strengths */}
      <h2 className="text-lg font-bold text-maka-dark mb-4">Domain strengths</h2>
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-8">
        <div className="space-y-2.5">
          {domainAverages.map((d) => (
            <div key={d.key} className="flex items-center gap-3">
              <span className="w-24 text-xs text-gray-600 flex items-center gap-1.5">
                <span>{d.icon}</span> {d.label}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(d.avg / 10) * 100}%`,
                    backgroundColor: d.color,
                    opacity: 0.7,
                  }}
                />
              </div>
              <span className="text-xs font-bold text-gray-600 w-8 text-right">{d.avg > 0 ? d.avg : '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Approved content */}
      <h2 className="text-lg font-bold text-maka-dark mb-4">Approved content</h2>
      {approvedProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">No approved content yet. Keep creating!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvedProjects.map((project) => {
            const latestEval = project.stages
              .flatMap((s) => s.evaluations)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

            return (
              <div key={project.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="h-20 bg-gradient-to-br from-maka-green/20 to-maka-cyan/20 flex items-center justify-center">
                  <span className="text-2xl">🎬</span>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-maka-dark">{project.title}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">{project.seriesName}</p>
                  <div className="flex items-center justify-between mt-2">
                    {latestEval && (
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${gradeBg[latestEval.overallGrade[0]] || 'bg-gray-100 text-gray-600'}`}>
                        {latestEval.overallGrade}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
