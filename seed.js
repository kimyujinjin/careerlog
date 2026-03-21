// ── 더미 데이터 시드 ─────────────────────────────
// 브라우저 콘솔에서 실행하세요.

const dummyProfile = {
  id: "seed_profile_001",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: new Date().toISOString(),
  personal: {
    name: "김유진",
    title: "Product Owner",
    email: "yujin.kim@example.com",
    phone: "010-1234-5678",
    location: "서울시 마포구",
    linkedin: "linkedin.com/in/yujinkim",
    github: "github.com/yujinkim"
  },
  titles: [
    { id: "t1", label: "PO 강조", value: "Product Owner" },
    { id: "t2", label: "PM 겸용", value: "Product Manager" },
    { id: "t3", label: "스타트업용", value: "CPO / Product Lead" }
  ],
  summaries: [
    {
      id: "s1",
      label: "핀테크 지원용",
      body: "5년간 B2C 서비스 기획 및 PO 경험을 보유한 프로덕트 오너입니다. 데이터 기반 의사결정과 사용자 중심 사고를 바탕으로 전환율 향상 및 리텐션 개선 프로젝트를 다수 주도했습니다. 핀테크 도메인에서 결제 플로우 개선, 가입 퍼널 최적화 경험이 있으며 개발팀·디자인팀과의 긴밀한 협업을 통해 빠른 실험과 반복 개선을 추구합니다."
    },
    {
      id: "s2",
      label: "여행/커머스 지원용",
      body: "여행 커머스 도메인에서 상품 유입 및 전환 개선을 담당한 PO입니다. 검색·추천 알고리즘 개선, 패키지 상품 설계, 정산 자동화 등 다양한 프로젝트를 통해 비즈니스 지표를 실질적으로 개선한 경험이 있습니다. 데이터 분석 툴 활용에 능숙하며, 정량적 목표 설정과 회고를 통한 팀 성과 향상에 기여합니다."
    }
  ],
  experiences: [
    {
      id: "exp1",
      company: "(주)팀오투",
      department: "PO팀",
      role: "PO / 팀원",
      startDate: "2024-06",
      endDate: "",
      isCurrent: true,
      description: "여행 커머스 플랫폼 PO로 상품 유입·전환 개선을 담당",
      achievements: [],
      tags: ["여행커머스", "B2C", "데이터기반"]
    },
    {
      id: "exp2",
      company: "위더스콘텐츠",
      department: "플랫폼사업부",
      role: "서비스기획 / 주임",
      startDate: "2022-03",
      endDate: "2024-05",
      isCurrent: false,
      description: "콘텐츠 구독 플랫폼 기획 및 운영, 신규 서비스 런칭 주도",
      achievements: [],
      tags: ["구독서비스", "콘텐츠플랫폼"]
    },
    {
      id: "exp3",
      company: "트래블메이커스",
      department: "프로덕트팀",
      role: "프로덕트디자이너 / 팀원",
      startDate: "2020-07",
      endDate: "2022-02",
      isCurrent: false,
      description: "여행 O2O 서비스 UX/UI 설계 및 프로덕트 기획 보조",
      achievements: [],
      tags: ["UX", "O2O", "여행"]
    },
    {
      id: "exp4",
      company: "카카오커머스",
      department: "쇼핑팀",
      role: "서비스기획 / 인턴",
      startDate: "2019-07",
      endDate: "2020-02",
      isCurrent: false,
      description: "쇼핑 탭 큐레이션 기능 기획 및 A/B 테스트 운영",
      achievements: [],
      tags: ["이커머스", "A/B테스트"]
    }
  ],
  projects: [
    // exp1 (팀오투) 소속
    {
      id: "p1",
      experienceId: "exp1",
      name: "호텔+렌트카 패키지 상품 유입 및 전환 개선",
      company: "(주)팀오투",
      role: "PO",
      startDate: "2024-06",
      endDate: "2025-06",
      description: "",
      projectType: "개선",
      contributions: [
        "배경 : 자사 전략 상품인 호텔+렌트카 패키지의 유입률이 0.19%로 저조하고, 호텔 단독 대비 판매 비중이 17%p 낮음.",
        "주요실행 : 유입이 많은 상품군에 패키지 전환 버튼 배치, 검색 단계 렌트카 조건 선택 기능 추가, 매칭 차량 정보 선노출 등 탐색 구조 개선.",
        "성과 : 패키지상품 유입수 4.5배 증가, 호텔단독상품 대비 전환율 19% 증가"
      ],
      metrics: [],
      techStack: [],
      tags: ["전환개선", "UX", "패키지"]
    },
    {
      id: "p2",
      experienceId: "exp1",
      name: "여행자보험 가입 퍼널 개선",
      company: "(주)팀오투",
      role: "PO",
      startDate: "2025-03",
      endDate: "2025-12",
      description: "",
      projectType: "개선",
      contributions: [
        "배경 : 여행자보험 가입 전환율이 업계 평균 대비 32% 낮고, 이탈 구간이 약관 동의 스텝에 집중됨.",
        "주요실행 : 약관 요약 UI 도입, 가입 단계 3→2단계 축소, 보험료 비교 기능 추가.",
        "성과 : 가입 전환율 41% 향상, 고객 문의 건수 28% 감소"
      ],
      metrics: [],
      techStack: [],
      tags: ["퍼널최적화", "보험"]
    },
    // exp2 (위더스콘텐츠) 소속
    {
      id: "p3",
      experienceId: "exp2",
      name: "구독 플랜 개편 및 업셀 전략 수립",
      company: "위더스콘텐츠",
      role: "서비스기획",
      startDate: "2023-04",
      endDate: "2023-11",
      description: "",
      projectType: "신규",
      contributions: [
        "기존 단일 플랜 구조를 3티어(라이트·스탠다드·프리미엄)로 개편하여 ARPU 개선.",
        "프리미엄 전용 콘텐츠 라인업 기획 및 마케팅팀 연계 캠페인 운영.",
        "성과 : 월 구독 ARPU 23% 상승, 프리미엄 플랜 전환율 9%p 향상"
      ],
      metrics: [],
      techStack: ["Amplitude", "Notion", "Figma"],
      tags: ["구독", "업셀", "수익화"]
    },
    {
      id: "p4",
      experienceId: "exp2",
      name: "콘텐츠 추천 알고리즘 개선 기획",
      company: "위더스콘텐츠",
      role: "서비스기획",
      startDate: "2022-09",
      endDate: "2023-02",
      description: "",
      projectType: "개선",
      contributions: [
        "협업 필터링 기반 추천 엔진 도입 제안 및 요구사항 정의.",
        "A/B 테스트 설계·운영으로 추천 클릭률 개선 검증.",
        "성과 : 추천 콘텐츠 클릭률 34% 향상, 1인당 평균 소비 콘텐츠 수 1.8편 → 2.6편"
      ],
      metrics: [],
      techStack: ["SQL", "GA4", "Mixpanel"],
      tags: ["추천시스템", "데이터분석"]
    },
    // exp3 (트래블메이커스) 소속
    {
      id: "p5",
      experienceId: "exp3",
      name: "현지 가이드 매칭 서비스 UX 리뉴얼",
      company: "트래블메이커스",
      role: "프로덕트디자이너",
      startDate: "2021-03",
      endDate: "2021-10",
      description: "",
      projectType: "개선",
      contributions: [
        "사용자 인터뷰 12명 진행, 주요 이탈 원인(가이드 신뢰도 정보 부족) 도출.",
        "가이드 프로필 상세 페이지 리뉴얼 및 리뷰 구조 개편.",
        "성과 : 가이드 문의 전환율 22% 향상, 앱 스토어 평점 3.8 → 4.4"
      ],
      metrics: [],
      techStack: ["Figma", "Zeplin"],
      tags: ["UX리뉴얼", "사용자조사"]
    },
    // 독립 프로젝트 (experienceId 없음)
    {
      id: "p6",
      experienceId: "",
      name: "CareerLog - 이력서 아카이브 개인 프로젝트",
      company: "",
      role: "기획 / 개발",
      startDate: "2025-01",
      endDate: "2025-03",
      description: "버전별 이력서 관리 및 자동 생성 웹앱. HTML/CSS/JS 바닐라로 구현.",
      projectType: "사이드프로젝트",
      contributions: [
        "마스터 프로필 기반 다중 버전 이력서 생성 기능 설계 및 구현",
        "Gemini AI 연동으로 직무별 자기소개 자동 생성 기능 추가",
        "로컬스토리지 기반 데이터 영속성 구현, JSON 백업/복원 기능 제공"
      ],
      metrics: ["개인 사용 목적으로 개발, GitHub 공개 후 Star 47개"],
      techStack: ["HTML", "CSS", "JavaScript", "Gemini API"],
      tags: ["사이드프로젝트", "바닐라JS", "AI연동"]
    },
    {
      id: "p7",
      experienceId: "",
      name: "로컬 맛집 큐레이션 앱 프로토타입",
      company: "",
      role: "기획 / UX",
      startDate: "2024-09",
      endDate: "2024-12",
      description: "지역 기반 맛집 큐레이션 서비스 기획 및 프로토타입 제작. 팀 프로젝트(3인).",
      projectType: "팀프로젝트",
      contributions: [
        "서비스 컨셉 정의 및 핵심 기능 우선순위 결정",
        "Figma 기반 와이어프레임 → 프로토타입 제작 (60개 화면)",
        "사용자 테스트 10명 진행, 핵심 플로우 3회 반복 개선"
      ],
      metrics: [],
      techStack: ["Figma", "Notion", "FigJam"],
      tags: ["UX기획", "프로토타입", "팀프로젝트"]
    }
  ],
  skills: [
    {
      id: "sk1",
      category: "기획 / PM",
      items: ["Jira", "Confluence", "Notion", "Figma", "PRD 작성", "로드맵 수립", "스프린트 운영"]
    },
    {
      id: "sk2",
      category: "데이터 분석",
      items: ["SQL", "Google Analytics 4", "Amplitude", "Mixpanel", "A/B 테스트 설계", "지표 정의 및 모니터링"]
    },
    {
      id: "sk3",
      category: "커뮤니케이션 / 협업",
      items: ["개발팀 요구사항 협의", "디자인 스프린트", "스테이크홀더 보고", "OKR 수립"]
    },
    {
      id: "sk4",
      category: "기술 (기초)",
      items: ["HTML/CSS", "JavaScript (기초)", "Python (기초)", "REST API 이해", "Git"]
    }
  ],
  educations: [
    {
      id: "edu1",
      school: "연세대학교",
      major: "경영학과",
      degree: "학사",
      startDate: "2015-03",
      endDate: "2019-08"
    },
    {
      id: "edu2",
      school: "패스트캠퍼스",
      major: "데이터 분석 부트캠프",
      degree: "수료",
      startDate: "2021-01",
      endDate: "2021-04"
    }
  ],
  certifications: [
    { id: "cert1", name: "SQLD (SQL 개발자)", issuer: "한국데이터산업진흥원", date: "2022-06" },
    { id: "cert2", name: "구글 애널리틱스 개인 인증(GAIQ)", issuer: "Google", date: "2023-03" }
  ]
};

localStorage.setItem('rca_profile', JSON.stringify(dummyProfile));
console.log('✅ 더미 데이터 주입 완료! 새로고침하세요.');
