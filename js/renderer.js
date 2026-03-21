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
function renderPersonal(p, resumeTitle) {
  const contacts = [
    p.phone    ? esc(p.phone) : '',
    p.email    ? esc(p.email) : '',
    p.location ? esc(p.location) : '',
    p.linkedin ? esc(p.linkedin) : '',
    p.github   ? esc(p.github) : '',
  ].filter(Boolean).join('  ·  ');
  return `
  <div class="r-header">
    <h1 class="r-name">${esc(resumeTitle || p.name)}</h1>
    ${p.title ? `<p class="r-title">${esc(p.title)}</p>` : ''}
    ${contacts ? `<p class="r-contact">${contacts}</p>` : ''}
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

function renderExpProjectItem(p) {
  const period = formatPeriod(p.startDate, p.endDate);
  const metaparts = [period, p.role ? esc(p.role) : ''].filter(Boolean);
  if (p.tags && p.tags.filter(Boolean).length) metaparts.push(p.tags.filter(Boolean).map(esc).join(', '));
  return `
    <div class="r-exp-proj">
      <p class="r-exp-proj__name">${esc(p.name)}</p>
      ${metaparts.length ? `<p class="r-exp-proj__meta">${metaparts.join('<span class="r-meta-sep"> | </span>')}</p>` : ''}
      ${p.description ? `<p class="r-exp-proj__line"><span class="r-exp-proj__label">- 배경</span> : ${esc(p.description).replace(/\n/g,'<br>')}</p>` : ''}
      ${p.contributions && p.contributions.filter(Boolean).length ? p.contributions.filter(Boolean).map(c => `<p class="r-exp-proj__line"><span class="r-exp-proj__label">- 주요실행</span> : ${esc(c)}</p>`).join('') : ''}
      ${p.metrics && p.metrics.filter(Boolean).length ? `<p class="r-exp-proj__line"><span class="r-exp-proj__label">- 성과</span> : ${p.metrics.filter(Boolean).map(esc).join(', ')}</p>` : ''}
    </div>`;
}

function renderExperiences(experiences, projects) {
  if (!experiences || experiences.length === 0) return '';
  const expIds = new Set(experiences.map(e => e.id));
  const linkedIds = new Set((projects || []).filter(p => p.experienceId && expIds.has(p.experienceId)).map(p => p.id));
  const floatingProjects = (projects || []).filter(p => !linkedIds.has(p.id));

  const items = experiences.map(e => {
    const expProjects = (projects || []).filter(p => p.experienceId === e.id);
    const metaParts = [
      formatPeriod(e.startDate, e.endDate, e.isCurrent),
      e.role ? esc(e.role) : '',
      e.department ? esc(e.department) : '',
    ].filter(Boolean);
    const projBlock = expProjects.length === 0 ? '' : `
      <div class="r-exp-projs">
        ${expProjects.map(renderExpProjectItem).join('')}
      </div>`;
    return `
    <div class="r-item">
      <div class="r-exp-company-row">
        ${e.logo ? `<img class="r-exp-logo" src="${esc(e.logo)}" alt="">` : ''}
        <div class="r-exp-company-info">
          <span class="r-company">${esc(e.company)}</span>
          ${metaParts.length ? `<p class="r-exp-meta">${metaParts.join('<span class="r-meta-sep"> | </span>')}</p>` : ''}
        </div>
      </div>
      ${e.description ? `<p class="r-desc">${esc(e.description).replace(/\n/g,'<br>')}</p>` : ''}
      ${e.achievements && e.achievements.filter(Boolean).length ? bulletList(e.achievements) : ''}
      ${projBlock}
    </div>`;
  }).join('');

  const floatingBlock = floatingProjects.length === 0 ? '' : `
    <section class="r-section">
      <h2>프로젝트</h2>
      ${floatingProjects.map(p => `
        <div class="r-item">
          <p class="r-exp-proj__name">${esc(p.name)}</p>
          ${p.description ? `<p class="r-exp-proj__line"><span class="r-exp-proj__label">- 배경</span> : ${esc(p.description)}</p>` : ''}
          ${p.contributions && p.contributions.filter(Boolean).length ? p.contributions.filter(Boolean).map(c => `<p class="r-exp-proj__line"><span class="r-exp-proj__label">- 주요실행</span> : ${esc(c)}</p>`).join('') : ''}
          ${p.metrics && p.metrics.filter(Boolean).length ? `<p class="r-exp-proj__line"><span class="r-exp-proj__label">- 성과</span> : ${p.metrics.filter(Boolean).map(esc).join(', ')}</p>` : ''}
        </div>`).join('')}
    </section>`;

  // 총 경력 계산 (겹치는 기간 제거)
  const intervals = experiences.map(e => {
    const s = e.startDate ? new Date(e.startDate.length === 7 ? e.startDate + '-01' : e.startDate) : null;
    const en = e.isCurrent ? new Date() : (e.endDate ? new Date(e.endDate.length === 7 ? e.endDate + '-01' : e.endDate) : null);
    return (s && en && en >= s) ? [s.getTime(), en.getTime()] : null;
  }).filter(Boolean).sort((a,b) => a[0]-b[0]);
  let totalMs = 0;
  let curStart = null, curEnd = null;
  for (const [s,e] of intervals) {
    if (curStart === null) { curStart = s; curEnd = e; }
    else if (s <= curEnd) { curEnd = Math.max(curEnd, e); }
    else { totalMs += curEnd - curStart; curStart = s; curEnd = e; }
  }
  if (curStart !== null) totalMs += curEnd - curStart;
  const totalMonths = Math.floor(totalMs / (1000*60*60*24*30.44));
  const yy = Math.floor(totalMonths / 12), mm = totalMonths % 12;
  const totalLabel = yy > 0 ? (mm > 0 ? `${yy}년 ${mm}개월` : `${yy}년`) : (mm > 0 ? `${mm}개월` : '');

  return `<section class="r-section"><h2>경력${totalLabel ? `<span class="r-exp-total">${totalLabel}</span>` : ''}</h2>${items}</section>${floatingBlock}`;
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
