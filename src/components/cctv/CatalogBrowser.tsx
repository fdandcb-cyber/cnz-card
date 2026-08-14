'use client'
import { useState, useMemo } from 'react'
import { useCatalog, formatINR } from '@/lib/cctv/hooks'
import type { Product } from '@/lib/cctv/types'
import { ProductCard } from './ProductCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, SlidersHorizontal, X, Cctv, Cable, HardDrive, Zap, Network, Wrench, Boxes } from 'lucide-react'
import type { SetupSection } from '@/lib/cctv/setup-store'

type CategoryFilter = {
  slug: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  section: SetupSection
}

const CATEGORY_FILTERS: CategoryFilter[] = [
  { slug: 'ip-cameras', name: 'IP Cameras', icon: Cctv, section: 'cameras' },
  { slug: 'analog-cameras', name: 'Analog Cameras', icon: Cctv, section: 'cameras' },
  { slug: 'recorders', name: 'DVR / NVR', icon: Boxes, section: 'recorders' },
  { slug: 'storage', name: 'HDD / Storage', icon: HardDrive, section: 'storage' },
  { slug: 'poe', name: 'PoE Devices', icon: Network, section: 'poe' },
  { slug: 'smps', name: 'Power Supply', icon: Zap, section: 'power' },
  { slug: 'cables', name: 'Cables', icon: Cable, section: 'cables' },
  { slug: 'accessories', name: 'Accessories', icon: Wrench, section: 'accessories' },
]

export function CatalogBrowser() {
  const { data, isLoading } = useCatalog()
  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState<string>('all')
  const [variety, setVariety] = useState<string>('all')
  const [megapixel, setMegapixel] = useState<string>('all')
  const [sort, setSort] = useState<string>('featured')
  const [activeCat, setActiveCat] = useState<string>('ip-cameras')

  const products = data?.products || []

  const filtered = useMemo(() => {
    // Customer view: only show active products
    let r = products.filter((p) => p.isActive && p.category?.slug === activeCat)
    if (search) {
      const q = search.toLowerCase()
      r = r.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.modelNumber.toLowerCase().includes(q) ||
        p.brand?.name.toLowerCase().includes(q),
      )
    }
    if (brand !== 'all') r = r.filter((p) => p.brandId === brand)
    if (variety !== 'all') r = r.filter((p) => p.variety === variety)
    if (megapixel !== 'all') r = r.filter((p) => p.megapixel === megapixel)

    switch (sort) {
      case 'price-low': r = [...r].sort((a, b) => (a.pricing?.salePrice || 0) - (b.pricing?.salePrice || 0)); break
      case 'price-high': r = [...r].sort((a, b) => (b.pricing?.salePrice || 0) - (a.pricing?.salePrice || 0)); break
      case 'name': r = [...r].sort((a, b) => a.name.localeCompare(b.name)); break
      case 'featured': r = [...r].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured)); break
    }
    return r
  }, [products, activeCat, search, brand, variety, megapixel, sort])

  // Unique filter values for active category (only count active products)
  const brandsInCat = useMemo(() => {
    const set = new Set(products.filter((p) => p.isActive && p.category?.slug === activeCat).map((p) => p.brandId))
    return data?.brands.filter((b) => set.has(b.id)) || []
  }, [products, activeCat, data])

  const varieties = useMemo(() => {
    const set = new Set<string>()
    products.filter((p) => p.isActive && p.category?.slug === activeCat).forEach((p) => p.variety && set.add(p.variety))
    return Array.from(set)
  }, [products, activeCat])

  const megapixels = useMemo(() => {
    const set = new Set<string>()
    products.filter((p) => p.isActive && p.category?.slug === activeCat).forEach((p) => p.megapixel && set.add(p.megapixel))
    return Array.from(set)
  }, [products, activeCat])

  const activeCatData = CATEGORY_FILTERS.find((c) => c.slug === activeCat)

  return (
    <div className="space-y-4">
      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map((cat) => {
          const Icon = cat.icon
          const isActive = activeCat === cat.slug
          return (
            <Button
              key={cat.slug}
              size="sm"
              variant={isActive ? 'default' : 'outline'}
              onClick={() => { setActiveCat(cat.slug); setVariety('all'); setMegapixel('all') }}
              className="text-xs"
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {cat.name}
            </Button>
          )
        })}
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, brand, model, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[160px]">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured first</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="name">Name: A to Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground">Filters:</span>
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brandsInCat.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {varieties.length > 0 && (
          <Select value={variety} onValueChange={setVariety}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {varieties.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {megapixels.length > 0 && (
          <Select value={megapixel} onValueChange={setMegapixel}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="Megapixel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resolutions</SelectItem>
              {megapixels.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {(brand !== 'all' || variety !== 'all' || megapixel !== 'all') && (
          <Button size="sm" variant="ghost" onClick={() => { setBrand('all'); setVariety('all'); setMegapixel('all') }} className="text-xs h-8">
            <X className="h-3 w-3 mr-1" /> Clear filters
          </Button>
        )}

        <Badge variant="secondary" className="ml-auto">{filtered.length} products</Badge>
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No products match your filters.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => { setSearch(''); setBrand('all'); setVariety('all'); setMegapixel('all') }}>
            Reset all
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} section={activeCatData?.section || 'accessories'} />
          ))}
        </div>
      )}
    </div>
  )
}
