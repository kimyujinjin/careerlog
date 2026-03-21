// ── 버전 관리 모듈 ────────────────────────────────────
const VersionManager = {

  // ── 버전 그리드 렌더링 ────────────────────────────────
  renderVersionSidebar() {
    this.renderVersionGrid();
  },

  renderVersionGrid(query = '') {
    const versions = Store.listVersions();
    const q = query.toLowerCase();
    const filtered = q
      ? versions.filter(v =>
          v.name.toLowerCase().includes(q) ||
          (v.targetCompany || '').toLowerCase().includes(q))
      : versions;

    const gridHtml = filtered.length === 0
      ? `<div class="vgrid-empty">
          <div class="empty-icon">📄</div>
          <p>${q ? '검색 결과가 없습니다.' : '아직 버전이 없습니다.<br>새 버전을 만들어보세요.'}</p>
          ${!q ? `<button class="btn-primary mt-12" onclick="VersionManager.openCreateModal()">+ 새 버전 만들기</button>` : ''}
        </div>`
      : filtered.map(v => this._vgridCardHtml(v)).join('');

    const gridEl = document.getElementById('version-grid');
    if (gridEl) gridEl.innerHTML = gridHtml;
  },

  _vgridCardHtml(v) {
    const diff = v.deadline
      ? Math.ceil((new Date(v.deadline) - new Date().setHours(0,0,0,0)) / 86400000)
      : null;
    const deadlineHtml = diff !== null
      ? `<span class="vcard-deadline${diff <= 3 ? ' urgent' : diff <= 7 ? ' warn' : ''}">${diff < 0 ? '마감' : diff === 0 ? 'D-Day' : `D-${diff}`}</span>`
      : '';
    const updatedDate = v.updatedAt ? new Date(v.updatedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '';

    return `
      <div class="vgrid-card" onclick="VersionManager.showVersion('${v.id}')">
        <div class="vgrid-card__tab"></div>
        <div class="vgrid-card__folder">
          <div class="vgrid-card__inner-doc">
            <div class="vgrid-card__inner-line"></div>
            <div class="vgrid-card__inner-line short"></div>
            <div class="vgrid-card__inner-line xshort"></div>
          </div>
          <div class="vgrid-card__actions" onclick="event.stopPropagation()">
            <button class="btn-icon" title="복사" onclick="VersionManager.duplicate('${v.id}')">⧉</button>
            <button class="btn-icon" title="삭제" onclick="VersionManager.delete('${v.id}')">✕</button>
          </div>
          <div class="vgrid-card__info">
            <div class="vgrid-card__name">${esc(v.name)}</div>
            ${v.targetCompany ? `<div class="vgrid-card__company">${esc(v.targetCompany)}</div>` : ''}
            <div class="vgrid-card__meta">
              <span class="status-chip status-${v.status}">${statusLabel(v.status)}</span>
              ${deadlineHtml}
              <span class="vgrid-card__date">${updatedDate}</span>
            </div>
          </div>
        </div>
      </div>`;
  },

  filterGrid(query) {
    this.renderVersionGrid(query);
  },

  // ── 버전 선택 → 워크스페이스 표시 ───────────────────
  showVersion(id) {
    Store.setActiveVersionId(id);

    document.getElementById('version-grid-view').classList.add('hidden');
    document.getElementById('version-workspace-view').classList.remove('hidden');

    this.renderVersionHeader(id);
    this.renderItemSelector(id);
    App.refreshPreview();
  },

  // ── 그리드로 돌아가기 ────────────────────────────────
  backToGrid() {
    document.getElementById('version-workspace-view').classList.add('hidden');
    document.getElementById('version-grid-view').classList.remove('hidden');
    this.renderVersionGrid();
  },

  // ── 버전 헤더 (이름, 회사, 상태, 템플릿) ─────────────
  renderVersionHeader(id) {
    const v = Store.getVersion(id);
    if (!v) return;
    document.getElementById('version-header-bar').innerHTML = `
      <div class="vh-left">
        <button class="vh-back" onclick="VersionManager.backToGrid()">← 목록으로</button>
        <input class="vh-name" value="${esc(v.name)}" placeholder="버전 이름"
          onblur="VersionManager.updateField('${id}', 'name', this.value)">
        <input class="vh-company" value="${esc(v.targetCompany)}" placeholder="지원 회사 (선택)"
          onblur="VersionManager.updateField('${id}', 'targetCompany', this.value)">
      </div>
      <div class="vh-right">
        <label class="vh-label">마감일</label>
        <input type="date" class="vh-date" value="${esc(v.deadline || '')}"
          onchange="VersionManager.updateField('${id}', 'deadline', this.value)">
        <label class="vh-label">템플릿</label>
        <select onchange="VersionManager.updateField('${id}', 'templateId', this.value)">
          <option value="modern"  ${v.templateId==='modern'  ?'selected':''}>모던</option>
          <option value="classic" ${v.templateId==='classic' ?'selected':''}>클래식</option>
        </select>
        <label class="vh-label">상태</label>
        <select onchange="VersionManager.updateField('${id}', 'status', this.value)">
          ${['draft','ready','submitted'].map(s =>
            `<option value="${s}" ${v.status===s?'selected':''}>${statusLabel(s)}</option>`
          ).join('')}
        </select>
        <button class="btn-ai btn-sm" onclick="AI.openDraftModal('${id}')">✨ AI 초안</button>
        <button class="btn-primary btn-sm" onclick="App.print()">인쇄 / PDF</button>
      </div>`;
  },

  // ── 항목 선택기 (마스터 데이터 체크박스) ─────────────
  renderItemSelector(id) {
    const v = Store.getVersion(id);
    const profile = Store.getProfile();

    // 경력/프로젝트용 모달 선택 섹션 생성
    const makeModalSection = (title, items, selectedIds, type, labelFn, subLabelFn) => {
      const isAll  = selectedIds.length === 0;
      const isNone = selectedIds.length === 1 && selectedIds[0] === '__none__';
      const selectedItems = isAll ? items : (isNone ? [] : items.filter(i => selectedIds.includes(i.id)));
      const count = selectedItems.length;
      const total = items.length;

      if (items.length === 0) return `
        <div class="sel-section">
          <div class="sel-section-title">${title}</div>
          <p class="sel-empty">마스터 데이터에 항목이 없습니다.
            <button class="btn-link" onclick="App.switchView('master')">추가하러 가기 →</button>
          </p>
        </div>`;

      const chips = isAll
        ? `<span class="sel-count-chip all">전체 ${total}개</span>`
        : count === 0
          ? `<span class="sel-count-chip none">선택 없음</span>`
          : selectedItems.map(i => `<span class="sel-chip">${esc(labelFn(i))}</span>`).join('');

      return `
        <div class="sel-section">
          <div class="sel-section-title">
            <span>${title}</span>
            <button class="btn-sm" onclick="VersionManager.openItemPickModal('${id}','${type}')">선택하기</button>
          </div>
          <div class="sel-chips-wrap">${chips}</div>
        </div>`;
    };

    // 직책 섹션
    const titles = profile.titles || [];
    const selectedTitle = titles.find(t => t.id === v.selectedTitleId);
    const titleSection = `
      <div class="sel-section">
        <div class="sel-section-title">
          <span>직책</span>
          ${titles.length > 0 ? `
            <div style="display:flex;gap:6px;">
              <button class="btn-sm" onclick="VersionManager.openTitlePickModal('${id}')">선택하기</button>
              ${selectedTitle ? `<button class="btn-sm btn-danger" onclick="VersionManager.clearTitle('${id}')">해제</button>` : ''}
            </div>` : ''}
        </div>
        ${titles.length === 0
          ? `<p class="sel-empty">마스터 데이터에 직책이 없습니다.
              <button class="btn-link" onclick="App.switchView('master')">추가하러 가기 →</button></p>`
          : selectedTitle
            ? `<div class="sel-chips-wrap">
                <span class="sel-chip">${esc(selectedTitle.value)}</span>
                ${selectedTitle.label ? `<span style="font-size:11px;color:#9ba3b8;">${esc(selectedTitle.label)}</span>` : ''}
               </div>`
            : `<p class="sel-empty" style="padding:6px 0;">선택된 직책 없음</p>`
        }
      </div>`;

    // 자기소개 섹션
    const summaries = profile.summaries || [];
    const selectedSummary = summaries.find(s => s.id === v.selectedSummaryId);
    const summarySection = `
      <div class="sel-section">
        <div class="sel-section-title">
          <span>자기소개</span>
          ${summaries.length > 0 ? `
            <div style="display:flex;gap:6px;">
              <button class="btn-sm" onclick="VersionManager.openSummaryPickModal('${id}')">선택하기</button>
              ${selectedSummary ? `<button class="btn-sm btn-danger" onclick="VersionManager.clearSummary('${id}')">해제</button>` : ''}
            </div>` : ''}
        </div>
        ${summaries.length === 0
          ? `<p class="sel-empty">마스터 데이터에 자기소개가 없습니다.
              <button class="btn-link" onclick="App.switchView('master')">추가하러 가기 →</button></p>`
          : selectedSummary
            ? `<div class="sel-chips-wrap"><span class="sel-chip">${esc(selectedSummary.label) || '(제목 없음)'}</span></div>`
            : `<p class="sel-empty" style="padding:6px 0;">선택된 자기소개 없음</p>`
        }
      </div>`;

    // 경력+프로젝트 통합 섹션
    const expProjSection = (() => {
      const exps = profile.experiences;
      const projs = profile.projects || [];
      const floatingProjs = projs.filter(p => !p.experienceId || !exps.find(e => e.id === p.experienceId));

      const expIsAll  = v.selectedExperienceIds.length === 0;
      const expIsNone = v.selectedExperienceIds.length === 1 && v.selectedExperienceIds[0] === '__none__';

      const selectedExps = expIsAll ? exps : (expIsNone ? [] : exps.filter(e => v.selectedExperienceIds.includes(e.id)));

      if (exps.length === 0) return `
        <div class="sel-section">
          <div class="sel-section-title">경력</div>
          <p class="sel-empty">마스터 데이터에 경력이 없습니다.
            <button class="btn-link" onclick="App.switchView('master')">추가하러 가기 →</button>
          </p>
        </div>`;

      const expChips = expIsAll
        ? `<span class="sel-count-chip all">전체 ${exps.length}개</span>`
        : selectedExps.length === 0
          ? `<span class="sel-count-chip none">선택 없음</span>`
          : selectedExps.map(e => `<span class="sel-chip">${esc(e.company)}</span>`).join('');

      const expSection = `
        <div class="sel-section">
          <div class="sel-section-title">
            <span>경력</span>
            <button class="btn-sm" onclick="VersionManager.openExpProjPickModal('${v.id}')">선택하기</button>
          </div>
          <div class="sel-chips-wrap">${expChips}</div>
        </div>`;

      // 독립 프로젝트 섹션
      const floatIsAll  = v.selectedProjectIds.length === 0;
      const floatIsNone = v.selectedProjectIds.length === 1 && v.selectedProjectIds[0] === '__none__';
      const selectedFloating = floatIsAll ? floatingProjs : (floatIsNone ? [] : floatingProjs.filter(p => v.selectedProjectIds.includes(p.id)));

      if (floatingProjs.length === 0) return expSection;

      const floatChips = floatIsAll
        ? `<span class="sel-count-chip all">전체 ${floatingProjs.length}개</span>`
        : selectedFloating.length === 0
          ? `<span class="sel-count-chip none">선택 없음</span>`
          : selectedFloating.map(p => `<span class="sel-chip">${esc(p.name)}</span>`).join('');

      return expSection + `
        <div class="sel-section">
          <div class="sel-section-title">
            <span>독립 프로젝트</span>
            <button class="btn-sm" onclick="VersionManager.openItemPickModal('${v.id}','projects')">선택하기</button>
          </div>
          <div class="sel-chips-wrap">${floatChips}</div>
        </div>`;
    })();

    const html = titleSection + summarySection +
      expProjSection +
      makeModalSection('스킬', profile.skills, v.selectedSkillGroupIds, 'skills',
        s => s.category, () => '') +
      makeModalSection('학력', profile.educations, v.selectedEducationIds, 'education',
        e => e.school, e => e.major) +
      `<div class="sel-section">
        <div class="sel-section-title">메모</div>
        <textarea class="sel-notes" placeholder="공고 URL, 지원일 등 자유롭게 메모"
          onblur="VersionManager.updateField('${id}', 'notes', this.value)">${esc(v.notes)}</textarea>
      </div>`;

    document.getElementById('item-selector-content').innerHTML = html;
  },

  selectSummary(radio) {
    const summaryId = radio.dataset.summaryId || null;
    const versionId = radio.dataset.version;
    const version = Store.getVersion(versionId);
    if (!version) return;
    version.selectedSummaryId = summaryId || null;
    Store.saveVersion(version);
    radio.closest('.sel-list').querySelectorAll('.sel-item').forEach(el => el.classList.remove('checked'));
    radio.closest('.sel-item').classList.add('checked');
    App.refreshPreview();
  },

  clearSummary(versionId) {
    const version = Store.getVersion(versionId);
    if (!version) return;
    version.selectedSummaryId = null;
    Store.saveVersion(version);
    this.renderItemSelector(versionId);
    App.refreshPreview();
  },

  clearTitle(versionId) {
    const version = Store.getVersion(versionId);
    if (!version) return;
    version.selectedTitleId = null;
    Store.saveVersion(version);
    this.renderItemSelector(versionId);
    App.refreshPreview();
  },

  openTitlePickModal(versionId) {
    const profile = Store.getProfile();
    const titles = profile.titles || [];
    const version = Store.getVersion(versionId);

    const renderList = (filter = '') => {
      const filtered = titles.filter(t =>
        t.value.includes(filter) || t.label.includes(filter)
      );
      if (filtered.length === 0) return '<p class="sum-modal-empty">검색 결과가 없습니다.</p>';
      return filtered.map(t => `
        <div class="sum-modal-item ${version.selectedTitleId === t.id ? 'selected' : ''}"
          onclick="VersionManager.pickTitle('${versionId}', '${t.id}')">
          <div class="sum-modal-item__header">
            <span class="sum-modal-item__label">${esc(t.value)}</span>
            ${t.label ? `<span style="font-size:11px;color:#9ba3b8;">${esc(t.label)}</span>` : ''}
            ${version.selectedTitleId === t.id ? '<span class="sum-modal-item__badge">선택됨</span>' : ''}
          </div>
        </div>`).join('');
    };

    const html = `
    <div class="modal-overlay" id="title-pick-modal">
      <div class="modal">
        <div class="modal-header">
          <h3>직책 선택</h3>
          <button class="modal-close" onclick="closeModal('title-pick-modal')">✕</button>
        </div>
        <div class="modal-body" style="padding:0;">
          <div class="sum-modal-search">
            <input id="title-search" type="text" placeholder="직책명으로 검색…"
              oninput="VersionManager.filterTitleModal(this.value, '${versionId}')">
          </div>
          <div id="title-modal-list" class="sum-modal-list">${renderList()}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" onclick="VersionManager.pickTitle('${versionId}', null)">선택 해제</button>
          <button class="btn-ghost" onclick="closeModal('title-pick-modal')">닫기</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(() => document.getElementById('title-search').focus(), 50);
  },

  filterTitleModal(query, versionId) {
    const profile = Store.getProfile();
    const version = Store.getVersion(versionId);
    const filtered = (profile.titles || []).filter(t =>
      t.value.includes(query) || t.label.includes(query)
    );
    document.getElementById('title-modal-list').innerHTML = filtered.length === 0
      ? '<p class="sum-modal-empty">검색 결과가 없습니다.</p>'
      : filtered.map(t => `
        <div class="sum-modal-item ${version.selectedTitleId === t.id ? 'selected' : ''}"
          onclick="VersionManager.pickTitle('${versionId}', '${t.id}')">
          <div class="sum-modal-item__header">
            <span class="sum-modal-item__label">${esc(t.value)}</span>
            ${t.label ? `<span style="font-size:11px;color:#9ba3b8;">${esc(t.label)}</span>` : ''}
            ${version.selectedTitleId === t.id ? '<span class="sum-modal-item__badge">선택됨</span>' : ''}
          </div>
        </div>`).join('');
  },

  pickTitle(versionId, titleId) {
    const version = Store.getVersion(versionId);
    if (!version) return;
    version.selectedTitleId = titleId || null;
    Store.saveVersion(version);
    closeModal('title-pick-modal');
    this.renderItemSelector(versionId);
    App.refreshPreview();
    showToast(titleId ? '직책이 선택되었습니다.' : '선택이 해제되었습니다.');
  },

  openSummaryPickModal(versionId) {
    const profile = Store.getProfile();
    const summaries = profile.summaries || [];
    const version = Store.getVersion(versionId);

    const renderList = (filter = '') => {
      const filtered = summaries.filter(s =>
        s.label.includes(filter) || s.body.includes(filter)
      );
      if (filtered.length === 0)
        return '<p class="sum-modal-empty">검색 결과가 없습니다.</p>';
      return filtered.map(s => `
        <div class="sum-modal-item sum-modal-item--block ${version.selectedSummaryId === s.id ? 'selected' : ''}"
          onclick="VersionManager.pickSummary('${versionId}', '${s.id}')">
          <div class="sum-modal-item__header">
            <span class="sum-modal-item__label">${esc(s.label) || '(제목 없음)'}</span>
            ${version.selectedSummaryId === s.id ? '<span class="sum-modal-item__badge">선택됨</span>' : ''}
          </div>
          <p class="sum-modal-item__body">${esc(s.body)}</p>
        </div>`).join('');
    };

    const html = `
    <div class="modal-overlay" id="summary-pick-modal">
      <div class="modal modal--wide">
        <div class="modal-header">
          <h3>자기소개 선택</h3>
          <button class="modal-close" onclick="closeModal('summary-pick-modal')">✕</button>
        </div>
        <div class="modal-body" style="padding:0;">
          <div class="sum-modal-search">
            <input id="sum-search" type="text" placeholder="제목 또는 본문으로 검색…"
              oninput="VersionManager.filterSummaryModal(this.value, '${versionId}')">
          </div>
          <div id="sum-modal-list" class="sum-modal-list">${renderList()}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" onclick="VersionManager.pickSummary('${versionId}', null)">선택 해제</button>
          <button class="btn-ghost" onclick="closeModal('summary-pick-modal')">닫기</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(() => document.getElementById('sum-search').focus(), 50);
  },

  filterSummaryModal(query, versionId) {
    const profile = Store.getProfile();
    const version = Store.getVersion(versionId);
    const summaries = profile.summaries || [];
    const filtered = summaries.filter(s =>
      s.label.includes(query) || s.body.includes(query)
    );
    const html = filtered.length === 0
      ? '<p class="sum-modal-empty">검색 결과가 없습니다.</p>'
      : filtered.map(s => `
        <div class="sum-modal-item sum-modal-item--block ${version.selectedSummaryId === s.id ? 'selected' : ''}"
          onclick="VersionManager.pickSummary('${versionId}', '${s.id}')">
          <div class="sum-modal-item__header">
            <span class="sum-modal-item__label">${esc(s.label) || '(제목 없음)'}</span>
            ${version.selectedSummaryId === s.id ? '<span class="sum-modal-item__badge">선택됨</span>' : ''}
          </div>
          <p class="sum-modal-item__body">${esc(s.body)}</p>
        </div>`).join('');
    document.getElementById('sum-modal-list').innerHTML = html;
  },

  pickSummary(versionId, summaryId) {
    const version = Store.getVersion(versionId);
    if (!version) return;
    version.selectedSummaryId = summaryId || null;
    Store.saveVersion(version);
    closeModal('summary-pick-modal');
    this.renderItemSelector(versionId);
    App.refreshPreview();
    showToast(summaryId ? '자기소개가 선택되었습니다.' : '선택이 해제되었습니다.');
  },

  // ── 경력 + 하위 프로젝트 통합 선택 모달 ─────────────
  openExpProjPickModal(versionId) {
    const profile = Store.getProfile();
    const version = Store.getVersion(versionId);
    const projs = profile.projects || [];

    // expOrder 기준으로 경력 정렬
    const orderedExps = (() => {
      const order = version.expOrder || [];
      const exps = [...profile.experiences];
      if (order.length === 0) return exps;
      exps.sort((a, b) => {
        const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
      return exps;
    })();

    const renderList = () => {
      const expIsAll  = version.selectedExperienceIds.length === 0;
      const expIsNone = version.selectedExperienceIds.length === 1 && version.selectedExperienceIds[0] === '__none__';

      if (orderedExps.length === 0)
        return '<p class="sum-modal-empty">등록된 경력이 없습니다.</p>';

      return orderedExps.map(e => {
        const expChecked = expIsAll || (!expIsNone && version.selectedExperienceIds.includes(e.id));
        const expProjs = projs.filter(p => p.experienceId === e.id);

        const projIsAll  = version.selectedProjectIds.length === 0;
        const projIsNone = version.selectedProjectIds.length === 1 && version.selectedProjectIds[0] === '__none__';

        const projsHtml = expProjs.length === 0 ? '' : `
          <div class="epp-proj-list">
            ${expProjs.map(p => {
              const pChecked = projIsAll || (!projIsNone && version.selectedProjectIds.includes(p.id));
              return `
                <label class="epp-proj-item ${pChecked ? 'selected' : ''}">
                  <input type="checkbox" data-proj-id="${p.id}" data-version="${versionId}"
                    ${pChecked ? 'checked' : ''}
                    onchange="VersionManager.toggleProjInExpModal(this, '${versionId}')">
                  <span class="epp-proj-dot">◦</span>
                  <span>${esc(p.name)}</span>
                  ${p.role ? `<span class="chip chip--sm">${esc(p.role)}</span>` : ''}
                  ${p.startDate ? `<span style="font-size:11px;color:#9ba3b8;margin-left:4px;">${formatPeriod(p.startDate, p.endDate)}</span>` : ''}
                </label>`;
            }).join('')}
          </div>`;

        return `
          <div class="epp-exp-item" data-exp-id="${e.id}" draggable="true"
            ondragstart="VersionManager.onExpOrderDragStart(event,'${e.id}')"
            ondragover="VersionManager.onExpOrderDragOver(event)"
            ondragleave="VersionManager.onExpOrderDragLeave(event)"
            ondrop="VersionManager.onExpOrderDrop(event,'${e.id}','${versionId}')"
            ondragend="VersionManager.onExpOrderDragEnd(event)">
            <label class="epp-exp-header ${expChecked ? 'selected' : ''}">
              <span class="drag-handle" title="드래그해서 순서 변경">⠿</span>
              <input type="checkbox" data-exp-id="${e.id}" data-version="${versionId}"
                ${expChecked ? 'checked' : ''}
                onchange="VersionManager.toggleExpInModal(this, '${versionId}')">
              <div style="flex:1;min-width:0;">
                <div class="sum-modal-item__header">
                  <span class="sum-modal-item__label">${esc(e.company)}</span>
                  ${e.role ? `<span style="font-size:11px;color:#9ba3b8;">${esc(e.role)}</span>` : ''}
                  ${expChecked ? '<span class="sum-modal-item__badge">선택됨</span>' : ''}
                </div>
                <p class="sum-modal-item__body">${formatPeriod(e.startDate, e.endDate, e.isCurrent)}</p>
              </div>
            </label>
            ${projsHtml}
          </div>`;
      }).join('');
    };

    const isAll = version.selectedExperienceIds.length === 0;
    const html = `
    <div class="modal-overlay" id="exp-proj-pick-modal">
      <div class="modal modal--wide">
        <div class="modal-header">
          <h3>경력 선택 <span style="font-size:12px;font-weight:400;color:#9ba3b8;margin-left:6px;">⠿ 드래그로 순서 변경</span></h3>
          <button class="modal-close" onclick="closeModal('exp-proj-pick-modal')">✕</button>
        </div>
        <div class="modal-body" style="padding:0;">
          <div class="sum-modal-search" style="display:flex;align-items:center;gap:10px;">
            <label style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#6c7a9c;white-space:nowrap;margin-left:auto;">
              <input type="checkbox" id="exp-pick-all" ${isAll ? 'checked' : ''}
                onchange="VersionManager.toggleAllExpsInModal(this, '${versionId}')"> 전체 선택
            </label>
          </div>
          <div id="exp-proj-modal-list" class="sum-modal-list">${renderList()}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" onclick="closeModal('exp-proj-pick-modal')">닫기</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  _expOrderDragSrcId: null,

  onExpOrderDragStart(event, expId) {
    this._expOrderDragSrcId = expId;
    event.dataTransfer.effectAllowed = 'move';
    event.currentTarget.classList.add('dragging');
  },

  onExpOrderDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const item = event.currentTarget;
    if (item.dataset.expId !== this._expOrderDragSrcId) item.classList.add('drag-over');
  },

  onExpOrderDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
  },

  onExpOrderDrop(event, targetExpId, versionId) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    if (this._expOrderDragSrcId === targetExpId) return;

    const version = Store.getVersion(versionId);
    const profile = Store.getProfile();
    const allIds = profile.experiences.map(e => e.id);

    // 현재 순서 배열 (없으면 기본 순서로 초기화)
    let order = version.expOrder && version.expOrder.length > 0
      ? [...version.expOrder]
      : [...allIds];

    // 누락된 id 보완
    allIds.forEach(id => { if (!order.includes(id)) order.push(id); });

    const srcIdx = order.indexOf(this._expOrderDragSrcId);
    const tgtIdx = order.indexOf(targetExpId);
    if (srcIdx < 0 || tgtIdx < 0) return;

    const [moved] = order.splice(srcIdx, 1);
    order.splice(tgtIdx, 0, moved);

    version.expOrder = order;
    Store.saveVersion(version);
    App.refreshPreview();

    // 모달 목록 재렌더
    const list = document.getElementById('exp-proj-modal-list');
    if (list) {
      // 현재 순서대로 DOM 재정렬
      const items = [...list.querySelectorAll('.epp-exp-item')];
      order.forEach(id => {
        const el = items.find(el => el.dataset.expId === id);
        if (el) list.appendChild(el);
      });
    }
  },

  onExpOrderDragEnd(event) {
    event.currentTarget.classList.remove('dragging');
    document.querySelectorAll('#exp-proj-modal-list .epp-exp-item').forEach(el => el.classList.remove('drag-over'));
    this._expOrderDragSrcId = null;
  },

  toggleExpInModal(checkbox, versionId) {
    const expId   = checkbox.dataset.expId;
    const version = Store.getVersion(versionId);
    if (!version) return;
    const profile = Store.getProfile();
    const allIds  = profile.experiences.map(e => e.id);

    if (version.selectedExperienceIds.length === 0) version.selectedExperienceIds = [...allIds];
    if (version.selectedExperienceIds[0] === '__none__') {
      version.selectedExperienceIds = checkbox.checked ? [expId] : ['__none__'];
    } else if (checkbox.checked) {
      if (!version.selectedExperienceIds.includes(expId)) version.selectedExperienceIds.push(expId);
    } else {
      version.selectedExperienceIds = version.selectedExperienceIds.filter(x => x !== expId);
      if (version.selectedExperienceIds.length === 0) version.selectedExperienceIds = ['__none__'];
    }
    Store.saveVersion(version);

    const item = checkbox.closest('.epp-exp-header');
    item.classList.toggle('selected', checkbox.checked);
    const badge  = item.querySelector('.sum-modal-item__badge');
    if (checkbox.checked && !badge) item.querySelector('.sum-modal-item__header').insertAdjacentHTML('beforeend', '<span class="sum-modal-item__badge">선택됨</span>');
    else if (!checkbox.checked && badge) badge.remove();

    const allCb = document.getElementById('exp-pick-all');
    if (allCb) allCb.checked = version.selectedExperienceIds.length === 0;

    this.renderItemSelector(versionId);
    App.refreshPreview();
  },

  toggleProjInExpModal(checkbox, versionId) {
    const projId  = checkbox.dataset.projId;
    const version = Store.getVersion(versionId);
    if (!version) return;
    const profile = Store.getProfile();
    const allProjIds = profile.projects.map(p => p.id);

    if (version.selectedProjectIds.length === 0) version.selectedProjectIds = [...allProjIds];
    if (version.selectedProjectIds[0] === '__none__') {
      version.selectedProjectIds = checkbox.checked ? [projId] : ['__none__'];
    } else if (checkbox.checked) {
      if (!version.selectedProjectIds.includes(projId)) version.selectedProjectIds.push(projId);
    } else {
      version.selectedProjectIds = version.selectedProjectIds.filter(x => x !== projId);
      if (version.selectedProjectIds.length === 0) version.selectedProjectIds = ['__none__'];
    }
    Store.saveVersion(version);

    const item = checkbox.closest('.epp-proj-item');
    item.classList.toggle('selected', checkbox.checked);

    this.renderItemSelector(versionId);
    App.refreshPreview();
  },

  toggleAllExpsInModal(checkbox, versionId) {
    const version = Store.getVersion(versionId);
    if (!version) return;
    version.selectedExperienceIds = checkbox.checked ? [] : ['__none__'];
    // 경력 전체 선택/해제 시 경력별 프로젝트도 동기화
    if (checkbox.checked) {
      version.selectedProjectIds = [];
    } else {
      version.selectedProjectIds = ['__none__'];
    }
    Store.saveVersion(version);

    document.querySelectorAll('#exp-proj-modal-list input[data-exp-id]').forEach(cb => {
      cb.checked = checkbox.checked;
      cb.closest('.epp-exp-header').classList.toggle('selected', checkbox.checked);
      const badge = cb.closest('.epp-exp-header').querySelector('.sum-modal-item__badge');
      if (checkbox.checked && !badge) cb.closest('.epp-exp-header').querySelector('.sum-modal-item__header').insertAdjacentHTML('beforeend', '<span class="sum-modal-item__badge">선택됨</span>');
      else if (!checkbox.checked && badge) badge.remove();
    });
    document.querySelectorAll('#exp-proj-modal-list input[data-proj-id]').forEach(cb => {
      cb.checked = checkbox.checked;
      cb.closest('.epp-proj-item').classList.toggle('selected', checkbox.checked);
    });

    this.renderItemSelector(versionId);
    App.refreshPreview();
  },

  openItemPickModal(versionId, type) {
    const profile = Store.getProfile();
    const version = Store.getVersion(versionId);
    const expIds = new Set((profile.experiences || []).map(e => e.id));
    const floatingProjs = (profile.projects || []).filter(p => !p.experienceId || !expIds.has(p.experienceId));
    const typeMap = {
      experiences: { label: '경력',         items: profile.experiences, field: 'selectedExperienceIds', labelFn: e => e.company,   subFn: e => [e.role, formatPeriod(e.startDate, e.endDate, e.isCurrent)].filter(Boolean).join(' · ') },
      projects:    { label: '독립 프로젝트', items: floatingProjs,       field: 'selectedProjectIds',    labelFn: p => p.name,      subFn: p => [p.company, formatPeriod(p.startDate, p.endDate)].filter(Boolean).join(' · ') },
      skills:      { label: '스킬',         items: profile.skills,      field: 'selectedSkillGroupIds', labelFn: s => s.category,  subFn: s => s.items.join(', ') },
      education:   { label: '학력',         items: profile.educations,  field: 'selectedEducationIds',  labelFn: e => e.school,    subFn: e => [e.degree, e.major].filter(Boolean).join(' ') },
    };
    const { label, items, field } = typeMap[type];

    const renderItems = (filter = '') => {
      const isAll  = version[field].length === 0;
      const isNone = version[field].length === 1 && version[field][0] === '__none__';
      const filtered = items.filter(i => {
        const text = JSON.stringify(i).toLowerCase();
        return text.includes(filter.toLowerCase());
      });
      if (filtered.length === 0) return '<p class="sum-modal-empty">검색 결과가 없습니다.</p>';
      return filtered.map(item => {
        const checked = isAll || (!isNone && version[field].includes(item.id));
        const { labelFn, subFn } = typeMap[type];
        return `
          <label class="sum-modal-item ${checked ? 'selected' : ''}">
            <input type="checkbox" data-item-id="${item.id}" data-type="${type}" data-version="${versionId}"
              ${checked ? 'checked' : ''} onchange="VersionManager.toggleItemInModal(this, '${type}', '${versionId}')">
            <div style="flex:1;min-width:0;">
              <div class="sum-modal-item__header">
                <span class="sum-modal-item__label">${esc(labelFn(item))}</span>
                ${checked ? '<span class="sum-modal-item__badge">선택됨</span>' : ''}
              </div>
              <p class="sum-modal-item__body">${esc(subFn(item))}</p>
            </div>
          </label>`;
      }).join('');
    };

    const isAll = version[field].length === 0;
    const html = `
    <div class="modal-overlay" id="item-pick-modal">
      <div class="modal modal--wide">
        <div class="modal-header">
          <h3>${label} 선택</h3>
          <button class="modal-close" onclick="closeModal('item-pick-modal')">✕</button>
        </div>
        <div class="modal-body" style="padding:0;">
          <div class="sum-modal-search" style="display:flex;align-items:center;gap:10px;">
            <input id="item-search" type="text" placeholder="검색…" style="flex:1;"
              oninput="VersionManager.filterItemModal(this.value, '${versionId}', '${type}')">
            <label style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#6c7a9c;white-space:nowrap;">
              <input type="checkbox" id="item-pick-all" ${isAll ? 'checked' : ''}
                onchange="VersionManager.toggleAllInModal(this, '${versionId}', '${type}')"> 전체 선택
            </label>
          </div>
          <div id="item-modal-list" class="sum-modal-list">${renderItems()}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" onclick="closeModal('item-pick-modal')">닫기</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(() => document.getElementById('item-search').focus(), 50);
  },

  filterItemModal(query, versionId, type) {
    const profile = Store.getProfile();
    const version = Store.getVersion(versionId);
    const expIds2 = new Set((profile.experiences || []).map(e => e.id));
    const floatingProjs2 = (profile.projects || []).filter(p => !p.experienceId || !expIds2.has(p.experienceId));
    const typeMap = {
      experiences: { items: profile.experiences, field: 'selectedExperienceIds', labelFn: e => e.company,  subFn: e => [e.role, formatPeriod(e.startDate, e.endDate, e.isCurrent)].filter(Boolean).join(' · ') },
      projects:    { items: floatingProjs2,       field: 'selectedProjectIds',    labelFn: p => p.name,     subFn: p => [p.company, formatPeriod(p.startDate, p.endDate)].filter(Boolean).join(' · ') },
      skills:      { items: profile.skills,       field: 'selectedSkillGroupIds', labelFn: s => s.category, subFn: s => s.items.join(', ') },
      education:   { items: profile.educations,   field: 'selectedEducationIds',  labelFn: e => e.school,   subFn: e => [e.degree, e.major].filter(Boolean).join(' ') },
    };
    const { items, field, labelFn, subFn } = typeMap[type];
    const isAll  = version[field].length === 0;
    const isNone = version[field].length === 1 && version[field][0] === '__none__';
    const filtered = items.filter(i => JSON.stringify(i).toLowerCase().includes(query.toLowerCase()));
    const html = filtered.length === 0
      ? '<p class="sum-modal-empty">검색 결과가 없습니다.</p>'
      : filtered.map(item => {
          const checked = isAll || (!isNone && version[field].includes(item.id));
          return `
            <label class="sum-modal-item ${checked ? 'selected' : ''}">
              <input type="checkbox" data-item-id="${item.id}" data-type="${type}" data-version="${versionId}"
                ${checked ? 'checked' : ''} onchange="VersionManager.toggleItemInModal(this, '${type}', '${versionId}')">
              <div style="flex:1;min-width:0;">
                <div class="sum-modal-item__header">
                  <span class="sum-modal-item__label">${esc(labelFn(item))}</span>
                  ${checked ? '<span class="sum-modal-item__badge">선택됨</span>' : ''}
                </div>
                <p class="sum-modal-item__body">${esc(subFn(item))}</p>
              </div>
            </label>`;
        }).join('');
    document.getElementById('item-modal-list').innerHTML = html;
  },

  toggleItemInModal(checkbox, type, versionId) {
    const itemId  = checkbox.dataset.itemId;
    const version = Store.getVersion(versionId);
    if (!version) return;
    const profile = Store.getProfile();
    const fieldMap = {
      experiences: ['selectedExperienceIds', profile.experiences],
      projects:    ['selectedProjectIds',    profile.projects],
      skills:      ['selectedSkillGroupIds', profile.skills],
      education:   ['selectedEducationIds',  profile.educations],
    };
    const [field, allItems] = fieldMap[type] || [];
    if (!field) return;

    if (version[field].length === 0) version[field] = allItems.map(i => i.id);
    if (version[field][0] === '__none__') {
      version[field] = checkbox.checked ? [itemId] : ['__none__'];
    } else if (checkbox.checked) {
      if (!version[field].includes(itemId)) version[field].push(itemId);
    } else {
      version[field] = version[field].filter(x => x !== itemId);
    }
    Store.saveVersion(version);

    // 카드 스타일 + 배지 즉시 업데이트
    const item = checkbox.closest('.sum-modal-item');
    item.classList.toggle('selected', checkbox.checked);
    const header = item.querySelector('.sum-modal-item__header');
    const badge = header.querySelector('.sum-modal-item__badge');
    if (checkbox.checked && !badge) {
      header.insertAdjacentHTML('beforeend', '<span class="sum-modal-item__badge">선택됨</span>');
    } else if (!checkbox.checked && badge) {
      badge.remove();
    }
    // 전체선택 체크박스 동기화
    const allItems2 = fieldMap[type][1];
    const isAllNow = version[field].length === 0 || version[field].length === allItems2.length;
    const allCb = document.getElementById('item-pick-all');
    if (allCb) allCb.checked = isAllNow;

    this.renderItemSelector(versionId);
    App.refreshPreview();
  },

  toggleAllInModal(checkbox, versionId, type) {
    const version = Store.getVersion(versionId);
    if (!version) return;
    const fieldMap = {
      experiences: 'selectedExperienceIds',
      projects:    'selectedProjectIds',
      skills:      'selectedSkillGroupIds',
      education:   'selectedEducationIds',
    };
    const field = fieldMap[type];
    version[field] = checkbox.checked ? [] : ['__none__'];
    Store.saveVersion(version);
    // 모달 내 모든 체크박스 동기화
    document.querySelectorAll('#item-modal-list input[type="checkbox"]').forEach(cb => {
      cb.checked = checkbox.checked;
      cb.closest('.sum-modal-item').classList.toggle('selected', checkbox.checked);
      const header = cb.closest('.sum-modal-item').querySelector('.sum-modal-item__header');
      const badge  = header.querySelector('.sum-modal-item__badge');
      if (checkbox.checked && !badge) header.insertAdjacentHTML('beforeend', '<span class="sum-modal-item__badge">선택됨</span>');
      else if (!checkbox.checked && badge) badge.remove();
    });
    this.renderItemSelector(versionId);
    App.refreshPreview();
  },

  toggleItem(checkbox) {
    const itemId    = checkbox.dataset.itemId;
    const type      = checkbox.dataset.type;
    const versionId = checkbox.dataset.version;
    const version = Store.getVersion(versionId);
    if (!version) return;
    const profile = Store.getProfile();

    const fieldMap = {
      experiences: ['selectedExperienceIds', profile.experiences],
      projects:    ['selectedProjectIds',    profile.projects],
      skills:      ['selectedSkillGroupIds', profile.skills],
      education:   ['selectedEducationIds',  profile.educations],
    };
    const [field, allItems] = fieldMap[type] || [];
    if (!field) return;

    // 빈 배열(전체 선택 상태)에서 처음 해제할 때 → 명시적 목록으로 전환
    if (version[field].length === 0) {
      version[field] = allItems.map(i => i.id);
    }
    // __none__ 상태에서 체크 켜면 해당 항목만 포함
    if (version[field][0] === '__none__') {
      version[field] = checkbox.checked ? [itemId] : ['__none__'];
    } else if (checkbox.checked) {
      if (!version[field].includes(itemId)) version[field].push(itemId);
    } else {
      version[field] = version[field].filter(x => x !== itemId);
    }
    Store.saveVersion(version);

    // 체크 상태에 따라 카드 스타일 업데이트
    checkbox.closest('.sel-item').classList.toggle('checked', checkbox.checked);
    App.refreshPreview();
  },

  toggleAll(masterCheckbox, versionId, type) {
    const version = Store.getVersion(versionId);
    if (!version) return;
    const fieldMap = {
      experiences: 'selectedExperienceIds',
      projects:    'selectedProjectIds',
      skills:      'selectedSkillGroupIds',
      education:   'selectedEducationIds',
    };
    const field = fieldMap[type];
    if (!field) return;

    // 전체 선택: 빈 배열(= 전체 포함), 전체 해제: ['__none__']
    version[field] = masterCheckbox.checked ? [] : ['__none__'];
    Store.saveVersion(version);
    this.renderItemSelector(versionId);
    App.refreshPreview();
  },

  updateField(versionId, field, value) {
    const version = Store.getVersion(versionId);
    if (!version) return;
    version[field] = value;
    Store.saveVersion(version);
    if (field === 'name' || field === 'targetCompany' || field === 'status') {
      this.renderVersionSidebar();
      this.renderVersionHeader(versionId);
    }
    if (field === 'templateId') App.refreshPreview();
  },

  duplicate(id) {
    const src = Store.getVersion(id);
    const name = prompt('새 버전 이름:', src ? src.name + ' (복사)' : '');
    if (name === null) return;
    const copy = Store.duplicateVersion(id, name);
    App.updateVersionBadge();
    this.renderVersionGrid();
    if (copy) this.showVersion(copy.id);
  },

  delete(id) {
    if (!confirm('이 버전을 삭제할까요?')) return;
    Store.deleteVersion(id);
    App.updateVersionBadge();
    // 워크스페이스가 열려있으면 그리드로 돌아가기
    const workspace = document.getElementById('version-workspace-view');
    if (workspace && !workspace.classList.contains('hidden')) {
      this.backToGrid();
    } else {
      this.renderVersionGrid();
    }
  },

  openCreateModal() {
    const html = `
    <div class="modal-overlay" id="new-version-modal">
      <div class="modal">
        <div class="modal-header">
          <h3>새 버전 만들기</h3>
          <button class="modal-close" onclick="closeModal('new-version-modal')">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-desc">버전을 만들면 마스터 데이터에서 이 버전에 포함할 항목을 선택할 수 있습니다.</p>
          <div class="form-row">
            <label>지원 회사 *</label>
            <input id="nv-company" placeholder="예: 카카오페이">
          </div>
          <div class="form-row">
            <label>버전 이름 <span class="label-hint">(선택 — 비우면 회사명으로 자동 생성)</span></label>
            <input id="nv-name" placeholder="예: 카카오페이 PO 지원용">
          </div>
          <div class="form-row">
            <label>지원 마감일 (선택)</label>
            <input id="nv-deadline" type="date">
          </div>
          <div class="form-row">
            <label>템플릿</label>
            <select id="nv-template">
              <option value="modern">모던</option>
              <option value="classic">클래식</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" onclick="closeModal('new-version-modal')">취소</button>
          <button class="btn-primary" onclick="VersionManager.createVersion()">만들기</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(() => document.getElementById('nv-company').focus(), 50);
  },

  createVersion() {
    const company = document.getElementById('nv-company').value.trim();
    if (!company) { alert('지원 회사를 입력하세요.'); return; }
    const name = document.getElementById('nv-name').value.trim() || company;
    const profile = Store.getProfile();
    const version = createVersion({
      name,
      targetCompany: company,
      deadline:      document.getElementById('nv-deadline').value,
      templateId:    document.getElementById('nv-template').value,
      baseProfileId: profile.id,
      selectedExperienceIds: [],
      selectedProjectIds:    [],
      selectedSkillGroupIds: [],
      selectedEducationIds:  [],
    });
    Store.saveVersion(version);
    closeModal('new-version-modal');
    App.updateVersionBadge();
    App.switchView('versions');
    this.showVersion(version.id);
    showToast('버전이 생성되었습니다. 포함할 항목을 선택하세요.');
  },
};

function statusLabel(s) {
  return { draft: '작성 중', ready: '준비 완료', submitted: '지원 완료' }[s] || s;
}
