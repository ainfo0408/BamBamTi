const USERS = [
  { id: "admin", password: "2026", role: "admin", name: "관리자" },
  { id: "10101", password: "1234", role: "student", studentId: "10101" },
  { id: "10102", password: "1234", role: "student", studentId: "10102" },
  { id: "10103", password: "1234", role: "student", studentId: "10103" },
];

const STUDENTS = [
  {
    id: "10101",
    name: "김코딩",
    photo: "assets/10101_김코딩.jpg",
    grades: {
      "정보 수행평가": "A",
      "웹앱 프로젝트": "92점",
      "디지털 윤리 퀴즈": "88점",
      "수업 참여도": "상",
    },
    traits: [
      "문제 해결 과정을 차분히 설명합니다.",
      "새 도구를 시도할 때 기록을 꼼꼼히 남깁니다.",
      "제출 전 확인 습관을 더 연습하면 좋습니다.",
    ],
    teacherMemo: "프론트엔드 구조 이해가 빠르며, 팀원 질문에 답하는 태도가 좋습니다.",
  },
  {
    id: "10102",
    name: "박개발",
    photo: "assets/10102_박개발.jpg",
    grades: {
      "정보 수행평가": "B+",
      "웹앱 프로젝트": "86점",
      "디지털 윤리 퀴즈": "91점",
      "수업 참여도": "중상",
    },
    traits: [
      "협업 중 역할 분담을 잘 지킵니다.",
      "UI 수정 아이디어를 자주 제안합니다.",
      "프로젝트 범위를 작게 나누는 연습이 필요합니다.",
    ],
    teacherMemo: "기능 구현 의욕이 높고, 오류가 날 때 원인을 함께 추적하려는 태도가 좋습니다.",
  },
  {
    id: "10103",
    name: "이교사",
    photo: "assets/10103_이교사.jpg",
    grades: {
      "정보 수행평가": "A-",
      "웹앱 프로젝트": "89점",
      "디지털 윤리 퀴즈": "95점",
      "수업 참여도": "상",
    },
    traits: [
      "학습 내용을 자기 언어로 정리합니다.",
      "개선할 지점을 발견하면 근거를 함께 제시합니다.",
      "코드 주석을 더 구체적으로 쓰면 좋습니다.",
    ],
    teacherMemo: "질문의 초점이 좋고, 개선 방향을 토의하는 데 적극적입니다.",
  },
];

const loginForm = document.querySelector("#loginForm");
const userIdInput = document.querySelector("#userId");
const passwordInput = document.querySelector("#password");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const loginView = document.querySelector("#loginView");
const studentView = document.querySelector("#studentView");
const adminView = document.querySelector("#adminView");

let currentUser = null;
let selectedStudentData = null;

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const id = userIdInput.value.trim();
  const password = passwordInput.value;
  const user = USERS.find((item) => item.id === id && item.password === password);

  if (!user) {
    loginMessage.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  currentUser = user;
  loginMessage.textContent = "";
  loginForm.reset();

  if (user.role === "admin") {
    renderAdminDashboard();
  } else {
    const student = STUDENTS.find((item) => item.id === user.studentId);
    renderStudentPage(student);
  }
});

logoutButton.addEventListener("click", () => {
  currentUser = null;
  showOnly(loginView);
  logoutButton.classList.add("hidden");
  userIdInput.focus();
});

function showOnly(targetView) {
  [loginView, studentView, adminView].forEach((view) => view.classList.add("hidden"));
  targetView.classList.remove("hidden");
}

