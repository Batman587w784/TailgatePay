'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Step = 1 | 2 | 3 | 4

const SPORT_TYPES = [
  'Football', 'Basketball', 'Soccer', 'Baseball', 'Softball',
  'Volleyball', 'Track & Field', 'Swimming', 'Tennis', 'Golf',
  'Lacrosse', 'Wrestling', 'Cheer / Dance', 'Band / Orchestra',
  'Drama / Theater', 'Student Council', 'Greek Life / Fraternity',
  'Greek Life / Sorority', 'Nonprofit', 'Other',
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

export default function StartPage() {
  const supabase = createClient()
  const [step, setStep]           = useState<Step>(1)
  const [orgName, setOrgName]     = useState('')
  const [sportType, setSportType] = useState('')
  const [state, setState]         = useState('')
  const [city, setCity]           = useState('')
  const [slug, setSlug]           = useState('')
  const [slugTaken, setSlugTaken] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function checkSlug(value: string) {
    const { data } = await supabase.from('orgs').select('id').eq('slug', value).single()
    setSlugTaken(!!data)
  }

  async function handleFinish() {
    setError('')
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }
    const { error } = await supabase.from('orgs').insert({
      name: orgName,
      slug,
      sport_type: sportType,
      state,
      city,
      owner_id: user.id,
      account_type: 'single',
      is_active: true,
      is_searchable: true,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    window.location.href = '/dashboard'
  }

  const progress = (step / 4) * 100

  return (
    <div className="min-h-screen bg-[#F0F2F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 bg-[#0D1F6E] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-lg font-bold text-[#0D1F6E]">Tailgate Pay</span>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Step {step} of 4</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2B5CE6] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-bold text-[#0D1F6E]">What's your team or org called?</h2>
                <p className="text-sm text-slate-400 mt-1">This is the name members will see when they pay or donate.</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Organization name</label>
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
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0D1F6E] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#2B5CE6]"
                />
              </div>
              {orgName && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-400">Your public page will be at:</p>
                  <p className="text-sm font-semibold text-[#0D1F6E] mt-0.5">
                    tailgatepay.com/pay/<span className="text-[#2B5CE6]">{slug}</span>
                  </p>
                  {slugTaken && <p className="text-xs text-red-500 mt-1">That URL is taken — edit below</p>}
                </div>
              )}
              {slugTaken && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Custom URL</label>
                  <input
                    value={slug}
                    onChange={e => { setSlug(e.target.value); checkSlug(e.target.value) }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0D1F6E] focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#2B5CE6]"
                  />
                </div>
              )}
              <button
                disabled={!orgName || slugTaken}
                onClick={() => setStep(2)}
                className="w-full bg-[#2B5CE6] text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <button onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-[#0D1F6E] mb-3 flex items-center gap-1">← Back</button>
                <h2 className="text-xl font-bold text-[#0D1F6E]">What type of org is this?</h2>
                <p className="text-sm text-slate-400 mt-1">Helps us customize your experience.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {SPORT_TYPES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSportType(s)}
                    className={`text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      sportType === s
                        ? 'bg-blue-50 border-[#2B5CE6] text-[#2B5CE6]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                disabled={!sportType}
                onClick={() => setStep(3)}
                className="w-full bg-[#2B5CE6] text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <button onClick={() => setStep(2)} className="text-xs text-slate-400 hover:text-[#0D1F6E] mb-3 flex items-center gap-1">← Back</button>
                <h2 className="text-xl font-bold text-[#0D1F6E]">Where are you based?</h2>
                <p className="text-sm text-slate-400 mt-1">Sponsors in your area can find and support you.</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">State</label>
                <select
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0D1F6E] focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#2B5CE6]"
                >
                  <option value="">Select your state</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">City</label>
                <input
                  placeholder="e.g. Columbus"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0D1F6E] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#2B5CE6]"
                />
              </div>
              <button
                disabled={!state || !city}
                onClick={() => setStep(4)}
                className="w-full bg-[#2B5CE6] text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div>
                <button onClick={() => setStep(3)} className="text-xs text-slate-400 hover:text-[#0D1F6E] mb-3 flex items-center gap-1">← Back</button>
                <h2 className="text-xl font-bold text-[#0D1F6E]">You're all set. Let's launch.</h2>
                <p className="text-sm text-slate-400 mt-1">Here's a summary before we create your account.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                {[
                  { label: 'Org name',    value: orgName },
                  { label: 'Type',        value: sportType },
                  { label: 'Location',    value: `${city}, ${state}` },
                  { label: 'Public page', value: `tailgatepay.com/pay/${slug}` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{row.label}</span>
                    <span className="text-sm font-semibold text-[#0D1F6E]">{row.value}</span>
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
