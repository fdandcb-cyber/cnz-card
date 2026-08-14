'use client'
import { useMemo } from 'react'
import { useSetupStore, computeSetupTotals, type SetupSection } from '@/lib/cctv/setup-store'
import { useCatalog, formatINR } from '@/lib/cctv/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Minus, Plus, X, ShoppingCart, Trash2, FileText, Save, Eye, Cctv, HardDrive, Zap, Network, Cable, Wrench, Boxes } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { checkCompatibility } from '@/lib/cctv/compatibility'
import { useRules } from '@/lib/cctv/hooks'

const SECTION_META: { key: SetupSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'cameras', label: 'Cameras', icon: Cctv },
  { key: 'recorders', label: 'Recorder', icon: Boxes },
  { key: 'storage', label: 'Storage', icon: HardDrive },
  { key: 'power', label: 'Power', icon: Zap },
  { key: 'poe', label: 'PoE', icon: Network },
  { key: 'cables', label: 'Cable', icon: Cable },
  { key: 'accessories', label: 'Accessories', icon: Wrench },
]

export function SetupSummary({ sticky = false }: { sticky?: boolean }) {
  const state = useSetupStore()
  const totals = computeSetupTotals(state)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [quoteOpen, setQuoteOpen] = useState(false)

  if (sticky) {
    // Mobile sticky bar
    return (
      <>
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t shadow-lg p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground">{totals.itemCount} items · {totals.lineCount} lines</p>
              <p className="text-base font-bold">{formatINR(totals.grandTotal)}</p>
            </div>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button size="sm"><Eye className="h-4 w-4 mr-1" /> View setup</Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Your Setup ({totals.itemCount} items)</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(85vh-200px)]">
                  <div className="p-4"><SetupItemsList /></div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <TotalsBlock totals={totals} />
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setQuoteOpen(true)}>
                      <FileText className="h-3.5 w-3.5 mr-1" /> Request Quote
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => { setMobileOpen(false); setQuoteOpen(true) }}>
                      <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Submit Setup
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <QuoteDialog open={quoteOpen} onOpenChange={setQuoteOpen} totals={totals} />
      </>
    )
  }

  // Desktop sticky sidebar
  return (
    <Card className="sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" /> Your Setup
          {totals.itemCount > 0 && <Badge className="ml-auto">{totals.itemCount}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <ScrollArea className="flex-1 px-4">
          <SetupItemsList />
        </ScrollArea>
        <div className="p-4 border-t">
          <TotalsBlock totals={totals} />
          <div className="flex flex-col gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setQuoteOpen(true)}>
              <FileText className="h-3.5 w-3.5 mr-1.5" /> Request Quote
            </Button>
            <Button size="sm" onClick={() => setQuoteOpen(true)} disabled={totals.itemCount === 0}>
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save / Submit Setup
            </Button>
            {totals.itemCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => state.clearSetup()}>
                <Trash2 className="h-3 w-3 mr-1" /> Clear setup
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <QuoteDialog open={quoteOpen} onOpenChange={setQuoteOpen} totals={totals} />
    </Card>
  )
}

