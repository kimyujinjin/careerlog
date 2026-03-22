// ── Store: Supabase 기반 (비동기) ─────────────────────
// localStorage는 activeVersionId 캐시용으로만 사용
const Store = {
  _profile: null,
  _companies: null,
  _versions: null,

  // ── 초기 로드 (앱 시작 시 1회) ────────────────────────
  async loadAll() {
    const uid = Auth.getUser()?.id;
    if (!uid) return;

    const [profRes, compRes, verRes] = await Promise.all([
      _sb.from('profiles').select('data').eq('user_id', uid).single(),
      _sb.from('companies').select('data').eq('user_id', uid).order('created_at'),
      _sb.from('versions').select('data').eq('user_id', uid).order('created_at', { ascending: false }),
    ]);

    this._profile  = profRes.data  ? profRes.data.data  : null;
    this._companies = compRes.data ? compRes.data.map(r => r.data) : [];
    this._versions  = verRes.data  ? verRes.data.map(r => r.data)  : [];

    if (!this._profile) {
      const p = createProfile();
      this._profile = p;
      await this._saveProfileRemote(p);
    }
  },

  // ── Profile ───────────────────────────────────────────
  getProfile() {
    return this._profile || createProfile();
  },
  saveProfile(profile) {
    profile.updatedAt = new Date().toISOString();
    this._profile = profile;
    this._saveProfileRemote(profile);
  },
  async _saveProfileRemote(profile) {
    const uid = Auth.getUser()?.id;
    if (!uid) return;
    await _sb.from('profiles').upsert({ user_id: uid, data: profile, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  },

  // ── Companies ─────────────────────────────────────────
  listCompanies() {
    return this._companies || [];
  },
  getCompany(id) {
    return this.listCompanies().find(c => c.id === id) || null;
  },
  saveCompany(company) {
    const list = this._companies || [];
    const idx = list.findIndex(c => c.id === company.id);
    if (idx >= 0) list[idx] = company;
    else list.push(company);
    this._companies = list;
    this._saveCompanyRemote(company);
  },
  async _saveCompanyRemote(company) {
    const uid = Auth.getUser()?.id;
    if (!uid) return;
    await _sb.from('companies').upsert({ id: company.id, user_id: uid, data: company });
  },
  deleteCompany(id) {
    this._companies = this.listCompanies().filter(c => c.id !== id);
    const uid = Auth.getUser()?.id;
    if (uid) _sb.from('companies').delete().eq('id', id).eq('user_id', uid);
  },

  migrateCompanies() {
    const versions = this.listVersions();
    const companies = this.listCompanies();
    let changed = false;
    for (const v of versions) {
      if (v.companyId) continue;
      if (!v.targetCompany) continue;
      let company = companies.find(c => c.name === v.targetCompany);
      if (!company) {
        company = createCompany({ name: v.targetCompany });
        companies.push(company);
        this._saveCompanyRemote(company);
        changed = true;
      }
      v.companyId = company.id;
      changed = true;
    }
    if (changed) {
      this._companies = companies;
      this._versions = versions;
      versions.forEach(v => this._saveVersionRemote(v));
    }
  },

  // ── Versions ──────────────────────────────────────────
  listVersions() {
    return this._versions || [];
  },
  getVersion(id) {
    return this.listVersions().find(v => v.id === id) || null;
  },
  saveVersion(version) {
    const list = this._versions || [];
    const idx = list.findIndex(v => v.id === version.id);
    version.updatedAt = new Date().toISOString();
    if (idx >= 0) list[idx] = version;
    else list.unshift(version);
    this._versions = list;
    this._saveVersionRemote(version);
  },
  async _saveVersionRemote(version) {
    const uid = Auth.getUser()?.id;
    if (!uid) return;
    await _sb.from('versions').upsert({ id: version.id, user_id: uid, data: version, updated_at: new Date().toISOString() });
  },
  deleteVersion(id) {
    const list = this.listVersions().filter(v => v.id !== id);
    this._versions = list;
    const activeId = this.getActiveVersionId();
    if (activeId === id) this.setActiveVersionId(list[0]?.id || null);
    const uid = Auth.getUser()?.id;
    if (uid) _sb.from('versions').delete().eq('id', id).eq('user_id', uid);
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

  // ── 활성 버전 (로컬 캐시) ─────────────────────────────
  getActiveVersionId() {
    return localStorage.getItem('rca_active_version') || null;
  },
  setActiveVersionId(id) {
    if (id) localStorage.setItem('rca_active_version', id);
    else localStorage.removeItem('rca_active_version');
  },

  // ── resolveVersion ────────────────────────────────────
  resolveVersion(versionId) {
    const version = this.getVersion(versionId);
    if (!version) return null;
    const profile = this.getProfile();

    const pick = (arr, ids) => {
      if (!ids || ids.length === 0) return arr;
      if (ids[0] === '__none__') return [];
      return arr.filter(item => ids.includes(item.id));
    };

    const titles = profile.titles || [];
    const selectedTitle = version.selectedTitleId
      ? titles.find(t => t.id === version.selectedTitleId) : null;

    const summaries = profile.summaries || [];
    const selectedSummary = version.selectedSummaryId
      ? summaries.find(s => s.id === version.selectedSummaryId) : null;

    const resolved = {
      personal: {
        ...profile.personal,
        title:   selectedTitle   ? selectedTitle.value  : (profile.personal.title || ''),
        summary: selectedSummary ? selectedSummary.body : '',
      },
      experiences: (() => {
        let exps = pick(profile.experiences, version.selectedExperienceIds).map(e => ({ ...e, achievements: [...e.achievements] }));
        const order = version.expOrder || [];
        if (order.length > 0) {
          exps.sort((a, b) => {
            const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
            if (ai === -1 && bi === -1) return 0;
            if (ai === -1) return 1; if (bi === -1) return -1;
            return ai - bi;
          });
        }
        return exps;
      })(),
      projects:       pick(profile.projects,       version.selectedProjectIds   ).map(p => ({ ...p, contributions: [...p.contributions], metrics: [...p.metrics] })),
      skills:         pick(profile.skills,         version.selectedSkillGroupIds).map(s => ({ ...s, items: [...s.items] })),
      educations:     pick(profile.educations,     version.selectedEducationIds ).map(e => ({ ...e })),
      certifications: pick(profile.certifications || [], version.selectedCertIds || []).map(c => ({ ...c })),
    };

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
      companies: this.listCompanies(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  },
  async importAll(jsonStr) {
    const data = JSON.parse(jsonStr);
    if (data.profile)   { this._profile = data.profile;     await this._saveProfileRemote(data.profile); }
    if (data.companies) { this._companies = data.companies;  for (const c of data.companies) await this._saveCompanyRemote(c); }
    if (data.versions)  { this._versions = data.versions;   for (const v of data.versions) await this._saveVersionRemote(v); }
  },
};

function setByPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] === undefined) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}
