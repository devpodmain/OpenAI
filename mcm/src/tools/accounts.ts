import { accountRepo } from '../repo'

export type AccountsListArgs = {
  provider?: string
  q?: string
  page?: number
  pageSize?: number
}

export async function list(ctx: { tenantId: string }, args: AccountsListArgs = {}) {
  const res = await accountRepo.listAccounts({ tenantId: ctx.tenantId, provider: args.provider, q: args.q, pagination: { page: args.page, pageSize: args.pageSize } })
  const structured = res
  return {
    ...structured,
    structuredContent: structured,
    _meta: { "openai/outputTemplate": "ui://page/accounts.html" }
  }
}

export type AccountDetailsArgs = { accountId: string }

export async function details(ctx: { tenantId: string }, args: AccountDetailsArgs) {
  const res = await accountRepo.getAccountDetails({ tenantId: ctx.tenantId, accountId: args.accountId })
  const structured = res
  return {
    ...structured,
    structuredContent: structured,
    _meta: { "openai/outputTemplate": "ui://page/account-details.html" }
  }
}
