import { costRepo } from '../repo'

export type DateRange = { fromISO?: string; toISO?: string }
export type CostAnalysisArgs = {
  dateRange?: DateRange
  providers?: string[]
  granularity?: 'day'|'week'|'month'
}

export async function costAnalysis(ctx: { tenantId: string }, args: CostAnalysisArgs = {}) {
  const summary = await costRepo.getSummary({ tenantId: ctx.tenantId, providers: args.providers, dateRange: args.dateRange })
  const series = await costRepo.getSeries({ tenantId: ctx.tenantId, providers: args.providers, dateRange: args.dateRange, granularity: args.granularity })
  const providers = (args.providers || []).map(name => ({ name, color: '#999999', cost: 0 }))
  const structured = { summary, providers, series }
  return {
    ...structured,
    structuredContent: structured,
    content: [{ type: 'text', text: 'Cost Analysis', _meta: {} }],
    _meta: { "openai/outputTemplate": "ui://widget/cost-analysis.html" }
  }
}

export type ServiceBreakdownArgs = {
  dateRange?: DateRange
  provider?: string
  limit?: number
  sortBy?: 'billed'|'effective'
}

export async function serviceBreakdown(ctx: { tenantId: string }, args: ServiceBreakdownArgs = {}) {
  const services = await costRepo.getServiceBreakdown({ tenantId: ctx.tenantId, provider: args.provider, sortBy: args.sortBy, limit: args.limit })
  const structured = { services }
  return {
    ...structured,
    structuredContent: structured,
    content: [{ type: 'text', text: 'Service Cost Breakdown', _meta: {} }],
    _meta: { "openai/outputTemplate": "ui://widget/service-breakdown.html" }
  }
}
