'use client'
import { useSetupStore } from '@/lib/cctv/setup-store'
import { CustomerView } from '@/components/cctv/CustomerView'
import { AdminView } from '@/components/admin/AdminView'
import { Cctv, LayoutDashboard, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCatalog } from '@/lib/cctv/hooks'

export default function Home() {
  const view = useSetupStore((s) => s.view)
  const setView = useSetupStore((s) => s.setView)
  const { data } = useCatalog()

  const cameraCount = data?.products.filter((p) => p.productType.includes('CAMERA')).length || 0
  const totalProducts = data?.products.length || 0

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center text-white">
                <Cctv className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-bold leading-tight">SecureVision CCTV</h1>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">Catalog & Intelligent Setup Builder</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px]">{totalProducts} products</Badge>
              <Badge variant="outline" className="text-[10px]">{cameraCount} cameras</Badge>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Database-driven</Badge>
            </div>

            <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
              <Button
                size="sm"
                variant={view === 'customer' ? 'default' : 'ghost'}
                onClick={() => setView('customer')}
                className={view === 'customer' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                <Cctv className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">Customer</span>
              </Button>
              <Button
                size="sm"
                variant={view === 'admin' ? 'default' : 'ghost'}
                onClick={() => setView('admin')}
                className={view === 'admin' ? 'bg-slate-800 hover:bg-slate-900 text-white' : ''}
              >
                <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-4">
        {view === 'customer' ? <CustomerView /> : <AdminView />}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-emerald-600" />
              <span>SecureVision CCTV Platform · Demo with realistic seed data · Supabase-compatible Prisma schema</span>
            </div>
            <div className="flex items-center gap-3">
              <span>10 brands</span>
              <span>·</span>
              <span>8 categories</span>
              <span>·</span>
              <span>2 warehouses</span>
              <span>·</span>
              <span>2 suppliers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
