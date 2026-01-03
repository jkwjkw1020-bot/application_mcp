import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleToolRequest, listTools } from "./mcp.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    res.status(200).json({
      name: "resume-helper",
      version: "0.1.0",
      description: "STAR 기법 기반 자기소개서 작성 도우미 MCP 서버",
      tools: listTools()
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const result = await handleToolRequest(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Bad request" });
  }
}