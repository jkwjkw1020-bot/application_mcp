#!/usr/bin/env node

/**
 * 기업 분석 자소서 전문가 MCP 서버
 * Remote MCP Server - Streamable HTTP 방식
 * MCP Spec 2025-03-26 이상 준수
 */

import express from 'express';

// Tool 핸들러들
import { analyzeEnterpriseCompany } from './tools/analyzeEnterpriseCompany.js';
import { deriveEnterpriseEvaluationLogic } from './tools/deriveEnterpriseEvaluationLogic.js';
import { mapExperienceToEnterprise } from './tools/mapExperienceToEnterprise.js';
import { designQuestionStrategy } from './tools/designQuestionStrategy.js';
import { generateEnterpriseEssay } from './tools/generateEnterpriseEssay.js';
import { simulateEnterpriseReviewer } from './tools/simulateEnterpriseReviewer.js';

// Resource 핸들러들
import { getSamsungEvaluationLogic } from './resources/samsungEvaluationLogic.js';
import { getSKEvaluationLogic } from './resources/skEvaluationLogic.js';
import { getRejectionPatterns } from './resources/rejectionPatterns.js';

const app = express();

// CORS 설정 (MCP Inspector 및 Play MCP 호환)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Tools 목록 정의
const toolsList = [
  {
    name: 'analyze_enterprise_company',
    description: '대기업 관점에서 기업의 인재상, 사업 방향, 리스크 성향을 분석합니다. 삼성과 SK의 차이를 명확히 반영합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        company: {
          type: 'string',
          enum: ['삼성전자', 'SK'],
          description: '분석할 기업명'
        }
      },
      required: ['company']
    }
  },
  {
    name: 'derive_enterprise_evaluation_logic',
    description: '대기업 서류 평가 기준을 도출합니다. must_show, acceptable, red_flags를 포함합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        company: {
          type: 'string',
          enum: ['삼성전자', 'SK'],
          description: '평가 기준을 도출할 기업명'
        },
        role: {
          type: 'string',
          description: '직무 (기본값: 신입 직무)'
        }
      },
      required: ['company']
    }
  },
  {
    name: 'map_experience_to_enterprise',
    description: '사용자 경험을 대기업 기준으로 선별합니다. strong_fit, weak_fit, risky로 분류합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        company: {
          type: 'string',
          enum: ['삼성전자', 'SK'],
          description: '대상 기업명'
        },
        experiences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              period: { type: 'string' },
              achievements: { type: 'array', items: { type: 'string' } }
            }
          },
          description: '사용자의 경험 목록'
        }
      },
      required: ['company', 'experiences']
    }
  },
  {
    name: 'design_question_strategy',
    description: '자소서 문항의 숨은 의도를 분석하고 추천 구조(STAR 등)와 강조 포인트를 제시합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        company: {
          type: 'string',
          enum: ['삼성전자', 'SK'],
          description: '대상 기업명'
        },
        question: {
          type: 'string',
          description: '자소서 문항'
        }
      },
      required: ['company', 'question']
    }
  },
  {
    name: 'generate_enterprise_essay',
    description: '대기업 통과 확률을 높이는 자소서 초안을 생성합니다. 보수적이고 논리적인 문체를 기본값으로 사용합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        company: {
          type: 'string',
          enum: ['삼성전자', 'SK'],
          description: '대상 기업명'
        },
        question: {
          type: 'string',
          description: '자소서 문항'
        },
        selected_experiences: {
          type: 'array',
          items: { type: 'object' },
          description: '선별된 경험 목록'
        },
        strategy: {
          type: 'object',
          description: '전략 정보 (design_question_strategy 결과)'
        }
      },
      required: ['company', 'question', 'selected_experiences']
    }
  },
  {
    name: 'simulate_enterprise_reviewer',
    description: '삼성/SK 서류 심사위원 시점에서 평가합니다. pass_probability, rejection_reason, improvement_advice를 반환합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        company: {
          type: 'string',
          enum: ['삼성전자', 'SK'],
          description: '대상 기업명'
        },
        essay: {
          type: 'string',
          description: '작성된 자소서'
        },
        question: {
          type: 'string',
          description: '자소서 문항'
        }
      },
      required: ['company', 'essay', 'question']
    }
  }
];

