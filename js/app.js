// ── 앱 진입점 ─────────────────────────────────────────
const App = {
  currentView: 'master',
  currentMasterTab: (['personal','summary','experience','project'].includes(localStorage.getItem('activeTab')) ? localStorage.getItem('activeTab') : 'personal'),

  init() {
    const profile = Store.getProfile();
    if (!profile.id) Store.saveProfile(createProfile());
    Store.migrateCompanies();
    this._seedSampleData();

    this.renderMasterTabs();
    this.renderMasterTab(this.currentMasterTab);
    VersionManager.renderVersionSidebar();
    this.updateVersionBadge();
    this.updateAiKeyBadge();
  },

  _seedSampleData() {
    if (Store.getCompany('sc1')) return; // 이미 샘플 데이터 있으면 건너뜀

    const companies = [
      { id: 'sc1', name: '카카오페이',  createdAt: '2025-10-01T09:00:00.000Z' },
      { id: 'sc2', name: '토스',        createdAt: '2025-10-10T09:00:00.000Z' },
      { id: 'sc3', name: '당근마켓',    createdAt: '2025-11-01T09:00:00.000Z' },
      { id: 'sc4', name: '쿠팡',        createdAt: '2025-11-20T09:00:00.000Z' },
    ];
    companies.forEach(c => Store.saveCompany(c));

    const profile = Store.getProfile();
    const pid = profile.id;
    const versions = [
      // 카카오페이
      { id:'sv1', name:'카카오페이 PO 지원용',    companyId:'sc1', targetCompany:'카카오페이', baseProfileId:pid, templateId:'modern', status:'submitted', selectedTitleId:null, selectedSummaryId:null, selectedExperienceIds:[], expOrder:[], selectedProjectIds:[], selectedSkillGroupIds:[], selectedEducationIds:[], selectedCertIds:[], overrides:{}, deadline:'2025-10-15', notes:'핀테크 도메인 강조. 결제·정산 관련 프로젝트 경험 부각.', appliedAt:'2025-10-13', result:'서류 합격', createdAt:'2025-10-05T10:00:00.000Z', updatedAt:'2025-10-12T15:00:00.000Z' },
      { id:'sv2', name:'카카오페이 시니어 PM',     companyId:'sc1', targetCompany:'카카오페이', baseProfileId:pid, templateId:'modern', status:'submitted', selectedTitleId:null, selectedSummaryId:null, selectedExperienceIds:[], expOrder:[], selectedProjectIds:[], selectedSkillGroupIds:[], selectedEducationIds:[], selectedCertIds:[], overrides:{}, deadline:'2025-10-30', notes:'시니어 포지션 지원. 팀 리드·B2B 역량 중심 재구성.', appliedAt:'2025-10-28', result:'불합격', createdAt:'2025-10-20T11:00:00.000Z', updatedAt:'2025-10-28T09:30:00.000Z' },
      // 토스
      { id:'sv3', name:'토스 PO (뱅킹) 지원용',   companyId:'sc2', targetCompany:'토스', baseProfileId:pid, templateId:'modern', status:'submitted', selectedTitleId:null, selectedSummaryId:null, selectedExperienceIds:[], expOrder:[], selectedProjectIds:[], selectedSkillGroupIds:[], selectedEducationIds:[], selectedCertIds:[], overrides:{}, deadline:'2025-11-10', notes:'토스 특유의 문제 정의→솔루션 접근 방식에 맞춰 작성. 지표 개선 수치 강조.', appliedAt:'2025-11-07', result:'1차 면접', createdAt:'2025-11-03T10:00:00.000Z', updatedAt:'2025-11-08T14:00:00.000Z' },
      { id:'sv4', name:'토스 PO (증권) 지원용',   companyId:'sc2', targetCompany:'토스', baseProfileId:pid, templateId:'modern', status:'ready',     selectedTitleId:null, selectedSummaryId:null, selectedExperienceIds:[], expOrder:[], selectedProjectIds:[], selectedSkillGroupIds:[], selectedEducationIds:[], selectedCertIds:[], overrides:{}, deadline:'2025-11-20', notes:'증권 챕터 재도전. 리텐션·전환율 지표 중심 재구성 예정.', appliedAt:'', result:'', createdAt:'2025-11-12T09:00:00.000Z', updatedAt:'2025-11-15T11:00:00.000Z' },
      { id:'sv5', name:'토스 CPO 지원용',          companyId:'sc2', targetCompany:'토스', baseProfileId:pid, templateId:'modern', status:'draft',     selectedTitleId:null, selectedSummaryId:null, selectedExperienceIds:[], expOrder:[], selectedProjectIds:[], selectedSkillGroupIds:[], selectedEducationIds:[], selectedCertIds:[], overrides:{}, deadline:'', notes:'CPO 포지션용 초안. 프로덕트 전략·조직 리드 경험 중심.', appliedAt:'', result:'', createdAt:'2025-12-01T10:00:00.000Z', updatedAt:'2025-12-01T10:00:00.000Z' },
      // 당근마켓
      { id:'sv6', name:'당근 PO (로컬커머스) 지원용', companyId:'sc3', targetCompany:'당근마켓', baseProfileId:pid, templateId:'modern', status:'ready', selectedTitleId:null, selectedSummaryId:null, selectedExperienceIds:[], expOrder:[], selectedProjectIds:[], selectedSkillGroupIds:[], selectedEducationIds:[], selectedCertIds:[], overrides:{}, deadline:'2025-12-10', notes:'로컬 커머스 특성에 맞게 구성. 전환율 개선·UX 단순화 사례 중심.', appliedAt:'', result:'', createdAt:'2025-11-25T09:00:00.000Z', updatedAt:'2025-11-30T16:00:00.000Z' },
      { id:'sv7', name:'당근 PM (광고) 지원용',    companyId:'sc3', targetCompany:'당근마켓', baseProfileId:pid, templateId:'modern', status:'draft',  selectedTitleId:null, selectedSummaryId:null, selectedExperienceIds:[], expOrder:[], selectedProjectIds:[], selectedSkillGroupIds:[], selectedEducationIds:[], selectedCertIds:[], overrides:{}, deadline:'2025-12-20', notes:'광고 프로덕트팀 지원. 수익화·광고 퍼포먼스 지표 경험 보강 필요.', appliedAt:'', result:'', createdAt:'2025-12-02T11:00:00.000Z', updatedAt:'2025-12-05T10:00:00.000Z' },
      // 쿠팡
      { id:'sv8', name:'쿠팡 PM (물류) 지원용',    companyId:'sc4', targetCompany:'쿠팡', baseProfileId:pid, templateId:'modern', status:'ready',     selectedTitleId:null, selectedSummaryId:null, selectedExperienceIds:[], expOrder:[], selectedProjectIds:[], selectedSkillGroupIds:[], selectedEducationIds:[], selectedCertIds:[], overrides:{}, deadline:'2025-12-22', notes:'운영 효율화·배송 리드타임 단축 관련 프로젝트 최우선 배치.', appliedAt:'', result:'', createdAt:'2025-12-08T09:00:00.000Z', updatedAt:'2025-12-10T14:00:00.000Z' },
      { id:'sv9', name:'쿠팡 PM (커머스) 지원용',  companyId:'sc4', targetCompany:'쿠팡', baseProfileId:pid, templateId:'modern', status:'draft',     selectedTitleId:null, selectedSummaryId:null, selectedExperienceIds:[], expOrder:[], selectedProjectIds:[], selectedSkillGroupIds:[], selectedEducationIds:[], selectedCertIds:[], overrides:{}, deadline:'', notes:'구매전환·장바구니 이탈 개선 경험 중심 재구성 예정.', appliedAt:'', result:'', createdAt:'2025-12-09T10:00:00.000Z', updatedAt:'2025-12-09T10:00:00.000Z' },
    ];
    versions.forEach(v => Store.saveVersion(v));
  },

  updateAiKeyBadge() {
    const btn = document.getElementById('ai-key-btn');
    if (!btn) return;
    const hasKey = !!AI.getApiKey();
    btn.textContent = hasKey ? '✨ AI 설정 ●' : '✨ AI 설정';
    btn.style.color = hasKey ? '#4ade80' : '';
  },

  // ── 뷰 전환 (마스터 ↔ 버전 관리) ────────────────────
  switchView(view) {
    this.currentView = view;
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    document.getElementById('nav-' + view).classList.add('active');

    if (view === 'versions') {
      // 항상 그리드 목록으로 진입
      document.getElementById('version-workspace-view').classList.add('hidden');
      document.getElementById('version-grid-view').classList.remove('hidden');
      VersionManager.renderVersionSidebar();
    }
  },

  updateVersionBadge() {
    const count = Store.listVersions().length;
    const badge = document.getElementById('version-count');
    if (badge) badge.textContent = count;
  },

  // ── 마스터 탭 ────────────────────────────────────────
  renderMasterTabs() {
    const tabs = [
      { id: 'personal',   label: '👤 개인정보' },
      { id: 'summary',    label: '📝 자기소개' },
      { id: 'experience', label: '💼 경력' },
      { id: 'project',    label: '🚀 독립 프로젝트' },
    ];
    document.getElementById('master-tab-bar').innerHTML = tabs.map(t =>
      `<button class="master-tab-btn ${t.id === this.currentMasterTab ? 'active' : ''}"
        onclick="App.renderMasterTab('${t.id}')">${t.label}</button>`
    ).join('');
  },

  renderMasterTab(tabId) {
    this.currentMasterTab = tabId;
    localStorage.setItem('activeTab', tabId);
    this.renderMasterTabs();
    const profile = Store.getProfile();
    const content = {
      personal:   () => Editor.renderPersonalTab(profile),
      summary:    () => Editor.renderSummaryTab(profile),
      experience: () => Editor.renderExperienceTab(profile),
      project:    () => Editor.renderProjectTab(profile),
      skill:      () => Editor.renderSkillTab(profile),
      education:  () => Editor.renderEducationTab(profile),
    }[tabId]?.() || '';
    document.getElementById('editor-content').innerHTML = content;
    if (tabId === 'experience' || tabId === 'project') setTimeout(() => Editor.initProjMoreButtons(), 0);
  },

  // ── 미리보기 ─────────────────────────────────────────
  refreshPreview() {
    const activeId = Store.getActiveVersionId();
    const previewEl = document.getElementById('preview-frame');
    if (!previewEl) return;

    if (!activeId) {
      previewEl.innerHTML = '<div class="preview-empty">버전을 선택하면<br>미리보기가 표시됩니다.</div>';
      return;
    }
    const resolved = Store.resolveVersion(activeId);
    if (!resolved) return;
    previewEl.innerHTML = Renderer.render(resolved, resolved.version.templateId || 'modern');
  },

  // ── 인쇄 ─────────────────────────────────────────────
  print() {
    const activeId = Store.getActiveVersionId();
    if (!activeId) { alert('먼저 버전을 선택하세요.'); return; }
    window.print();
  },

  // ── JSON 내보내기/가져오기 ────────────────────────────
  exportJSON() {
    const json = Store.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `resume-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  },

  importJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          Store.importAll(ev.target.result);
          App.init();
          showToast('가져오기 완료!');
        } catch {
          alert('파일 형식이 올바르지 않습니다.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },
};

// ── 전역 유틸 ─────────────────────────────────────────
function closeModal(id) {
  document.getElementById(id)?.remove();
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2500);
}

document.addEventListener('DOMContentLoaded', () => App.init());
