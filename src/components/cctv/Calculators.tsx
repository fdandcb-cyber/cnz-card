'use client'
import { useState, useMemo } from 'react'
import { useCatalog, useRules, formatINR } from '@/lib/cctv/hooks'
import { calculateStorageRetention, findRecommendedHDD, calculatePoEBudget, calculateCableLength } from '@/lib/cctv/calculators'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { HardDrive, Zap, Cable, Calculator, AlertCircle, CheckCircle2, AlertTriangle, Plus } from 'lucide-react'

export function Calculators() {
  return (
    <Tabs defaultValue="storage" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="storage" className="text-xs"><HardDrive className="h-3.5 w-3.5 mr-1" /> HDD</TabsTrigger>
        <TabsTrigger value="poe" className="text-xs"><Zap className="h-3.5 w-3.5 mr-1" /> PoE</TabsTrigger>
        <TabsTrigger value="power" className="text-xs"><Zap className="h-3.5 w-3.5 mr-1" /> SMPS</TabsTrigger>
        <TabsTrigger value="cable" className="text-xs"><Cable className="h-3.5 w-3.5 mr-1" /> Cable</TabsTrigger>
      </TabsList>
      <TabsContent value="storage"><StorageCalculator /></TabsContent>
      <TabsContent value="poe"><PoECalculator /></TabsContent>
      <TabsContent value="power"><PowerCalculator /></TabsContent>
      <TabsContent value="cable"><CableCalculator /></TabsContent>
    </Tabs>
  )
}

