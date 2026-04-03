'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

interface TopBarProps {
  user: {
    name: string
    role: string
    creatorGrade?: string | null
  }
  notificationCount?: number
}

export default function TopBar({ user, notificationCount = 0 }: TopBarProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(notificationCount)
  const notifRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadNotifications() {
    const res = await fetch('/api/notifications')
    if (res.ok) {
      const data = await res.json()
      setNotifications(data.notifications)
    }
  }

  async function handleOpenNotifs() {
    setShowNotifs(!showNotifs)
    setShowMenu(false)
    if (!showNotifs) {
      await loadNotifications()
    }
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'all' }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  async function handleNotifClick(notif: Notification) {
    if (!notif.read) {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif.id }),
      })
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n))
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    setShowNotifs(false)
    if (notif.link) router.push(notif.link)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const notifIcon: Record<string, string> = {
    eval_complete: '📊',
    review_complete: '✅',
    status_change: '🔄',
    stale_reminder: '⏰',
    account_change: '👤',
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-40">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-maka-purple to-maka-pink flex items-center justify-center">
          <span className="text-white text-sm font-bold">M</span>
        </div>
        <span className="text-sm font-semibold text-maka-dark tracking-tight">Maka Creator Studio</span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-4">
        {/* Role toggle */}
        {(user.role === 'editorial_t1' || user.role === 'editorial_t2') && (
          <div className="flex bg-gray-100 rounded-full p-0.5 text-xs">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-3 py-1 rounded-full transition-colors text-gray-500 hover:text-gray-700"
            >
              Creator
            </button>
            <button
              onClick={() => router.push('/editorial')}
              className="px-3 py-1 rounded-full bg-maka-purple text-white"
            >
              Editorial
            </button>
          </div>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleOpenNotifs}
            className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-maka-dark">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-maka-purple hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">No notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        !notif.read ? 'bg-maka-purple/[0.03]' : ''
                      }`}
                    >
                      <div className="flex gap-2.5">
                        <span className="text-base mt-0.5">{notifIcon[notif.type] || '🔔'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-medium truncate ${!notif.read ? 'text-maka-dark' : 'text-gray-500'}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 bg-maka-purple rounded-full shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-gray-300 mt-1">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setShowMenu(!showMenu); setShowNotifs(false) }}
            className="w-8 h-8 rounded-full bg-maka-purple/10 text-maka-purple text-xs font-semibold flex items-center justify-center hover:bg-maka-purple/20 transition-colors"
          >
            {initials}
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role.replace('_', ' ')}</p>
              </div>
              <button
                onClick={() => { setShowMenu(false); router.push('/profile') }}
                className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
