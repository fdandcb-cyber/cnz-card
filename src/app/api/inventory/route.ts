import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/inventory?productId=... — get full inventory transaction ledger for a product
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    if (productId) {
      const txns = await db.inventoryTransaction.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
      })
      const product = await db.product.findUnique({
        where: { id: productId },
        include: { inventory: true, brand: true, category: true, pricing: true },
      })
      return NextResponse.json({ transactions: txns, product })
    }

    // Return all transactions (recent first)
    const txns = await db.inventoryTransaction.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' },
      include: { product: { include: { brand: true } } },
    })
    return NextResponse.json({ transactions: txns })
  } catch (err) {
    console.error('inventory error:', err)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

// POST /api/inventory — add a new transaction (purchase, sale, return, damage, adjustment)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, type, quantity, reference, notes, warehouseId } = body

    if (!productId || !type || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create transaction record
    const txn = await db.inventoryTransaction.create({
      data: { productId, type, quantity, reference, notes, warehouseId },
    })

    // Update inventory quantity based on transaction type
    const inv = await db.inventory.findUnique({ where: { productId } })
    if (inv) {
      let newQty = inv.quantity
      if (['OPENING', 'PURCHASE', 'RETURN'].includes(type)) {
        newQty = inv.quantity + Math.abs(quantity)
      } else if (['SALE', 'DAMAGE'].includes(type)) {
        newQty = Math.max(0, inv.quantity - Math.abs(quantity))
      } else if (type === 'ADJUSTMENT') {
        // signed
        newQty = Math.max(0, inv.quantity + quantity)
      }
      await db.inventory.update({
        where: { productId },
        data: { quantity: newQty },
      })
    }

    return NextResponse.json({ success: true, transaction: txn })
  } catch (err) {
    console.error('inventory POST error:', err)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
