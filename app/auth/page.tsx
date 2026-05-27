'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/index'

type Step = 'method' | 'phone_entry' | 'phone_otp' | 'email_entry'

export default function AuthPage() {
  const supabase = createClient()
  const [step, setStep]         = useState<Step>('method')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function sendOtp() {
    setError('')
    setLoading(true)
    const formatted = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('phone_otp')
  }

  async function verifyOtp() {
    setError('')
    setLoading(true)
    const formatted = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
    const { error } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'sms' })
    setLoading(false)
    if (error) { setError(error.message); return }
    window.location.href = '/dashboard'
  }

  async function emailAuth() {
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error?.message.includes('Invalid login')) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (signUpError) { setError(signUpError.message); return }
      window.location.href = '/start'
      return
    }
    setLoading(false)
    if (error) { setError(error.message); return }
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#F0F2F7] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#0D1F6E] rounded-2xl flex items-center justify-center mb-3">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D1F6E]">Tailgate Pay</h1>
          <p className="text-sm text-slate-400 mt-1">Run your team. Raise more money.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

          {step === 'method' && (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-[#0D1F6E] text-center mb-1">Sign in or create account</h2>
              <button
                onClick={() => setStep('phone_entry')}
                className="w-full bg-[#2B5CE6] text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-blue-700 transition-colors"
              >
                Continue with phone number
              </button>
              <button
                onClick={() => setStep('email_entry')}
                className="w-full bg-white text-[#0D1F6E] font-semibold rounded-lg py-2.5 text-sm border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Continue with email
              </button>
              <p className="text-xs text-slate-400 text-center mt-2">
                By continuing you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          )}

          {step === 'phone_entry' && (
            <div className="flex flex-col gap-4">
              <button onClick={() => setStep('method')} className="text-xs text-slate-400 flex items-center gap-1 hover:text-[#0D1F6E]">
                ← Back
              </button>
              <div>
                <h2 className="text-lg font-bold text-[#0D1F6E]">Enter your phone number</h2>
                <p className="text-sm text-slate-400 mt-1">We'll text you a confirmation code.</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone number</label>
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0D1F6E] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#2B5CE6]"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={sendOtp}
                disabled={loading}
                className="w-full bg-[#2B5CE6] text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send code'}
              </button>
            </div>
          )}

          {step === 'phone_otp' && (
            <div className="flex flex-col gap-4">
              <button onClick={() => setStep('phone_entry')} className="text-xs text-slate-400 flex items-center gap-1 hover:text-[#0D1F6E]">
                ← Back
              </button>
              <div>
                <h2 className="text-lg font-bold text-[#0D1F6E]">Check your messages</h2>
                <p className="text-sm text-slate-400 mt-1">We sent a 6-digit code to <span className="font-semibold text-[#0D1F6E]">{phone}</span></p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Confirmation code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xl font-bold tracking-widest text-center text-[#0D1F6E] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#2B5CE6]"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={verifyOtp}
                disabled={loading}
                className="w-full bg-[#2B5CE6] text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify and continue'}
              </button>
              <button onClick={sendOtp} className="text-xs text-[#2B5CE6] text-center hover:underline">
                Resend code
              </button>
            </div>
          )}

          {step === 'email_entry' && (
            <div className="flex flex-col gap-4">
              <button onClick={() => setStep('method')} className="text-xs text-slate-400 flex items-center gap-1 hover:text-[#0D1F6E]">
                ← Back
              </button>
              <h2 className="text-lg font-bold text-[#0D1F6E]">Sign in with email</h2>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0D1F6E] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#2B5CE6]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && emailAuth()}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#0D1F6E] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#2B5CE6]"
                />
                <p className="text-xs text-slate-400">No account yet? We'll create one automatically.</p>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={emailAuth}
                disabled={loading}
                className="w-full bg-[#2B5CE6] text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Continue'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
