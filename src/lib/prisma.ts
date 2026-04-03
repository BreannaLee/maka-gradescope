import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined
}

function createPrismaClient() {
  let url = process.env.TURSO_DATABASE_URL!
  const authToken = process.env.TURSO_AUTH_TOKEN

  // Vercel serverless uses the web bundle which requires https:// not libsql://
  if (url.startsWith('libsql://')) {
    url = url.replace('libsql://', 'https://')
  }

  const adapter = new PrismaLibSql({ url, authToken })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
