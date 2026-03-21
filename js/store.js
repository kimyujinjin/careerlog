// ── localStorage 키 ───────────────────────────────────
const KEYS = {
  PROFILE: 'rca_profile',
  VERSIONS: 'rca_versions',
  ACTIVE_VERSION: 'rca_active_version',
};

// ── 내부 헬퍼 ─────────────────────────────────────────
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Profile ───────────────────────────────────────────
const Store = {
  // 프로필 (앱당 1개)
  getProfile() {
    const raw = load(KEYS.PROFILE, null);
    return raw ? raw : createProfile();
  },
  saveProfile(profile) {
    profile.updatedAt = new Date().toISOString();
    save(KEYS.PROFILE, profile);
  },

  // ── Versions ─────────────────────────────────────────
  listVersions() {
    return load(KEYS.VERSIONS, []);
  },
  getVersion(id) {
    return this.listVersions().find(v => v.id === id) || null;
  },
  saveVersion(version) {
    const list = this.listVersions();
    const idx = list.findIndex(v => v.id === version.id);
    version.updatedAt = new Date().toISOString();
    if (idx >= 0) list[idx] = version;
    else list.unshift(version);
    save(KEYS.VERSIONS, list);
  },
  deleteVersion(id) {
    const list = this.listVersions().filter(v => v.id !== id);
    save(KEYS.VERSIONS, list);
    if (this.getActiveVersionId() === id) {
      save(KEYS.ACTIVE_VERSION, list[0]?.id || null);
    }
  },
  duplicateVersion(id, newName) {
    const src = this.getVersion(id);
    if (!src) return null;
    const copy = createVersion({
      ...JSON.parse(JSON.stringify(src)),
      id: undefined,
      name: newName || src.name + ' (복사)',
      status: 'draft',
      createdAt: undefined,
      updatedAt: undefined,
    });
    this.saveVersion(copy);
    return copy;
  },

  // ── 활성 버전 ─────────────────────────────────────────
  getActiveVersionId() {
    return load(KEYS.ACTIVE_VERSION, null);
  },
  setActiveVersionId(id) {
    save(KEYS.ACTIVE_VERSION, id);
  },

  // ── resolveVersion: 오버라이드 적용 후 렌더링용 데이터 반환 ──
  resolveVersion(versionId) {
    const version = this.getVersion(versionId);
    if (!version) return null;
    const profile = this.getProfile();

    // 선택된 항목만 필터 (빈 배열 = 전체, ['__none__'] = 전체 제외)
    const pick = (arr, ids) => {
      if (ids.length === 0) return arr;
      if (ids[0] === '__none__') return [];
      return arr.filter(item => ids.includes(item.id));
    };

    // 선택된 직책 찾기
    const titles = profile.titles || [];
    const selectedTitle = version.selectedTitleId
      ? titles.find(t => t.id === version.selectedTitleId)
      : null;

    // 선택된 자기소개 찾기
    const summaries = profile.summaries || [];
    const selectedSummary = version.selectedSummaryId
      ? summaries.find(s => s.id === version.selectedSummaryId)
      : null;

    // 깊은 복사 후 오버라이드 패치
    const resolved = {
      personal: {
        ...profile.personal,
        title:   selectedTitle   ? selectedTitle.value   : (profile.personal.title || ''),
        summary: selectedSummary ? selectedSummary.body  : '',
      },
      experiences: (() => {
        let exps = pick(profile.experiences, version.selectedExperienceIds).map(e => ({ ...e, achievements: [...e.achievements] }));
        const order = version.expOrder || [];
        if (order.length > 0) {
          exps.sort((a, b) => {
            const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
            if (ai === -1 && bi === -1) return 0;
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
          });
        }
        return exps;
      })(),
      projects:    pick(profile.projects,    version.selectedProjectIds   ).map(p => ({ ...p, contributions: [...p.contributions], metrics: [...p.metrics] })),
      skills:      pick(profile.skills,      version.selectedSkillGroupIds).map(s => ({ ...s, items: [...s.items] })),
      educations:  pick(profile.educations,  version.selectedEducationIds ).map(e => ({ ...e })),
      certifications: pick(profile.certifications || [], version.selectedCertIds || []).map(c => ({ ...c })),
    };

    // 오버라이드 적용 (dot notation)
    for (const [path, value] of Object.entries(version.overrides || {})) {
      setByPath(resolved, path, value);
    }

    return { version, resolved };
  },

  // ── JSON 내보내기/가져오기 ────────────────────────────
  exportAll() {
    return JSON.stringify({
      profile: this.getProfile(),
      versions: this.listVersions(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  },
  importAll(jsonStr) {
    const data = JSON.parse(jsonStr);
    if (data.profile)  save(KEYS.PROFILE,  data.profile);
    if (data.versions) save(KEYS.VERSIONS, data.versions);
  },
};

// dot notation으로 중첩 객체 값 설정
function setByPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] === undefined) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}
