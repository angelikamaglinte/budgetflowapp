import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PrimaryButton'

export function LandingHeader() {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 bg-surface-secondary/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-base">BudgetFlow</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
            Features
          </a>
          <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
            Login
          </Link>
          <PrimaryButton onClick={() => navigate('/signup')} className="px-4 py-2 rounded-xl text-sm font-medium">
            Get Started Free
          </PrimaryButton>
        </div>
      </div>
    </header>
  )
}
