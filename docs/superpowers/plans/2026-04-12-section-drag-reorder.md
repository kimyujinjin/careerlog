# 섹션 & 항목 드래그앤드롭 순서 변경 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 버전 편집기에서 이력서 섹션과 항목의 순서를 드래그앤드롭으로 변경하고, 확인 모달을 거쳐 렌더러에 반영한다.

**Architecture:** 데이터 모델에 order 필드 추가 → Store에서 정렬 로직 확장 → 버전 편집기에 드래그 UI 추가 → 렌더러를 sectionOrder 기반 동적 렌더링으로 전환. 모든 드래그 완료 시 확인 모달을 표시하고 승인 시에만 저장한다.

**Tech Stack:** Vanilla JS, HTML5 Drag and Drop API, CSS

---

### Task 1: 데이터 모델에 order 필드 추가

**Files:**
- Modify: `js/models.js:116-143`

- [ ] **Step 1: createVersion에 order 필드 4개 추가**

`js/models.js`의 `createVersion()` 함수에서 `expOrder` 줄(line 130) 아래에 추가:

```javascript
sectionOrder:          data.sectionOrder          || [], // 섹션 표시 순서
skillOrder:            data.skillOrder            || [], // 스킬 그룹 표시 순서
eduOrder:              data.eduOrder              || [], // 학력 표시 순서
certOrder:             data.certOrder             || [], // 자격증 표시 순서
```

- [ ] **Step 2: 커밋**

```bash
git add js/models.js
git commit -m "feat: 버전 모델에 sectionOrder, skillOrder, eduOrder, certOrder 필드 추가"
```

---

### Task 2: Store.resolveVersion()에 정렬 로직 추가

**Files:**
- Modify: `js/store.js:149-198`

- [ ] **Step 1: 범용 정렬 헬퍼 추가**

`js/store.js`의 `resolveVersion()` 함수 안, `pick` 헬퍼(line 154) 아래에 추가:

```javascript
const sortByOrder = (arr, order) => {
  if (!order || order.length === 0) return arr;
  return [...arr].sort((a, b) => {
    const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1; if (bi === -1) return -1;
    return ai - bi;
  });
};
```

- [ ] **Step 2: skills 정렬 적용**

`js/store.js`의 `resolved` 객체 안 `skills` 줄(line 191)을 변경:

기존:
```javascript
skills:         pick(profile.skills,         version.selectedSkillGroupIds).map(s => ({ ...s, items: [...s.items] })),
```

변경:
```javascript
skills:         sortByOrder(pick(profile.skills, version.selectedSkillGroupIds).map(s => ({ ...s, items: [...s.items] })), version.skillOrder),
```

- [ ] **Step 3: educations 정렬 적용**

`js/store.js`의 `resolved` 객체 안 `educations` 줄(line 192)을 변경:

기존:
```javascript
educations:     pick(profile.educations,     version.selectedEducationIds ).map(e => ({ ...e })),
```

변경:
```javascript
educations:     sortByOrder(pick(profile.educations, version.selectedEducationIds).map(e => ({ ...e })), version.eduOrder),
```

- [ ] **Step 4: certifications 정렬 적용**

`js/store.js`의 `resolved` 객체 안 `certifications` 줄(line 193)을 변경:

기존:
```javascript
certifications: pick(profile.certifications || [], version.selectedCertIds || []).map(c => ({ ...c })),
```

변경:
```javascript
certifications: sortByOrder(pick(profile.certifications || [], version.selectedCertIds || []).map(c => ({ ...c })), version.certOrder),
```

- [ ] **Step 5: experiences 정렬을 sortByOrder 헬퍼로 리팩터**

`js/store.js`의 `resolved` 객체 안 `experiences` IIFE(lines 174-186)를 간소화:

기존:
```javascript
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
```

변경:
```javascript
experiences: sortByOrder(
  pick(profile.experiences, version.selectedExperienceIds).map(e => ({ ...e, achievements: [...e.achievements] })),
  version.expOrder
),
```

- [ ] **Step 6: 커밋**

```bash
git add js/store.js
git commit -m "feat: resolveVersion에 스킬/학력/자격증 정렬 로직 추가"
```

