import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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
    const result = `## ${company_name}${industryText} 기업 분석

### 예상 인재상
- 도전정신
- 협업능력
- 전문성
- 창의성

### 핵심가치
도전 | 혁신 | 협력 | 고객중심 | 전문성

### 자소서 작성 포인트
1. ${company_name}의 비전과 본인의 목표 연결
2. 핵심가치와 관련된 구체적 경험 제시
3. 해당 기업에서 이루고 싶은 목표 명시`;
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
    const result = `## ${company_name} - ${job_title} 직무 분석

### 핵심 역량
1. 문제 해결 능력
2. 커뮤니케이션
3. 기술적 전문성
4. 자기주도성

### 필요 기술/경험
- ${job_title} 관련 실무 경험
- 관련 자격증
- 팀 프로젝트 경험

### 자소서 작성 전략
1. STAR 기법으로 구체화
2. 왜 이 직무인지 설명
3. 기여할 수 있는 부분 강조${job_description ? `

### 채용공고 분석
${job_description}` : ""}`;
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
    let result = `## 프로필 등록 완료

`;
    if (education) result += `### 학력
${education}

`;
    if (skills && skills.length > 0) result += `### 보유 역량
${skills.join(" | ")}

`;
    result += `### 등록된 경험 (${experiences.length}개)

`;
    experiences.forEach((exp, i) => {
      result += `#### ${i + 1}. [${exp.category}] ${exp.title}
- 기간: ${exp.period}
- 내용: ${exp.description}
- 성과: ${exp.achievements}

`;
    });
    result += `---
프로필 등록 완료! generate_star_draft로 자소서를 작성하세요.`;
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
    const result = `## 자소서 문항 분석

### 문항
"${question}" ${limitText}

### 출제 의도
1. 경험의 구체성
2. 문제 해결력
3. 성장 가능성
4. ${company_name} 조직 적합성

### 핵심 키워드
문제해결 | 협업 | 성장 | 도전 | 성과

### 답변 전략 (STAR 기법)
- Situation: 상황/배경
- Task: 역할과 목표
- Action: 구체적 행동
- Result: 성과${character_limit ? `

### 분량 배분 (${character_limit}자)
- S: ${Math.round(character_limit * 0.2)}자
- T: ${Math.round(character_limit * 0.15)}자
- A: ${Math.round(character_limit * 0.4)}자
- R: ${Math.round(character_limit * 0.25)}자` : ""}`;
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
    const result = `## STAR 자기소개서 초안

### 작성 정보
- 기업: ${company_name}
- 직무: ${job_title}
- 문항: ${question}
- 경험: ${experience_title}
- 목표: ${limit}자

---

### Situation (${Math.round(limit * 0.2)}자)
${experience_title} 경험의 배경입니다.

"${experience_description}"

[구체적인 시기/상황]에 시작되었으며 [팀 구성/규모]의 환경에서 진행되었습니다.

### Task (${Math.round(limit * 0.15)}자)
- 주요 목표: [핵심 목표]
- 담당 역할: [구체적 역할]
- 해결 과제: [문제점/도전]

### Action (${Math.round(limit * 0.4)}자)
**첫째**, [첫 번째 행동]
**둘째**, [두 번째 행동]
**셋째**, [세 번째 행동]

### Result (${Math.round(limit * 0.25)}자)
**정량적 성과**: [수치화된 성과]
**정성적 성과**: [배운 점]

이 경험으로 ${job_title} 직무 역량을 키웠으며, ${company_name}에서 기여하겠습니다.

---

### 수정 가이드
1. 괄호 내용을 실제 경험으로 교체
2. 인재상 키워드 반영
3. 글자수 조정 (목표: ${limit}자)
4. 수치/데이터 추가`;
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
    const result = `## 자기소개서 검토 결과

### 검토 정보
- 기업: ${company_name}
- 직무: ${job_title}
- 문항: ${question}
- 집중 영역: ${focus}
- 글자수: ${draft.length}자

---

### 강점
1. 경험이 포함됨
2. 기본 형식 갖춤

### 개선 사항

#### 1. 구체성 강화
- 추상적 표현 → 구체적 사례
- 수치/데이터 활용
- 육하원칙 적용

#### 2. 논리성 향상
- STAR 구조 명확화
- 단락 간 연결
- 문항 의도 부합

#### 3. 차별성 확보
- ${company_name} 맞춤 내용
- 독특한 관점 강조
- 차별화된 경험

#### 4. 가독성 개선
- 문장 길이 조절
- 키워드 강조
- 단락 구분

---

### 원본 미리보기
${draft.substring(0, 200)}${draft.length > 200 ? "..." : ""}

### 개선안
${company_name}에서 ${job_title} 직무 역량을 [경험명]으로 키웠습니다.

[S] 상황...
[T] 목표...
[A] 행동...
[R] 결과...

---

### 체크리스트
- [ ] ${company_name} 인재상 포함
- [ ] ${job_title} 연관성
- [ ] STAR 균형 배분
- [ ] 맞춤법 확인
- [ ] 글자수 준수`;
    return { content: [{ type: "text" as const, text: result }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Resume Helper MCP Server started");
}

main().catch(console.error);

