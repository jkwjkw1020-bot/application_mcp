import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// ✅ CORS + Preflight (필수)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ✅ JSON-RPC initialize 응답 (Play MCP가 기대하는 형태)
const initializeResult = {
  jsonrpc: "2.0",
  id: 1,
  result: {
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
  },
};

// ✅ GET /mcp (연결 확인용)
app.get("/mcp", (req, res) => {
  res.status(200).json(initializeResult);
});

// ✅ POST /mcp (Play MCP / Inspector)
app.post("/mcp", (req, res) => {
  const body = req.body || {};
  if (body.method === "initialize") {
    return res.status(200).json({
      ...initializeResult,
      id: body.id ?? 1,
    });
  }

  // 기타 probe 요청도 에러 없이 200
  return res.status(200).json({
    jsonrpc: "2.0",
    id: body.id ?? 1,
    result: {},
  });
});

// ✅ Fly.io listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ MCP Server running on port ${PORT}`);
});
