import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  Landmark,
  Target,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn, getDisplayName, getAvatarUrl } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import ProfileDropdown from '@/components/kokonutui/profile-dropdown'

interface LeafItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

interface GroupItem {
  label: string
  icon: typeof LayoutDashboard
  children: { to: string; label: string }[]
}

const navItems: (LeafItem | GroupItem)[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/expenses', label: 'Expenses', icon: CreditCard },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/calculator', label: 'Calculator', icon: Calculator },
  { to: '/tax', label: 'Tax', icon: Landmark },
  { to: '/budgets', label: 'Budgets', icon: Target },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  {
    label: 'Tools',
    icon: Wrench,
    children: [
      { to: '/tools/scheduler', label: 'Scheduler' },
      { to: '/tools/invoice-builder', label: 'Invoice Builder' },
      { to: '/tools/recurring-expenses', label: 'Recurring Expenses' },
      { to: '/tools/recurring-invoices', label: 'Recurring Invoices' },
      { to: '/tools/tasks', label: 'Task Management' },
    ],
  },
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
  const location = useLocation()
  const [manuallyOpenGroup, setManuallyOpenGroup] = useState<string | null>(null)

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
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Menu
          </p>
          {navItems.map((item) => {
            if ("children" in item) {
              const onGroupRoute = item.children.some((c) => location.pathname.startsWith(c.to))
              const isExpanded = manuallyOpenGroup === item.label || onGroupRoute
              const Icon = item.icon
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => setManuallyOpenGroup(isExpanded ? null : item.label)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                      onGroupRoute
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', onGroupRoute ? 'text-white' : 'text-gray-400')} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight
                      className={cn(
                        'w-3.5 h-3.5 shrink-0 transition-transform',
                        isExpanded && 'rotate-90',
                        onGroupRoute ? 'text-white' : 'text-gray-400'
                      )}
                    />
                  </button>
                  {isExpanded && (
                    <div className="mt-0.5 ml-4 pl-3 border-l border-gray-100 flex flex-col gap-0.5">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                              isActive
                                ? 'text-primary-700 bg-primary-50'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            )
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            const { to, label, icon: Icon } = item
            return (
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
            )
          })}
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
