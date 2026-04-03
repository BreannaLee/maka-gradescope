'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Article {
  id: string
  title: string
  content: string
  contentType: string
  domains: string
  thumbnailUrl: string | null
  createdAt: string
}

interface DomainInfo {
  key: string
  label: string
  icon: string
}

const typeStyles: Record<string, { bg: string; label: string }> = {
  video: { bg: 'bg-maka-cyan/20 text-cyan-700', label: 'Video' },
  example: { bg: 'bg-maka-yellow/20 text-yellow-700', label: 'Gold Standard' },
  article: { bg: 'bg-gray-100 text-gray-500', label: 'Article' },
}

const typeEmojis: Record<string, string> = {
  video: '🎬',
  example: '⭐',
  article: '📄',
}

export default function LearningCenter({
  articles,
  domains,
}: {
  articles: Article[]
  domains: DomainInfo[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeDomain, setActiveDomain] = useState<string | null>(null)

  const filtered = articles.filter((a) => {
    const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
    const articleDomains: string[] = JSON.parse(a.domains || '[]')
    const matchesDomain = !activeDomain || articleDomains.includes(activeDomain)
    return matchesSearch && matchesDomain
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-maka-dark">Learning center</h1>
        <p className="text-sm text-gray-500 mt-1">
          Resources to help you create developmentally strong content
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maka-purple/30 focus:border-maka-purple"
        />
      </div>

      {/* Domain filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveDomain(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !activeDomain ? 'bg-maka-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {domains.map((d) => (
          <button
            key={d.key}
            onClick={() => setActiveDomain(activeDomain === d.key ? null : d.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeDomain === d.key ? 'bg-maka-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {d.icon} {d.label}
          </button>
        ))}
      </div>

      {/* Article cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((article) => {
          const articleDomains: string[] = JSON.parse(article.domains || '[]')
          const style = typeStyles[article.contentType] || typeStyles.article

          return (
            <button
              key={article.id}
              onClick={() => router.push(`/learning/${article.id}`)}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all text-left group"
            >
              <div className="h-32 bg-gradient-to-br from-maka-purple/10 to-maka-pink/10 flex items-center justify-center">
                <span className="text-4xl opacity-30 group-hover:opacity-50 transition-opacity">
                  {typeEmojis[article.contentType] || '📄'}
                </span>
              </div>
              <div className="p-4">
                <div className="flex gap-1 mb-2">
                  {articleDomains.slice(0, 3).map((d) => {
                    const domainInfo = domains.find((dom) => dom.key === d)
                    return (
                      <span key={d} className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-500">
                        {domainInfo?.icon} {domainInfo?.label}
                      </span>
                    )
                  })}
                </div>
                <h3 className="text-sm font-semibold text-maka-dark group-hover:text-maka-purple transition-colors">
                  {article.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {article.content.slice(0, 120)}...
                </p>
                <div className="mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${style.bg}`}>
                    {style.label}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">No articles found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
