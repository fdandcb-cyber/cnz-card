// CCTV calculation engine — pure functions for storage, power, PoE, and cable.
import type {
  Product, StorageRule, PowerRule, CableRule,
  StorageCalcResult, PowerCalcResult, PoECalcResult, CableCalcResult,
} from './types'

// ============ HDD RETENTION CALCULATOR ============
/**
 * storage (GB/day) = bitrate (Mbps) * 3600 * hours_per_day * num_cameras
 *                    / (8 * 1024) * motion_factor + audio_overhead
 * retention_days = HDD_capacity_GB / storage_per_day
 */
export function calculateStorageRetention(input: {
  numCameras: number
  megapixel: string
  codec: string
  recordingHoursPerDay: number
  motionRecording: boolean
  audio: boolean
  hddCapacityTB?: number // if provided, calculate retention
  storageRules: StorageRule[]
  hddProducts?: Product[]
}): StorageCalcResult {
  const rule = input.storageRules.find(
    (r) => r.megapixel === input.megapixel && r.codec === input.codec,
  )
  if (!rule) {
    return {
      totalStorageGB: 0,
      perCameraGB: 0,
      perDayGB: 0,
      estimatedRetentionDays: 0,
      breakdown: `No storage rule found for ${input.megapixel} + ${input.codec}`,
    }
  }

  const motionFactor = input.motionRecording ? rule.motionFactor : 1
  const audioOverhead = input.audio ? rule.audioOverhead : 0
  // per camera per day storage in GB
  const perCameraPerDayGB =
    (rule.bitrateMbps * 3600 * input.recordingHoursPerDay) / (8 * 1024) * motionFactor * (1 + audioOverhead)

  const perDayGB = perCameraPerDayGB * input.numCameras
  const breakdown =
    `${input.numCameras} × ${input.megapixel} cameras · ${rule.bitrateMbps} Mbps ${input.codec} · ` +
    `${input.recordingHoursPerDay}h/day · ${input.motionRecording ? 'motion' : 'continuous'} · ` +
    `${input.audio ? 'with audio' : 'no audio'} → ${perDayGB.toFixed(2)} GB/day`

  if (input.hddCapacityTB) {
    const totalCapacityGB = input.hddCapacityTB * 1000
    const retentionDays = Math.floor(totalCapacityGB / perDayGB)
    return {
      totalStorageGB: totalCapacityGB,
      perCameraGB: perCameraPerDayGB,
      perDayGB,
      estimatedRetentionDays: retentionDays,
      ruleUsed: rule,
      breakdown,
    }
  }

  // No HDD selected — return rate only
  return {
    totalStorageGB: 0,
    perCameraGB: perCameraPerDayGB,
    perDayGB,
    estimatedRetentionDays: 0,
    ruleUsed: rule,
    breakdown,
  }
}

export function findRecommendedHDD(
  perDayGB: number,
  targetRetentionDays: number,
  hddProducts: Product[],
): Product | undefined {
  const requiredGB = perDayGB * targetRetentionDays
  // Sort ascending by capacity
  const sorted = [...hddProducts].sort((a, b) => {
    const capA = parseInt((a.keySpecs.Capacity || '0').replace(/\D/g, ''), 10)
    const capB = parseInt((b.keySpecs.Capacity || '0').replace(/\D/g, ''), 10)
    return capA - capB
  })
  // Pick smallest HDD whose capacity >= requiredGB
  return sorted.find((p) => {
    const capTB = parseInt((p.keySpecs.Capacity || '0').replace(/\D/g, ''), 10)
    return capTB * 1000 >= requiredGB
  }) || sorted[sorted.length - 1]
}

// ============ POWER (SMPS) CALCULATOR ============
export function calculatePowerRequired(input: {
  items: { product: Product; quantity: number }[]
  powerRules: PowerRule[]
  safetyMarginPercent?: number
}): PowerCalcResult {
  const breakdown: PowerCalcResult['breakdown'] = []
  let total = 0

  for (const item of input.items) {
    // First try to find a rule matching productType AND variety
    let rule = input.powerRules.find(
      (r) => r.productType === item.product.productType && r.name.includes(item.product.variety || '___'),
    )
    // Otherwise match productType only
    if (!rule) {
      rule = input.powerRules.find((r) => r.productType === item.product.productType)
    }
    const wattage = rule?.wattage ?? 5
    const sub = wattage * item.quantity
    total += sub
    breakdown.push({
      item: `${item.quantity} × ${item.product.name}`,
      qty: item.quantity,
      wattage,
      total: sub,
    })
  }

  // Use the largest safety margin from rules, or supplied override
  const safetyMarginPercent =
    input.safetyMarginPercent ?? Math.max(20, ...input.powerRules.map((r) => r.safetyMarginPercent))
  const required = Math.ceil(total * (1 + safetyMarginPercent / 100))

  return {
    totalWattage: total,
    requiredWattage: required,
    safetyMarginPercent,
    breakdown,
    status: 'OK',
    message: `Total ${total}W, with ${safetyMarginPercent}% margin → ${required}W required`,
  }
}

