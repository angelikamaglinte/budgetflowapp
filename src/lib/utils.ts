import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse a YYYY-MM-DD date string as local time (not UTC)
// Without this, new Date('2025-09-01') is treated as UTC midnight,
// which shifts to Aug 31 in negative-offset timezones (e.g. Canada)
export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00')
}

// Full name comes from Supabase user_metadata (set at signup). Accounts created
// before the name field existed won't have one, so fall back to a name derived
// from the email's local part (e.g. "marie.angelika" -> "Marie Angelika").
export function getDisplayName(user: { user_metadata?: { full_name?: string }; email?: string } | null): string {
  const fullName = user?.user_metadata?.full_name
  if (fullName) return fullName

  const localPart = user?.email?.split('@')[0] ?? ''
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'User'
}

export function getAvatarUrl(user: { user_metadata?: { avatar_url?: string } } | null): string | undefined {
  return user?.user_metadata?.avatar_url
}
