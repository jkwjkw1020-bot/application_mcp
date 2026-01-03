import type { VercelRequest, VercelResponse } from '@vercel/node';

const tools = [
  {
    name: "analyze_company",
    description: "특정 기업의 인재상, 핵심가치, 조직문화를 분석합니다",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "기업명" },
        industry: { type: "string", description: "산업군" }
      },
      required: ["company_name"]
    }
  },
  {
    name: "analyze_job_position",
    description: "특정 직무의 핵심 역량, 필요 기술, 주요 업무를 분석합니다",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "기업명" },
        job_title: { type: "string", description: "직무명" }
      },
      required: ["company_name", "job_title"]
    }
  },
  {
    name: "register_user_profile",
    description: "사용자의 경험, 활동, 스펙을 등록합니다",
    inputSchema: {
      type: "object",
      properties: {
        experiences: { type: "array", description: "경험 목록" }
      },
      required: ["experiences"]
    }
  },
  {
    name: "analyze_essay_question",
    description: "자기소개서 문항을 분석합니다",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "기업명" },
        question: { type: "string", description: "자소서 문항" }
      },
      required: ["company_name", "question"]
    }
  },
  {
    name: "generate_star_draft",
    description: "STAR 기법으로 자기소개서 초안을 생성합니다",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "기업명" },
        job_title: { type: "string", description: "직무" },
        question: { type: "string", description: "문항" },
        experience_title: { type: "string", description: "경험 제목" },
        experience_description: { type: "string", description: "경험 설명" }
      },
      required: ["company_name", "job_title", "question", "experience_title", "experience_description"]
    }
  },
  {
    name: "improve_essay",
    description: "자기소개서를 검토하고 개선점을 제안합니다",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "기업명" },
        job_title: { type: "string", description: "직무" },
        question: { type: "string", description: "문항" },
        draft: { type: "string", description: "초안" }
      },
      required: ["company_name", "job_title", "question", "draft"]
    }
  }
];

function handleToolCall(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "analyze_company":
      return `## ${args.company_name} 기업 분석\n\n### 인재상\n- 도전정신\n- 협업능력\n- 전문성\n\n### 핵심가치\n도전 | 혁신 | 협력`;
    
    case "analyze_job_position":
      return `## ${args.company_name} - ${args.job_title} 직무 분석\n\n### 핵심 역량\n1. 문제 해결 능력\n2. 커뮤니케이션\n3. 전문성`;
    
    case "register_user_profile": {
      const experiences = args.experiences as unknown[] | undefined;
      return `## 프로필 등록 완료\n\n등록된 경험: ${experiences?.length || 0}개`;
    }
    
    case "analyze_essay_question":
      return `## 문항 분석\n\n"${args.question}"\n\n### 출제 의도\n1. 경험의 구체성\n2. 문제 해결력\n\n### STAR 기법 활용 권장`;
    
    case "generate_star_draft":
      return `## STAR 자소서 초안\n\n### Situation\n${args.experience_description}\n\n### Task\n[목표 작성]\n\n### Action\n[행동 작성]\n\n### Result\n[결과 작성]`;
    
    case "improve_essay": {
      const draft = args.draft as string | undefined;
      return `## 자소서 검토 결과\n\n### 원본 (${draft?.length || 0}자)\n${draft?.substring(0, 100) || ""}...\n\n### 개선점\n1. 구체성 강화\n2. STAR 구조 명확화`;
    }
    
    default:
      return "Unknown tool";
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      jsonrpc: "2.0",
      result: {
        name: "resume-helper",
        version: "0.1.0",
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} }
      }
    });
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const { id, method, params } = body;

      if (method === "initialize") {
        return res.status(200).json({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "resume-helper", version: "0.1.0" }
          }
        });
      }

      if (method === "tools/list") {
        return res.status(200).json({
          jsonrpc: "2.0",
          id,
          result: { tools }
        });
      }

      if (method === "tools/call") {
        const toolName = params?.name as string;
        const toolArgs = (params?.arguments || {}) as Record<string, unknown>;
        const resultText = handleToolCall(toolName, toolArgs);

        return res.status(200).json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: resultText }]
          }
        });
      }

      return res.status(200).json({
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: "Method not found" }
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Internal error";
      return res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: errorMessage }
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
import type { VercelRequest, VercelResponse } from '@vercel/node';