---

### Task 3: Renderer.render()를 sectionOrder 기반 동적 렌더링으로 전환

**Files:**
- Modify: `js/renderer.js:180-193`

- [ ] **Step 1: render() 함수를 sectionOrder 기반으로 변경**

`js/renderer.js`의 `Renderer.render()` 함수(lines 180-193)를 변경:

기존:
```javascript
const Renderer = {
  render(resolvedData, templateId) {
    const { resolved, version } = resolvedData;
    const resumeTitle = version && version.resumeTitle ? version.resumeTitle : null;
    const body =
      renderPersonal(resolved.personal, resumeTitle) +
      renderExperiences(resolved.experiences, resolved.projects) +
      renderSkills(resolved.skills) +
      renderEducations(resolved.educations) +
      renderCertifications(resolved.certifications);

    return `<div class="resume-wrap template-${esc(templateId || 'modern')}">${body}</div>`;
  }
};
```

변경:
```javascript
const Renderer = {
  _defaultSectionOrder: ['experiences', 'skills', 'educations', 'certifications'],

  _sectionRenderers: {
    experiences: (r) => renderExperiences(r.experiences, r.projects),
    skills:      (r) => renderSkills(r.skills),
    educations:  (r) => renderEducations(r.educations),
    certifications: (r) => renderCertifications(r.certifications),
  },

  render(resolvedData, templateId) {
    const { resolved, version } = resolvedData;
    const resumeTitle = version && version.resumeTitle ? version.resumeTitle : null;
    const order = (version && version.sectionOrder && version.sectionOrder.length > 0)
      ? version.sectionOrder
      : this._defaultSectionOrder;

    let body = renderPersonal(resolved.personal, resumeTitle);
    for (const key of order) {
      const fn = this._sectionRenderers[key];
      if (fn) body += fn(resolved);
    }
    // order에 포함되지 않은 섹션도 기본 순서대로 렌더
    for (const key of this._defaultSectionOrder) {
      if (!order.includes(key)) {
        const fn = this._sectionRenderers[key];
        if (fn) body += fn(resolved);
      }
    }

    return `<div class="resume-wrap template-${esc(templateId || 'modern')}">${body}</div>`;
  }
};
```

- [ ] **Step 2: 커밋**

```bash
git add js/renderer.js
git commit -m "feat: 렌더러를 sectionOrder 기반 동적 섹션 렌더링으로 전환"
```

---

### Task 4: 확인 모달 구현

**Files:**
- Modify: `js/version.js` (상단에 유틸 함수 추가)
- Modify: `css/app.css` (모달 스타일 추가)

- [ ] **Step 1: 확인 모달 함수 추가**

`js/version.js`의 `VersionManager` 객체의 `_expOrderDragSrcId: null,` 줄(line 773) 바로 위에 추가:

