/**
 * 삼성/SK 서류 심사위원 시점에서 평가
 * pass_probability, rejection_reason, improvement_advice 반환
 * 가장 중요한 Tool
 */

export async function simulateEnterpriseReviewer({ company, essay, question }) {
  const evaluation = {
    company,
    question,
    evaluation: {
      pass_probability: 0,
      pass_probability_label: '',
      rejection_reason: [],
      improvement_advice: [],
      strengths: [],
      weaknesses: [],
      detailed_analysis: {}
    }
  };

  // 평가 수행
  const scores = evaluateEssay(essay, question, company);
  evaluation.evaluation.detailed_analysis = scores;

  // 통과 확률 계산
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score.score, 0);
  const maxScore = Object.values(scores).length * 100;
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  evaluation.evaluation.pass_probability = percentage;
  evaluation.evaluation.pass_probability_label = getProbabilityLabel(percentage);

  // 강점과 약점 분석
  Object.entries(scores).forEach(([category, data]) => {
    if (data.score >= 70) {
      evaluation.evaluation.strengths.push({
        category,
        reason: data.reason
      });
    } else if (data.score < 50) {
      evaluation.evaluation.weaknesses.push({
        category,
        reason: data.reason,
        impact: data.impact || '중요'
      });
    }
  });

  // 탈락 사유 도출
  if (percentage < 50) {
    evaluation.evaluation.rejection_reason = getRejectionReasons(scores, company);
  } else if (percentage < 70) {
    evaluation.evaluation.rejection_reason = getRejectionReasons(scores, company, 'conditional');
  }

  // 개선 조언 생성
  evaluation.evaluation.improvement_advice = generateImprovementAdvice(scores, company, percentage);

  return evaluation;
}

function evaluateEssay(essay, question, company) {
  const scores = {};

  // 1. 구조성 평가
  scores.structure = evaluateStructure(essay, question);

  // 2. 내용성 평가
  scores.content = evaluateContent(essay, company);

  // 3. 기업 적합성 평가
  scores.company_fit = evaluateCompanyFit(essay, company);

  // 4. 구체성 평가
  scores.specificity = evaluateSpecificity(essay, company);

  // 5. 논리성 평가
  scores.logic = evaluateLogic(essay);

  return scores;
}

function evaluateStructure(essay, question) {
  let score = 50;
  const reasons = [];

  // STAR 구조 체크
  const hasSituation = essay.includes('상황') || essay.includes('배경') || essay.match(/당시|그때/);
  const hasTask = essay.includes('과제') || essay.includes('목표') || essay.match(/해야|필요/);
  const hasAction = essay.includes('행동') || essay.includes('접근') || essay.match(/했습니다|했습니다|시도/);
  const hasResult = essay.includes('결과') || essay.includes('성과') || essay.match(/달성|개선|향상/);

  if (hasSituation) {
    score += 10;
    reasons.push('상황 설명 포함');
  }
  if (hasTask) {
    score += 10;
    reasons.push('과제/목표 명시');
  }
  if (hasAction) {
    score += 15;
    reasons.push('행동 과정 서술');
  }
  if (hasResult) {
    score += 15;
    reasons.push('결과 제시');
  }

  if (!hasSituation || !hasTask || !hasAction || !hasResult) {
    reasons.push('STAR 구조가 완전하지 않음');
  }

  return {
    score: Math.min(100, score),
    reason: reasons.join(', '),
    impact: score < 60 ? '높음' : '중간'
  };
}

