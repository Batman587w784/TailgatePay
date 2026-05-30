import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const { pool_id, contributor_id } = pi.metadata

      if (pool_id) {
        await supabase.from('pool_contributors')
          .update({
            status: 'paid',
            amount_paid: pi.amount / 100,
            stripe_payment_intent_id: pi.id,
            paid_at: new Date().toISOString(),
          })
          .eq('id', contributor_id)

        const { data: contributors } = await supabase
          .from('pool_contributors')
          .select('amount_paid')
          .eq('pool_id', pool_id)

        const total = contributors?.reduce((sum, c) => sum + (c.amount_paid || 0), 0) || 0
        await supabase.from('tailgate_pools').update({ collected_amount: total }).eq('id', pool_id)
      }
      break
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      if (account.charges_enabled) {
        await supabase.from('orgs')
          .update({ stripe_account_id: account.id })
          .eq('stripe_account_id', account.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}