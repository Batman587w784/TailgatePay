'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [org, setOrg]           = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [connecting, setConnecting] = useState(false)

  const [name, setName]   = useState('')
  const [city, setCity]   = useState('')
  const [state, setState] = useState('')
  const [slug, setSlug]   = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth'; return }
    const { data } = await supabase.from('orgs').select('*').eq('owner_id', user.id).single()
    if (!data) { window.location.href = '/start'; return }
    setOrg(data)
    setName(data.name || '')
    setCity(data.city || '')
    setState(data.state || '')
    setSlug(data.slug || '')
    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('orgs').update({ name, city, state, slug }).eq('id', org.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setOrg({ ...org, name, city, state, slug })
  }

  async function connectStripe() {
    setConnecting(true)
    const res = await fetch('/api/stripe/connect', { method: 'POST' })
    const { url, error } = await res.json()
    if (error) { alert(error); setConnecting(false); return }
    window.location.href = url
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0D1F6E] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2B5CE6] transition-all"
  const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wide"

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#2B5CE6] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0D1F6E]">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your organization details and integrations.</p>
      </div>

      <div className="flex flex-col gap-5">

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-[#0D1F6E] mb-4">Organization details</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Organization name</label>
              <input value={name} onChange={e => setName(e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>City</label>
                <input value={city} onChange={e => setCity(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>State</label>
                <input value={state} onChange={e => setState(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Public page URL</label>
              <div className="flex items-center gap-0">
                <span className="bg-slate-50 border border-r-0 border-slate-200 rounded-l-lg px-3 py-2 text-sm text-slate-400">tailgatepay.com/pay/</span>
                <input
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 border border-slate-200 rounded-r-lg px-3 py-2 text-sm text-[#0D1F6E] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2B5CE6] transition-all"
                />
              </div>
            </div>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-[#2B5CE6] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 w-fit"
            >
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-[#0D1F6E] mb-1">Stripe Connect</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your bank account to receive payments directly from your pools and donations.
                Powered by Stripe — bank-level security.
              </p>
            </div>
            {org.stripe_account_id && (
              <span className="text-xs font-semibold bg-[#D1FAE5] text-[#059669] px-2 py-1 rounded-md shrink-0">Connected</span>
            )}
          </div>
          {!org.stripe_account_id ? (
            <button
              onClick={connectStripe}
              disabled={connecting}
              className="mt-4 bg-[#0D1F6E] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-navy-600 transition-colors disabled:opacity-40"
            >
              {connecting ? 'Redirecting to Stripe...' : 'Connect bank account'}
            </button>
          ) : (
            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
              <p className="text-xs text-slate-500">Account ID: <span className="font-mono text-[#0D1F6E]">{org.stripe_account_id}</span></p>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-[#0D1F6E] mb-1">Your public page</h2>
          <p className="text-xs text-slate-400 mb-3">Share this link with your members, parents, and supporters.</p>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
            <span className="text-sm font-semibold text-[#0D1F6E] flex-1">tailgatepay.com/pay/{org.slug}</span>
            <button
              onClick={() => navigator.clipboard.writeText('https://tailgatepay.com/pay/' + org.slug)}
              className="text-xs font-semibold bg-[#2B5CE6] text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-[#0D1F6E] mb-1">Danger zone</h2>
          <p className="text-xs text-slate-400 mb-3">These actions cannot be undone.</p>
          <button className="text-xs font-semibold text-red-400 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
            Delete organization
          </button>
        </div>

      </div>
    </div>
  )
}