function evaluateContent(essay, company) {
  let score = 40;
  const reasons = [];

  // 기업별 핵심 요소 체크
  if (company === '삼성전자') {
    if (essay.includes('기술') || essay.includes('개발') || essay.includes('시스템')) {
      score += 20;
      reasons.push('기술적 역량 언급');
    } else {
      reasons.push('기술적 역량이 드러나지 않음');
    }

    if (essay.includes('문제') && essay.includes('해결')) {
      score += 15;
      reasons.push('문제 해결 능력 증명');
    }

    if (/\d+%/.test(essay) || essay.match(/\d+[개명회]/)) {
      score += 15;
      reasons.push('정량적 지표 포함');
    } else {
      reasons.push('정량적 결과 부족');
    }

    if (essay.includes('학습') || essay.includes('성장')) {
      score += 10;
      reasons.push('학습 능력 언급');
    }
  } else {
    if (essay.includes('협업') || essay.includes('팀') || essay.includes('함께')) {
      score += 25;
      reasons.push('협업 능력 강조');
    } else {
      reasons.push('협업 경험이 드러나지 않음');
    }

    if (essay.includes('혁신') || essay.includes('개선') || essay.includes('새로운')) {
      score += 20;
      reasons.push('혁신적 사고');
    }

    if (essay.includes('상생') || essay.includes('함께 성장')) {
      score += 15;
      reasons.push('상생 가치 반영');
    } else {
      reasons.push('상생 가치 부재');
    }
  }

  return {
    score: Math.min(100, score),
    reason: reasons.join(', '),
    impact: score < 50 ? '높음' : '중간'
  };
}

function evaluateCompanyFit(essay, company) {
  let score = 50;
  const reasons = [];

  // 기업명 언급
  if (essay.includes(company)) {
    score += 15;
    reasons.push('기업명 명시');
  }

  // 기업별 핵심 가치 체크
  if (company === '삼성전자') {
    const samsungValues = ['기술', '혁신', '글로벌', '장기', '도전'];
    const matchedValues = samsungValues.filter(val => essay.includes(val));
    score += matchedValues.length * 5;
    reasons.push(`${matchedValues.length}개 핵심 가치 반영`);
  } else {
    const skValues = ['상생', '협업', '혁신', '변화', '도전'];
    const matchedValues = skValues.filter(val => essay.includes(val));
    score += matchedValues.length * 5;
    reasons.push(`${matchedValues.length}개 핵심 가치 반영`);
  }

  // 일반적 서술 체크
  const genericPhrases = ['열심히', '최선을', '노력', '좋은'];
  const genericCount = genericPhrases.filter(phrase => essay.includes(phrase)).length;
  if (genericCount > 3) {
    score -= 10;
    reasons.push('일반적 표현 과다');
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reason: reasons.join(', '),
    impact: score < 60 ? '높음' : '낮음'
  };
}

function evaluateSpecificity(essay, company) {
  let score = 50;
  const reasons = [];

  // 구체적 수치
  if (/\d+%/.test(essay) || /\d+[개명회]/.test(essay)) {
    score += 20;
    reasons.push('정량적 지표 포함');
  } else {
    reasons.push('정량적 지표 부재');
  }

  // 구체적 행동
  const actionVerbs = ['개발', '구현', '설계', '분석', '개선', '최적화', '협력', '조율'];
  const actionCount = actionVerbs.filter(verb => essay.includes(verb)).length;
  if (actionCount >= 3) {
    score += 15;
    reasons.push('구체적 행동 서술');
  } else {
    reasons.push('구체적 행동 부족');
  }

  // 추상적 표현 체크
  const abstractPhrases = ['많이', '잘', '좋은', '최선'];
  const abstractCount = abstractPhrases.filter(phrase => essay.includes(phrase)).length;
  if (abstractCount > 2) {
    score -= 15;
    reasons.push('추상적 표현 과다');
  }

  // 분량 체크
  const wordCount = essay.split(/\s+/).length;
  if (wordCount >= 400 && wordCount <= 800) {
    score += 15;
    reasons.push('적절한 분량');
  } else if (wordCount < 300) {
    score -= 10;
    reasons.push('분량 부족');
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reason: reasons.join(', '),
    impact: score < 50 ? '높음' : '중간'
  };
}

function evaluateLogic(essay) {
  let score = 60;
  const reasons = [];

  // 논리적 연결어 체크
  const logicalConnectors = ['따라서', '그래서', '때문에', '또한', '뿐만 아니라', '또한'];
  const connectorCount = logicalConnectors.filter(conn => essay.includes(conn)).length;
  if (connectorCount >= 2) {
    score += 15;
    reasons.push('논리적 연결어 사용');
  }

  // 인과관계 체크
  if ((essay.includes('때문에') || essay.includes('따라서')) && 
      (essay.includes('결과') || essay.includes('성과'))) {
    score += 15;
    reasons.push('인과관계 명확');
  }

  // 일관성 체크 (반복되는 키워드)
  const keywords = essay.match(/\w+/g) || [];
  const keywordFreq = {};
  keywords.forEach(kw => {
    keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
  });
  const repeatedKeywords = Object.entries(keywordFreq)
    .filter(([_, count]) => count >= 3)
    .length;
  
  if (repeatedKeywords > 5) {
    score -= 10;
    reasons.push('키워드 반복 과다');
  }

  // 문장 구조 체크
  const sentences = essay.split(/[.!?]/).filter(s => s.trim().length > 0);
  const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
  if (avgLength >= 15 && avgLength <= 25) {
    score += 10;
    reasons.push('적절한 문장 길이');
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reason: reasons.join(', '),
    impact: score < 60 ? '중간' : '낮음'
  };
}

