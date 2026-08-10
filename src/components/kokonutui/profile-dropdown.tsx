import * as React from "react"
import { User, Settings, CreditCard, FileText, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface MenuLink {
  label: string
  icon: React.ReactNode
}

// Not wired to real pages yet — BudgetFlow doesn't have these yet.
// Present for visual completeness; clicking just closes the menu.
const PLACEHOLDER_ITEMS: MenuLink[] = [
  { label: "Profile", icon: <User className="h-4 w-4" /> },
  { label: "Settings", icon: <Settings className="h-4 w-4" /> },
  { label: "Subscriptions", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Terms & Policies", icon: <FileText className="h-4 w-4" /> },
]

interface ProfileDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  email: string
  onSignOut: () => void
  /** Compact trigger (avatar only, no name/email) — used in the top-right header */
  compact?: boolean
}

export default function ProfileDropdown({
  name,
  email,
  onSignOut,
  compact = false,
  className,
  ...props
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const initial = name?.charAt(0).toUpperCase() ?? "U"

  return (
    <div className={cn("relative", className)} {...props}>
      <DropdownMenu onOpenChange={setIsOpen}>
        <div className="group relative">
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-gray-100 bg-white transition-all duration-200 hover:border-gray-200 hover:bg-gray-50/80 hover:shadow-sm focus:outline-none",
                  compact ? "p-1" : "p-3 w-full"
                )}
              />
            }
          >
            {!compact && (
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium text-sm text-gray-900 leading-tight tracking-tight truncate">
                  {name}
                </div>
                <div className="text-xs text-gray-400 leading-tight truncate">{email}</div>
              </div>
            )}
            <div className="h-9 w-9 shrink-0 rounded-full bg-primary-50 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-600">{initial}</span>
            </div>
          </DropdownMenuTrigger>

          {/* Bending line indicator on the right */}
          <div
            className={cn(
              "absolute top-1/2 -right-3 -translate-y-1/2 transition-all duration-200 pointer-events-none",
              isOpen ? "opacity-100" : "opacity-60 group-hover:opacity-100"
            )}
          >
            <svg
              aria-hidden="true"
              className={cn(
                "transition-all duration-200",
                isOpen ? "scale-110 text-primary-600" : "text-gray-300 group-hover:text-gray-500"
              )}
              fill="none"
              height="24"
              viewBox="0 0 12 24"
              width="12"
            >
              <path
                d="M2 4C6 8 6 16 2 20"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>

        <DropdownMenuContent
          align={compact ? "end" : "start"}
          className="w-64 origin-top-right rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-xl backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          sideOffset={8}
        >
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-400 truncate">{email}</p>
          </div>
          <DropdownMenuSeparator className="my-1 bg-gray-100" />

          <div className="space-y-1">
            {PLACEHOLDER_ITEMS.map((item) => (
              <DropdownMenuItem
                key={item.label}
                render={
                  <button
                    type="button"
                    className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-gray-100 hover:bg-gray-50"
                  />
                }
              >
                <span className="text-gray-400 group-hover:text-gray-600">{item.icon}</span>
                <span className="font-medium text-sm text-gray-700 group-hover:text-gray-900">
                  {item.label}
                </span>
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator className="my-1 bg-gray-100" />

          <DropdownMenuItem
            render={
              <button
                type="button"
                onClick={onSignOut}
                className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-red-500/10 p-3 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/20"
              />
            }
          >
            <LogOut className="h-4 w-4 text-red-500 group-hover:text-red-600" />
            <span className="font-medium text-red-500 text-sm group-hover:text-red-600">
              Sign out
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
