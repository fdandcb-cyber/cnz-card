import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/catalog — returns all catalog data: brands, categories, products (with relations)
export async function GET() {
  try {
    const [brands, categories, products, warehouses, suppliers] = await Promise.all([
      db.brand.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      // Return ALL products (active + inactive) so admin can manage disabled ones.
      // Customer-facing UIs filter by `isActive` themselves.
      db.product.findMany({
        include: {
          brand: true,
          category: true,
          pricing: true,
          inventory: true,
          learning: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.warehouse.findMany({ where: { isActive: true } }),
      db.supplier.findMany(),
    ])

    const productsNormalized = products.map((p) => ({
      ...p,
      keySpecs: p.keySpecs ? JSON.parse(p.keySpecs) : {},
      features: p.features ? JSON.parse(p.features) : [],
      images: p.images ? JSON.parse(p.images) : [],
    }))

    return NextResponse.json({
      brands,
      categories,
      products: productsNormalized,
      warehouses,
      suppliers,
    })
  } catch (err) {
    console.error('catalog error:', err)
    return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 })
  }
}
