/* ─────────────────────────────────────
   글핏 · app.js
   ───────────────────────────────────── */

// ── API 키 (본인의 OpenAI API Key를 여기에 입력해 주세요)
const OPENAI_API_KEY = '';

// ── 업데이트된 플랫폼 데이터 정의
const PLATFORMS = {
  teacher:  ['안내사항', '과제 가이드', '생활기록부', '공문', '추천서', '학부모 안내문', '가정통신문'],
  student:  ['이메일', '자기소개서', '이력서', '서술형 포트폴리오'],
  designer: ['학술 원고', '블로그', 'SNS', '구직/구인'],
  creator:  ['블로그', '인스타그램', '유튜브'],
  business: ['메신저', '이메일', '공식 제안서'],
};

// ── 페르소나별 최적화된 입력 가이드라인(플레이스홀더)
const PLACEHOLDERS = {
  teacher:  "여기에 핵심 공지 내용을 입력하세요.\n예) 내일 2교시 축구장 이동수업, 단체 체육복 착용 필수, 물 개인 지참 요구.",
  student:  "여기에 전달할 상황이나 경험을 입력하세요.\n예) 공모전 수상 경력과 피그마 컴포넌트 협업 설계 역량을 강조하여 서술 바람.",
  designer: "여기에 원고나 게시물의 핵심 논점을 입력하세요.\n예) UI 디자인에서 일관성 있는 그리드가 왜 필요한지 그리드 시스템의 장점을 서술.",
  creator:  "여기에 콘텐츠 기획 아이디어를 입력하세요.\n예) 초보 디자이너를 위한 폰트 조합 치트키 3가지 추천, 저장 유도 캡션.",
  business: "여기에 요청하거나 공유할 비즈니스 안건을 입력하세요.\n예) 상반기 정기 디자인 피드백 회의 일정을 조율하고자 함, 금주 목요일까지 회신 바람."
};

