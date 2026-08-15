import { useNavigate } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  FolderOpen,
  Users,
  TrendingUp,
  NotebookText,
  BarChart3,
  Calculator,
  CalendarDays,
  Wrench,
  X,
} from 'lucide-react'
import { cn, getDisplayName, getAvatarUrl } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import ProfileDropdown from '@/components/kokonutui/profile-dropdown'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/expenses', label: 'Expenses', icon: CreditCard },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/calculator', label: 'Calculator', icon: Calculator },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/tools', label: 'Tools', icon: Wrench },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/files', label: 'Files', icon: FolderOpen },
  { to: '/notes', label: 'Notes', icon: NotebookText },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    void navigate('/login')
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'w-60 shrink-0 flex flex-col bg-white border-r border-gray-100 h-screen',
          'fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base">BudgetFlow</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Menu
          </p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0',
                      isActive ? 'text-white' : 'text-gray-400'
                    )}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Profile / sign out */}
        <div className="px-3 py-4 border-t border-gray-100">
          <ProfileDropdown
            name={getDisplayName(user)}
            email={user?.email ?? ''}
            avatarUrl={getAvatarUrl(user)}
            onSignOut={() => void handleSignOut()}
          />
        </div>
      </aside>
    </>
  )
}
