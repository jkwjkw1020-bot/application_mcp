import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      name: "resume-helper",
      version: "0.1.0",
      description: "STAR 기법 기반 자기소개서 작성 도우미 MCP 서버",
      status: "running",
      endpoints: {
        info: "/api",
        mcp: "/api/mcp"
      },
      tools: [
        "analyze_company",
        "analyze_job_position",
        "register_user_profile",
        "analyze_essay_question",
        "generate_star_draft",
        "improve_essay"
      ]
    });
  }
  
  return res.status(405).json({ error: "Method not allowed" });
}