import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/products — create new product (admin only — bypasses RLS in this demo)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, sku, modelNumber, brandId, categoryId, productType, variety, technology, megapixel, channels,
      shortDescription, longDescription, keySpecs, features, images,
      mrp, salePrice, dealerPrice, purchasePrice, gstRate, discountPercent,
      stock, lowStockThreshold, warehouseId } = body

    if (!sku || !name || !brandId || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        sku,
        name,
        modelNumber: modelNumber || '',
        brandId,
        categoryId,
        productType: productType || 'ACCESSORY',
        variety: variety || null,
        technology: technology || null,
        megapixel: megapixel || null,
        channels: channels || null,
        shortDescription: shortDescription || '',
        longDescription: longDescription || null,
        keySpecs: JSON.stringify(keySpecs || {}),
        features: JSON.stringify(features || []),
        images: JSON.stringify(images || []),
        isActive: true,
        pricing: {
          create: {
            mrp: mrp || 0,
            salePrice: salePrice || 0,
            dealerPrice: dealerPrice || null,
            purchasePrice: purchasePrice || null,
            gstRate: gstRate ?? 18,
            discountPercent: discountPercent ?? 0,
          },
        },
        inventory: {
          create: {
            quantity: stock || 0,
            reservedQty: 0,
            lowStockThreshold: lowStockThreshold ?? 5,
            warehouseId: warehouseId || null,
          },
        },
      },
      include: { pricing: true, inventory: true },
    })

    // Create opening stock transaction
    if (stock && stock > 0) {
      await db.inventoryTransaction.create({
        data: {
          productId: product.id,
          type: 'OPENING',
          quantity: stock,
          reference: 'Manual stock-in',
          warehouseId: warehouseId || null,
        },
      })
    }

    return NextResponse.json({ success: true, product })
  } catch (err: any) {
    console.error('product POST error:', err)
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'SKU already exists. Use a unique SKU.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

// PATCH /api/products — update existing product
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 })

    const { pricing, inventory, ...productUpdates } = updates
    if (productUpdates.keySpecs && typeof productUpdates.keySpecs === 'object') {
      productUpdates.keySpecs = JSON.stringify(productUpdates.keySpecs)
    }
    if (productUpdates.features && Array.isArray(productUpdates.features)) {
      productUpdates.features = JSON.stringify(productUpdates.features)
    }
    if (productUpdates.images && Array.isArray(productUpdates.images)) {
      productUpdates.images = JSON.stringify(productUpdates.images)
    }

    const product = await db.product.update({
      where: { id },
      data: productUpdates,
    })

    if (pricing) {
      await db.pricing.update({
        where: { productId: id },
        data: pricing,
      })
    }
    if (inventory) {
      await db.inventory.update({
        where: { productId: id },
        data: inventory,
      })
    }

    return NextResponse.json({ success: true, product })
  } catch (err) {
    console.error('product PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}
