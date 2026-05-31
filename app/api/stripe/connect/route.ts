import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: org } = await supabase
      .from('orgs')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

    let accountId = org.stripe_account_id

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        metadata: { org_id: org.id, org_name: org.name },
      })
      accountId = account.id
      await supabase.from('orgs').update({ stripe_account_id: accountId }).eq('id', org.id)
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard/settings?stripe=refresh',
      return_url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard/settings?stripe=success',
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}