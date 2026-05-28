'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useSearchParams } from 'next/navigation'

type Pool = {
  id: string
  name: string
  description: string
  target_amount: number
  collected_amount: number
  due_date: string
  type: string
}

type Org = {
  id: string
  name: string
  slug: string
  city: string
  state: string
  sport_type: string
  fundraising_enabled: boolean
  fundraising_goal_amount: number
  fundraising_raised: number
  fundraising_description: string
  fundraising_profile_image: string
  shop_enabled: boolean
  donations_enabled: boolean
  cards_enabled: boolean
}

export default function PayPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const slug         = params.slug as string
  const focusPool    = searchParams.get('pool')

  const [org, setOrg]         = useState<Org | null>(null)
  const [pools, setPools]     = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Contributor form
  const [selectedPool, setSelectedPool] = useState<string | null>(focusPool)
  const [payerName, setPayerName]       = useState('')
  const [payerEmail, setPayerEmail]     = useState('')
  const [payerPhone, setPayerPhone]     = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [submitted, setSubmitted]       = useState(false)

  useEffect(() => { loadPage() }, [slug])

  async function loadPage() {
    const supabase = createClient()
    const { data: orgData } = await supabase
      .from('orgs')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (!orgData) { setNotFound(true); setLoading(false); return }
    setOrg(orgData)

    const { data: poolData } = await supabase
      .from('tailgate_pools')
      .select('*')
      .eq('org_id', orgData.id)
      .eq('is_active', true)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    setPools(poolData || [])
    setLoading(false)
  }

  async function handleSubmit(pool: Pool) {
    if (!payerName || !payerEmail) return
    setSubmitting(true)
    const supabase = createClient()
    const amount = customAmount ? parseFloat(customAmount) : pool.target_amount
    await supabase.from('pool_contributors').insert({
      pool_id: pool.id,
      name: payerName,
      email: payerEmail,
      phone: payerPhone,
      status: 'unpaid',
      amount_due: amount,
      amount_paid: 0,
    })
    setSubmitting(false)
    setSubmitted(true)
    setSelectedPool(null)
    setPayerName(''); setPayerEmail(''); setPayerPhone(''); setCustomAmount('')
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0D1F6E] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2B5CE6] transition-all"
  const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wide"

  if (loading) return (
    <div className="min-h-screen bg-[#F0F2F7] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#2B5CE6] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-[#F0F2F7] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-sm">
        <p className="text-lg font-bold text-[#0D1F6E] mb-2">Page not found</p>
        <p className="text-sm text-slate-400">This organization page doesn't exist or is no longer active.</p>
      </div>
    </div>
  )

  if (!org) return null

  const goalPct = org.fundraising_goal_amount
    ? Math.min(100, Math.round((org.fundraising_raised / org.fundraising_goal_amount) * 100))
    : null

  return (
    <div className="min-h-screen bg-[#F0F2F7]">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0D1F6E] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <div>
              <p className="text-sm font-bold text-[#0D1F6E]">{org.name}</p>
              <p className="text-xs text-slate-400">{org.city}, {org.state}</p>
            </div>
          </div>
          <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2 py-1 rounded-md">{org.sport_type}</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">

        {/* Success message */}
        {submitted && (
          <div className="bg-[#D1FAE5] border border-[#A7F3D0] rounded-xl p-4 text-center">
            <p className="text-sm font-bold text-[#059669]">You're registered!</p>
            <p className="text-xs text-[#059669] mt-1">The org admin will be in touch with payment details.</p>
          </div>
        )}

        {/* Fundraising goal */}
        {org.fundraising_enabled && org.fundraising_goal_amount && (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              {org.fundraising_profile_image && (
                <img src={org.fundraising_profile_image} alt="" className="w-12 h-12 rounded-full object-cover" />
              )}
              <div>
                <p className="text-sm font-bold text-[#0D1F6E]">{org.name} Fundraiser</p>
                {org.fundraising_description && (
                  <p className="text-xs text-slate-400 mt-0.5">{org.fundraising_description}</p>
                )}
              </div>
            </div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Raised so far</span>
              <span className="font-bold text-[#0D1F6E]">${org.fundraising_raised.toLocaleString()} of ${org.fundraising_goal_amount.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#2B5CE6] rounded-full transition-all" style={{ width: `${goalPct}%` }} />
            </div>
            {org.donations_enabled && (
              <button className="w-full mt-3 bg-[#0D1F6E] text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-navy-600 transition-colors">
                Donate to {org.name}
              </button>
            )}
          </div>
        )}

        {/* Pools */}
        {pools.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Payment pools</p>
            <div className="flex flex-col gap-3">
              {pools.map(pool => {
                const pct = pool.target_amount
                  ? Math.min(100, Math.round((pool.collected_amount / pool.target_amount) * 100))
                  : null
                const isSelected = selectedPool === pool.id

                return (
                  <div key={pool.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-[#0D1F6E]">{pool.name}</p>
                          {pool.description && <p className="text-xs text-slate-400 mt-0.5">{pool.description}</p>}
                          {pool.due_date && (
                            <p className="text-xs text-slate-400 mt-1">
                              Due <span className="font-semibold text-[#0D1F6E]">{new Date(pool.due_date).toLocaleDateString()}</span>
                            </p>
                          )}
                        </div>
                        {pool.target_amount && (
                          <p className="text-sm font-bold text-[#0D1F6E] shrink-0 ml-4">${pool.target_amount.toFixed(2)}</p>
                        )}
                      </div>

                      {pct !== null && (
                        <div className="mb-3">
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#2B5CE6] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedPool(isSelected ? null : pool.id)}
                        className="w-full bg-[#2B5CE6] text-white text-sm font-semibold rounded-lg py-2 hover:bg-blue-700 transition-colors"
                      >
                        {isSelected ? 'Cancel' : 'Pay now'}
                      </button>
                    </div>

                    {/* Inline pay form */}
                    {isSelected && (
                      <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label className={labelClass}>Your name *</label>
                          <input placeholder="Full name" value={payerName} onChange={e => setPayerName(e.target.value)} className={inputClass} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className={labelClass}>Email *</label>
                          <input type="email" placeholder="you@example.com" value={payerEmail} onChange={e => setPayerEmail(e.target.value)} className={inputClass} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className={labelClass}>Phone (optional)</label>
                          <input type="tel" placeholder="(555) 000-0000" value={payerPhone} onChange={e => setPayerPhone(e.target.value)} className={inputClass} />
                        </div>
                        {!pool.target_amount && (
                          <div className="flex flex-col gap-1">
                            <label className={labelClass}>Amount ($)</label>
                            <input type="number" placeholder="0.00" value={customAmount} onChange={e => setCustomAmount(e.target.value)} className={inputClass} />
                          </div>
                        )}
                        <button
                          onClick={() => handleSubmit(pool)}
                          disabled={!payerName || !payerEmail || submitting}
                          className="w-full bg-[#0D1F6E] text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-navy-600 transition-colors disabled:opacity-40"
                        >
                          {submitting ? 'Submitting...' : `Submit — $${pool.target_amount?.toFixed(2) || customAmount || '0.00'}`}
                        </button>
                        <p className="text-xs text-slate-400 text-center">Stripe payment will be added soon. Your info is saved.</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {pools.length === 0 && !org.fundraising_enabled && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-sm font-bold text-[#0D1F6E] mb-1">{org.name}</p>
            <p className="text-xs text-slate-400">No active payment pools right now. Check back soon.</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-300">Powered by <span className="font-semibold text-slate-400">Tailgate Pay</span></p>
        </div>

      </div>
    </div>
  )
}