'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Pool = {
  id: string
  name: string
  description: string
  target_amount: number
  collected_amount: number
  due_date: string
  type: string
  is_public: boolean
  is_active: boolean
}

export default function PoolsPage() {
  const [pools, setPools]         = useState<Pool[]>([])
  const [org, setOrg]             = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [copied, setCopied]       = useState<string | null>(null)

  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount]           = useState('')
  const [dueDate, setDueDate]         = useState('')
  const [type, setType]               = useState('other')
  const [isPublic, setIsPublic]       = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth'; return }
    const { data: orgData } = await supabase.from('orgs').select('*').eq('owner_id', user.id).single()
    if (!orgData) { window.location.href = '/start'; return }
    setOrg(orgData)
    const { data: poolData } = await supabase
      .from('tailgate_pools')
      .select('*')
      .eq('org_id', orgData.id)
      .order('created_at', { ascending: false })
    setPools(poolData || [])
    setLoading(false)
  }

  async function createPool() {
    if (!name || !org) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('tailgate_pools').insert({
      org_id: org.id,
      name,
      description,
      target_amount: amount ? parseFloat(amount) : null,
      due_date: dueDate || null,
      type,
      is_public: isPublic,
      is_active: true,
    })
    setSaving(false)
    if (error) { alert(error.message); return }
    setShowModal(false)
    setName(''); setDescription(''); setAmount('')
    setDueDate(''); setType('other'); setIsPublic(true)
    loadData()
  }

  async function togglePool(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('tailgate_pools').update({ is_active: !current }).eq('id', id)
    loadData()
  }

  function copyLink(slug: string, poolId: string) {
    navigator.clipboard.writeText('https://tailgatepay.com/pay/' + slug + '?pool=' + poolId)
    setCopied(poolId)
    setTimeout(() => setCopied(null), 2000)
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
          <h1 className="text-2xl font-bold text-[#0D1F6E]">Tailgate Pools</h1>
          <p className="text-sm text-slate-400 mt-1">Collect payments for any purpose. Share a link, get paid.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#2B5CE6] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Pool
        </button>
      </div>

      {pools.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-lg font-bold text-[#0D1F6E] mb-2">No pools yet</p>
          <p className="text-sm text-slate-400 mb-6">Create your first pool to start collecting payments.</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#2B5CE6] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create your first pool
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {pools.map(pool => {
          const pct = pool.target_amount
            ? Math.min(100, Math.round((pool.collected_amount / pool.target_amount) * 100))
            : null

          return (
            <div key={pool.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-[#0D1F6E]">{pool.name}</h3>
                    <span className={pool.is_active ? "text-xs font-semibold px-2 py-0.5 rounded-md bg-[#D1FAE5] text-[#059669]" : "text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-400"}>
                      {pool.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                      {pool.is_public ? 'Public' : 'Invite only'}
                    </span>
                  </div>
                  {pool.description && (
                    <p className="text-xs text-slate-400">{pool.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-[#0D1F6E]">${pool.collected_amount.toFixed(2)}</p>
                  {pool.target_amount && (
                    <p className="text-xs text-slate-400">of ${pool.target_amount.toFixed(2)}</p>
                  )}
                </div>
              </div>

              {pct !== null && (
                <div className="mb-3">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2B5CE6] rounded-full transition-all"
                      style={{ width: pct + '%' }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{pct}% collected</p>
                </div>
              )}

              {pool.due_date && (
                <p className="text-xs text-slate-400 mb-3">
                  Due: <span className="font-semibold text-[#0D1F6E]">{new Date(pool.due_date).toLocaleDateString()}</span>
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => copyLink(org.slug, pool.id)}
                  className="text-xs font-semibold bg-[#EEF3FF] text-[#2B5CE6] px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  {copied === pool.id ? 'Copied!' : 'Copy payment link'}
                </button>
                <a
                  href={'/pay/' + org.slug + '?pool=' + pool.id}
                  rel="noreferrer"
                  className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Preview page
                </a>
                <button
                  onClick={() => togglePool(pool.id, pool.is_active)}
                  className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  {pool.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0D1F6E]">Create a new pool</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                x
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Pool name</label>
                <input
                  autoFocus
                  placeholder="e.g. Fall Registration Fees"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Description</label>
                <input
                  placeholder="Optional details for your members"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Amount per person ($)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Due date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className={inputClass}
                >
                  <option value="registration">Registration</option>
                  <option value="tournament">Tournament</option>
                  <option value="travel">Travel</option>
                  <option value="equipment">Equipment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#0D1F6E]">Public pool</p>
                  <p className="text-xs text-slate-400">Anyone with the link can pay.</p>
                </div>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={isPublic ? "w-10 h-6 rounded-full transition-colors relative bg-[#2B5CE6]" : "w-10 h-6 rounded-full transition-colors relative bg-slate-200"}
                >
                  <span className={isPublic ? "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all left-5" : "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all left-1"} />
                </button>
              </div>

              <button
                onClick={createPool}
                disabled={!name || saving}
                className="w-full bg-[#2B5CE6] text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                {saving ? 'Creating...' : 'Create Pool'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
