'use client'

import { ToastProvider } from './Toast'
import { ReactNode } from 'react'

export default function AppShell({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
