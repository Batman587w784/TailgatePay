'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { label: 'Dashboard',   href: '/dashboard' },
  { label: 'Pools',       href: '/dashboard/pools' },
  { label: 'Members',     href: '/dashboard/members' },
  { label: 'Fundraising', href: '/dashboard/fundraising' },
  { label: 'Spirit Shop', href: '/dashboard/shop' },
  { label: 'Sponsors',    href: '/dashboard/sponsors' },
  { label: 'Cards',       href: '/dashboard/cards' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-52 min-h-screen bg-white border-r border-slate-200 flex flex-col">

      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#0D1F6E] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="font-bold text-[#0D1F6E] text-sm">Tailgate Pay</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-[#EEF1FC] text-[#0D1F6E] font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#0D1F6E]'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-slate-200 flex flex-col gap-0.5">
        <Link
          href="/dashboard/settings"
          className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-[#0D1F6E] transition-all"
        >
          Settings
        </Link>
        <button
          onClick={async () => {
            const { createClient } = await import('@/lib/supabase/client')
            await createClient().auth.signOut()
            window.location.href = '/auth'
          }}
          className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-[#0D1F6E] transition-all w-full text-left"
        >
          Logout
        </button>
      </div>

    </div>
  )
}