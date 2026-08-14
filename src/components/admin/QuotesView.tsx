'use client'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatINR } from '@/lib/cctv/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useState } from 'react'
import { FileText, Phone, Mail, MapPin, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Quote = {
  id: string
  customerId: string
  setupConfig: string
  subtotal: number
  discount: number
  gst: number
  grandTotal: number
  installationRequirement: string | null
  status: string
  notes: string | null
  createdAt: string
  customer: { id: string; name: string; phone: string; email: string | null; location: string | null; notes: string | null }
}

export function QuotesView() {
  const { data, isLoading } = useQuery<{ quotes: Quote[] }>({
    queryKey: ['quotes'],
    queryFn: async () => {
      const r = await fetch('/api/quote')
      if (!r.ok) throw new Error('Failed')
      return r.json()
    },
  })
  const [selected, setSelected] = useState<Quote | null>(null)

  if (isLoading) return <Skeleton className="h-64" />
  const quotes = data?.quotes || []

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Quote Requests</CardTitle>
          <CardDescription>Customer-submitted CCTV setup configurations awaiting review.</CardDescription>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No quote requests yet.</p>
              <p className="text-xs mt-1">Submit a quote from the customer view to see it here.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[520px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Customer</TableHead>
                    <TableHead className="text-xs">Contact</TableHead>
                    <TableHead className="text-xs text-right">Items</TableHead>
                    <TableHead className="text-xs text-right">Grand Total</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Date</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((q) => {
                    let itemCount = 0
                    try {
                      const cfg = JSON.parse(q.setupConfig)
                      itemCount = Object.values(cfg).flat().reduce((s: number, i: any) => s + (i.quantity || 0), 0)
                    } catch {}
                    return (
                      <TableRow key={q.id}>
                        <TableCell>
                          <p className="text-xs font-medium">{q.customer.name}</p>
                          <p className="text-[10px] text-muted-foreground">{q.customer.location || '—'}</p>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{q.customer.phone}</span>
                            {q.customer.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" />{q.customer.email}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-right">{itemCount}</TableCell>
                        <TableCell className="text-xs text-right font-bold text-emerald-700">{formatINR(q.grandTotal)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">{q.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">
                          {new Date(q.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelected(q)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <QuoteDetailDialog quote={selected} onClose={() => setSelected(null)} />
    </>
  )
}

function QuoteDetailDialog({ quote, onClose }: { quote: Quote | null; onClose: () => void }) {
  if (!quote) return null
  let setupConfig: any = null
  try { setupConfig = JSON.parse(quote.setupConfig) } catch {}

  const sections = setupConfig ? Object.entries(setupConfig).filter(([, v]) => Array.isArray(v) && (v as any[]).length > 0) : []

  return (
    <Dialog open={!!quote} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Quote Details — {quote.customer.name}</DialogTitle>
          <DialogDescription>
            Submitted {new Date(quote.createdAt).toLocaleString('en-IN')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Customer info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-muted-foreground">Phone:</span> {quote.customer.phone}</div>
            <div><span className="text-muted-foreground">Email:</span> {quote.customer.email || '—'}</div>
            <div><span className="text-muted-foreground">Location:</span> {quote.customer.location || '—'}</div>
            <div><span className="text-muted-foreground">Status:</span> <Badge variant="secondary" className="text-[10px]">{quote.status}</Badge></div>
          </div>

          {/* Installation requirement */}
          {quote.installationRequirement && (
            <div className="rounded border p-3 text-xs">
              <p className="text-muted-foreground uppercase text-[10px] mb-1">Installation requirement</p>
              <p>{quote.installationRequirement}</p>
            </div>
          )}

          {/* Setup config */}
          {sections.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase mb-2">Setup configuration</p>
              <div className="space-y-2">
                {sections.map(([key, items]: [string, any[]]) => (
                  <div key={key} className="border rounded p-2">
                    <p className="text-xs font-semibold capitalize mb-1">{key}</p>
                    {items.map((i, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-0.5">
                        <span>{i.quantity} × {i.product.name}</span>
                        <span className="font-medium">{formatINR((i.product.pricing?.salePrice || 0) * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="border-t pt-3 space-y-1 text-xs">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(quote.subtotal)}</span></div>
            {quote.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>−{formatINR(quote.discount)}</span></div>}
            <div className="flex justify-between"><span>GST</span><span>{formatINR(quote.gst)}</span></div>
            <div className="flex justify-between font-bold text-sm border-t pt-1"><span>Grand Total</span><span className="text-emerald-700">{formatINR(quote.grandTotal)}</span></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
