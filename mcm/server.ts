import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { server as mcpServer } from "./mcp/index.js";
import { cloudDashboardTool, getCloudDashboard } from "./mcp/tools/cloudDashboard.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// MCP Tool registration
mcpServer.tool(cloudDashboardTool.name, cloudDashboardTool.description || "", cloudDashboardTool.inputSchema || {}, cloudDashboardTool.run);

// REST endpoint example
app.get("/api/cloud-dashboard", async (_req, res) => {
  const result = await getCloudDashboard();
  res.json(result);
});

// MCP JSON-RPC endpoint
app.post("/mcp", async (req, res) => {
  const { method, params, id } = req.body;
  if (method === "tools/call" && params.name === "cloud-dashboard") {
    const result = await getCloudDashboard();
    return res.json({ jsonrpc: "2.0", id, result });
  }
  return res.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
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
    tools: [cloudDashboardTool],
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
    tools: [cloudDashboardTool]
  });
});

const PORT = Number(process.env.PORT || 3005);
app.listen(PORT, () => console.log(`🚀 MCM MCP Server running at http://localhost:${PORT}`));
