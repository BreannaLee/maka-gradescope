'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  role: string
  creatorGrade?: string | null
  approvedCount?: number
}

const creatorNav = [
  { href: '/dashboard', label: 'Projects', icon: '📁' },
  { href: '/chatbot', label: 'Chatbot', icon: '💬' },
  { href: '/scorecard', label: 'Score card', icon: '📊' },
  { href: '/learning', label: 'Learning center', icon: '📖' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

const editorialNav = [
  { href: '/editorial', label: 'Review queue', icon: '📋' },
  { href: '/editorial/analytics', label: 'Analytics', icon: '📈' },
  { href: '/editorial/creators', label: 'Creators', icon: '👥' },
]

export default function Sidebar({ role, creatorGrade, approvedCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const isEditorial = role === 'editorial_t1' || role === 'editorial_t2'
  const nav = isEditorial && pathname.startsWith('/editorial') ? editorialNav : creatorNav

  return (
    <aside className="w-52 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
          {isEditorial && pathname.startsWith('/editorial') ? 'Editorial tools' : 'Creator studio'}
        </p>
        <nav className="space-y-1">
          {nav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-maka-purple/10 text-maka-purple font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Creator grade badge at bottom */}
      {role === 'creator' && creatorGrade && (
        <div className="mt-auto p-4">
          <div className="bg-gradient-to-br from-maka-purple/5 to-maka-pink/5 rounded-xl p-4 border border-maka-purple/10">
            <div className="text-3xl font-bold text-maka-purple text-center mb-1">
              {creatorGrade}
            </div>
            <p className="text-[11px] text-gray-500 text-center">
              {approvedCount} approved &middot; Creator
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