// ============ HDD RETENTION CALCULATOR ============
function StorageCalculator() {
  const { data: catalog } = useCatalog()
  const { data: rules } = useRules()
  const hddProducts = useMemo(() =>
    (catalog?.products || []).filter((p) => p.productType === 'HDD'),
    [catalog],
  )

  const [numCameras, setNumCameras] = useState(8)
  const [megapixel, setMegapixel] = useState('4MP')
  const [codec, setCodec] = useState('H.265')
  const [hours, setHours] = useState(24)
  const [motion, setMotion] = useState(false)
  const [audio, setAudio] = useState(false)
  const [hddId, setHddId] = useState<string>('')

  const megapixels = useMemo(() => {
    const set = new Set(rules?.storageRules.map((r) => r.megapixel) || [])
    return Array.from(set)
  }, [rules])

  const codecs = useMemo(() => {
    const set = new Set(rules?.storageRules.filter((r) => r.megapixel === megapixel).map((r) => r.codec) || [])
    return Array.from(set)
  }, [rules, megapixel])

  const selectedHdd = hddProducts.find((p) => p.id === hddId)
  const hddCapacityTB = selectedHdd ? parseInt((selectedHdd.keySpecs.Capacity || '0').replace(/\D/g, ''), 10) : 0

  const result = useMemo(() => {
    if (!rules) return null
    return calculateStorageRetention({
      numCameras, megapixel, codec,
      recordingHoursPerDay: hours, motionRecording: motion, audio,
      hddCapacityTB: hddCapacityTB || undefined,
      storageRules: rules.storageRules,
      hddProducts,
    })
  }, [rules, numCameras, megapixel, codec, hours, motion, audio, hddCapacityTB, hddProducts])

  const recommendedHdd = useMemo(() => {
    if (!result || result.perDayGB === 0) return undefined
    const targetDays = 15
    return findRecommendedHDD(result.perDayGB, targetDays, hddProducts)
  }, [result, hddProducts])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><HardDrive className="h-4 w-4" /> HDD Retention Calculator</CardTitle>
        <CardDescription>Estimate storage required and how many days of recording you will get.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Number of cameras</Label>
            <Input type="number" min={1} value={numCameras} onChange={(e) => setNumCameras(Math.max(1, parseInt(e.target.value) || 1))} />
          </div>
          <div>
            <Label className="text-xs">Megapixel</Label>
            <Select value={megapixel} onValueChange={setMegapixel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {megapixels.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Codec</Label>
            <Select value={codec} onValueChange={setCodec}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {codecs.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Recording hours/day</Label>
            <Input type="number" min={1} max={24} value={hours} onChange={(e) => setHours(Math.min(24, Math.max(1, parseInt(e.target.value) || 1)))} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={motion} onCheckedChange={setMotion} id="motion" />
            <Label htmlFor="motion" className="text-xs">Motion only</Label>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={audio} onCheckedChange={setAudio} id="audio" />
            <Label htmlFor="audio" className="text-xs">Audio</Label>
          </div>
        </div>

        <div>
          <Label className="text-xs">Select HDD (optional)</Label>
          <Select value={hddId || 'none'} onValueChange={(v) => setHddId(v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="None — just calculate required storage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {hddProducts.map((h) => (
                <SelectItem key={h.id} value={h.id}>{h.name} — {h.keySpecs.Capacity}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {result && (
          <div className="space-y-3">
            <div className="rounded-md bg-muted p-3 text-xs font-mono break-words">{result.breakdown}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Per camera / day" value={`${result.perCameraGB.toFixed(2)} GB`} />
              <Stat label="Total / day" value={`${result.perDayGB.toFixed(2)} GB`} />
              <Stat label="Retention" value={result.estimatedRetentionDays > 0 ? `${result.estimatedRetentionDays} days` : '—'} />
              <Stat label="For 15-day target" value={result.perDayGB > 0 ? `${(result.perDayGB * 15 / 1000).toFixed(2)} TB` : '—'} />
            </div>
            {selectedHdd && result.estimatedRetentionDays > 0 && (
              <Alert tone={result.estimatedRetentionDays >= 15 ? 'ok' : 'warn'}>
                Selected {selectedHdd.keySpecs.Capacity} HDD provides approximately <b>{result.estimatedRetentionDays} days</b> retention.
                {result.estimatedRetentionDays >= 15 ? ' Sufficient for 15+ day target.' : ` Short of 15-day target — upgrade to a larger HDD.`}
              </Alert>
            )}
            {recommendedHdd && !selectedHdd && (
              <Alert tone="info">
                Recommendation: <b>{recommendedHdd.name}</b> ({recommendedHdd.keySpecs.Capacity}, {formatINR(recommendedHdd.pricing?.salePrice || 0)}) for ~15-day retention.
              </Alert>
            )}
            <p className="text-[11px] text-muted-foreground italic">
              ⓘ Retention is an estimate based on average bitrates. Actual retention varies with scene complexity, motion, and camera settings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============ PoE POWER CALCULATOR ============
function PoECalculator() {
  const { data: catalog } = useCatalog()
  const { data: rules } = useRules()
  const poeSwitches = useMemo(() =>
    (catalog?.products || []).filter((p) => p.productType === 'POE_SWITCH' || p.productType === 'POE_INJECTOR'),
    [catalog],
  )

  const [numCameras, setNumCameras] = useState(8)
  const [wattagePerCam, setWattagePerCam] = useState(7)
  const [switchId, setSwitchId] = useState<string>('')
  const [margin, setMargin] = useState(20)

  const selectedSwitch = poeSwitches.find((p) => p.id === switchId)
  const result = useMemo(() => {
    if (!rules) return null
    return calculatePoEBudget({
      poeCameras: Array.from({ length: numCameras }, () => ({ id: 'mock', productType: 'IP_CAMERA' } as any)),
      quantityPerCamera: 1,
      poeSwitch: selectedSwitch,
      powerRules: rules.powerRules,
      safetyMarginPercent: margin,
    })
  }, [rules, numCameras, selectedSwitch, margin])

  // Override the message with our custom wattage input
  const total = numCameras * wattagePerCam
  const required = Math.ceil(total * (1 + margin / 100))
  const budget = selectedSwitch ? parseInt((selectedSwitch.keySpecs.PoEBudget || '0').replace(/\D/g, ''), 10) : 0
  let status: 'OK' | 'TIGHT' | 'INSUFFICIENT' = 'OK'
  let message = ''
  if (selectedSwitch && budget > 0) {
    if (budget >= required) {
      status = 'OK'
      message = `${numCameras} cameras × ${wattagePerCam}W = ${total}W required. Switch budget ${budget}W — suitable.`
    } else if (budget >= total) {
      status = 'TIGHT'
      message = `${numCameras} cameras × ${wattagePerCam}W = ${total}W required. Switch budget ${budget}W — tight, minimal reserve.`
    } else {
      status = 'INSUFFICIENT'
      message = `${numCameras} cameras × ${wattagePerCam}W = ${total}W required. Switch budget ${budget}W — insufficient!`
    }
  } else {
    message = `${numCameras} cameras × ${wattagePerCam}W = ${total}W required (with ${margin}% margin: ${required}W). Select a PoE switch to validate.`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Zap className="h-4 w-4" /> PoE Power Budget Calculator</CardTitle>
        <CardDescription>Verify that your PoE switch has enough power budget for all connected IP cameras.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">PoE cameras</Label>
            <Input type="number" min={1} value={numCameras} onChange={(e) => setNumCameras(Math.max(1, parseInt(e.target.value) || 1))} />
          </div>
          <div>
            <Label className="text-xs">Watts / camera</Label>
            <Input type="number" min={1} value={wattagePerCam} onChange={(e) => setWattagePerCam(Math.max(1, parseFloat(e.target.value) || 1))} />
          </div>
          <div>
            <Label className="text-xs">Safety margin %</Label>
            <Input type="number" min={0} max={100} value={margin} onChange={(e) => setMargin(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))} />
          </div>
          <div>
            <Label className="text-xs">Selected switch</Label>
            <Select value={switchId} onValueChange={setSwitchId}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {poeSwitches.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total required" value={`${total} W`} />
          <Stat label="With margin" value={`${required} W`} />
          <Stat label="Switch budget" value={budget > 0 ? `${budget} W` : '—'} />
          <Stat label="Reserve" value={budget > 0 ? `${budget - total} W` : '—'} tone={budget - total >= 0 ? 'ok' : 'warn'} />
        </div>

        <Alert tone={status === 'OK' ? 'ok' : status === 'TIGHT' ? 'warn' : 'error'}>
          {status === 'OK' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{message}</span>
        </Alert>

        <p className="text-[11px] text-muted-foreground italic">
          ⓘ Example: 8 cameras × 8W = 64W required. A 65W PoE switch meets the requirement with minimal reserve.
        </p>
      </CardContent>
    </Card>
  )
}

// ============ SMPS POWER CALCULATOR ============
function PowerCalculator() {
  const { data: catalog } = useCatalog()
  const { data: rules } = useRules()
  const smpsProducts = useMemo(() =>
    (catalog?.products || []).filter((p) => p.productType === 'SMPS'),
    [catalog],
  )

  const [numCameras, setNumCameras] = useState(8)
  const [wattsPerCam, setWattsPerCam] = useState(5)
  const [margin, setMargin] = useState(20)
  const [smpsId, setSmpsId] = useState<string>('')

  const total = numCameras * wattsPerCam
  const required = Math.ceil(total * (1 + margin / 100))
  const selectedSmps = smpsProducts.find((p) => p.id === smpsId)
  const smpsWattage = selectedSmps ? parseInt((selectedSmps.keySpecs.Wattage || '0').replace(/\D/g, ''), 10) : 0

  let status: 'OK' | 'INSUFFICIENT' | 'TIGHT' = 'OK'
  let message = ''
  if (selectedSmps && smpsWattage > 0) {
    if (smpsWattage >= required) {
      status = 'OK'
      message = `Selected SMPS provides ${smpsWattage}W, which covers the required ${required}W. Suitable.`
    } else if (smpsWattage >= total) {
      status = 'TIGHT'
      message = `Selected SMPS provides ${smpsWattage}W. Covers the base load (${total}W) but no safety margin.`
    } else {
      status = 'INSUFFICIENT'
      message = `Selected SMPS provides ${smpsWattage}W, which is less than the required ${required}W. Insufficient!`
    }
  } else {
    message = `${numCameras} cameras × ${wattsPerCam}W = ${total}W. With ${margin}% margin → ${required}W required.`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Zap className="h-4 w-4" /> SMPS Power Calculator (Analog systems)</CardTitle>
        <CardDescription>Calculate the total 12V power supply required for your analog cameras.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Analog cameras</Label>
            <Input type="number" min={1} value={numCameras} onChange={(e) => setNumCameras(Math.max(1, parseInt(e.target.value) || 1))} />
          </div>
          <div>
            <Label className="text-xs">Watts / camera</Label>
            <Input type="number" min={1} value={wattsPerCam} onChange={(e) => setWattsPerCam(Math.max(1, parseFloat(e.target.value) || 1))} />
          </div>
          <div>
            <Label className="text-xs">Safety margin %</Label>
            <Input type="number" min={0} max={100} value={margin} onChange={(e) => setMargin(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))} />
          </div>
          <div>
            <Label className="text-xs">Selected SMPS</Label>
            <Select value={smpsId} onValueChange={setSmpsId}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {smpsProducts.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Camera load" value={`${total} W`} />
          <Stat label="With margin" value={`${required} W`} />
          <Stat label="SMPS capacity" value={smpsWattage > 0 ? `${smpsWattage} W` : '—'} />
          <Stat label="Reserve" value={smpsWattage > 0 ? `${smpsWattage - required} W` : '—'} tone={smpsWattage - required >= 0 ? 'ok' : 'warn'} />
        </div>

        <Alert tone={status === 'OK' ? 'ok' : status === 'TIGHT' ? 'warn' : selectedSmps ? 'error' : 'info'}>
          {status === 'OK' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{message}</span>
        </Alert>

        <p className="text-[11px] text-muted-foreground italic">
          ⓘ For analog systems: total W = (camera count × watts/camera) × safety margin. Most analog cameras draw 4-7W each.
        </p>
      </CardContent>
    </Card>
  )
}

// ============ CABLE LENGTH CALCULATOR ============
function CableCalculator() {
  const { data: catalog } = useCatalog()
  const { data: rules } = useRules()
  const cableProducts = useMemo(() =>
    (catalog?.products || []).filter((p) => p.productType === 'CABLE'),
    [catalog],
  )

  const [systemType, setSystemType] = useState<'IP' | 'ANALOG'>('IP')
  const [cableRuleId, setCableRuleId] = useState<string>('')
  const [wastage, setWastage] = useState(10)
  const [distances, setDistances] = useState<{ camera: string; distance: number }[]>([
    { camera: 'Camera 1', distance: 35 },
    { camera: 'Camera 2', distance: 42 },
    { camera: 'Camera 3', distance: 65 },
  ])

  const availableRules = useMemo(() =>
    (rules?.cableRules || []).filter((r) => r.systemType === systemType),
    [rules, systemType],
  )

  const cableRule = availableRules.find((r) => r.id === cableRuleId) || availableRules[0]

  const result = useMemo(() => {
    if (!cableRule) return null
    return calculateCableLength({
      distances,
      cableRule,
      wastagePercent: wastage,
    })
  }, [cableRule, distances, wastage])

  // Find matching cable product
  const matchingCable = useMemo(() => {
    if (!cableRule) return undefined
    return cableProducts.find((p) =>
      p.variety?.toLowerCase().includes(cableRule.cableType.toLowerCase()) ||
      p.variety?.toLowerCase() === cableRule.cableType.toLowerCase().replace('_', ' '),
    )
  }, [cableRule, cableProducts])

  const updateDistance = (i: number, value: number) => {
    setDistances((prev) => prev.map((d, idx) => idx === i ? { ...d, distance: value } : d))
  }
  const addRow = () => setDistances((prev) => [...prev, { camera: `Camera ${prev.length + 1}`, distance: 30 }])
  const removeRow = (i: number) => setDistances((prev) => prev.filter((_, idx) => idx !== i))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Cable className="h-4 w-4" /> Cable Length Calculator</CardTitle>
        <CardDescription>Calculate total cable needed based on per-camera distances and recommend roll quantities.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">System type</Label>
            <Select value={systemType} onValueChange={(v: 'IP' | 'ANALOG') => { setSystemType(v); setCableRuleId('') }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IP">IP system</SelectItem>
                <SelectItem value="ANALOG">Analog system</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Cable type</Label>
            <Select value={cableRule?.id || ''} onValueChange={setCableRuleId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableRules.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Wastage %</Label>
            <Input type="number" min={0} max={50} value={wastage} onChange={(e) => setWastage(Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))} />
          </div>
          <div className="flex items-end">
            <Button size="sm" variant="outline" onClick={addRow} className="w-full">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add camera
            </Button>
          </div>
        </div>

        {/* Per-camera distances */}
        <div className="space-y-2">
          <Label className="text-xs">Per-camera cable distances (meters)</Label>
          {distances.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs w-20 text-muted-foreground">Camera {i + 1}</span>
              <Input type="number" min={1} value={d.distance} onChange={(e) => updateDistance(i, Math.max(1, parseInt(e.target.value) || 1))} className="flex-1" />
              <span className="text-xs text-muted-foreground w-4">m</span>
              <Button size="icon" variant="ghost" onClick={() => removeRow(i)} disabled={distances.length <= 1}>
                <AlertCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <Separator />

        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Total required" value={`${result.totalLengthM} m`} />
              <Stat label="Wastage" value={`${result.wastagePercent}%`} />
              <Stat label="With wastage" value={`${Math.ceil(result.totalLengthM * (1 + result.wastagePercent / 100))} m`} />
              <Stat label="Rolls needed" value={`${result.rollsNeeded} × ${result.rollLengthM}m`} tone="ok" />
            </div>
            <Alert tone="ok">
              <CheckCircle2 className="h-4 w-4" />
              <span>Recommended purchase: <b>{result.recommendedPurchase}</b></span>
            </Alert>
            {matchingCable && (
              <Alert tone="info">
                Matching cable: <b>{matchingCable.name}</b> ({matchingCable.keySpecs.Length}, {formatINR(matchingCable.pricing?.salePrice || 0)}).
              </Alert>
            )}
            <p className="text-[11px] text-muted-foreground italic">
              ⓘ Example: 287m required + 10% wastage = 316m → recommend purchasing 1 × 305m roll + additional cable.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ====== Shared bits ======
function Stat({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-bold ${tone === 'ok' ? 'text-emerald-700' : tone === 'warn' ? 'text-orange-600' : ''}`}>{value}</p>
    </div>
  )
}

function Alert({ tone, children }: { tone: 'ok' | 'warn' | 'error' | 'info'; children: React.ReactNode }) {
  const styles = {
    ok: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warn: 'bg-amber-50 text-amber-800 border-amber-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  }[tone]
  return (
    <div className={`text-xs flex items-start gap-2 p-3 rounded-md border ${styles}`}>
      {children}
    </div>
  )
}
