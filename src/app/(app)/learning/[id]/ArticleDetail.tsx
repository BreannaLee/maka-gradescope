'use client'

import { useRouter } from 'next/navigation'

interface Article {
  id: string
  title: string
  content: string
  contentType: string
  domains: string
  createdAt: string
}

interface DomainInfo {
  key: string
  label: string
  icon: string
  color: string
}

export default function ArticleDetail({
  article,
  domains,
}: {
  article: Article
  domains: DomainInfo[]
}) {
  const router = useRouter()
  const articleDomains: string[] = JSON.parse(article.domains || '[]')

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push('/learning')}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-maka-purple mb-6 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Learning Center
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
            article.contentType === 'video' ? 'bg-maka-cyan/20 text-cyan-700' :
            article.contentType === 'example' ? 'bg-maka-yellow/20 text-yellow-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            {article.contentType === 'video' ? 'Video' : article.contentType === 'example' ? 'Gold Standard' : 'Article'}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-maka-dark">{article.title}</h1>
        <div className="flex gap-2 mt-3">
          {articleDomains.map((d) => {
            const info = domains.find((dom) => dom.key === d)
            return (
              <span
                key={d}
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${info?.color}20`, color: info?.color }}
              >
                {info?.icon} {info?.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-100 p-8">
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
          {article.content.split('\n\n').map((paragraph, i) => {
            if (paragraph.startsWith('## ')) {
              return <h2 key={i} className="text-lg font-bold text-maka-dark mt-6 mb-3">{paragraph.replace('## ', '')}</h2>
            }
            if (paragraph.startsWith('### ')) {
              return <h3 key={i} className="text-base font-semibold text-maka-dark mt-5 mb-2">{paragraph.replace('### ', '')}</h3>
            }
            if (paragraph.startsWith('- ')) {
              const items = paragraph.split('\n').filter((l) => l.startsWith('- '))
              return (
                <ul key={i} className="list-disc list-inside space-y-1 my-3 text-sm">
                  {items.map((item, j) => (
                    <li key={j}>{item.replace('- ', '')}</li>
                  ))}
                </ul>
              )
            }
            if (paragraph.startsWith('> ')) {
              return (
                <blockquote key={i} className="border-l-3 border-maka-purple pl-4 my-4 text-sm italic text-gray-500">
                  {paragraph.replace('> ', '')}
                </blockquote>
              )
            }
            return <p key={i} className="text-sm mb-3">{paragraph}</p>
          })}
        </div>
      </div>
    </div>
  )
}
