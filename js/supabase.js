// ── Supabase 클라이언트 ────────────────────────────────
const SUPABASE_URL = 'https://jpuitzpssnptyhyoraxq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6gRjs-kMCugVpBeRHhTSJQ_Qny16j9f';

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth 모듈 ──────────────────────────────────────────
const Auth = {
  _user: null,

  async init() {
    const { data: { session } } = await _sb.auth.getSession();
    this._user = session?.user || null;

    _sb.auth.onAuthStateChange((_event, session) => {
      this._user = session?.user || null;
    });

    return this._user;
  },

  getUser() { return this._user; },

  async signInWithGoogle() {
    await _sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
  },

  async signInWithEmail(email, password) {
    const { error } = await _sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  async signUpWithEmail(email, password) {
    const { error } = await _sb.auth.signUp({ email, password });
    if (error) throw error;
  },

  async signOut() {
    await _sb.auth.signOut();
    window.location.reload();
  },

  // ── 로그인 UI 렌더 ───────────────────────────────────
  renderLoginScreen() {
    document.body.innerHTML = `
    <div class="auth-screen">
      <div class="auth-box">
        <img src="CareerLog.svg" alt="CareerLog" class="auth-logo">
        <p class="auth-sub">이력서 아카이브 & 버전 관리</p>
        <div id="auth-error" class="auth-error hidden"></div>
        <div class="auth-tabs">
          <button class="auth-tab active" id="tab-login" onclick="Auth._switchTab('login')">로그인</button>
          <button class="auth-tab" id="tab-signup" onclick="Auth._switchTab('signup')">회원가입</button>
        </div>
        <div id="auth-form">
          <input class="auth-input" id="auth-email" type="email" placeholder="이메일">
          <input class="auth-input" id="auth-password" type="password" placeholder="비밀번호"
            onkeydown="if(event.key==='Enter') Auth._submit()">
          <button class="auth-btn" id="auth-submit-btn" onclick="Auth._submit()">로그인</button>
        </div>
        <div class="auth-divider"><span>또는</span></div>
        <button class="auth-btn auth-btn--google" onclick="Auth.signInWithGoogle()">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/></svg>
          Google로 계속하기
        </button>
      </div>
    </div>`;
  },

  _currentTab: 'login',
  _switchTab(tab) {
    this._currentTab = tab;
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
    document.getElementById('auth-submit-btn').textContent = tab === 'login' ? '로그인' : '회원가입';
    document.getElementById('auth-error').classList.add('hidden');
  },

  async _submit() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const errEl = document.getElementById('auth-error');
    errEl.classList.add('hidden');
    try {
      if (this._currentTab === 'login') {
        await this.signInWithEmail(email, password);
      } else {
        await this.signUpWithEmail(email, password);
        errEl.textContent = '가입 확인 이메일을 보냈습니다. 이메일을 확인해주세요.';
        errEl.classList.remove('hidden');
        errEl.style.color = '#22c55e';
        return;
      }
      window.location.reload();
    } catch(e) {
      errEl.textContent = e.message || '오류가 발생했습니다.';
      errEl.classList.remove('hidden');
      errEl.style.color = '';
    }
  },
};
