'use client'
import { useSetupStore } from '@/lib/cctv/setup-store'
import { AdminOverview } from './AdminOverview'
import { ProductsTable } from './ProductsTable'
import { RulesManager } from './RulesManager'
import { WarehousesView, SuppliersView } from './WarehousesView'
import { QuotesView } from './QuotesView'
import { LayoutDashboard, Package, Shield, Building2, Truck, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'rules', label: 'CCTV Rules', icon: Shield },
  { key: 'quotes', label: 'Quote Requests', icon: FileText },
  { key: 'warehouses', label: 'Warehouses', icon: Building2 },
  { key: 'suppliers', label: 'Suppliers', icon: Truck },
] as const

export function AdminView() {
  const tab = useSetupStore((s) => s.adminTab)
  const setTab = useSetupStore((s) => s.setAdminTab)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = tab === item.key
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left',
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
      </aside>

      {/* Mobile horizontal nav */}
      <div className="lg:hidden flex gap-1 overflow-x-auto pb-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = tab === item.key
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0',
                isActive ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="min-w-0">
        {tab === 'dashboard' && <AdminOverview />}
        {tab === 'products' && <ProductsTable />}
        {tab === 'inventory' && <ProductsTable />}
        {tab === 'rules' && <RulesManager />}
        {tab === 'quotes' && <QuotesView />}
        {tab === 'warehouses' && <WarehousesView />}
        {tab === 'suppliers' && <SuppliersView />}
      </div>
    </div>
  )
}
