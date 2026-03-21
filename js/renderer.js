// ── 공통 헬퍼 ─────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function formatPeriod(start, end, isCurrent) {
  if (!start) return '';
  const e = isCurrent ? '현재' : (end || '');
  return esc(start) + (e ? ' ~ ' + esc(e) : '');
}

function bulletList(arr) {
  if (!arr || arr.length === 0) return '';
  return '<ul>' + arr.filter(Boolean).map(item => `<li>${esc(item)}</li>`).join('') + '</ul>';
}

function metricBadges(arr) {
  if (!arr || arr.length === 0) return '';
  return '<div class="metrics">' + arr.filter(Boolean).map(m => `<span class="badge">${esc(m)}</span>`).join('') + '</div>';
}

function tagBadges(arr) {
  if (!arr || arr.length === 0) return '';
  return '<div class="tags">' + arr.filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join('') + '</div>';
}

// ── 섹션 렌더러 ───────────────────────────────────────
function renderPersonal(p) {
  const contacts = [
    p.phone    ? esc(p.phone) : '',
    p.email    ? esc(p.email) : '',
    p.location ? esc(p.location) : '',
    p.linkedin ? esc(p.linkedin) : '',
    p.github   ? esc(p.github) : '',
  ].filter(Boolean).join('  ·  ');
  return `
  <div class="r-header">
    <div class="r-header__top">
      <div class="r-header__left">
        <h1 class="r-name">${esc(p.name)}</h1>
        ${p.title ? `<p class="r-title">${esc(p.title)}</p>` : ''}
      </div>
      ${contacts ? `<div class="r-contact">${contacts}</div>` : ''}
    </div>
    ${p.summary ? `<div class="r-summary">${esc(p.summary).replace(/\n/g,'<br>')}</div>` : ''}
  </div>`;
}

function renderProjectItem(p) {
  const period = formatPeriod(p.startDate, p.endDate);
  return `
    <div class="r-proj-item">
      <div class="r-proj-header">
        <span class="r-proj-name">${esc(p.name)}</span>
        ${period ? `<span class="r-proj-period">${period}</span>` : ''}
      </div>
      ${p.role ? `<p class="r-proj-role-text">${esc(p.role)}</p>` : ''}
      ${p.description ? `<div class="r-proj-block"><span class="r-proj-label">배경</span><p class="r-proj-desc">${esc(p.description).replace(/\n/g,'<br>')}</p></div>` : ''}
      ${p.contributions && p.contributions.filter(Boolean).length ? `<div class="r-proj-block"><span class="r-proj-label">주요 실행</span>${bulletList(p.contributions)}</div>` : ''}
      ${p.metrics && p.metrics.filter(Boolean).length ? `<div class="r-proj-block"><span class="r-proj-label">성과</span>${metricBadges(p.metrics)}</div>` : ''}
      ${p.techStack && p.techStack.filter(Boolean).length ? `<p class="r-tech">${p.techStack.filter(Boolean).map(esc).join(' · ')}</p>` : ''}
    </div>`;
}

