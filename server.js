import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { HttpServerTransport } from "@modelcontextprotocol/sdk/server/http.js";

// MCP 서버 생성
const server = new Server({
  name: "enterprise-essay-mcp",
  version: "0.1.0",
});

// initialize
server.registerHandler({
  method: "initialize",
  handler: async () => ({
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
  }),
});

// 최소 엔드포인트 (Play MCP가 요구)
server.registerHandler({
  method: "tools/list",
  handler: async () => ({ tools: [] }),
});
server.registerHandler({
  method: "resources/list",
  handler: async () => ({ resources: [] }),
});
server.registerHandler({
  method: "prompts/list",
  handler: async () => ({ prompts: [] }),
});

// ✅ Streamable HTTP Transport
const transport = new HttpServerTransport({
  port: process.env.PORT ?? 8080,
  host: "0.0.0.0",
});

await server.connect(transport);

console.log("✅ MCP Streamable HTTP server started");