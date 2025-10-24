import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import { cloudDashboardTool, getCloudDashboard } from "./mcp/tools/cloudDashboard.js";

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
    name: "cloud-dashboard",
    description: "View comprehensive cloud costs and usage across AWS, Azure, GCP, and VMware providers with interactive charts and detailed service breakdowns.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    },
    outputSchema: {
      type: "object",
      properties: {
        structuredContent: {
          type: "object",
          description: "Structured cloud cost data"
        },
        content: {
          type: "array",
          description: "Content array for display"
        }
      }
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/cloud-dashboard.html"
    }
  }
];

// Tool implementations
const toolImplementations: Record<string, (args?: any) => Promise<any>> = {
  hello_world: async (args: { name: string }) => {
    return {
      message: `Hello, ${args.name}! This is a working MCP tool.`
    };
  },
  "cloud-dashboard": async () => {
    const result = await getCloudDashboard();
    // Ensure the result includes the UI template metadata
    return {
      ...result,
      _meta: {
        "openai/outputTemplate": "ui://widget/cloud-dashboard.html"
      }
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
              ...(tool._meta && { _meta: tool._meta })
            }))
          }
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
              tools: {}
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
app.get("/api/cloud-dashboard", async (_req, res) => {
  const result = await getCloudDashboard();
  res.json(result);
});

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