// ── 시스템 프롬프트 조립 엔진
function buildSystemPrompt(persona, platform, target, purpose) {
  const personaPrompts = {
    teacher:
      '당신은 마이스터고 디자인 교사입니다. 교육 현장의 언어와 공적 문서 형식에 익숙하며, 학생·학부모·기관을 대상으로 신뢰감 있는 글을 씁니다.',
    student:
      '당신은 성실하고 열정적인 마이스터고 디자인과 학생(또는 대학생)입니다. 교수님과 기업 인사담당자에게 정중하고 예의 바른 태도를 취하며, 자신의 역량과 배움을 자신감 있게 표현합니다.',
    designer:
      '당신은 UI/UX 디자인 분야의 연구자입니다. 전문 용어를 적절히 활용하고, 논리적 구조와 근거 중심의 글을 씁니다.',
    creator:
      '당신은 디자인 교육 콘텐츠 크리에이터입니다. 독자의 흥미를 끌고, 개성 있는 목소리로 콘텐츠를 기획하고 씁니다.',
    business:
      '당신은 비즈니스 커뮤니케이션 전문가입니다. 상황에 맞는 격식과 간결함을 갖추고, 오해 없이 의도를 전달하는 글을 씁니다.',
  };

  const platformPrompts = {
    '안내사항': `학급 공지사항, 교과 공지, 행사 안내 등 학생들에게 명확한 정보를 전달하는 안내문을 작성합니다.
- 구조: 따뜻하고 다정한 첫인사 → 핵심 공지 내용(일시, 장소, 대상 등은 반드시 줄바꿈 후 기호나 숫자로 항목화) → 강조 및 당부사항 → 든든한 끝인사
- 문체: "~바랍니다", "~해 주세요"와 같이 친절하면서도 교사로서의 성실함 Py명확함이 느껴지는 어조`,

    '과제 가이드': `수행평가, 과제, 프로젝트 가이드라인 등 학생들이 과제를 수행할 때 참고할 지침서를 작성합니다.
- 구조: 과제 명칭 및 개요 → 과제 수행 순서/방법 Step별 정리 → ★중요★ 제출 기한 및 제출 방법 → 채점 기준 및 유의사항 제시
- 문체: 가독성이 최우선이므로 번호(1., 2., 3.)나 기호(•, -)를 적극적으로 사용하여 명확하게 서술, 디자인 전공 용어가 있다면 쉽게 풀어씀`,

    '이메일': `상대방에게 보내는 격식 있는 비즈니스 혹은 학업적 이메일을 작성합니다.
- 구조: 제목(소속/이름/목적 명시) → 첫인사 및 자기소개 → 본론(요청/문의 내용) → 끝인사 및 정중한 맺음말
- 문체: 정중하고 예의 바른 어조, 문맥에 알맞게 정중히 종결`,

    '메신저': `사내 메신저나 슬랙, 팀즈용 비즈니스 메시지를 작성합니다. 가독성과 요점 중심의 간결함 유지.`,

    '자기소개서': `취업/진학을 위한 자기소개서 문항 답변을 작성합니다.
- 문체: 정중하고 당찬 느낌의 "-합니다"체
- 구조: 소제목 → 경험/사례 제시(계기) → 구체적 노력 및 성과(과정) → 입사 후 포부 및 배운 점(결론)
- 성실함과 발전 가능성이 돋보이도록 작성`,

    '이력서': `이력서의 핵심 요약이나 프로젝트 기술서 내용을 작성합니다.
- 구조: 프로젝트명 → 역할 → 주요 성과 및 기여도
- 문체: 개조식(문장을 다 끝맺지 않고 요점만 정리하는 형태, 예: ~ 설계 및 구현)
- 성과는 명확하게 수치나 구체적인 결과물 위주로 정리`,

    '서술형 포트폴리오': `디자인/개발 포트폴리오의 프로젝트 소개 글을 작성합니다.
- 구조: 프로젝트 소개 및 문제 정의(Why) → 핵심 솔루션 및 디자인 프로세스(How) → 결과 및 배운 점(What)
- 전문 용어(UI/UX 가이드라인, 그리드, 페르소나 등)를 적절히 활용하여 직무 역량이 드러나도록 서술`,

    '생활기록부': `학교생활기록부 문체로 작성합니다.
- 문장 종결: 반드시 "-임", "-함" 으로 끝냄
- 시제: 현재형
- 시점: 철저한 관찰자 시점, 주어 생략
- 분량: 500자 내외
- 절대 포함 금지: 학교명, 기업명, 지역명, 학생을 특정할 수 있는 고유명사, 외국어·영문 표기, 특정 서비스명·상품명
- 사실·행동 중심 서술, 추측·감정 표현 배제`,

    '공문': `공공기관 공문 형식으로 작성합니다. 구조: 제목 → 관련 → 내용 → 붙임. 내용은 번호 항목화, "-합니다" 종결.`,
    '추천서': `추천인 시점의 추천서를 작성합니다. 구체적 관찰 사례 중심, 격식체, 신뢰감 있는 어조`,
    '학부모 안내문': `학교 학부모 안내문 형식으로 작성합니다. 친근하되 격식 있는 문체, 일정·장소 등 항목화`,
    '가정통신문': `학교 가정통신문 형식으로 작성합니다. 구조: 제목 → 인사말(계절감 포함) → 본문(○ 항목) → 날짜·기관명`,
    '학술 원고': `학술지·연구 원고 문체로 작성합니다. 논리적 구조, 격식체.`,
    '블로그': `독자 친화적이고 가독성이 좋은 블로그 글을 작성합니다. 흥미로운 소제목 레이아웃 활용.`,
    'SNS': `페이스북, 링크드인 등 SNS 환경에 맞는 호흡의 글을 작성합니다. 훅 문장과 적절한 줄바꿈이 특징입니다.`,
    '인스타그램': `인스타그램 캡션을 작성합니다. 첫 줄 강력한 흡입력, 적절한 이모지 및 하단 해시태그 배치.`,
    '유튜브': `유튜브 영상 스크립트를 작성합니다. 청중에게 말을 건네는 구어체 활용.`,
    '구직/구인': `구인 광고 혹은 구직 네트워킹을 위한 매력적이고 신뢰도 높은 제안 글을 작성합니다.`,
    '공식 제안서': `공식 제안서 형식으로 작성합니다. 배경 → 목적 → 내용의 흐름을 지킵니다.`,
  };

  const targetLabels = {
    student: '학생·친구', parent: '학부모', colleague: '동료·상사',
    teacher_target: '교수님·선생님', client: '클라이언트·인사담당자', public: '불특정(대중)',
  };

  const purposeLabels = {
    inform: '정보 전달',
    persuade: '설득',
    request_cooperation: `타 부서나 클라이언트에게 업무 협조를 구하는 내용입니다.\n- 상대방의 노고에 대한 정중한 감사 표현 선행\n- 협조가 필요한 배경과 명확한 요청 사항 정의\n- 협조를 통해 기대되는 긍정적 효과 언급하며 부드럽고 정중하게 마무리`,
    request_submit: `특정 자료, 보고서, 증빙 서류 등의 제출을 요청하는 내용입니다.\n- 요청하는 서류의 명확한 명칭과 목적 서술\n- ★중요★ 제출 기한(날짜 및 시간)과 제출 방식(이메일, 시스템 업로드 등)을 명확하게 항목화하여 표기\n- 기한 준수를 요청하되 압박감을 주지 않는 프로페셔널한 어조 유지`,
    request: '일반 문의 및 요청',
    promote: '소개·홍보',
    record: '기록·제출',
  };

  return `당신은 글쓰기 전문가입니다. 사용자가 제공한 핵심 내용을 바탕으로 지정된 페르소나, 플랫폼, 타겟, 목적에 맞는 완성도 높은 글을 한국어로 작성합니다. 내용을 풍부하게 확장하되, 맥락을 벗어나지 마세요.

[페르소나]
${personaPrompts[persona]}

[플랫폼·형식]
${platformPrompts[platform] || `${platform} 형식`}

[타겟]
이 글의 독자는 "${targetLabels[target]}"입니다.

[목적]
${purposeLabels[purpose].includes('\n') ? purposeLabels[purpose] : `이 글의 목적은 "${purposeLabels[purpose]}"입니다.`}

위 조건에 맞게 완성된 글만 출력하세요. 설명이나 부연은 생략합니다.`;
}