const tools = [
  {
    name: "analyze_company",
    description: "특정 기업의 인재상, 핵심가치, 조직문화를 분석합니다",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "기업명" },
        industry: { type: "string", description: "산업군" }
      },
      required: ["company_name"]
    }
  },
  {
    name: "analyze_job_position",
    description: "특정 직무의 핵심 역량, 필요 기술, 주요 업무를 분석합니다",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "기업명" },
        job_title: { type: "string", description: "직무명" },
        job_description: { type: "string", description: "채용공고 상세내용" }
      },
      required: ["company_name", "job_title"]
    }
  },
  {
    name: "register_user_profile",
    description: "사용자의 경험, 활동, 스펙을 등록하고 구조화합니다",
    inputSchema: {
      type: "object",
      properties: {
        experiences: { 
          type: "array", 
          description: "경험 목록",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              title: { type: "string" },
              period: { type: "string" },
              description: { type: "string" },
              achievements: { type: "string" }
            }
          }
        },
        skills: { type: "array", items: { type: "string" }, description: "보유 기술" },
        education: { type: "string", description: "학력" }
      },
      required: ["experiences"]
    }
  },
  {
    name: "analyze_essay_question",
    description: "자기소개서 문항을 분석하여 출제 의도와 답변 전략을 제시합니다",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "기업명" },
        question: { type: "string", description: "자소서 문항" },
        character_limit: { type: "number", description: "글자수 제한" }
      },
      required: ["company_name", "question"]
    }
  },
  {
    name: "generate_star_draft",
    description: "STAR 기법으로 자기소개서 초안을 생성합니다",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "기업명" },
        job_title: { type: "string", description: "지원 직무" },
        question: { type: "string", description: "자소서 문항" },
        experience_title: { type: "string", description: "경험 제목" },
        experience_description: { type: "string", description: "경험 상세" },
        character_limit: { type: "number", description: "글자수 제한" }
      },
      required: ["company_name", "job_title", "question", "experience_title", "experience_description"]
    }
  },
  {
    name: "improve_essay",
    description: "작성된 자기소개서를 검토하고 개선점을 제안합니다",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "기업명" },
        job_title: { type: "string", description: "지원 직무" },
        question: { type: "string", description: "자소서 문항" },
        draft: { type: "string", description: "자소서 초안" },
        focus_areas: { type: "array", items: { type: "string" }, description: "집중 개선 영역" }
      },
      required: ["company_name", "job_title", "question", "draft"]
    }
  }
];

function analyzeCompany(company_name: string, industry?: string): string {
  const industryText = industry ? ` (${industry} 산업)` : "";
  return `## ${company_name}${industryText} 기업 분석

### 예상 인재상
- **도전정신**: 새로운 시도를 두려워하지 않는 인재
- **협업능력**: 팀과 함께 성과를 만들어가는 인재
- **전문성**: 해당 분야에서 깊은 역량을 갖춘 인재
- **창의성**: 기존의 틀을 깨는 혁신적 사고를 가진 인재

### 핵심가치 키워드
도전 | 혁신 | 협력 | 고객중심 | 전문성

### 자소서 작성 포인트
1. ${company_name}의 비전과 본인의 목표 연결
2. 핵심가치와 관련된 구체적 경험 제시
3. 해당 기업에서 이루고 싶은 목표 명시

> TIP: 기업 공식 홈페이지, 채용 페이지, 최근 뉴스를 참고하여 최신 정보를 확인하세요.`;
}

function analyzeJobPosition(company_name: string, job_title: string, job_description?: string): string {
  return `## ${company_name} - ${job_title} 직무 분석

### 핵심 역량
1. **문제 해결 능력**: 복잡한 문제를 분석하고 해결
2. **커뮤니케이션**: 팀원 및 이해관계자와 원활한 소통
3. **기술적 전문성**: ${job_title} 관련 도메인 지식
4. **자기주도성**: 능동적으로 업무 추진

### 필요 기술/경험
- ${job_title} 관련 실무 경험 또는 프로젝트
- 관련 자격증 또는 교육 이수
- 팀 프로젝트 협업 경험

### 자소서 작성 전략
1. STAR 기법으로 경험 구체화
2. 왜 이 직무인지 명확히 설명
3. 입사 후 기여할 수 있는 부분 강조${job_description ? `

### 채용공고 분석
${job_description}` : ""}`;
}

