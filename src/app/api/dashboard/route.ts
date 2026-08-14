import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/dashboard — returns admin dashboard aggregates
export async function GET() {
  try {
    const products = await db.product.findMany({
      include: { pricing: true, inventory: true, category: true, brand: true },
    })
    const inventoryTxns = await db.inventoryTransaction.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      include: { product: { include: { brand: true } } },
    })

    const totalProducts = products.length
    const activeProducts = products.filter((p) => p.isActive).length
    const lowStock = products.filter((p) => p.inventory && p.inventory.quantity <= (p.inventory.lowStockThreshold ?? 5) && p.inventory.quantity > 0).length
    const outOfStock = products.filter((p) => p.inventory && p.inventory.quantity === 0).length

    const totalInventoryValue = products.reduce((s, p) => {
      const inv = p.inventory?.quantity || 0
      const cost = p.pricing?.purchasePrice || p.pricing?.salePrice || 0
      return s + inv * cost
    }, 0)

    // Today's sales (sum of negative SALE transactions created today)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todaysSalesTxns = inventoryTxns.filter(
      (t) => t.type === 'SALE' && new Date(t.createdAt) >= todayStart,
    )
    const todaysSalesCount = todaysSalesTxns.length
    const todaysSalesValue = todaysSalesTxns.reduce((s, t) => {
      const product = products.find((p) => p.id === t.productId)
      const price = product?.pricing?.salePrice || 0
      return s + Math.abs(t.quantity) * price
    }, 0)

    // Pending orders = SALE transactions with no associated order (we treat all SALE txns as 'completed' here for demo)
    // We'll simulate pending orders count
    const pendingOrders = Math.max(0, 8 - Math.floor(todaysSalesCount / 2))

    // Storage usage — count of product images
    const totalImages = products.reduce((s, p) => {
      try {
        const imgs = p.images ? JSON.parse(p.images) : []
        return s + imgs.length
      } catch { return s }
    }, 0)
    const storageUsageMB = totalImages * 0.5 // mock 500KB per image

    // Recent activity (last 10 transactions)
    const recentActivity = inventoryTxns.slice(0, 10).map((t) => {
      const product = products.find((p) => p.id === t.productId)
      return {
        id: t.id,
        type: t.type,
        quantity: t.quantity,
        reference: t.reference,
        productName: product?.name || 'Unknown',
        brand: product?.brand?.name || '',
        createdAt: t.createdAt,
      }
    })

    // Stock movement chart data (last 14 days)
    const stockMovement: { date: string; in: number; out: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayKey = d.toISOString().slice(0, 10)
      const dayTxns = inventoryTxns.filter((t) => t.createdAt.toISOString().slice(0, 10) === dayKey)
      const inQty = dayTxns.filter((t) => ['OPENING', 'PURCHASE', 'RETURN'].includes(t.type)).reduce((s, t) => s + Math.abs(t.quantity), 0)
      const outQty = dayTxns.filter((t) => ['SALE', 'DAMAGE'].includes(t.type)).reduce((s, t) => s + Math.abs(t.quantity), 0)
      stockMovement.push({ date: dayKey.slice(5), in: inQty, out: outQty })
    }

    // Sales last 14 days
    const salesTrend: { date: string; amount: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayKey = d.toISOString().slice(0, 10)
      const dayTxns = inventoryTxns.filter(
        (t) => t.type === 'SALE' && t.createdAt.toISOString().slice(0, 10) === dayKey,
      )
      const amount = dayTxns.reduce((s, t) => {
        const product = products.find((p) => p.id === t.productId)
        return s + Math.abs(t.quantity) * (product?.pricing?.salePrice || 0)
      }, 0)
      salesTrend.push({ date: dayKey.slice(5), amount: Math.round(amount) })
    }

    // Top products by sales quantity
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {}
    for (const t of inventoryTxns.filter((t) => t.type === 'SALE')) {
      const product = products.find((p) => p.id === t.productId)
      if (!product) continue
      if (!productSales[product.id]) {
        productSales[product.id] = {
          name: product.name,
          qty: 0,
          revenue: 0,
        }
      }
      productSales[product.id].qty += Math.abs(t.quantity)
      productSales[product.id].revenue += Math.abs(t.quantity) * (product.pricing?.salePrice || 0)
    }
    const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5)

    // Category distribution
    const categoryDist: Record<string, number> = {}
    for (const p of products) {
      const catName = p.category?.name || 'Other'
      categoryDist[catName] = (categoryDist[catName] || 0) + 1
    }
    const categoryDistribution = Object.entries(categoryDist).map(([name, value]) => ({ name, value }))

    // Low stock products list
    const lowStockProducts = products
      .filter((p) => p.inventory && p.inventory.quantity <= (p.inventory.lowStockThreshold ?? 5))
      .map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand?.name || '',
        stock: p.inventory?.quantity || 0,
        threshold: p.inventory?.lowStockThreshold || 5,
      }))
      .slice(0, 5)

    return NextResponse.json({
      stats: {
        totalProducts,
        activeProducts,
        lowStock,
        outOfStock,
        totalInventoryValue: Math.round(totalInventoryValue),
        todaysSalesCount,
        todaysSalesValue: Math.round(todaysSalesValue),
        pendingOrders,
        storageUsageMB: Math.round(storageUsageMB),
      },
      recentActivity,
      stockMovement,
      salesTrend,
      topProducts,
      categoryDistribution,
      lowStockProducts,
    })
  } catch (err) {
    console.error('dashboard error:', err)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
