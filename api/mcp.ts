import type { VercelRequest, VercelResponse } from "@vercel/node";

// PlayMCP 클라이언트가 2025-06-18로 initialize를 보내므로 동일 버전으로 응답
const PROTOCOL_VERSION = "2025-06-18";
const SERVER_CAPABILITIES = {
  // tools capability 명시 (리스트 변경 여부 알림)
  tools: {
    listChanged: true,
  },
};

const tools = [
  {
    name: "general_answer",
    description: "자유 질의에 대해 간단한 텍스트 응답을 생성합니다.",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string" },
      },
      required: [],
    },
  },
  {
    name: "analyze_company",
    description: "기업 분석",
    inputSchema: {
      type: "object",
      properties: { company_name: { type: "string" } },
      required: ["company_name"],
    },
  },
  {
    name: "analyze_job_position",
    description: "직무 분석",
    inputSchema: {
      type: "object",
      properties: { company_name: { type: "string" }, job_title: { type: "string" } },
      required: ["company_name", "job_title"],
    },
  },
  {
    name: "register_user_profile",
    description: "프로필 등록",
    inputSchema: {
      type: "object",
      properties: { experiences: { type: "array" } },
      required: ["experiences"],
    },
  },
  {
    name: "analyze_essay_question",
    description: "문항 분석",
    inputSchema: {
      type: "object",
      properties: { company_name: { type: "string" }, question: { type: "string" } },
      required: ["company_name", "question"],
    },
  },
  {
    name: "generate_star_draft",
    description: "STAR 자소서 생성",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string" },
        job_title: { type: "string" },
        question: { type: "string" },
        experience_title: { type: "string" },
        experience_description: { type: "string" },
      },
      required: ["company_name", "job_title", "question", "experience_title", "experience_description"],
    },
  },
  {
    name: "improve_essay",
    description: "자소서 개선",
    inputSchema: {
      type: "object",
      properties: { company_name: { type: "string" }, job_title: { type: "string" }, question: { type: "string" }, draft: { type: "string" } },
      required: ["company_name", "job_title", "question", "draft"],
    },
  },
];

function parseBody(req: VercelRequest) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      console.error("[mcp] body JSON parse error", error);
      return {};
    }
  }
  return {};
}

function handleToolCall(name: string, args: Record<string, unknown>): string {
  if (name === "general_answer") {
    const question = (args.question as string) || "(질문 없음)";
    return `## 응답\n${question}`;
  }

  const companyName = (args.company_name as string) || "";
  const jobTitle = (args.job_title as string) || "";
  const question = (args.question as string) || "";
  const expDesc = (args.experience_description as string) || "";
  const draft = (args.draft as string) || "";
  const experiences = (args.experiences as unknown[]) || [];

  switch (name) {
    case "analyze_company":
      return `## ${companyName} 기업 분석\n\n### 인재상\n- 도전정신\n- 협업능력\n- 전문성`;
    case "analyze_job_position":
      return `## ${companyName} - ${jobTitle} 직무 분석\n\n### 핵심 역량\n1. 문제 해결\n2. 커뮤니케이션`;
    case "register_user_profile":
      return `## 프로필 등록 완료\n\n등록된 경험: ${experiences.length}개`;
    case "analyze_essay_question":
      return `## 문항 분석\n\n"${question}"\n\n### STAR 기법 활용 권장`;
    case "generate_star_draft":
      return `## STAR 자소서\n\n### Situation\n${expDesc}\n\n### Task\n[작성]\n\n### Action\n[작성]\n\n### Result\n[작성]`;
    case "improve_essay":
      return `## 검토 결과\n\n원본: ${draft.substring(0, 50)}...\n\n### 개선점\n1. 구체성 강화`;
    default:
      return "Unknown tool";
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  const log = (...args: unknown[]) => console.log(`[mcp][${requestId}]`, ...args);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, MCP-Protocol-Version");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Log incoming request for Vercel console visibility
  log("method", req.method, "headers", req.headers);

  try {
    if (req.method === "GET") {
      log("healthcheck");
      return res.status(200).json({
        jsonrpc: "2.0",
        result: {
          name: "resume-helper",
          version: "0.1.0",
          protocolVersion: PROTOCOL_VERSION,
          capabilities: SERVER_CAPABILITIES,
        },
      });
    }

    if (req.method === "POST") {
      const body = parseBody(req);
      log("body", body);

      const { id, method, params } = body as { id?: unknown; method?: string; params?: any };

      // 일부 클라이언트는 initialize 직후 notifications/* 형태를 id 없이 보냅니다.
      if (method && method.startsWith("notifications/")) {
        log("notification ignored", { method, id });
        return res.status(200).end();
      }

      if (method === "initialize") {
        const response = {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: SERVER_CAPABILITIES,
            serverInfo: { name: "resume-helper", version: "0.1.0" },
          },
        };
        log("initialize response", response);
        return res.status(200).json(response);
      }

      if (method === "tools/list") {
        const response = { jsonrpc: "2.0", id, result: { tools } };
        log("tools/list response", response);
        return res.status(200).json(response);
      }

      if (method === "tools/call") {
        const text = handleToolCall(params?.name as string, (params?.arguments || {}) as Record<string, unknown>);
        const response = { jsonrpc: "2.0", id, result: { content: [{ type: "text", text }] } };
        log("tools/call response", response);
        return res.status(200).json(response);
      }

      const response = { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } };
      log("unknown method response", response);
      return res.status(400).json(response);
    }

    log("method not allowed", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error(`[mcp][${requestId}] unhandled error`, error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
    }
  }
}