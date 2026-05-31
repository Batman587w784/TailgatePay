import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export async function POST(req: NextRequest) {
  try {
    const { pool_id, amount, name, email, phone, org_slug } = await req.json()

    if (!pool_id || !amount || !name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: org } = await supabase
      .from('orgs')
      .select('id, stripe_account_id, name')
      .eq('slug', org_slug)
      .single()

    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })
    if (!org.stripe_account_id) return NextResponse.json({ error: 'Org has not connected Stripe yet' }, { status: 400 })

    const { data: contributor } = await supabase
      .from('pool_contributors')
      .insert({
        pool_id,
        name,
        email,
        phone: phone || null,
        status: 'unpaid',
        amount_due: amount,
        amount_paid: 0,
      })
      .select()
      .single()

    if (!contributor) return NextResponse.json({ error: 'Failed to create contributor' }, { status: 500 })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        pool_id,
        contributor_id: contributor.id,
        org_id: org.id,
        payer_name: name,
        payer_email: email,
      },
    })

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      contributor_id: contributor.id,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}