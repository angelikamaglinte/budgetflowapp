import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  Receipt,
  TrendingUp,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/expenses', label: 'Expenses', icon: CreditCard },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/receipts', label: 'Receipts', icon: Receipt },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    void navigate('/login')
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col h-screen" style={{ background: '#0f1729' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-base">BudgetFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Menu
        </p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0',
                    isActive ? 'text-white' : 'text-slate-500'
                  )}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Sign out */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.2)' }}>
            <span className="text-xs font-semibold text-blue-400">
              {user?.email?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <p className="text-xs truncate flex-1 min-w-0" style={{ color: 'rgba(255,255,255,0.5)' }}>{user?.email}</p>
        </div>
        <button
          onClick={() => void handleSignOut()}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
