import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// zod import not used; keeping code minimal
import { readFileSync } from "fs";
import { join } from "path";
import { getCostAnalysis, getServiceBreakdown, getReportCriteria } from "./mcp/tools/cloudDashboard";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Define tools with proper schemas
const tools = [
  {
    name: "hello_world",
    description: "A simple hello world tool for testing MCP connectivity",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name to greet"
        }
      },
      required: ["name"]
    },
    outputSchema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Greeting message"
        }
      }
    }
  },
  
  {
    name: "dashboard.cost-analysis",
    description: "Cost analysis summary and time series.",
    inputSchema: {
      type: "object",
      properties: {
        dateRange: {
          type: "object",
          properties: {
            fromISO: { type: "string" },
            toISO: { type: "string" }
          }
        },
        providers: { type: "array", items: { type: "string" } },
        granularity: { type: "string", enum: ["day", "week", "month"] }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        summary: { type: "object" },
        providers: { type: "array" },
        series: { type: "array" }
      }
    },
    _meta: { "openai/outputTemplate": "ui://widget/cost-analysis.html" }
  },
  {
    name: "dashboard.service-breakdown",
    description: "Service cost breakdown table.",
    inputSchema: {
      type: "object",
      properties: {
        dateRange: { type: "object" },
        provider: { type: "string" },
        limit: { type: "number" },
        sortBy: { type: "string", enum: ["billed", "effective"] }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        services: { type: "array" }
      }
    },
    _meta: { "openai/outputTemplate": "ui://widget/service-breakdown.html" }
  },
  {
    name: "dashboard.report-criteria",
    description: "Criteria presets and current selection.",
    inputSchema: {
      type: "object",
      properties: {
        current: { type: "object" }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        presets: { type: "array" },
        providers: { type: "array" },
        tags: { type: "array" },
        current: { type: "object" }
      }
    },
    _meta: { "openai/outputTemplate": "ui://widget/report-criteria.html" }
  }
];

// Tool implementations
const toolImplementations: Record<string, (args?: any) => Promise<any>> = {
  hello_world: async (args: { name: string }) => {
    return {
      message: `Hello, ${args.name}! This is a working MCP tool.`
    };
  },
  
  "dashboard.cost-analysis": async (args) => {
    const result = await getCostAnalysis(args);
    return {
      ...result,
      _meta: { "openai/outputTemplate": "ui://widget/cost-analysis.html" }
    };
  },
  "dashboard.service-breakdown": async (args) => {
    const result = await getServiceBreakdown(args);
    return {
      ...result,
      _meta: { "openai/outputTemplate": "ui://widget/service-breakdown.html" }
    };
  },
  "dashboard.report-criteria": async (args) => {
    const result = await getReportCriteria(args);
    return {
      ...result,
      _meta: { "openai/outputTemplate": "ui://widget/report-criteria.html" }
    };
  }
};

