'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function DashboardPage() {
  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth'; return }
      const { data } = await supabase
        .from('orgs')
        .select('*')
        .eq('owner_id', user.id)
        .single()
      if (!data) { window.location.href = '/start'; return }
      setOrg(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#2B5CE6] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const modules = [
    {
      title: 'Tailgate Pools',
      description: 'Collect registration fees, trip deposits, and more. No more chasing people on Venmo.',
      href: '/dashboard/pools',
      cta: 'Manage Pools',
      enabled: true,
    },
    {
      title: 'Fundraising',
      description: 'Set a goal, accept donations, and track your progress all in one place.',
      href: '/dashboard/fundraising',
      cta: org?.fundraising_enabled ? 'View Fundraising' : 'Enable Fundraising',
      enabled: org?.fundraising_enabled,
    },
    {
      title: 'Spirit Shop',
      description: 'Sell custom gear with your logo. Automatic fulfillment, zero inventory.',
      href: '/dashboard/shop',
      cta: org?.shop_enabled ? 'View Shop' : 'Set Up Shop',
      enabled: org?.shop_enabled,
    },
    {
      title: 'Discount Cards',
      description: 'Offer supporters a digital discount card. Great for local business sponsorships.',
      href: '/dashboard/cards',
      cta: org?.cards_enabled ? 'View Cards' : 'Set Up Cards',
      enabled: org?.cards_enabled,
    },
    {
      title: 'Sponsors',
      description: 'Track sponsor outreach, manage renewals, and message businesses directly.',
      href: '/dashboard/sponsors',
      cta: 'Manage Sponsors',
      enabled: true,
    },
    {
      title: 'Members',
      description: 'Add members, invite distributors, and track who has paid.',
      href: '/dashboard/members',
      cta: 'Manage Members',
      enabled: true,
    },
  ]

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0D1F6E]">Welcome back</h1>
        <p className="text-sm text-slate-400 mt-1">{org.name} — {org.city}, {org.state}</p>
      </div>

      {/* Public page link */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Your public page</p>
          <p className="text-sm font-semibold text-[#0D1F6E]">tailgatepay.com/pay/{org.slug}</p>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(`https://tailgatepay.com/pay/${org.slug}`)}
          className="bg-[#2B5CE6] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Copy link
        </button>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map(mod => (
          <div
            key={mod.title}
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-[#0D1F6E]">{mod.title}</h3>
                {mod.enabled ? (
                  <span className="text-xs font-semibold bg-[#D1FAE5] text-[#059669] px-2 py-0.5 rounded-md">Active</span>
                ) : (
                  <span className="text-xs font-semibold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md">Not set up</span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{mod.description}</p>
            </div>
            <Link
              href={mod.href}
              className="text-xs font-semibold text-[#2B5CE6] hover:underline"
            >
              {mod.cta} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

