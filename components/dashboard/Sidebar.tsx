'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  DollarSign,
  Users,
  Heart,
  ShoppingBag,
  Building2,
  CreditCard,
  Settings,
  LogOut,
  MoreHorizontal
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',   href: '/dashboard',             icon: LayoutDashboard },
  { label: 'Pools',       href: '/dashboard/pools',       icon: DollarSign },
  { label: 'Members',     href: '/dashboard/members',     icon: Users },
  { label: 'Fundraising', href: '/dashboard/fundraising', icon: Heart },
  { label: 'Spirit Shop', href: '/dashboard/shop',        icon: ShoppingBag },
  { label: 'Sponsors',    href: '/dashboard/sponsors',    icon: Building2 },
  { label: 'Cards',       href: '/dashboard/cards',       icon: CreditCard },
]

const mobileNav = [
  { label: 'Home',        href: '/dashboard',             icon: LayoutDashboard },
  { label: 'Pools',       href: '/dashboard/pools',       icon: DollarSign },
  { label: 'Fundraising', href: '/dashboard/fundraising', icon: Heart },
  { label: 'Members',     href: '/dashboard/members',     icon: Users },
  { label: 'More',        href: '/dashboard/settings',    icon: MoreHorizontal },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-52 min-h-screen bg-white border-r border-slate-200 flex-col">
        <div className="px-4 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#0D1F6E] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="font-bold text-[#0D1F6E] text-sm">Tailgate Pay</span>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
          {navItems.map(item => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active
                  ? "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold bg-[#EEF1FC] text-[#0D1F6E] transition-all"
                  : "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-50 hover:text-[#0D1F6E] transition-all"
                }
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-2 py-3 border-t border-slate-200 flex flex-col gap-0.5">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-50 hover:text-[#0D1F6E] transition-all"
          >
            <Settings size={15} strokeWidth={1.8} />
            Settings
          </Link>
          <button
            onClick={async () => {
              const { createClient } = await import('@/lib/supabase/client')
              await createClient().auth.signOut()
              window.location.href = '/auth'
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-50 hover:text-[#0D1F6E] transition-all w-full text-left"
          >
            <LogOut size={15} strokeWidth={1.8} />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileNav.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                <Icon
                  size={20}
                  className={active ? "text-[#2B5CE6]" : "text-slate-400"}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <span className={active
                  ? "text-xs font-bold text-[#0D1F6E]"
                  : "text-xs font-medium text-slate-400"
                }>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}