// MCP Method Handlers - method literal 기반 등록
const mcpHandlers = {
  // initialize 메서드 핸들러
  'initialize': async (params) => {
    return {
      protocolVersion: '2025-03-26',
      serverInfo: {
        name: 'enterprise-essay-expert-mcp',
        version: '1.0.0'
      },
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      }
    };
  },

  // tools/list 메서드 핸들러
  'tools/list': async (params) => {
    return {
      tools: toolsList
    };
  },

  // tools/call 메서드 핸들러
  'tools/call': async (params) => {
    const { name, arguments: args } = params || {};

    if (!name) {
      throw new Error('Tool name is required');
    }

    try {
      let toolResult;
      switch (name) {
        case 'analyze_enterprise_company':
          toolResult = await analyzeEnterpriseCompany(args);
          break;
        case 'derive_enterprise_evaluation_logic':
          toolResult = await deriveEnterpriseEvaluationLogic(args);
          break;
        case 'map_experience_to_enterprise':
          toolResult = await mapExperienceToEnterprise(args);
          break;
        case 'design_question_strategy':
          toolResult = await designQuestionStrategy(args);
          break;
        case 'generate_enterprise_essay':
          toolResult = await generateEnterpriseEssay(args);
          break;
        case 'simulate_enterprise_reviewer':
          toolResult = await simulateEnterpriseReviewer(args);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(toolResult, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: error.message }, null, 2)
          }
        ],
        isError: true
      };
    }
  },

  // resources/list 메서드 핸들러
  'resources/list': async (params) => {
    return {
      resources: [
        {
          uri: 'resource://samsung-evaluation-logic',
          name: '삼성 채용 평가 로직',
          description: '삼성전자의 서류 평가 기준과 평가 로직',
          mimeType: 'application/json'
        },
        {
          uri: 'resource://sk-evaluation-logic',
          name: 'SK 채용 평가 로직',
          description: 'SK의 서류 평가 기준과 평가 로직',
          mimeType: 'application/json'
        },
        {
          uri: 'resource://rejection-patterns',
          name: '대기업 자소서 탈락 패턴',
          description: '대기업 자소서에서 즉시 탈락되는 주요 패턴들',
          mimeType: 'application/json'
        }
      ]
    };
  },

  // resources/read 메서드 핸들러 (선택적)
  'resources/read': async (params) => {
    const { uri } = params || {};
    if (!uri) {
      throw new Error('Resource URI is required');
    }

    try {
      let content;
      switch (uri) {
        case 'resource://samsung-evaluation-logic':
          content = getSamsungEvaluationLogic();
          break;
        case 'resource://sk-evaluation-logic':
          content = getSKEvaluationLogic();
          break;
        case 'resource://rejection-patterns':
          content = getRejectionPatterns();
          break;
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(content, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: `Error: ${error.message}`
          }
        ]
      };
    }
  },

  // prompts/list 메서드 핸들러
  'prompts/list': async (params) => {
    return {
      prompts: [
        {
          name: '자소서_작성_가이드',
          description: '대기업 자소서 작성의 전체적인 가이드를 제공합니다.',
          arguments: [
            {
              name: 'company',
              description: '대상 기업명 (삼성전자 또는 SK)',
              required: true
            },
            {
              name: 'role',
              description: '지원 직무',
              required: false
            }
          ]
        }
      ]
    };
  }
};


// GET /mcp - 서버 메타데이터 반환 (Play MCP 정보 조회용)
app.get('/mcp', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  
  res.json({
    protocolVersion: '2025-03-26',
    name: 'enterprise-essay-expert-mcp',
    version: '1.0.0',
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    },
    serverInfo: {
      name: 'enterprise-essay-expert-mcp',
      version: '1.0.0'
    }
  });
});

// HTTP 엔드포인트 (Streamable HTTP) - JSON-RPC 2.0
app.post('/mcp', async (req, res) => {
  // Streamable HTTP를 위한 keep-alive 설정
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=60');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  
  try {
    // JSON-RPC 2.0 요청 처리
    const { method, params, id } = req.body;

    if (!method || id === undefined) {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32600, message: 'Invalid Request' }
      });
    }

    // method literal 기반 handler 호출
    const handler = mcpHandlers[method];
    
    if (!handler) {
      return res.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` }
      });
    }

    const result = await handler(params);
    
    res.json({
      jsonrpc: '2.0',
      id,
      result
    });
  } catch (error) {
    res.json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: error.message
      }
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'enterprise-essay-expert-mcp' });
});

// 서버 시작 - Fly.io 환경에서는 무조건 HTTP 서버 실행
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 MCP Server running on http://${HOST}:${PORT}`);
  console.log(`✅ Health check: http://${HOST}:${PORT}/health`);
  console.log(`📡 MCP endpoint: http://${HOST}:${PORT}/mcp`);
  console.log(`🌐 Fly.io URL: https://enterprise-essay-mcp.fly.dev/mcp`);
});

