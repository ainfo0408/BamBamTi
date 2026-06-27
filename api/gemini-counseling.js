// 보안 점검용 주석:
// 1. 프론트엔드에 API 키를 넣으면 개발자 도구에서 노출될 수 있다.
// 2. Gemini API 호출은 Vercel Serverless Function에서 처리한다.
// 3. .env 파일은 GitHub에 올리지 않는다.
// 4. Vercel 배포 시에는 Project Settings의 Environment Variables에 GEMINI_API_KEY를 등록해야 한다.
// 5. Gemini로 전송하는 데이터는 이름, 학번, 사진 경로를 제외한 최소 정보로 제한한다.

export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST 요청만 허용됩니다.' });
  }

  // GEMINI_API_KEY 환경 변수 체크
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' });
  }

  // 요청 데이터 파싱 및 검증
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ success: false, error: '유효한 JSON 형식이 아닙니다.' });
    }
  }

  const { studentAlias, gradeSummary, learningTraits, teacherConcern } = body || {};

  // 필수 값 검증
  if (!studentAlias || !gradeSummary || !learningTraits || !teacherConcern) {
    return res.status(400).json({
      success: false,
      error: '필수 값(studentAlias, gradeSummary, learningTraits, teacherConcern)이 누락되었습니다.'
    });
  }

  // Gemini REST API 호출 준비
  const urlPro = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;
  const urlFlash = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // 프롬프트 작성 (지정된 조건들 반영)
  const prompt = `당신은 학생 상담 전략을 지원하는 교육 전문가이자 전문 상담사입니다.
다음 학생 데이터를 바탕으로 교사가 학생을 효과적으로 상담할 수 있는 맞춤형 전략을 제안해 주세요.

[학생 정보]
- 학생 식별자(가명): ${studentAlias}
- 성적 정보 요약: ${gradeSummary}
- 학습 특성 및 교사 메모: ${learningTraits}

[교사의 상담 고민]
"${teacherConcern}"

[답변 작성 시 주의사항 및 원칙]
1. 학생을 단정적으로 판단하거나 진단하지 마세요. (예: "의지가 부족하다", "주의력에 문제가 있다", "심리적 문제가 있다" 등의 단정 표현 금지)
2. 교사가 학생의 행동이나 성취 이면의 맥락을 이해하고 대화할 수 있도록 돕는 방향으로 제안해 주세요.
3. 상담 전략은 참고용일 뿐이며, 최종 판단과 실제 상담은 교사가 학생의 상황을 종합적으로 고려하여 진행해야 한다는 점을 명시해 주세요.

[응답 형식]
반드시 다음 번호와 제목 형식(Markdown 활용)을 유지하여 명확하게 작성해 주세요:

1. 현재 상황 요약
(내용 작성)

2. 학생 데이터 기반 해석
(내용 작성)

3. 상담 접근 전략
(내용 작성)

4. 교사가 던질 수 있는 질문 3개
- 질문 1: ...
- 질문 2: ...
- 질문 3: ...

5. 피해야 할 말 또는 주의점
(내용 작성)

6. 다음 수업에서 해볼 수 있는 작은 지원
(내용 작성)
`;

  try {
    let response = await fetch(urlPro, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    });

    // 만약 pro 모델이 할당 한도나 권한 부족(429/403) 등으로 실패하면 flash 모델로 폴백(fallback) 시도
    if (!response.ok) {
      console.warn(`gemini-2.5-pro failed with status ${response.status}. Falling back to gemini-2.5-flash.`);
      response = await fetch(urlFlash, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ]
        })
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail;
      try {
        errorDetail = JSON.parse(errorText);
      } catch (e) {
        errorDetail = errorText;
      }
      return res.status(response.status).json({
        success: false,
        error: `Gemini API 호출 실패: ${errorDetail?.error?.message || errorText}`
      });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      return res.status(500).json({ success: false, error: 'Gemini 응답에서 결과 텍스트를 추출할 수 없습니다.' });
    }

    return res.status(200).json({ success: true, result: resultText });
  } catch (error) {
    return res.status(500).json({ success: false, error: `서버 오류가 발생했습니다: ${error.message}` });
  }
}
