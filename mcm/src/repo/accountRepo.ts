// Replace with Prisma queries; scope by tenantId

export type Pagination = { page?: number; pageSize?: number }

export async function listAccounts(args: { tenantId: string; provider?: string; q?: string; pagination?: Pagination }) {
  // TODO: Prisma findMany
  return { items: [], total: 0, page: 1, pageSize: 20 }
}

export async function getAccountDetails(args: { tenantId: string; accountId: string }) {
  // TODO: Prisma joins for costs, clusters
  return { account: null, costs: [], clusters: [] }
}