function registerUserProfile(experiences: any[], skills?: string[], education?: string): string {
  let result = `## 프로필 등록 완료\n\n`;
  if (education) result += `### 학력\n${education}\n\n`;
  if (skills && skills.length > 0) result += `### 보유 역량\n${skills.join(" | ")}\n\n`;
  result += `### 등록된 경험 (${experiences.length}개)\n\n`;
  experiences.forEach((exp: any, i: number) => {
    result += `#### ${i + 1}. [${exp.category || "기타"}] ${exp.title || "경험"}\n`;
    if (exp.period) result += `- 기간: ${exp.period}\n`;
    if (exp.description) result += `- 내용: ${exp.description}\n`;
    if (exp.achievements) result += `- 성과: ${exp.achievements}\n`;
    result += `\n`;
  });
  result += `---\n프로필 등록 완료! generate_star_draft로 자소서를 작성하세요.`;
  return result;
}

function analyzeEssayQuestion(company_name: string, question: string, character_limit?: number): string {
  const limitText = character_limit ? `(${character_limit}자)` : "";
  return `## 자소서 문항 분석

### 문항
> "${question}" ${limitText}

### 출제 의도
1. **경험의 구체성**: 실제 경험 기반 사례 제시 능력
2. **문제 해결력**: 어려움 극복 과정과 방법
3. **성장 가능성**: 경험을 통해 배운 점과 발전 방향
4. **조직 적합성**: ${company_name} 인재상과의 부합 여부

### 핵심 키워드
문제해결 | 협업 | 성장 | 도전 | 성과

### 답변 전략 (STAR 기법)
- **Situation**: 구체적인 상황/배경 설명
- **Task**: 본인의 역할과 목표
- **Action**: 취한 구체적인 행동
- **Result**: 정량적/정성적 성과${character_limit ? `

### 분량 배분 (총 ${character_limit}자)
- 상황(S): ${Math.round(character_limit * 0.2)}자
- 과제(T): ${Math.round(character_limit * 0.15)}자
- 행동(A): ${Math.round(character_limit * 0.4)}자
- 결과(R): ${Math.round(character_limit * 0.25)}자` : ""}`;
}

function generateStarDraft(
  company_name: string, 
  job_title: string, 
  question: string, 
  experience_title: string, 
  experience_description: string, 
  character_limit?: number
): string {
  const limit = character_limit || 1000;
  return `## STAR 자기소개서 초안

### 작성 정보
- 기업: ${company_name}
- 직무: ${job_title}
- 문항: ${question}
- 경험: ${experience_title}
- 목표: ${limit}자

---

### Situation (상황) - 약 ${Math.round(limit * 0.2)}자
${experience_title}을(를) 수행하게 된 배경입니다.

"${experience_description}"

[구체적인 시기/상황]에 시작되었으며, [팀 구성/규모]의 환경에서 진행되었습니다.

### Task (과제) - 약 ${Math.round(limit * 0.15)}자
- 주요 목표: [달성해야 할 핵심 목표]
- 담당 역할: [본인이 맡은 구체적 역할]
- 해결 과제: [극복해야 할 문제점/도전]

### Action (행동) - 약 ${Math.round(limit * 0.4)}자
**첫째**, [첫 번째 핵심 행동]
- 구체적인 방법과 과정 설명

**둘째**, [두 번째 핵심 행동]
- 어려움을 극복한 과정

**셋째**, [세 번째 핵심 행동]
- 추가적인 노력이나 창의적 해결책

### Result (결과) - 약 ${Math.round(limit * 0.25)}자
**정량적 성과**
- [수치화된 성과]

**정성적 성과**
- [배운 점/성장한 부분]

이 경험으로 ${job_title} 직무 역량을 키웠으며, ${company_name}에서 기여하겠습니다.

---

### 수정 가이드
1. 괄호 내용을 실제 경험으로 교체
2. ${company_name} 인재상 키워드 반영
3. 글자수 조정 (목표: ${limit}자)
4. 수치/데이터 추가`;
}