function SetupItemsList() {
  const state = useSetupStore()
  const allSectionsEmpty = SECTION_META.every((s) => (state[s.key] as any[]).length === 0)

  if (allSectionsEmpty) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-xs">Your setup is empty.</p>
        <p className="text-[11px] mt-1">Browse the catalog and click <b>Add</b> on products to build your CCTV system.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 py-2">
      {SECTION_META.map((meta) => {
        const items = state[meta.key] as any[]
        if (items.length === 0) return null
        const Icon = meta.icon
        return (
          <div key={meta.key}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{meta.label}</span>
              <Separator className="flex-1" />
            </div>
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-muted/50 text-xs">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.product.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatINR(item.product.pricing?.salePrice || 0)} × {item.quantity}
                    {' = '}
                    <span className="font-semibold text-foreground">
                      {formatINR((item.product.pricing?.salePrice || 0) * item.quantity)}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6"
                    onClick={() => state.setQuantity(meta.key, item.product.id, item.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-5 text-center font-medium">{item.quantity}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6"
                    onClick={() => state.setQuantity(meta.key, item.product.id, item.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => state.removeItem(meta.key, item.product.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      })}
      <CompatibilityWarnings />
    </div>
  )
}

function CompatibilityWarnings() {
  const state = useSetupStore()
  const { data: rules } = useRules()
  const { data: catalog } = useCatalog()

  const issues = useMemo(() => {
    if (!rules || !catalog) return []
    return checkCompatibility({
      cameras: state.cameras,
      recorders: state.recorders,
      storage: state.storage,
      power: state.power,
      poe: state.poe,
      cables: state.cables,
      accessories: state.accessories,
      storageRules: rules.storageRules,
      powerRules: rules.powerRules,
      compatibilityRules: rules.compatibilityRules,
      hddProducts: catalog.products.filter((p) => p.productType === 'HDD'),
      targetRetentionDays: state.targetRetentionDays,
      recordingHoursPerDay: state.recordingHoursPerDay,
      motionRecording: state.motionRecording,
      audio: state.audio,
      codec: state.codec,
    })
  }, [state, rules, catalog])

  if (issues.length === 0) return null

  return (
    <div className="pt-2 mt-2 border-t space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Compatibility</p>
      {issues.map((issue, i) => (
        <div key={i} className={`text-[11px] p-2 rounded ${
          issue.severity === 'ERROR' ? 'bg-red-50 text-red-800 border border-red-200' :
          issue.severity === 'WARNING' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {issue.message}
        </div>
      ))}
    </div>
  )
}

function TotalsBlock({ totals }: { totals: ReturnType<typeof computeSetupTotals> }) {
  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(totals.subtotal)}</span></div>
      {totals.discount > 0 && (
        <div className="flex justify-between text-emerald-700"><span>Discount</span><span>−{formatINR(totals.discount)}</span></div>
      )}
      <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>{formatINR(totals.gst)}</span></div>
      <Separator className="my-1.5" />
      <div className="flex justify-between text-sm font-bold"><span>Grand Total</span><span className="text-emerald-700">{formatINR(totals.grandTotal)}</span></div>
    </div>
  )
}

function QuoteDialog({ open, onOpenChange, totals }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  totals: ReturnType<typeof computeSetupTotals>
}) {
  const state = useSetupStore()
  const qc = useQueryClient()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const setupConfig = {
      cameras: state.cameras, recorders: state.recorders, storage: state.storage,
      power: state.power, poe: state.poe, cables: state.cables, accessories: state.accessories,
    }
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          phone: formData.get('phone'),
          email: formData.get('email'),
          location: formData.get('location'),
          installationRequirement: formData.get('installationRequirement'),
          notes: formData.get('notes'),
          setupConfig,
          totals,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Quote request submitted! Our team will contact you shortly.')
      onOpenChange(false)
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      toast.error('Failed to submit quote. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Quote / Save Setup</DialogTitle>
          <DialogDescription>
            Submit your complete CCTV setup configuration. We will get back to you with installation options.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="name" className="text-xs">Full name *</Label>
            <Input id="name" name="name" required placeholder="John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="phone" className="text-xs">Phone *</Label>
              <Input id="phone" name="phone" required placeholder="+91 98765 43210" />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input id="email" name="email" type="email" placeholder="john@example.com" />
            </div>
          </div>
          <div>
            <Label htmlFor="location" className="text-xs">Location</Label>
            <Input id="location" name="location" placeholder="Bengaluru, India" />
          </div>
          <div>
            <Label htmlFor="installationRequirement" className="text-xs">Installation requirement</Label>
            <Textarea id="installationRequirement" name="installationRequirement" rows={2}
              placeholder="e.g. Outdoor installation, 2-storey building, cable routing through ceiling..." />
          </div>
          <div>
            <Label htmlFor="notes" className="text-xs">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} placeholder="Any specific requirements..." />
          </div>

          {/* Setup summary inside quote dialog */}
          <div className="rounded-md bg-muted p-3 text-xs space-y-1">
            <p className="font-semibold">Your setup ({totals.itemCount} items)</p>
            {state.cameras.length > 0 && <p>Cameras: {state.cameras.reduce((s, c) => s + c.quantity, 0)}</p>}
            {state.recorders.length > 0 && <p>Recorder: {state.recorders.map((r) => r.product.name).join(', ')}</p>}
            {state.storage.length > 0 && <p>Storage: {state.storage.map((s) => s.product.name).join(', ')}</p>}
            <Separator className="my-1" />
            <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(totals.subtotal)}</span></div>
            <div className="flex justify-between"><span>GST</span><span>{formatINR(totals.gst)}</span></div>
            <div className="flex justify-between font-bold"><span>Grand Total</span><span className="text-emerald-700">{formatINR(totals.grandTotal)}</span></div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit quote request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
