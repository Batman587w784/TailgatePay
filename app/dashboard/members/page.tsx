'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Member = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  distributor_link_token: string | null
  created_at: string
}

export default function MembersPage() {
  const [members, setMembers]     = useState<Member[]>([])
  const [org, setOrg]             = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab]             = useState<'members' | 'distributors'>('members')
  const [saving, setSaving]       = useState(false)
  const [copied, setCopied]       = useState<string | null>(null)

  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole]   = useState('member')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth'; return }
    const { data: orgData } = await supabase.from('orgs').select('*').eq('owner_id', user.id).single()
    if (!orgData) { window.location.href = '/start'; return }
    setOrg(orgData)
    const { data } = await supabase
      .from('org_members')
      .select('*')
      .eq('org_id', orgData.id)
      .order('created_at', { ascending: false })
    setMembers(data || [])
    setLoading(false)
  }

  async function addMember() {
    if (!name || !org) return
    setSaving(true)
    const supabase = createClient()
    const token = role === 'distributor'
      ? Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      : null
    const { error } = await supabase.from('org_members').insert({
      org_id: org.id,
      name,
      email,
      phone,
      role,
      distributor_link_token: token,
    })
    setSaving(false)
    if (error) { alert(error.message); return }
    setShowModal(false)
    setName(''); setEmail(''); setPhone(''); setRole('member')
    loadData()
  }

  async function removeMember(id: string) {
    if (!confirm('Remove this member?')) return
    const supabase = createClient()
    await supabase.from('org_members').delete().eq('id', id)
    loadData()
  }

  function copyDistributorLink(token: string) {
    navigator.clipboard.writeText('https://tailgatepay.com/pay/' + org.slug + '?ref=' + token)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0D1F6E] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2B5CE6] transition-all"
  const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wide"

  const filtered = members.filter(m =>
    tab === 'distributors' ? m.role === 'distributor' : m.role !== 'distributor'
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#2B5CE6] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1F6E]">Members</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your team members and distributors.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#2B5CE6] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Member
        </button>
      </div>

      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('members')}
          className={tab === 'members' ? "px-4 py-1.5 rounded-md text-sm font-semibold bg-white text-[#0D1F6E] shadow-sm" : "px-4 py-1.5 rounded-md text-sm font-medium text-slate-500"}
        >
          Members ({members.filter(m => m.role !== 'distributor').length})
        </button>
        <button
          onClick={() => setTab('distributors')}
          className={tab === 'distributors' ? "px-4 py-1.5 rounded-md text-sm font-semibold bg-white text-[#0D1F6E] shadow-sm" : "px-4 py-1.5 rounded-md text-sm font-medium text-slate-500"}
        >
          Distributors ({members.filter(m => m.role === 'distributor').length})
        </button>
      </div>

      {tab === 'distributors' && (
        <div className="bg-[#EEF3FF] border border-[#C7D7F5] rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-[#0D1F6E] mb-1">What are distributors?</p>
          <p className="text-xs text-slate-500">Distributors get a unique fundraising link they can share. Any donations or payments through their link are tracked back to them. Great for team captains or volunteer fundraisers.</p>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-lg font-bold text-[#0D1F6E] mb-2">
            {tab === 'distributors' ? 'No distributors yet' : 'No members yet'}
          </p>
          <p className="text-sm text-slate-400 mb-6">
            {tab === 'distributors'
              ? 'Add distributors to give them a unique fundraising link.'
              : 'Add your first member to start tracking payments.'}
          </p>
          <button
            onClick={() => { setRole(tab === 'distributors' ? 'distributor' : 'member'); setShowModal(true) }}
            className="bg-[#2B5CE6] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {tab === 'distributors' ? 'Invite a distributor' : 'Add first member'}
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length > 0 && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Phone</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Role</th>
                {tab === 'distributors' && (
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Link</th>
                )}
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(member => (
                <tr key={member.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-semibold text-[#0D1F6E]">{member.name}</td>
                  <td className="px-5 py-3 text-sm text-slate-500">{member.email || '—'}</td>
                  <td className="px-5 py-3 text-sm text-slate-500">{member.phone || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={member.role === 'distributor'
                      ? "text-xs font-semibold px-2 py-0.5 rounded-md bg-[#EEF3FF] text-[#2B5CE6]"
                      : "text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500"
                    }>
                      {member.role}
                    </span>
                  </td>
                  {tab === 'distributors' && (
                    <td className="px-5 py-3">
                      {member.distributor_link_token && (
                        <button
                          onClick={() => copyDistributorLink(member.distributor_link_token!)}
                          className="text-xs font-semibold text-[#2B5CE6] hover:underline"
                        >
                          {copied === member.distributor_link_token ? 'Copied!' : 'Copy link'}
                        </button>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => removeMember(member.id)}
                      className="text-xs text-slate-300 hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0D1F6E]">Add a member</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">x</button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Role</label>
                <div className="flex gap-2">
                  {['member', 'admin', 'distributor'].map(r => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={role === r
                        ? "flex-1 py-2 rounded-lg border text-sm font-semibold bg-blue-50 border-[#2B5CE6] text-[#2B5CE6]"
                        : "flex-1 py-2 rounded-lg border text-sm font-medium bg-slate-50 border-slate-200 text-slate-500"
                      }
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Full name</label>
                <input autoFocus placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Email</label>
                <input type="email" placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Phone</label>
                <input type="tel" placeholder="(555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
              </div>
              {role === 'distributor' && (
                <div className="bg-[#EEF3FF] border border-[#C7D7F5] rounded-lg p-3">
                  <p className="text-xs text-[#0D1F6E] font-semibold mb-1">Distributor link</p>
                  <p className="text-xs text-slate-500">A unique fundraising link will be auto-generated for this person when you save.</p>
                </div>
              )}
              <button
                onClick={addMember}
                disabled={!name || saving}
                className="w-full bg-[#2B5CE6] text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                {saving ? 'Saving...' : 'Add member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
