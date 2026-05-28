'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Sponsor = {
  id: string
  business_name: string
  contact_name: string
  email: string
  phone: string
  type: string
  tier: string
  status: string
  annual_amount: number
  renewal_date: string
  notes: string
}

const STATUS_STYLES: Record<string, string> = {
  contacted:  'bg-slate-100 text-slate-500',
  interested: 'bg-[#FEF3C7] text-[#B45309]',
  confirmed:  'bg-[#D1FAE5] text-[#059669]',
  declined:   'bg-[#FEE2E2] text-[#DC2626]',
}

export default function SponsorsPage() {
  const [sponsors, setSponsors]   = useState<Sponsor[]>([])
  const [org, setOrg]             = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)

  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName]   = useState('')
  const [email, setEmail]               = useState('')
  const [phone, setPhone]               = useState('')
  const [type, setType]                 = useState('business')
  const [tier, setTier]                 = useState('bronze')
  const [status, setStatus]             = useState('contacted')
  const [annualAmount, setAnnualAmount] = useState('')
  const [renewalDate, setRenewalDate]   = useState('')
  const [notes, setNotes]               = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth'; return }
    const { data: orgData } = await supabase.from('orgs').select('*').eq('owner_id', user.id).single()
    if (!orgData) { window.location.href = '/start'; return }
    setOrg(orgData)
    const { data } = await supabase
      .from('sponsors')
      .select('*')
      .eq('org_id', orgData.id)
      .order('created_at', { ascending: false })
    setSponsors(data || [])
    setLoading(false)
  }

  async function addSponsor() {
    if (!businessName || !org) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('sponsors').insert({
      org_id: org.id,
      business_name: businessName,
      contact_name: contactName,
      email,
      phone,
      type,
      tier,
      status,
      annual_amount: annualAmount ? parseFloat(annualAmount) : null,
      renewal_date: renewalDate || null,
      notes,
      last_contacted_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) { alert(error.message); return }
    setShowModal(false)
    setBusinessName(''); setContactName(''); setEmail(''); setPhone('')
    setType('business'); setTier('bronze'); setStatus('contacted')
    setAnnualAmount(''); setRenewalDate(''); setNotes('')
    loadData()
  }

  async function updateStatus(id: string, newStatus: string) {
    const supabase = createClient()
    await supabase.from('sponsors').update({ status: newStatus, last_contacted_at: new Date().toISOString() }).eq('id', id)
    loadData()
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0D1F6E] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2B5CE6] transition-all"
  const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wide"

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#2B5CE6] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1F6E]">Sponsors</h1>
          <p className="text-sm text-slate-400 mt-1">Track outreach, manage renewals, and stay on top of your sponsors.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#2B5CE6] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Sponsor
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total sponsors', value: sponsors.length },
          { label: 'Confirmed', value: sponsors.filter(s => s.status === 'confirmed').length },
          { label: 'Interested', value: sponsors.filter(s => s.status === 'interested').length },
          { label: 'Annual value', value: '$' + sponsors.filter(s => s.status === 'confirmed').reduce((sum, s) => sum + (s.annual_amount || 0), 0).toLocaleString() },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-[#0D1F6E]">{stat.value}</p>
          </div>
        ))}
      </div>

      {sponsors.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-lg font-bold text-[#0D1F6E] mb-2">No sponsors yet</p>
          <p className="text-sm text-slate-400 mb-6">Add your first sponsor to start tracking your outreach.</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#2B5CE6] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add first sponsor
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {sponsors.length > 0 && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Business</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Contact</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Tier</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map(sponsor => (
                <tr key={sponsor.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-[#0D1F6E]">{sponsor.business_name}</p>
                    <p className="text-xs text-slate-400">{sponsor.email}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-500">{sponsor.contact_name || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 capitalize">{sponsor.tier}</span>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-[#0D1F6E]">
                    {sponsor.annual_amount ? '$' + sponsor.annual_amount.toLocaleString() : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={sponsor.status}
                      onChange={e => updateStatus(sponsor.id, e.target.value)}
                      className={'text-xs font-semibold px-2 py-1 rounded-md border-0 cursor-pointer ' + (STATUS_STYLES[sponsor.status] || 'bg-slate-100 text-slate-500')}
                    >
                      <option value="contacted">Contacted</option>
                      <option value="interested">Interested</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="declined">Declined</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {sponsor.notes && (
                      <span className="text-xs text-slate-300 italic truncate max-w-32 block">{sponsor.notes}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0D1F6E]">Add a sponsor</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">x</button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                {['business', 'individual'].map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={type === t
                      ? "flex-1 py-2 rounded-lg border text-sm font-semibold bg-blue-50 border-[#2B5CE6] text-[#2B5CE6]"
                      : "flex-1 py-2 rounded-lg border text-sm font-medium bg-slate-50 border-slate-200 text-slate-500"
                    }
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>{type === 'business' ? 'Business name' : 'Full name'}</label>
                <input autoFocus placeholder={type === 'business' ? 'Acme Pizza Co.' : 'John Smith'} value={businessName} onChange={e => setBusinessName(e.target.value)} className={inputClass} />
              </div>
              {type === 'business' && (
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Contact name</label>
                  <input placeholder="Owner or manager name" value={contactName} onChange={e => setContactName(e.target.value)} className={inputClass} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Email</label>
                  <input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Phone</label>
                  <input type="tel" placeholder="(555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Tier</label>
                  <select value={tier} onChange={e => setTier(e.target.value)} className={inputClass}>
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Annual amount ($)</label>
                  <input type="number" placeholder="500" value={annualAmount} onChange={e => setAnnualAmount(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
                    <option value="contacted">Contacted</option>
                    <option value="interested">Interested</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Renewal date</label>
                  <input type="date" value={renewalDate} onChange={e => setRenewalDate(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Notes</label>
                <textarea placeholder="Any notes about this sponsor..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inputClass + ' resize-none'} />
              </div>
              <button
                onClick={addSponsor}
                disabled={!businessName || saving}
                className="w-full bg-[#2B5CE6] text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                {saving ? 'Saving...' : 'Add sponsor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
