'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FundraisingPage() {
  const [org, setOrg]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState<string | null>(null)

  const [goalAmount, setGoalAmount]       = useState('')
  const [description, setDescription]     = useState('')
  const [editingGoal, setEditingGoal]     = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth'; return }
    const { data: orgData } = await supabase.from('orgs').select('*').eq('owner_id', user.id).single()
    if (!orgData) { window.location.href = '/start'; return }
    setOrg(orgData)
    setGoalAmount(orgData.fundraising_goal_amount?.toString() || '')
    setDescription(orgData.fundraising_description || '')
    setLoading(false)
  }

  async function toggleModule(field: string, current: boolean) {
    setSaving(field)
    const supabase = createClient()
    await supabase.from('orgs').update({ [field]: !current }).eq('id', org.id)
    setOrg({ ...org, [field]: !current })
    setSaving(null)
  }

  async function saveGoal() {
    setSaving('goal')
    const supabase = createClient()
    await supabase.from('orgs').update({
      fundraising_goal_amount: goalAmount ? parseFloat(goalAmount) : null,
      fundraising_description: description,
      fundraising_enabled: true,
    }).eq('id', org.id)
    setOrg({ ...org, fundraising_goal_amount: parseFloat(goalAmount), fundraising_description: description, fundraising_enabled: true })
    setSaving(null)
    setEditingGoal(false)
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0D1F6E] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2B5CE6] transition-all"
  const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wide"

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#2B5CE6] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!org) return null

  const goalPct = org.fundraising_goal_amount
    ? Math.min(100, Math.round((org.fundraising_raised / org.fundraising_goal_amount) * 100))
    : 0

  const modules = [
    {
      key: 'donations_enabled',
      title: 'Accept Donations',
      description: 'Add a donation button to your public page. Supporters choose their own amount and leave an optional tip for Tailgate Pay.',
      enabled: org.donations_enabled,
    },
    {
      key: 'shop_enabled',
      title: 'Spirit Shop',
      description: 'Sell custom gear with your logo. We set up the shop for you — zero inventory, automatic fulfillment through Printful.',
      enabled: org.shop_enabled,
    },
    {
      key: 'cards_enabled',
      title: 'Discount Cards',
      description: 'Offer digital discount cards to your supporters. Great for involving local businesses. We will contact you to get this set up.',
      enabled: org.cards_enabled,
    },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0D1F6E]">Fundraising</h1>
        <p className="text-sm text-slate-400 mt-1">Enable modules to add them to your public page.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#0D1F6E]">Fundraising Goal</h2>
            <p className="text-xs text-slate-400 mt-0.5">Your goal shows on every public page and grows as you raise more.</p>
          </div>
          <button
            onClick={() => setEditingGoal(!editingGoal)}
            className="text-xs font-semibold text-[#2B5CE6] hover:underline"
          >
            {editingGoal ? 'Cancel' : org.fundraising_goal_amount ? 'Edit goal' : 'Set goal'}
          </button>
        </div>

        {org.fundraising_goal_amount && !editingGoal && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Progress</span>
              <span className="font-bold text-[#0D1F6E]">${(org.fundraising_raised || 0).toLocaleString()} of ${org.fundraising_goal_amount.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#2B5CE6] rounded-full" style={{ width: goalPct + '%' }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{goalPct}% of goal reached</p>
          </div>
        )}

        {!org.fundraising_goal_amount && !editingGoal && (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-400">No goal set yet. Set a goal to show progress on your public page.</p>
          </div>
        )}

        {editingGoal && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Goal amount ($)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={goalAmount}
                onChange={e => setGoalAmount(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Description (shown on public page)</label>
              <textarea
                placeholder="Tell supporters what you are raising money for..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className={inputClass + ' resize-none'}
              />
            </div>
            <button
              onClick={saveGoal}
              disabled={!goalAmount || saving === 'goal'}
              className="bg-[#2B5CE6] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 w-fit"
            >
              {saving === 'goal' ? 'Saving...' : 'Save goal'}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {modules.map(mod => (
          <div key={mod.key} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-[#0D1F6E]">{mod.title}</h3>
                  <span className={mod.enabled
                    ? "text-xs font-semibold px-2 py-0.5 rounded-md bg-[#D1FAE5] text-[#059669]"
                    : "text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-400"
                  }>
                    {mod.enabled ? 'Active' : 'Not set up'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{mod.description}</p>
              </div>
              <button
                onClick={() => toggleModule(mod.key, mod.enabled)}
                disabled={saving === mod.key}
                className={mod.enabled
                  ? "shrink-0 w-10 h-6 rounded-full transition-colors relative bg-[#2B5CE6]"
                  : "shrink-0 w-10 h-6 rounded-full transition-colors relative bg-slate-200"
                }
              >
                <span className={mod.enabled
                  ? "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all left-5"
                  : "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all left-1"
                } />
              </button>
            </div>
            {mod.key === 'cards_enabled' && mod.enabled && (
              <div className="mt-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg p-3">
                <p className="text-xs text-[#B45309] font-semibold">We will reach out to set this up</p>
                <p className="text-xs text-[#B45309] mt-0.5">Our team will contact you within 24 hours to configure your discount card program.</p>
              </div>
            )}
            {mod.key === 'shop_enabled' && mod.enabled && (
              <div className="mt-3 bg-[#EEF3FF] border border-[#C7D7F5] rounded-lg p-3">
                <p className="text-xs text-[#0D1F6E] font-semibold">Upload your logo to get started</p>
                <p className="text-xs text-slate-500 mt-0.5">Go to Settings to upload your logo and we will generate your first products automatically.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
