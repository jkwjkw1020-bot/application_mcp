import type { VercelRequest, VercelResponse } from '@vercel/node';

// Streamable HTTP MCP server (protocol >= 2025-03-26)
// Supports JSON or SSE (text/event-stream) responses via POST /api/mcp

const PROTOCOL_VERSION = "2025-03-26";
const SERVER_INFO = { name: "resume-helper", version: "1.1.0" };

type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const tools: Tool[] = [
  {
    name: "analyze_company",
    description: "특정 기업의 인재상/핵심가치/포인트 분석",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "분석할 기업명" },
      },
      required: ["company_name"],
    },
  },
  {
    name: "analyze_job_position",
    description: "직무 핵심 역량/필요 기술/주요 업무 분석",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "기업명" },
        job_title: { type: "string", description: "직무명" },
        job_description: { type: "string", description: "채용공고 상세", nullable: true },
      },
      required: ["company_name", "job_title"],
    },
  },
  {
    name: "register_user_profile",
    description: "경험/역량을 구조화하여 반환합니다. 결과는 클라이언트가 저장하세요.",
    inputSchema: {
      type: "object",
      properties: {
        experiences: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "경험 제목" },
              description: { type: "string", description: "상세 설명" },
              period: { type: "string", description: "기간" },
              achievements: {
                type: "array",
                items: { type: "string" },
                description: "성과/활동 목록",
              },
            },
            required: ["title", "description"],
          },
          description: "경험 목록",
        },
        skills: { type: "array", items: { type: "string" }, description: "보유 기술", nullable: true },
        education: { type: "string", description: "학력", nullable: true },
      },
      required: ["experiences"],
    },
  },
  {
    name: "analyze_essay_question",
    description: "자소서 문항 의도/전략/키워드 분석",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "기업명" },
        question: { type: "string", description: "문항 전문" },
        character_limit: { type: "number", description: "글자수 제한", nullable: true },
      },
      required: ["company_name", "question"],
    },
  },
  {
    name: "generate_star_draft",
    description: "STAR 기법으로 자소서 초안 생성",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string" },
        job_title: { type: "string" },
        question: { type: "string" },
        experience_title: { type: "string" },
        experience_description: { type: "string" },
        character_limit: { type: "number", nullable: true },
      },
      required: ["company_name", "job_title", "question", "experience_title", "experience_description"],
    },
  },
  {
    name: "improve_essay",
    description: "작성된 자소서를 검토하고 개선점 제시",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string" },
        job_title: { type: "string" },
        question: { type: "string" },
        draft: { type: "string" },
        focus_areas: { type: "array", items: { type: "string" }, nullable: true },
      },
      required: ["company_name", "job_title", "question", "draft"],
    },
  },
  {
    name: "transform_experience",
    description: "경험을 목표 기업/가치에 맞춰 STAR 기반으로 재구성",
    inputSchema: {
      type: "object",
      properties: {
        experience: {
          type: "object",
          description: "변환할 경험",
          properties: {
            title: { type: "string", description: "경험 제목" },
            description: { type: "string", description: "경험 상세" },
            period: { type: "string", description: "기간", nullable: true },
            achievements: { type: "array", items: { type: "string" }, description: "성과/활동", nullable: true },
          },
          required: ["title", "description"],
        },
        target_company: { type: "string", description: "목표 기업" },
        target_value: { type: "string", description: "목표 인재상/가치" },
        output_format: {
          type: "string",
          enum: ["paragraph", "bullet", "one_liner", "full"],
          description: "출력 형식",
          default: "full",
          nullable: true,
        },
      },
      required: ["experience", "target_company", "target_value"],
    },
  },
  {
    name: "generate_experience_variations",
    description: "한 경험을 여러 역량/관점으로 재해석한 버전 생성",
    inputSchema: {
      type: "object",
      properties: {
        experience: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            period: { type: "string", nullable: true },
            achievements: { type: "array", items: { type: "string" }, nullable: true },
          },
          required: ["title", "description"],
        },
        variation_types: {
          type: "array",
          items: {
            type: "string",
            enum: ["도전정신", "협업소통", "리더십", "문제해결", "창의혁신", "성장", "실패극복", "글로벌역량"],
          },
          description: "생성할 버전 유형",
          default: ["도전정신", "협업소통", "문제해결"],
          nullable: true,
        },
      },
      required: ["experience"],
    },
  },
  {
    name: "analyze_experience_gap",
    description: "보유 경험과 목표 기업 요구 역량 간 GAP 분석",
    inputSchema: {
      type: "object",
      properties: {
        experiences: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              category: {
                type: "string",
                enum: ["아르바이트", "동아리", "프로젝트", "인턴", "봉사활동", "해외경험", "자격증", "기타"],
                nullable: true,
              },
            },
            required: ["title", "description"],
          },
        },
        target_companies: { type: "array", items: { type: "string" }, description: "목표 기업 목록" },
        include_recommendations: { type: "boolean", default: true, nullable: true },
      },
      required: ["experiences", "target_companies"],
    },
  },
  {
    name: "suggest_experience_for_question",
    description: "특정 자소서 문항에 적합한 경험 추천 및 활용 전략",
    inputSchema: {
      type: "object",
      properties: {
        experiences: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
            },
            required: ["title", "description"],
          },
        },
        company_name: { type: "string" },
        job_title: { type: "string", nullable: true },
        question: { type: "string" },
        exclude_experiences: { type: "array", items: { type: "string" }, nullable: true },
      },
      required: ["experiences", "company_name", "question"],
    },
  },
];

