'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Card = {
  id: string
  title: string
  description: string
  discount_pct: number
  valid_until: string
  price: number
  is_active: boolean
  area: string
  pricing_model: string
  setup_status: string
}

export default function CardsPage() {
  const [cards, setCards]         = useState<Card[]>([])
  const [org, setOrg]             = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)

  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [discountPct, setDiscountPct]   = useState('')
  const [validUntil, setValidUntil]     = useState('')
  const [price, setPrice]               = useState('')
  const [area, setArea]                 = useState('')
  const [pricingModel, setPricingModel] = useState('upfront')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth'; return }
    const { data: orgData } = await supabase.from('orgs').select('*').eq('owner_id', user.id).single()
    if (!orgData) { window.location.href = '/start'; return }
    setOrg(orgData)
    const { data } = await supabase
      .from('discount_cards')
      .select('*')
      .eq('org_id', orgData.id)
      .order('created_at', { ascending: false })
    setCards(data || [])
    setLoading(false)
  }

  async function createCard() {
    if (!title || !org) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('discount_cards').insert({
      org_id: org.id,
      title,
      description,
      discount_pct: discountPct ? parseFloat(discountPct) : null,
      valid_until: validUntil || null,
      price: price ? parseFloat(price) : null,
      area,
      pricing_model: pricingModel,
      is_active: false,
      setup_status: 'pending_contact',
    })
    setSaving(false)
    if (error) { alert(error.message); return }
    setShowModal(false)
    setTitle(''); setDescription(''); setDiscountPct('')
    setValidUntil(''); setPrice(''); setArea(''); setPricingModel('upfront')
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
          <h1 className="text-2xl font-bold text-[#0D1F6E]">Discount Cards</h1>
          <p className="text-sm text-slate-400 mt-1">Sell digital discount cards to your supporters. We set it up for you.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#2B5CE6] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Card
        </button>
      </div>

      <div className="bg-[#EEF3FF] border border-[#C7D7F5] rounded-xl p-4 mb-5">
        <p className="text-sm font-semibold text-[#0D1F6E] mb-1">How discount cards work</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          You create a card with a discount percentage and price. Supporters buy the card and show it at participating local businesses for the discount. You choose upfront pricing or revenue share. Once you submit a card our team will contact you within 24 hours to get it live.
        </p>
      </div>

      {cards.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-lg font-bold text-[#0D1F6E] mb-2">No discount cards yet</p>
          <p className="text-sm text-slate-400 mb-6">Create your first card to start raising money through local business discounts.</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#2B5CE6] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create first card
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {cards.map(card => (
          <div key={card.id} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-[#0D1F6E]">{card.title}</h3>
                  <span className={card.is_active
                    ? "text-xs font-semibold px-2 py-0.5 rounded-md bg-[#D1FAE5] text-[#059669]"
                    : "text-xs font-semibold px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#B45309]"
                  }>
                    {card.is_active ? 'Active' : 'Pending setup'}
                  </span>
                </div>
                {card.description && <p className="text-xs text-slate-400 mb-2">{card.description}</p>}
                <div className="flex items-center gap-4 flex-wrap">
                  {card.discount_pct && (
                    <span className="text-xs text-slate-500">
                      <span className="font-semibold text-[#0D1F6E]">{card.discount_pct}%</span> discount
                    </span>
                  )}
                  {card.price && (
                    <span className="text-xs text-slate-500">
                      <span className="font-semibold text-[#0D1F6E]">${card.price}</span> per card
                    </span>
                  )}
                  {card.area && (
                    <span className="text-xs text-slate-500">
                      Area: <span className="font-semibold text-[#0D1F6E]">{card.area}</span>
                    </span>
                  )}
                  {card.valid_until && (
                    <span className="text-xs text-slate-500">
                      Valid until <span className="font-semibold text-[#0D1F6E]">{new Date(card.valid_until).toLocaleDateString()}</span>
                    </span>
                  )}
                  <span className="text-xs text-slate-500 capitalize">
                    Pricing: <span className="font-semibold text-[#0D1F6E]">{card.pricing_model}</span>
                  </span>
                </div>
              </div>
            </div>
            {card.setup_status === 'pending_contact' && (
              <div className="mt-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg p-3">
                <p className="text-xs text-[#B45309] font-semibold">Our team will contact you soon to get this card live.</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0D1F6E]">Create a discount card</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">x</button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Card title</label>
                <input autoFocus placeholder="e.g. Westside FC Supporter Card" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Description</label>
                <textarea placeholder="What does this card offer supporters?" value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inputClass + ' resize-none'} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Discount %</label>
                  <input type="number" placeholder="e.g. 10" value={discountPct} onChange={e => setDiscountPct(e.target.value)} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Card price ($)</label>
                  <input type="number" placeholder="e.g. 25" value={price} onChange={e => setPrice(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Valid until</label>
                  <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Area / Region</label>
                  <input placeholder="e.g. Bridgeport, WV" value={area} onChange={e => setArea(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Pricing model</label>
                <div className="flex gap-2">
                  {['upfront', 'revenue_share'].map(m => (
                    <button
                      key={m}
                      onClick={() => setPricingModel(m)}
                      className={pricingModel === m
                        ? "flex-1 py-2 rounded-lg border text-sm font-semibold bg-blue-50 border-[#2B5CE6] text-[#2B5CE6]"
                        : "flex-1 py-2 rounded-lg border text-sm font-medium bg-slate-50 border-slate-200 text-slate-500"
                      }
                    >
                      {m === 'upfront' ? 'Upfront' : 'Revenue share'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {pricingModel === 'upfront'
                    ? 'Businesses pay an upfront fee to be included on the card.'
                    : 'Businesses pay a percentage of sales driven by card holders.'}
                </p>
              </div>
              <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-lg p-3">
                <p className="text-xs text-[#B45309] font-semibold">We will contact you to set this up</p>
                <p className="text-xs text-[#B45309] mt-0.5">After you submit, our team will reach out within 24 hours to get your card configured and live.</p>
              </div>
              <button
                onClick={createCard}
                disabled={!title || saving}
                className="w-full bg-[#2B5CE6] text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                {saving ? 'Submitting...' : 'Submit card request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
