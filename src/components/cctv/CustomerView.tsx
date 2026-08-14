'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CatalogBrowser } from './CatalogBrowser'
import { Calculators } from './Calculators'
import { SetupSummary } from './SetupSummary'
import { SetupSteps } from './SetupSteps'
import { useSetupStore } from '@/lib/cctv/setup-store'
import { Cctv, Calculator, Boxes, Eye } from 'lucide-react'

export function CustomerView() {
  const currentStep = useSetupStore((s) => s.currentStep)

  return (
    <div className="space-y-4 pb-24 lg:pb-4">
      {/* Hero strip */}
      <div className="rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-5 md:p-7">
        <div className="max-w-3xl">
          <h2 className="text-xl md:text-2xl font-bold leading-tight">Build a complete CCTV system in 7 simple steps</h2>
          <p className="text-sm md:text-base text-emerald-50 mt-1.5">
            No technical knowledge required. Browse cameras, recorders, storage, power, cables, and accessories — our compatibility engine tells you what works together.
          </p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-emerald-50">
            <span className="inline-flex items-center gap-1"><Cctv className="h-3.5 w-3.5" /> 36 demo products</span>
            <span className="inline-flex items-center gap-1"><Calculator className="h-3.5 w-3.5" /> 4 calculators</span>
            <span className="inline-flex items-center gap-1"><Boxes className="h-3.5 w-3.5" /> Compatibility engine</span>
            <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Learn feature on every product</span>
          </div>
        </div>
      </div>

      {/* Setup steps */}
      <SetupSteps />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4 min-w-0">
          <Tabs defaultValue="catalog">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="catalog"><Cctv className="h-3.5 w-3.5 mr-1" /> Catalog</TabsTrigger>
              <TabsTrigger value="calculators"><Calculator className="h-3.5 w-3.5 mr-1" /> Calculators</TabsTrigger>
            </TabsList>
            <TabsContent value="catalog" className="mt-4">
              <CatalogBrowser />
            </TabsContent>
            <TabsContent value="calculators" className="mt-4">
              <Calculators />
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden lg:block">
          <SetupSummary />
        </div>
      </div>

      {/* Mobile sticky summary */}
      <SetupSummary sticky />
    </div>
  )
}
