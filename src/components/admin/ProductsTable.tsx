'use client'
import { useState, useMemo } from 'react'
import { useCatalog, formatINR } from '@/lib/cctv/hooks'
import { useQueryClient } from '@tanstack/react-query'
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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { Search, Eye, Package, AlertTriangle, XCircle, Plus, Pencil, Trash2, Save, X, Image as ImageIcon, ArrowUp, ArrowDown, Star, Power, Loader2, Plus as PlusIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Product, Brand, Category } from '@/lib/cctv/types'

const PAGE_SIZE = 10

export function ProductsTable() {
  const { data, isLoading } = useCatalog()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState<string>('all')
  const [category, setCategory] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newProductOpen, setNewProductOpen] = useState(false)

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

  // Quick toggle: enable/disable product inline
  async function toggleActive(p: Product, newValue: boolean) {
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, isActive: newValue }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${p.name} ${newValue ? 'enabled' : 'disabled'}`)
      qc.invalidateQueries({ queryKey: ['catalog'] })
    } catch {
      toast.error('Failed to update product status')
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Toolbar */}
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
          <Button size="sm" onClick={() => setNewProductOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-3.5 w-3.5 mr-1" /> New Product
          </Button>
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
                    <TableHead className="text-xs text-center">Active</TableHead>
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
                        <TableCell className="text-center">
                          <Switch
                            checked={p.isActive}
                            onCheckedChange={(v) => toggleActive(p, v)}
                            onClick={(e) => e.stopPropagation()}
                            className="scale-90"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelectedId(p.id) }}>
                            <Pencil className="h-3.5 w-3.5" />
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

      {/* New product modal */}
      <NewProductDialog open={newProductOpen} onOpenChange={setNewProductOpen} />
    </Card>
  )
}

// ===========================================================================
// PRODUCT EDITOR DRAWER (with all editing capabilities)
// ===========================================================================
function ProductDrawer({ product, open, onOpenChange }: {
  product: Product | undefined
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { data: catalog } = useCatalog()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Local editable copy
  const [form, setForm] = useState<any>(null)

  // Fetch inventory transactions for this product
  const { data: txnData, isLoading: txnsLoading } = useQuery({
    queryKey: ['inventory', product?.id],
    queryFn: async () => {
      const r = await fetch(`/api/inventory?productId=${product!.id}`)
      if (!r.ok) throw new Error('Failed')
      return r.json()
    },
    enabled: !!product?.id && open,
  })

  // Initialize form when product changes or editing starts
  function startEditing() {
    if (!product) return
    setForm({
      name: product.name,
      sku: product.sku,
      modelNumber: product.modelNumber,
      brandId: product.brandId,
      categoryId: product.categoryId,
      productType: product.productType,
      variety: product.variety || '',
      technology: product.technology || '',
      megapixel: product.megapixel || '',
      channels: product.channels || '',
      shortDescription: product.shortDescription || '',
      longDescription: product.longDescription || '',
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      // pricing
      mrp: product.pricing?.mrp || 0,
      salePrice: product.pricing?.salePrice || 0,
      dealerPrice: product.pricing?.dealerPrice || '',
      purchasePrice: product.pricing?.purchasePrice || '',
      gstRate: product.pricing?.gstRate ?? 18,
      discountPercent: product.pricing?.discountPercent ?? 0,
      // inventory
      quantity: product.inventory?.quantity || 0,
      lowStockThreshold: product.inventory?.lowStockThreshold || 5,
      // specs & features & images
      keySpecs: { ...(product.keySpecs || {}) },
      features: [...(product.features || [])],
      images: [...(product.images || [])],
      // learning
      learningTitle: product.learning?.title || '',
      learningSimple: product.learning?.simpleExplanation || '',
      learningTech: product.learning?.technicalDetails || '',
    })
    setEditing(true)
  }

  if (!product) return null

  async function save() {
    setSaving(true)
    try {
      // Build specs array for editing
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product!.id,
          name: form.name,
          sku: form.sku,
          modelNumber: form.modelNumber,
          brandId: form.brandId,
          categoryId: form.categoryId,
          productType: form.productType,
          variety: form.variety || null,
          technology: form.technology || null,
          megapixel: form.megapixel || null,
          channels: form.channels ? parseInt(form.channels, 10) : null,
          shortDescription: form.shortDescription,
          longDescription: form.longDescription || null,
          isActive: form.isActive,
          isFeatured: form.isFeatured,
          keySpecs: form.keySpecs,
          features: form.features,
          images: form.images,
          pricing: {
            mrp: parseFloat(form.mrp) || 0,
            salePrice: parseFloat(form.salePrice) || 0,
            dealerPrice: form.dealerPrice ? parseFloat(form.dealerPrice) : null,
            purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
            gstRate: parseFloat(form.gstRate) || 0,
            discountPercent: parseFloat(form.discountPercent) || 0,
          },
          inventory: {
            quantity: parseInt(form.quantity) || 0,
            lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
          },
          learning: form.learningTitle ? {
            title: form.learningTitle,
            simpleExplanation: form.learningSimple,
            technicalDetails: form.learningTech || null,
          } : undefined,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed')
      }
      toast.success('Product updated successfully')
      setEditing(false)
      qc.invalidateQueries({ queryKey: ['catalog'] })
      qc.invalidateQueries({ queryKey: ['inventory', product!.id] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      const res = await fetch(`/api/products?id=${product!.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Product deleted')
      setConfirmDelete(false)
      onOpenChange(false)
      qc.invalidateQueries({ queryKey: ['catalog'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    } catch {
      toast.error('Failed to delete product')
    } finally {
      setSaving(false)
    }
  }

  const stock = product.inventory?.quantity || 0
  const pricing = product.pricing

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setEditing(false) }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <SheetTitle className="text-base">{editing ? `Edit: ${product.name}` : product.name}</SheetTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="font-mono">{product.sku}</span>
                <span>·</span>
                <span>{product.brand?.name}</span>
                <Badge variant={product.isActive ? 'secondary' : 'outline'} className={`text-[10px] ${product.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-muted'}`}>
                  {product.isActive ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {!editing ? (
                <>
                  <Button size="sm" variant="outline" onClick={startEditing}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}><X className="h-3 w-3 mr-1" /> Cancel</Button>
                  <Button size="sm" onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                    {saving ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saving</> : <><Save className="h-3 w-3 mr-1" /> Save</>}
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-4">
          {!editing ? (
            <>
              {/* READ-ONLY VIEW */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded border p-2"><p className="text-[10px] text-muted-foreground uppercase">Sale Price</p><p className="text-sm font-bold">{formatINR(pricing?.salePrice || 0)}</p></div>
                <div className="rounded border p-2"><p className="text-[10px] text-muted-foreground uppercase">MRP</p><p className="text-sm font-bold">{formatINR(pricing?.mrp || 0)}</p></div>
                <div className="rounded border p-2"><p className="text-[10px] text-muted-foreground uppercase">Stock</p><p className={`text-sm font-bold ${stock === 0 ? 'text-red-600' : stock <= 5 ? 'text-orange-600' : 'text-emerald-700'}`}>{stock}</p></div>
              </div>

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

              <Section title="Images">
                <div className="grid grid-cols-3 gap-2">
                  {product.images && product.images.length > 0 ? product.images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border bg-muted">
                      
                      <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && <Badge className="absolute top-1 left-1 text-[9px] bg-amber-500"><Star className="h-2 w-2 mr-0.5" /> Primary</Badge>}
                    </div>
                  )) : <p className="text-xs text-muted-foreground">No images</p>}
                </div>
              </Section>

              <Section title="Key Specifications">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {Object.entries(product.keySpecs || {}).map(([k, v]) => (
                    <Row key={k} label={k} value={v} />
                  ))}
                </div>
              </Section>

              <Section title="Features">
                <div className="flex flex-wrap gap-1">
                  {product.features?.map((f, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                  ))}
                </div>
              </Section>

              {product.longDescription && (
                <Section title="Description">
                  <p className="text-xs leading-relaxed text-muted-foreground">{product.longDescription}</p>
                </Section>
              )}

              <Section title={`Inventory Ledger (${txnData?.transactions?.length || 0})`}>
                {txnsLoading ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
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
                            <TableCell><Badge variant="outline" className="text-[10px]">{t.type}</Badge></TableCell>
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
              </Section>
            </>
          ) : (
            <>
              {/* ============ EDIT MODE ============ */}
              <Section title="Basic Info">
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Product name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">SKU *</Label>
                      <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="font-mono" />
                    </div>
                    <div>
                      <Label className="text-xs">Model number</Label>
                      <Input value={form.modelNumber} onChange={(e) => setForm({ ...form, modelNumber: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Brand *</Label>
                      <Select value={form.brandId} onValueChange={(v) => setForm({ ...form, brandId: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {catalog?.brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Category *</Label>
                      <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {catalog?.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Short description</Label>
                    <Textarea rows={2} value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Long description</Label>
                    <Textarea rows={3} value={form.longDescription} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} />
                  </div>
                </div>
              </Section>

              <Section title="Classification">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Product type</Label>
                    <Input value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} placeholder="DVR / NVR / IP_CAMERA / etc." />
                  </div>
                  <div>
                    <Label className="text-xs">Variety</Label>
                    <Input value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} placeholder="Dome / Bullet / Turret / PTZ" />
                  </div>
                  <div>
                    <Label className="text-xs">Technology</Label>
                    <Input value={form.technology} onChange={(e) => setForm({ ...form, technology: e.target.value })} placeholder="IP / TVI / CVI / AHD" />
                  </div>
                  <div>
                    <Label className="text-xs">Megapixel</Label>
                    <Input value={form.megapixel} onChange={(e) => setForm({ ...form, megapixel: e.target.value })} placeholder="2MP / 4MP / 4K" />
                  </div>
                  <div>
                    <Label className="text-xs">Channels (recorders)</Label>
                    <Input type="number" value={form.channels} onChange={(e) => setForm({ ...form, channels: e.target.value })} placeholder="4 / 8 / 16 / 32" />
                  </div>
                </div>
              </Section>

              <Section title="Pricing">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">MRP (₹)</Label>
                    <Input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Sale price (₹) *</Label>
                    <Input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Dealer price (₹)</Label>
                    <Input type="number" value={form.dealerPrice} onChange={(e) => setForm({ ...form, dealerPrice: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Purchase price (₹)</Label>
                    <Input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">GST rate (%)</Label>
                    <Input type="number" value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Discount (%)</Label>
                    <Input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} />
                  </div>
                </div>
              </Section>

              <Section title="Inventory">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Stock quantity</Label>
                    <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Low-stock threshold</Label>
                    <Input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
                  </div>
                </div>
              </Section>

              <Section title="Status">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                    <span className="text-xs">Active (visible to customers)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} />
                    <span className="text-xs">Featured</span>
                  </label>
                </div>
              </Section>

              <Section title="Images">
                <ImageEditor images={form.images} onChange={(images) => setForm({ ...form, images })} />
              </Section>

              <Section title="Key specifications">
                <KeySpecsEditor specs={form.keySpecs} onChange={(keySpecs) => setForm({ ...form, keySpecs })} />
              </Section>

              <Section title="Features">
                <FeaturesEditor features={form.features} onChange={(features) => setForm({ ...form, features })} />
              </Section>

              <Section title="Learning content">
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Title</Label>
                    <Input value={form.learningTitle} onChange={(e) => setForm({ ...form, learningTitle: e.target.value })} placeholder="e.g. What is PoE?" />
                  </div>
                  <div>
                    <Label className="text-xs">Simple explanation (plain words)</Label>
                    <Textarea rows={2} value={form.learningSimple} onChange={(e) => setForm({ ...form, learningSimple: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Technical details</Label>
                    <Textarea rows={2} value={form.learningTech} onChange={(e) => setForm({ ...form, learningTech: e.target.value })} />
                  </div>
                </div>
              </Section>
            </>
          )}
        </div>
      </SheetContent>

      {/* Delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Trash2 className="h-4 w-4 text-destructive" /> Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <b>{product.name}</b> ({product.sku}) along with its pricing, inventory, learning content, and transaction history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />} Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}

// ===========================================================================
// IMAGE EDITOR — add/remove/reorder/set primary
// ===========================================================================
function ImageEditor({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const [newUrl, setNewUrl] = useState('')

  function add() {
    if (!newUrl.trim()) return
    onChange([...images, newUrl.trim()])
    setNewUrl('')
  }
  function remove(i: number) {
    onChange(images.filter((_, idx) => idx !== i))
  }
  function setPrimary(i: number) {
    if (i === 0) return
    const arr = [...images]
    const [item] = arr.splice(i, 1)
    arr.unshift(item)
    onChange(arr)
  }
  function move(i: number, dir: 'up' | 'down') {
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= images.length) return
    const arr = [...images]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    onChange(arr)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Paste image URL (https://...)"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <Button size="sm" variant="outline" onClick={add}><PlusIcon className="h-3 w-3 mr-1" /> Add</Button>
      </div>
      {images.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No images yet. The first image becomes the primary product image.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-md overflow-hidden border bg-muted group">
              
              <img src={img} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <Badge className="absolute top-1 left-1 text-[9px] bg-amber-500"><Star className="h-2 w-2 mr-0.5" /> Primary</Badge>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                {i !== 0 && (
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => setPrimary(i)} title="Set as primary">
                    <Star className="h-3 w-3" />
                  </Button>
                )}
                <div className="flex gap-0.5">
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => move(i, 'up')} disabled={i === 0} title="Move up">
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => move(i, 'down')} disabled={i === images.length - 1} title="Move down">
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-300 hover:bg-red-500/30" onClick={() => remove(i)} title="Remove">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground italic">Tip: First image is shown as primary in product cards. Hover an image to set primary, reorder, or remove.</p>
    </div>
  )
}

// ===========================================================================
// KEY SPECS EDITOR — key/value pairs
// ===========================================================================
function KeySpecsEditor({ specs, onChange }: { specs: Record<string, string>; onChange: (s: Record<string, string>) => void }) {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  function add() {
    if (!newKey.trim()) return
    onChange({ ...specs, [newKey.trim()]: newValue.trim() })
    setNewKey('')
    setNewValue('')
  }
  function remove(key: string) {
    const next = { ...specs }
    delete next[key]
    onChange(next)
  }
  function update(key: string, value: string) {
    onChange({ ...specs, [key]: value })
  }

  return (
    <div className="space-y-2">
      {Object.entries(specs).length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No specs yet.</p>
      ) : (
        <div className="space-y-1">
          {Object.entries(specs).map(([k, v]) => (
            <div key={k} className="flex gap-2 items-center">
              <Input value={k} onChange={(e) => {
                const next = { ...specs }
                delete next[k]
                next[e.target.value] = v
                onChange(next)
              }} className="text-xs flex-1" />
              <Input value={v} onChange={(e) => update(k, e.target.value)} className="text-xs flex-1" />
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => remove(k)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-center">
        <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Spec name (e.g. IR Distance)" className="text-xs flex-1" />
        <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Value (e.g. 30m)" className="text-xs flex-1" />
        <Button size="sm" variant="outline" onClick={add}><PlusIcon className="h-3 w-3" /></Button>
      </div>
    </div>
  )
}

// ===========================================================================
// FEATURES EDITOR — list of strings
// ===========================================================================
function FeaturesEditor({ features, onChange }: { features: string[]; onChange: (f: string[]) => void }) {
  const [newFeature, setNewFeature] = useState('')

  function add() {
    if (!newFeature.trim()) return
    onChange([...features, newFeature.trim()])
    setNewFeature('')
  }
  function remove(i: number) {
    onChange(features.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-2">
      {features.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No features yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {features.map((f, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] gap-1">
              {f}
              <button onClick={() => remove(i)} className="ml-1 hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="Add feature (e.g. AI Detection)"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          className="text-xs"
        />
        <Button size="sm" variant="outline" onClick={add}><PlusIcon className="h-3 w-3 mr-1" /> Add</Button>
      </div>
    </div>
  )
}

// ===========================================================================
// NEW PRODUCT DIALOG
// ===========================================================================
function NewProductDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: catalog } = useCatalog()
  const qc = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', sku: '', modelNumber: '', brandId: '', categoryId: '',
    productType: 'ACCESSORY', variety: '', technology: '', megapixel: '', channels: '',
    shortDescription: '', longDescription: '',
    mrp: '', salePrice: '', dealerPrice: '', purchasePrice: '', gstRate: '18', discountPercent: '0',
    stock: '0', lowStockThreshold: '5',
    images: [] as string[],
    features: [] as string[],
    keySpecs: {} as Record<string, string>,
    learningTitle: '', learningSimple: '', learningTech: '',
  })

  function reset() {
    setForm({
      name: '', sku: '', modelNumber: '', brandId: '', categoryId: '',
      productType: 'ACCESSORY', variety: '', technology: '', megapixel: '', channels: '',
      shortDescription: '', longDescription: '',
      mrp: '', salePrice: '', dealerPrice: '', purchasePrice: '', gstRate: '18', discountPercent: '0',
      stock: '0', lowStockThreshold: '5',
      images: [], features: [], keySpecs: {},
      learningTitle: '', learningSimple: '', learningTech: '',
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.sku || !form.brandId || !form.categoryId) {
      toast.error('Please fill in name, SKU, brand, and category')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          channels: form.channels ? parseInt(form.channels) : null,
          mrp: parseFloat(form.mrp) || 0,
          salePrice: parseFloat(form.salePrice) || 0,
          dealerPrice: form.dealerPrice ? parseFloat(form.dealerPrice) : null,
          purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
          gstRate: parseFloat(form.gstRate) || 18,
          discountPercent: parseFloat(form.discountPercent) || 0,
          stock: parseInt(form.stock) || 0,
          lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed')
      }
      toast.success('Product created successfully')
      reset()
      onOpenChange(false)
      qc.invalidateQueries({ queryKey: ['catalog'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4 text-emerald-600" /> Create New Product</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-4">
          <Section title="Basic Info *">
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Product name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">SKU *</Label>
                  <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="font-mono" required />
                </div>
                <div>
                  <Label className="text-xs">Model number</Label>
                  <Input value={form.modelNumber} onChange={(e) => setForm({ ...form, modelNumber: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Brand *</Label>
                  <Select value={form.brandId} onValueChange={(v) => setForm({ ...form, brandId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent>
                      {catalog?.brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Category *</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {catalog?.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Short description</Label>
                <Textarea rows={2} value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
              </div>
            </div>
          </Section>

          <Section title="Classification">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Product type</Label>
                <Input value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Variety</Label>
                <Input value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Technology</Label>
                <Input value={form.technology} onChange={(e) => setForm({ ...form, technology: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Megapixel</Label>
                <Input value={form.megapixel} onChange={(e) => setForm({ ...form, megapixel: e.target.value })} />
              </div>
            </div>
          </Section>

          <Section title="Pricing *">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">MRP (₹)</Label>
                <Input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Sale price (₹) *</Label>
                <Input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} required />
              </div>
              <div>
                <Label className="text-xs">Dealer price (₹)</Label>
                <Input type="number" value={form.dealerPrice} onChange={(e) => setForm({ ...form, dealerPrice: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Purchase price (₹)</Label>
                <Input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">GST rate (%)</Label>
                <Input type="number" value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Discount (%)</Label>
                <Input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} />
              </div>
            </div>
          </Section>

          <Section title="Initial Inventory">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Opening stock</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Low-stock threshold</Label>
                <Input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
              </div>
            </div>
          </Section>

          <Section title="Images">
            <ImageEditor images={form.images} onChange={(images) => setForm({ ...form, images })} />
          </Section>

          <Section title="Key specifications">
            <KeySpecsEditor specs={form.keySpecs} onChange={(keySpecs) => setForm({ ...form, keySpecs })} />
          </Section>

          <Section title="Features">
            <FeaturesEditor features={form.features} onChange={(features) => setForm({ ...form, features })} />
          </Section>

          <div className="flex gap-2 sticky bottom-0 bg-background pt-3 pb-3 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              {saving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Creating</> : <><Plus className="h-3.5 w-3.5 mr-1.5" /> Create product</>}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ===========================================================================
// Shared bits
// ===========================================================================
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
