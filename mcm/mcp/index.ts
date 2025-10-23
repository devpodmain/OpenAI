import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFileSync } from "node:fs";

export const server = new McpServer({ name: "mcm-server", version: "1.0.0" });

// Load dashboard UI bundle
const DASHBOARD_JS = (() => {
  try { return readFileSync("web/dist/cloud-dashboard.js", "utf8"); }
  catch { return ""; }
})();
