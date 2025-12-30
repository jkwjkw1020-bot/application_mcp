/**
 * 사용자 경험을 대기업 기준으로 선별
 * strong_fit, weak_fit, risky로 분류
 */

export async function mapExperienceToEnterprise({ company, experiences }) {
  const mapping = {
    company,
    mapped_experiences: [],
    summary: {
      strong_fit: 0,
      weak_fit: 0,
      risky: 0
    }
  };

  experiences.forEach((exp, index) => {
    const analysis = analyzeExperience(exp, company);
    mapping.mapped_experiences.push({
      original_index: index,
      experience: exp,
      classification: analysis.classification,
      fit_score: analysis.fit_score,
      reasoning: analysis.reasoning,
      recommendation: analysis.recommendation
    });

    mapping.summary[analysis.classification]++;
  });

  return mapping;
}

function analyzeExperience(experience, company) {
  const { title, description, achievements = [] } = experience;
  
  // 기본 점수
  let fitScore = 0;
  const reasons = [];
  const risks = [];

  // 기술 역량 체크 (삼성 중시)
  if (company === '삼성전자') {
    const techKeywords = ['개발', '프로그래밍', '알고리즘', '시스템', '데이터', 'AI', '머신러닝', '소프트웨어', '하드웨어', '프로젝트'];
    const hasTech = techKeywords.some(keyword => 
      (title + ' ' + description + ' ' + achievements.join(' ')).includes(keyword)
    );
    
    if (hasTech) {
      fitScore += 30;
      reasons.push('기술적 역량 포함');
    } else {
      risks.push('기술적 역량이 드러나지 않음');
    }

    // 문제 해결 능력
    const problemSolvingKeywords = ['문제', '해결', '개선', '최적화', '성능', '효율'];
    const hasProblemSolving = problemSolvingKeywords.some(keyword =>
      (description + ' ' + achievements.join(' ')).includes(keyword)
    );
    
    if (hasProblemSolving) {
      fitScore += 25;
      reasons.push('문제 해결 능력 증명');
    }

    // 구체적 결과
    const hasQuantitativeResults = achievements.some(ach => 
      /\d+/.test(ach) || ['증가', '감소', '개선', '달성'].some(word => ach.includes(word))
    );
    
    if (hasQuantitativeResults) {
      fitScore += 25;
      reasons.push('정량적 결과 포함');
    } else {
      risks.push('구체적 결과 부재');
    }

    // 학습 능력
    const learningKeywords = ['학습', '습득', '성장', '개발', '향상'];
    const hasLearning = learningKeywords.some(keyword =>
      (description + ' ' + achievements.join(' ')).includes(keyword)
    );
    
    if (hasLearning) {
      fitScore += 20;
      reasons.push('학습 능력 증명');
    }

  } else if (company === 'SK') {
    // 협업 능력 체크 (SK 중시)
    const collaborationKeywords = ['팀', '협업', '함께', '공동', '협력', '소통', '조율'];
    const hasCollaboration = collaborationKeywords.some(keyword =>
      (title + ' ' + description + ' ' + achievements.join(' ')).includes(keyword)
    );
    
    if (hasCollaboration) {
      fitScore += 30;
      reasons.push('협업 능력 포함');
    } else {
      risks.push('협업 경험이 드러나지 않음');
    }

    // 변화 적응력
    const changeKeywords = ['변화', '적응', '새로운', '혁신', '개선', '전환'];
    const hasChange = changeKeywords.some(keyword =>
      (description + ' ' + achievements.join(' ')).includes(keyword)
    );
    
    if (hasChange) {
      fitScore += 25;
      reasons.push('변화 적응력 증명');
    }

    // 혁신적 사고
    const innovationKeywords = ['혁신', '창의', '새로운', '개선', '최적화', '효율화'];
    const hasInnovation = innovationKeywords.some(keyword =>
      (description + ' ' + achievements.join(' ')).includes(keyword)
    );
    
    if (hasInnovation) {
      fitScore += 25;
      reasons.push('혁신적 사고 포함');
    }

    // 상생 가치
    const winwinKeywords = ['함께', '상생', '공유', '멘토링', '지원', '도움'];
    const hasWinwin = winwinKeywords.some(keyword =>
      (description + ' ' + achievements.join(' ')).includes(keyword)
    );
    
    if (hasWinwin) {
      fitScore += 20;
      reasons.push('상생 가치 포함');
    } else {
      risks.push('상생 가치가 드러나지 않음');
    }
  }

  // 공통 위험 요소 체크
  if (!description || description.length < 50) {
    risks.push('설명이 너무 짧거나 부족함');
    fitScore -= 15;
  }

  if (achievements.length === 0) {
    risks.push('구체적 성과가 없음');
    fitScore -= 20;
  }

  // 분류 결정
  let classification;
  if (risks.length >= 2 || fitScore < 30) {
    classification = 'risky';
  } else if (fitScore >= 60) {
    classification = 'strong_fit';
  } else {
    classification = 'weak_fit';
  }

  // 추천 사항
  let recommendation = '';
  if (classification === 'risky') {
    recommendation = '이 경험은 사용을 권장하지 않습니다. 더 적합한 경험을 찾거나 경험을 재구성하는 것을 고려하세요.';
  } else if (classification === 'weak_fit') {
    recommendation = '경험을 더 구체화하고 ' + company + '가 중시하는 요소를 강조하여 재서술하는 것을 권장합니다.';
  } else {
    recommendation = '이 경험은 ' + company + '에 잘 맞습니다. STAR 구조로 구체화하여 활용하세요.';
  }

  return {
    classification,
    fit_score: Math.max(0, Math.min(100, fitScore)),
    reasoning: {
      strengths: reasons,
      risks: risks
    },
    recommendation
  };
}

