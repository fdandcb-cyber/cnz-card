import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In production (Vercel) we don't want query logs polluting the logs.
// In development, log queries so we can debug.
const logConfig = process.env.NODE_ENV === 'production'
  ? ['error', 'warn']
  : ['query', 'error', 'warn']

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logConfig as any,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