type RpcError = { code: number; message: string };

function jsonResponse(res: VercelResponse, status: number, body: unknown) {
  return res.status(status).json(body);
}

function errorResponse(res: VercelResponse, id: unknown, error: RpcError, status = 200) {
  return jsonResponse(res, status, { jsonrpc: "2.0", id: id ?? null, error });
}

function textResult(text: string) {
  return { jsonrpc: "2.0", result: { content: [{ type: "text", text }] } };
}

function missingParams(args: Record<string, unknown>, fields: string[]) {
  return fields.filter((f) => args[f] === undefined || args[f] === null);
}

function sseResponse(res: VercelResponse, payload: unknown) {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
  res.end();
  return res;
}

function handleAnalyzeCompany(args: Record<string, unknown>) {
  const company = (args.company_name as string) || "";
  return `## ${company} 기업 분석

### 예상 인재상
- 도전정신
- 협업
- 전문성

### 작성 포인트
1) ${company}의 비전과 연결
2) 핵심가치 연관 경험 제시
3) 직무와의 적합성 강조`;
}

function handleAnalyzeJobPosition(args: Record<string, unknown>) {
  const company = (args.company_name as string) || "";
  const job = (args.job_title as string) || "";
  const jd = (args.job_description as string) || "";
  return `## ${company} - ${job} 직무 분석

### 핵심 역량
- 문제 해결
- 커뮤니케이션
- 실행력

### 필요 경험/기술
- ${job} 관련 프로젝트/인턴
- 관련 자격 및 툴 숙련

${jd ? `### 공고 참고
${jd}` : "### 공고 참고\n(미제공)"}`;
}

function handleRegisterUserProfile(args: Record<string, unknown>) {
  const experiences = (args.experiences as any[]) || [];
  const skills = (args.skills as string[]) || [];
  const education = (args.education as string) || "";
  const lines = experiences.map((exp, idx) => {
    const ach = Array.isArray(exp?.achievements) ? exp.achievements.join(" | ") : "";
    return `${idx + 1}. ${exp?.title || "제목 없음"} - ${exp?.period || "기간 미입력"}
내용: ${exp?.description || "-"}
성과: ${ach || "-"}`;
  });
  return `## 프로필 구조화 결과 (Stateless)

경험 ${experiences.length}개 정리 완료. 클라이언트 측에 저장 후 다른 도구 호출 시 전달하세요.
${education ? `\n학력: ${education}` : ""}
${skills.length ? `보유 기술: ${skills.join(", ")}` : ""}

경험 목록:
${lines.join("\n\n") || "- 없음"}`;
}

function handleAnalyzeEssayQuestion(args: Record<string, unknown>) {
  const company = (args.company_name as string) || "";
  const question = (args.question as string) || "";
  const limit = args.character_limit as number | undefined;
  return `## 문항 분석
"${question}"

### 출제 의도
- 구체적 사례
- 문제 해결력
- 성장 가능성
- ${company} 가치 적합성

${limit ? `### 분량 가이드 (${limit}자)
S:${Math.round(limit * 0.2)} T:${Math.round(limit * 0.15)} A:${Math.round(limit * 0.4)} R:${Math.round(limit * 0.25)}` : ""}`;
}

function handleGenerateStarDraft(args: Record<string, unknown>) {
  const company = (args.company_name as string) || "";
  const job = (args.job_title as string) || "";
  const question = (args.question as string) || "";
  const expTitle = (args.experience_title as string) || "";
  const expDesc = (args.experience_description as string) || "";
  const limit = (args.character_limit as number) || 1000;
  return `## STAR 초안
- 기업: ${company}
- 직무: ${job}
- 문항: ${question}
- 목표 분량: ${limit}자

S (${Math.round(limit * 0.2)}자) - ${expTitle} 상황과 배경을 구체적으로 기술
T (${Math.round(limit * 0.15)}자) - 역할/목표
A (${Math.round(limit * 0.4)}자) - 핵심 행동 단계별 전개
R (${Math.round(limit * 0.25)}자) - 수치/정성 성과

경험 요약: ${expDesc}`;
}

