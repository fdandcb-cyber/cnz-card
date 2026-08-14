import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/rules — returns all calculation/compatibility rules
export async function GET() {
  try {
    const [
      storageRules, powerRules, cableRules, compatibilityRules, accessoryRules,
    ] = await Promise.all([
      db.storageCalculationRule.findMany({ orderBy: { megapixel: 'asc' } }),
      db.powerCalculationRule.findMany(),
      db.cableCalculationRule.findMany(),
      db.compatibilityRule.findMany({ where: { isActive: true } }),
      db.accessoryRecommendationRule.findMany({ where: { isActive: true } }),
    ])
    return NextResponse.json({
      storageRules,
      powerRules,
      cableRules,
      compatibilityRules,
      accessoryRules,
    })
  } catch (err) {
    console.error('rules error:', err)
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
  }
}