function improveEssay(
  company_name: string, 
  job_title: string, 
  question: string, 
  draft: string, 
  focus_areas?: string[]
): string {
  const focus = focus_areas?.join(", ") || "전체";
  return `## 자기소개서 검토 결과

### 검토 정보
- 기업: ${company_name}
- 직무: ${job_title}
- 문항: ${question}
- 집중 영역: ${focus}
- 글자수: ${draft.length}자

---

### 강점
1. 경험이 포함되어 있습니다
2. 기본 형식을 갖추고 있습니다

### 개선 사항

#### 1. 구체성 강화
- 추상적 표현을 구체적인 사례로 교체
- 수치/데이터를 활용한 성과 제시
- 육하원칙에 맞춰 서술

#### 2. 논리성 향상
- STAR 구조가 명확하게 드러나도록 수정
- 각 단락 간 자연스러운 연결
- 문항의 의도에 맞는 답변인지 확인

#### 3. 차별성 확보
- ${company_name}만을 위한 맞춤 내용 추가
- 본인만의 독특한 관점/접근법 강조
- 다른 지원자와 구별되는 경험 부각

#### 4. 가독성 개선
- 문장 길이 조절 (50자 내외)
- 핵심 키워드 강조
- 단락 구분 명확히

---

### 원본 미리보기
${draft.substring(0, 200)}${draft.length > 200 ? "..." : ""}

### 체크리스트
- [ ] ${company_name} 인재상 키워드 포함
- [ ] ${job_title} 직무 연관성
- [ ] STAR 각 요소 균형 배분
- [ ] 맞춤법/문법 확인
- [ ] 글자수 준수`;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET 요청 - 서버 정보
  if (req.method === 'GET') {
    return res.status(200).json({
      jsonrpc: "2.0",
      result: {
        name: "resume-helper",
        version: "0.1.0",
        description: "STAR 기법 기반 자기소개서 작성 도우미 MCP 서버",
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {}
        }
      }
    });
  }

  // POST 요청 - MCP 프로토콜 처리
  if (req.method === 'POST') {
    const { jsonrpc, id, method, params } = req.body || {};

    // initialize
    if (method === "initialize") {
      return res.status(200).json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "resume-helper", version: "0.1.0" }
        }
      });
    }

    // tools/list
    if (method === "tools/list") {
      return res.status(200).json({
        jsonrpc: "2.0",
        id,
        result: { tools }
      });
    }

    // tools/call
    if (method === "tools/call") {
      const { name, arguments: args } = params || {};
      let resultText = "";

      try {
        switch (name) {
          case "analyze_company":
            resultText = analyzeCompany(args.company_name, args.industry);
            break;
          case "analyze_job_position":
            resultText = analyzeJobPosition(args.company_name, args.job_title, args.job_description);
            break;
          case "register_user_profile":
            resultText = registerUserProfile(args.experiences, args.skills, args.education);
            break;
          case "analyze_essay_question":
            resultText = analyzeEssayQuestion(args.company_name, args.question, args.character_limit);
            break;
          case "generate_star_draft":
            resultText = generateStarDraft(
              args.company_name, 
              args.job_title, 
              args.question, 
              args.experience_title, 
              args.experience_description, 
              args.character_limit
            );
            break;
          case "improve_essay":
            resultText = improveEssay(
              args.company_name, 
              args.job_title, 
              args.question, 
              args.draft, 
              args.focus_areas
            );
            break;
          default:
            return res.status(200).json({
              jsonrpc: "2.0",
              id,
              error: { code: -32601, message: `Unknown tool: ${name}` }
            });
        }

        return res.status(200).json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: resultText }]
          }
        });
      } catch (error: any) {
        return res.status(200).json({
          jsonrpc: "2.0",
          id,
          error: { code: -32603, message: error.message || "Internal error" }
        });
      }
    }

    // 알 수 없는 메서드
    return res.status(200).json({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: "Method not found" }
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "resume-helper",
  version: "0.1.0"
});