// ============ PoE POWER BUDGET CALCULATOR ============
export function calculatePoEBudget(input: {
  poeCameras: Product[] // cameras requiring PoE
  quantityPerCamera: number
  poeSwitch?: Product // selected PoE switch
  powerRules: PowerRule[]
  safetyMarginPercent?: number
}): PoECalcResult {
  if (input.poeCameras.length === 0) {
    return {
      totalWattage: 0,
      requiredWattage: 0,
      safetyMarginPercent: 0,
      budgetWattage: 0,
      status: 'OK',
      message: 'No PoE cameras in setup.',
    }
  }

  let perCameraW = 7 // default
  for (const cam of input.poeCameras) {
    const rule = input.powerRules.find((r) => r.productType === cam.productType)
    if (rule) {
      perCameraW = Math.max(perCameraW, rule.wattage)
    }
  }
  const totalCameras = input.poeCameras.length * input.quantityPerCamera
  const total = perCameraW * totalCameras
  const margin = input.safetyMarginPercent ?? 20
  const required = Math.ceil(total * (1 + margin / 100))

  // Parse PoE switch budget from keySpecs (e.g. "65W")
  let budget = 0
  if (input.poeSwitch) {
    const budgetStr = input.poeSwitch.keySpecs.PoEBudget || '0'
    const match = budgetStr.match(/(\d+)/)
    if (match) budget = parseInt(match[1], 10)
  }

  let status: PoECalcResult['status'] = 'INSUFFICIENT'
  let message = ''
  if (input.poeSwitch && budget > 0) {
    if (budget >= required) {
      status = 'OK'
      message = `${totalCameras} cameras × ${perCameraW}W = ${total}W required. Switch budget ${budget}W — suitable.`
    } else if (budget >= total) {
      status = 'TIGHT'
      message = `${totalCameras} cameras × ${perCameraW}W = ${total}W required. Switch budget ${budget}W — tight, minimal reserve.`
    } else {
      status = 'INSUFFICIENT'
      message = `${totalCameras} cameras × ${perCameraW}W = ${total}W required. Switch budget ${budget}W — insufficient!`
    }
  } else {
    message = `${totalCameras} cameras × ${perCameraW}W = ${total}W required (with ${margin}% margin: ${required}W). Select a PoE switch to validate.`
  }

  return {
    totalWattage: total,
    requiredWattage: required,
    safetyMarginPercent: margin,
    budgetWattage: budget,
    status,
    message,
    recommendedProduct: input.poeSwitch,
  }
}

// ============ CABLE LENGTH CALCULATOR ============
export function calculateCableLength(input: {
  distances: { camera: string; distance: number }[]
  cableRule: CableRule
  wastagePercent?: number
}): CableCalcResult {
  const total = input.distances.reduce((sum, d) => sum + d.distance, 0)
  const wastage = input.wastagePercent ?? input.cableRule.wastagePercent
  const withWastage = Math.ceil(total * (1 + wastage / 100))
  const rollLength = input.cableRule.rollLengthM
  const rollsNeeded = Math.ceil(withWastage / rollLength)
  const recommendedLength = rollsNeeded * rollLength

  const breakdown = input.distances.map((d) => ({ camera: d.camera, distance: d.distance }))

  let recommendedPurchase: string
  if (rollsNeeded <= 1) {
    recommendedPurchase = `1 × ${rollLength}m roll`
  } else {
    recommendedPurchase = `${rollsNeeded} × ${rollLength}m rolls = ${recommendedLength}m total`
  }

  return {
    totalLengthM: total,
    wastagePercent: wastage,
    recommendedLengthM: recommendedLength,
    rollsNeeded,
    rollLengthM: rollLength,
    recommendedPurchase,
    breakdown,
  }
}

// ============ HELPER: Parse capacity (TB / m) from keySpecs ============
export function parseCapacity(specs: Record<string, string>): number {
  const v = specs.Capacity || specs.Length || '0'
  const n = parseFloat(v.replace(/[^\d.]/g, ''))
  return isNaN(n) ? 0 : n
}
