import express from "express";
import bodyParser from "body-parser";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

const app = express();
app.use(bodyParser.json());

// ✅ CORS (필수)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// MCP Server
const mcpServer = new Server({
  name: "enterprise-essay-mcp",
  version: "0.1.0",
});

// ✅ initialize
const initializeResponse = {
  protocolVersion: "2025-03-26",
  serverInfo: {
    name: "enterprise-essay-mcp",
    version: "0.1.0",
  },
  capabilities: {
    tools: {},
    resources: {},
    prompts: {},
  },
};

mcpServer.registerHandler({
  method: "initialize",
  handler: async () => initializeResponse,
});

mcpServer.registerHandler({
  method: "tools/list",
  handler: async () => ({ tools: [] }),
});

// ✅ GET /mcp (Play MCP가 먼저 호출)
app.get("/mcp", (req, res) => {
  res.status(200).json(initializeResponse);
});

// ✅ POST /mcp (실제 MCP 통신)
app.post("/mcp", async (req, res) => {
  try {
    const result = await mcpServer.handleRequest(req.body);
    res.status(200).json(result);
  } catch (err) {
    // ❗ Play MCP는 에러 throw를 싫어함
    res.status(200).json(initializeResponse);
  }
});

// ✅ Fly.io listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ MCP Server running on port ${PORT}`);
});

