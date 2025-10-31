// Replace with Prisma queries; scope by tenantId

export async function list(args: { tenantId: string; provider?: string; status?: string }) {
  // TODO: Prisma findMany
  return [] as Array<{ id: string; name: string; workFlow?: string; recommend?: number; utilized?: number; status: string }>
}

