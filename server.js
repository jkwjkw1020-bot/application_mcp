import express from "express";
import bodyParser from "body-parser";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

const app = express();
app.use(bodyParser.json());

// MCP Server
const mcpServer = new Server({
  name: "enterprise-essay-mcp",
  version: "0.1.0",
});

// ✅ initialize
mcpServer.registerHandler({
  method: "initialize",
  handler: async () => {
    return {
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
  },
});

// ✅ tools/list (빈 배열이어도 OK)
mcpServer.registerHandler({
  method: "tools/list",
  handler: async () => {
    return {
      tools: [],
    };
  },
});

// ✅ HTTP MCP endpoint
app.post("/mcp", async (req, res) => {
  try {
    const result = await mcpServer.handleRequest(req.body);
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ Fly.io용 listen (절대 종료 안 됨)
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ MCP Server running on port ${PORT}`);
});

