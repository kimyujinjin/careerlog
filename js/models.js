// ── 유틸 ──────────────────────────────────────────────
function uuid() {
  return 'id_' + Math.random().toString(36).slice(2, 11) + '_' + Date.now().toString(36);
}
function nowISO() { return new Date().toISOString(); }

// ── 팩토리 함수 ───────────────────────────────────────
function createProfile(data = {}) {
  return {
    id: data.id || uuid(),
    createdAt: data.createdAt || nowISO(),
    updatedAt: nowISO(),
    personal: {
      name: '', title: 'Product Owner', email: '', phone: '',
      location: '', linkedin: '', github: '',
      ...data.personal
    },
    titles:         data.titles         || [],
    summaries:      data.summaries      || [],
    experiences:    data.experiences    || [],
    projects:       data.projects       || [],
    skills:         data.skills         || [],
    educations:     data.educations     || [],
    certifications: data.certifications || [],
  };
}

function createSummary(data = {}) {
  return {
    id:    data.id    || uuid(),
    label: data.label || '',   // 짧은 제목 (예: "핀테크 지원용", "B2B 강조")
    body:  data.body  || '',   // 실제 자기소개 본문
  };
}

function createTitle(data = {}) {
  return {
    id:    data.id    || uuid(),
    label: data.label || '',  // 구분용 제목 (예: "PO 강조", "PM 겸용")
    value: data.value || '',  // 실제 표시될 직책명
  };
}

function createExperience(data = {}) {
  return {
    id: data.id || uuid(),
    company: data.company || '',
    department: data.department || '',
    role: data.role || '',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    isCurrent: data.isCurrent || false,
    description: data.description || '',
    achievements: data.achievements || [],
    tags: data.tags || [],
    logo: data.logo || '',
  };
}

function createProject(data = {}) {
  return {
    id: data.id || uuid(),
    experienceId: data.experienceId || '', // 소속 경력 ID (선택)
    name: data.name || '',
    company: data.company || '',
    role: data.role || '',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    description: data.description || '',
    projectType: data.projectType || '',  // 필터용 (미리보기 미반영)
    background: data.background || '',
    mainTasks: data.mainTasks || [],
    achievements: data.achievements || [],
    techStack: data.techStack || [],
    tags: data.tags || [],
  };
}

function createSkillGroup(data = {}) {
  return {
    id: data.id || uuid(),
    category: data.category || '',
    items: data.items || [],
  };
}

function createEducation(data = {}) {
  return {
    id: data.id || uuid(),
    school: data.school || '',
    major: data.major || '',
    degree: data.degree || '',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    graduationStatus: data.graduationStatus || '',
  };
}

function createCertification(data = {}) {
  return {
    id: data.id || uuid(),
    name: data.name || '',
    issuer: data.issuer || '',
    date: data.date || '',
  };
}

function createCompany(data = {}) {
  return {
    id: data.id || uuid(),
    name: data.name || '',
    createdAt: data.createdAt || nowISO(),
  };
}

function createVersion(data = {}) {
  return {
    id: data.id || uuid(),
    name: data.name || '새 버전',
    companyId: data.companyId || '',
    targetCompany: data.targetCompany || '',
    baseProfileId: data.baseProfileId || '',
    templateId: data.templateId || 'modern',
    createdAt: data.createdAt || nowISO(),
    updatedAt: nowISO(),
    status: data.status || 'draft', // draft | ready | submitted
    selectedTitleId:       data.selectedTitleId       || null,
    selectedSummaryId:     data.selectedSummaryId     || null,
    selectedExperienceIds: data.selectedExperienceIds || [],
    expOrder:              data.expOrder              || [], // 버전별 경력 표시 순서 (id 배열)
    selectedProjectIds:    data.selectedProjectIds    || [],
    selectedSkillGroupIds: data.selectedSkillGroupIds || [],
    selectedEducationIds:  data.selectedEducationIds  || [],
    selectedCertIds:       data.selectedCertIds       || [],
    overrides: data.overrides || {},
    resumeTitle: data.resumeTitle || '',  // 이력서 타이틀 (선택)
    jobUrl: data.jobUrl || '',            // 공고 링크 (선택)
    deadline: data.deadline || '',  // 지원 마감일 (선택)
    notes: data.notes || '',
    appliedAt: data.appliedAt || '',
    result: data.result || '', // 지원 결과
  };
}
