// Shared types for the CCTV platform
// These map to Prisma models but are used by the client.

export type Role = {
  id: string
  name: string
  description: string | null
  permissions: string | null
}

export type Brand = {
  id: string
  name: string
  slug: string
  description: string | null
  country: string | null
  logoUrl: string | null
  isActive: boolean
}

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  iconUrl: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
}

export type Pricing = {
  id: string
  productId: string
  mrp: number
  salePrice: number
  dealerPrice: number | null
  purchasePrice: number | null
  gstRate: number
  discountPercent: number
  minSellingPrice: number | null
}

export type LearningContent = {
  id: string
  productId: string
  title: string
  simpleExplanation: string
  technicalDetails: string | null
}

export type Inventory = {
  id: string
  productId: string
  quantity: number
  reservedQty: number
  lowStockThreshold: number
  warehouseId: string | null
}

export type InventoryTransaction = {
  id: string
  productId: string
  type: 'OPENING' | 'PURCHASE' | 'SALE' | 'RETURN' | 'DAMAGE' | 'ADJUSTMENT' | 'TRANSFER'
  quantity: number
  reference: string | null
  notes: string | null
  warehouseId: string | null
  createdAt: string
}

export type Product = {
  id: string
  sku: string
  name: string
  modelNumber: string
  brandId: string
  categoryId: string
  productType: string // DVR, XVR, NVR, IP_CAMERA, ANALOG_CAMERA, HDD, SMPS, POE_SWITCH, POE_INJECTOR, CABLE, ACCESSORY
  variety: string | null
  technology: string | null
  megapixel: string | null
  channels: number | null
  shortDescription: string
  longDescription: string | null
  keySpecs: Record<string, string>
  features: string[]
  images: string[]
  videoUrl: string | null
  documentUrl: string | null
  isActive: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  brand?: Brand
  category?: Category
  pricing?: Pricing
  inventory?: Inventory
  learning?: LearningContent
}

export type StorageRule = {
  id: string
  name: string
  megapixel: string
  codec: string
  bitrateMbps: number
  fps: number
  motionFactor: number
  audioOverhead: number
}

export type PowerRule = {
  id: string
  name: string
  productType: string
  wattage: number
  safetyMarginPercent: number
}

export type CableRule = {
  id: string
  name: string
  cableType: string
  systemType: string
  rollLengthM: number
  wastagePercent: number
}

export type CompatibilityRule = {
  id: string
  name: string
  ruleType: string
  sourceType: string | null
  targetType: string | null
  sourceAttr: string | null
  targetAttr: string | null
  severity: 'ERROR' | 'WARNING' | 'INFO'
  description: string | null
  isActive: boolean
}

export type AccessoryRecRule = {
  id: string
  name: string
  systemType: string
  trigger: string
  accessoryCategory: string
  qtyPerCamera: number
  description: string | null
  isActive: boolean
}

export type Warehouse = {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  phone: string | null
  isActive: boolean
}

export type Supplier = {
  id: string
  name: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  gstNumber: string | null
}

export type CartItem = {
  product: Product
  quantity: number
}

export type CartSection = {
  key: 'CAMERA' | 'RECORDER' | 'STORAGE' | 'POWER' | 'POE' | 'CABLE' | 'ACCESSORY'
  label: string
  items: CartItem[]
}

// ===== Calculation result types =====
export type StorageCalcResult = {
  totalStorageGB: number
  perCameraGB: number
  perDayGB: number
  estimatedRetentionDays: number
  ruleUsed?: StorageRule
  recommendedHDD?: Product
  breakdown: string
}

export type PowerCalcResult = {
  totalWattage: number
  requiredWattage: number // with margin
  safetyMarginPercent: number
  breakdown: { item: string; qty: number; wattage: number; total: number }[]
  recommendedProduct?: Product
  status: 'OK' | 'INSUFFICIENT'
  message: string
}

export type PoECalcResult = {
  totalWattage: number
  requiredWattage: number
  safetyMarginPercent: number
  budgetWattage: number
  status: 'OK' | 'TIGHT' | 'INSUFFICIENT'
  message: string
  recommendedProduct?: Product
}

export type CableCalcResult = {
  totalLengthM: number
  wastagePercent: number
  recommendedLengthM: number
  rollsNeeded: number
  rollLengthM: number
  recommendedPurchase: string
  breakdown: { camera: string; distance: number }[]
}

export type CompatibilityIssue = {
  severity: 'ERROR' | 'WARNING' | 'INFO'
  rule: string
  message: string
}
