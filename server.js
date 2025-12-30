import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import express from 'express';

// Tools import
import { analyzeEnterpriseCompany } from './tools/analyzeEnterpriseCompany.js';
import { deriveEnterpriseEvaluationLogic } from './tools/deriveEnterpriseEvaluationLogic.js';
import { mapExperienceToEnterprise } from './tools/mapExperienceToEnterprise.js';
import { designQuestionStrategy } from './tools/designQuestionStrategy.js';
import { generateEnterpriseEssay } from './tools/generateEnterpriseEssay.js';
import { simulateEnterpriseReviewer } from './tools/simulateEnterpriseReviewer.js';

// Resources import
import { getSamsungEvaluationLogic } from './resources/samsungEvaluationLogic.js';
import { getSKEvaluationLogic } from './resources/skEvaluationLogic.js';
import { getRejectionPatterns } from './resources/rejectionPatterns.js';

// 핸들러 저장소 (Server 클래스의 내부 구조에 의존하지 않기 위해)
const handlers = new Map();

// MCP Server 인스턴스 생성
const server = new Server(
  {
    name: 'enterprise-essay-expert-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Tools 등록
const toolsListHandler = async () => {
  return {
    tools: [
      {
        name: 'analyze_enterprise_company',
        description: '대기업 관점에서 기업의 인재상, 사업 방향, 리스크 성향을 분석합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            company: {
              type: 'string',
              description: '분석할 기업명 (삼성전자 또는 SK)',
              enum: ['삼성전자', 'SK'],
            },
          },
          required: ['company'],
        },
      },
      {
        name: 'derive_enterprise_evaluation_logic',
        description: '대기업 서류 평가 기준을 도출합니다 (must_show, acceptable, red_flags 포함).',
        inputSchema: {
          type: 'object',
          properties: {
            company: {
              type: 'string',
              description: '기업명 (삼성전자 또는 SK)',
              enum: ['삼성전자', 'SK'],
            },
            role: {
              type: 'string',
              description: '직무 (기본값: 신입 직무)',
              default: '신입 직무',
            },
          },
          required: ['company'],
        },
      },
      {
        name: 'map_experience_to_enterprise',
        description: '사용자 경험을 대기업 기준으로 선별합니다 (strong_fit, weak_fit, risky로 분류).',
        inputSchema: {
          type: 'object',
          properties: {
            company: {
              type: 'string',
              description: '기업명 (삼성전자 또는 SK)',
              enum: ['삼성전자', 'SK'],
            },
            experiences: {
              type: 'array',
              description: '사용자 경험 목록',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  achievements: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
            },
          },
          required: ['company', 'experiences'],
        },
      },
      {
        name: 'design_question_strategy',
        description: '자소서 문항의 숨은 의도를 분석하고 추천 구조를 제시합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            company: {
              type: 'string',
              description: '기업명 (삼성전자 또는 SK)',
              enum: ['삼성전자', 'SK'],
            },
            question: {
              type: 'string',
              description: '자소서 문항',
            },
          },
          required: ['company', 'question'],
        },
      },
      {
        name: 'generate_enterprise_essay',
        description: '대기업 통과 확률을 높이는 자소서 초안을 생성합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            company: {
              type: 'string',
              description: '기업명 (삼성전자 또는 SK)',
              enum: ['삼성전자', 'SK'],
            },
            question: {
              type: 'string',
              description: '자소서 문항',
            },
            selected_experiences: {
              type: 'array',
              description: '선별된 경험 목록',
              items: { type: 'object' },
            },
            strategy: {
              type: 'object',
              description: '전략 정보',
            },
          },
          required: ['company', 'question', 'selected_experiences'],
        },
      },
      {
        name: 'simulate_enterprise_reviewer',
        description: '서류 심사위원 시점에서 자소서를 평가합니다 (pass_probability, rejection_reason, improvement_advice 반환).',
        inputSchema: {
          type: 'object',
          properties: {
            company: {
              type: 'string',
              description: '기업명 (삼성전자 또는 SK)',
              enum: ['삼성전자', 'SK'],
            },
            essay: {
              type: 'string',
              description: '작성된 자소서 내용',
            },
            question: {
              type: 'string',
              description: '자소서 문항',
            },
          },
          required: ['company', 'essay', 'question'],
        },
      },
    ],
  };
};
handlers.set('tools/list', toolsListHandler);
server.setRequestHandler('tools/list', toolsListHandler);

