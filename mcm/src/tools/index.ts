import * as dashboard from './dashboard'
import * as accounts from './accounts'

export type ToolSpec = {
  name: string
  description: string
  inputSchema: object
  outputTemplate: string
  handler: (ctx: { tenantId: string; userId: string }, args?: any) => Promise<any>
}

export const tools: ToolSpec[] = [
  {
    name: 'dashboard.cost-analysis',
    description: 'Cost analysis summary and time series.',
    inputSchema: {
      type: 'object',
      properties: {
        dateRange: {
          type: 'object',
          properties: {
            fromISO: { type: 'string' },
            toISO: { type: 'string' },
          },
          additionalProperties: false,
        },
        providers: { type: 'array', items: { type: 'string' } },
        granularity: { type: 'string', enum: ['day', 'week', 'month'] },
      },
      additionalProperties: false,
    },
    outputTemplate: 'ui://widget/cost-analysis.html',
    handler: async (ctx, args) => dashboard.costAnalysis(ctx, args || {})
  },
  {
    name: 'dashboard.service-breakdown',
    description: 'Service cost breakdown table.',
    inputSchema: {
      type: 'object',
      properties: {
        dateRange: {
          type: 'object',
          properties: {
            fromISO: { type: 'string' },
            toISO: { type: 'string' },
          },
          additionalProperties: false,
        },
        provider: { type: 'string' },
        limit: { type: 'number' },
        sortBy: { type: 'string', enum: ['billed', 'effective'] },
      },
      additionalProperties: false,
    },
    outputTemplate: 'ui://widget/service-breakdown.html',
    handler: async (ctx, args) => dashboard.serviceBreakdown(ctx, args || {})
  },
  {
    name: 'accounts.list',
    description: 'Lists accounts with filters/pagination',
    inputSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string' },
        q: { type: 'string' },
        page: { type: 'number' },
        pageSize: { type: 'number' },
      },
      additionalProperties: false,
    },
    outputTemplate: 'ui://page/accounts.html',
    handler: async (ctx, args) => accounts.list(ctx, args || {})
  },
  {
    name: 'accounts.details',
    description: 'Account-specific costs and clusters',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
      },
      required: ['accountId'],
      additionalProperties: false,
    },
    outputTemplate: 'ui://page/account-details.html',
    handler: async (ctx, args) => accounts.details(ctx, args || {})
  },
]

export function listToolSpecs() {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
    outputSchema: { type: 'object' },
    _meta: { 'openai/outputTemplate': t.outputTemplate }
  }))
}