// MCP JSON-RPC endpoint
app.post("/mcp", async (req, res) => {
  try {
    const { method, params, id } = req.body;

    // Validate JSON-RPC 2.0 request
    if (!method || typeof id === 'undefined') {
      return res.json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32600, message: "Invalid Request" }
      });
    }

    switch (method) {
      case "tools/list":
        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            tools: tools.map(tool => ({
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema,
              ...(tool.outputSchema && { outputSchema: tool.outputSchema }),
              ...(tool._meta && { _meta: tool._meta })
            }))
          }
        });

      case "resources/list":
        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            resources: [
              
              {
                uri: "ui://widget/cost-analysis.html",
                name: "cost-analysis-ui",
                description: "Cost analysis UI component",
                mimeType: "text/html"
              },
              {
                uri: "ui://widget/service-breakdown.html",
                name: "service-breakdown-ui",
                description: "Service breakdown UI component",
                mimeType: "text/html"
              },
              {
                uri: "ui://widget/report-criteria.html",
                name: "report-criteria-ui",
                description: "Report criteria UI component",
                mimeType: "text/html"
              }
            ]
          }
        });

      case "resources/templates/list":
        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            resourceTemplates: []
          }
        });

      case "resources/read":
        const { uri } = params || {};
        
        if (uri === "ui://widget/cost-analysis.html") {
          try {
            const htmlPath = join(process.cwd(), 'web', 'widget', 'cost-analysis.html');
            const htmlContent = readFileSync(htmlPath, 'utf8');
            return res.json({
              jsonrpc: "2.0",
              id,
              result: {
                contents: [
                  {
                    uri: "ui://widget/cost-analysis.html",
                    mimeType: "text/html",
                    text: htmlContent
                  }
                ]
              }
            });
          } catch (error) {
            console.error('Error reading HTML file:', error);
            return res.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32603, message: "Internal error" }
            });
          }
        }
        if (uri === "ui://widget/service-breakdown.html") {
          try {
            const htmlPath = join(process.cwd(), 'web', 'widget', 'service-breakdown.html');
            const htmlContent = readFileSync(htmlPath, 'utf8');
            return res.json({
              jsonrpc: "2.0",
              id,
              result: {
                contents: [
                  {
                    uri: "ui://widget/service-breakdown.html",
                    mimeType: "text/html",
                    text: htmlContent
                  }
                ]
              }
            });
          } catch (error) {
            console.error('Error reading HTML file:', error);
            return res.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32603, message: "Internal error" }
            });
          }
        }
        if (uri === "ui://widget/report-criteria.html") {
          try {
            const htmlPath = join(process.cwd(), 'web', 'widget', 'report-criteria.html');
            const htmlContent = readFileSync(htmlPath, 'utf8');
            return res.json({
              jsonrpc: "2.0",
              id,
              result: {
                contents: [
                  {
                    uri: "ui://widget/report-criteria.html",
                    mimeType: "text/html",
                    text: htmlContent
                  }
                ]
              }
            });
          } catch (error) {
            console.error('Error reading HTML file:', error);
            return res.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32603, message: "Internal error" }
            });
          }
        }
        return res.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: "Resource not found" }
        });

      case "tools/call":
        const { name, arguments: args } = params || {};
        
        if (!name || !toolImplementations[name]) {
          return res.json({
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: "Method not found" }
          });
        }

        try {
          const result = await toolImplementations[name](args || {});
          return res.json({
            jsonrpc: "2.0",
            id,
            result
          });
        } catch (error) {
          return res.json({
            jsonrpc: "2.0",
            id,
            error: { code: -32603, message: "Internal error" }
          });
        }

      case "initialize":
        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
              resources: {}
            },
            serverInfo: {
              name: "cloud-cost-dashboard",
              version: "1.0.0"
            }
          }
        });

      default:
        return res.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: "Method not found" }
        });
    }
  } catch (error) {
    return res.json({
      jsonrpc: "2.0",
      id: req.body.id || null,
      error: { code: -32603, message: "Internal error" }
    });
  }
});

// REST endpoint example
// Removed aggregate REST endpoint per request

// Static assets
app.use("/web", express.static("web"));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", server: "mcm-server", version: "1.0.0" });
});

// Apps SDK metadata endpoint
app.get("/apps-sdk/metadata", (_req, res) => {
  res.json({
    name: "CloudBolt Cost Dashboard",
    description: "Professional cloud cost analysis and reporting dashboard",
    version: "1.0.0",
    category: "analytics",
    tags: ["cloud", "cost", "dashboard", "analytics"],
    tools: tools,
    capabilities: {
      ui: true,
      dataVisualization: true,
      realTimeUpdates: false
    }
  });
});

// Apps SDK tool discovery
app.get("/apps-sdk/tools", (_req, res) => {
  res.json({
    tools: tools
  });
});

const PORT = Number(process.env.PORT || 3005);
app.listen(PORT, () => console.log(`🚀 MCM MCP Server running at http://localhost:${PORT}`));