server.tool(
  "analyze_company",
  "특정 기업의 인재상, 핵심가치, 조직문화를 분석합니다",
  {
    company_name: z.string().describe("기업명"),
    industry: z.string().optional().describe("산업군")
  },
  async ({ company_name, industry }) => {
    const industryText = industry ? ` (${industry} 산업)` : "";
    const result = `## ${company_name}${industryText} 기업 분석\n\n### 예상 인재상\n- 도전정신\n- 협업능력\n- 전문성\n- 창의성\n\n### 핵심가치\n도전 | 혁신 | 협력 | 고객중심 | 전문성\n\n### 자소서 작성 포인트\n1. ${company_name}의 비전과 본인의 목표 연결\n2. 핵심가치와 관련된 구체적 경험 제시\n3. 해당 기업에서 이루고 싶은 목표 명시`;
    return { content: [{ type: "text" as const, text: result }] };
  }
);

server.tool(
  "analyze_job_position",
  "특정 직무의 핵심 역량, 필요 기술, 주요 업무를 분석합니다",
  {
    company_name: z.string().describe("기업명"),
    job_title: z.string().describe("직무명"),
    job_description: z.string().optional().describe("채용공고 상세내용")
  },
  async ({ company_name, job_title, job_description }) => {
    const result = `## ${company_name} - ${job_title} 직무 분석\n\n### 핵심 역량\n1. 문제 해결 능력\n2. 커뮤니케이션\n3. 기술적 전문성\n4. 자기주도성\n\n### 필요 기술/경험\n- ${job_title} 관련 실무 경험\n- 관련 자격증\n- 팀 프로젝트 경험\n\n### 자소서 작성 전략\n1. STAR 기법으로 구체화\n2. 왜 이 직무인지 설명\n3. 기여할 수 있는 부분 강조${job_description ? `\n\n### 채용공고 분석\n${job_description}` : ""}`;
    return { content: [{ type: "text" as const, text: result }] };
  }
);

server.tool(
  "register_user_profile",
  "사용자의 경험, 활동, 스펙을 등록하고 구조화합니다",
  {
    experiences: z.array(z.object({
      category: z.string(),
      title: z.string(),
      period: z.string(),
      description: z.string(),
      achievements: z.string()
    })).describe("경험 목록"),
    skills: z.array(z.string()).optional().describe("보유 기술"),
    education: z.string().optional().describe("학력")
  },
  async ({ experiences, skills, education }) => {
    let result = `## 프로필 등록 완료\n\n`;
    if (education) result += `### 학력\n${education}\n\n`;
    if (skills && skills.length > 0) result += `### 보유 역량\n${skills.join(" | ")}\n\n`;
    result += `### 등록된 경험 (${experiences.length}개)\n\n`;
    experiences.forEach((exp, i) => {
      result += `#### ${i + 1}. [${exp.category}] ${exp.title}\n- 기간: ${exp.period}\n- 내용: ${exp.description}\n- 성과: ${exp.achievements}\n\n`;
    });
    result += `---\n프로필 등록 완료! generate_star_draft로 자소서를 작성하세요.`;
    return { content: [{ type: "text" as const, text: result }] };
  }
);

server.tool(
  "analyze_essay_question",
  "자기소개서 문항을 분석하여 출제 의도와 답변 전략을 제시합니다",
  {
    company_name: z.string().describe("기업명"),
    question: z.string().describe("자소서 문항"),
    character_limit: z.number().optional().describe("글자수 제한")
  },
  async ({ company_name, question, character_limit }) => {
    const limitText = character_limit ? `(${character_limit}자)` : "";
    const result = `## 자소서 문항 분석\n\n### 문항\n"${question}" ${limitText}\n\n### 출제 의도\n1. 경험의 구체성\n2. 문제 해결력\n3. 성장 가능성\n4. ${company_name} 조직 적합성\n\n### 핵심 키워드\n문제해결 | 협업 | 성장 | 도전 | 성과\n\n### 답변 전략 (STAR 기법)\n- Situation: 상황/배경\n- Task: 역할과 목표\n- Action: 구체적 행동\n- Result: 성과${character_limit ? `\n\n### 분량 배분 (${character_limit}자)\n- S: ${Math.round(character_limit * 0.2)}자\n- T: ${Math.round(character_limit * 0.15)}자\n- A: ${Math.round(character_limit * 0.4)}자\n- R: ${Math.round(character_limit * 0.25)}자` : ""}`;
    return { content: [{ type: "text" as const, text: result }] };
  }
);

