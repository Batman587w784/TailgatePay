'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Step = 1 | 2 | 3 | 4 | 5

const ORG_TYPES = [
  'Youth Sports Team',
  'School / Booster Club',
  'Sports League',
  'Greek Life / Fraternity or Sorority',
  'Nonprofit',
  'Other',
]

const ORG_SIZES = [
  'Under 50',
  '50 - 100',
  '100 - 250',
  '250 - 1,000',
  '1,000 - 5,000',
  '5,000+',
]

const HEARD_FROM = [
  'Word of mouth',
  'Social media',
  'Google search',
  'A coach or teammate',
  'Cold call / outreach',
  'Other',
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

export default function StartPage() {
  const [step, setStep]           = useState<Step>(1)
  const [orgName, setOrgName]     = useState('')
  const [orgType, setOrgType]     = useState('')
  const [orgSize, setOrgSize]     = useState('')
  const [state, setState]         = useState('')
  const [city, setCity]           = useState('')
  const [heardFrom, setHeardFrom] = useState('')
  const [slug, setSlug]           = useState('')
  const [slugTaken, setSlugTaken] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function checkSlug(value: string) {
    const supabase = createClient()
    const { data } = await supabase.from('orgs').select('id').eq('slug', value).single()
    setSlugTaken(!!data)
  }

  async function handleFinish() {
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError('Not authenticated — please sign in first at /auth'); setLoading(false); return }
    const { error } = await supabase.from('orgs').insert({
      name: orgName,
      slug,
      sport_type: orgType,
      state,
      city,
      owner_id: session.user.id,
      account_type: 'single',
      is_active: true,
      is_searchable: true,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    window.location.href = '/dashboard'
  }

  const progress = (step / 5) * 100

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0D1F6E] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2B5CE6] transition-all"
  const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wide"
  const continueBtn = (disabled: boolean, onClick: () => void) => (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-full bg-[#2B5CE6] text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-blue-700 transition-colors disabled:opacity-40"
    >
      Continue →
    </button>
  )
  const backBtn = (onClick: () => void) => (
    <button onClick={onClick} className="text-xs text-slate-400 hover:text-[#0D1F6E] mb-4 flex items-center gap-1">
      ← Back
    </button>
  )

  return (
    <div className="min-h-screen bg-[#F0F2F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 bg-[#0D1F6E] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-lg font-bold text-[#0D1F6E]">Tailgate Pay</span>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Step {step} of 5</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#2B5CE6] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

          {/* Step 1 — Org name */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-bold text-[#0D1F6E]">What's your org called?</h2>
                <p className="text-sm text-slate-400 mt-1">This is what members will see on your payment page.</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Organization name</label>
                <input
                  autoFocus
                  placeholder="e.g. Westside FC, Central High Boosters"
                  value={orgName}
                  onChange={e => {
                    setOrgName(e.target.value)
                    const s = generateSlug(e.target.value)
                    setSlug(s)
                    if (s) checkSlug(s)
                  }}
                  className={inputClass}
                />
              </div>
              {orgName && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-slate-400">Your public page will be at:</p>
                  <p className="text-sm font-semibold text-[#0D1F6E] mt-0.5">
                    tailgatepay.com/pay/<span className="text-[#2B5CE6]">{slug}</span>
                  </p>
                  {slugTaken && <p className="text-xs text-red-500 mt-1">That URL is taken — edit below</p>}
                </div>
              )}
              {slugTaken && (
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Custom URL</label>
                  <input value={slug} onChange={e => { setSlug(e.target.value); checkSlug(e.target.value) }} className={inputClass} />
                </div>
              )}
              {continueBtn(!orgName || slugTaken, () => setStep(2))}
            </div>
          )}

          {/* Step 2 — Org type */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              {backBtn(() => setStep(1))}
              <div>
                <h2 className="text-xl font-bold text-[#0D1F6E]">What type of org is this?</h2>
                <p className="text-sm text-slate-400 mt-1">Helps us tailor your experience.</p>
              </div>
              <div className="flex flex-col gap-2">
                {ORG_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setOrgType(t)}
                    className={`text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                      orgType === t
                        ? 'bg-blue-50 border-[#2B5CE6] text-[#2B5CE6]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {continueBtn(!orgType, () => setStep(3))}
            </div>
          )}

          {/* Step 3 — Org size */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              {backBtn(() => setStep(2))}
              <div>
                <h2 className="text-xl font-bold text-[#0D1F6E]">How many people are you managing?</h2>
                <p className="text-sm text-slate-400 mt-1">Roughly how many members, players, or supporters per year.</p>
              </div>
              <div className="flex flex-col gap-2">
                {ORG_SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => setOrgSize(s)}
                    className={`text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                      orgSize === s
                        ? 'bg-blue-50 border-[#2B5CE6] text-[#2B5CE6]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {continueBtn(!orgSize, () => setStep(4))}
            </div>
          )}

          {/* Step 4 — Location + heard from */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              {backBtn(() => setStep(3))}
              <div>
                <h2 className="text-xl font-bold text-[#0D1F6E]">A couple last things</h2>
                <p className="text-sm text-slate-400 mt-1">Almost there.</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>State</label>
                <select
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select your state</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>City</label>
                <input
                  placeholder="e.g. Columbus"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>How did you hear about us?</label>
                <div className="flex flex-col gap-2 mt-1">
                  {HEARD_FROM.map(h => (
                    <button
                      key={h}
                      onClick={() => setHeardFrom(h)}
                      className={`text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        heardFrom === h
                          ? 'bg-blue-50 border-[#2B5CE6] text-[#2B5CE6]'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              {continueBtn(!state || !city || !heardFrom, () => setStep(5))}
            </div>
          )}

          {/* Step 5 — Confirm */}
          {step === 5 && (
            <div className="flex flex-col gap-5">
              {backBtn(() => setStep(4))}
              <div>
                <h2 className="text-xl font-bold text-[#0D1F6E]">You're all set. Let's launch.</h2>
                <p className="text-sm text-slate-400 mt-1">Here's a summary before we create your account.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                {[
                  { label: 'Org name',    value: orgName },
                  { label: 'Type',        value: orgType },
                  { label: 'Size',        value: orgSize },
                  { label: 'Location',    value: `${city}, ${state}` },
                  { label: 'Public page', value: `tailgatepay.com/pay/${slug}` },
                  { label: 'Heard from',  value: heardFrom },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center gap-4">
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wide shrink-0">{row.label}</span>
                    <span className="text-sm font-semibold text-[#0D1F6E] text-right">{row.value}</span>
                  </div>
                ))}
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={handleFinish}
                disabled={loading}
                className="w-full bg-[#2B5CE6] text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating your org...' : 'Create my org and go to dashboard'}
              </button>
              <p className="text-xs text-slate-400 text-center">You can change any of this later in settings.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
