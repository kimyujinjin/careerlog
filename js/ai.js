// ── AI 초안 생성 (Google Gemini API) ──────────────────
const AI = {

  getApiKey() {
    return localStorage.getItem('gemini_api_key') || '';
  },

  saveApiKey(key) {
    localStorage.setItem('gemini_api_key', key.trim());
  },

  // ── API 키 설정 모달 ──────────────────────────────
  openSettingsModal() {
    const current = this.getApiKey();
    const html = `
    <div class="modal-overlay" id="ai-settings-modal">
      <div class="modal">
        <div class="modal-header">
          <h3>Gemini API 키 설정</h3>
          <button class="modal-close" onclick="closeModal('ai-settings-modal')">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-desc">
            Google AI Studio에서 무료로 API 키를 발급받을 수 있습니다.<br>
            키는 이 기기의 브라우저에만 저장되며 외부로 전송되지 않습니다.
          </p>
          <div class="form-row">
            <label>Gemini API 키</label>
            <input id="gemini-key-input" type="password" value="${esc(current)}"
              placeholder="AIza...">
          </div>
          <div style="margin-top:8px;">
            <a class="btn-link" href="https://aistudio.google.com/app/apikey" target="_blank">
              → Google AI Studio에서 API 키 발급받기
            </a>
          </div>
        </div>
        <div class="modal-footer">
          ${current ? `<button class="btn-ghost btn-danger" onclick="AI.clearApiKey()">키 삭제</button>` : ''}
          <button class="btn-ghost" onclick="closeModal('ai-settings-modal')">취소</button>
          <button class="btn-primary" onclick="AI.saveApiKeyFromModal()">저장</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(() => document.getElementById('gemini-key-input').focus(), 50);
  },

  saveApiKeyFromModal() {
    const key = document.getElementById('gemini-key-input').value.trim();
    if (!key) { alert('API 키를 입력하세요.'); return; }
    this.saveApiKey(key);
    closeModal('ai-settings-modal');
    App.updateAiKeyBadge();
    showToast('API 키가 저장되었습니다.');
  },

  clearApiKey() {
    if (!confirm('저장된 API 키를 삭제할까요?')) return;
    localStorage.removeItem('gemini_api_key');
    closeModal('ai-settings-modal');
    App.updateAiKeyBadge();
    showToast('API 키가 삭제되었습니다.');
  },

  // ── AI 초안 생성 모달 ────────────────────────────
  openDraftModal(versionId) {
    if (!this.getApiKey()) {
      if (confirm('Gemini API 키가 없습니다. 지금 설정할까요?')) {
        this.openSettingsModal();
      }
      return;
    }

    const html = `
    <div class="modal-overlay" id="ai-draft-modal">
      <div class="modal modal--wide">
        <div class="modal-header">
          <h3>✨ AI 맞춤 초안 생성</h3>
          <button class="modal-close" onclick="closeModal('ai-draft-modal')">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-desc">채용공고 URL을 입력하면 AI가 페이지를 직접 읽고 마스터 데이터를 분석해서 맞춤 초안을 만들어 줍니다.</p>
          <div class="form-row form-row--full">
            <label>채용공고 URL *</label>
            <input id="ai-jd-url" type="url" placeholder="https://www.wanted.co.kr/wd/...">
          </div>
          <div class="form-row form-row--full">
            <label>채용공고 내용 추가 입력 <span class="label-hint">(선택 — URL로 파악이 안 된 내용 보완용)</span></label>
            <textarea id="ai-jd-text" rows="5"
              placeholder="URL만으로 충분하면 비워두세요.&#10;추가로 강조할 내용이나 URL에서 누락된 정보를 입력하세요."></textarea>
          </div>
          <div id="ai-result-area" style="display:none;">
            <div class="ai-result-divider">✨ AI 생성 결과</div>
            <div id="ai-result-content"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" onclick="closeModal('ai-draft-modal')">닫기</button>
          <button class="btn-primary" id="ai-generate-btn" onclick="AI.generate('${versionId}')">
            ✨ 초안 생성
          </button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(() => document.getElementById('ai-jd-url').focus(), 50);
  },

  async generate(versionId) {
    const jdUrl  = document.getElementById('ai-jd-url').value.trim();
    const jdText = document.getElementById('ai-jd-text').value.trim();

    if (!jdUrl) { alert('채용공고 URL을 입력하세요.'); return; }
    try { new URL(jdUrl); } catch { alert('올바른 URL 형식이 아닙니다.'); return; }

    const apiKey = this.getApiKey();
    const profile = Store.getProfile();

    const masterSummary = this._buildMasterSummary(profile);

    const promptText = `당신은 이직 준비를 도와주는 커리어 전문가입니다.
위 URL의 채용공고 페이지를 읽고, 아래 [마스터 이력 데이터]를 분석해서 이 사람이 해당 포지션에 지원할 때 최적화된 이력서 초안을 만들어 주세요.
${jdText ? `\n[추가 채용공고 정보]\n${jdText}\n` : ''}
[마스터 이력 데이터]
${masterSummary}

반드시 아래 JSON 형식으로만 응답하세요. 설명 텍스트, 마크다운, 코드블록 없이 JSON 객체만 출력하세요:
{"summary":"이 포지션에 맞춘 자기소개 3~5문장","summaryLabel":"버전 구분용 짧은 제목","recommendedExperienceIds":["마스터 데이터 경력 id"],"recommendedProjectIds":["마스터 데이터 프로젝트 id"],"highlights":["강조 포인트1","강조 포인트2"],"missingSkills":["보완 역량1"]}`;

    const btn = document.getElementById('ai-generate-btn');
    btn.disabled = true;
    btn.textContent = '생성 중…';

    try {
      // Step 1: URL 페이지 내용 크롤링 시도
      let jdPageText = '';
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(jdUrl)}`;
        const crawlRes = await fetch(proxyUrl);
        if (crawlRes.ok) {
          const crawlData = await crawlRes.json();
          // HTML 태그 제거해서 텍스트만 추출
          const tmp = document.createElement('div');
          tmp.innerHTML = crawlData.contents || '';
          jdPageText = tmp.innerText?.slice(0, 4000) || '';
        }
      } catch { /* 크롤링 실패 시 무시 */ }

      const finalPrompt = promptText.replace(
        '위 URL의 채용공고 페이지를 읽고,',
        jdPageText
          ? `아래 채용공고(URL: ${jdUrl})를 분석하고,`
          : `아래 채용공고 URL(${jdUrl})을 참고하고,`
      ) + (jdPageText ? `\n\n[채용공고 페이지 내용]\n${jdPageText}` : '');

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: finalPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: 'application/json' },
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log('[AI 전체 응답]', JSON.stringify(data, null, 2));

      // finishReason 확인
      const candidate = data.candidates?.[0];
      const finishReason = candidate?.finishReason;
      if (finishReason && finishReason !== 'STOP') {
        throw new Error(`생성 중단: ${finishReason}. 입력 내용을 줄이거나 다시 시도해주세요.`);
      }

      const raw = candidate?.content?.parts?.[0]?.text || '';
      console.log('[AI raw 텍스트]', raw);

      if (!raw) throw new Error('AI 응답이 비어있습니다. 다시 시도해주세요.');

      // JSON 블록 추출 (```json ... ``` 또는 { ... } 형태 모두 대응)
      let jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI 응답에서 JSON을 찾을 수 없습니다. 다시 시도해주세요.');
      const result = JSON.parse(jsonMatch[0]);

      this._showResult(result, versionId, profile);

    } catch (e) {
      alert('오류가 발생했습니다: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '✨ 초안 생성';
    }
  },

  _buildMasterSummary(profile) {
    const exps = (profile.experiences || []).map(e =>
      `[EXP:${e.id}] ${e.company}/${e.role}(${e.startDate}~${e.isCurrent?'현재':e.endDate}) ${e.achievements.slice(0,2).join('/')}`
    ).join('\n');

    const projs = (profile.projects || []).map(p =>
      `[PRJ:${p.id}] ${p.name}(${p.role}) ${p.description?.slice(0,60)} 성과:${p.metrics.slice(0,2).join('/')}`
    ).join('\n');

    const skills = (profile.skills || []).map(s =>
      `${s.category}:${s.items.join(',')}`
    ).join(' / ');

    return `경력:\n${exps}\n\n프로젝트:\n${projs}\n\n스킬:${skills}`;
  },

  _showResult(result, versionId, profile) {
    const area = document.getElementById('ai-result-area');
    const content = document.getElementById('ai-result-content');
    area.style.display = 'block';

    const expNames = (result.recommendedExperienceIds || [])
      .map(id => profile.experiences.find(e => e.id === id)?.company || id)
      .filter(Boolean);

    const projNames = (result.recommendedProjectIds || [])
      .map(id => profile.projects.find(p => p.id === id)?.name || id)
      .filter(Boolean);

    content.innerHTML = `
      <div class="ai-result-section">
        <div class="ai-result-label">✍️ 자기소개 초안</div>
        <p class="ai-result-text" id="ai-summary-text">${esc(result.summary)}</p>
        <button class="btn-sm btn-primary" onclick="AI.applySummary('${versionId}')">
          이 자기소개를 버전에 추가
        </button>
      </div>

      ${expNames.length ? `
      <div class="ai-result-section">
        <div class="ai-result-label">💼 추천 경력</div>
        <div class="ai-chips">${expNames.map(n => `<span class="sel-chip">${esc(n)}</span>`).join('')}</div>
        <button class="btn-sm" onclick="AI.applyExpSelection('${versionId}', ${JSON.stringify(result.recommendedExperienceIds || [])})">
          이 경력들로 버전 선택 적용
        </button>
      </div>` : ''}

      ${projNames.length ? `
      <div class="ai-result-section">
        <div class="ai-result-label">🚀 추천 프로젝트</div>
        <div class="ai-chips">${projNames.map(n => `<span class="sel-chip">${esc(n)}</span>`).join('')}</div>
        <button class="btn-sm" onclick="AI.applyProjSelection('${versionId}', ${JSON.stringify(result.recommendedProjectIds || [])})">
          이 프로젝트들로 버전 선택 적용
        </button>
      </div>` : ''}

      ${result.highlights?.length ? `
      <div class="ai-result-section">
        <div class="ai-result-label">🎯 이 JD에서 강조할 포인트</div>
        <ul class="ai-result-list">
          ${result.highlights.map(h => `<li>${esc(h)}</li>`).join('')}
        </ul>
      </div>` : ''}

      ${result.missingSkills?.length ? `
      <div class="ai-result-section ai-result-section--warn">
        <div class="ai-result-label">⚠️ 보완이 필요한 역량</div>
        <ul class="ai-result-list">
          ${result.missingSkills.map(s => `<li>${esc(s)}</li>`).join('')}
        </ul>
      </div>` : ''}
    `;

    // 결과 영역으로 스크롤
    area.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  applySummary(versionId) {
    const text = document.getElementById('ai-summary-text')?.textContent;
    if (!text) return;

    const label = prompt('이 자기소개의 구분 제목을 입력하세요:', 'AI 생성 초안');
    if (label === null) return;

    const profile = Store.getProfile();
    if (!profile.summaries) profile.summaries = [];
    const newSummary = createSummary({ label, body: text });
    profile.summaries.push(newSummary);
    Store.saveProfile(profile);

    // 버전에 바로 선택
    const version = Store.getVersion(versionId);
    if (version) {
      version.selectedSummaryId = newSummary.id;
      Store.saveVersion(version);
    }

    closeModal('ai-draft-modal');
    VersionManager.renderItemSelector(versionId);
    App.refreshPreview();
    showToast('자기소개가 추가되고 이 버전에 적용되었습니다.');
  },

  applyExpSelection(versionId, expIds) {
    const version = Store.getVersion(versionId);
    if (!version) return;
    version.selectedExperienceIds = expIds;
    Store.saveVersion(version);
    VersionManager.renderItemSelector(versionId);
    App.refreshPreview();
    showToast('추천 경력이 버전에 적용되었습니다.');
  },

  applyProjSelection(versionId, projIds) {
    const version = Store.getVersion(versionId);
    if (!version) return;
    version.selectedProjectIds = projIds;
    Store.saveVersion(version);
    VersionManager.renderItemSelector(versionId);
    App.refreshPreview();
    showToast('추천 프로젝트가 버전에 적용되었습니다.');
  },
};