server.tool(
  "generate_star_draft",
  "STAR 기법으로 자기소개서 초안을 생성합니다",
  {
    company_name: z.string().describe("기업명"),
    job_title: z.string().describe("지원 직무"),
    question: z.string().describe("자소서 문항"),
    experience_title: z.string().describe("경험 제목"),
    experience_description: z.string().describe("경험 상세"),
    character_limit: z.number().optional().describe("글자수 제한")
  },
  async ({ company_name, job_title, question, experience_title, experience_description, character_limit }) => {
    const limit = character_limit || 1000;
    const result = `## STAR 자기소개서 초안\n\n### 작성 정보\n- 기업: ${company_name}\n- 직무: ${job_title}\n- 문항: ${question}\n- 경험: ${experience_title}\n- 목표: ${limit}자\n\n---\n\n### Situation (${Math.round(limit * 0.2)}자)\n${experience_title} 경험의 배경입니다.\n\n"${experience_description}"\n\n[구체적인 시기/상황]에 시작되었으며 [팀 구성/규모]의 환경에서 진행되었습니다.\n\n### Task (${Math.round(limit * 0.15)}자)\n- 주요 목표: [핵심 목표]\n- 담당 역할: [구체적 역할]\n- 해결 과제: [문제점/도전]\n\n### Action (${Math.round(limit * 0.4)}자)\n**첫째**, [첫 번째 행동]\n**둘째**, [두 번째 행동]\n**셋째**, [세 번째 행동]\n\n### Result (${Math.round(limit * 0.25)}자)\n**정량적 성과**: [수치화된 성과]\n**정성적 성과**: [배운 점]\n\n이 경험으로 ${job_title} 직무 역량을 키웠으며, ${company_name}에서 기여하겠습니다.\n\n---\n\n### 수정 가이드\n1. 괄호 내용을 실제 경험으로 교체\n2. 인재상 키워드 반영\n3. 글자수 조정 (목표: ${limit}자)\n4. 수치/데이터 추가`;
    return { content: [{ type: "text" as const, text: result }] };
  }
);

server.tool(
  "improve_essay",
  "작성된 자기소개서를 검토하고 개선점을 제안합니다",
  {
    company_name: z.string().describe("기업명"),
    job_title: z.string().describe("지원 직무"),
    question: z.string().describe("자소서 문항"),
    draft: z.string().describe("자소서 초안"),
    focus_areas: z.array(z.string()).optional().describe("집중 개선 영역")
  },
  async ({ company_name, job_title, question, draft, focus_areas }) => {
    const focus = focus_areas?.join(", ") || "전체";
    const result = `## 자기소개서 검토 결과\n\n### 검토 정보\n- 기업: ${company_name}\n- 직무: ${job_title}\n- 문항: ${question}\n- 집중 영역: ${focus}\n- 글자수: ${draft.length}자\n\n---\n\n### 강점\n1. 경험이 포함됨\n2. 기본 형식 갖춤\n\n### 개선 사항\n\n#### 1. 구체성 강화\n- 추상적 표현을 구체적 사례로\n- 수치/데이터 활용\n\n#### 2. 논리성 향상\n- STAR 구조 명확화\n- 단락 간 연결\n\n#### 3. 차별성 확보\n- ${company_name} 맞춤 내용\n- 독특한 관점 강조\n\n#### 4. 가독성 개선\n- 문장 길이 조절\n- 키워드 강조\n\n---\n\n### 원본 미리보기\n${draft.substring(0, 150)}...\n\n### 체크리스트\n- ${company_name} 인재상 포함\n- ${job_title} 연관성\n- STAR 균형\n- 글자수 준수`;
    return { content: [{ type: "text" as const, text: result }] };
  }
);