function handleImproveEssay(args: Record<string, unknown>) {
  const company = (args.company_name as string) || "";
  const job = (args.job_title as string) || "";
  const draft = (args.draft as string) || "";
  const focus = Array.isArray(args.focus_areas) ? (args.focus_areas as string[]).join(", ") : "전체";
  return `## 자기소개서 개선안
- 기업: ${company}
- 직무: ${job}
- 집중 영역: ${focus}
- 글자수: ${draft.length}자

### 개선 포인트
1) 구체화: 수치/상황/역할 명시
2) 논리성: STAR 흐름 강화
3) 차별성: ${company} 맞춤 키워드 포함
4) 가독성: 단락 분리, 짧은 문장`;
}

function handleTransformExperience(args: Record<string, unknown>) {
  const exp = (args.experience || {}) as Record<string, unknown>;
  const company = (args.target_company as string) || "";
  const value = (args.target_value as string) || "";
  const title = (exp.title as string) || "제목 없음";
  const desc = (exp.description as string) || "";
  const achievements = Array.isArray(exp.achievements) ? (exp.achievements as string[]) : [];
  const paragraph = `(${company}/${value}) ${title} 경험을 STAR로 재구성했습니다. ${desc}`;
  return {
    original_experience: { title, description: desc },
    target: { company, value, value_definition: `${value} 관점에서 임팩트를 드러내는 서술` },
    transformation: {
      star_format: {
        situation: `현장에서 발견한 문제를 ${value} 관점으로 정의`,
        task: `${company} 가치에 맞춘 역할/목표 설정`,
        action: `핵심 행동(분석-실행-검증) 전개${achievements.length ? `, 성과: ${achievements.join("; ")}` : ""}`,
        result: "정량/정성 성과 및 배운 점을 명시",
      },
      paragraph,
      one_liner: "핵심 문제를 재정의하고 실험으로 개선한 경험",
      key_keywords: ["재정의", "실행", "검증", value],
      strength_score: 0.82,
    },
    interview_prep: {
      expected_questions: [
        "성과는 어떻게 측정했나요?",
        "반대나 리스크는 없었나요?",
        "다시 한다면 무엇을 바꾸겠나요?",
      ],
      answer_tips: [
        "측정 방법과 기준을 구체적으로",
        "이해관계자 설득/협업 과정을 포함",
        "대안/회고를 한 줄이라도 추가",
      ],
    },
    enhancement_tips: [
      "💡 정량 지표를 1개 이상 포함",
      "💡 실패/시행착오를 짧게라도 언급",
      "💡 타겟 가치 키워드를 본문에 2회 이상 반영",
    ],
  };
}

function handleGenerateExperienceVariations(args: Record<string, unknown>) {
  const exp = (args.experience || {}) as Record<string, unknown>;
  const title = (exp.title as string) || "경험";
  const description = (exp.description as string) || "";
  const types = (Array.isArray(args.variation_types) ? args.variation_types : ["도전정신", "협업소통", "문제해결"]) as string[];
  const variations: Record<string, unknown> = {};
  types.forEach((type) => {
    variations[type] = {
      angle: `${type} 관점으로 재해석`,
      reframed_story: `${title} 경험을 ${type} 키워드로 강조: ${description}`,
      core_competency: ["상황 정의", "실행", "성과"],
      best_for_companies: ["삼성전자", "현대자동차", "SK"],
      strength_score: 0.78,
    };
  });
  return {
    source_experience: { title, description },
    variations,
    company_recommendations: {
      삼성전자: { recommended_variation: types[0] || "도전정신", reason: "도전/혁신 문항 적합" },
      현대자동차: { recommended_variation: types[1] || types[0] || "협업소통", reason: "소통/협력 가치와 부합" },
    },
  };
}

function handleAnalyzeExperienceGap(args: Record<string, unknown>) {
  const experiences = (args.experiences as any[]) || [];
  const companies = (args.target_companies as string[]) || [];
  const includeRec = args.include_recommendations !== false;
  const coverage: Record<string, unknown> = {};
  companies.forEach((c) => {
    coverage[c] = {
      도전정신: {
        status: experiences.length ? "covered" : "gap",
        matched_experience: experiences[0]?.title || null,
        strength: "medium",
        score: 0.72,
        improvement_tip: "성과 수치 추가",
      },
      글로벌역량: {
        status: "gap",
        matched_experience: null,
        strength: "none",
        score: 0,
        severity: "high",
      },
    };
  });
  const gaps = companies.map((c) => ({
    company: c,
    missing_value: "글로벌역량",
    severity: "high",
    impact: "글로벌 관련 문항 대응 취약",
    recommendations: includeRec
      ? {
          reframe_existing: {
            source_experience: experiences[0]?.title || "해외/다문화 경험",
            suggested_angle: "다국적 협업/소통 사례로 전환",
            example_story: "온라인 글로벌 프로젝트에서 갈등을 조율한 경험 추가",
          },
        }
      : undefined,
  }));
  return {
    analysis_summary: { total_experiences: experiences.length, companies_analyzed: companies },
    coverage_matrix: coverage,
    gaps,
    overall_readiness: Object.fromEntries(
      companies.map((c) => [c, { score: "70%", verdict: "준비도 양호, 글로벌/수치 보완 필요" }])
    ),
    strategic_advice: "가장 지원도 높은 기업부터 부족 역량을 수치화된 사례로 보완하세요.",
  };
}

