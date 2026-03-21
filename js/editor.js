// ── 편집기 모듈 ───────────────────────────────────────
// 각 섹션의 폼 렌더링 + 이벤트 처리

const Editor = {
  // ── 개인정보 탭 ────────────────────────────────────
  renderPersonalTab(profile) {
    const p = profile.personal;
    const titles = profile.titles || [];
    const titleList = titles.length === 0
      ? '<p class="empty-msg">직책을 추가하면 버전별로 선택할 수 있습니다.</p>'
      : titles.map(t => `
        <div class="list-card" data-id="${t.id}">
          <div class="list-card__info">
            <strong>${esc(t.value)}</strong>
            <span class="chip">${esc(t.label)}</span>
          </div>
          <div class="list-card__actions">
            <button class="btn-sm" onclick="Editor.openTitleModal('${t.id}')">편집</button>
            <button class="btn-sm btn-danger" onclick="Editor.deleteTitle('${t.id}')">삭제</button>
          </div>
        </div>`).join('');

    const summaries = profile.summaries || [];
    const summaryList = summaries.length === 0
      ? '<p class="empty-msg">자기소개를 추가하면 버전별로 선택할 수 있습니다.</p>'
      : summaries.map(s => `
        <div class="list-card" data-id="${s.id}">
          <div class="list-card__info" style="flex-direction:column; align-items:flex-start; gap:4px;">
            <strong>${esc(s.label) || '(제목 없음)'}</strong>
            <span class="summary-preview">${esc(s.body).slice(0, 80)}${s.body.length > 80 ? '…' : ''}</span>
          </div>
          <div class="list-card__actions">
            <button class="btn-sm" onclick="Editor.openSummaryModal('${s.id}')">편집</button>
            <button class="btn-sm btn-danger" onclick="Editor.deleteSummary('${s.id}')">삭제</button>
          </div>
        </div>`).join('');

    return `
    <div class="form-section">
      <div class="section-header">
        <h3>기본 정보</h3>
      </div>
      <div class="form-row">
        <label>이름</label>
        <input type="text" id="p-name" value="${esc(p.name)}" placeholder="홍길동"
          oninput="Editor.savePersonal()">
      </div>
      <div class="form-row">
        <label>이메일</label>
        <input type="email" id="p-email" value="${esc(p.email)}"
          oninput="Editor.savePersonal()">
      </div>
      <div class="form-row">
        <label>전화</label>
        <input type="text" id="p-phone" value="${esc(p.phone)}"
          oninput="Editor.savePersonal()">
      </div>
      <div class="form-row">
        <label>위치</label>
        <input type="text" id="p-location" value="${esc(p.location)}" placeholder="서울"
          oninput="Editor.savePersonal()">
      </div>
      <div class="form-row">
        <label>LinkedIn</label>
        <input type="text" id="p-linkedin" value="${esc(p.linkedin)}"
          oninput="Editor.savePersonal()">
      </div>
      <div class="form-row">
        <label>GitHub</label>
        <input type="text" id="p-github" value="${esc(p.github)}"
          oninput="Editor.savePersonal()">
      </div>

      <div class="section-header mt-16">
        <h3>직책 목록</h3>
        <button class="btn-primary" onclick="Editor.openTitleModal()">+ 직책 추가</button>
      </div>
      <p class="section-desc">버전마다 다른 직책을 선택할 수 있어요.</p>
      <div id="title-list">${titleList}</div>

      <div class="section-header mt-16">
        <h3>자기소개 목록</h3>
        <button class="btn-primary" onclick="Editor.openSummaryModal()">+ 자기소개 추가</button>
      </div>
      <p class="section-desc">버전마다 다른 자기소개를 선택할 수 있어요.</p>
      <div id="summary-list">${summaryList}</div>
    </div>`;
  },

  savePersonal() {
    const profile = Store.getProfile();
    profile.personal = {
      ...profile.personal,
      name:     document.getElementById('p-name').value,
      email:    document.getElementById('p-email').value,
      phone:    document.getElementById('p-phone').value,
      location: document.getElementById('p-location').value,
      linkedin: document.getElementById('p-linkedin').value,
      github:   document.getElementById('p-github').value,
    };
    Store.saveProfile(profile);
    App.refreshPreview();
  },

  // ── 직책 CRUD ─────────────────────────────────────
  openTitleModal(id) {
    const profile = Store.getProfile();
    const t = id ? (profile.titles || []).find(x => x.id === id) : createTitle();
    const html = `
    <div class="modal-overlay" id="title-modal">
      <div class="modal">
        <div class="modal-header">
          <h3>${id ? '직책 편집' : '직책 추가'}</h3>
          <button class="modal-close" onclick="closeModal('title-modal')">✕</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="tit-id" value="${esc(t.id)}">
          <div class="form-row">
            <label>직책명 *</label>
            <input id="tit-value" value="${esc(t.value)}" placeholder="예: Product Owner, PM, CPO">
          </div>
          <div class="form-row">
            <label>구분 레이블 (선택)</label>
            <input id="tit-label" value="${esc(t.label)}" placeholder="예: PO 강조, PM 겸용, 스타트업용">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" onclick="closeModal('title-modal')">취소</button>
          <button class="btn-primary" onclick="Editor.saveTitle()">저장</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(() => document.getElementById('tit-value').focus(), 50);
  },

  saveTitle() {
    const id = document.getElementById('tit-id').value;
    const value = document.getElementById('tit-value').value.trim();
    if (!value) { alert('직책명을 입력하세요.'); return; }
    const t = createTitle({ id, value, label: document.getElementById('tit-label').value.trim() });
    const profile = Store.getProfile();
    if (!profile.titles) profile.titles = [];
    const idx = profile.titles.findIndex(x => x.id === id);
    if (idx >= 0) profile.titles[idx] = t;
    else profile.titles.push(t);
    Store.saveProfile(profile);
    closeModal('title-modal');
    App.renderMasterTab('personal');
    showToast('직책이 저장되었습니다.');
  },

  deleteTitle(id) {
    if (!confirm('이 직책을 삭제할까요?')) return;
    const profile = Store.getProfile();
    profile.titles = (profile.titles || []).filter(t => t.id !== id);
    Store.saveProfile(profile);
    const versions = Store.listVersions();
    versions.forEach(v => {
      if (v.selectedTitleId === id) {
        v.selectedTitleId = null;
        Store.saveVersion(v);
      }
    });
    App.renderMasterTab('personal');
    App.refreshPreview();
  },

  // ── 자기소개 CRUD ──────────────────────────────────
  openSummaryModal(id) {
    const profile = Store.getProfile();
    const s = id ? (profile.summaries || []).find(x => x.id === id) : createSummary();
    const html = `
    <div class="modal-overlay" id="summary-modal">
      <div class="modal modal--wide">
        <div class="modal-header">
          <h3>${id ? '자기소개 편집' : '자기소개 추가'}</h3>
          <button class="modal-close" onclick="closeModal('summary-modal')">✕</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="sum-id" value="${esc(s.id)}">
          <div class="form-row">
            <label>제목 (버전 선택 시 구분용)</label>
            <input id="sum-label" value="${esc(s.label)}" placeholder="예: 핀테크 지원용, B2B 강조, 스타트업용">
          </div>
          <div class="form-row">
            <label>자기소개 본문</label>
            <textarea id="sum-body" rows="10" placeholder="간결하고 임팩트 있는 자기소개를 작성하세요.">${esc(s.body)}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" onclick="closeModal('summary-modal')">취소</button>
          <button class="btn-primary" onclick="Editor.saveSummary()">저장</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(() => document.getElementById('sum-label').focus(), 50);
  },

  saveSummary() {
    const id = document.getElementById('sum-id').value;
    const s = createSummary({
      id,
      label: document.getElementById('sum-label').value.trim(),
      body:  document.getElementById('sum-body').value.trim(),
    });
    const profile = Store.getProfile();
    if (!profile.summaries) profile.summaries = [];
    const idx = profile.summaries.findIndex(x => x.id === id);
    if (idx >= 0) profile.summaries[idx] = s;
    else profile.summaries.push(s);
    Store.saveProfile(profile);
    closeModal('summary-modal');
    App.renderMasterTab('personal');
    showToast('자기소개가 저장되었습니다.');
  },

  deleteSummary(id) {
    if (!confirm('이 자기소개를 삭제할까요?')) return;
    const profile = Store.getProfile();
    profile.summaries = (profile.summaries || []).filter(s => s.id !== id);
    Store.saveProfile(profile);
    // 이 자기소개를 선택 중인 버전들 초기화
    const versions = Store.listVersions();
    versions.forEach(v => {
      if (v.selectedSummaryId === id) {
        v.selectedSummaryId = null;
        Store.saveVersion(v);
      }
    });
    App.renderMasterTab('personal');
    App.refreshPreview();
  },

  // ── 경력 탭 ────────────────────────────────────────
  renderExperienceTab(profile) {
    const exps = profile.experiences;
    const projs = profile.projects || [];
    const listHtml = exps.length === 0
      ? '<p class="empty-msg">아직 경력이 없습니다. 아래 버튼으로 추가하세요.</p>'
      : exps.map((e) => {
          const expProjs = projs.filter(p => p.experienceId === e.id);
          const projListHtml = expProjs.length === 0
            ? '<p class="empty-msg empty-msg--sm">프로젝트가 없습니다.</p>'
            : expProjs.map(p => `
              <div class="list-card list-card--proj" data-id="${p.id}">
                <div class="list-card__info">
                  <span class="proj-dot">◦</span>
                  <strong>${esc(p.name)}</strong>
                  ${p.role ? `<span class="chip chip--sm">${esc(p.role)}</span>` : ''}
                  ${p.startDate ? `<span class="period">${formatPeriod(p.startDate, p.endDate)}</span>` : ''}
                </div>
                <div class="list-card__actions">
                  <button class="btn-sm" onclick="Editor.openProjModal('${p.id}')">편집</button>
                  <button class="btn-sm btn-danger" onclick="Editor.deleteProject('${p.id}')">삭제</button>
                </div>
              </div>`).join('');

          return `
          <div class="exp-card" data-id="${e.id}" draggable="true"
            ondragstart="Editor.onExpDragStart(event, '${e.id}')"
            ondragover="Editor.onExpDragOver(event)"
            ondragleave="Editor.onExpDragLeave(event)"
            ondrop="Editor.onExpDrop(event, '${e.id}')"
            ondragend="Editor.onExpDragEnd(event)">
            <div class="exp-card__header">
              <span class="drag-handle" title="드래그해서 순서 변경">⠿</span>
              <div class="exp-card__info">
                <strong>${esc(e.company)}</strong>
                ${e.department ? `<span class="chip">${esc(e.department)}</span>` : ''}
                ${e.role ? `<span class="chip">${esc(e.role)}</span>` : ''}
                <span class="period">${formatPeriod(e.startDate, e.endDate, e.isCurrent)}</span>
              </div>
              <div class="exp-card__actions">
                <button class="btn-sm" onclick="Editor.openExpModal('${e.id}')">편집</button>
                <button class="btn-sm btn-danger" onclick="Editor.deleteExperience('${e.id}')">삭제</button>
              </div>
            </div>
            <div class="exp-card__projects">
              <div class="exp-proj-header">
                <span class="exp-proj-label">주요 프로젝트</span>
                <button class="btn-sm btn-outline" onclick="Editor.openProjModal(null, '${e.id}')">+ 프로젝트 추가</button>
              </div>
              <div class="exp-proj-list" id="proj-list-${e.id}">${projListHtml}</div>
            </div>
          </div>`;
        }).join('');

    return `
    <div class="form-section">
      <div class="section-header">
        <h3>경력 목록</h3>
        <button class="btn-primary" onclick="Editor.openExpModal()">+ 경력 추가</button>
      </div>
      <div id="exp-list">${listHtml}</div>
    </div>`;
  },

  openExpModal(id) {
    const profile = Store.getProfile();
    const e = id ? profile.experiences.find(x => x.id === id) : createExperience();
    const isNew = !id;

    const html = `
    <div class="modal-overlay" id="exp-modal">
      <div class="modal">
        <div class="modal-header">
          <h3>${isNew ? '경력 추가' : '경력 편집'}</h3>
          <button class="modal-close" onclick="closeModal('exp-modal')">✕</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="em-id" value="${esc(e.id)}">
          <div class="form-row">
            <label>회사명 *</label>
            <input id="em-company" value="${esc(e.company)}" placeholder="(주)회사명">
          </div>
          <div class="form-row">
            <label>부서</label>
            <input id="em-dept" value="${esc(e.department)}" placeholder="프로덕트팀">
          </div>
          <div class="form-row">
            <label>직책/직급 *</label>
            <input id="em-role" value="${esc(e.role)}" placeholder="Product Owner">
          </div>
          <div class="form-row-group">
            <div class="form-row">
              <label>시작일</label>
              <input id="em-start" type="month" value="${esc(e.startDate)}">
            </div>
            <div class="form-row">
              <label>종료일</label>
              <input id="em-end" type="month" value="${esc(e.endDate)}" ${e.isCurrent ? 'disabled' : ''}>
              <label class="checkbox-label">
                <input type="checkbox" id="em-current" ${e.isCurrent ? 'checked' : ''}
                  onchange="document.getElementById('em-end').disabled=this.checked"> 재직 중
              </label>
            </div>
          </div>
          <div class="form-row form-row--full">
            <label>업무 설명 (선택)</label>
            <textarea id="em-desc" rows="2">${esc(e.description)}</textarea>
          </div>
          <div class="form-row form-row--full">
            <label>주요 성과 / 업무</label>
            <div id="em-achievements">
              ${(e.achievements.length ? e.achievements : ['']).map((a, i) => `
                <div class="bullet-row">
                  <input class="bullet-input" value="${esc(a)}" placeholder="• 성과를 입력하세요 (숫자로 임팩트 강조 추천)">
                  <button class="btn-icon" onclick="Editor.removeBullet(this)">−</button>
                </div>`).join('')}
            </div>
            <button class="btn-sm mt-4" onclick="Editor.addBullet('em-achievements')">+ 항목 추가</button>
          </div>
          <div class="form-row form-row--full">
            <label>태그 (쉼표로 구분)</label>
            <input id="em-tags" value="${esc(e.tags.join(', '))}">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" onclick="closeModal('exp-modal')">취소</button>
          <button class="btn-primary" onclick="Editor.saveExperience()">저장</button>
        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
  },

  saveExperience() {
    const id = document.getElementById('em-id').value;
    const achievements = [...document.querySelectorAll('#em-achievements .bullet-input')]
      .map(i => i.value.trim()).filter(Boolean);
    const tags = document.getElementById('em-tags').value
      .split(',').map(t => t.trim()).filter(Boolean);

    const exp = createExperience({
      id,
      company:    document.getElementById('em-company').value.trim(),
      department: document.getElementById('em-dept').value.trim(),
      role:       document.getElementById('em-role').value.trim(),
      startDate:  document.getElementById('em-start').value,
      endDate:    document.getElementById('em-end').value,
      isCurrent:  document.getElementById('em-current').checked,
      description: document.getElementById('em-desc').value.trim(),
      achievements, tags,
    });

    const profile = Store.getProfile();
    const idx = profile.experiences.findIndex(e => e.id === id);
    if (idx >= 0) profile.experiences[idx] = exp;
    else profile.experiences.unshift(exp);
    Store.saveProfile(profile);

    closeModal('exp-modal');
    App.renderMasterTab('experience');
    App.refreshPreview();
    showToast('경력이 저장되었습니다.');
  },

  deleteExperience(id) {
    if (!confirm('이 경력 항목을 삭제할까요?')) return;
    const profile = Store.getProfile();
    profile.experiences = profile.experiences.filter(e => e.id !== id);
    Store.saveProfile(profile);
    App.renderMasterTab('experience');
    App.refreshPreview();
  },

  // ── 프로젝트 탭 (독립 프로젝트: 경력에 연결되지 않은 것) ────
  renderProjectTab(profile, filterQuery = '', filterCompany = '', filterType = '') {
    const allProjs = profile.projects;
    // 경력에 연결된 ID 목록
    const expIds = new Set((profile.experiences || []).map(e => e.id));
    const projs = allProjs.filter(p => !p.experienceId || !expIds.has(p.experienceId));

    // 회사 목록 (중복 제거)
    const companies = [...new Set(projs.map(p => p.company).filter(Boolean))];

    // 필터 적용
    const filtered = projs.filter(p => {
      const matchQuery = !filterQuery ||
        p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        p.company.toLowerCase().includes(filterQuery.toLowerCase()) ||
        p.role.toLowerCase().includes(filterQuery.toLowerCase());
      const matchCompany = !filterCompany || p.company === filterCompany;
      const matchType = !filterType || p.projectType === filterType;
      return matchQuery && matchCompany && matchType;
    });

    const listHtml = projs.length === 0
      ? '<p class="empty-msg">경력에 연결되지 않은 독립 프로젝트가 없습니다.</p>'
      : filtered.length === 0
        ? '<p class="empty-msg">검색 결과가 없습니다.</p>'
        : filtered.map(p => `
          <div class="list-card" data-id="${p.id}">
            <div class="list-card__info">
              <strong>${esc(p.name)}</strong>
              ${p.role ? `<span class="chip">${esc(p.role)}</span>` : ''}
              ${p.company ? `<span class="period">${esc(p.company)}</span>` : ''}
            </div>
            <div class="list-card__actions">
              <button class="btn-sm" onclick="Editor.openProjModal('${p.id}')">편집</button>
              <button class="btn-sm btn-danger" onclick="Editor.deleteProject('${p.id}')">삭제</button>
            </div>
          </div>`).join('');

    const companyOptions = companies.map(c =>
      `<option value="${esc(c)}" ${filterCompany === c ? 'selected' : ''}>${esc(c)}</option>`
    ).join('');

    const PROJECT_TYPES = ['개선','신규','리뉴얼','UI/GUI','콘텐츠/상세페이지','제안서/PPT'];
    const typeOptions = PROJECT_TYPES.map(t =>
      `<option value="${esc(t)}" ${filterType === t ? 'selected' : ''}>${esc(t)}</option>`
    ).join('');

    const hasFilter = filterQuery || filterCompany || filterType;

    return `
    <div class="form-section">
      <div class="section-header">
        <h3>독립 프로젝트 <span class="list-count">${filtered.length}/${projs.length}</span></h3>
        <button class="btn-primary" onclick="Editor.openProjModal()">+ 프로젝트 추가</button>
      </div>
      <p class="section-desc">경력에 연결되지 않은 프로젝트입니다. 경력별 프로젝트는 💼 경력 탭에서 추가하세요.</p>
      <div class="filter-bar">
        <input class="filter-input" type="text" placeholder="프로젝트명, 회사, 역할 검색…"
          value="${esc(filterQuery)}"
          oninput="Editor.filterProjects(this.value, document.getElementById('proj-company-filter').value, document.getElementById('proj-type-filter').value)">
        <select id="proj-company-filter" class="filter-select"
          onchange="Editor.filterProjects(document.querySelector('.filter-input').value, this.value, document.getElementById('proj-type-filter').value)">
          <option value="">전체 회사</option>
          ${companyOptions}
        </select>
        <select id="proj-type-filter" class="filter-select"
          onchange="Editor.filterProjects(document.querySelector('.filter-input').value, document.getElementById('proj-company-filter').value, this.value)">
          <option value="">전체 유형</option>
          ${typeOptions}
        </select>
        ${hasFilter ? `<button class="filter-reset" onclick="Editor.filterProjects('','','')">초기화 ✕</button>` : ''}
      </div>
      <div id="proj-list">${listHtml}</div>
    </div>`;
  },

  filterProjects(query, company, type = '') {
    const profile = Store.getProfile();
    document.getElementById('editor-content').innerHTML =
      Editor.renderProjectTab(profile, query, company, type);
  },

  openProjModal(id, defaultExpId) {
    const profile = Store.getProfile();
    const p = id ? profile.projects.find(x => x.id === id) : createProject({ experienceId: defaultExpId || '' });
    const isNew = !id;

    const html = `
    <div class="modal-overlay" id="proj-modal">
      <div class="modal modal--wide">
        <div class="modal-header">
          <h3>${isNew ? '프로젝트 추가' : '프로젝트 편집'}</h3>
          <button class="modal-close" onclick="closeModal('proj-modal')">✕</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="pm-id" value="${esc(p.id)}">
          <div class="form-row form-row--full">
            <label>프로젝트 유형 <span class="label-hint">(필터용, 이력서에 미표시)</span></label>
            <div class="type-chip-group" id="pm-type-group">
              ${['개선','신규','리뉴얼','UI/GUI','콘텐츠/상세페이지','제안서/PPT'].map(t => `
                <button type="button" class="type-chip ${p.projectType === t ? 'active' : ''}"
                  onclick="Editor.toggleTypeChip(this, '${esc(t)}')">${esc(t)}</button>
              `).join('')}
            </div>
            <input type="hidden" id="pm-type" value="${esc(p.projectType || '')}">
          </div>
          <div class="form-row">
            <label>소속 경력 <span class="label-hint">(선택하면 해당 경력 하위에 묶여서 표시)</span></label>
            <select id="pm-exp-id">
              <option value="">경력에 묶지 않음 (독립 프로젝트)</option>
              ${profile.experiences.map(e =>
                `<option value="${e.id}" ${p.experienceId === e.id ? 'selected' : ''}>
                  ${esc(e.company)}${e.role ? ' · ' + esc(e.role) : ''}
                </option>`
              ).join('')}
            </select>
          </div>
          <div class="form-row">
            <label>프로젝트명 *</label>
            <input id="pm-name" value="${esc(p.name)}">
          </div>
          <div class="form-row">
            <label>소속 회사 <span class="label-hint">(독립 프로젝트일 때)</span></label>
            <input id="pm-company" value="${esc(p.company)}">
          </div>
          <div class="form-row">
            <label>역할</label>
            <input id="pm-role" value="${esc(p.role)}" placeholder="PO / PM / Lead">
          </div>
          <div class="form-row-group">
            <div class="form-row">
              <label>시작일</label>
              <input id="pm-start" type="month" value="${esc(p.startDate)}">
            </div>
            <div class="form-row">
              <label>종료일</label>
              <input id="pm-end" type="month" value="${esc(p.endDate)}">
            </div>
          </div>
          <div class="form-row form-row--full">
            <label>프로젝트 설명</label>
            <textarea id="pm-desc" rows="3">${esc(p.description)}</textarea>
          </div>
          <div class="form-row form-row--full">
            <label>정량 성과 (배지로 표시됨)</label>
            <div id="pm-metrics">
              ${(p.metrics.length ? p.metrics : ['']).map(m => `
                <div class="bullet-row">
                  <input class="bullet-input" value="${esc(m)}" placeholder="예: MAU 30% 성장, 전환율 15%p 개선">
                  <button class="btn-icon" onclick="Editor.removeBullet(this)">−</button>
                </div>`).join('')}
            </div>
            <button class="btn-sm mt-4" onclick="Editor.addBullet('pm-metrics')">+ 성과 추가</button>
          </div>
          <div class="form-row form-row--full">
            <label>주요 기여</label>
            <div id="pm-contributions">
              ${(p.contributions.length ? p.contributions : ['']).map(c => `
                <div class="bullet-row">
                  <input class="bullet-input" value="${esc(c)}" placeholder="• 기여 내용">
                  <button class="btn-icon" onclick="Editor.removeBullet(this)">−</button>
                </div>`).join('')}
            </div>
            <button class="btn-sm mt-4" onclick="Editor.addBullet('pm-contributions')">+ 항목 추가</button>
          </div>
          <div class="form-row form-row--full">
            <label>사용 도구 (쉼표 구분)</label>
            <input id="pm-tech" value="${esc(p.techStack.join(', '))}">
          </div>
          <div class="form-row form-row--full">
            <label>태그 (쉼표 구분)</label>
            <input id="pm-tags" value="${esc(p.tags.join(', '))}">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" onclick="closeModal('proj-modal')">취소</button>
          <button class="btn-primary" onclick="Editor.saveProject()">저장</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  saveProject() {
    const id = document.getElementById('pm-id').value;
    const metrics = [...document.querySelectorAll('#pm-metrics .bullet-input')]
      .map(i => i.value.trim()).filter(Boolean);
    const contributions = [...document.querySelectorAll('#pm-contributions .bullet-input')]
      .map(i => i.value.trim()).filter(Boolean);
    const techStack = document.getElementById('pm-tech').value.split(',').map(t=>t.trim()).filter(Boolean);
    const tags = document.getElementById('pm-tags').value.split(',').map(t=>t.trim()).filter(Boolean);

    const proj = createProject({
      id,
      experienceId: document.getElementById('pm-exp-id').value,
      name:     document.getElementById('pm-name').value.trim(),
      company:  document.getElementById('pm-company').value.trim(),
      role:     document.getElementById('pm-role').value.trim(),
      startDate: document.getElementById('pm-start').value,
      endDate:   document.getElementById('pm-end').value,
      description: document.getElementById('pm-desc').value.trim(),
      projectType: document.getElementById('pm-type').value,
      metrics, contributions, techStack, tags,
    });

    const profile = Store.getProfile();
    const idx = profile.projects.findIndex(p => p.id === id);
    if (idx >= 0) profile.projects[idx] = proj;
    else profile.projects.unshift(proj);
    Store.saveProfile(profile);

    closeModal('proj-modal');
    // 소속 경력이 있으면 경력 탭, 없으면 프로젝트 탭 갱신
    const savedExpId = proj.experienceId;
    if (savedExpId) {
      App.renderMasterTab('experience');
    } else {
      App.renderMasterTab('project');
    }
    App.refreshPreview();
    showToast('프로젝트가 저장되었습니다.');
  },

  deleteProject(id) {
    if (!confirm('이 프로젝트를 삭제할까요?')) return;
    const profile = Store.getProfile();
    const proj = profile.projects.find(p => p.id === id);
    const hadExp = proj && proj.experienceId;
    profile.projects = profile.projects.filter(p => p.id !== id);
    Store.saveProfile(profile);
    if (hadExp) {
      App.renderMasterTab('experience');
    } else {
      App.renderMasterTab('project');
    }
    App.refreshPreview();
  },

  // ── 스킬 탭 ────────────────────────────────────────
  renderSkillTab(profile) {
    const skills = profile.skills;
    const listHtml = skills.length === 0
      ? '<p class="empty-msg">스킬 그룹을 추가하세요.</p>'
      : skills.map(s => `
        <div class="list-card" data-id="${s.id}">
          <div class="list-card__info">
            <strong>${esc(s.category)}</strong>
            <span class="period">${s.items.map(esc).join(' · ')}</span>
          </div>
          <div class="list-card__actions">
            <button class="btn-sm" onclick="Editor.openSkillModal('${s.id}')">편집</button>
            <button class="btn-sm btn-danger" onclick="Editor.deleteSkill('${s.id}')">삭제</button>
          </div>
        </div>`).join('');
    return `
    <div class="form-section">
      <div class="section-header">
        <h3>보유 역량</h3>
        <button class="btn-primary" onclick="Editor.openSkillModal()">+ 그룹 추가</button>
      </div>
      <div id="skill-list">${listHtml}</div>
    </div>`;
  },

  openSkillModal(id) {
    const profile = Store.getProfile();
    const s = id ? profile.skills.find(x => x.id === id) : createSkillGroup();
    const html = `
    <div class="modal-overlay" id="skill-modal">
      <div class="modal">
        <div class="modal-header">
          <h3>${id ? '스킬 편집' : '스킬 추가'}</h3>
          <button class="modal-close" onclick="closeModal('skill-modal')">✕</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="sm-id" value="${esc(s.id)}">
          <div class="form-row">
            <label>카테고리</label>
            <input id="sm-category" value="${esc(s.category)}" placeholder="협업툴, 분석툴, 방법론 등">
          </div>
          <div class="form-row form-row--full">
            <label>항목 (쉼표로 구분)</label>
            <input id="sm-items" value="${esc(s.items.join(', '))}">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" onclick="closeModal('skill-modal')">취소</button>
          <button class="btn-primary" onclick="Editor.saveSkill()">저장</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  saveSkill() {
    const id = document.getElementById('sm-id').value;
    const items = document.getElementById('sm-items').value.split(',').map(t=>t.trim()).filter(Boolean);
    const sg = createSkillGroup({ id, category: document.getElementById('sm-category').value.trim(), items });
    const profile = Store.getProfile();
    const idx = profile.skills.findIndex(s => s.id === id);
    if (idx >= 0) profile.skills[idx] = sg;
    else profile.skills.push(sg);
    Store.saveProfile(profile);
    closeModal('skill-modal');
    App.renderMasterTab('skill');
    App.refreshPreview();
    showToast('저장되었습니다.');
  },

  deleteSkill(id) {
    if (!confirm('삭제할까요?')) return;
    const profile = Store.getProfile();
    profile.skills = profile.skills.filter(s => s.id !== id);
    Store.saveProfile(profile);
    App.renderMasterTab('skill');
    App.refreshPreview();
  },

  // ── 학력 탭 ────────────────────────────────────────
  renderEducationTab(profile) {
    const edus = profile.educations;
    const certs = profile.certifications || [];
    const eduHtml = edus.length === 0
      ? '<p class="empty-msg">학력을 추가하세요.</p>'
      : edus.map(e => `
        <div class="list-card" data-id="${e.id}">
          <div class="list-card__info">
            <strong>${esc(e.school)}</strong>
            <span class="chip">${esc(e.degree)} ${esc(e.major)}</span>
            <span class="period">${formatPeriod(e.startDate, e.endDate)}</span>
          </div>
          <div class="list-card__actions">
            <button class="btn-sm" onclick="Editor.openEduModal('${e.id}')">편집</button>
            <button class="btn-sm btn-danger" onclick="Editor.deleteEdu('${e.id}')">삭제</button>
          </div>
        </div>`).join('');
    const certHtml = certs.length === 0 ? '' : certs.map(c => `
        <div class="list-card" data-id="${c.id}">
          <div class="list-card__info">
            <strong>${esc(c.name)}</strong>
            <span class="chip">${esc(c.issuer)}</span>
            <span class="period">${esc(c.date)}</span>
          </div>
          <div class="list-card__actions">
            <button class="btn-sm" onclick="Editor.openCertModal('${c.id}')">편집</button>
            <button class="btn-sm btn-danger" onclick="Editor.deleteCert('${c.id}')">삭제</button>
          </div>
        </div>`).join('');
    return `
    <div class="form-section">
      <div class="section-header"><h3>학력</h3>
        <button class="btn-primary" onclick="Editor.openEduModal()">+ 학력 추가</button>
      </div>
      <div id="edu-list">${eduHtml}</div>
      <div class="section-header mt-16"><h3>자격증 / 수료</h3>
        <button class="btn-primary" onclick="Editor.openCertModal()">+ 추가</button>
      </div>
      <div id="cert-list">${certHtml || '<p class="empty-msg">없습니다.</p>'}</div>
    </div>`;
  },

  openEduModal(id) {
    const profile = Store.getProfile();
    const e = id ? profile.educations.find(x => x.id === id) : createEducation();
    const html = `
    <div class="modal-overlay" id="edu-modal">
      <div class="modal">
        <div class="modal-header">
          <h3>${id ? '학력 편집' : '학력 추가'}</h3>
          <button class="modal-close" onclick="closeModal('edu-modal')">✕</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="edm-id" value="${esc(e.id)}">
          <div class="form-row"><label>학교명</label><input id="edm-school" value="${esc(e.school)}"></div>
          <div class="form-row"><label>전공</label><input id="edm-major" value="${esc(e.major)}"></div>
          <div class="form-row"><label>학위</label><input id="edm-degree" value="${esc(e.degree)}" placeholder="학사/석사/박사"></div>
          <div class="form-row-group">
            <div class="form-row"><label>입학</label><input id="edm-start" type="month" value="${esc(e.startDate)}"></div>
            <div class="form-row"><label>졸업</label><input id="edm-end" type="month" value="${esc(e.endDate)}"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" onclick="closeModal('edu-modal')">취소</button>
          <button class="btn-primary" onclick="Editor.saveEdu()">저장</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  saveEdu() {
    const id = document.getElementById('edm-id').value;
    const edu = createEducation({
      id,
      school: document.getElementById('edm-school').value.trim(),
      major:  document.getElementById('edm-major').value.trim(),
      degree: document.getElementById('edm-degree').value.trim(),
      startDate: document.getElementById('edm-start').value,
      endDate:   document.getElementById('edm-end').value,
    });
    const profile = Store.getProfile();
    const idx = profile.educations.findIndex(e => e.id === id);
    if (idx >= 0) profile.educations[idx] = edu;
    else profile.educations.push(edu);
    Store.saveProfile(profile);
    closeModal('edu-modal');
    App.renderMasterTab('education');
    App.refreshPreview();
    showToast('저장되었습니다.');
  },

  deleteEdu(id) {
    if (!confirm('삭제할까요?')) return;
    const profile = Store.getProfile();
    profile.educations = profile.educations.filter(e => e.id !== id);
    Store.saveProfile(profile);
    App.renderMasterTab('education');
    App.refreshPreview();
  },

  openCertModal(id) {
    const profile = Store.getProfile();
    const certs = profile.certifications || [];
    const c = id ? certs.find(x => x.id === id) : createCertification();
    const html = `
    <div class="modal-overlay" id="cert-modal">
      <div class="modal">
        <div class="modal-header">
          <h3>${id ? '편집' : '자격증/수료 추가'}</h3>
          <button class="modal-close" onclick="closeModal('cert-modal')">✕</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="cm-id" value="${esc(c.id)}">
          <div class="form-row"><label>이름</label><input id="cm-name" value="${esc(c.name)}"></div>
          <div class="form-row"><label>발급기관</label><input id="cm-issuer" value="${esc(c.issuer)}"></div>
          <div class="form-row"><label>취득일</label><input id="cm-date" type="month" value="${esc(c.date)}"></div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" onclick="closeModal('cert-modal')">취소</button>
          <button class="btn-primary" onclick="Editor.saveCert()">저장</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  saveCert() {
    const id = document.getElementById('cm-id').value;
    const cert = createCertification({
      id,
      name:   document.getElementById('cm-name').value.trim(),
      issuer: document.getElementById('cm-issuer').value.trim(),
      date:   document.getElementById('cm-date').value,
    });
    const profile = Store.getProfile();
    if (!profile.certifications) profile.certifications = [];
    const idx = profile.certifications.findIndex(c => c.id === id);
    if (idx >= 0) profile.certifications[idx] = cert;
    else profile.certifications.push(cert);
    Store.saveProfile(profile);
    closeModal('cert-modal');
    App.renderMasterTab('education');
    App.refreshPreview();
    showToast('저장되었습니다.');
  },

  deleteCert(id) {
    if (!confirm('삭제할까요?')) return;
    const profile = Store.getProfile();
    profile.certifications = (profile.certifications || []).filter(c => c.id !== id);
    Store.saveProfile(profile);
    App.renderMasterTab('education');
    App.refreshPreview();
  },

  // ── 불릿 헬퍼 ──────────────────────────────────────
  addBullet(containerId) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'bullet-row';
    div.innerHTML = `<input class="bullet-input" placeholder="항목 입력">
      <button class="btn-icon" onclick="Editor.removeBullet(this)">−</button>`;
    container.appendChild(div);
    div.querySelector('input').focus();
  },
  removeBullet(btn) {
    const rows = btn.closest('[id]').querySelectorAll('.bullet-row');
    if (rows.length <= 1) { btn.previousElementSibling.value = ''; return; }
    btn.parentElement.remove();
  },

  toggleTypeChip(btn, value) {
    const isActive = btn.classList.contains('active');
    btn.closest('#pm-type-group').querySelectorAll('.type-chip').forEach(c => c.classList.remove('active'));
    document.getElementById('pm-type').value = isActive ? '' : value;
    if (!isActive) btn.classList.add('active');
  },

  // ── 경력 드래그 앤 드롭 순서 변경 ──────────────────
  _dragSrcId: null,

  onExpDragStart(event, id) {
    this._dragSrcId = id;
    event.dataTransfer.effectAllowed = 'move';
    event.currentTarget.classList.add('dragging');
  },

  onExpDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const card = event.currentTarget;
    if (card.dataset.id !== this._dragSrcId) {
      card.classList.add('drag-over');
    }
  },

  onExpDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
  },

  onExpDrop(event, targetId) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    if (this._dragSrcId === targetId) return;

    const profile = Store.getProfile();
    const exps = profile.experiences;
    const srcIdx = exps.findIndex(e => e.id === this._dragSrcId);
    const tgtIdx = exps.findIndex(e => e.id === targetId);
    if (srcIdx < 0 || tgtIdx < 0) return;

    const [moved] = exps.splice(srcIdx, 1);
    exps.splice(tgtIdx, 0, moved);
    Store.saveProfile(profile);
    App.renderMasterTab('experience');
    App.refreshPreview();
  },

  onExpDragEnd(event) {
    event.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.exp-card').forEach(c => c.classList.remove('drag-over'));
    this._dragSrcId = null;
  },
};
