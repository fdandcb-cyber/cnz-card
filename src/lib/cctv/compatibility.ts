// CCTV Compatibility Engine — checks setup against rules and returns issues.
import type {
  Product, CompatibilityRule, CartItem, CompatibilityIssue,
  StorageRule, PowerRule,
} from './types'
import { calculateStorageRetention, calculatePoEBudget } from './calculators'

export function checkCompatibility(setup: {
  cameras: CartItem[]
  recorders: CartItem[]
  storage: CartItem[]
  power: CartItem[] // SMPS
  poe: CartItem[] // PoE switches
  cables: CartItem[]
  accessories: CartItem[]
  storageRules: StorageRule[]
  powerRules: PowerRule[]
  compatibilityRules: CompatibilityRule[]
  hddProducts: Product[]
  targetRetentionDays: number
  recordingHoursPerDay: number
  motionRecording: boolean
  audio: boolean
  codec: string
}): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = []

  const totalCameras = setup.cameras.reduce((s, c) => s + c.quantity, 0)
  const ipCameras = setup.cameras.filter((c) => c.product.productType === 'IP_CAMERA')
  const analogCameras = setup.cameras.filter((c) => c.product.productType === 'ANALOG_CAMERA')

  // --- Rule 1: IP cameras require NVR ---
  if (ipCameras.length > 0) {
    const hasNVR = setup.recorders.some((r) => r.product.productType === 'NVR')
    const hasDVR = setup.recorders.some((r) => r.product.productType === 'DVR' || r.product.productType === 'XVR')
    if (!hasNVR) {
      issues.push({
        severity: 'ERROR',
        rule: 'IP camera requires NVR',
        message: `⚠ You selected ${ipCameras.length} IP camera(s), but no NVR is selected. IP cameras require an NVR, not a DVR/XVR.`,
      })
    } else if (hasDVR && ipCameras.length > 0 && analogCameras.length === 0) {
      issues.push({
        severity: 'WARNING',
        rule: 'Mixed recorder types',
        message: `IP cameras cannot connect to a DVR/XVR. Make sure your DVR/XVR is only used for analog cameras.`,
      })
    }
  }

  // --- Rule 2: Analog cameras require DVR/XVR ---
  if (analogCameras.length > 0) {
    const hasDVRorXVR = setup.recorders.some(
      (r) => r.product.productType === 'DVR' || r.product.productType === 'XVR',
    )
    if (!hasDVRorXVR) {
      issues.push({
        severity: 'ERROR',
        rule: 'Analog camera requires DVR/XVR',
        message: `⚠ You selected ${analogCameras.length} analog camera(s), but no DVR/XVR is selected. Analog cameras require a DVR or XVR.`,
      })
    }
  }

  // --- Rule 3: Camera count <= recorder channels ---
  if (totalCameras > 0 && setup.recorders.length > 0) {
    const totalChannels = setup.recorders.reduce((s, r) => s + (r.product.channels || 0) * r.quantity, 0)
    if (totalCameras > totalChannels) {
      issues.push({
        severity: 'ERROR',
        rule: 'Channel count',
        message: `⚠ Compatibility issue: You selected ${totalCameras} cameras, but the recorder(s) support only ${totalChannels} channels total.`,
      })
    } else if (totalCameras === totalChannels) {
      issues.push({
        severity: 'WARNING',
        rule: 'Channel count',
        message: `ℹ All ${totalChannels} channels will be used. No spare capacity for future camera additions.`,
      })
    }
  }

  // --- Rule 4: Recorder resolution >= camera resolution ---
  if (setup.recorders.length > 0 && (ipCameras.length > 0 || analogCameras.length > 0)) {
    const recorderMaxRes = setup.recorders[0].product.keySpecs.MaxResolution || ''
    // Rank order from HIGHEST to LOWEST so '12MP' is matched before '2MP'
    const RES_RANK: { pattern: string; rank: number }[] = [
      { pattern: '12MP', rank: 5 },
      { pattern: '8MP', rank: 4 },
      { pattern: '4K', rank: 4 }, // 4K ≈ 8MP
      { pattern: '5MP', rank: 3 },
      { pattern: '4MP', rank: 2 },
      { pattern: '2MP', rank: 1 },
    ]
    const getResRank = (s: string): number => {
      for (const r of RES_RANK) {
        if (s.includes(r.pattern)) return r.rank
      }
      return -1
    }
    const recorderResRank = getResRank(recorderMaxRes)
    const cameras = [...ipCameras, ...analogCameras]
    for (const c of cameras) {
      const camRes = c.product.megapixel || ''
      const camResRank = getResRank(camRes)
      if (recorderResRank >= 0 && camResRank >= 0 && camResRank > recorderResRank) {
        issues.push({
          severity: 'WARNING',
          rule: 'Resolution support',
          message: `⚠ The selected recorder supports up to ${recorderMaxRes}, but ${c.product.name} is ${camRes}. Recording will be downscaled.`,
        })
      }
    }
  }

  // --- Rule 5: PoE power budget covers IP cameras ---
  if (ipCameras.length > 0) {
    const quantityPerCamera = ipCameras[0].quantity
    const poeSwitch = setup.poe[0]?.product
    const result = calculatePoEBudget({
      poeCameras: ipCameras.map((c) => c.product),
      quantityPerCamera,
      poeSwitch,
      powerRules: setup.powerRules,
    })
    if (result.status === 'INSUFFICIENT' && poeSwitch) {
      issues.push({
        severity: 'ERROR',
        rule: 'PoE power budget',
        message: `⚠ Power warning: Selected cameras require approximately ${result.totalWattage}W. Selected PoE switch provides ${result.budgetWattage}W.`,
      })
    } else if (result.status === 'TIGHT') {
      issues.push({
        severity: 'WARNING',
        rule: 'PoE power budget',
        message: `⚠ Tight PoE budget: ${result.totalWattage}W required vs ${result.budgetWattage}W available. Minimal reserve for future expansion.`,
      })
    }
    // Also check if user has IP cameras but no PoE switch or PoE NVR
    if (setup.poe.length === 0) {
      const hasPoENVR = setup.recorders.some((r) => r.product.keySpecs.PoEPorts)
      if (!hasPoENVR) {
        issues.push({
          severity: 'WARNING',
          rule: 'Missing PoE',
          message: `⚠ IP cameras detected but no PoE switch or PoE NVR selected. IP cameras need PoE for power+data.`,
        })
      }
    }
  }

  // --- Rule 6: Analog cameras need SMPS power supply ---
  if (analogCameras.length > 0 && setup.power.length === 0) {
    issues.push({
      severity: 'WARNING',
      rule: 'Missing SMPS',
      message: `⚠ Analog cameras detected but no SMPS selected. Each analog camera needs 12V power.`,
    })
  }

  // --- Rule 7: HDD storage retention ---
  if (setup.cameras.length > 0 && setup.storage.length > 0) {
    const hdd = setup.storage[0].product
    const hddCapacityTB = parseInt((hdd.keySpecs.Capacity || '0').replace(/\D/g, ''), 10)
    // pick representative camera megapixel
    const megapixel = setup.cameras[0].product.megapixel || '2MP'
    const storageResult = calculateStorageRetention({
      numCameras: totalCameras,
      megapixel,
      codec: setup.codec,
      recordingHoursPerDay: setup.recordingHoursPerDay,
      motionRecording: setup.motionRecording,
      audio: setup.audio,
      hddCapacityTB,
      storageRules: setup.storageRules,
    })
    if (storageResult.estimatedRetentionDays > 0) {
      if (storageResult.estimatedRetentionDays < setup.targetRetentionDays) {
        issues.push({
          severity: 'WARNING',
          rule: 'Storage retention',
          message: `⚠ Storage warning: The selected HDD (${hddCapacityTB}TB) provides approximately ${storageResult.estimatedRetentionDays} days retention. You requested ${setup.targetRetentionDays} days.`,
        })
      } else if (storageResult.estimatedRetentionDays > setup.targetRetentionDays * 2) {
        issues.push({
          severity: 'INFO',
          rule: 'Storage retention',
          message: `ℹ The selected HDD provides ${storageResult.estimatedRetentionDays} days retention — significantly more than your ${setup.targetRetentionDays}-day requirement. You may downgrade the HDD to save cost.`,
        })
      }
    }
  } else if (setup.cameras.length > 0 && setup.storage.length === 0 && setup.recorders.length > 0) {
    issues.push({
      severity: 'WARNING',
      rule: 'Missing HDD',
      message: `⚠ Cameras and recorder selected but no HDD/storage added. Without storage, no recording is possible.`,
    })
  }

  // --- Rule 8: Cable type matches system ---
  if (setup.cables.length > 0) {
    const cableType = setup.cables[0].product.variety || ''
    if (ipCameras.length > 0 && !cableType.toLowerCase().includes('cat')) {
      issues.push({
        severity: 'WARNING',
        rule: 'Cable type',
        message: `⚠ IP cameras detected but selected cable is "${cableType}". IP cameras typically use Cat6 cable.`,
      })
    }
    if (analogCameras.length > 0 && !cableType.toLowerCase().includes('rg') && !cableType.toLowerCase().includes('siamese')) {
      issues.push({
        severity: 'WARNING',
        rule: 'Cable type',
        message: `⚠ Analog cameras detected but selected cable is "${cableType}". Analog cameras typically use RG59 or Siamese cable.`,
      })
    }
  }

  return issues
}
