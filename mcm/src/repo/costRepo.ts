// Replace these with Prisma queries. All functions must scope by tenantId.
import { prisma } from '../db/client'

export type DateRange = { fromISO?: string; toISO?: string }

function whereCommon(args: { tenantId: string; providers?: string[]; dateRange?: DateRange }) {
  const where: any = { tenantId: args.tenantId }
  if (args.providers && args.providers.length) {
    where.provider = { in: args.providers }
  }
  if (args.dateRange?.fromISO || args.dateRange?.toISO) {
    where.date = {}
    if (args.dateRange.fromISO) where.date.gte = new Date(args.dateRange.fromISO)
    if (args.dateRange.toISO) where.date.lte = new Date(args.dateRange.toISO)
  }
  return where
}

export async function getSummary(args: { tenantId: string; providers?: string[]; dateRange?: DateRange }) {
  try {
    const where = whereCommon(args)
    const agg = await prisma.cost.aggregate({ where, _sum: { billed: true } })
    const total = Number(agg._sum.billed ?? 0)
    return { total, trend: 0, change: 0 }
  } catch {
    return { total: 0, trend: 0, change: 0 }
  }
}

export async function getSeries(args: { tenantId: string; providers?: string[]; dateRange?: DateRange; granularity?: 'day'|'week'|'month' }) {
  try {
    const where = whereCommon(args)
    const rows = await prisma.cost.groupBy({
      by: ['date', 'provider'],
      where,
      _sum: { billed: true },
      orderBy: [{ date: 'asc' }],
    })
    const map = new Map<string, Record<string, number>>()
    for (const r of rows) {
      const dateKey = (r.date as Date).toISOString().slice(0, 10)
      const entry = map.get(dateKey) || {}
      entry[r.provider as string] = Number(r._sum.billed ?? 0)
      map.set(dateKey, entry)
    }
    return Array.from(map.entries()).map(([date, values]) => ({ date, values }))
  } catch {
    return [] as Array<{ date: string; values: Record<string, number> }>
  }
}

export async function getServiceBreakdown(args: { tenantId: string; provider?: string; sortBy?: 'billed'|'effective'; limit?: number }) {
  try {
    const where: any = { tenantId: args.tenantId }
    if (args.provider) where.provider = args.provider
    const groups = await prisma.cost.groupBy({ by: ['serviceId'], where, _sum: { billed: true, effective: true } })
    const ids = groups.map(g => g.serviceId)
    if (ids.length === 0) return []
    const services = await prisma.service.findMany({ where: { id: { in: ids } } })
    const byId = new Map(services.map(s => [s.id, s]))
    let list = groups.map(g => ({
      name: byId.get(g.serviceId)?.name || g.serviceId,
      billed: Number(g._sum.billed ?? 0),
      effective: Number(g._sum.effective ?? 0),
    }))
    if (args.sortBy === 'effective') list.sort((a, b) => b.effective - a.effective)
    else list.sort((a, b) => b.billed - a.billed)
    const limit = args.limit && args.limit > 0 ? args.limit : 10
    return list.slice(0, limit)
  } catch {
    return [] as Array<{ name: string; billed: number; effective: number }>
  }
}
