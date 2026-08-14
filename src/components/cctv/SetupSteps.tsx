'use client'
import { useSetupStore } from '@/lib/cctv/setup-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronRight } from 'lucide-react'

const STEPS = [
  { num: 1, label: 'Cameras', key: 'cameras' as const },
  { num: 2, label: 'Recorder', key: 'recorders' as const },
  { num: 3, label: 'Storage', key: 'storage' as const },
  { num: 4, label: 'Power / PoE', key: 'poe' as const },
  { num: 5, label: 'Cable', key: 'cables' as const },
  { num: 6, label: 'Accessories', key: 'accessories' as const },
  { num: 7, label: 'Review', key: 'accessories' as const },
]

export function SetupSteps() {
  const currentStep = useSetupStore((s) => s.currentStep)
  const setStep = useSetupStore((s) => s.setStep)
  const state = useSetupStore()

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((step, idx) => {
            const sectionItems = step.key === 'poe' ? [...state.poe, ...state.power] : state[step.key]
            const count = sectionItems.reduce((s: number, i: any) => s + i.quantity, 0)
            const isActive = currentStep === step.num
            const isComplete = currentStep > step.num
            const hasItems = count > 0
            return (
              <div key={step.num} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setStep(step.num)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : isComplete
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20' : isComplete ? 'bg-emerald-600 text-white' : 'bg-background'
                  }`}>
                    {isComplete ? <Check className="h-2.5 w-2.5" /> : step.num}
                  </span>
                  <span>{step.label}</span>
                  {hasItems && (
                    <Badge variant={isActive ? 'secondary' : 'outline'} className="text-[9px] py-0 px-1 h-3.5">
                      {count}
                    </Badge>
                  )}
                </button>
                {idx < STEPS.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