function handleSuggestExperienceForQuestion(args: Record<string, unknown>) {
  const experiences = (args.experiences as any[]) || [];
  const question = (args.question as string) || "";
  const exclude = new Set((args.exclude_experiences as string[]) || []);
  const available = experiences.filter((e) => !exclude.has(e?.title));
  const primary = available[0] || experiences[0];
  const backup = available[1] || experiences[1];
  return {
    question_analysis: {
      original_question: question,
      core_intent: "핵심 역량 검증",
      key_keywords: ["문제해결", "창의", "협업"],
      looking_for: ["상황 정의", "독창적 접근", "성과/학습"],
    },
    recommendations: [
      primary
        ? {
            rank: 1,
            experience_title: primary.title,
            match_score: 0.85,
            recommended_angle: "문제 재정의 + 실행",
            why_this_fits: "상황-행동-성과를 명확히 제시 가능",
            story_preview: primary.description,
          }
        : null,
      backup
        ? {
            rank: 2,
            experience_title: backup.title,
            match_score: 0.75,
            recommended_angle: "협업/설득",
            why_this_fits: "이해관계자 조율/소통 사례로 확장 가능",
            story_preview: backup.description,
          }
        : null,
    ].filter(Boolean),
    usage_strategy: {
      primary: primary?.title || "",
      backup: backup?.title || "",
      combination_idea: "문제 재정의 사례와 협업 사례를 연결하면 시너지",
    },
    excluded_check: { already_used: Array.from(exclude), available_count: available.length },
  };
}

function executeTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "analyze_company":
      return handleAnalyzeCompany(args);
    case "analyze_job_position":
      return handleAnalyzeJobPosition(args);
    case "register_user_profile":
      return handleRegisterUserProfile(args);
    case "analyze_essay_question":
      return handleAnalyzeEssayQuestion(args);
    case "generate_star_draft":
      return handleGenerateStarDraft(args);
    case "improve_essay":
      return handleImproveEssay(args);
    case "transform_experience":
      return handleTransformExperience(args);
    case "generate_experience_variations":
      return handleGenerateExperienceVariations(args);
    case "analyze_experience_gap":
      return handleAnalyzeExperienceGap(args);
    case "suggest_experience_for_question":
      return handleSuggestExperienceForQuestion(args);
    default:
      throw { code: -32601, message: `Method not found: ${name}` } as RpcError;
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") return jsonResponse(res, 200, { status: "ok", endpoint: "/api/mcp" });

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id, method, params } = (req.body || {}) as { id?: unknown; method?: string; params?: any };
  const accept = (req.headers["accept"] || "") as string;
  const wantsStream = accept.includes("text/event-stream");

  try {
    if (method === "initialize") {
      const payload = {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        },
      };
      return wantsStream ? sseResponse(res, payload) : jsonResponse(res, 200, payload);
    }

    if (method === "tools/list") {
      const payload = { jsonrpc: "2.0", id, result: { tools } };
      return wantsStream ? sseResponse(res, payload) : jsonResponse(res, 200, payload);
    }

    if (method === "tools/call") {
      const toolName = params?.name as string;
      const args = (params?.arguments || {}) as Record<string, unknown>;
      const tool = tools.find((t) => t.name === toolName);
      if (!tool) return errorResponse(res, id, { code: -32601, message: `Tool not found: ${toolName}` });

      // basic required check
      const required = (tool.inputSchema as any)?.required as string[] | undefined;
      if (required?.length) {
        const missing = missingParams(args, required);
        if (missing.length) {
          return errorResponse(res, id, { code: -32602, message: `Missing required params: ${missing.join(", ")}` });
        }
      }

      const result = executeTool(toolName, args);
      const payload = { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }] } };
      return wantsStream ? sseResponse(res, payload) : jsonResponse(res, 200, payload);
    }

    return errorResponse(res, id, { code: -32601, message: `Method not found: ${method}` });
  } catch (error: any) {
    const rpcError: RpcError = error?.code
      ? { code: error.code, message: error.message || "Error" }
      : { code: -32603, message: error?.message || "Internal error" };
    return errorResponse(res, id, rpcError);
  }
}