'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface OnboardingOverlayProps {
  userName: string
  onDismiss: () => void
}

export default function OnboardingOverlay({ userName, onDismiss }: OnboardingOverlayProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const steps = [
    {
      title: `Welcome to Maka Creator Studio, ${userName.split(' ')[0]}!`,
      description: "Let's start your first project together. Maka Creator Studio guides you through three stages — Idea, Script, and Video — with an AI co-pilot that understands children's developmental needs.",
      icon: '👋',
      action: 'Get started',
    },
    {
      title: 'Meet your Maka co-pilot',
      description: "At each stage, you'll work with Maka — an AI creative partner trained on 7 developmental domains. Maka helps brainstorm ideas, co-write scripts, and evaluate your content.",
      icon: '🤖',
      action: 'Next',
    },
    {
      title: 'Your score card',
      description: "Every piece of content is scored across Character, Connection, Play, Thinking, Social, Physical, and Academic domains. Aim for a B or above in each domain before submitting for review.",
      icon: '📊',
      action: 'Create my first project',
    },
  ]

  const currentStep = steps[step]

  function handleAction() {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      onDismiss()
      // Trigger new project modal via URL param
      router.push('/dashboard?newProject=true')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[520px] overflow-hidden shadow-2xl">
        {/* Gradient header */}
        <div className="h-40 bg-gradient-to-br from-maka-purple via-maka-pink to-maka-cyan flex items-center justify-center">
          <span className="text-6xl">{currentStep.icon}</span>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-maka-dark mb-3">{currentStep.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">{currentStep.description}</p>

          {/* Onboarding video placeholder */}
          {step === 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center gap-3">
              <span className="text-2xl">🎬</span>
              <div>
                <p className="text-xs font-medium text-gray-500">Onboarding video</p>
                <p className="text-[11px] text-gray-400">Coming soon — being produced externally</p>
              </div>
            </div>
          )}

          {/* Step indicators */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-1 rounded-full transition-colors ${
                    i <= step ? 'bg-maka-purple' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleAction}
                className="px-5 py-2 bg-maka-purple text-white rounded-lg text-sm font-medium hover:bg-maka-purple/90 transition-colors"
              >
                {currentStep.action}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
