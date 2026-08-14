'use client'
import { useRules, useCatalog } from '@/lib/cctv/hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Database, Zap, Cable, Shield, Lightbulb, GraduationCap } from 'lucide-react'

export function RulesManager() {
  return (
    <Tabs defaultValue="compat">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
        <TabsTrigger value="compat" className="text-xs"><Shield className="h-3.5 w-3.5 mr-1" /> Compatibility</TabsTrigger>
        <TabsTrigger value="storage" className="text-xs"><Database className="h-3.5 w-3.5 mr-1" /> Storage</TabsTrigger>
        <TabsTrigger value="power" className="text-xs"><Zap className="h-3.5 w-3.5 mr-1" /> Power</TabsTrigger>
        <TabsTrigger value="cable" className="text-xs"><Cable className="h-3.5 w-3.5 mr-1" /> Cable</TabsTrigger>
        <TabsTrigger value="learn" className="text-xs"><GraduationCap className="h-3.5 w-3.5 mr-1" /> Learning</TabsTrigger>
      </TabsList>
      <TabsContent value="compat"><CompatibilityRulesTab /></TabsContent>
      <TabsContent value="storage"><StorageRulesTab /></TabsContent>
      <TabsContent value="power"><PowerRulesTab /></TabsContent>
      <TabsContent value="cable"><CableRulesTab /></TabsContent>
      <TabsContent value="learn"><LearningTab /></TabsContent>
    </Tabs>
  )
}

function CompatibilityRulesTab() {
  const { data, isLoading } = useRules()
  if (isLoading) return <Skeleton className="h-64" />
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Compatibility Rules</CardTitle>
        <CardDescription>Rules engine for validating customer setup configurations. Stored in DB — editable via API.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[420px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Rule</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Source → Target</TableHead>
                <TableHead className="text-xs">Severity</TableHead>
                <TableHead className="text-xs">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.compatibilityRules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-medium">{r.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{r.ruleType}</Badge></TableCell>
                  <TableCell className="text-xs font-mono">{r.sourceType} → {r.targetType}</TableCell>
                  <TableCell>
                    <Badge variant={r.severity === 'ERROR' ? 'destructive' : r.severity === 'WARNING' ? 'secondary' : 'outline'}
                      className={`text-[10px] ${r.severity === 'WARNING' ? 'bg-amber-100 text-amber-700' : ''}`}>
                      {r.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs">{r.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function StorageRulesTab() {
  const { data, isLoading } = useRules()
  if (isLoading) return <Skeleton className="h-64" />
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> Storage Calculation Rules</CardTitle>
        <CardDescription>Bitrate assumptions per megapixel × codec. Used by the HDD retention calculator.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Megapixel</TableHead>
              <TableHead className="text-xs">Codec</TableHead>
              <TableHead className="text-xs text-right">Bitrate (Mbps)</TableHead>
              <TableHead className="text-xs text-right">FPS</TableHead>
              <TableHead className="text-xs text-right">Motion Factor</TableHead>
              <TableHead className="text-xs text-right">Audio Overhead</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.storageRules.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-medium">{r.megapixel}</TableCell>
                <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{r.codec}</Badge></TableCell>
                <TableCell className="text-xs text-right">{r.bitrateMbps}</TableCell>
                <TableCell className="text-xs text-right">{r.fps}</TableCell>
                <TableCell className="text-xs text-right">{r.motionFactor}</TableCell>
                <TableCell className="text-xs text-right">{(r.audioOverhead * 100).toFixed(0)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function PowerRulesTab() {
  const { data, isLoading } = useRules()
  if (isLoading) return <Skeleton className="h-64" />
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4" /> Power Calculation Rules</CardTitle>
        <CardDescription>Wattage assumptions per product type — used by PoE and SMPS calculators.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Rule Name</TableHead>
              <TableHead className="text-xs">Product Type</TableHead>
              <TableHead className="text-xs text-right">Wattage (W)</TableHead>
              <TableHead className="text-xs text-right">Safety Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.powerRules.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-medium">{r.name}</TableCell>
                <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{r.productType}</Badge></TableCell>
                <TableCell className="text-xs text-right">{r.wattage}</TableCell>
                <TableCell className="text-xs text-right">{r.safetyMarginPercent}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function CableRulesTab() {
  const { data, isLoading } = useRules()
  if (isLoading) return <Skeleton className="h-64" />
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Cable className="h-4 w-4" /> Cable Calculation Rules</CardTitle>
        <CardDescription>Roll lengths and wastage defaults per cable type × system type.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Cable Type</TableHead>
              <TableHead className="text-xs">System</TableHead>
              <TableHead className="text-xs text-right">Roll Length (m)</TableHead>
              <TableHead className="text-xs text-right">Wastage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.cableRules.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-medium">{r.cableType}</TableCell>
                <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{r.systemType}</Badge></TableCell>
                <TableCell className="text-xs text-right">{r.rollLengthM}</TableCell>
                <TableCell className="text-xs text-right">{r.wastagePercent}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function LearningTab() {
  const { data, isLoading } = useCatalog()
  const productsWithLearn = data?.products.filter((p) => p.learning) || []
  if (isLoading) return <Skeleton className="h-64" />
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Learning Content</CardTitle>
        <CardDescription>Customer-facing simple explanations. Editable per product via the product drawer.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[420px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Product</TableHead>
                <TableHead className="text-xs">Title</TableHead>
                <TableHead className="text-xs">Simple Explanation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsWithLearn.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs font-medium">{p.name}</TableCell>
                  <TableCell className="text-xs"><Badge variant="secondary" className="text-[10px]">{p.learning?.title}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-md">{p.learning?.simpleExplanation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
