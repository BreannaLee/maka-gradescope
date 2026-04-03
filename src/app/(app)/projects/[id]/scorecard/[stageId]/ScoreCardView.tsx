'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DOMAINS, BENCHMARKS } from '@/lib/scoring'

interface SubIndicator {
  indicatorName: string
  score: number
  maxScore: number
}

interface DomainScoreData {
  domain: string
  score: number
  grade: string
  feedback: string
  benchmark: number
  subIndicators: SubIndicator[]
}

interface EvaluationData {
  id: string
  overallScore: number
  overallGrade: string
  summary: string
  suggestedSteps: string
  domainScores: DomainScoreData[]
  createdAt: string
}

interface ProjectData {
  id: string
  title: string
  ageBracket: string
}

interface StageData {
  id: string
  stageType: string
}

function RadarChart({ domainScores }: { domainScores: DomainScoreData[] }) {
  const size = 300
  const center = size / 2
  const radius = 120
  const domains = DOMAINS.map((d) => d.key)
  const angleStep = (2 * Math.PI) / domains.length

  function getPoint(index: number, value: number) {
    const angle = angleStep * index - Math.PI / 2
    const r = (value / 10) * radius
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }
  }

  // Score polygon
  const scorePoints = domains
    .map((domain, i) => {
      const ds = domainScores.find((d) => d.domain === domain)
      return getPoint(i, ds?.score || 0)
    })
    .map((p) => `${p.x},${p.y}`)
    .join(' ')

  // Benchmark polygon
  const benchmarkPoints = domains
    .map((domain, i) => getPoint(i, BENCHMARKS[domain] || 7))
    .map((p) => `${p.x},${p.y}`)
    .join(' ')

  // Grid circles
  const gridLevels = [2, 4, 6, 8, 10]

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px]">
      {/* Grid */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={domains
            .map((_, i) => {
              const p = getPoint(i, level)
              return `${p.x},${p.y}`
            })
            .join(' ')}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="0.5"
        />
      ))}

      {/* Axis lines */}
      {domains.map((_, i) => {
        const p = getPoint(i, 10)
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="0.5" />
      })}

      {/* Benchmark area */}
      <polygon points={benchmarkPoints} fill="#9ca3af" fillOpacity="0.1" stroke="#9ca3af" strokeWidth="1" strokeDasharray="4 2" />

      {/* Score area */}
      <polygon points={scorePoints} fill="#6E55FF" fillOpacity="0.18" stroke="#6E55FF" strokeWidth="2" />

      {/* Domain dots and labels */}
      {domains.map((domain, i) => {
        const ds = domainScores.find((d) => d.domain === domain)
        const point = getPoint(i, ds?.score || 0)
        const labelPoint = getPoint(i, 11.5)
        const domainInfo = DOMAINS.find((d) => d.key === domain)
        return (
          <g key={domain}>
            <circle cx={point.x} cy={point.y} r="4" fill={domainInfo?.color || '#6E55FF'} />
            <text
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[9px] fill-gray-500 font-medium"
            >
              {domainInfo?.icon} {domainInfo?.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function getStatusInfo(grade: string): { label: string; color: string; bg: string } {
  const score = parseFloat(grade) || 0
  const letter = grade[0]
  if (letter === 'A' || letter === 'B') {
    return { label: 'Ready for review', color: 'text-green-700', bg: 'bg-maka-green/20' }
  }
  if (letter === 'C') {
    return { label: 'Revisions suggested', color: 'text-amber-700', bg: 'bg-amber-100' }
  }
  return { label: 'Needs significant work', color: 'text-red-700', bg: 'bg-red-100' }
}

export default function ScoreCardView({ project, stage, evaluation }: {
  project: ProjectData
  stage: StageData
  evaluation: EvaluationData
}) {
  const router = useRouter()
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())
  const status = getStatusInfo(evaluation.overallGrade)
  const suggestedSteps: string[] = JSON.parse(evaluation.suggestedSteps || '[]')

  function toggleDomain(domain: string) {
    setExpandedDomains((prev) => {
      const next = new Set(prev)
      if (next.has(domain)) next.delete(domain)
      else next.add(domain)
      return next
    })
  }

  return (
    <div className="p-8 max-w-5xl">
      <button
        onClick={() => router.push(`/projects/${project.id}`)}
        className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1"
      >
        &larr; Back to project
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
            Maka Imprint Score Card
          </p>
          <h1 className="text-2xl font-bold text-maka-dark">{project.title}</h1>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600 capitalize">
              {stage.stageType} stage
            </span>
            <span className="px-2 py-0.5 bg-maka-purple/10 text-maka-purple rounded-full text-xs">
              Ages {project.ageBracket}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(evaluation.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-maka-purple">{evaluation.overallScore}</div>
          <div className="text-lg font-bold text-maka-dark">{evaluation.overallGrade}</div>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${status.bg} ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Two column: Radar + Summary */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Radar chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col items-center">
          <RadarChart domainScores={evaluation.domainScores} />
          <div className="flex gap-6 mt-4 text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-maka-purple rounded" />
              Your score
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-gray-400 rounded border-dashed border border-gray-400" />
              Maka benchmark
            </div>
          </div>
        </div>

        {/* Summary + Next Steps */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-maka-dark mb-2">Summary</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{evaluation.summary}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-maka-dark mb-2">Suggested Next Steps</h3>
            <ol className="space-y-2">
              {suggestedSteps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 bg-maka-purple/10 text-maka-purple rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Domain Breakdown */}
      <h2 className="text-lg font-bold text-maka-dark mb-4">Domain breakdown</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {evaluation.domainScores.map((ds) => {
          const domainInfo = DOMAINS.find((d) => d.key === ds.domain)
          const isExpanded = expandedDomains.has(ds.domain)
          const belowThreshold = ds.score < 5.5

          return (
            <div key={ds.domain} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleDomain(ds.domain)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{domainInfo?.icon}</span>
                  <div>
                    <span className="text-sm font-medium text-maka-dark">{domainInfo?.label}</span>
                    {belowThreshold && (
                      <span className="ml-2 text-[10px] text-red-500 font-medium">Below threshold</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      ds.grade.startsWith('A') ? 'bg-maka-green/20 text-green-700' :
                      ds.grade.startsWith('B') ? 'bg-maka-cyan/20 text-cyan-700' :
                      ds.grade.startsWith('C') ? 'bg-maka-yellow/20 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}
                  >
                    {ds.grade}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-50">
                  <p className="text-sm text-gray-500 my-3">{ds.feedback}</p>
                  <div className="space-y-2">
                    {ds.subIndicators.map((si) => (
                      <div key={si.indicatorName} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-36 shrink-0">{si.indicatorName}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(si.score / si.maxScore) * 100}%`,
                              backgroundColor: domainInfo?.color || '#6E55FF',
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">
                          {si.score}/{si.maxScore}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
