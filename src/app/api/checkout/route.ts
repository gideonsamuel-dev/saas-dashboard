import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { organizationId } = await req.json()

  const org = await prisma.organization.findUnique({ where: { id: organizationId } })
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: `${org.name} — Pro Plan` },
          unit_amount: 2000,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    success_url: `http://localhost:3000?success=true`,
    cancel_url: `http://localhost:3000?canceled=true`,
    metadata: { organizationId },
  })

  return NextResponse.json({ url: session.url })
}