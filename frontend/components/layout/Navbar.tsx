'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { Brand } from '@/components/layout/Brand'

const navItems = [
  { href: '/', label: 'Landing' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/review', label: 'Case Decision Mode' },
  { href: '/report', label: 'Latest Report' },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="top-0 z-50 border-b border-[var(--border)] bg-[var(--card)]/70 backdrop-blur-xl">
      <div className="responsive-container flex h-16 items-center justify-between py-0 sm:h-20">
        <Link href="/" className="text-base font-semibold text-[var(--foreground)] tracking-tight">
          <Brand compact />
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'text-sm font-medium transition-colors',
                pathname === href
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-xl">
          <div className="responsive-container py-2 space-y-1 text-center">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block text-sm font-medium py-1 transition-colors',
                  pathname === href
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
