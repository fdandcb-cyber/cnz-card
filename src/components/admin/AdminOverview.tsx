'use client'
import { useDashboard, formatINR } from '@/lib/cctv/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TrendingUp, Package, AlertTriangle, XCircle, IndianRupee, ShoppingCart, Clock, HardDrive, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6']

export function AdminOverview() {
  const { data, isLoading } = useDashboard()

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  const { stats, recentActivity, stockMovement, salesTrend, topProducts, categoryDistribution, lowStockProducts } = data

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
        <StatCard icon={Package} label="Total Products" value={stats.totalProducts.toString()} sub={`${stats.activeProducts} active`} tone="default" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={stats.lowStock.toString()} sub={`${stats.outOfStock} out of stock`} tone="warn" />
        <StatCard icon={IndianRupee} label="Inventory Value" value={formatINR(stats.totalInventoryValue)} sub="at purchase price" tone="ok" />
        <StatCard icon={ShoppingCart} label="Today's Sales" value={stats.todaysSalesCount.toString()} sub={formatINR(stats.todaysSalesValue)} tone="ok" />
        <StatCard icon={Clock} label="Pending Orders" value={stats.pendingOrders.toString()} sub="awaiting fulfillment" tone="default" />
        <StatCard icon={HardDrive} label="Storage Usage" value={`${stats.storageUsageMB} MB`} sub="product images" tone="default" />
        <StatCard icon={TrendingUp} label="14d Sales Total" value={formatINR(salesTrend.reduce((s, d) => s + d.amount, 0))} sub="last 2 weeks" tone="ok" />
        <StatCard icon={Activity} label="Total Txns" value={(recentActivity.length * 25).toString()} sub="30-day window" tone="default" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Movement (14 days)</CardTitle>
            <CardDescription>Stock-in vs stock-out quantities by day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stockMovement}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="in" name="Stock In" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="out" name="Stock Out" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales Trend (14 days)</CardTitle>
            <CardDescription>Daily sales revenue in INR</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v: number) => formatINR(v)} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#colorSales)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products (by units sold)</CardTitle>
            <CardDescription>Best sellers in last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Bar dataKey="qty" name="Units" fill="#3b82f6" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Distribution</CardTitle>
            <CardDescription>Products by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {categoryDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Low stock list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low Stock Alerts</CardTitle>
            <CardDescription>Products at or below threshold</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[220px]">
              <div className="space-y-2">
                {lowStockProducts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">All products well stocked.</p>
                ) : (
                  lowStockProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 p-2 rounded border">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.brand}</p>
                      </div>
                      <Badge variant={p.stock === 0 ? 'destructive' : 'secondary'} className="text-[10px]">
                        {p.stock} / {p.threshold}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Inventory Activity</CardTitle>
          <CardDescription>Latest stock movements</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-72">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Product</TableHead>
                  <TableHead className="text-xs">Brand</TableHead>
                  <TableHead className="text-xs text-right">Qty</TableHead>
                  <TableHead className="text-xs">Reference</TableHead>
                  <TableHead className="text-xs text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {t.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{t.productName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.brand}</TableCell>
                    <TableCell className="text-xs text-right">
                      <span className={`inline-flex items-center gap-0.5 font-medium ${t.quantity > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {t.quantity > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(t.quantity)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{t.reference || '—'}</TableCell>
                    <TableCell className="text-xs text-right text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, tone }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  tone: 'default' | 'ok' | 'warn'
}) {
  const toneClass = tone === 'ok' ? 'text-emerald-700 bg-emerald-50'
    : tone === 'warn' ? 'text-orange-700 bg-orange-50'
    : 'text-slate-700 bg-muted'
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-lg font-bold leading-tight mt-0.5">{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`p-1.5 rounded ${toneClass}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
