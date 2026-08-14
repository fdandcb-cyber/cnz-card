// Seed script for CCTV Catalog platform.
// Run: bun run scripts/seed.ts
import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding CCTV platform database...')

  // Wipe existing data
  await db.inventoryTransaction.deleteMany()
  await db.inventory.deleteMany()
  await db.pricing.deleteMany()
  await db.learningContent.deleteMany()
  await db.productSupplier.deleteMany()
  await db.productVariant.deleteMany()
  await db.product.deleteMany()
  await db.supplier.deleteMany()
  await db.warehouseLocation.deleteMany()
  await db.warehouse.deleteMany()
  await db.brand.deleteMany()
  await db.category.deleteMany()
  await db.compatibilityRule.deleteMany()
  await db.storageCalculationRule.deleteMany()
  await db.powerCalculationRule.deleteMany()
  await db.cableCalculationRule.deleteMany()
  await db.accessoryRecommendationRule.deleteMany()
  await db.role.deleteMany()
  await db.profile.deleteMany()
  await db.appSetting.deleteMany()
  console.log('  ✓ Cleared existing data')

  // ---------- ROLES ----------
  const roles = await Promise.all([
    db.role.create({ data: { name: 'Super Admin', description: 'Full access to all features', permissions: JSON.stringify(['*']) } }),
    db.role.create({ data: { name: 'Inventory Manager', description: 'Manage stock and warehouses', permissions: JSON.stringify(['inventory:*', 'products:read']) } }),
    db.role.create({ data: { name: 'Catalogue Manager', description: 'Manage products and pricing', permissions: JSON.stringify(['products:*', 'pricing:*']) } }),
    db.role.create({ data: { name: 'Sales Manager', description: 'View orders and quotes', permissions: JSON.stringify(['orders:*', 'quotes:*']) } }),
    db.role.create({ data: { name: 'Viewer', description: 'Read-only access', permissions: JSON.stringify(['*:read']) } }),
  ])

  await db.profile.create({
    data: {
      userId: 'admin-001',
      email: 'admin@cctvstore.com',
      fullName: 'Store Administrator',
      phone: '+91 9876543210',
      roleId: roles[0].id,
      isActive: true,
    },
  })
  console.log('  ✓ Roles & admin profile created')

  // ---------- BRANDS ----------
  const brandData = [
    { name: 'Hikvision', slug: 'hikvision', country: 'China', description: 'Leading video surveillance products and solutions provider' },
    { name: 'Dahua', slug: 'dahua', country: 'China', description: 'Worldwide leading video surveillance solutions provider' },
    { name: 'CP Plus', slug: 'cp-plus', country: 'India', description: 'Affordable, reliable CCTV solutions' },
    { name: 'Uniview', slug: 'uniview', country: 'China', description: 'Professional IP video surveillance' },
    { name: 'Seagate', slug: 'seagate', country: 'USA', description: 'Storage solutions for surveillance' },
    { name: 'Western Digital', slug: 'wd', country: 'USA', description: 'Purple surveillance drives' },
    { name: 'TP-Link', slug: 'tp-link', country: 'China', description: 'Networking & PoE solutions' },
    { name: 'D-Link', slug: 'd-link', country: 'Taiwan', description: 'Network switches and PoE' },
    { name: 'Microtek', slug: 'microtek', country: 'India', description: 'Power supplies and UPS' },
    { name: 'Polycab', slug: 'polycab', country: 'India', description: 'Cables and wiring' },
  ]
  const brands: Record<string, { id: string }> = {}
  for (const b of brandData) {
    brands[b.slug] = await db.brand.create({ data: b })
  }
  console.log(`  ✓ ${brandData.length} brands created`)

  // ---------- CATEGORIES ----------
  const catDVR = await db.category.create({ data: { name: 'DVR / XVR / NVR', slug: 'recorders', description: 'Digital video recorders and network video recorders', sortOrder: 1 } })
  const catAnalogCam = await db.category.create({ data: { name: 'Analog Cameras', slug: 'analog-cameras', description: 'HD-TVI, HD-CVI, AHD cameras', sortOrder: 2 } })
  const catIPCam = await db.category.create({ data: { name: 'IP Cameras', slug: 'ip-cameras', description: 'Network and PoE cameras', sortOrder: 3 } })
  const catHDD = await db.category.create({ data: { name: 'HDD / Storage', slug: 'storage', description: 'Surveillance hard drives', sortOrder: 4 } })
  const catSMPS = await db.category.create({ data: { name: 'SMPS / Power Supply', slug: 'smps', description: '12V power supplies', sortOrder: 5 } })
  const catPoE = await db.category.create({ data: { name: 'PoE Devices', slug: 'poe', description: 'PoE switches, injectors, NVRs', sortOrder: 6 } })
  const catCable = await db.category.create({ data: { name: 'Cables', slug: 'cables', description: 'Network, coaxial, and Siamese cables', sortOrder: 7 } })
  const catAcc = await db.category.create({ data: { name: 'Accessories', slug: 'accessories', description: 'Installation, power, networking, cable accessories', sortOrder: 8 } })
  console.log('  ✓ Categories created')

  // ---------- WAREHOUSES ----------
  const whMain = await db.warehouse.create({ data: { name: 'Main Warehouse', code: 'WH-MAIN', address: 'Plot 14, Electronic City Phase 2', city: 'Bengaluru', phone: '+91 80 1234 5678', isActive: true } })
  const whBranch = await db.warehouse.create({ data: { name: 'Branch Stockyard', code: 'WH-BR-01', address: 'Sector 18, Industrial Area', city: 'Noida', phone: '+91 120 9876 543', isActive: true } })
  await db.warehouseLocation.createMany({ data: [
    { warehouseId: whMain.id, rack: 'A1', shelf: '1', bin: 'B' },
    { warehouseId: whMain.id, rack: 'A1', shelf: '2', bin: 'C' },
    { warehouseId: whMain.id, rack: 'B2', shelf: '1', bin: 'A' },
    { warehouseId: whBranch.id, rack: 'C1', shelf: '1', bin: 'A' },
  ]})
  console.log('  ✓ Warehouses created')

  // ---------- SUPPLIERS ----------
  const s1 = await db.supplier.create({ data: { name: 'SurplusTech Distributors', contactPerson: 'Rajesh Kumar', phone: '+91 98200 11122', email: 'sales@surplustech.in', address: 'Mumbai, India', gstNumber: '27ABCDE1234F1Z5' } })
  const s2 = await db.supplier.create({ data: { name: 'SecureVision Supplies', contactPerson: 'Anjali Sharma', phone: '+91 99876 54321', email: 'sales@securevision.in', address: 'Delhi, India', gstNumber: '07FGHIJ5678K1Z2' } })
  console.log('  ✓ Suppliers created')

  // ---------- RULES: Storage Calculation ----------
  const storageRules = [
    { name: '2MP H.264', megapixel: '2MP', codec: 'H.264', bitrateMbps: 4, fps: 25, motionFactor: 0.4, audioOverhead: 0.05 },
    { name: '2MP H.265', megapixel: '2MP', codec: 'H.265', bitrateMbps: 2, fps: 25, motionFactor: 0.4, audioOverhead: 0.05 },
    { name: '2MP H.265+', megapixel: '2MP', codec: 'H.265+', bitrateMbps: 1.2, fps: 25, motionFactor: 0.3, audioOverhead: 0.05 },
    { name: '4MP H.264', megapixel: '4MP', codec: 'H.264', bitrateMbps: 8, fps: 25, motionFactor: 0.4, audioOverhead: 0.05 },
    { name: '4MP H.265', megapixel: '4MP', codec: 'H.265', bitrateMbps: 4, fps: 25, motionFactor: 0.4, audioOverhead: 0.05 },
    { name: '4MP H.265+', megapixel: '4MP', codec: 'H.265+', bitrateMbps: 2.5, fps: 25, motionFactor: 0.3, audioOverhead: 0.05 },
    { name: '5MP H.265', megapixel: '5MP', codec: 'H.265', bitrateMbps: 5, fps: 25, motionFactor: 0.4, audioOverhead: 0.05 },
    { name: '5MP H.265+', megapixel: '5MP', codec: 'H.265+', bitrateMbps: 3, fps: 25, motionFactor: 0.3, audioOverhead: 0.05 },
    { name: '8MP H.265', megapixel: '8MP', codec: 'H.265', bitrateMbps: 8, fps: 25, motionFactor: 0.4, audioOverhead: 0.05 },
    { name: '8MP H.265+', megapixel: '8MP', codec: 'H.265+', bitrateMbps: 5, fps: 25, motionFactor: 0.3, audioOverhead: 0.05 },
    { name: '4K H.265', megapixel: '4K', codec: 'H.265', bitrateMbps: 12, fps: 30, motionFactor: 0.4, audioOverhead: 0.05 },
    { name: '4K H.265+', megapixel: '4K', codec: 'H.265+', bitrateMbps: 7, fps: 30, motionFactor: 0.3, audioOverhead: 0.05 },
  ]
  for (const r of storageRules) await db.storageCalculationRule.create({ data: r })
  console.log(`  ✓ ${storageRules.length} storage calculation rules`)

  // ---------- RULES: Power Calculation ----------
  const powerRules = [
    { name: 'Analog Dome Camera', productType: 'ANALOG_CAMERA', wattage: 4, safetyMarginPercent: 20 },
    { name: 'Analog Bullet Camera', productType: 'ANALOG_CAMERA', wattage: 5, safetyMarginPercent: 20 },
    { name: 'Analog PTZ Camera', productType: 'ANALOG_CAMERA', wattage: 25, safetyMarginPercent: 25 },
    { name: 'IP Dome Camera', productType: 'IP_CAMERA', wattage: 6, safetyMarginPercent: 20 },
    { name: 'IP Bullet Camera', productType: 'IP_CAMERA', wattage: 7, safetyMarginPercent: 20 },
    { name: 'IP PTZ Camera', productType: 'IP_CAMERA', wattage: 35, safetyMarginPercent: 25 },
    { name: 'DVR (8CH)', productType: 'DVR', wattage: 25, safetyMarginPercent: 15 },
    { name: 'DVR (16CH)', productType: 'DVR', wattage: 35, safetyMarginPercent: 15 },
    { name: 'NVR (16CH)', productType: 'NVR', wattage: 40, safetyMarginPercent: 15 },
    { name: 'NVR (32CH)', productType: 'NVR', wattage: 60, safetyMarginPercent: 15 },
  ]
  for (const r of powerRules) await db.powerCalculationRule.create({ data: r })
  console.log(`  ✓ ${powerRules.length} power calculation rules`)

  // ---------- RULES: Cable Calculation ----------
  const cableRules = [
    { name: 'Cat6 (IP system)', cableType: 'CAT6', systemType: 'IP', rollLengthM: 305, wastagePercent: 10 },
    { name: 'Cat6 Outdoor (IP system)', cableType: 'CAT6_OUTDOOR', systemType: 'IP', rollLengthM: 305, wastagePercent: 10 },
    { name: 'Cat6 Pure Copper (IP system)', cableType: 'CAT6_PURE_COPPER', systemType: 'IP', rollLengthM: 305, wastagePercent: 10 },
    { name: 'Cat5e (IP system)', cableType: 'CAT5E', systemType: 'IP', rollLengthM: 305, wastagePercent: 10 },
    { name: 'RG59 Siamese (Analog system)', cableType: 'SIAMESE', systemType: 'ANALOG', rollLengthM: 100, wastagePercent: 10 },
    { name: 'RG59 Coax+Power (Analog system)', cableType: 'RG59', systemType: 'ANALOG', rollLengthM: 100, wastagePercent: 10 },
    { name: 'RG6 (Analog system)', cableType: 'RG6', systemType: 'ANALOG', rollLengthM: 100, wastagePercent: 10 },
  ]
  for (const r of cableRules) await db.cableCalculationRule.create({ data: r })
  console.log(`  ✓ ${cableRules.length} cable calculation rules`)

  // ---------- RULES: Compatibility ----------
  const compatRules = [
    { name: 'IP camera requires NVR', ruleType: 'RECORDER_TECH', sourceType: 'IP_CAMERA', targetType: 'NVR', sourceAttr: JSON.stringify({ technology: 'IP' }), targetAttr: JSON.stringify({ productType: 'NVR' }), severity: 'ERROR', description: 'IP cameras require an NVR (not a DVR/XVR).' },
    { name: 'Analog camera requires DVR/XVR', ruleType: 'RECORDER_TECH', sourceType: 'ANALOG_CAMERA', targetType: 'DVR', sourceAttr: JSON.stringify({ technology: { in: ['TVI', 'CVI', 'AHD', 'Analog'] } }), targetAttr: JSON.stringify({ productType: { in: ['DVR', 'XVR'] } }), severity: 'ERROR', description: 'Analog cameras require a DVR or XVR.' },
    { name: 'Camera count <= recorder channels', ruleType: 'CHANNEL_COUNT', sourceType: 'CAMERA', targetType: 'RECORDER', severity: 'ERROR', description: 'Total camera count cannot exceed recorder channel capacity.' },
    { name: 'Camera resolution <= recorder support', ruleType: 'RESOLUTION_SUPPORT', sourceType: 'CAMERA', targetType: 'RECORDER', severity: 'WARNING', description: 'Recorder should support the megapixel rating of all connected cameras.' },
    { name: 'PoE power budget covers cameras', ruleType: 'POE_POWER', sourceType: 'IP_CAMERA', targetType: 'POE_SWITCH', severity: 'ERROR', description: 'PoE switch power budget must cover total camera wattage.' },
    { name: 'Cable type matches system', ruleType: 'CABLE_MATCH', sourceType: 'CAMERA', targetType: 'CABLE', severity: 'WARNING', description: 'Cable type should match the system (Cat6 for IP, Siamese/RG59 for Analog).' },
    { name: 'HDD retention matches requirement', ruleType: 'STORAGE_RETENTION', sourceType: 'CAMERA', targetType: 'HDD', severity: 'WARNING', description: 'Selected HDD should provide retention days close to the customer requirement.' },
  ]
  for (const r of compatRules) await db.compatibilityRule.create({ data: r })
  console.log(`  ✓ ${compatRules.length} compatibility rules`)

  // ---------- ACCESSORY RECOMMENDATION RULES ----------
  const accRules = [
    { name: 'Junction box per camera', systemType: '*', trigger: JSON.stringify({ cameraCount: '>0' }), accessoryCategory: 'Junction Box', qtyPerCamera: 1, description: 'One junction box per outdoor camera install' },
    { name: 'Camera mount per camera', systemType: '*', trigger: JSON.stringify({ cameraCount: '>0' }), accessoryCategory: 'Camera Bracket', qtyPerCamera: 1, description: 'Mounting bracket per camera' },
    { name: 'Cable clips per camera', systemType: '*', trigger: JSON.stringify({ cameraCount: '>0' }), accessoryCategory: 'Cable Clips', qtyPerCamera: 1, description: 'Packs of cable clips for clean wiring' },
    { name: 'UPS for recorder', systemType: '*', trigger: JSON.stringify({ cameraCount: '>0' }), accessoryCategory: 'UPS', qtyPerCamera: 0.1, description: 'One UPS per setup to keep recorder running' },
    { name: 'HDMI cable for monitor', systemType: '*', trigger: JSON.stringify({ recorderCount: '>0' }), accessoryCategory: 'HDMI Cable', qtyPerCamera: 0.1, description: 'HDMI cable to connect recorder to monitor' },
    { name: 'RJ45 connectors (IP)', systemType: 'IP', trigger: JSON.stringify({ cameraCount: '>0' }), accessoryCategory: 'RJ45 Connector', qtyPerCamera: 2, description: 'Two RJ45 connectors per IP camera run' },
    { name: 'BNC connectors (Analog)', systemType: 'ANALOG', trigger: JSON.stringify({ cameraCount: '>0' }), accessoryCategory: 'BNC Connector', qtyPerCamera: 2, description: 'Two BNC connectors per analog camera run' },
  ]
  for (const r of accRules) await db.accessoryRecommendationRule.create({ data: r })
  console.log(`  ✓ ${accRules.length} accessory recommendation rules`)

  // ---------- PRODUCTS ----------
  type ProductSeed = {
    sku: string; name: string; modelNumber: string; brand: string; category: string;
    productType: string; variety?: string; technology?: string; megapixel?: string; channels?: number;
    shortDescription: string; longDescription?: string;
    keySpecs: Record<string, string>; features: string[];
    images: string[]; isFeatured?: boolean;
    mrp: number; salePrice: number; dealerPrice?: number; purchasePrice?: number;
    gstRate?: number; discountPercent?: number;
    stock: number; lowStockThreshold?: number;
    learningTitle: string; learningSimple: string; learningTech?: string;
  }

  const products: ProductSeed[] = [
    // ============ DVRs / XVRs / NVRs ============
    {
      sku: 'HK-DVR-8CH-01', name: '8-Channel 4K XVR', modelNumber: 'DS-7208HQHI-K1', brand: 'hikvision', category: 'recorders',
      productType: 'DVR', variety: 'XVR', technology: 'TVI', channels: 8,
      shortDescription: '8-channel XVR supporting up to 4K resolution with H.265+ compression.',
      longDescription: 'AcuSense 8-channel XVR with support for TVI, AHD, CVI, CVBS and IP cameras. Supports 4K output and H.265+ compression for efficient storage.',
      keySpecs: { Channels: '8CH', MaxResolution: '4K', Compression: 'H.265+/H.265/H.264', HDD: 'Up to 10TB SATA', Audio: '1ch in / 1ch out', Network: 'RJ45 10/100M' },
      features: ['H.265+ Compression', '4K Output Support', 'AcuSense AI', 'Supports Analog & IP Cameras', 'Mobile App Support'],
      images: ['https://images.unsplash.com/photo-1557599401-4c8b2656f6c4?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1581092160562-40aa08edb547?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 14500, salePrice: 11990, dealerPrice: 10200, purchasePrice: 9500, discountPercent: 17,
      stock: 25, lowStockThreshold: 5,
      learningTitle: 'What is an XVR?',
      learningSimple: 'An XVR is a flexible recorder that works with older analog cameras (TVI/CVI/AHD) AND newer IP cameras, so you can mix technologies on one recorder.',
      learningTech: 'XVR = Cross/Extended Video Recorder. Supports HDCVI, AHD, CVBS, TVI and IP inputs on a single BNC port. Channel capacity defines how many cameras can be connected.',
    },
    {
      sku: 'HK-NVR-16CH-01', name: '16-Channel PoE NVR', modelNumber: 'DS-7616NI-K2/16P', brand: 'hikvision', category: 'recorders',
      productType: 'NVR', variety: 'NVR', technology: 'IP', channels: 16,
      shortDescription: '16-channel PoE NVR with built-in 16-port PoE switch and up to 4K recording.',
      longDescription: 'Professional NVR with 16 built-in PoE ports, supports up to 12MP cameras, H.265+ compression, and up to 40TB storage via 2 SATA interfaces.',
      keySpecs: { Channels: '16CH', MaxResolution: '12MP', Compression: 'H.265+/H.265', PoEPorts: '16 × 200W', HDD: '2 × SATA up to 10TB each', Decoding: '4K @ 30fps' },
      features: ['Built-in 16-Port PoE', 'H.265+ Compression', '12MP Camera Support', 'Dual HDD Support', '4K HDMI Output'],
      images: ['https://images.unsplash.com/photo-1581092160562-40aa08edb547?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1557599401-4c8b2656f6c4?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 38500, salePrice: 32990, dealerPrice: 29500, purchasePrice: 27800, discountPercent: 14,
      stock: 12, lowStockThreshold: 4,
      learningTitle: 'What is an NVR?',
      learningSimple: 'An NVR records video from IP cameras. With built-in PoE, you just plug cameras into the NVR — no extra switch needed.',
      learningTech: 'NVR = Network Video Recorder. Processes digital IP streams via RJ45. PoE NVR combines power and data on one Cat5e/6 cable per camera.',
    },
    {
      sku: 'DH-XVR-16CH-01', name: '16-Channel Cooper XVR', modelNumber: 'DH-XVR5108H-4KL-I3', brand: 'dahua', category: 'recorders',
      productType: 'XVR', variety: 'XVR', technology: 'TVI', channels: 16,
      shortDescription: '16-channel 4K XVR with H.265+ compression and AI features.',
      longDescription: 'Cooper series XVR supporting up to 4K resolution, H.265+ compression, AI-perimeter protection, and SMD Plus for smarter motion detection.',
      keySpecs: { Channels: '16CH', MaxResolution: '4K', Compression: 'H.265+', HDD: '1 × SATA up to 10TB', AI: 'SMD Plus, Perimeter', Audio: '2ch in / 1ch out' },
      features: ['H.265+ Compression', 'AI Perimeter Protection', 'SMD Plus', '4K Resolution', 'Cloud Access'],
      images: ['https://images.unsplash.com/photo-1597852074816-d5ce82f50c22?auto=format&fit=crop&w=800&q=80'],
      mrp: 22500, salePrice: 18990, dealerPrice: 16200, purchasePrice: 15000, discountPercent: 16,
      stock: 18, lowStockThreshold: 5,
      learningTitle: 'What is H.265+ compression?',
      learningSimple: 'H.265+ is a smarter compression that uses up to 50% less storage than older H.264, so you can record longer on the same hard drive.',
      learningTech: 'H.265+ extends HEVC with predictive frame encoding and adaptive GOP. Typical bitrate reduction: 50% vs H.264, 30% vs vanilla H.265.',
    },
    {
      sku: 'CP-DVR-4CH-01', name: '4-Channel Compact DVR', modelNumber: 'CP-UNC-D0412-PB1', brand: 'cp-plus', category: 'recorders',
      productType: 'DVR', variety: 'DVR', technology: 'TVI', channels: 4,
      shortDescription: 'Compact 4-channel DVR for small installations, supports up to 5MP cameras.',
      longDescription: 'Affordable entry-level DVR supporting 5MP TVI cameras, mobile app access, and H.264+ compression.',
      keySpecs: { Channels: '4CH', MaxResolution: '5MP', Compression: 'H.264+', HDD: '1 × SATA up to 6TB', Network: '10/100M' },
      features: ['Compact Size', 'Mobile App Support', 'H.264+ Compression', '5MP Support'],
      images: ['https://images.unsplash.com/photo-1581092334651-ddf8b1c0f7c9?auto=format&fit=crop&w=800&q=80'],
      mrp: 6500, salePrice: 4990, dealerPrice: 4100, purchasePrice: 3800, discountPercent: 23,
      stock: 32, lowStockThreshold: 8,
      learningTitle: 'DVR vs NVR — which to choose?',
      learningSimple: 'Use a DVR for older/cheaper analog cameras (coax cable). Use an NVR for IP cameras (network cable) — better quality but slightly higher cost.',
      learningTech: 'DVR digitizes analog camera signals at the recorder. NVR receives already-digital streams from IP cameras. The signal path differs from the camera onwards.',
    },
    {
      sku: 'UV-NVR-32CH-01', name: '32-Channel Enterprise NVR', modelNumber: 'NVR301-32Q', brand: 'uniview', category: 'recorders',
      productType: 'NVR', variety: 'NVR', technology: 'IP', channels: 32,
      shortDescription: '32-channel enterprise NVR with 4K recording and RAID-ready storage.',
      longDescription: 'High-end enterprise NVR supporting 32 IP cameras, RAID configurations, up to 80TB storage across 8 SATA bays, and 4K live view output.',
      keySpecs: { Channels: '32CH', MaxResolution: '4K', Compression: 'H.265+/H.265', HDD: '8 × SATA up to 10TB each', Decoding: '4K @ 60fps' },
      features: ['RAID 0/1/5/6/10', '8-Bay Storage', 'Dual Gigabit NIC', '4K @ 60fps Decoding', 'Hot Swap HDD'],
      images: ['https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 78500, salePrice: 67990, dealerPrice: 62000, purchasePrice: 58500, discountPercent: 13,
      stock: 6, lowStockThreshold: 3,
      learningTitle: 'When do I need RAID?',
      learningSimple: 'RAID mirrors or stripes data across multiple drives so that one drive failing does not lose all footage. Critical for 16+ camera systems.',
      learningTech: 'RAID 5 = block-level striping with distributed parity. Survives 1 drive failure. RAID 6 = dual parity, survives 2 failures. RAID 10 = mirror+stripe.',
    },

    // ============ ANALOG CAMERAS ============
    {
      sku: 'HK-AN-DOME-2MP-01', name: '2MP IR Dome Camera', modelNumber: 'DS-2CE56D0T-IRP', brand: 'hikvision', category: 'analog-cameras',
      productType: 'ANALOG_CAMERA', variety: 'Dome', technology: 'TVI', megapixel: '2MP',
      shortDescription: '2MP TVI dome camera with 20m IR night vision.',
      longDescription: 'Compact indoor dome with 2MP resolution, EXIR night vision up to 20m, and IP54 weather resistance.',
      keySpecs: { Resolution: '2MP (1920×1080)', Lens: '2.8mm Fixed', IRDistance: '20m', WeatherRating: 'IP54', Power: '12V DC' },
      features: ['EXIR Night Vision', '20m IR Distance', 'Fixed 2.8mm Lens', 'IP54 Rated', 'Indoor Use'],
      images: ['https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1597852074816-d5ce82f50c22?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 1850, salePrice: 1490, dealerPrice: 1150, purchasePrice: 1020, discountPercent: 19,
      stock: 145, lowStockThreshold: 20,
      learningTitle: 'Dome vs Bullet cameras',
      learningSimple: 'Dome cameras are more discreet and harder to tamper with — great for indoor use. Bullet cameras are easier to mount outdoors and offer longer IR range.',
      learningTech: 'Dome housings shield the lens direction from onlookers. Bullet cameras expose the lens and IR LED array directly, which improves IR throw distance.',
    },
    {
      sku: 'HK-AN-BULLET-4MP-01', name: '4MP IR Bullet Camera', modelNumber: 'DS-2CE16D0T-IRPF', brand: 'hikvision', category: 'analog-cameras',
      productType: 'ANALOG_CAMERA', variety: 'Bullet', technology: 'TVI', megapixel: '4MP',
      shortDescription: '4MP TVI bullet with 30m IR night vision and IP67 rating.',
      longDescription: 'Outdoor bullet camera with 4MP resolution, EXIR 2.0 night vision up to 30m, and IP67 weatherproof housing.',
      keySpecs: { Resolution: '4MP (2560×1440)', Lens: '2.8mm Fixed', IRDistance: '30m', WeatherRating: 'IP67', Power: '12V DC' },
      features: ['4MP Resolution', 'EXIR 2.0 Night Vision', '30m IR Distance', 'IP67 Rated', 'Outdoor Use'],
      images: ['https://images.unsplash.com/photo-1597852074816-d5ce82f50c22?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 2450, salePrice: 1990, dealerPrice: 1650, purchasePrice: 1480, discountPercent: 19,
      stock: 168, lowStockThreshold: 25,
      learningTitle: 'What does IP67 mean?',
      learningSimple: 'IP67 means the camera is fully dust-tight and can survive being briefly submerged in water. Perfect for outdoor installation in rain.',
      learningTech: 'IP rating: First digit = solids (6 = dust-tight). Second digit = liquids (7 = immersion up to 1m for 30 minutes).',
    },
    {
      sku: 'HK-AN-TURRET-4MP-01', name: '4MP ColorVu Turret', modelNumber: 'DS-2CE70D0T-PF', brand: 'hikvision', category: 'analog-cameras',
      productType: 'ANALOG_CAMERA', variety: 'Turret', technology: 'TVI', megapixel: '4MP',
      shortDescription: '4MP ColorVu turret with 24/7 color imaging and built-in mic.',
      longDescription: 'ColorVu technology delivers full-color images even in low light down to 0.005 lux. Built-in microphone for audio recording.',
      keySpecs: { Resolution: '4MP', Lens: '2.8mm Fixed', LowLight: '0.005 lux @ F1.0', Audio: 'Built-in Mic', IRDistance: '40m (with IR)' },
      features: ['ColorVu 24/7 Color', 'Built-in Microphone', '40m IR Distance', 'IP67 Rated', 'No Spider Web Issue'],
      images: ['https://images.unsplash.com/photo-1581092334651-ddf8b1c0f7c9?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 3250, salePrice: 2690, dealerPrice: 2250, purchasePrice: 2050, discountPercent: 17,
      stock: 92, lowStockThreshold: 15,
      learningTitle: 'What is Color Night Vision?',
      learningSimple: 'ColorVu cameras use a special lens and sensor to keep showing color images in low light — useful for identifying clothing and vehicle colors at night.',
      learningTech: 'ColorVu uses F1.0 large-aperture lens + back-illuminated sensor. Threshold approx 0.005 lux (twilight). Below that, optional supplemental IR turns on.',
    },
    {
      sku: 'DH-AN-PTZ-4K-01', name: '4K AI PTZ Camera', modelNumber: 'DH-SD49225XA-HNR', brand: 'dahua', category: 'analog-cameras',
      productType: 'ANALOG_CAMERA', variety: 'PTZ', technology: 'TVI', megapixel: '8MP',
      shortDescription: '4K PTZ with 25× optical zoom, AI auto-tracking, and 100m IR.',
      longDescription: 'High-performance 4K PTZ camera with 25× optical zoom, AI-powered auto-tracking, IR illumination up to 100m, and IP67 protection.',
      keySpecs: { Resolution: '8MP (4K)', Zoom: '25× Optical', IRDistance: '100m', Presets: '300 Presets', WeatherRating: 'IP67' },
      features: ['25× Optical Zoom', 'AI Auto-Tracking', '100m IR Distance', '300 Preset Positions', 'Auto Pan/Tilt'],
      images: ['https://images.unsplash.com/photo-1597852074816-d5ce82f50c22?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 38500, salePrice: 32990, dealerPrice: 29500, purchasePrice: 27800, discountPercent: 14,
      stock: 9, lowStockThreshold: 3,
      learningTitle: 'When do you need a PTZ camera?',
      learningSimple: 'PTZ (Pan-Tilt-Zoom) cameras rotate and zoom — ideal for large open areas like yards or warehouses where one camera needs to cover a wide area.',
      learningTech: 'PTZ cameras combine servo motors (pan/tilt) with motorized optical zoom lens. AI auto-tracking uses object detection to keep targets in frame.',
    },
    {
      sku: 'CP-AN-BULLET-5MP-01', name: '5MP IR Bullet Camera', modelNumber: 'CP-UNC-BC13E1', brand: 'cp-plus', category: 'analog-cameras',
      productType: 'ANALOG_CAMERA', variety: 'Bullet', technology: 'AHD', megapixel: '5MP',
      shortDescription: '5MP AHD bullet with 30m IR and motorized zoom.',
      longDescription: 'Affordable 5MP AHD bullet camera with motorized 2.8-12mm varifocal lens, 30m IR night vision, and IP66 rating.',
      keySpecs: { Resolution: '5MP', Lens: '2.8-12mm Motorized', IRDistance: '30m', WeatherRating: 'IP66', Power: '12V DC' },
      features: ['Motorized Varifocal', '5MP Resolution', '30m IR Distance', 'IP66 Rated'],
      images: ['https://images.unsplash.com/photo-1597852074816-d5ce82f50c22?auto=format&fit=crop&w=800&q=80'],
      mrp: 3850, salePrice: 2990, dealerPrice: 2450, purchasePrice: 2250, discountPercent: 22,
      stock: 78, lowStockThreshold: 12,
      learningTitle: 'What is a Motorized Varifocal lens?',
      learningSimple: 'You can zoom in/out and adjust focus remotely from the recorder — no ladder needed to fine-tune the view.',
      learningTech: 'Varifocal = adjustable focal length (e.g. 2.8-12mm). Motorized = servo-driven, controlled via coaxial (UTC) or OSD joystick.',
    },

    // ============ IP CAMERAS ============
    {
      sku: 'HK-IP-DOME-4MP-01', name: '4MP IP Dome Camera', modelNumber: 'DS-2CD2143G2-I', brand: 'hikvision', category: 'ip-cameras',
      productType: 'IP_CAMERA', variety: 'Dome', technology: 'IP', megapixel: '4MP',
      shortDescription: '4MP PoE dome with AcuSense AI and IR night vision.',
      longDescription: 'AcuSense 4MP IP dome with built-in PoE, IR night vision up to 30m, and AI-based human/vehicle detection to reduce false alarms.',
      keySpecs: { Resolution: '4MP', Lens: '2.8mm Fixed', IRDistance: '30m', Power: 'PoE 802.3af', WeatherRating: 'IP67', AI: 'AcuSense Human/Vehicle' },
      features: ['PoE 802.3af', 'AcuSense AI', '30m IR Distance', 'IP67 Rated', 'H.265+ Compression'],
      images: ['https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1597852074816-d5ce82f50c22?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 4250, salePrice: 3490, dealerPrice: 2950, purchasePrice: 2780, discountPercent: 18,
      stock: 124, lowStockThreshold: 20,
      learningTitle: 'What is PoE?',
      learningSimple: 'PoE (Power over Ethernet) sends both power and data through one Ethernet cable — no separate power adapter needed. Easier and cleaner to install.',
      learningTech: 'IEEE 802.3af (15.4W), 802.3at (30W PoE+), 802.3bt (60W/90W PoE++). Negotiated via signature resistance on idle pairs.',
    },
    {
      sku: 'HK-IP-BULLET-4MP-01', name: '4MP ColorVu IP Bullet', modelNumber: 'DS-2CD2T47G2-L', brand: 'hikvision', category: 'ip-cameras',
      productType: 'IP_CAMERA', variety: 'Bullet', technology: 'IP', megapixel: '4MP',
      shortDescription: '4MP IP bullet with ColorVu, PoE, and built-in mic.',
      longDescription: 'ColorVu IP bullet camera with full-color night vision, two-way audio support, PoE, and IP67 weatherproof rating.',
      keySpecs: { Resolution: '4MP', Lens: '2.8mm Fixed', LowLight: '0.005 lux', Power: 'PoE 802.3af', Audio: 'Two-Way Talk' },
      features: ['ColorVu Night Vision', 'PoE Powered', 'Two-Way Audio', 'Built-in Mic', 'IP67 Rated'],
      images: ['https://images.unsplash.com/photo-1597852074816-d5ce82f50c22?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 4850, salePrice: 3990, dealerPrice: 3450, purchasePrice: 3250, discountPercent: 18,
      stock: 89, lowStockThreshold: 15,
      learningTitle: 'What is Two-Way Talk?',
      learningSimple: 'Two-way talk lets you listen AND speak through the camera using a built-in speaker and mic. Useful for doorbells and gate cameras.',
      learningTech: 'Two-way audio requires bidirectional codec (G.711/G.726). Latency depends on RTSP/WebRTC transport, typically 200-500ms.',
    },
    {
      sku: 'UV-IP-TURRET-8MP-01', name: '8MP AI Turret IP', modelNumber: 'IPC3614SR3-DZC', brand: 'uniview', category: 'ip-cameras',
      productType: 'IP_CAMERA', variety: 'Turret', technology: 'IP', megapixel: '8MP',
      shortDescription: '8MP IP turret with motorized zoom, IR, and AI detection.',
      longDescription: 'Professional 8MP IP turret with motorized 2.8-12mm varifocal lens, IR up to 40m, and built-in AI for human/vehicle detection.',
      keySpecs: { Resolution: '8MP (4K)', Lens: '2.8-12mm Motorized', IRDistance: '40m', Power: 'PoE 802.3at', AI: 'Human/Vehicle Detection' },
      features: ['8MP 4K Resolution', 'Motorized Zoom', 'AI Detection', '40m IR Distance', 'IP67 Rated'],
      images: ['https://images.unsplash.com/photo-1597852074816-d5ce82f50c22?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 8950, salePrice: 7490, dealerPrice: 6500, purchasePrice: 6200, discountPercent: 16,
      stock: 54, lowStockThreshold: 10,
      learningTitle: 'What is 4K resolution?',
      learningSimple: '4K cameras capture 8 million pixels per frame — about 4× the detail of 1080p. Best when you need to read license plates or recognize faces at a distance.',
      learningTech: '4K UHD = 3840×2160 = 8.3 MP. Compare with 1080p (2.1 MP). Requires higher bandwidth: H.265 helps reduce bitrate to ~8 Mbps per stream.',
    },
    {
      sku: 'HK-IP-PTZ-4MP-01', name: '4MP Network PTZ Camera', modelNumber: 'DS-2DE4225IW-DE', brand: 'hikvision', category: 'ip-cameras',
      productType: 'IP_CAMERA', variety: 'PTZ', technology: 'IP', megapixel: '4MP',
      shortDescription: '4MP IP PTZ with 25× optical zoom, PoE+, and DarkFighter.',
      longDescription: 'Network PTZ with 25× optical zoom, DarkFighter low-light technology, AI auto-tracking, and PoE+ power.',
      keySpecs: { Resolution: '4MP', Zoom: '25× Optical', IRDistance: '50m', Power: 'PoE+ 802.3at', AI: 'Auto-Tracking' },
      features: ['25× Optical Zoom', 'DarkFighter Low-Light', 'AI Auto-Tracking', 'PoE+ Powered', '300 Presets'],
      images: ['https://images.unsplash.com/photo-1597852074816-d5ce82f50c22?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 42500, salePrice: 36990, dealerPrice: 33000, purchasePrice: 31500, discountPercent: 13,
      stock: 8, lowStockThreshold: 3,
      learningTitle: 'What is DarkFighter?',
      learningSimple: 'DarkFighter is Hikvision\'s technology for capturing color in extremely low light (close to darkness) without turning on IR.',
      learningTech: 'DarkFighter uses back-illuminated CMOS + advanced ISP + F1.2 lens. Effective down to 0.001 lux, capturing color where standard cameras switch to B&W IR.',
    },
    {
      sku: 'CP-IP-BULLET-2MP-01', name: '2MP IP Bullet Camera', modelNumber: 'CP-IND-BC13E1', brand: 'cp-plus', category: 'ip-cameras',
      productType: 'IP_CAMERA', variety: 'Bullet', technology: 'IP', megapixel: '2MP',
      shortDescription: 'Affordable 2MP PoE bullet for small business installations.',
      longDescription: 'Budget-friendly 2MP IP bullet camera with PoE, IR night vision up to 20m, and IP66 rating.',
      keySpecs: { Resolution: '2MP (1080p)', Lens: '3.6mm Fixed', IRDistance: '20m', Power: 'PoE 802.3af', WeatherRating: 'IP66' },
      features: ['PoE 802.3af', '2MP Resolution', '20m IR Distance', 'IP66 Rated', 'Mobile App Support'],
      images: ['https://images.unsplash.com/photo-1597852074816-d5ce82f50c22?auto=format&fit=crop&w=800&q=80'],
      mrp: 2850, salePrice: 2290, dealerPrice: 1850, purchasePrice: 1700, discountPercent: 20,
      stock: 215, lowStockThreshold: 30,
      learningTitle: 'Why choose 2MP over 4MP?',
      learningSimple: '2MP uses less storage and bandwidth — good for large properties with many cameras where you mostly want general coverage, not fine detail.',
      learningTech: '2MP = 1080p = 2.07 MP. Uses ~2 Mbps H.265 stream. 4MP uses ~4 Mbps. Storage cost roughly doubles for 4MP at same retention.',
    },

    // ============ HDD ============
    {
      sku: 'ST-HDD-1TB-01', name: 'SkyHawk 1TB Surveillance HDD', modelNumber: 'ST1000VX005', brand: 'seagate', category: 'storage',
      productType: 'HDD', variety: 'Surveillance',
      shortDescription: '1TB surveillance-grade HDD with 64MB cache and 3-year warranty.',
      longDescription: 'Seagate SkyHawk 1TB engineered for 24/7 surveillance workloads with ImagePerfect AI firmware supporting 32 AI streams.',
      keySpecs: { Capacity: '1TB', RPM: '5400', Cache: '64MB', Workload: '180TB/year', Warranty: '3 Years' },
      features: ['ImagePerfect AI', '24/7 Workload', '64MB Cache', '3-Year Warranty', 'SATA 6Gb/s'],
      images: ['https://images.unsplash.com/photo-1597872200949-5e9c0c0b9d7b?auto=format&fit=crop&w=800&q=80'],
      mrp: 4500, salePrice: 3690, dealerPrice: 3050, purchasePrice: 2850, discountPercent: 18,
      stock: 45, lowStockThreshold: 8,
      learningTitle: 'Why a surveillance HDD, not a regular one?',
      learningSimple: 'Surveillance HDDs are built to write 24/7 from multiple cameras without missing frames. Regular PC drives can drop frames under sustained write load.',
      learningTech: 'Surveillance HDDs use ImagePerfect firmware tuned for sustained writes (vs desktop random R/W). MTBF ~1M hours. Workload rating 180TB/year vs 55TB/year on desktop drives.',
    },
    {
      sku: 'ST-HDD-4TB-01', name: 'SkyHawk 4TB Surveillance HDD', modelNumber: 'ST4000VX013', brand: 'seagate', category: 'storage',
      productType: 'HDD', variety: 'Surveillance',
      shortDescription: '4TB surveillance HDD with 180TB/year workload rating.',
      longDescription: 'SkyHawk 4TB surveillance drive with ImagePerfect AI, 64MB cache, and support for up to 64 cameras.',
      keySpecs: { Capacity: '4TB', RPM: '5400', Cache: '256MB', Workload: '180TB/year', Warranty: '3 Years' },
      features: ['ImagePerfect AI', '64 Camera Support', '256MB Cache', '3-Year Warranty'],
      images: ['https://images.unsplash.com/photo-1597872200949-5e9c0c0b9d7b?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 9500, salePrice: 7990, dealerPrice: 6800, purchasePrice: 6400, discountPercent: 16,
      stock: 38, lowStockThreshold: 6,
      learningTitle: 'How much storage do I need?',
      learningSimple: 'A rough rule: 1TB ≈ 4-7 days for 4 × 4MP cameras at H.265. Add cameras or reduce compression → less retention. Use the calculator to be sure.',
      learningTech: 'Formula: storage (GB) = (bitrate Mbps × 3600 × hours_per_day × num_cameras) / (8 × 1024) × retention_days × motion_factor.',
    },
    {
      sku: 'WD-HDD-6TB-01', name: 'Purple 6TB Surveillance HDD', modelNumber: 'WD60PURZ', brand: 'wd', category: 'storage',
      productType: 'HDD', variety: 'Surveillance',
      shortDescription: '6TB Western Digital Purple drive engineered for surveillance workloads.',
      longDescription: 'WD Purple 6TB with AllFrame AI technology, supports up to 32 HD cameras, and 5-year limited warranty.',
      keySpecs: { Capacity: '6TB', RPM: '7200', Cache: '256MB', Workload: '180TB/year', Warranty: '5 Years' },
      features: ['AllFrame AI', '32 Camera Support', '256MB Cache', '5-Year Warranty', '7200 RPM'],
      images: ['https://images.unsplash.com/photo-1597872200949-5e9c0c0b9d7b?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 15500, salePrice: 12990, dealerPrice: 11200, purchasePrice: 10600, discountPercent: 16,
      stock: 28, lowStockThreshold: 5,
      learningTitle: 'What is AllFrame AI?',
      learningSimple: 'AllFrame AI is WD\'s firmware that reduces frame loss and supports AI metadata streaming from AI-enabled cameras.',
      learningTech: 'AllFrame AI firmware caches ATA streaming commands and supports up to 32 AI streams. Reduces dropped frames during heavy workloads.',
    },
    {
      sku: 'ST-HDD-8TB-01', name: 'SkyHawk AI 8TB Surveillance HDD', modelNumber: 'ST8000XE001', brand: 'seagate', category: 'storage',
      productType: 'HDD', variety: 'Surveillance',
      shortDescription: '8TB SkyHawk AI drive for AI-enabled surveillance systems.',
      longDescription: 'Enterprise-grade SkyHawk AI 8TB with 550TB/year workload, 2M hours MTBF, and support for up to 64 AI streams.',
      keySpecs: { Capacity: '8TB', RPM: '7200', Cache: '256MB', Workload: '550TB/year', Warranty: '5 Years' },
      features: ['550TB/year Workload', '64 AI Stream Support', '2M Hour MTBF', '5-Year Warranty', 'RV Sensors'],
      images: ['https://images.unsplash.com/photo-1597872200949-5e9c0c0b9d7b?auto=format&fit=crop&w=800&q=80'],
      mrp: 22500, salePrice: 18990, dealerPrice: 16500, purchasePrice: 15500, discountPercent: 16,
      stock: 18, lowStockThreshold: 4,
      learningTitle: 'When do you need an 8TB+ drive?',
      learningSimple: 'For 8+ cameras at 4MP+ resolution with 15+ days retention, or for systems recording at 4K. Bigger drives reduce hardware footprint.',
      learningTech: 'SkyHawk AI = enterprise workload (550TB/yr) vs SkyHawk standard (180TB/yr). Includes rotational vibration sensors for RAID/NVR use.',
    },

    // ============ SMPS / Power ============
    {
      sku: 'MK-SMPS-12V2A-01', name: '12V 2A Power Adapter', modelNumber: 'MK-12V2A', brand: 'microtek', category: 'smps',
      productType: 'SMPS', variety: '12V 2A',
      shortDescription: '12V 2A individual camera power adapter.',
      longDescription: 'Compact 12V 2A SMPS adapter for single camera or accessory power.',
      keySpecs: { Voltage: '12V DC', Current: '2A', Wattage: '24W', Input: '100-240V AC', Connector: '5.5×2.1mm' },
      features: ['Single Camera Power', 'Compact Design', 'Short Circuit Protection', 'Overload Protection'],
      images: ['https://images.unsplash.com/photo-1581092160562-40aa08edb547?auto=format&fit=crop&w=800&q=80'],
      mrp: 350, salePrice: 250, dealerPrice: 180, purchasePrice: 150, discountPercent: 29,
      stock: 320, lowStockThreshold: 50,
      learningTitle: 'When to use a 2A adapter?',
      learningSimple: 'A single 2A adapter powers one analog or non-PoE IP camera. Most cameras draw under 1A, so 2A gives headroom.',
      learningTech: 'Cameras typically draw 0.3-0.7A @ 12V. 2A = 24W capacity. Always size adapter 30-50% above peak draw to avoid overheating.',
    },
    {
      sku: 'MK-SMPS-12V10A-01', name: '12V 10A SMPS Box', modelNumber: 'MK-12V10A-BOX', brand: 'microtek', category: 'smps',
      productType: 'SMPS', variety: '12V 10A',
      shortDescription: 'Metal-cased 12V 10A SMPS distribution box for multi-camera installs.',
      longDescription: 'Industrial-grade 12V 10A SMPS with metal housing, fuse-protected outputs, and LED status indicators.',
      keySpecs: { Voltage: '12V DC', Current: '10A', Wattage: '120W', Outputs: '9 × fused', Input: '220V AC' },
      features: ['9 Fused Outputs', 'Metal Housing', '120W Total Power', 'LED Status', 'Cooling Fan'],
      images: ['https://images.unsplash.com/photo-1581092160562-40aa08edb547?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 1850, salePrice: 1490, dealerPrice: 1150, purchasePrice: 1020, discountPercent: 19,
      stock: 65, lowStockThreshold: 10,
      learningTitle: 'SMPS Box vs Individual Adapters?',
      learningSimple: 'An SMPS distribution box powers 8-9 cameras from one unit, is more reliable, and easier to wire than 9 separate adapters.',
      learningTech: 'Centralized 12V SMPS: lower loss (single AC→DC conversion), easier to add UPS, but fault on the box takes down all cameras. Always fused per channel.',
    },
    {
      sku: 'MK-SMPS-12V20A-01', name: '12V 20A Industrial SMPS', modelNumber: 'MK-12V20A-IND', brand: 'microtek', category: 'smps',
      productType: 'SMPS', variety: '12V 20A',
      shortDescription: 'High-capacity 12V 20A SMPS for 15+ camera analog systems.',
      longDescription: 'Industrial 12V 20A SMPS with active power factor correction, force-cooled heatsink, and 16 fused outputs.',
      keySpecs: { Voltage: '12V DC', Current: '20A', Wattage: '240W', Outputs: '16 × fused', Input: '180-264V AC' },
      features: ['16 Fused Outputs', '240W Power', 'Active PFC', 'Force Cooled', 'Over-Voltage Protection'],
      images: ['https://images.unsplash.com/photo-1581092160562-40aa08edb547?auto=format&fit=crop&w=800&q=80'],
      mrp: 3850, salePrice: 3190, dealerPrice: 2650, purchasePrice: 2450, discountPercent: 17,
      stock: 28, lowStockThreshold: 6,
      learningTitle: 'Calculating power for cameras',
      learningSimple: 'Add up the wattage of all cameras, then add 20% safety margin. Pick an SMPS that exceeds this total.',
      learningTech: 'Total W = Σ(camera W). Required W = Total W × 1.2. Pick SMPS W ≥ Required W. For 16 × 5W cameras: 16×5×1.2 = 96W → use 12V 10A (120W) box.',
    },

    // ============ POE ============
    {
      sku: 'TL-POE-8PORT-01', name: '8-Port PoE Switch (65W)', modelNumber: 'TL-SG1008P', brand: 'tp-link', category: 'poe',
      productType: 'POE_SWITCH', variety: 'PoE Switch',
      shortDescription: '8-port 10/100 PoE switch with 65W total power budget.',
      longDescription: 'Unmanaged 8-port PoE+ switch, IEEE 802.3af/at compliant, 65W total PoE budget, auto-detects PD devices.',
      keySpecs: { Ports: '8 × PoE + 2 × Uplink', PoEBudget: '65W', Standard: '802.3af/at', PerPortMax: '30W', SwitchingCapacity: '5.6 Gbps' },
      features: ['8 × PoE Ports', '65W Total Budget', '802.3af/at', 'Plug & Play', 'Auto Negotiation'],
      images: ['https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 4950, salePrice: 3990, dealerPrice: 3350, purchasePrice: 3150, discountPercent: 19,
      stock: 48, lowStockThreshold: 8,
      learningTitle: 'How to size a PoE switch?',
      learningSimple: 'Add up the wattage of all PoE cameras. The switch\'s total PoE budget must exceed that total. 8 cameras × 8W = 64W → use a 65W switch.',
      learningTech: 'IEEE 802.3af = 15.4W per port (12.95W usable). 802.3at (PoE+) = 30W per port (25.5W usable). Total budget often limits before per-port.',
    },
    {
      sku: 'DL-POE-16PORT-01', name: '16-Port PoE+ Switch (200W)', modelNumber: 'DGS-1210-16P', brand: 'd-link', category: 'poe',
      productType: 'POE_SWITCH', variety: 'PoE Switch',
      shortDescription: '16-port managed PoE+ switch with 200W total budget.',
      longDescription: 'Web-managed 16-port PoE+ switch with 200W PoE budget, VLAN support, QoS, and IGMP snooping for IPTV.',
      keySpecs: { Ports: '16 × PoE + 2 × SFP+Uplink', PoEBudget: '200W', Standard: '802.3at', PerPortMax: '30W', Management: 'Web Managed' },
      features: ['16 PoE+ Ports', '200W Total Budget', 'VLAN Support', 'QoS', 'IGMP Snooping'],
      images: ['https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 18500, salePrice: 15490, dealerPrice: 13200, purchasePrice: 12500, discountPercent: 16,
      stock: 22, lowStockThreshold: 5,
      learningTitle: 'Managed vs Unmanaged PoE Switch?',
      learningSimple: 'Unmanaged = plug and play, no configuration. Managed = you can set VLANs, QoS, and remote power cycle — useful for 16+ camera networks.',
      learningTech: 'Managed switches support VLAN (802.1Q) for camera network isolation, QoS to prioritize video traffic, and PoE scheduling for power-cycle recovery.',
    },
    {
      sku: 'TL-POE-INJ-01', name: 'PoE+ Injector (30W)', modelNumber: 'TL-PoE160S', brand: 'tp-link', category: 'poe',
      productType: 'POE_INJECTOR', variety: 'PoE Injector',
      shortDescription: 'Single-port PoE+ injector up to 30W for one IP camera.',
      longDescription: 'Compact PoE+ injector compliant with IEEE 802.3at, providing up to 30W for a single PD device.',
      keySpecs: { Ports: '1 × PoE', PoEBudget: '30W', Standard: '802.3at', PerPortMax: '30W', Input: '100-240V AC' },
      features: ['Single Port PoE+', '30W Output', '802.3at', 'Compact Size'],
      images: ['https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80'],
      mrp: 1250, salePrice: 990, dealerPrice: 750, purchasePrice: 680, discountPercent: 21,
      stock: 95, lowStockThreshold: 15,
      learningTitle: 'When to use a PoE injector?',
      learningSimple: 'A PoE injector powers a single PoE camera when you do not have a PoE switch — useful for adding one extra camera to an existing network.',
      learningTech: 'PoE injector is a midspan device: injects DC onto the spare pairs (or center taps) of an Ethernet cable. Used at the network edge for one-off camera installs.',
    },

    // ============ CABLES ============
    {
      sku: 'PB-CAT6-305-01', name: 'Cat6 Network Cable 305m Box', modelNumber: 'PB-C6-BOX-305', brand: 'polycab', category: 'cables',
      productType: 'CABLE', variety: 'Cat6',
      shortDescription: '305m box of pure copper Cat6 UTP cable for IP camera installations.',
      longDescription: 'Polycab Cat6 UTP cable, 4-pair 23AWG pure copper, 305m pull box, supports up to 1Gbps at 100m.',
      keySpecs: { CableType: 'CAT6', Length: '305m', Conductor: '23AWG Pure Copper', Pairs: '4 Pair UTP', MaxSpeed: '1Gbps' },
      features: ['305m Roll', 'Pure Copper', '1Gbps Speed', 'LSZH Jacket', 'TIA/EIA-568-B.2'],
      images: ['https://images.unsplash.com/photo-1597852074816-d5ce82f50c22?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 4950, salePrice: 3990, dealerPrice: 3400, purchasePrice: 3250, discountPercent: 19,
      stock: 75, lowStockThreshold: 10,
      learningTitle: 'Cat5e vs Cat6 vs Cat6A?',
      learningSimple: 'Cat5e: 1Gbps up to 100m. Cat6: 1Gbps up to 100m, 10Gbps up to 55m. Cat6A: 10Gbps up to 100m. For most CCTV, Cat6 is plenty.',
      learningTech: 'Higher category = tighter twist rate + spline separator = less crosstalk. Cat6 max freq 250 MHz vs Cat5e 100 MHz. CCTV typically uses < 50 Mbps per camera.',
    },
    {
      sku: 'PB-CAT6-OUT-100-01', name: 'Cat6 Outdoor Cable 100m', modelNumber: 'PB-C6-OUT-100', brand: 'polycab', category: 'cables',
      productType: 'CABLE', variety: 'Cat6 Outdoor',
      shortDescription: '100m outdoor-rated Cat6 cable with PE jacket for weather resistance.',
      longDescription: 'Outdoor Cat6 cable with PE jacket, UV resistant, gel-filled for moisture protection. Ideal for outdoor IP camera runs.',
      keySpecs: { CableType: 'CAT6_OUTDOOR', Length: '100m', Conductor: '23AWG CCA', Jacket: 'PE UV-Resistant', Pairs: '4 Pair U/UTP' },
      features: ['Outdoor Rated', 'UV Resistant', 'Gel-Filled', 'Moisture Protection'],
      images: ['https://images.unsplash.com/photo-1597852074816-d5ce82f50c22?auto=format&fit=crop&w=800&q=80'],
      mrp: 2250, salePrice: 1790, dealerPrice: 1450, purchasePrice: 1320, discountPercent: 20,
      stock: 92, lowStockThreshold: 12,
      learningTitle: 'Why outdoor-rated cable?',
      learningSimple: 'Outdoor cable has a UV-resistant jacket and gel filling to survive sun, rain, and temperature swings. Indoor cable degrades outdoors.',
      learningTech: 'PE jacket has UV stabilizers. Gel filling blocks water migration along the cable. CCA = copper-clad aluminum (cheaper, slightly higher resistance).',
    },
    {
      sku: 'PB-RG59-100-01', name: 'RG59 Siamese Cable 100m', modelNumber: 'PB-RG59-SI-100', brand: 'polycab', category: 'cables',
      productType: 'CABLE', variety: 'Siamese',
      shortDescription: '100m RG59 Siamese cable (coax + power) for analog camera installations.',
      longDescription: 'Siamese cable combines RG59 coax for video and 2-core power cable in a single jacket. Ideal for analog CCTV.',
      keySpecs: { CableType: 'SIAMESE', Length: '100m', Coax: 'RG59 95% Braided', Power: '2 × 0.5mm²', Jacket: 'PVC' },
      features: ['100m Roll', 'Coax + Power Combo', '95% Braided Shield', 'Pre-made BNC Ready'],
      images: ['https://images.unsplash.com/photo-1597852074816-d5ce82f50c22?auto=format&fit=crop&w=800&q=80'],
      mrp: 2850, salePrice: 2290, dealerPrice: 1850, purchasePrice: 1720, discountPercent: 20,
      stock: 68, lowStockThreshold: 10,
      learningTitle: 'What is Siamese cable?',
      learningSimple: 'Siamese cable has coax (for video) and power wires joined together in one jacket — you run a single cable per camera instead of two.',
      learningTech: 'RG59 has 75Ω impedance, attenuation ~6.7 dB/100m @ 5 MHz. Siamese adds 2-conductor 18AWG power run alongside.',
    },

    // ============ ACCESSORIES ============
    {
      sku: 'ACC-JBOX-01', name: 'Camera Junction Box', modelNumber: 'JB-STD-01', brand: 'cp-plus', category: 'accessories',
      productType: 'ACCESSORY', variety: 'Junction Box',
      shortDescription: 'Weatherproof junction box for hiding camera cable connections.',
      longDescription: 'IP65-rated junction box for surface-mounting cameras with hidden cable management.',
      keySpecs: { Material: 'ABS Plastic', Rating: 'IP65', Mount: 'Wall/Pole', Dimensions: '110×85×45mm' },
      features: ['IP65 Rated', 'Cable Management', 'Wall or Pole Mount'],
      images: ['https://images.unsplash.com/photo-1581092160562-40aa08edb547?auto=format&fit=crop&w=800&q=80'],
      mrp: 250, salePrice: 180, dealerPrice: 130, purchasePrice: 110, discountPercent: 28,
      stock: 280, lowStockThreshold: 40,
      learningTitle: 'Why use a junction box?',
      learningSimple: 'A junction box hides and protects cable connections from rain, dust, and tampering — extending camera lifespan.',
    },
    {
      sku: 'ACC-BRACKET-01', name: 'Wall Mount Bracket', modelNumber: 'BR-WALL-01', brand: 'cp-plus', category: 'accessories',
      productType: 'ACCESSORY', variety: 'Camera Bracket',
      shortDescription: 'Universal wall mount bracket for dome and bullet cameras.',
      longDescription: 'Adjustable wall mount bracket compatible with most dome and bullet cameras.',
      keySpecs: { Material: 'Aluminum', Load: 'Up to 3kg', Adjustable: 'Tilt ±90°', Mount: 'Wall/Pole' },
      features: ['Universal Fit', 'Aluminum Build', 'Adjustable Angle'],
      images: ['https://images.unsplash.com/photo-1581092160562-40aa08edb547?auto=format&fit=crop&w=800&q=80'],
      mrp: 350, salePrice: 250, dealerPrice: 180, purchasePrice: 150, discountPercent: 29,
      stock: 195, lowStockThreshold: 30,
      learningTitle: 'Why use a camera bracket?',
      learningSimple: 'A bracket positions the camera at the right angle and lifts it away from the wall for better view and weather protection.',
    },
    {
      sku: 'ACC-UPS-1KVA-01', name: '1KVA Online UPS', modelNumber: 'UPS-1KVA-ON', brand: 'microtek', category: 'accessories',
      productType: 'ACCESSORY', variety: 'UPS',
      shortDescription: '1KVA online UPS for recorders and small camera systems.',
      longDescription: 'True online double-conversion UPS providing clean power to recorder, monitor, and small PoE switches during outages.',
      keySpecs: { Capacity: '1KVA / 800W', Topology: 'Online Double Conversion', Backup: '30 min @ half load', Battery: 'Sealed Lead Acid' },
      features: ['Online Double Conversion', '30 Min Backup', 'Pure Sine Wave', 'Rack Mountable'],
      images: ['https://images.unsplash.com/photo-1581092160562-40aa08edb547?auto=format&fit=crop&w=800&q=80'],
      isFeatured: true,
      mrp: 12500, salePrice: 9990, dealerPrice: 8500, purchasePrice: 8000, discountPercent: 20,
      stock: 18, lowStockThreshold: 4,
      learningTitle: 'Why use a UPS for CCTV?',
      learningSimple: 'A UPS keeps your cameras and recorder running during power cuts — so you do not lose footage when you need it most.',
    },
    {
      sku: 'ACC-HDMI-3M-01', name: 'HDMI Cable 3m', modelNumber: 'HDMI-3M-STD', brand: 'cp-plus', category: 'accessories',
      productType: 'ACCESSORY', variety: 'HDMI Cable',
      shortDescription: '3m HDMI cable for connecting recorder to monitor.',
      longDescription: 'High-speed HDMI cable supporting 4K@60Hz, 18Gbps bandwidth, and HDR.',
      keySpecs: { Length: '3m', Version: 'HDMI 2.0', MaxResolution: '4K@60Hz', Bandwidth: '18Gbps' },
      features: ['4K @ 60Hz', '18Gbps Bandwidth', 'HDR Support'],
      images: ['https://images.unsplash.com/photo-1581092160562-40aa08edb547?auto=format&fit=crop&w=800&q=80'],
      mrp: 450, salePrice: 290, dealerPrice: 200, purchasePrice: 170, discountPercent: 36,
      stock: 240, lowStockThreshold: 40,
      learningTitle: 'Why an HDMI cable for CCTV?',
      learningSimple: 'An HDMI cable connects your DVR/NVR to a monitor so you can view live feeds directly without needing a phone or PC.',
    },
    {
      sku: 'ACC-RJ45-100-01', name: 'RJ45 Connectors (100 pcs)', modelNumber: 'RJ45-100PK', brand: 'cp-plus', category: 'accessories',
      productType: 'ACCESSORY', variety: 'RJ45 Connector',
      shortDescription: '100-pack of RJ45 connectors for terminating Cat6 cable.',
      longDescription: 'Gold-plated RJ45 connectors, 50-micron, 8P8C, compatible with Cat5e/Cat6 solid and stranded cable.',
      keySpecs: { Quantity: '100 pcs', Plating: '50µ Gold', Type: '8P8C', Compatible: 'Cat5e/Cat6' },
      features: ['100 Pack', 'Gold Plated', 'Cat5e/Cat6 Compatible'],
      images: ['https://images.unsplash.com/photo-1581092160562-40aa08edb547?auto=format&fit=crop&w=800&q=80'],
      mrp: 650, salePrice: 490, dealerPrice: 350, purchasePrice: 300, discountPercent: 25,
      stock: 320, lowStockThreshold: 50,
      learningTitle: 'RJ45 — what is it?',
      learningSimple: 'RJ45 is the plug at the end of an Ethernet cable. You crimp it onto the cable to connect cameras and switches.',
    },
    {
      sku: 'ACC-BNC-100-01', name: 'BNC Connectors (100 pcs)', modelNumber: 'BNC-100PK', brand: 'cp-plus', category: 'accessories',
      productType: 'ACCESSORY', variety: 'BNC Connector',
      shortDescription: '100-pack of twist-on BNC connectors for RG59 coaxial cable.',
      longDescription: 'Twist-on BNC connectors compatible with RG59 and RG6 coaxial cable for analog CCTV systems.',
      keySpecs: { Quantity: '100 pcs', Type: 'Twist-On', Compatible: 'RG59/RG6', Impedance: '75Ω' },
      features: ['100 Pack', 'Twist On', 'RG59/RG6 Compatible'],
      images: ['https://images.unsplash.com/photo-1581092160562-40aa08edb547?auto=format&fit=crop&w=800&q=80'],
      mrp: 550, salePrice: 390, dealerPrice: 280, purchasePrice: 240, discountPercent: 29,
      stock: 180, lowStockThreshold: 30,
      learningTitle: 'What is a BNC connector?',
      learningSimple: 'A BNC connector attaches the coax cable to your DVR or analog camera. It twists and locks for a secure video connection.',
    },
    {
      sku: 'ACC-MONITOR-22-01', name: '22-inch LED Monitor', modelNumber: 'MON-22-FHD', brand: 'cp-plus', category: 'accessories',
      productType: 'ACCESSORY', variety: 'Monitor',
      shortDescription: '22-inch Full HD LED monitor for CCTV surveillance.',
      longDescription: '22-inch 1080p LED monitor with HDMI and VGA inputs, VESA mountable for surveillance walls.',
      keySpecs: { Screen: '22 inch', Resolution: '1920×1080', Inputs: 'HDMI + VGA', Refresh: '60Hz', Mount: 'VESA 75mm' },
      features: ['1080p Resolution', 'HDMI + VGA', 'VESA Mountable'],
      images: ['https://images.unsplash.com/photo-1581092160562-40aa08edb547?auto=format&fit=crop&w=800&q=80'],
      mrp: 8500, salePrice: 6990, dealerPrice: 5800, purchasePrice: 5500, discountPercent: 18,
      stock: 28, lowStockThreshold: 6,
      learningTitle: 'Why a dedicated monitor?',
      learningSimple: 'A dedicated monitor at the recorder location lets security staff quickly check live feeds without logging into the app.',
    },
    {
      sku: 'ACC-MOUSE-01', name: 'USB Optical Mouse', modelNumber: 'MS-USB-01', brand: 'cp-plus', category: 'accessories',
      productType: 'ACCESSORY', variety: 'Mouse',
      shortDescription: 'Standard USB mouse for DVR/NVR navigation.',
      longDescription: 'Wired USB optical mouse compatible with all Hikvision/Dahua/CP Plus DVRs and NVRs.',
      keySpecs: { Connection: 'USB', Type: 'Optical', Cable: '1.2m', Compatible: 'Universal' },
      features: ['USB Wired', 'Optical Sensor', 'Universal Compatibility'],
      images: ['https://images.unsplash.com/photo-1581092160562-40aa08edb547?auto=format&fit=crop&w=800&q=80'],
      mrp: 250, salePrice: 180, dealerPrice: 120, purchasePrice: 100, discountPercent: 28,
      stock: 350, lowStockThreshold: 50,
      learningTitle: 'USB mouse for DVR?',
      learningSimple: 'A USB mouse is required to navigate the DVR/NVR on-screen menu — the remote control alone is too slow for setup.',
    },
  ]

  // Insert products
  let count = 0
  for (const p of products) {
    const product = await db.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        modelNumber: p.modelNumber,
        brandId: brands[p.brand].id,
        categoryId: ({
          'recorders': catDVR.id,
          'analog-cameras': catAnalogCam.id,
          'ip-cameras': catIPCam.id,
          'storage': catHDD.id,
          'smps': catSMPS.id,
          'poe': catPoE.id,
          'cables': catCable.id,
          'accessories': catAcc.id,
        } as Record<string, string>)[p.category]!,
        productType: p.productType,
        variety: p.variety || null,
        technology: p.technology || null,
        megapixel: p.megapixel || null,
        channels: p.channels || null,
        shortDescription: p.shortDescription,
        longDescription: p.longDescription || null,
        keySpecs: JSON.stringify(p.keySpecs),
        features: JSON.stringify(p.features),
        images: JSON.stringify(p.images),
        isActive: true,
        isFeatured: p.isFeatured || false,
        pricing: {
          create: {
            mrp: p.mrp,
            salePrice: p.salePrice,
            dealerPrice: p.dealerPrice || null,
            purchasePrice: p.purchasePrice || null,
            gstRate: p.gstRate ?? 18,
            discountPercent: p.discountPercent ?? 0,
          }
        },
        inventory: {
          create: {
            warehouseId: whMain.id,
            quantity: p.stock,
            reservedQty: 0,
            lowStockThreshold: p.lowStockThreshold ?? 5,
          }
        },
        learning: {
          create: {
            title: p.learningTitle,
            simpleExplanation: p.learningSimple,
            technicalDetails: p.learningTech || null,
          }
        }
      }
    })

    // Initial opening stock transaction
    await db.inventoryTransaction.create({
      data: {
        productId: product.id,
        type: 'OPENING',
        quantity: p.stock,
        reference: 'Initial stock',
        warehouseId: whMain.id,
      }
    })

    // Sample sales transactions (last 30 days)
    const salesCount = Math.floor(Math.random() * 6) + 2
    for (let i = 0; i < salesCount; i++) {
      const daysAgo = Math.floor(Math.random() * 30) + 1
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)
      const qty = Math.floor(Math.random() * 5) + 1
      await db.inventoryTransaction.create({
        data: {
          productId: product.id,
          type: 'SALE',
          quantity: -qty,
          reference: `ORD-${date.getTime().toString().slice(-6)}`,
          notes: 'Online order',
          warehouseId: whMain.id,
          createdAt: date,
        }
      })
    }

    // Link supplier
    await db.productSupplier.create({
      data: {
        productId: product.id,
        supplierId: Math.random() > 0.5 ? s1.id : s2.id,
        leadTimeDays: Math.floor(Math.random() * 7) + 2,
      }
    })
    count++
  }
  console.log(`  ✓ ${count} products created with pricing, inventory, learning content, transactions`)

  // ---------- SETTINGS ----------
  await db.appSetting.create({ data: { key: 'DEFAULT_GST_RATE', value: '18' } })
  await db.appSetting.create({ data: { key: 'DEFAULT_POE_SAFETY_MARGIN', value: '20' } })
  await db.appSetting.create({ data: { key: 'DEFAULT_POWER_SAFETY_MARGIN', value: '20' } })
  await db.appSetting.create({ data: { key: 'DEFAULT_CABLE_WASTAGE', value: '10' } })

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