function renderExperiences(experiences, projects) {
  if (!experiences || experiences.length === 0) return '';
  // 경력에 속하지 않은 독립 프로젝트 (experienceId 없거나 매칭 안 되는 것)
  const expIds = new Set(experiences.map(e => e.id));
  const linkedProjects = (projects || []).filter(p => p.experienceId && expIds.has(p.experienceId));
  const linkedIds = new Set(linkedProjects.map(p => p.id));
  const floatingProjects = (projects || []).filter(p => !linkedIds.has(p.id));

  const items = experiences.map(e => {
    const expProjects = (projects || []).filter(p => p.experienceId === e.id);
    const projBlock = expProjects.length === 0 ? '' : `
      <div class="r-proj-section">
        ${expProjects.map(renderProjectItem).join('')}
      </div>`;
    return `
    <div class="r-item">
      <div class="r-item-header">
        <div class="r-item-header__left">
          <span class="r-company">${esc(e.company)}</span>
          ${e.department ? `<span class="r-dept">${esc(e.department)}</span>` : ''}
        </div>
        <span class="r-period">${formatPeriod(e.startDate, e.endDate, e.isCurrent)}</span>
      </div>
      ${e.role ? `<p class="r-role-line">${esc(e.role)}</p>` : ''}
      ${e.description ? `<p class="r-desc">${esc(e.description).replace(/\n/g,'<br>')}</p>` : ''}
      ${e.achievements && e.achievements.filter(Boolean).length ? bulletList(e.achievements) : ''}
      ${projBlock}
    </div>`;
  }).join('');

  // 경력에 속하지 않은 독립 프로젝트는 별도 섹션으로
  const floatingBlock = floatingProjects.length === 0 ? '' : `
    <section class="r-section">
      <h2>프로젝트</h2>
      ${floatingProjects.map(p => `
        <div class="r-item">
          <div class="r-item-header">
            <div class="r-item-header__left">
              <span class="r-company">${esc(p.name)}</span>
              ${p.company ? `<span class="r-dept"> · ${esc(p.company)}</span>` : ''}
              ${p.role ? `<span class="r-role">${esc(p.role)}</span>` : ''}
            </div>
            <span class="r-period">${formatPeriod(p.startDate, p.endDate)}</span>
          </div>
          ${p.description ? `<p class="r-desc">${esc(p.description)}</p>` : ''}
          ${metricBadges(p.metrics)}
          ${bulletList(p.contributions)}
          ${p.techStack && p.techStack.length ? `<p class="r-tech"><strong>사용 도구:</strong> ${p.techStack.filter(Boolean).map(esc).join(', ')}</p>` : ''}
        </div>`).join('')}
    </section>`;

  return `<section class="r-section"><h2>경력</h2>${items}</section>${floatingBlock}`;
}

function renderSkills(list) {
  if (!list || list.length === 0) return '';
  const items = list.map(s => `
    <div class="r-skill-row">
      <span class="r-skill-cat">${esc(s.category)}</span>
      <span class="r-skill-items">${s.items.filter(Boolean).map(esc).join(', ')}</span>
    </div>`).join('');
  return `<section class="r-section"><h2>보유 역량</h2>${items}</section>`;
}

function renderEducations(list) {
  if (!list || list.length === 0) return '';
  const items = list.map(e => `
    <div class="r-edu-item">
      <div class="r-edu-left">
        <span class="r-company">${esc(e.school)}</span>
        <span class="r-edu-major">${[e.degree, e.major].filter(Boolean).map(esc).join(' ')}</span>
      </div>
      <span class="r-period">${formatPeriod(e.startDate, e.endDate)}</span>
    </div>`).join('');
  return `<section class="r-section"><h2>학력</h2>${items}</section>`;
}

function renderCertifications(list) {
  if (!list || list.length === 0) return '';
  const items = list.map(c => `
    <div class="r-edu-item">
      <div class="r-edu-left">
        <span class="r-company">${esc(c.name)}</span>
        ${c.issuer ? `<span class="r-edu-major">${esc(c.issuer)}</span>` : ''}
      </div>
      <span class="r-period">${esc(c.date)}</span>
    </div>`).join('');
  return `<section class="r-section"><h2>자격증 / 수료</h2>${items}</section>`;
}

// ── 메인 렌더 함수 ────────────────────────────────────
const Renderer = {
  render(resolvedData, templateId) {
    const { resolved } = resolvedData;
    const body =
      renderPersonal(resolved.personal) +
      renderExperiences(resolved.experiences, resolved.projects) +
      renderSkills(resolved.skills) +
      renderEducations(resolved.educations) +
      renderCertifications(resolved.certifications);

    return `<div class="resume-wrap template-${esc(templateId || 'modern')}">${body}</div>`;
  }
};