import { ZodError } from "zod";

type ToolRequest = {
  tool: string;
  params: unknown;
};

const toolHandlers: Record<string, (params: unknown) => Promise<{ content: { type: "text"; text: string }[] }>> = {};

function registerTool(name: string, schema: z.ZodTypeAny, handler: (input: any) => Promise<{ content: { type: "text"; text: string }[] }>) {
  toolHandlers[name] = async (params: unknown) => handler(schema.parse(params));
}

registerTool(
  "analyze_company",
  z.object({
    company_name: z.string(),
    industry: z.string().optional()
  }),
  async ({ company_name, industry }) => {
    const industryText = industry ? ` (${industry} 산업)` : "";
    const result = `## ${company_name}${industryText} 기업 분석\n\n### 예상 인재상\n- 도전정신\n- 협업능력\n- 전문성\n- 창의성\n\n### 핵심가치\n도전 | 혁신 | 협력 | 고객중심 | 전문성\n\n### 자소서 작성 포인트\n1. ${company_name}의 비전과 본인의 목표 연결\n2. 핵심가치와 관련된 구체적 경험 제시\n3. 해당 기업에서 이루고 싶은 목표 명시`;
    return { content: [{ type: "text" as const, text: result }] };
  }
);

registerTool(
  "analyze_job_position",
  z.object({
    company_name: z.string(),
    job_title: z.string(),
    job_description: z.string().optional()
  }),
  async ({ company_name, job_title, job_description }) => {
    const result = `## ${company_name} - ${job_title} 직무 분석\n\n### 핵심 역량\n1. 문제 해결 능력\n2. 커뮤니케이션\n3. 기술적 전문성\n4. 자기주도성\n\n### 필요 기술/경험\n- ${job_title} 관련 실무 경험\n- 관련 자격증\n- 팀 프로젝트 경험\n\n### 자소서 작성 전략\n1. STAR 기법으로 구체화\n2. 왜 이 직무인지 설명\n3. 기여할 수 있는 부분 강조${job_description ? `\n\n### 채용공고 분석\n${job_description}` : ""}`;
    return { content: [{ type: "text" as const, text: result }] };
  }
);

registerTool(
  "register_user_profile",
  z.object({
    experiences: z.array(
      z.object({
        category: z.string(),
        title: z.string(),
        period: z.string(),
        description: z.string(),
        achievements: z.string()
      })
    ),
    skills: z.array(z.string()).optional(),
    education: z.string().optional()
  }),
  async ({ experiences, skills, education }) => {
    let result = `## 프로필 등록 완료\n\n`;
    if (education) result += `### 학력\n${education}\n\n`;
    if (skills && skills.length > 0) result += `### 보유 역량\n${skills.join(" | ")}\n\n`;
    result += `### 등록된 경험 (${experiences.length}개)\n\n`;
    experiences.forEach((exp, i) => {
      result += `#### ${i + 1}. [${exp.category}] ${exp.title}\n- 기간: ${exp.period}\n- 내용: ${exp.description}\n- 성과: ${exp.achievements}\n\n`;
    });
    result += `---\n프로필 등록 완료! generate_star_draft로 자소서를 작성하세요.`;
    return { content: [{ type: "text" as const, text: result }] };
  }
);

registerTool(
  "analyze_essay_question",
  z.object({
    company_name: z.string(),
    question: z.string(),
    character_limit: z.number().optional()
  }),
  async ({ company_name, question, character_limit }) => {
    const limitText = character_limit ? `(${character_limit}자)` : "";
    const result = `## 자소서 문항 분석\n\n### 문항\n"${question}" ${limitText}\n\n### 출제 의도\n1. 경험의 구체성\n2. 문제 해결력\n3. 성장 가능성\n4. ${company_name} 조직 적합성\n\n### 핵심 키워드\n문제해결 | 협업 | 성장 | 도전 | 성과\n\n### 답변 전략 (STAR 기법)\n- Situation: 상황/배경\n- Task: 역할과 목표\n- Action: 구체적 행동\n- Result: 성과${character_limit ? `\n\n### 분량 배분 (${character_limit}자)\n- S: ${Math.round(character_limit * 0.2)}자\n- T: ${Math.round(character_limit * 0.15)}자\n- A: ${Math.round(character_limit * 0.4)}자\n- R: ${Math.round(character_limit * 0.25)}자` : ""}`;
    return { content: [{ type: "text" as const, text: result }] };
  }
);

