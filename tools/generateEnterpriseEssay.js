/**
 * 대기업 통과 확률을 높이는 자소서 초안 생성
 * 보수적이고 논리적인 문체 기본값
 */

export async function generateEnterpriseEssay({ company, question, selected_experiences, strategy }) {
  if (!selected_experiences || selected_experiences.length === 0) {
    throw new Error('선별된 경험이 필요합니다.');
  }

  // 가장 적합한 경험 선택
  const bestExperience = selected_experiences
    .filter(exp => exp.classification === 'strong_fit')
    .sort((a, b) => b.fit_score - a.fit_score)[0] 
    || selected_experiences[0];

  const essay = generateEssayContent(company, question, bestExperience, strategy);

  return {
    company,
    question,
    essay: {
      content: essay,
      word_count: essay.split(/\s+/).length,
      structure_used: strategy?.recommended_structure?.framework || 'STAR',
      key_highlights: extractHighlights(essay, company)
    },
    recommendations: {
      strengths: getEssayStrengths(essay, company),
      improvements: getEssayImprovements(essay, company, strategy)
    }
  };
}

function generateEssayContent(company, question, experience, strategy) {
  const exp = experience.experience || experience;
  const { title, description, achievements = [] } = exp;

  let essay = '';

  // Situation
  essay += `[상황]\n`;
  essay += `${title} 경험을 통해 ${company === '삼성전자' ? '기술적 역량과 문제 해결 능력을' : '협업 능력과 혁신적 사고를'} 발휘할 기회를 얻었습니다. `;
  essay += `${description || '구체적인 프로젝트 환경에서'} `;
  essay += `당시 주요 과제는 `;
  
  // Task
  essay += `[과제]\n`;
  if (company === '삼성전자') {
    essay += `기술적 난제를 해결하고 성능을 개선하는 것이었습니다. `;
  } else {
    essay += `팀과 협력하여 혁신적인 해결책을 도출하는 것이었습니다. `;
  }

  // Action
  essay += `[행동]\n`;
  if (company === '삼성전자') {
    essay += `문제를 체계적으로 분석하고, 기술적 원인을 파악한 후 `;
    essay += `최적화된 해결 방안을 도출했습니다. `;
    essay += `구체적으로는 `;
  } else {
    essay += `팀원들과 활발히 소통하며 `;
    essay += `각자의 강점을 살려 역할을 분담하고, `;
    essay += `혁신적인 접근 방식을 함께 모색했습니다. `;
  }

  if (achievements.length > 0) {
    achievements.forEach((ach, idx) => {
      if (idx < 2) { // 최대 2개만 포함
        essay += `${ach} `;
      }
    });
  }

  // Result
  essay += `[결과]\n`;
  if (company === '삼성전자') {
    essay += `이를 통해 구체적인 성과를 달성할 수 있었으며, `;
    essay += `기술적 역량과 문제 해결 능력을 한 단계 발전시킬 수 있었습니다. `;
    essay += `이 경험을 통해 ${company}에서 요구하는 `;
    essay += `기술적 깊이와 장기적 관점을 갖춘 인재로 성장할 수 있음을 확인했습니다.`;
  } else {
    essay += `팀의 공동 노력을 통해 목표를 달성했으며, `;
    essay += `협업 능력과 혁신적 사고를 발전시킬 수 있었습니다. `;
    essay += `이 경험을 통해 ${company}의 상생 경영 철학과 `;
    essay += `혁신 문화에 기여할 수 있는 인재가 될 수 있음을 확인했습니다.`;
  }

  // Learning/Collaboration (기업별 추가)
  if (company === '삼성전자') {
    essay += ` 또한, 지속적인 학습을 통해 더 깊은 기술 역량을 쌓아가겠습니다.`;
  } else {
    essay += ` 앞으로도 함께 성장하는 상생의 가치를 실현하겠습니다.`;
  }

  return essay;
}

function extractHighlights(essay, company) {
  const highlights = [];

  if (company === '삼성전자') {
    if (essay.includes('기술') || essay.includes('개발') || essay.includes('시스템')) {
      highlights.push('기술적 역량 강조');
    }
    if (/\d+%/.test(essay) || essay.includes('개선') || essay.includes('향상')) {
      highlights.push('정량적 결과 포함');
    }
    if (essay.includes('문제') && essay.includes('해결')) {
      highlights.push('문제 해결 능력');
    }
  } else {
    if (essay.includes('팀') || essay.includes('협업') || essay.includes('함께')) {
      highlights.push('협업 능력 강조');
    }
    if (essay.includes('혁신') || essay.includes('개선') || essay.includes('새로운')) {
      highlights.push('혁신적 사고');
    }
    if (essay.includes('상생') || essay.includes('함께 성장')) {
      highlights.push('상생 가치');
    }
  }

  return highlights;
}

function getEssayStrengths(essay, company) {
  const strengths = [];

  if (company === '삼성전자') {
    if (essay.includes('기술')) strengths.push('기술적 역량이 드러남');
    if (/\d+/.test(essay)) strengths.push('정량적 지표 포함');
    if (essay.includes('문제') && essay.includes('해결')) strengths.push('문제 해결 과정 서술');
  } else {
    if (essay.includes('협업') || essay.includes('팀')) strengths.push('협업 능력 강조');
    if (essay.includes('혁신')) strengths.push('혁신적 접근 서술');
    if (essay.includes('상생')) strengths.push('상생 가치 반영');
  }

  if (essay.length > 300) strengths.push('적절한 분량');
  if (essay.includes('경험') && essay.includes('결과')) strengths.push('STAR 구조 준수');

  return strengths.length > 0 ? strengths : ['기본 구조는 갖추어짐'];
}

function getEssayImprovements(essay, company, strategy) {
  const improvements = [];

  if (company === '삼성전자') {
    if (!/\d+%/.test(essay) && !essay.match(/\d+/)) {
      improvements.push('정량적 지표를 더 구체적으로 추가하세요 (예: 성능 30% 개선, 처리 시간 50% 단축)');
    }
    if (!essay.includes('기술') && !essay.includes('시스템')) {
      improvements.push('기술적 역량을 더 구체적으로 서술하세요');
    }
  } else {
    if (!essay.includes('협업') && !essay.includes('팀')) {
      improvements.push('협업 과정을 더 상세히 서술하세요');
    }
    if (!essay.includes('상생')) {
      improvements.push('상생 가치를 더 명확히 드러내세요');
    }
  }

  if (essay.length < 400) {
    improvements.push('내용을 더 구체화하여 분량을 늘리세요');
  }

  if (strategy?.emphasis_points) {
    const missingPoints = strategy.emphasis_points.filter(point => {
      const pointKeywords = point.point.split('');
      return !pointKeywords.some(keyword => essay.includes(keyword));
    });
    
    if (missingPoints.length > 0) {
      improvements.push(`다음 강조 포인트를 추가하세요: ${missingPoints.map(p => p.point).join(', ')}`);
    }
  }

  return improvements.length > 0 ? improvements : ['현재 상태가 양호합니다. 세부 사항만 보완하세요.'];
}