```javascript
_showReorderConfirm(onConfirm, onCancel) {
  const overlay = document.createElement('div');
  overlay.className = 'reorder-confirm-overlay';
  overlay.innerHTML = `
    <div class="reorder-confirm-box">
      <p class="reorder-confirm-msg">순서를 변경할까요?</p>
      <div class="reorder-confirm-btns">
        <button class="btn-sm" id="reorder-cancel">취소</button>
        <button class="btn-sm btn-primary" id="reorder-ok">변경</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('reorder-ok').onclick = () => { overlay.remove(); onConfirm(); };
  document.getElementById('reorder-cancel').onclick = () => { overlay.remove(); onCancel(); };
},
```

- [ ] **Step 2: 확인 모달 CSS 추가**

`css/app.css`의 드래그 관련 스타일 근처(`.epp-exp-item.drag-over` 줄 아래)에 추가:

```css
/* ── 순서 변경 확인 모달 ─────────────────────────────── */
.reorder-confirm-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.reorder-confirm-box {
  background: #fff; border-radius: 16px; padding: 28px 32px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.15); text-align: center; min-width: 260px;
}
.reorder-confirm-msg { font-size: 17px; font-weight: 700; color: #1e2035; margin-bottom: 20px; }
.reorder-confirm-btns { display: flex; gap: 10px; justify-content: center; }
.reorder-confirm-btns .btn-primary {
  background: #5500ff; color: #fff; border: none; padding: 8px 24px;
  border-radius: 8px; font-weight: 600; cursor: pointer;
}
.reorder-confirm-btns .btn-primary:hover { background: #4400cc; }
```

- [ ] **Step 3: 커밋**

```bash
git add js/version.js css/app.css
git commit -m "feat: 순서 변경 확인 모달 구현"
```

---

### Task 5: 기존 경력 드래그에 확인 모달 적용

**Files:**
- Modify: `js/version.js:792-830` (onExpOrderDrop)

- [ ] **Step 1: onExpOrderDrop에 확인 모달 적용**

`js/version.js`의 `onExpOrderDrop()` 함수(lines 792-830)를 변경:

기존:
```javascript
onExpOrderDrop(event, targetExpId, versionId) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  if (this._expOrderDragSrcId === targetExpId) return;

  const version = Store.getVersion(versionId);
  const profile = Store.getProfile();
  const allIds = profile.experiences.map(e => e.id);

  let order = version.expOrder && version.expOrder.length > 0
    ? [...version.expOrder]
    : [...allIds];

  allIds.forEach(id => { if (!order.includes(id)) order.push(id); });

  const srcIdx = order.indexOf(this._expOrderDragSrcId);
  const tgtIdx = order.indexOf(targetExpId);
  if (srcIdx < 0 || tgtIdx < 0) return;

  const [moved] = order.splice(srcIdx, 1);
  order.splice(tgtIdx, 0, moved);

  version.expOrder = order;
  Store.saveVersion(version);
  App.refreshPreview();

  const list = document.getElementById('exp-proj-modal-list');
  if (list) {
    const items = [...list.querySelectorAll('.epp-exp-item')];
    order.forEach(id => {
      const el = items.find(el => el.dataset.expId === id);
      if (el) list.appendChild(el);
    });
  }
},
```

변경:
```javascript
onExpOrderDrop(event, targetExpId, versionId) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  if (this._expOrderDragSrcId === targetExpId) return;

  const version = Store.getVersion(versionId);
  const profile = Store.getProfile();
  const allIds = profile.experiences.map(e => e.id);

  let order = version.expOrder && version.expOrder.length > 0
    ? [...version.expOrder]
    : [...allIds];
  allIds.forEach(id => { if (!order.includes(id)) order.push(id); });

  const srcIdx = order.indexOf(this._expOrderDragSrcId);
  const tgtIdx = order.indexOf(targetExpId);
  if (srcIdx < 0 || tgtIdx < 0) return;

  const [moved] = order.splice(srcIdx, 1);
  order.splice(tgtIdx, 0, moved);

  // DOM 미리 이동 (시각적 피드백)
  const list = document.getElementById('exp-proj-modal-list');
  if (list) {
    const items = [...list.querySelectorAll('.epp-exp-item')];
    order.forEach(id => {
      const el = items.find(el => el.dataset.expId === id);
      if (el) list.appendChild(el);
    });
  }

  const prevOrder = [...(version.expOrder && version.expOrder.length > 0 ? version.expOrder : allIds)];

  this._showReorderConfirm(
    () => {
      version.expOrder = order;
      Store.saveVersion(version);
      App.refreshPreview();
    },
    () => {
      // 취소: DOM 원래 순서로 복원
      if (list) {
        const items = [...list.querySelectorAll('.epp-exp-item')];
        prevOrder.forEach(id => {
          const el = items.find(el => el.dataset.expId === id);
          if (el) list.appendChild(el);
        });
      }
    }
  );
},
```

- [ ] **Step 2: 커밋**

```bash
git add js/version.js
git commit -m "feat: 경력 드래그앤드롭에 확인 모달 적용"
```

---

### Task 6: 섹션 레벨 드래그앤드롭 구현

**Files:**
- Modify: `js/version.js:332-485` (renderItemSelector)
- Modify: `js/version.js` (VersionManager에 핸들러 추가)
- Modify: `css/app.css`

- [ ] **Step 1: 섹션 드래그 상태 변수 추가**

`js/version.js`의 `VersionManager` 객체에서 `_expOrderDragSrcId: null,` 줄(line 773) 근처에 추가:

```javascript
_sectionDragSrcKey: null,
```

- [ ] **Step 2: 섹션 드래그 핸들러 추가**

`_showReorderConfirm` 함수 아래, `_expOrderDragSrcId` 위에 추가:

```javascript
onSectionDragStart(event, sectionKey) {
  this._sectionDragSrcKey = sectionKey;
  event.dataTransfer.effectAllowed = 'move';
  event.currentTarget.classList.add('dragging');
},

onSectionDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  const item = event.currentTarget;
  if (item.dataset.sectionKey !== this._sectionDragSrcKey) item.classList.add('drag-over');
},

onSectionDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
},

onSectionDrop(event, targetKey, versionId) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  if (this._sectionDragSrcKey === targetKey) return;

  const version = Store.getVersion(versionId);
  const defaultOrder = ['experiences', 'skills', 'educations', 'certifications'];
  let order = version.sectionOrder && version.sectionOrder.length > 0
    ? [...version.sectionOrder]
    : [...defaultOrder];
  defaultOrder.forEach(k => { if (!order.includes(k)) order.push(k); });

  const srcIdx = order.indexOf(this._sectionDragSrcKey);
  const tgtIdx = order.indexOf(targetKey);
  if (srcIdx < 0 || tgtIdx < 0) return;

  const [moved] = order.splice(srcIdx, 1);
  order.splice(tgtIdx, 0, moved);

  // DOM 미리 이동
  const container = document.getElementById('sel-sections-sortable');
  if (container) {
    const items = [...container.querySelectorAll('.sel-section-draggable')];
    order.forEach(k => {
      const el = items.find(el => el.dataset.sectionKey === k);
      if (el) container.appendChild(el);
    });
  }

  const prevOrder = version.sectionOrder && version.sectionOrder.length > 0
    ? [...version.sectionOrder] : [...defaultOrder];

  this._showReorderConfirm(
    () => {
      version.sectionOrder = order;
      Store.saveVersion(version);
      App.refreshPreview();
    },
    () => {
      if (container) {
        const items = [...container.querySelectorAll('.sel-section-draggable')];
        prevOrder.forEach(k => {
          const el = items.find(el => el.dataset.sectionKey === k);
          if (el) container.appendChild(el);
        });
      }
    }
  );
},

onSectionDragEnd(event) {
  event.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.sel-section-draggable').forEach(el => el.classList.remove('drag-over'));
  this._sectionDragSrcKey = null;
},
```

- [ ] **Step 3: renderItemSelector에서 드래그 가능 섹션 래핑**

`js/version.js`의 `renderItemSelector()` 함수에서 경력, 스킬, 학력, 자격증 섹션을 sectionOrder 기반으로 정렬하고 드래그 핸들을 추가한다.

현재 `expProjSection`, 스킬, 학력 등이 개별 변수로 만들어진 후 마지막에 조합되는 부분을 찾아서 변경한다.

함수 마지막 부분에서 `return` 전에 섹션 HTML을 `sectionOrder`에 따라 정렬하는 로직 추가. 각 드래그 가능 섹션을 `sel-section-draggable` 클래스와 `data-section-key` 속성으로 래핑:

```javascript
// 섹션별 HTML을 key로 매핑
const sectionMap = {
  experiences: expProjSection,
  skills: skillSection,
  educations: eduSection,
  certifications: certSection,
};
const sectionLabels = {
  experiences: '경력',
  skills: '스킬',
  educations: '학력',
  certifications: '자격증',
};
const defaultOrder = ['experiences', 'skills', 'educations', 'certifications'];
const order = (v.sectionOrder && v.sectionOrder.length > 0) ? v.sectionOrder : defaultOrder;
// 누락 키 보완
defaultOrder.forEach(k => { if (!order.includes(k)) order.push(k); });