registerTool(
  "generate_star_draft",
  z.object({
    company_name: z.string(),
    job_title: z.string(),
    question: z.string(),
    experience_title: z.string(),
    experience_description: z.string(),
    character_limit: z.number().optional()
  }),
  async ({ company_name, job_title, question, experience_title, experience_description, character_limit }) => {
    const limit = character_limit || 1000;
    const result = `## STAR 자기소개서 초안\n\n### 작성 정보\n- 기업: ${company_name}\n- 직무: ${job_title}\n- 문항: ${question}\n- 경험: ${experience_title}\n- 목표: ${limit}자\n\n---\n\n### Situation (${Math.round(limit * 0.2)}자)\n${experience_title} 경험의 배경입니다.\n\n"${experience_description}"\n\n[구체적인 시기/상황]에 시작되었으며 [팀 구성/규모]의 환경에서 진행되었습니다.\n\n### Task (${Math.round(limit * 0.15)}자)\n- 주요 목표: [핵심 목표]\n- 담당 역할: [구체적 역할]\n- 해결 과제: [문제점/도전]\n\n### Action (${Math.round(limit * 0.4)}자)\n**첫째**, [첫 번째 행동]\n**둘째**, [두 번째 행동]\n**셋째**, [세 번째 행동]\n\n### Result (${Math.round(limit * 0.25)}자)\n**정량적 성과**: [수치화된 성과]\n**정성적 성과**: [배운 점]\n\n이 경험으로 ${job_title} 직무 역량을 키웠으며, ${company_name}에서 기여하겠습니다.\n\n---\n\n### 수정 가이드\n1. 괄호 내용을 실제 경험으로 교체\n2. 인재상 키워드 반영\n3. 글자수 조정 (목표: ${limit}자)\n4. 수치/데이터 추가`;
    return { content: [{ type: "text" as const, text: result }] };
  }
);

registerTool(
  "improve_essay",
  z.object({
    company_name: z.string(),
    job_title: z.string(),
    question: z.string(),
    draft: z.string(),
    focus_areas: z.array(z.string()).optional()
  }),
  async ({ company_name, job_title, question, draft, focus_areas }) => {
    const focus = focus_areas?.join(", ") || "전체";
    const result = `## 자기소개서 검토 결과\n\n### 검토 정보\n- 기업: ${company_name}\n- 직무: ${job_title}\n- 문항: ${question}\n- 집중 영역: ${focus}\n- 글자수: ${draft.length}자\n\n---\n\n### 강점\n1. 경험이 포함됨\n2. 기본 형식 갖춤\n\n### 개선 사항\n\n#### 1. 구체성 강화\n- 추상적 표현을 구체적 사례로\n- 수치/데이터 활용\n\n#### 2. 논리성 향상\n- STAR 구조 명확화\n- 단락 간 연결\n\n#### 3. 차별성 확보\n- ${company_name} 맞춤 내용\n- 독특한 관점 강조\n\n#### 4. 가독성 개선\n- 문장 길이 조절\n- 키워드 강조\n\n---\n\n### 원본 미리보기\n${draft.substring(0, 150)}...\n\n### 체크리스트\n- ${company_name} 인재상 포함\n- ${job_title} 연관성\n- STAR 균형\n- 글자수 준수`;
    return { content: [{ type: "text" as const, text: result }] };
  }
);

export function listTools() {
  return Object.keys(toolHandlers);
}

export async function handleToolRequest(body: ToolRequest) {
  if (!body || typeof body !== "object") throw new Error("Invalid request body");
  const handler = toolHandlers[body.tool];
  if (!handler) throw new Error("Unknown tool");
  try {
    return await handler(body.params);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new Error("Invalid parameters");
    }
    throw err;
  }
}

export default server;

