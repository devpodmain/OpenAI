import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'
import { authMiddleware } from './middleware/auth'
import { listToolSpecs, tools } from './tools'

dotenv.config()
const app = express()
app.use(express.json())
app.use(cors())

// Protect MCP and Apps SDK endpoints
app.use(['/mcp', '/apps-sdk'], (req, res, next) => authMiddleware(req, res, next))

type JsonRpcRequest = { jsonrpc: '2.0'; id: number | string; method: string; params?: any }

app.post('/mcp', async (req, res) => {
  const body = req.body as JsonRpcRequest
  const { id, method, params } = body || {}
  const ctx = { tenantId: req.auth!.tenantId, userId: req.auth!.userId }

  try {
    switch (method) {
      case 'initialize':
        return res.json({ jsonrpc: '2.0', id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {}, resources: {} }, serverInfo: { name: 'multi-cloud-mcp', version: '0.1.0' }}})
      case 'tools/list':
        return res.json({ jsonrpc: '2.0', id, result: { tools: listToolSpecs() }})
      case 'tools/call': {
        const { name, arguments: args } = params || {}
        const tool = tools.find(t => t.name === name)
        if (!tool) return res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' }})
        try {
          const result = await tool.handler(ctx, args)
          return res.json({ jsonrpc: '2.0', id, result })
        } catch (e: any) {
          const msg = e?.message || 'Internal error'
          return res.json({ jsonrpc: '2.0', id, error: { code: -32602, message: msg }})
        }
      }
      case 'resources/read': {
        const { uri } = params || {}
        if (typeof uri !== 'string') return res.json({ jsonrpc: '2.0', id, error: { code: -32602, message: 'Invalid params' }})
        const map: Record<string,string> = {
          'ui://widget/cost-analysis.html': join(process.cwd(), 'web', 'widget', 'cost-analysis.html'),
          'ui://widget/service-breakdown.html': join(process.cwd(), 'web', 'widget', 'service-breakdown.html'),
          'ui://widget/report-criteria.html': join(process.cwd(), 'web', 'widget', 'report-criteria.html'),
          'ui://page/dashboard-wrapper.html': join(process.cwd(), 'web', 'page', 'dashboard-wrapper.html'),
          'ui://page/accounts.html': join(process.cwd(), 'web', 'page', 'accounts.html'),
          'ui://page/account-details.html': join(process.cwd(), 'web', 'page', 'account-details.html'),
          'ui://page/services.html': join(process.cwd(), 'web', 'page', 'services.html'),
          'ui://page/recommendation-engine.html': join(process.cwd(), 'web', 'page', 'recommendation-engine.html'),
          'ui://page/profile.html': join(process.cwd(), 'web', 'page', 'profile.html'),
        }
        const file = map[uri]
        if (!file) return res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Resource not found' }})
        const html = readFileSync(file, 'utf8')
        return res.json({ jsonrpc: '2.0', id, result: { contents: [{ uri, mimeType: 'text/html', text: html }]}})
      }
      default:
        return res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' }})
    }
  } catch (e) {
    return res.json({ jsonrpc: '2.0', id: id ?? null, error: { code: -32603, message: 'Internal error' }})
  }
})

// Static assets
app.use('/web', express.static(join(process.cwd(), 'web')))

// Health
app.get('/health', (_req, res) => res.json({ status: 'ok', server: 'multi-cloud-mcp', version: '0.1.0' }))

// Apps SDK metadata
app.get('/apps-sdk/metadata', (req, res) => {
  res.json({
    name: 'Multi-Cloud MCP',
    description: 'Cloud cost & resource management via MCP',
    version: '0.1.0',
    category: 'analytics',
    tags: ['cloud','cost','dashboard','analytics'],
    tools: listToolSpecs(),
    capabilities: { ui: true, dataVisualization: true, realTimeUpdates: false }
  })
})

app.get('/apps-sdk/tools', (_req, res) => {
  res.json({ tools: listToolSpecs() })
})

const PORT = Number(process.env.PORT || 3005)
app.listen(PORT, () => console.log(`MCP Server running at http://localhost:${PORT}`))
