import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading BudgetFlow...</p>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useBusinessProfile()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  // Every entry point into the app (login form, an auto-confirmed signup,
  // clicking the email confirmation link) lands here, so this is the one
  // place that reliably catches a user who hasn't finished onboarding yet.
  if (location.pathname !== '/onboarding') {
    if (profileLoading) return <LoadingScreen />
    if (!profile?.onboarding_completed) return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
