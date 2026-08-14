'use client'
import { useCatalog } from '@/lib/cctv/hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, Truck, MapPin, Phone, Mail } from 'lucide-react'

export function WarehousesView() {
  const { data, isLoading } = useCatalog()
  if (isLoading || !data) return <Skeleton className="h-64" />
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Warehouses</CardTitle>
        <CardDescription>Storage locations and warehouse codes for stock transfer operations.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">City</TableHead>
              <TableHead className="text-xs">Phone</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.warehouses.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="text-xs font-mono">{w.code}</TableCell>
                <TableCell className="text-xs font-medium">{w.name}</TableCell>
                <TableCell className="text-xs"><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground" />{w.city}</span></TableCell>
                <TableCell className="text-xs"><span className="inline-flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{w.phone}</span></TableCell>
                <TableCell><Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">Active</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function SuppliersView() {
  const { data, isLoading } = useCatalog()
  if (isLoading || !data) return <Skeleton className="h-64" />
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" /> Suppliers</CardTitle>
        <CardDescription>Vendor master data — used for purchase orders and lead time tracking.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Contact</TableHead>
              <TableHead className="text-xs">Phone / Email</TableHead>
              <TableHead className="text-xs">GST</TableHead>
              <TableHead className="text-xs">Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.suppliers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-xs font-medium">{s.name}</TableCell>
                <TableCell className="text-xs">{s.contactPerson}</TableCell>
                <TableCell className="text-xs">
                  <div className="flex flex-col gap-0.5">
                    {s.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{s.phone}</span>}
                    {s.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" />{s.email}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono">{s.gstNumber || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs">{s.address}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