// ── 글로벌 상태 관리 객체
const state = {
  persona: null,
  platform: null,
  target: null,
  purpose: null,
};

// ── DOM 요소 선택
const steps = {
  platform: document.getElementById('step-platform'),
  target:   document.getElementById('step-target'),
  input:    document.getElementById('step-input'),
  result:   document.getElementById('step-result'),
};

const platformGroup = document.getElementById('platform-group');
const generateBtn   = document.getElementById('generate-btn');
const contentInput  = document.getElementById('content-input');
const resultText    = document.getElementById('result-text');
const loading       = document.getElementById('loading');
const copyBtn       = document.getElementById('copy-btn');
const regenBtn      = document.getElementById('regen-btn');

// ── 다음 스텝 패널 표시 함수
function showStep(el) {
  el.classList.remove('hidden');
  el.classList.add('reveal');
  setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

// ── 칩 선택 핸들러
function handleChipGroup(groupId, stateKey, callback) {
  document.getElementById(groupId).addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll(`#${groupId} .chip`).forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state[stateKey] = chip.dataset.value;
    if (callback) callback(chip.dataset.value);
  });
}

// ── [STEP 1] 페르소나 선택 트리거
handleChipGroup('persona-group', 'persona', (val) => {
  // 플랫폼 하위 칩 새로 생성
  platformGroup.innerHTML = '';
  PLATFORMS[val].forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.dataset.value = p;
    btn.textContent = p;
    platformGroup.appendChild(btn);
  });

  // 페르소나에 맞춰 동적 플레이스홀더 주입
  if (PLACEHOLDERS[val]) {
    contentInput.placeholder = PLACEHOLDERS[val];
  } else {
    contentInput.placeholder = "여기에 핵심 내용을 입력하세요.";
  }

  // 하위 선택 정보 전체 리셋 및 패널 일제히 숨김
  state.platform = null;
  state.target = null;
  state.purpose = null;
  ['step-target', 'step-input', 'step-result'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.add('hidden');
    el.classList.remove('reveal');
  });
  document.querySelectorAll('#target-group .chip, #purpose-group .chip').forEach(c => c.classList.remove('active'));
  checkGenBtn();

  showStep(steps.platform);
});

// ── [STEP 2] 플랫폼 선택 트리거
handleChipGroup('platform-group', 'platform', () => {
  showStep(steps.target);
});

// ── [STEP 3] 타겟 선택 트리거
handleChipGroup('target-group', 'target', () => {
  checkGenBtn();
});

// ── [STEP 4] 목적 선택 트리거
handleChipGroup('purpose-group', 'purpose', () => {
  checkGenBtn();
  if (state.target && state.purpose) showStep(steps.input);
});

// ── 유효성 및 활성화 체크 조율
function checkGenBtn() {
  const ready = state.persona && state.platform && state.target && state.purpose && contentInput.value.trim();
  generateBtn.disabled = !ready;
}

contentInput.addEventListener('input', checkGenBtn);

// ── 비동기 OpenAI 네트워킹 통신
async function generateText() {
  const userContent = contentInput.value.trim();
  if (!userContent) return;

  if (OPENAI_API_KEY === 'sk-REPLACE_WITH_YOUR_API_KEY' || !OPENAI_API_KEY) {
    alert('app.js 파일 상단의 OPENAI_API_KEY를 올바른 키로 입력해 주세요.');
    return;
  }

  steps.result.classList.remove('hidden');
  steps.result.classList.add('reveal');
  resultText.textContent = '';
  loading.classList.add('active');
  generateBtn.disabled = true;
  generateBtn.querySelector('.btn-text').textContent = '생성 중...';

  setTimeout(() => steps.result.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);

  try {
    const systemPrompt = buildSystemPrompt(state.persona, state.platform, state.target, state.purpose);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userContent },
        ],
        temperature: 0.75,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || '알 수 없는 네트워크 오류');
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();

    loading.classList.remove('active');
    resultText.textContent = text;

  } catch (err) {
    loading.classList.remove('active');
    resultText.textContent = `⚠️ 오류가 발생했습니다.\n${err.message}`;
  } finally {
    generateBtn.disabled = false;
    generateBtn.querySelector('.btn-text').textContent = '글 생성하기';
    checkGenBtn();
  }
}

generateBtn.addEventListener('click', generateText);
regenBtn.addEventListener('click', generateText);

// ── 원클릭 복사
copyBtn.addEventListener('click', () => {
  const text = resultText.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = '✓ 복사됨';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = '복사';
      copyBtn.classList.remove('copied');
    }, 2000);
  });
});