const sortableSections = order.map(key => `
  <div class="sel-section-draggable" data-section-key="${key}" draggable="true"
    ondragstart="VersionManager.onSectionDragStart(event,'${key}')"
    ondragover="VersionManager.onSectionDragOver(event)"
    ondragleave="VersionManager.onSectionDragLeave(event)"
    ondrop="VersionManager.onSectionDrop(event,'${key}','${v.id}')"
    ondragend="VersionManager.onSectionDragEnd(event)">
    <span class="drag-handle" title="드래그해서 순서 변경">⠿</span>
    <div class="sel-section-draggable__content">${sectionMap[key] || ''}</div>
  </div>`).join('');
```

그리고 최종 return에서 고정 섹션(직책, 자기소개) 아래에 `<div id="sel-sections-sortable">${sortableSections}</div>` + 메모 섹션을 배치한다.

- [ ] **Step 4: 드래그 가능 섹션 CSS 추가**

`css/app.css`에 추가:

```css
/* ── 섹션 드래그 ─────────────────────────────────────── */
.sel-section-draggable {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 4px 0; transition: opacity 0.15s;
}
.sel-section-draggable .drag-handle { margin-top: 14px; }
.sel-section-draggable__content { flex: 1; min-width: 0; }
.sel-section-draggable.dragging { opacity: 0.4; }
.sel-section-draggable.drag-over { border-top: 2px solid #5500ff; background: #f0ebff; border-radius: 8px; }
```

- [ ] **Step 5: 커밋**

```bash
git add js/version.js css/app.css
git commit -m "feat: 섹션 레벨 드래그앤드롭 순서 변경 구현"
```

---

### Task 7: 항목 레벨 드래그앤드롭 (스킬, 학력, 자격증)

**Files:**
- Modify: `js/version.js` (VersionManager에 범용 항목 드래그 핸들러 추가)
- Modify: `js/version.js` (renderItemSelector — 칩에 드래그 적용)
- Modify: `css/app.css`

- [ ] **Step 1: 범용 항목 드래그 상태 변수 추가**

`js/version.js`의 `VersionManager` 객체에 추가:

```javascript
_itemDragSrcId: null,
_itemDragType: null,
```

- [ ] **Step 2: 범용 항목 드래그 핸들러 추가**

`onSectionDragEnd` 함수 아래에 추가:

```javascript
onItemDragStart(event, itemId, type) {
  this._itemDragSrcId = itemId;
  this._itemDragType = type;
  event.dataTransfer.effectAllowed = 'move';
  event.currentTarget.classList.add('dragging');
},

onItemDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  const item = event.currentTarget;
  if (item.dataset.itemId !== this._itemDragSrcId) item.classList.add('drag-over');
},

onItemDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
},

onItemDrop(event, targetId, versionId, type) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  if (this._itemDragSrcId === targetId) return;

  const version = Store.getVersion(versionId);
  const profile = Store.getProfile();

  // type별 설정
  const config = {
    skills:   { allItems: profile.skills,                selectedIds: version.selectedSkillGroupIds, orderKey: 'skillOrder' },
    education:{ allItems: profile.educations,            selectedIds: version.selectedEducationIds,  orderKey: 'eduOrder' },
    certs:    { allItems: profile.certifications || [],   selectedIds: version.selectedCertIds || [], orderKey: 'certOrder' },
  };
  const c = config[type];
  if (!c) return;

  const allIds = c.allItems.map(i => i.id);
  let order = version[c.orderKey] && version[c.orderKey].length > 0
    ? [...version[c.orderKey]]
    : [...allIds];
  allIds.forEach(id => { if (!order.includes(id)) order.push(id); });

  const srcIdx = order.indexOf(this._itemDragSrcId);
  const tgtIdx = order.indexOf(targetId);
  if (srcIdx < 0 || tgtIdx < 0) return;

  const [moved] = order.splice(srcIdx, 1);
  order.splice(tgtIdx, 0, moved);

  // DOM 미리 이동
  const container = document.querySelector(`.sel-chips-sortable[data-type="${type}"]`);
  if (container) {
    const items = [...container.querySelectorAll('.sel-chip-draggable')];
    order.forEach(id => {
      const el = items.find(el => el.dataset.itemId === id);
      if (el) container.appendChild(el);
    });
  }

  const prevOrder = version[c.orderKey] && version[c.orderKey].length > 0
    ? [...version[c.orderKey]] : [...allIds];

  this._showReorderConfirm(
    () => {
      version[c.orderKey] = order;
      Store.saveVersion(version);
      App.refreshPreview();
    },
    () => {
      if (container) {
        const items = [...container.querySelectorAll('.sel-chip-draggable')];
        prevOrder.forEach(id => {
          const el = items.find(el => el.dataset.itemId === id);
          if (el) container.appendChild(el);
        });
      }
    }
  );
},

