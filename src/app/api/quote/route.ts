import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/quote — submit a customer quote request with full setup configuration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, email, location, installationRequirement, notes, setupConfig, totals } = body

    // Upsert customer by phone (unique enough for demo)
    let customer = await db.customer.findFirst({ where: { phone } })
    if (!customer) {
      customer = await db.customer.create({
        data: { name, phone, email, location, notes },
      })
    } else {
      customer = await db.customer.update({
        where: { id: customer.id },
        data: { name, email, location, notes },
      })
    }

    const quote = await db.quoteRequest.create({
      data: {
        customerId: customer.id,
        setupConfig: JSON.stringify(setupConfig),
        subtotal: totals.subtotal || 0,
        discount: totals.discount || 0,
        gst: totals.gst || 0,
        grandTotal: totals.grandTotal || 0,
        installationRequirement: installationRequirement || null,
        status: 'PENDING',
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, quoteId: quote.id })
  } catch (err) {
    console.error('quote error:', err)
    return NextResponse.json({ error: 'Failed to submit quote' }, { status: 500 })
  }
}

// GET /api/quote — list all quote requests for admin dashboard
export async function GET() {
  try {
    const quotes = await db.quoteRequest.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ quotes })
  } catch (err) {
    console.error('quote list error:', err)
    return NextResponse.json({ error: 'Failed to list quotes' }, { status: 500 })
  }
}
