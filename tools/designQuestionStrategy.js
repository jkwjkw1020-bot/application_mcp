/**
 * 자소서 문항의 숨은 의도를 분석
 * 추천 구조(STAR 등)와 강조 포인트 제시
 */

export async function designQuestionStrategy({ company, question }) {
  const strategy = {
    company,
    question,
    hidden_intent: analyzeIntent(question, company),
    recommended_structure: getRecommendedStructure(question, company),
    emphasis_points: getEmphasisPoints(question, company),
    writing_tips: getWritingTips(company)
  };

  return strategy;
}

function analyzeIntent(question, company) {
  const intent = {
    primary_goal: '',
    secondary_goals: [],
    evaluation_focus: []
  };

  const lowerQuestion = question.toLowerCase();

  // 공통 의도 분석
  if (lowerQuestion.includes('성장') || lowerQuestion.includes('발전')) {
    intent.primary_goal = '성장 가능성과 학습 능력 평가';
    intent.evaluation_focus.push('자기주도 학습', '성장 과정', '개선 의지');
  } else if (lowerQuestion.includes('도전') || lowerQuestion.includes('어려움')) {
    intent.primary_goal = '문제 해결 능력과 극복 의지 평가';
    intent.evaluation_focus.push('문제 인식', '해결 과정', '결과와 학습');
  } else if (lowerQuestion.includes('협업') || lowerQuestion.includes('팀')) {
    intent.primary_goal = '협업 능력과 소통 능력 평가';
    intent.evaluation_focus.push('팀워크', '갈등 해결', '공동 성과');
  } else if (lowerQuestion.includes('리더') || lowerQuestion.includes('주도')) {
    intent.primary_goal = '리더십과 주도성 평가';
    intent.evaluation_focus.push('영향력', '의사결정', '팀 성과');
  } else if (lowerQuestion.includes('입사') || lowerQuestion.includes('지원')) {
    intent.primary_goal = '기업 이해도와 적합성 평가';
    intent.evaluation_focus.push('기업 연구', '연결점', '기여 의지');
  } else {
    intent.primary_goal = '종합적 역량과 가치관 평가';
    intent.evaluation_focus.push('핵심 역량', '가치관', '기여 가능성');
  }

  // 기업별 차별화
  if (company === '삼성전자') {
    intent.secondary_goals.push('기술적 깊이 확인', '장기적 관점 평가', '실력주의 문화 적합성');
    if (!intent.evaluation_focus.includes('기술 역량')) {
      intent.evaluation_focus.push('기술 역량');
    }
  } else if (company === 'SK') {
    intent.secondary_goals.push('협업 능력 확인', '변화 적응력 평가', '상생 가치 이해도');
    if (!intent.evaluation_focus.includes('협업 능력')) {
      intent.evaluation_focus.push('협업 능력');
    }
  }

  return intent;
}

function getRecommendedStructure(question, company) {
  const structure = {
    framework: 'STAR',
    components: {
      Situation: {
        description: '상황 설명',
        tips: '구체적 배경과 맥락 제시',
        length: '15-20%'
      },
      Task: {
        description: '과제/목표',
        tips: '명확한 목표와 제약 조건',
        length: '10-15%'
      },
      Action: {
        description: '행동/접근',
        tips: company === '삼성전자' 
          ? '기술적 접근과 문제 해결 과정을 상세히'
          : '협업 과정과 혁신적 접근을 강조',
        length: '40-50%'
      },
      Result: {
        description: '결과/성과',
        tips: '정량적 지표와 정성적 성과 모두 제시',
        length: '20-25%'
      }
    },
    additional_sections: []
  };

  // 기업별 추가 섹션
  if (company === '삼성전자') {
    structure.additional_sections.push({
      name: 'Learning',
      description: '학습과 성장',
      tips: '경험을 통해 얻은 학습과 향후 적용 방안'
    });
  } else if (company === 'SK') {
    structure.additional_sections.push({
      name: 'Collaboration',
      description: '협업과 상생',
      tips: '함께 성장한 경험과 상생 가치'
    });
  }

  return structure;
}

function getEmphasisPoints(question, company) {
  const points = [];

  if (company === '삼성전자') {
    points.push({
      point: '기술적 깊이',
      description: '기술적 역량과 전문성을 구체적으로 서술',
      example: '사용한 기술, 해결한 기술적 난제, 성능 개선 수치'
    });
    points.push({
      point: '문제 해결 과정',
      description: '논리적이고 체계적인 문제 해결 접근',
      example: '문제 분석 → 원인 파악 → 해결 방안 도출 → 실행 → 검증'
    });
    points.push({
      point: '정량적 결과',
      description: '측정 가능한 성과 제시',
      example: '성능 30% 개선, 처리 시간 50% 단축, 오류율 0.1%로 감소'
    });
    points.push({
      point: '장기적 관점',
      description: '삼성과의 연결점과 장기적 기여 의지',
      example: '삼성의 기술 방향과의 연계, 장기적 성장 계획'
    });
  } else if (company === 'SK') {
    points.push({
      point: '협업 과정',
      description: '팀워크와 협업을 통한 성과 창출',
      example: '팀원과의 소통, 역할 분담, 갈등 해결, 공동 목표 달성'
    });
    points.push({
      point: '변화 적응',
      description: '변화하는 환경에 대한 적응과 혁신',
      example: '새로운 환경 적응, 변화를 통한 성장, 유연한 사고'
    });
    points.push({
      point: '혁신적 접근',
      description: '기존 방식을 개선하거나 새로운 방법 시도',
      example: '프로세스 개선, 창의적 해결책, 새로운 시도와 실험'
    });
    points.push({
      point: '상생 가치',
      description: '함께 성장하는 가치와 경험',
      example: '멘토링, 지식 공유, 상호 성장, 공동 이익 창출'
    });
  }

  return points;
}

function getWritingTips(company) {
  if (company === '삼성전자') {
    return {
      tone: '보수적이고 논리적',
      style: [
        '명확하고 구체적인 서술',
        '감정보다 사실과 데이터 중심',
        '논리적 흐름 유지',
        '기술적 용어 적절히 사용',
        '과장 없이 객관적 서술'
      ],
      avoid: [
        '과도한 감정 표현',
        '모호한 표현',
        '비현실적 수치',
        '일반적 서술'
      ]
    };
  } else {
    return {
      tone: '따뜻하고 협력적',
      style: [
        '협업과 상생 가치 강조',
        '변화와 혁신에 대한 긍정적 태도',
        '함께 성장하는 경험 서술',
        '균형잡힌 톤 (전문성 + 인간성)'
      ],
      avoid: [
        '과도한 개인주의',
        '경직된 사고 표현',
        '협업 부정적 언급',
        '일방적 성과 강조'
      ]
    };
  }
}

