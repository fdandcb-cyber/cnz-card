'use client'
import { useState, useMemo } from 'react'
import { useCatalog, formatINR } from '@/lib/cctv/hooks'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Search, Eye, Package, AlertTriangle, XCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { Product } from '@/lib/cctv/types'

const PAGE_SIZE = 12

export function ProductsTable() {
  const { data, isLoading } = useCatalog()
  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState<string>('all')
  const [category, setCategory] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const products = data?.products || []
  const filtered = useMemo(() => {
    let r = products
    if (search) {
      const q = search.toLowerCase()
      r = r.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.modelNumber.toLowerCase().includes(q),
      )
    }
    if (brand !== 'all') r = r.filter((p) => p.brandId === brand)
    if (category !== 'all') r = r.filter((p) => p.categoryId === category)
    if (stockFilter === 'low') r = r.filter((p) => (p.inventory?.quantity || 0) > 0 && (p.inventory?.quantity || 0) <= (p.inventory?.lowStockThreshold || 5))
    if (stockFilter === 'out') r = r.filter((p) => (p.inventory?.quantity || 0) === 0)
    if (stockFilter === 'in') r = r.filter((p) => (p.inventory?.quantity || 0) > (p.inventory?.lowStockThreshold || 5))
    return r
  }, [products, search, brand, category, stockFilter])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const selected = products.find((p) => p.id === selectedId)

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, or model..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <Select value={brand} onValueChange={(v) => { setBrand(v); setPage(1) }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Brand" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {data?.brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1) }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {data?.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={(v) => { setStockFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Stock" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="text-xs">SKU</TableHead>
                    <TableHead className="text-xs">Brand</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs text-right">Price</TableHead>
                    <TableHead className="text-xs text-right">Stock</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((p) => {
                    const stock = p.inventory?.quantity || 0
                    const threshold = p.inventory?.lowStockThreshold ?? 5
                    const isLow = stock > 0 && stock <= threshold
                    const isOut = stock === 0
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedId(p.id)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-mono">
                              {p.productType.slice(0, 3)}
                            </div>
                            <div>
                              <p className="text-xs font-medium">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground">{p.modelNumber}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{p.sku}</TableCell>
                        <TableCell className="text-xs">{p.brand?.name}</TableCell>
                        <TableCell className="text-xs">{p.category?.name}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{formatINR(p.pricing?.salePrice || 0)}</TableCell>
                        <TableCell className="text-xs text-right">
                          {isOut ? (
                            <Badge variant="destructive" className="text-[10px]"><XCircle className="h-2.5 w-2.5 mr-1" />Out</Badge>
                          ) : isLow ? (
                            <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-700"><AlertTriangle className="h-2.5 w-2.5 mr-1" />{stock}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]"><Package className="h-2.5 w-2.5 mr-1" />{stock}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelectedId(p.id) }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Product editor drawer */}
      <ProductDrawer product={selected} open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)} />
    </Card>
  )
}

function ProductDrawer({ product, open, onOpenChange }: {
  product: Product | undefined
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  // Fetch inventory transactions for this product
  const { data: txnData, isLoading } = useQuery({
    queryKey: ['inventory', product?.id],
    queryFn: async () => {
      const r = await fetch(`/api/inventory?productId=${product!.id}`)
      if (!r.ok) throw new Error('Failed')
      return r.json()
    },
    enabled: !!product?.id && open,
  })

  if (!product) return null
  const stock = product.inventory?.quantity || 0
  const pricing = product.pricing

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">{product.name}</SheetTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{product.sku}</span>
            <span>·</span>
            <span>{product.brand?.name}</span>
          </div>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded border p-2">
              <p className="text-[10px] text-muted-foreground uppercase">Sale Price</p>
              <p className="text-sm font-bold">{formatINR(pricing?.salePrice || 0)}</p>
            </div>
            <div className="rounded border p-2">
              <p className="text-[10px] text-muted-foreground uppercase">MRP</p>
              <p className="text-sm font-bold">{formatINR(pricing?.mrp || 0)}</p>
            </div>
            <div className="rounded border p-2">
              <p className="text-[10px] text-muted-foreground uppercase">Stock</p>
              <p className={`text-sm font-bold ${stock === 0 ? 'text-red-600' : stock <= 5 ? 'text-orange-600' : 'text-emerald-700'}`}>{stock}</p>
            </div>
          </div>

          {/* Pricing */}
          <Section title="Pricing">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <Row label="MRP" value={formatINR(pricing?.mrp || 0)} />
              <Row label="Sale Price" value={formatINR(pricing?.salePrice || 0)} />
              <Row label="Dealer Price" value={pricing?.dealerPrice ? formatINR(pricing.dealerPrice) : '—'} />
              <Row label="Purchase Price" value={pricing?.purchasePrice ? formatINR(pricing.purchasePrice) : '—'} />
              <Row label="GST Rate" value={`${pricing?.gstRate ?? 18}%`} />
              <Row label="Discount" value={`${pricing?.discountPercent ?? 0}%`} />
            </div>
          </Section>

          {/* Specifications */}
          <Section title="Key Specifications">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {Object.entries(product.keySpecs || {}).map(([k, v]) => (
                <Row key={k} label={k} value={v} />
              ))}
            </div>
          </Section>

          {/* Features */}
          <Section title="Features">
            <div className="flex flex-wrap gap-1">
              {product.features?.map((f, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
              ))}
            </div>
          </Section>

          {/* Inventory transaction ledger */}
          <Section title={`Inventory Ledger (${txnData?.transactions?.length || 0})`}>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
              </div>
            ) : (
              <ScrollArea className="max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs text-right">Qty</TableHead>
                      <TableHead className="text-xs">Reference</TableHead>
                      <TableHead className="text-xs text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txnData?.transactions?.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
                        </TableCell>
                        <TableCell className={`text-xs text-right font-medium ${t.quantity > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {t.quantity > 0 ? '+' : ''}{t.quantity}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{t.reference || '—'}</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">
                          {new Date(t.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
            <Separator className="my-2" />
            <div className="text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opening Stock</span>
                <span>{txnData?.transactions?.find((t: any) => t.type === 'OPENING')?.quantity ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">+ Purchases + Returns</span>
                <span className="text-emerald-700">
                  {txnData?.transactions?.filter((t: any) => ['PURCHASE', 'RETURN'].includes(t.type)).reduce((s: number, t: any) => s + Math.abs(t.quantity), 0) ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">− Sales − Damage</span>
                <span className="text-red-600">
                  {txnData?.transactions?.filter((t: any) => ['SALE', 'DAMAGE'].includes(t.type)).reduce((s: number, t: any) => s + Math.abs(t.quantity), 0) ?? 0}
                </span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-bold">
                <span>Current Stock</span>
                <span>{stock}</span>
              </div>
            </div>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t pt-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{title}</h4>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
