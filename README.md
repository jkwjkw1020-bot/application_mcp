# 기업 분석 자소서 전문가 MCP

대기업 취업 준비생을 위한 종합 자소서 작성 지원 MCP 서버입니다.

## 📋 개요

이 MCP 서버는 대기업 취업 준비생을 위해 다음 프로세스를 하나의 유기적인 흐름으로 제공합니다:

1. **기업 분석** → 기업의 인재상, 사업 방향, 리스크 성향 분석
2. **직무 평가 기준 도출** → 서류 평가 기준 도출 (must_show, acceptable, red_flags)
3. **경험 매핑** → 사용자 경험을 대기업 기준으로 선별 (strong_fit, weak_fit, risky)
4. **자소서 전략 설계** → 문항의 숨은 의도 분석 및 추천 구조 제시
5. **자소서 생성** → 대기업 통과 확률을 높이는 자소서 초안 생성
6. **면접관 시뮬레이션** → 서류 심사위원 시점에서 평가 (pass_probability, rejection_reason, improvement_advice)

## 🎯 지원 기업

- **삼성전자**: 기술 중심, 실력주의 문화
- **SK**: 상생 경영, 협업 중심 문화

## ✅ MCP 스펙

- **MCP Spec**: 2025-03-26 이상 준수
- **Transport**: Streamable HTTP 방식
- **구조**: Stateless
- **플랫폼**: Node.js 기반
- **검증**: MCP Inspector 호환

## 🚀 설치 및 실행

### 필수 요구사항

- Node.js 18.0.0 이상
- npm 또는 yarn

### 설치

```bash
npm install
```

### 실행

#### HTTP 모드 (Remote MCP Server)

```bash
MCP_MODE=http npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

- **Health Check**: `GET http://localhost:3000/health`
- **MCP Endpoint**: `POST http://localhost:3000/mcp`

#### Stdio 모드 (MCP Inspector 호환)

```bash
npm start
```

## 🛠️ Tools

### 1. analyze_enterprise_company

대기업 관점에서 기업의 인재상, 사업 방향, 리스크 성향을 분석합니다.

**입력:**
```json
{
  "company": "삼성전자" | "SK"
}
```

**출력:**
- 인재상 분석
- 사업 방향 분석
- 리스크 성향 분석
- 차별화 요소

### 2. derive_enterprise_evaluation_logic

대기업 서류 평가 기준을 도출합니다.

**입력:**
```json
{
  "company": "삼성전자" | "SK",
  "role": "신입 직무" (선택)
}
```

**출력:**
- `must_show`: 필수 요소
- `acceptable`: 허용 요소
- `red_flags`: 즉시 탈락 요소

### 3. map_experience_to_enterprise

사용자 경험을 대기업 기준으로 선별합니다.

**입력:**
```json
{
  "company": "삼성전자" | "SK",
  "experiences": [
    {
      "title": "프로젝트명",
      "description": "설명",
      "period": "기간",
      "achievements": ["성과1", "성과2"]
    }
  ]
}
```

**출력:**
- `strong_fit`: 강한 적합성
- `weak_fit`: 약한 적합성
- `risky`: 위험 요소

### 4. design_question_strategy

자소서 문항의 숨은 의도를 분석하고 추천 구조와 강조 포인트를 제시합니다.

**입력:**
```json
{
  "company": "삼성전자" | "SK",
  "question": "자소서 문항"
}
```

**출력:**
- 숨은 의도 분석
- 추천 구조 (STAR 등)
- 강조 포인트
- 작성 팁

### 5. generate_enterprise_essay

대기업 통과 확률을 높이는 자소서 초안을 생성합니다.

**입력:**
```json
{
  "company": "삼성전자" | "SK",
  "question": "자소서 문항",
  "selected_experiences": [경험 배열],
  "strategy": {전략 객체} (선택)
}
```

**출력:**
- 자소서 초안
- 단어 수
- 사용된 구조
- 주요 하이라이트
- 강점 및 개선 사항

### 6. simulate_enterprise_reviewer ⭐

삼성/SK 서류 심사위원 시점에서 평가합니다. **가장 중요한 Tool입니다.**

**입력:**
```json
{
  "company": "삼성전자" | "SK",
  "essay": "작성된 자소서",
  "question": "자소서 문항"
}
```

