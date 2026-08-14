'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from './types'

export type SetupItem = {
  product: Product
  quantity: number
}

type SetupState = {
  cameras: SetupItem[]
  recorders: SetupItem[]
  storage: SetupItem[]
  power: SetupItem[]
  poe: SetupItem[]
  cables: SetupItem[]
  accessories: SetupItem[]

  // calculator inputs
  codec: string
  recordingHoursPerDay: number
  motionRecording: boolean
  audio: boolean
  targetRetentionDays: number
  cableDistances: { camera: string; distance: number }[]
  safetyMarginPercent: number

  // UI state
  currentStep: number // 1-7
  view: 'customer' | 'admin'
  adminTab: 'dashboard' | 'products' | 'inventory' | 'rules' | 'suppliers' | 'warehouses' | 'pricing' | 'orders' | 'quotes'

  // actions
  addItem: (section: SetupSection, product: Product, qty?: number) => void
  removeItem: (section: SetupSection, productId: string) => void
  setQuantity: (section: SetupSection, productId: string, qty: number) => void
  clearSetup: () => void
  setCodec: (c: string) => void
  setRecordingHours: (n: number) => void
  setMotionRecording: (b: boolean) => void
  setAudio: (b: boolean) => void
  setTargetRetention: (n: number) => void
  setCableDistances: (d: { camera: string; distance: number }[]) => void
  setSafetyMargin: (n: number) => void
  setStep: (n: number) => void
  setView: (v: 'customer' | 'admin') => void
  setAdminTab: (t: SetupState['adminTab']) => void
}

export type SetupSection = 'cameras' | 'recorders' | 'storage' | 'power' | 'poe' | 'cables' | 'accessories'

export const useSetupStore = create<SetupState>()(
  persist(
    (set) => ({
      cameras: [],
      recorders: [],
      storage: [],
      power: [],
      poe: [],
      cables: [],
      accessories: [],

      codec: 'H.265',
      recordingHoursPerDay: 24,
      motionRecording: false,
      audio: false,
      targetRetentionDays: 15,
      cableDistances: [
        { camera: 'Camera 1', distance: 35 },
        { camera: 'Camera 2', distance: 42 },
        { camera: 'Camera 3', distance: 65 },
      ],
      safetyMarginPercent: 20,

      currentStep: 1,
      view: 'customer',
      adminTab: 'dashboard',

      addItem: (section, product, qty = 1) =>
        set((state) => {
          const items = state[section] as SetupItem[]
          const existing = items.find((i) => i.product.id === product.id)
          let updated: SetupItem[]
          if (existing) {
            updated = items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i,
            )
          } else {
            updated = [...items, { product, quantity: qty }]
          }
          return { [section]: updated } as Partial<SetupState>
        }),

      removeItem: (section, productId) =>
        set((state) => {
          const items = state[section] as SetupItem[]
          return { [section]: items.filter((i) => i.product.id !== productId) } as Partial<SetupState>
        }),

      setQuantity: (section, productId, qty) =>
        set((state) => {
          const items = state[section] as SetupItem[]
          if (qty <= 0) {
            return { [section]: items.filter((i) => i.product.id !== productId) } as Partial<SetupState>
          }
          return {
            [section]: items.map((i) =>
              i.product.id === productId ? { ...i, quantity: qty } : i,
            ),
          } as Partial<SetupState>
        }),

      clearSetup: () =>
        set({
          cameras: [], recorders: [], storage: [], power: [], poe: [], cables: [], accessories: [],
        }),

      setCodec: (c) => set({ codec: c }),
      setRecordingHours: (n) => set({ recordingHoursPerDay: n }),
      setMotionRecording: (b) => set({ motionRecording: b }),
      setAudio: (b) => set({ audio: b }),
      setTargetRetention: (n) => set({ targetRetentionDays: n }),
      setCableDistances: (d) => set({ cableDistances: d }),
      setSafetyMargin: (n) => set({ safetyMarginPercent: n }),
      setStep: (n) => set({ currentStep: n }),
      setView: (v) => set({ view: v }),
      setAdminTab: (t) => set({ adminTab: t }),
    }),
    {
      name: 'cctv-setup-store',
      // Do not persist products (they are large) — only persist IDs in a real app
      // For demo simplicity, persist everything
      partialize: (state) => ({
        codec: state.codec,
        recordingHoursPerDay: state.recordingHoursPerDay,
        motionRecording: state.motionRecording,
        audio: state.audio,
        targetRetentionDays: state.targetRetentionDays,
        cableDistances: state.cableDistances,
        safetyMarginPercent: state.safetyMarginPercent,
        view: state.view,
      }),
    },
  ),
)

// ====== Helper: compute totals ======
export function computeSetupTotals(state: SetupState) {
  const allItems = [
    ...state.cameras, ...state.recorders, ...state.storage,
    ...state.power, ...state.poe, ...state.cables, ...state.accessories,
  ]
  const subtotal = allItems.reduce(
    (s, item) => s + (item.product.pricing?.salePrice || 0) * item.quantity,
    0,
  )
  const mrpTotal = allItems.reduce(
    (s, item) => s + (item.product.pricing?.mrp || 0) * item.quantity,
    0,
  )
  const discount = mrpTotal - subtotal
  const gst = Math.round(subtotal * 0.18 * 100) / 100
  const grandTotal = subtotal + gst
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    mrpTotal: Math.round(mrpTotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    gst,
    grandTotal: Math.round(grandTotal * 100) / 100,
    itemCount: allItems.reduce((s, i) => s + i.quantity, 0),
    lineCount: allItems.length,
  }
}