const toolsCallHandler = async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;
    switch (name) {
      case 'analyze_enterprise_company':
        result = await analyzeEnterpriseCompany(args);
        break;
      case 'derive_enterprise_evaluation_logic':
        result = await deriveEnterpriseEvaluationLogic(args);
        break;
      case 'map_experience_to_enterprise':
        result = await mapExperienceToEnterprise(args);
        break;
      case 'design_question_strategy':
        result = await designQuestionStrategy(args);
        break;
      case 'generate_enterprise_essay':
        result = await generateEnterpriseEssay(args);
        break;
      case 'simulate_enterprise_reviewer':
        result = await simulateEnterpriseReviewer(args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
};
handlers.set('tools/call', toolsCallHandler);
server.setRequestHandler('tools/call', toolsCallHandler);

// Resources 등록
const resourcesListHandler = async () => {
  return {
    resources: [
      {
        uri: 'samsung://evaluation-logic',
        name: '삼성전자 평가 로직',
        description: '삼성전자 채용 평가 로직 및 기준',
        mimeType: 'application/json',
      },
      {
        uri: 'sk://evaluation-logic',
        name: 'SK 평가 로직',
        description: 'SK 채용 평가 로직 및 기준',
        mimeType: 'application/json',
      },
      {
        uri: 'enterprise://rejection-patterns',
        name: '탈락 패턴',
        description: '대기업 자소서 탈락 패턴 및 개선 방안',
        mimeType: 'application/json',
      },
    ],
  };
};
handlers.set('resources/list', resourcesListHandler);
server.setRequestHandler('resources/list', resourcesListHandler);

const resourcesReadHandler = async (request) => {
  const { uri } = request.params;

  try {
    let data;
    switch (uri) {
      case 'samsung://evaluation-logic':
        data = getSamsungEvaluationLogic();
        break;
      case 'sk://evaluation-logic':
        data = getSKEvaluationLogic();
        break;
      case 'enterprise://rejection-patterns':
        data = getRejectionPatterns();
        break;
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: `Error: ${error.message}`,
        },
      ],
    };
  }
};
handlers.set('resources/read', resourcesReadHandler);
server.setRequestHandler('resources/read', resourcesReadHandler);

// Express 앱 생성
const app = express();
app.use(express.json());

// CORS 설정
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Streamable HTTP transport 설정
// Express에서 /mcp를 직접 처리하지 않고, MCP SDK의 transport를 사용
// JSON-RPC 요청을 Server에 전달하는 미들웨어
app.post('/mcp', async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  try {
    // JSON-RPC 요청 처리
    const { jsonrpc, id, method, params } = req.body;

    if (jsonrpc !== '2.0') {
      return res.status(400).json({
        jsonrpc: '2.0',
        id,
        error: { code: -32600, message: 'Invalid Request' },
      });
    }

    // MCP 서버 핸들러 호출
    let result;
    if (method === 'initialize') {
      result = {
        protocolVersion: '2025-03-26',
        serverInfo: {
          name: 'enterprise-essay-expert-mcp',
          version: '0.1.0',
        },
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      };
    } else {
      // 등록된 핸들러 호출
      const handler = handlers.get(method);
      if (!handler) {
        return res.status(200).json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        });
      }

      const request = {
        method,
        params: params || {},
      };

      result = await handler(request);
    }

    res.status(200).json({
      jsonrpc: '2.0',
      id,
      result,
    });
  } catch (error) {
    res.status(200).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: error.message || 'Internal error',
      },
    });
  }
});

// Health check 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'enterprise-essay-expert-mcp' });
});

// 서버 시작
const PORT = process.env.PORT ?? 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ MCP Server running on port ${PORT}`);
  console.log(`✅ MCP endpoint: http://0.0.0.0:${PORT}/mcp`);
});
