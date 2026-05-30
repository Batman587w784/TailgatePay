'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Share2, Copy, Check, MessageCircle, DollarSign, Heart, ShoppingBag } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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
  donations_enabled: boolean
  shop_enabled: boolean
  cards_enabled: boolean
}

function CheckoutForm({ amount, onSuccess }: { amount: number, onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!stripe || !elements) return
    setLoading(true)
    setError('')
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })
    setLoading(false)
    if (error) { setError(error.message || 'Payment failed'); return }
    onSuccess()
  }

  return (
    <div className="flex flex-col gap-4">
      <PaymentElement />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={!stripe || loading}
        className="w-full bg-[#0D1F6E] text-white text-sm font-semibold rounded-lg py-3 hover:bg-blue-900 transition-colors disabled:opacity-40"
      >
        {loading ? 'Processing...' : 'Pay $' + amount.toFixed(2)}
      </button>
    </div>
  )
}

function ShareSheet({ orgName, slug, onClose }: { orgName: string, slug: string, onClose: () => void }) {
  const url = 'https://tailgatepay.com/pay/' + slug
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-5" onClick={e => e.stopPropagation()}>
        <p className="text-sm font-bold text-[#0D1F6E] mb-1">Share {orgName}</p>
        <p className="text-xs text-slate-400 mb-4">Help spread the word and grow your support.</p>
        <div className="flex flex-col gap-3">
          <a
            href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 bg-[#1877F2] text-white text-sm font-semibold px-4 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">f</span>
            Post to Facebook
          </a>
          <a
            href={'https://wa.me/?text=' + encodeURIComponent('Support ' + orgName + ' on Tailgate Pay! ' + url)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 bg-[#25D366] text-white text-sm font-semibold px-4 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            <MessageCircle size={16} />
            Share on WhatsApp
          </a>
          <button
            onClick={copyLink}
            className="flex items-center gap-3 bg-slate-100 text-[#0D1F6E] text-sm font-semibold px-4 py-3 rounded-xl hover:bg-slate-200 transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Link copied!' : 'Copy link'}
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-3 text-sm text-slate-400 py-2">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function PayPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const focusPool = searchParams.get('pool')

  const [org, setOrg] = useState<Org | null>(null)
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<'support' | 'pools' | 'shop'>('pools')
  const [showShareSheet, setShowShareSheet] = useState(false)

  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [payerName, setPayerName] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [payerPhone, setPayerPhone] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form')
  const [creatingIntent, setCreatingIntent] = useState(false)
  const [copiedPool, setCopiedPool] = useState<string | null>(null)

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

    if (focusPool && poolData) {
      const pool = poolData.find((p: Pool) => p.id === focusPool)
      if (pool) { setSelectedPool(pool); setActiveTab('pools') }
    }
  }

  async function startPayment(pool: Pool) {
    if (!payerName || !payerEmail) return
    setCreatingIntent(true)
    const res = await fetch('/api/stripe/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pool_id: pool.id,
        amount: pool.target_amount,
        name: payerName,
        email: payerEmail,
        phone: payerPhone,
        org_slug: slug,
      }),
    })
    const { client_secret, error } = await res.json()
    setCreatingIntent(false)
    if (error) { alert(error); return }
    setClientSecret(client_secret)
    setStep('payment')
  }

  function handleMainShare() {
    const url = 'https://tailgatepay.com/pay/' + slug
    const text = 'Support ' + org?.name + ' on Tailgate Pay!'
    if (navigator.share) {
      navigator.share({ title: org?.name, text, url })
    } else {
      setShowShareSheet(true)
    }
  }

  function copyPoolLink(poolId: string) {
    navigator.clipboard.writeText('https://tailgatepay.com/pay/' + slug + '?pool=' + poolId)
    setCopiedPool(poolId)
    setTimeout(() => setCopiedPool(null), 2000)
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-[#0D1F6E] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2B5CE6] transition-all"

  const tabs = [
    { key: 'support', label: 'Support',    icon: Heart },
    { key: 'pools',   label: 'PayPools',   icon: DollarSign },
    { key: 'shop',    label: 'Shop & More', icon: ShoppingBag },
  ]

  if (loading) return (
    <div className="min-h-screen bg-[#F0F2F7] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#2B5CE6] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-[#F0F2F7] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-sm">
        <p className="text-lg font-bold text-[#0D1F6E] mb-2">Page not found</p>
        <p className="text-sm text-slate-400">This organization page does not exist or is no longer active.</p>
      </div>
    </div>
  )

  if (!org) return null

  const goalPct = org.fundraising_goal_amount
    ? Math.min(100, Math.round((org.fundraising_raised / org.fundraising_goal_amount) * 100))
    : 0

  return (
    <div className="min-h-screen bg-[#F0F2F7] pb-20 md:pb-6">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-[#0D1F6E] rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0D1F6E] truncate">{org.name}</p>
              <p className="text-xs text-slate-400">{org.city}, {org.state}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent('https://tailgatepay.com/pay/' + slug)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#1877F2] px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              <span className="font-bold text-base leading-none">f</span>
              <span className="hidden sm:inline">Share on Facebook</span>
              <span className="sm:hidden">Share</span>
            </a>
            <button
              onClick={handleMainShare}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#2B5CE6] bg-[#EEF3FF] px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Fundraising goal banner */}
      {org.fundraising_enabled && org.fundraising_goal_amount && (
        <div className="bg-[#0D1F6E] px-4 py-4">
          <div className="max-w-lg mx-auto">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-blue-200 font-medium">{org.fundraising_description || org.name + ' fundraiser'}</span>
              <span className="text-white font-bold">${(org.fundraising_raised || 0).toLocaleString()} of ${org.fundraising_goal_amount.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-blue-900 rounded-full overflow-hidden">
              <div className="h-full bg-[#2B5CE6] rounded-full transition-all" style={{ width: goalPct + '%' }} />
            </div>
            <p className="text-xs text-blue-300 mt-1">{goalPct}% of goal reached</p>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-5">

        {/* Desktop tab navigation */}
        <div className="hidden md:flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-5">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={activeTab === tab.key
                  ? "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold bg-[#0D1F6E] text-white transition-all"
                  : "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-600 transition-all"
                }
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* PayPools tab */}
        {activeTab === 'pools' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Active PayPools</p>
            {pools.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <p className="text-sm font-bold text-[#0D1F6E] mb-1">No active PayPools</p>
                <p className="text-xs text-slate-400">Check back soon for payment collections.</p>
              </div>
            )}
            {pools.map(pool => {
              const isSelected = selectedPool?.id === pool.id
              const pct = pool.target_amount
                ? Math.min(100, Math.round((pool.collected_amount / pool.target_amount) * 100))
                : null

              return (
                <div key={pool.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#0D1F6E]">{pool.name}</p>
                        {pool.description && <p className="text-xs text-slate-400 mt-0.5">{pool.description}</p>}
                        {pool.due_date && (
                          <p className="text-xs text-slate-400 mt-1">
                            Due <span className="font-semibold text-[#0D1F6E]">{new Date(pool.due_date).toLocaleDateString()}</span>
                          </p>
                        )}
                      </div>
                      {pool.target_amount && (
                        <p className="text-base font-bold text-[#0D1F6E] ml-3 shrink-0">${pool.target_amount.toFixed(2)}</p>
                      )}
                    </div>

                    {pct !== null && (
                      <div className="mb-3">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2B5CE6] rounded-full" style={{ width: pct + '%' }} />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{pct}% collected</p>
                      </div>
                    )}

                    {!isSelected && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedPool(pool); setStep('form'); setPayerName(''); setPayerEmail(''); setPayerPhone('') }}
                          className="flex-1 bg-[#2B5CE6] text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-blue-700 transition-colors"
                        >
                          Pay now
                        </button>
                        <button
                          onClick={() => copyPoolLink(pool.id)}
                          className="flex items-center gap-1.5 bg-[#EEF3FF] text-[#2B5CE6] text-xs font-semibold px-3 py-2.5 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          {copiedPool === pool.id ? <Check size={12} /> : <Copy size={12} />}
                          {copiedPool === pool.id ? 'Copied!' : 'Copy link'}
                        </button>
                      </div>
                    )}
                  </div>

                  {isSelected && step === 'form' && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col gap-3">
                      <p className="text-xs font-semibold text-[#0D1F6E] uppercase tracking-wide">Your details</p>
                      <input placeholder="Full name" value={payerName} onChange={e => setPayerName(e.target.value)} className={inputClass} />
                      <input type="email" placeholder="Email address" value={payerEmail} onChange={e => setPayerEmail(e.target.value)} className={inputClass} />
                      <input type="tel" placeholder="Phone (optional)" value={payerPhone} onChange={e => setPayerPhone(e.target.value)} className={inputClass} />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedPool(null)}
                          className="flex-1 bg-slate-100 text-slate-600 text-sm font-semibold rounded-lg py-2.5 hover:bg-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => startPayment(pool)}
                          disabled={!payerName || !payerEmail || creatingIntent}
                          className="flex-1 bg-[#0D1F6E] text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-blue-900 transition-colors disabled:opacity-40"
                        >
                          {creatingIntent ? 'Loading...' : 'Continue to payment'}
                        </button>
                      </div>
                    </div>
                  )}

                  {isSelected && step === 'payment' && clientSecret && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50">
                      <p className="text-xs font-semibold text-[#0D1F6E] uppercase tracking-wide mb-3">Payment details</p>
                      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                        <CheckoutForm
                          amount={pool.target_amount}
                          onSuccess={() => setStep('success')}
                        />
                      </Elements>
                    </div>
                  )}

                  {isSelected && step === 'success' && (
                    <div className="border-t border-slate-100 p-4 bg-[#D1FAE5]">
                      <p className="text-sm font-bold text-[#059669]">Payment successful!</p>
                      <p className="text-xs text-[#059669] mt-0.5">Thanks {payerName} — your payment has been received.</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Support tab */}
        {activeTab === 'support' && (
          <div className="flex flex-col gap-3">
            {org.donations_enabled ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-sm font-bold text-[#0D1F6E] mb-1">Make a donation</p>
                <p className="text-xs text-slate-400 mb-4">{org.fundraising_description || 'Help us reach our goal. Every dollar counts.'}</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[10, 25, 50].map(amt => (
                    <button key={amt} className="border border-slate-200 rounded-lg py-2 text-sm font-semibold text-[#0D1F6E] hover:border-[#2B5CE6] hover:bg-blue-50 transition-colors">
                      ${amt}
                    </button>
                  ))}
                </div>
                <button className="w-full bg-[#2B5CE6] text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-blue-700 transition-colors">
                  Donate now
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <p className="text-sm font-bold text-[#0D1F6E] mb-1">Donations coming soon</p>
                <p className="text-xs text-slate-400">This organization has not set up donations yet.</p>
              </div>
            )}
            {org.shop_enabled && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-sm font-bold text-[#0D1F6E] mb-1">Buy team gear</p>
                <p className="text-xs text-slate-400 mb-3">Support {org.name} with official merchandise.</p>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="w-full bg-slate-100 text-[#0D1F6E] text-sm font-semibold rounded-lg py-2.5 hover:bg-slate-200 transition-colors"
                >
                  Browse spirit shop
                </button>
              </div>
            )}
          </div>
        )}

        {/* Shop & More tab */}
        {activeTab === 'shop' && (
          <div className="flex flex-col gap-3">
            {org.shop_enabled ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-sm font-bold text-[#0D1F6E] mb-1">Spirit Shop</p>
                <p className="text-xs text-slate-400 mb-4">Get your official {org.name} gear.</p>
                <button className="w-full bg-[#2B5CE6] text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-blue-700 transition-colors">
                  Browse the shop
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <p className="text-sm font-bold text-[#0D1F6E] mb-1">Shop coming soon</p>
                <p className="text-xs text-slate-400">This organization has not set up their shop yet.</p>
              </div>
            )}
            {org.cards_enabled && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-sm font-bold text-[#0D1F6E] mb-1">Discount Cards</p>
                <p className="text-xs text-slate-400 mb-3">Support {org.name} and save at local businesses.</p>
                <button className="w-full bg-[#0D1F6E] text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-blue-900 transition-colors">
                  Get a discount card
                </button>
              </div>
            )}
          </div>
        )}

        <div className="text-center pt-6">
          <p className="text-xs text-slate-300">Powered by <span className="font-semibold text-slate-400">Tailgate Pay</span></p>
        </div>
      </div>

      {/* Mobile only bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto px-4 py-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className="flex flex-col items-center gap-0.5 px-3 py-1"
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
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Share sheet */}
      {showShareSheet && (
        <ShareSheet
          orgName={org.name}
          slug={slug}
          onClose={() => setShowShareSheet(false)}
        />
      )}
    </div>
  )
}