**출력:**
- `pass_probability`: 통과 확률 (정성적 수치)
- `pass_probability_label`: 통과 확률 레이블
- `rejection_reason`: 탈락 사유 배열
- `improvement_advice`: 개선 조언 배열
- `strengths`: 강점 배열
- `weaknesses`: 약점 배열
- `detailed_analysis`: 상세 분석 (구조, 내용, 기업 적합성, 구체성, 논리성)

## 📚 Resources

### 1. 삼성 채용 평가 로직

**URI**: `resource://samsung-evaluation-logic`

삼성전자의 서류 평가 기준과 평가 로직을 제공합니다.

### 2. SK 채용 평가 로직

**URI**: `resource://sk-evaluation-logic`

SK의 서류 평가 기준과 평가 로직을 제공합니다.

### 3. 대기업 자소서 탈락 패턴

**URI**: `resource://rejection-patterns`

대기업 자소서에서 즉시 탈락되는 주요 패턴들을 제공합니다.

## 🎮 데모 시나리오

### 시나리오: 동일한 경험으로 삼성과 SK 비교

1. **경험 입력**
   ```json
   {
     "experiences": [
       {
         "title": "웹 개발 프로젝트",
         "description": "팀 프로젝트로 웹 애플리케이션 개발",
         "achievements": ["성능 30% 개선", "팀원 5명과 협업"]
       }
     ]
   }
   ```

2. **삼성전자 분석**
   - `map_experience_to_enterprise` → 기술 역량 중심 평가
   - `generate_enterprise_essay` → 기술적 깊이 강조
   - `simulate_enterprise_reviewer` → 기술 역량 점수 높음

3. **SK 분석**
   - `map_experience_to_enterprise` → 협업 능력 중심 평가
   - `generate_enterprise_essay` → 협업과 상생 가치 강조
   - `simulate_enterprise_reviewer` → 협업 능력 점수 높음

**결과**: 동일한 경험이라도 기업에 따라 완전히 다른 자소서와 평가가 생성됩니다.

## 📊 Target Object

모든 Tool은 다음 Target Object를 기준으로 동작합니다:

```json
{
  "company": "삼성전자" | "SK",
  "industry": "제조/IT" | "에너지/화학/IT",
  "role": "신입 직무",
  "seniority": "신입",
  "company_type": "대기업"
}
```

## 🏗️ 프로젝트 구조

```
.
├── server.js                 # 메인 MCP 서버
├── package.json              # 프로젝트 설정
├── tools/                    # Tool 구현
│   ├── analyzeEnterpriseCompany.js
│   ├── deriveEnterpriseEvaluationLogic.js
│   ├── mapExperienceToEnterprise.js
│   ├── designQuestionStrategy.js
│   ├── generateEnterpriseEssay.js
│   └── simulateEnterpriseReviewer.js
└── resources/                # Resource 구현
    ├── samsungEvaluationLogic.js
    ├── skEvaluationLogic.js
    └── rejectionPatterns.js
```

## 🔍 MCP Inspector 검증

MCP Inspector에서 다음을 확인할 수 있습니다:

1. **Tools 목록**: 6개 Tool이 정상 노출되는지 확인
2. **Resources 목록**: 3개 Resource가 정상 노출되는지 확인
3. **Tool 실행**: 각 Tool이 정상 작동하는지 확인
4. **Resource 읽기**: 각 Resource가 정상 제공되는지 확인

## 📝 사용 예시

### 예시 1: 기업 분석

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "analyze_enterprise_company",
      "arguments": {
        "company": "삼성전자"
      }
    }
  }'
```

### 예시 2: 자소서 평가

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "simulate_enterprise_reviewer",
      "arguments": {
        "company": "삼성전자",
        "essay": "작성된 자소서 내용...",
        "question": "자소서 문항"
      }
    }
  }'
```

## 🎯 품질 기준

- ✅ 각 Tool은 독립적이고 Stateless
- ✅ Tool 체인이 자연스럽게 이어짐
- ✅ MCP Inspector에서 tools/resources/prompts 정상 노출
- ✅ 같은 경험이라도 삼성과 SK 결과가 명확히 다름
- ✅ 보수적이고 논리적인 문체 기본값

