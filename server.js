#!/usr/bin/env node

/**
 * 기업 분석 자소서 전문가 MCP 서버
 * Remote MCP Server - Streamable HTTP 방식
 * MCP Spec 2025-03-26 이상 준수
 */

import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

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

// MCP 서버 인스턴스
const server = new Server(
  {
    name: 'enterprise-essay-expert-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Tools 등록
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
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
  ]
}));

// Tool 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'analyze_enterprise_company':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await analyzeEnterpriseCompany(args), null, 2)
            }
          ]
        };

      case 'derive_enterprise_evaluation_logic':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await deriveEnterpriseEvaluationLogic(args), null, 2)
            }
          ]
        };

      case 'map_experience_to_enterprise':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await mapExperienceToEnterprise(args), null, 2)
            }
          ]
        };

      case 'design_question_strategy':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await designQuestionStrategy(args), null, 2)
            }
          ]
        };

      case 'generate_enterprise_essay':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await generateEnterpriseEssay(args), null, 2)
            }
          ]
        };

      case 'simulate_enterprise_reviewer':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await simulateEnterpriseReviewer(args), null, 2)
            }
          ]
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
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
});

// Resources 등록
server.setRequestHandler(
  {
    method: 'resources/list'
  },
  async () => ({
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
  })
);

// Resource 읽기 핸들러
server.setRequestHandler(
  {
    method: 'resources/read'
  },
  async (request) => {
    const { uri } = request.params;

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
  }
);

// HTTP 엔드포인트 (Streamable HTTP) - JSON-RPC 2.0
app.post('/mcp', async (req, res) => {
  // Streamable HTTP를 위한 keep-alive 설정
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=60');
  res.setHeader('Content-Type', 'application/json');
  
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

    let result;
    
    // MCP 프로토콜 메서드 라우팅
    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: '2025-03-26',
          capabilities: {
            tools: {},
            resources: {}
          },
          serverInfo: {
            name: 'enterprise-essay-expert-mcp',
            version: '1.0.0'
          }
        };
        break;
        
      case 'tools/list':
        // Tools 목록 반환
        const toolsListHandler = server._requestHandlers?.get('tools/list');
        if (toolsListHandler) {
          result = await toolsListHandler({ params: {} });
        } else {
          // Fallback: 직접 반환
          result = {
            tools: [
              {
                name: 'analyze_enterprise_company',
                description: '대기업 관점에서 기업의 인재상, 사업 방향, 리스크 성향을 분석합니다.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    company: { type: 'string', enum: ['삼성전자', 'SK'] }
                  },
                  required: ['company']
                }
              },
              {
                name: 'derive_enterprise_evaluation_logic',
                description: '대기업 서류 평가 기준을 도출합니다.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    company: { type: 'string', enum: ['삼성전자', 'SK'] }
                  },
                  required: ['company']
                }
              },
              {
                name: 'map_experience_to_enterprise',
                description: '사용자 경험을 대기업 기준으로 선별합니다.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    company: { type: 'string', enum: ['삼성전자', 'SK'] },
                    experiences: { type: 'array' }
                  },
                  required: ['company', 'experiences']
                }
              },
              {
                name: 'design_question_strategy',
                description: '자소서 문항의 숨은 의도를 분석하고 추천 구조를 제시합니다.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    company: { type: 'string', enum: ['삼성전자', 'SK'] },
                    question: { type: 'string' }
                  },
                  required: ['company', 'question']
                }
              },
              {
                name: 'generate_enterprise_essay',
                description: '대기업 통과 확률을 높이는 자소서 초안을 생성합니다.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    company: { type: 'string', enum: ['삼성전자', 'SK'] },
                    question: { type: 'string' },
                    selected_experiences: { type: 'array' }
                  },
                  required: ['company', 'question', 'selected_experiences']
                }
              },
              {
                name: 'simulate_enterprise_reviewer',
                description: '삼성/SK 서류 심사위원 시점에서 평가합니다.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    company: { type: 'string', enum: ['삼성전자', 'SK'] },
                    essay: { type: 'string' },
                    question: { type: 'string' }
                  },
                  required: ['company', 'essay', 'question']
                }
              }
            ]
          };
        }
        break;
        
      case 'tools/call':
        // Tool 실행
        const { name, arguments: args } = params || {};
        if (!name) {
          throw new Error('Tool name is required');
        }
        
        const toolCallHandler = server._requestHandlers?.get('tools/call');
        if (toolCallHandler) {
          result = await toolCallHandler({ params: { name, arguments: args } });
        } else {
          // Fallback: 직접 호출
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
          result = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(toolResult, null, 2)
              }
            ]
          };
        }
        break;
        
      case 'resources/list':
        // Resources 목록 반환
        const resourcesListHandler = server._requestHandlers?.get('resources/list');
        if (resourcesListHandler) {
          result = await resourcesListHandler({ params: {} });
        } else {
          // Fallback: 직접 반환
          result = {
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
        }
        break;
        
      case 'resources/read':
        // Resource 읽기
        const { uri } = params || {};
        if (!uri) {
          throw new Error('Resource URI is required');
        }
        
        const resourcesReadHandler = server._requestHandlers?.get('resources/read');
        if (resourcesReadHandler) {
          result = await resourcesReadHandler({ params: { uri } });
        } else {
          // Fallback: 직접 호출
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
          result = {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(content, null, 2)
              }
            ]
          };
        }
        break;
        
      default:
        return res.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        });
    }
    
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

// 서버 시작
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Railway 배포를 위해 모든 인터페이스에 바인딩

// Railway 환경 감지: PORT 환경변수가 있으면 HTTP 모드로 실행
// 로컬 개발 시 MCP_MODE 환경변수로 제어 가능
const isRailway = !!process.env.PORT;
const isHttpMode = process.env.MCP_MODE === 'http' || isRailway;

if (isHttpMode) {
  // HTTP 모드 (Railway 배포 및 Remote MCP Server)
  app.listen(PORT, HOST, () => {
    console.log(`🚀 MCP Server running on http://${HOST}:${PORT}`);
    console.log(`✅ Health check: http://${HOST}:${PORT}/health`);
    console.log(`📡 MCP endpoint: http://${HOST}:${PORT}/mcp`);
    console.log(`🌐 Railway URL: https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'your-app.up.railway.app'}/mcp`);
  });
} else {
  // Stdio 모드 (로컬 개발, MCP Inspector 호환)
  const transport = new StdioServerTransport();
  server.connect(transport);
  console.error('MCP Server running in stdio mode');
}

