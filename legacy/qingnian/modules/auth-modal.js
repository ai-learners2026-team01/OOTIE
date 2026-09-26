(function () {
  const AUTH_STORAGE_KEY = 'ootie-auth-state-v1';
  let isLoggedIn = loadAuthState();
  let getProfile;
  let showToast;
  let avatar;
  let authBackdrop;
  let profileBackdrop;

  function loadAuthState() {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    } catch (error) {
      console.error('Unable to load authentication state.', error);
      return false;
    }
  }

  function saveAuthState() {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, isLoggedIn.toString());
    } catch (error) {
      console.error('Unable to save authentication state.', error);
    }
  }

  function renderProfile() {
    if (!avatar || !getProfile) return;

    const profile = getProfile();
    avatar.textContent = isLoggedIn ? (profile.initials || 'HL') : '登入';
    avatar.classList.toggle('is-logged-in', isLoggedIn);

    document.getElementById('profileMenuName').textContent = profile.name || 'Hayley Lin';
    document.getElementById('profileMenuHandle').textContent = profile.username || '@hayley';
    document.getElementById('profileMenuAvatar').textContent = profile.initials || 'HL';
    document.getElementById('profileMenuHearts').textContent = profile.hearts;
    document.getElementById('profileMenuHelped').textContent = profile.helped;
    document.getElementById('profileMenuLikes').textContent = profile.likes;
  }

  function switchAuthTab(tab) {
    document.querySelectorAll('[data-auth-tab]').forEach(button => {
      button.classList.toggle('active', button.dataset.authTab === tab);
    });
    const panelEmail = document.getElementById('authPanelEmail');
    const panelPhone = document.getElementById('authPanelPhone');
    panelEmail.style.display = tab === 'email' ? 'block' : 'none';
    panelPhone.style.display = tab === 'phone' ? 'block' : 'none';

    const input = document.getElementById(tab === 'email' ? 'authIdentity' : 'authPhone');
    setTimeout(() => input.focus(), 100);
  }

  function openAuthModal() {
    closeProfileMenu();
    document.getElementById('authForm').reset();
    switchAuthTab('email');
    authBackdrop.classList.add('open');
  }

  function closeAuthModal() {
    authBackdrop.classList.remove('open');
  }

  function openProfileMenu() {
    renderProfile();
    profileBackdrop.classList.add('open');
  }

  function closeProfileMenu() {
    profileBackdrop?.classList.remove('open');
  }

  function handleAuthSubmit(event) {
    event.preventDefault();
    const tab = document.querySelector('[data-auth-tab].active')?.dataset.authTab || 'email';
    const value = document.getElementById(tab === 'email' ? 'authIdentity' : 'authPhone').value.trim();
    if (!value) {
      showToast(tab === 'email' ? '請輸入帳號或 Email' : '請輸入手機號碼');
      return;
    }

    if (!document.getElementById('authPassword').value.trim()) {
      showToast('請輸入密碼');
      return;
    }

    isLoggedIn = true;
    saveAuthState();
    closeAuthModal();
    renderProfile();
    showToast('登入成功');
  }

  function logout() {
    isLoggedIn = false;
    saveAuthState();
    closeProfileMenu();
    renderProfile();
    showToast('已登出');
  }

  function mount({ topbarActions, getProfile: readProfile, showToast: notify }) {
    if (!topbarActions || typeof readProfile !== 'function' || typeof notify !== 'function') {
      throw new Error('Authentication module requires a topbar, profile provider, and toast handler.');
    }

    getProfile = readProfile;
    showToast = notify;
    topbarActions.insertAdjacentHTML('beforeend', `
      <div class="avatar" id="avatarButton" tabindex="0" role="button" aria-label="會員功能">登入</div>
    `);
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-backdrop" id="authBackdrop">
        <section class="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="authTitle">
          <button class="modal-close" id="closeAuth" aria-label="關閉">×</button>
          <p class="eyebrow">會員專屬服務</p>
          <h2 id="authTitle">登入 OOTie</h2>
          <p class="auth-subtitle">享受所有會員專屬服務</p>
          <div class="auth-tabs">
            <button class="auth-tab active" type="button" data-auth-tab="email">Email / 帳號</button>
            <button class="auth-tab" type="button" data-auth-tab="phone">手機號碼</button>
          </div>
          <form class="auth-form" id="authForm" novalidate>
            <div class="auth-tab-panel" id="authPanelEmail">
              <div class="form-field"><label for="authIdentity">帳號 / Email</label><input id="authIdentity" type="text" required placeholder="your@email.com 或帳號"></div>
            </div>
            <div class="auth-tab-panel" id="authPanelPhone" style="display:none">
              <div class="form-field"><label for="authPhone">手機號碼</label><input id="authPhone" type="tel" required placeholder="0912-345-678"></div>
            </div>
            <div class="form-field auth-password-field"><label for="authPassword">密碼</label><input id="authPassword" type="password" required autocomplete="current-password" placeholder="請輸入密碼"></div>
            <button type="submit" class="primary auth-submit">登入</button>
          </form>
        </section>
      </div>
      <div class="popover-backdrop" id="profileBackdrop">
        <section class="popover profile-popover">
          <button class="popover-close" id="closeProfileMenu" aria-label="關閉">×</button>
          <div class="popover-avatar" id="profileMenuAvatar">HL</div>
          <div class="popover-copy"><strong id="profileMenuName">Hayley Lin</strong><span id="profileMenuHandle">@hayley</span></div>
          <div class="popover-stats"><div class="popover-stat"><strong id="profileMenuHearts">328</strong><span>Hearts</span></div><div class="popover-stat"><strong id="profileMenuHelped">24</strong><span>幫助衣友</span></div><div class="popover-stat"><strong id="profileMenuLikes">186</strong><span>獲得讚數</span></div></div>
          <div class="popover-actions"><a class="primary popover-btn" href="profile.html" id="profileMenuLink">前往個人檔案</a><button class="secondary popover-btn" id="logoutButton">登出</button></div>
        </section>
      </div>
    `);

    avatar = document.getElementById('avatarButton');
    authBackdrop = document.getElementById('authBackdrop');
    profileBackdrop = document.getElementById('profileBackdrop');

    avatar.addEventListener('click', () => isLoggedIn ? openProfileMenu() : openAuthModal());
    avatar.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        isLoggedIn ? openProfileMenu() : openAuthModal();
      }
    });
    document.getElementById('closeAuth').addEventListener('click', closeAuthModal);
    authBackdrop.addEventListener('click', event => {
      if (event.target === authBackdrop) closeAuthModal();
    });
    document.querySelectorAll('[data-auth-tab]').forEach(button => {
      button.addEventListener('click', () => switchAuthTab(button.dataset.authTab));
    });
    document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);
    document.getElementById('closeProfileMenu').addEventListener('click', closeProfileMenu);
    document.getElementById('profileMenuLink').addEventListener('click', closeProfileMenu);
    document.getElementById('logoutButton').addEventListener('click', logout);
    profileBackdrop.addEventListener('click', event => {
      if (event.target === profileBackdrop) closeProfileMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeAuthModal();
        closeProfileMenu();
      }
    });
    renderProfile();
  }

  window.OotieAuthModal = {
    mount,
    refreshProfile:renderProfile
  };
})();
