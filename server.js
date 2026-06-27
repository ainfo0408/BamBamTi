const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple .env parser to avoid external dependencies
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.trim().split('=');
      if (parts.length >= 2 && !line.startsWith('#')) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

// Import serverless function dynamically
const handlerPromise = import('./api/gemini-counseling.js')
  .then(mod => mod.default)
  .catch(err => {
    // Fallback in case ES Module dynamic import has issues on some Node environments
    return null;
  });

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Route API requests
  if (pathname === '/api/gemini-counseling') {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'POST 요청만 허용됩니다.' }));
      return;
    }

    // Read POST body
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
    });

    req.on('end', async () => {
      // Mock Vercel response helper
      const vercelRes = {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        status: function(code) {
          this.statusCode = code;
          return this;
        },
        json: function(data) {
          res.writeHead(this.statusCode, this.headers);
          res.end(JSON.stringify(data));
        }
      };

      // Mock Vercel request body
      const vercelReq = {
        method: req.method,
        body: bodyData
      };

      const handler = await handlerPromise;
      if (handler) {
        try {
          await handler(vercelReq, vercelRes);
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: `Handler Error: ${error.message}` }));
        }
      } else {
        // Direct backup implementation of handler in case ESM import fails in standard Node CJS
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' }));
          return;
        }

        let parsedBody;
        try {
          parsedBody = JSON.parse(bodyData);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '유효한 JSON 형식이 아닙니다.' }));
          return;
        }

        const { studentAlias, gradeSummary, learningTraits, teacherConcern } = parsedBody || {};
        if (!studentAlias || !gradeSummary || !learningTraits || !teacherConcern) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '필수 값이 누락되었습니다.' }));
          return;
        }

        const geminiUrlPrimary = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
        const geminiUrlFallback = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
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
          let response = await fetch(geminiUrlPrimary, {
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

          if (!response.ok) {
            console.warn(`gemini-3.1-flash-lite failed with status ${response.status}. Falling back to gemini-2.5-flash.`);
            response = await fetch(geminiUrlFallback, {
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
            res.writeHead(response.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: `Gemini API 호출 실패: ${errorText}` }));
            return;
          }

          const data = await response.json();
          const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!resultText) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Gemini 응답에서 텍스트를 추출할 수 없습니다.' }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, result: resultText }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: `서버 내부 오류: ${error.message}` }));
        }
      }
    });
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  // Prevent directory traversal attacks
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  로컬 개발 서버가 성공적으로 시작되었습니다.`);
  console.log(`  주소: http://localhost:${PORT}`);
  console.log(`  (종료하려면 Ctrl + C를 누르세요)`);
  console.log(`==================================================`);
});
