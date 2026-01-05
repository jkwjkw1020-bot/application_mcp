import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROTOCOL_VERSION = "2025-03-26";

const tools = [
  { name: "analyze_company", description: "기업 분석", inputSchema: { type: "object", properties: { company_name: { type: "string" } }, required: ["company_name"] } },
  { name: "analyze_job_position", description: "직무 분석", inputSchema: { type: "object", properties: { company_name: { type: "string" }, job_title: { type: "string" } }, required: ["company_name", "job_title"] } },
  { name: "register_user_profile", description: "프로필 등록", inputSchema: { type: "object", properties: { experiences: { type: "array" } }, required: ["experiences"] } },
  { name: "analyze_essay_question", description: "문항 분석", inputSchema: { type: "object", properties: { company_name: { type: "string" }, question: { type: "string" } }, required: ["company_name", "question"] } },
  { name: "generate_star_draft", description: "STAR 자소서 생성", inputSchema: { type: "object", properties: { company_name: { type: "string" }, job_title: { type: "string" }, question: { type: "string" }, experience_title: { type: "string" }, experience_description: { type: "string" } }, required: ["company_name", "job_title", "question", "experience_title", "experience_description"] } },
  { name: "improve_essay", description: "자소서 개선", inputSchema: { type: "object", properties: { company_name: { type: "string" }, job_title: { type: "string" }, question: { type: "string" }, draft: { type: "string" } }, required: ["company_name", "job_title", "question", "draft"] } }
];

function handleToolCall(name: string, args: Record<string, unknown>): string {
  const companyName = args.company_name as string || "";
  const jobTitle = args.job_title as string || "";
  const question = args.question as string || "";
  const expTitle = args.experience_title as string || "";
  const expDesc = args.experience_description as string || "";
  const draft = args.draft as string || "";
  const experiences = args.experiences as unknown[] || [];

  switch (name) {
    case "analyze_company": return `## ${companyName} 기업 분석\n\n### 인재상\n- 도전정신\n- 협업능력\n- 전문성`;
    case "analyze_job_position": return `## ${companyName} - ${jobTitle} 직무 분석\n\n### 핵심 역량\n1. 문제 해결\n2. 커뮤니케이션`;
    case "register_user_profile": return `## 프로필 등록 완료\n\n등록된 경험: ${experiences.length}개`;
    case "analyze_essay_question": return `## 문항 분석\n\n"${question}"\n\n### STAR 기법 활용 권장`;
    case "generate_star_draft": return `## STAR 자소서\n\n### Situation\n${expDesc}\n\n### Task\n[작성]\n\n### Action\n[작성]\n\n### Result\n[작성]`;
    case "improve_essay": return `## 검토 결과\n\n원본: ${draft.substring(0, 50)}...\n\n### 개선점\n1. 구체성 강화`;
    default: return "Unknown tool";
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.status(200).json({
      jsonrpc: "2.0",
      result: {
        name: "resume-helper",
        version: "0.1.0",
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
      },
    });
  }

  if (req.method === "POST") {
    const { id, method, params } = req.body || {};
    if (method === "initialize") {
      return res.status(200).json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: "resume-helper", version: "0.1.0" },
        },
      });
    }
    if (method === "tools/list") return res.status(200).json({ jsonrpc: "2.0", id, result: { tools } });
    if (method === "tools/call") {
      const text = handleToolCall(params?.name as string, (params?.arguments || {}) as Record<string, unknown>);
      return res.status(200).json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text }] } });
    }
    return res.status(200).json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
  }

  return res.status(405).json({ error: "Method not allowed" });
}