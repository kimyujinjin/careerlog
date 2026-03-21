// ── 앱 진입점 ─────────────────────────────────────────
const App = {
  currentView: 'master',
  currentMasterTab: 'personal',

  init() {
    const profile = Store.getProfile();
    if (!profile.id) Store.saveProfile(createProfile());

    this.renderMasterTabs();
    this.renderMasterTab(this.currentMasterTab);
    VersionManager.renderVersionSidebar();
    this.updateVersionBadge();
    this.updateAiKeyBadge();
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
      VersionManager.renderVersionGrid();
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
      { id: 'experience', label: '💼 경력' },
      { id: 'project',    label: '🚀 독립 프로젝트' },
      { id: 'skill',      label: '🛠 스킬' },
      { id: 'education',  label: '🎓 학력' },
    ];
    document.getElementById('master-tab-bar').innerHTML = tabs.map(t =>
      `<button class="master-tab-btn ${t.id === this.currentMasterTab ? 'active' : ''}"
        onclick="App.renderMasterTab('${t.id}')">${t.label}</button>`
    ).join('');
  },

  renderMasterTab(tabId) {
    this.currentMasterTab = tabId;
    this.renderMasterTabs();
    const profile = Store.getProfile();
    const content = {
      personal:   () => Editor.renderPersonalTab(profile),
      experience: () => Editor.renderExperienceTab(profile),
      project:    () => Editor.renderProjectTab(profile),
      skill:      () => Editor.renderSkillTab(profile),
      education:  () => Editor.renderEducationTab(profile),
    }[tabId]?.() || '';
    document.getElementById('editor-content').innerHTML = content;
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
