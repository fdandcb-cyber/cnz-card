'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Minus, Plus, GraduationCap, ShoppingCart, Check, AlertTriangle, Package } from 'lucide-react'
import type { Product } from '@/lib/cctv/types'
import { formatINR } from '@/lib/cctv/hooks'
import { useSetupStore, type SetupSection } from '@/lib/cctv/setup-store'

export function ProductCard({ product, section, compact = false }: {
  product: Product
  section: SetupSection
  compact?: boolean
}) {
  const [qty, setQty] = useState(1)
  const [showLearn, setShowLearn] = useState(false)
  const addItem = useSetupStore((s) => s.addItem)
  const images = product.images && product.images.length > 0 ? product.images : ['https://placehold.co/600x400/e2e8f0/64748b?text=No+Image']
  const pricing = product.pricing
  const discountPercent = pricing?.discountPercent || 0
  const stock = product.inventory?.quantity || 0
  const isLowStock = stock > 0 && stock <= (product.inventory?.lowStockThreshold ?? 5)
  const isOutOfStock = stock === 0

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow group">
      <CardHeader className="p-0 relative">
        <div className="relative w-full aspect-[4/3] bg-muted">
          {images.length > 1 ? (
            <Carousel opts={{ loop: true }} className="w-full h-full">
              <CarouselContent className="h-full">
                {images.map((src, i) => (
                  <CarouselItem key={i} className="h-full">
                    <div className="relative w-full h-full">
                      <Image
                        src={src}
                        alt={`${product.name} - image ${i + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 h-8 w-8 bg-background/80" />
              <CarouselNext className="right-2 h-8 w-8 bg-background/80" />
            </Carousel>
          ) : (
            <div className="relative w-full h-full">
              <Image
                src={images[0]}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
                unoptimized
              />
            </div>
          )}
        </div>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isFeatured && <Badge className="bg-amber-500 text-white">Featured</Badge>}
          {discountPercent > 0 && <Badge className="bg-emerald-600 text-white">-{discountPercent}%</Badge>}
          {isOutOfStock && <Badge variant="destructive">Out of stock</Badge>}
          {isLowStock && <Badge variant="secondary" className="bg-orange-100 text-orange-700">Low stock</Badge>}
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{product.brand?.name}</p>
            <h3 className="font-semibold text-sm leading-snug line-clamp-2">{product.name}</h3>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{product.modelNumber}</p>
          </div>
        </div>

        {!compact && (
          <p className="text-xs text-muted-foreground line-clamp-2">{product.shortDescription}</p>
        )}

        {/* Spec badges */}
        <div className="flex flex-wrap gap-1 mt-1">
          {product.megapixel && <Badge variant="outline" className="text-[10px] py-0 px-1.5">{product.megapixel}</Badge>}
          {product.technology && <Badge variant="outline" className="text-[10px] py-0 px-1.5">{product.technology}</Badge>}
          {product.variety && <Badge variant="outline" className="text-[10px] py-0 px-1.5">{product.variety}</Badge>}
          {product.channels && <Badge variant="outline" className="text-[10px] py-0 px-1.5">{product.channels}CH</Badge>}
          {product.keySpecs?.PoEBudget && <Badge variant="outline" className="text-[10px] py-0 px-1.5">PoE {product.keySpecs.PoEBudget}</Badge>}
          {product.keySpecs?.Capacity && <Badge variant="outline" className="text-[10px] py-0 px-1.5">{product.keySpecs.Capacity}</Badge>}
        </div>

        {/* Price */}
        {pricing && (
          <div className="mt-1 flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-bold text-emerald-700">{formatINR(pricing.salePrice)}</span>
            {pricing.mrp > pricing.salePrice && (
              <span className="text-xs text-muted-foreground line-through">{formatINR(pricing.mrp)}</span>
            )}
            {discountPercent > 0 && (
              <span className="text-[10px] text-emerald-700 font-medium">Save {formatINR(pricing.mrp - pricing.salePrice)}</span>
            )}
          </div>
        )}

        {/* Stock indicator */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Package className="h-3 w-3" />
          <span>{stock} in stock{product.inventory?.warehouseId ? ' · WH-MAIN' : ''}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        {!compact && (
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setShowLearn(true)}>
            <GraduationCap className="h-3.5 w-3.5 mr-1.5" /> Learn
          </Button>
        )}

        {/* Quantity + Add */}
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center border rounded-md">
            <Button size="icon" variant="ghost" className="h-8 w-8"
              onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">{qty}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setQty((q) => q + 1)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button size="sm" className="flex-1" onClick={() => addItem(section, product, qty)} disabled={isOutOfStock}>
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Add
          </Button>
        </div>
      </CardFooter>

      <LearnModal product={product} open={showLearn} onOpenChange={setShowLearn} />
    </Card>
  )
}

function LearnModal({ product, open, onOpenChange }: {
  product: Product
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const learning = product.learning
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            {learning?.title || `About: ${product.name}`}
          </DialogTitle>
          <DialogDescription>
            A simple explanation of this product and its key features.
          </DialogDescription>
        </DialogHeader>

        {learning ? (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1">In plain words</h4>
              <p className="text-sm leading-relaxed">{learning.simpleExplanation}</p>
            </div>
            {learning.technicalDetails && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Technical details</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-mono bg-muted p-2 rounded">{learning.technicalDetails}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No learning content available.</p>
        )}

        {/* Key specs table */}
        {Object.keys(product.keySpecs || {}).length > 0 && (
          <div className="border-t pt-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Key specifications</h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {Object.entries(product.keySpecs).slice(0, 8).map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="text-muted-foreground text-[10px]">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature badges */}
        {product.features && product.features.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Features</h4>
            <div className="flex flex-wrap gap-1">
              {product.features.map((f, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">
                  <Check className="h-2.5 w-2.5 mr-1 text-emerald-600" /> {f}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