function renderStudentPage(student) {
  if (!student) {
    loginMessage.textContent = "학생 정보를 찾을 수 없습니다.";
    showOnly(loginView);
    return;
  }

  studentView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Student</p>
        <h2>${student.name} 학생 페이지</h2>
        <p>로그인한 학생의 학습 현황을 확인합니다.</p>
      </div>
    </div>

    <div class="student-layout">
      <article class="student-profile">
        <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
        <div class="profile-body">
          <h3>${student.name}</h3>
          <p class="student-number">학번 ${student.id}</p>
          <div class="tag-row" aria-label="학습 키워드">
            <span class="tag">정보</span>
            <span class="tag">프로젝트</span>
          </div>
        </div>
      </article>

      <div class="content-stack">
        ${renderGrades(student.grades, false, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
      </div>
    </div>
  `;

  showOnly(studentView);
  logoutButton.classList.remove("hidden");
}

function renderAdminDashboard() {
  adminView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Admin</p>
        <h2>관리자 대시보드</h2>
        <p>학생 3명의 학습 현황을 한 화면에서 비교합니다.</p>
      </div>
    </div>

    <section class="admin-grid" aria-label="전체 학생 정보">
      ${STUDENTS.map(renderStudentCard).join("")}
    </section>

    <!-- AI 학생 상담 전략 도우미 섹션 -->
    <section id="aiHelperPanel" class="ai-helper-panel" style="margin-top: 32px;">
      <div class="section-title">
        <h3>🤖 AI 학생 상담 전략 도우미</h3>
      </div>
      <div class="helper-card" style="border: 1px solid var(--line); border-radius: 8px; background: var(--surface); padding: 24px; box-shadow: var(--shadow);">
        <div class="helper-form-layout" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <!-- Selected Student Info -->
          <div class="selected-student-box" style="background: var(--surface-strong); padding: 16px; border-radius: 6px; border: 1px solid var(--line);">
            <h4 style="margin: 0 0 10px 0; font-size: 16px;">선택된 학생 정보</h4>
            <div id="helperSelectedStudentInfo">
              <p class="placeholder-text" style="color: var(--muted); margin: 0; font-size: 14px;">학생 카드의 [상담 전략 요청] 버튼을 눌러 학생을 선택해 주세요.</p>
            </div>
          </div>
          
          <!-- Concern Input -->
          <div class="concern-input-box" style="display: flex; flex-direction: column;">
            <label for="teacherConcernInput" style="font-weight: 800; margin-bottom: 8px; font-size: 14px;">교사 상담 고민 입력</label>
            <textarea id="teacherConcernInput" placeholder="예: 수업 참여는 좋은데 평가 결과가 낮습니다. 어떻게 상담하면 좋을까요?" rows="4" disabled style="width: 100%; border: 1px solid var(--line); border-radius: 6px; padding: 12px; resize: vertical; font-family: inherit; font-size: 14px; outline: none;"></textarea>
          </div>
        </div>

        <!-- Preview -->
        <div class="helper-preview-box" style="margin-bottom: 20px; background: #0f172a; color: #38bdf8; padding: 16px; border-radius: 6px; border: 1px solid var(--line); font-family: monospace; font-size: 13px;">
          <h4 style="margin: 0 0 10px 0; color: #94a3b8; font-size: 14px; font-family: sans-serif;">전송 데이터 미리보기 (개인정보 보호 익명화)</h4>
          <pre id="previewDataJson" style="margin: 0; white-space: pre-wrap; word-break: break-all;">{}</pre>
        </div>

        <div class="helper-actions" style="margin-bottom: 20px;">
          <button id="getAiStrategyButton" class="primary-button" type="button" disabled style="width: 100%;">AI 상담 전략 받기</button>
        </div>

        <!-- Loading / Output Display Area -->
        <div id="aiResultContainer" class="ai-result-container hidden" style="margin-top: 20px; border-top: 1px solid var(--line); padding-top: 20px;">
          <h4 style="margin: 0 0 12px 0; font-size: 16px;">AI 상담 전략 제안</h4>
          <div id="aiResultContent" class="ai-result-content" style="line-height: 1.7; font-size: 15px; color: var(--ink);"></div>
        </div>

        <!-- Error Display Area -->
        <div id="aiErrorBox" class="form-message error-message hidden" role="alert" style="margin-top: 10px; color: var(--danger); font-weight: 700;"></div>

        <!-- Disclaimer -->
        <div class="disclaimer-text" style="margin-top: 20px; padding-top: 12px; border-top: 1px dashed var(--line); color: var(--muted); font-size: 12px;">
          <p style="margin: 0;">※ AI 상담 전략은 참고용입니다. 최종 판단과 실제 상담은 교사가 학생의 상황을 종합적으로 고려하여 진행해야 합니다.</p>
        </div>
      </div>
    </section>
  `;

  // Reset selected state
  selectedStudentData = null;
  showOnly(adminView);
  logoutButton.classList.remove("hidden");
}

function renderStudentCard(student) {
  return `
    <article class="student-card">
      <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
      <div class="student-card-body">
        <h3>${student.name}</h3>
        <p class="student-number">학번 ${student.id}</p>
        ${renderGrades(student.grades, true, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
        <div style="margin-top: 16px; text-align: right;">
          <button class="ghost-button request-strategy-btn" type="button" data-student-id="${student.id}" style="width: 100%;">상담 전략 요청</button>
        </div>
      </div>
    </article>
  `;
}

function renderGrades(grades, compact = false, headingId = "gradesTitle") {
  const rows = Object.entries(grades)
    .map(([label, value]) => `<tr><th scope="row">${label}</th><td>${value}</td></tr>`)
    .join("");

  return `
    <section aria-labelledby="${headingId}">
      <div class="section-title">
        <h3 id="${headingId}">성적 정보</h3>
      </div>
      <table class="grade-table ${compact ? "compact-table" : ""}">
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderTraits(student) {
  return `
    <section aria-labelledby="traitsTitle-${student.id}">
      <div class="section-title">
        <h3 id="traitsTitle-${student.id}">학습 특성 및 교사 메모</h3>
      </div>
      <ul class="memo-list">
        ${student.traits.map((trait) => `<li>${trait}</li>`).join("")}
        <li>${student.teacherMemo}</li>
      </ul>
    </section>
  `;
}

// 보안 점검용 주석:
// 1. 프론트엔드에 API 키를 넣으면 개발자 도구에서 노출될 수 있다.
// 2. Gemini API 호출은 Vercel Serverless Function에서 처리한다.
// 3. .env 파일은 GitHub에 올리지 않는다.
// 4. Vercel 배포 시에는 Project Settings의 Environment Variables에 GEMINI_API_KEY를 등록해야 한다.
// 5. Gemini로 전송하는 데이터는 이름, 학번, 사진 경로를 제외한 최소 정보로 제한한다.

function selectStudentForCounseling(studentId) {
  const student = STUDENTS.find((s) => s.id === studentId);
  if (!student) return;

  const studentIndex = STUDENTS.findIndex((s) => s.id === studentId);
  const studentAlias = `학생 ${String.fromCharCode(65 + studentIndex)}`;
  const gradeSummary = Object.entries(student.grades)
    .map(([subj, val]) => `${subj}: ${val}`)
    .join(", ");
  const learningTraits = [...student.traits, student.teacherMemo].join(". ");

  selectedStudentData = {
    studentId: student.id,
    realName: student.name,
    studentAlias,
    gradeSummary,
    learningTraits
  };

  const infoEl = document.getElementById("helperSelectedStudentInfo");
  if (infoEl) {
    infoEl.innerHTML = `
      <div class="selected-student-detail" style="font-size: 14px; line-height: 1.5;">
        <p style="margin: 0 0 6px 0;"><strong>화면 표시용 (실제 정보):</strong> ${student.name} (학번: ${student.id})</p>
        <p style="margin: 0;"><strong>Gemini 전송용 (익명화 정보):</strong> ${studentAlias}</p>
      </div>
    `;
  }

  const textarea = document.getElementById("teacherConcernInput");
  if (textarea) {
    textarea.disabled = false;
    textarea.value = "";
    textarea.focus();
  }

  const submitBtn = document.getElementById("getAiStrategyButton");
  if (submitBtn) {
    submitBtn.disabled = false;
  }

  // Clear previous results
  const resultContainer = document.getElementById("aiResultContainer");
  if (resultContainer) resultContainer.classList.add("hidden");
  
  const resultContent = document.getElementById("aiResultContent");
  if (resultContent) resultContent.innerHTML = "";

  const errorBox = document.getElementById("aiErrorBox");
  if (errorBox) {
    errorBox.classList.add("hidden");
    errorBox.textContent = "";
  }

  updatePreview();
}

function updatePreview() {
  if (!selectedStudentData) return;
  const textarea = document.getElementById("teacherConcernInput");
  const concernVal = textarea ? textarea.value.trim() : "";
  const previewObj = {
    studentAlias: selectedStudentData.studentAlias,
    gradeSummary: selectedStudentData.gradeSummary,
    learningTraits: selectedStudentData.learningTraits,
    teacherConcern: concernVal
  };
  const previewEl = document.getElementById("previewDataJson");
  if (previewEl) {
    previewEl.textContent = JSON.stringify(previewObj, null, 2);
  }
}

// Simple markdown formatter
function formatMarkdown(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.*$)/gim, '<h5 style="font-size: 16px; margin: 16px 0 8px 0; font-weight: 700; color: var(--teal);">$1</h5>')
    .replace(/^## (.*$)/gim, '<h4 style="font-size: 18px; margin: 20px 0 10px 0; font-weight: 700; color: var(--primary);">$1</h4>')
    .replace(/^# (.*$)/gim, '<h3 style="font-size: 20px; margin: 24px 0 12px 0; font-weight: 700; border-bottom: 2px solid var(--line); padding-bottom: 6px;">$1</h3>')
    .replace(/^\s*[-*]\s*(.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 6px;">$1</li>')
    .replace(/\n/g, "<br>")
    .replace(/(<li>.*<\/li>)/g, '<ul style="margin: 8px 0; padding: 0;">$1</ul>')
    .replace(/<\/ul>(\s|<br>)*<ul>/g, '');
}

// Global delegated click listener for student cards in adminView
adminView.addEventListener("click", (event) => {
  const btn = event.target.closest(".request-strategy-btn");
  if (btn) {
    const studentId = btn.dataset.studentId;
    selectStudentForCounseling(studentId);
    
    const helperPanel = document.getElementById("aiHelperPanel");
    if (helperPanel) {
      helperPanel.scrollIntoView({ behavior: "smooth" });
    }
  }
});

// Event listener for concern text input change to update preview live
adminView.addEventListener("input", (event) => {
  if (event.target.id === "teacherConcernInput") {
    updatePreview();
  }
});

// Event listener for AI Strategy Request button click
adminView.addEventListener("click", async (event) => {
  if (event.target.id !== "getAiStrategyButton") return;

  const errorBox = document.getElementById("aiErrorBox");
  const resultContainer = document.getElementById("aiResultContainer");
  const resultContent = document.getElementById("aiResultContent");
  const textarea = document.getElementById("teacherConcernInput");
  const submitBtn = document.getElementById("getAiStrategyButton");

  if (!selectedStudentData) return;

  const concern = textarea ? textarea.value.trim() : "";
  if (!concern) {
    if (errorBox) {
      errorBox.textContent = "상담 고민을 먼저 입력해주세요.";
      errorBox.classList.remove("hidden");
    }
    return;
  }

  // Clear previous error
  if (errorBox) {
    errorBox.textContent = "";
    errorBox.classList.add("hidden");
  }

  // Disable button and input during request
  if (submitBtn) submitBtn.disabled = true;
  if (textarea) textarea.disabled = true;

  // Show loading state
  if (resultContainer) resultContainer.classList.remove("hidden");
  if (resultContent) {
    resultContent.innerHTML = `<p class="loading-text" style="color: var(--primary); font-weight: 700; margin: 0;">⏳ AI가 상담 전략을 생성하는 중입니다...</p>`;
  }

  try {
    const response = await fetch("/api/gemini-counseling", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        studentAlias: selectedStudentData.studentAlias,
        gradeSummary: selectedStudentData.gradeSummary,
        learningTraits: selectedStudentData.learningTraits,
        teacherConcern: concern
      })
    });

    const data = await response.json();

    if (data.success) {
      if (resultContent) {
        resultContent.innerHTML = formatMarkdown(data.result);
      }
    } else {
      throw new Error(data.error || "알 수 없는 오류");
    }
  } catch (error) {
    console.error("AI Counseling Error:", error);
    if (resultContainer) resultContainer.classList.add("hidden");
    if (errorBox) {
      errorBox.innerHTML = `AI 상담 전략을 불러오지 못했습니다. API 키 또는 Vercel 환경 변수를 확인해주세요.<br><span style="font-size: 12px; font-weight: normal; opacity: 0.85; display: block; margin-top: 4px;">상세 에러: ${error.message}</span>`;
      errorBox.classList.remove("hidden");
    }
  } finally {
    // Re-enable button and input
    if (submitBtn) submitBtn.disabled = false;
    if (textarea) textarea.disabled = false;
  }
});

showOnly(loginView);