function getProbabilityLabel(percentage) {
  if (percentage >= 80) return '매우 높음 (통과 가능성 높음)';
  if (percentage >= 70) return '높음 (통과 가능성 있음)';
  if (percentage >= 60) return '보통 (보완 필요)';
  if (percentage >= 50) return '낮음 (대폭 보완 필요)';
  return '매우 낮음 (재작성 권장)';
}

function getRejectionReasons(scores, company, type = 'immediate') {
  const reasons = [];

  Object.entries(scores).forEach(([category, data]) => {
    if (type === 'immediate' && data.score < 40) {
      reasons.push(`${category}: ${data.reason} (점수: ${data.score})`);
    } else if (type === 'conditional' && data.score < 50) {
      reasons.push(`${category}: ${data.reason} (점수: ${data.score})`);
    }
  });

  // 기업별 특화 탈락 사유
  if (company === '삼성전자') {
    if (scores.content.score < 50) {
      reasons.push('기술적 역량이 충분히 드러나지 않음');
    }
    if (scores.specificity.score < 50) {
      reasons.push('정량적 결과와 구체적 성과 부족');
    }
  } else {
    if (scores.content.score < 50) {
      reasons.push('협업 능력과 상생 가치가 드러나지 않음');
    }
    if (scores.company_fit.score < 50) {
      reasons.push('SK의 핵심 가치와의 연결점 부족');
    }
  }

  return reasons.length > 0 ? reasons : ['종합 평가 점수가 기준 미달'];
}

function generateImprovementAdvice(scores, company, overallScore) {
  const advice = [];

  // 낮은 점수 항목에 대한 구체적 조언
  Object.entries(scores).forEach(([category, data]) => {
    if (data.score < 60) {
      if (category === 'structure') {
        advice.push('STAR 구조를 명확히 구분하여 서술하세요. 상황-과제-행동-결과 각 단계를 명시적으로 표시하는 것을 권장합니다.');
      } else if (category === 'content') {
        if (company === '삼성전자') {
          advice.push('기술적 역량과 문제 해결 과정을 더 구체적으로 서술하세요. 사용한 기술, 해결한 난제, 개선한 성능을 명확히 제시하세요.');
        } else {
          advice.push('협업 과정과 상생 가치를 더 강조하세요. 팀원과의 소통, 역할 분담, 공동 성과를 구체적으로 서술하세요.');
        }
      } else if (category === 'company_fit') {
        advice.push(`${company}의 핵심 가치와 사업 방향을 더 명확히 연결하세요. 기업명을 언급하고 구체적 연결점을 제시하세요.`);
      } else if (category === 'specificity') {
        advice.push('정량적 지표를 추가하세요 (예: 성능 30% 개선, 처리 시간 50% 단축). 구체적 행동과 결과를 명확히 구분하여 서술하세요.');
      } else if (category === 'logic') {
        advice.push('논리적 흐름을 강화하세요. 인과관계를 명확히 하고, 논리적 연결어를 활용하여 문장 간 연결성을 높이세요.');
      }
    }
  });

  // 종합 조언
  if (overallScore < 50) {
    advice.push('전반적으로 재작성을 권장합니다. 핵심 경험을 재선별하고, ' + company + '의 평가 기준에 맞춰 전면 수정하세요.');
  } else if (overallScore < 70) {
    advice.push('현재 구조는 유지하되, 내용을 더 구체화하고 ' + company + '가 중시하는 요소를 강조하세요.');
  } else {
    advice.push('현재 상태가 양호합니다. 세부 표현만 다듬으면 통과 가능성이 높습니다.');
  }

  return advice;
}