onItemDragEnd(event) {
  event.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.sel-chip-draggable').forEach(el => el.classList.remove('drag-over'));
  this._itemDragSrcId = null;
  this._itemDragType = null;
},
```

- [ ] **Step 3: renderItemSelector에서 칩을 드래그 가능하게 변경**

`js/version.js`의 `renderItemSelector()` 함수에서 스킬, 학력, 자격증의 선택된 항목 칩 렌더링 부분을 수정한다. `makeModalSection` 헬퍼 또는 직접 칩 렌더링 부분에서, 선택된 항목들을 드래그 가능한 칩으로 교체:

```javascript
// 예: 스킬 그룹 칩
const skillChips = selectedSkills.map(s => `
  <span class="sel-chip sel-chip-draggable" data-item-id="${s.id}" draggable="true"
    ondragstart="VersionManager.onItemDragStart(event,'${s.id}','skills')"
    ondragover="VersionManager.onItemDragOver(event)"
    ondragleave="VersionManager.onItemDragLeave(event)"
    ondrop="VersionManager.onItemDrop(event,'${s.id}','${v.id}','skills')"
    ondragend="VersionManager.onItemDragEnd(event)">
    <span class="drag-handle drag-handle--sm">⠿</span>${esc(s.category)}
  </span>`).join('');
```

학력, 자격증도 동일 패턴. 칩 컨테이너에 `sel-chips-sortable` 클래스와 `data-type` 속성 추가:

```html
<div class="sel-chips-wrap sel-chips-sortable" data-type="skills">${skillChips}</div>
```

- [ ] **Step 4: 드래그 가능 칩 CSS 추가**

`css/app.css`에 추가:

```css
/* ── 항목 칩 드래그 ──────────────────────────────────── */
.sel-chip-draggable {
  cursor: grab; display: inline-flex; align-items: center; gap: 4px;
  transition: opacity 0.15s;
}
.sel-chip-draggable.dragging { opacity: 0.4; }
.sel-chip-draggable.drag-over { outline: 2px solid #5500ff; outline-offset: 2px; }
.drag-handle--sm { font-size: 12px; color: #b0b8cc; cursor: grab; }
.drag-handle--sm:hover { color: #5500ff; }
```

- [ ] **Step 5: 커밋**

```bash
git add js/version.js css/app.css
git commit -m "feat: 스킬/학력/자격증 항목 레벨 드래그앤드롭 구현"
```

---

### Task 8: 통합 테스트 및 엣지 케이스 처리

**Files:**
- Modify: `js/version.js` (필요시)
- Modify: `js/store.js` (필요시)

- [ ] **Step 1: 브라우저에서 전체 기능 테스트**

다음 시나리오를 확인:
1. 섹션 순서 변경 (경력 ↔ 스킬) → 확인 모달 → 변경 → 미리보기 반영 확인
2. 섹션 순서 변경 → 취소 → 원래 순서 복원 확인
3. 경력 항목 순서 변경 → 확인 모달 → 변경 → 미리보기 반영 확인
4. 스킬 그룹 순서 변경 → 확인 모달 → 변경 → 미리보기 반영 확인
5. 학력 순서 변경 → 확인 모달 → 변경 → 미리보기 반영 확인
6. 페이지 새로고침 후 순서 유지 확인
7. 항목이 1개일 때 드래그 시도 — 정상 무시 확인
8. 새 버전 생성 시 기본 순서 적용 확인

- [ ] **Step 2: 발견된 이슈 수정**

- [ ] **Step 3: 최종 커밋 및 푸시**

```bash
git add -A
git commit -m "feat: 섹션 & 항목 드래그앤드롭 순서 변경 완료"
git push origin main
```
