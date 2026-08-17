import { Link } from 'react-router-dom'

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-400">Built for independent contractors, by one.</p>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition">
            Features
          </a>
          <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 transition">
            Pricing
          </a>
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 transition">
            Login
          </Link>
        </div>
      </div>
      <p className="text-center text-xs text-gray-300 mt-6">© {new Date().getFullYear()} BudgetFlow. All rights reserved.</p>
    </footer>
  )
}
