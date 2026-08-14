'use client'
// Centralized React Query hooks for fetching catalog and rules data.

import { useQuery } from '@tanstack/react-query'
import type { Product, Brand, Category, Warehouse, Supplier,
  StorageRule, PowerRule, CableRule, CompatibilityRule, AccessoryRecRule } from './types'

export type CatalogData = {
  brands: Brand[]
  categories: Category[]
  products: Product[]
  warehouses: Warehouse[]
  suppliers: Supplier[]
}

export type RulesData = {
  storageRules: StorageRule[]
  powerRules: PowerRule[]
  cableRules: CableRule[]
  compatibilityRules: CompatibilityRule[]
  accessoryRules: AccessoryRecRule[]
}

export function useCatalog() {
  return useQuery<CatalogData>({
    queryKey: ['catalog'],
    queryFn: async () => {
      const r = await fetch('/api/catalog')
      if (!r.ok) throw new Error('Failed to fetch catalog')
      return r.json()
    },
    staleTime: 30_000,
  })
}

export function useRules() {
  return useQuery<RulesData>({
    queryKey: ['rules'],
    queryFn: async () => {
      const r = await fetch('/api/rules')
      if (!r.ok) throw new Error('Failed to fetch rules')
      return r.json()
    },
    staleTime: 60_000,
  })
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const r = await fetch('/api/dashboard')
      if (!r.ok) throw new Error('Failed to fetch dashboard')
      return r.json()
    },
    staleTime: 15_000,
  })
}

// Format helpers
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatINRDecimal(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
