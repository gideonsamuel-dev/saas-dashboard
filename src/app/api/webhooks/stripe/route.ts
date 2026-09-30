import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const organizationId = session.metadata?.organizationId

    if (organizationId) {
      await prisma.subscription.upsert({
        where: { organizationId },
        update: {
          status: 'active',
          plan: 'pro',
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
        create: {
          organizationId,
          status: 'active',
          plan: 'pro',
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
      })
    }
  }

  return NextResponse.json({ received: true })
}