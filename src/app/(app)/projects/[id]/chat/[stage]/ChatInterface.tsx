'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  role: string
  content: string
  createdAt: string
  rating: string | null
}

interface ChatInterfaceProps {
  projectId: string
  projectTitle: string
  stageType: string
  ageBracket: string
  initialMessages: Message[]
}

const suggestedPrompts: Record<string, string[]> = {
  idea: [
    'Help me brainstorm a concept',
    'Check my score',
    'What age-appropriate themes work well?',
  ],
  script: [
    'Help me write dialogue',
    'Suggest developmental cues',
    'Evaluate my script',
  ],
  video: [
    'Review my evaluation results',
    'How can I improve my Physical score?',
    'Suggest edits for my next version',
  ],
}

export default function ChatInterface({
  projectId,
  projectTitle,
  stageType,
  ageBracket,
  initialMessages,
}: ChatInterfaceProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
      rating: null,
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, stageType, message: text }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
      } else {
        const data = await res.json()
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: data.error || 'Something went wrong. Please try again.',
            createdAt: new Date().toISOString(),
            rating: null,
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Connection error. Please try again.',
          createdAt: new Date().toISOString(),
          rating: null,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleEvaluate() {
    setEvaluating(true)
    await sendMessage(`Please evaluate my ${stageType}. Give me per-domain grades and specific feedback.`)
    setEvaluating(false)
  }

  async function rateMessage(messageId: string, rating: 'up' | 'down') {
    await fetch(`/api/chat/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, rating }),
    })
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, rating } : m))
    )
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-maka-purple to-maka-pink flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-maka-dark">Maka co-pilot</p>
            <p className="text-[11px] text-gray-400">
              {projectTitle} &middot; {stageType.charAt(0).toUpperCase() + stageType.slice(1)} stage
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEvaluate}
            disabled={evaluating || loading}
            className="px-3 py-1.5 border border-maka-purple text-maka-purple rounded-lg text-xs font-medium hover:bg-maka-purple/5 transition-colors disabled:opacity-50"
          >
            {evaluating ? 'Evaluating...' : `Evaluate ${stageType}`}
          </button>
          <span className="px-2 py-1 bg-maka-purple/10 text-maka-purple rounded-full text-[11px] font-medium">
            Ages {ageBracket}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-maka-purple to-maka-pink flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">M</span>
            </div>
            <h2 className="text-lg font-semibold text-maka-dark mb-1">Maka co-pilot</h2>
            <p className="text-sm text-gray-400 max-w-md">
              I&apos;m your creative partner. Let&apos;s develop content that&apos;s both engaging and developmentally strong. What would you like to work on?
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] ${msg.role === 'user' ? '' : 'flex gap-2'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-maka-purple to-maka-pink flex items-center justify-center shrink-0 mt-1">
                  <span className="text-white text-[10px] font-bold">M</span>
                </div>
              )}
              <div>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-maka-purple text-white rounded-br-sm'
                      : 'bg-gray-100 text-maka-dark rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                {/* Rating buttons for assistant messages */}
                {msg.role === 'assistant' && !msg.id.startsWith('error') && (
                  <div className="flex gap-1 mt-1 ml-1">
                    <button
                      onClick={() => rateMessage(msg.id, 'up')}
                      className={`p-1 rounded text-xs transition-colors ${
                        msg.rating === 'up' ? 'text-maka-green' : 'text-gray-300 hover:text-gray-500'
                      }`}
                    >
                      👍
                    </button>
                    <button
                      onClick={() => rateMessage(msg.id, 'down')}
                      className={`p-1 rounded text-xs transition-colors ${
                        msg.rating === 'down' ? 'text-red-400' : 'text-gray-300 hover:text-gray-500'
                      }`}
                    >
                      👎
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-maka-purple to-maka-pink flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-bold">M</span>
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length === 0 || (!loading && messages.length < 6) ? (
        <div className="px-6 pb-2 flex gap-2 flex-wrap">
          {(suggestedPrompts[stageType] || suggestedPrompts.idea).map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-maka-purple hover:text-maka-purple transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}

      {/* Input bar */}
      <div className="border-t border-gray-200 bg-white p-4 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Maka..."
            rows={1}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-maka-purple/30 focus:border-maka-purple resize-none"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-maka-purple text-white rounded-full flex items-center justify-center hover:bg-maka-purple/90 transition-colors disabled:opacity-30 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