## 🚂 Railway 배포

이 프로젝트는 Railway에 배포할 수 있도록 구성되어 있습니다.

### 배포 전 확인사항

- ✅ `package.json`에 `start` 스크립트가 정의되어 있음
- ✅ 서버가 `0.0.0.0`에 바인딩됨
- ✅ `PORT` 환경변수를 사용함
- ✅ Stateless 구조로 설계됨
- ✅ `/mcp` 엔드포인트 제공

### Railway 배포 절차 (CLI 없이)

1. **Railway 계정 생성 및 로그인**
   - [Railway](https://railway.app)에 접속하여 계정 생성

2. **새 프로젝트 생성**
   - Dashboard에서 "New Project" 클릭
   - "Deploy from GitHub repo" 선택 (또는 "Empty Project" 후 수동 배포)

3. **GitHub 저장소 연결** (선택사항)
   - GitHub 저장소를 연결하면 자동 배포 가능
   - 또는 "Empty Project" 선택 후 수동 배포

4. **수동 배포 (GitHub 미연결 시)**
   - "Empty Project" 선택
   - "Settings" → "Source"에서 로컬 폴더 업로드 또는 Git 저장소 URL 입력

5. **환경변수 설정** (선택사항)
   - Railway 대시보드에서 "Variables" 탭으로 이동
   - `PORT`는 Railway에서 자동 설정되므로 추가 불필요
   - 필요시 `MCP_MODE=http` 추가 (기본적으로 자동 감지됨)

6. **배포 확인**
   - 배포가 완료되면 Railway가 자동으로 URL 생성
   - 예: `https://your-app.up.railway.app`
   - Health check: `https://your-app.up.railway.app/health`
   - MCP endpoint: `https://your-app.up.railway.app/mcp`

### 배포 후 테스트 체크리스트

- [ ] Health check 엔드포인트 동작 확인
  ```bash
  curl https://your-app.up.railway.app/health
  ```
  예상 응답: `{"status":"ok","service":"enterprise-essay-expert-mcp"}`

- [ ] MCP initialize 요청 테스트
  ```bash
  curl -X POST https://your-app.up.railway.app/mcp \
    -H "Content-Type: application/json" \
    -d '{
      "jsonrpc": "2.0",
      "id": 1,
      "method": "initialize",
      "params": {}
    }'
  ```

- [ ] Tools 목록 확인
  ```bash
  curl -X POST https://your-app.up.railway.app/mcp \
    -H "Content-Type: application/json" \
    -d '{
      "jsonrpc": "2.0",
      "id": 2,
      "method": "tools/list",
      "params": {}
    }'
  ```

- [ ] Resources 목록 확인
  ```bash
  curl -X POST https://your-app.up.railway.app/mcp \
    -H "Content-Type: application/json" \
    -d '{
      "jsonrpc": "2.0",
      "id": 3,
      "method": "resources/list",
      "params": {}
    }'
  ```

- [ ] MCP Inspector에서 연결 테스트
  - MCP Inspector에서 HTTP URL 입력: `https://your-app.up.railway.app/mcp`
  - Tools, Resources, Prompts가 정상 노출되는지 확인

- [ ] Play MCP에서 연결 테스트
  - Play MCP에서 Remote MCP Server로 추가
  - URL: `https://your-app.up.railway.app/mcp`
  - 정상 동작 확인

### 배포 URL 예시

배포가 완료되면 다음과 같은 URL이 생성됩니다:

- **기본 URL**: `https://your-app.up.railway.app`
- **Health Check**: `https://your-app.up.railway.app/health`
- **MCP Endpoint**: `https://your-app.up.railway.app/mcp`

### 주의사항

- ⚠️ Railway는 무료 플랜에서도 HTTPS를 자동 제공합니다
- ⚠️ 포트 번호는 URL에 포함되지 않습니다 (Railway가 자동 처리)
- ⚠️ Stateless 구조이므로 여러 인스턴스로 스케일링 가능
- ⚠️ Streamable HTTP 응답이 끊기지 않도록 keep-alive 설정됨

## 📄 라이선스

MIT

## 🤝 기여

이슈 및 풀 리퀘스트를 환영합니다.

