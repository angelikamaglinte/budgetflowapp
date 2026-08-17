import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { HeroSection } from '@/components/landing/HeroSection'
import { ProblemSection } from '@/components/landing/ProblemSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { FinalCtaSection } from '@/components/landing/FinalCtaSection'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function Landing() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="bg-surface-secondary min-h-screen">
      <LandingHeader />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <FinalCtaSection />
      <LandingFooter />
    </div>
  )
}
