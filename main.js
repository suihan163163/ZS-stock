(function () {
  /* ========== 工具函数 ========== */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.from((root || document).querySelectorAll(sel)); };

  /* ========== 年份 ========== */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ========== 移动端菜单 ========== */
  var menuBtn = $("#menuBtn");
  var mobileMenu = $("#mobileMenu");

  function setMenuOpen(open) {
    if (!menuBtn || !mobileMenu) return;
    mobileMenu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    var icon = menuBtn.querySelector("i");
    if (icon) {
      if (open) {
        icon.outerHTML = '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
      } else {
        icon.outerHTML = '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>';
      }
    }
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", function () { setMenuOpen(menuBtn.getAttribute("aria-expanded") === "true" ? false : true); });
    $$("#mobileMenu a[href^='#']").forEach(function (a) { a.addEventListener("click", function () { setMenuOpen(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenuOpen(false); });
    window.addEventListener("resize", function () { if (window.matchMedia("(min-width: 768px)").matches) setMenuOpen(false); });
  }

  /* ========== 平滑滚动 ========== */
  var header = $(".site-header");
  function headerOffset() { return header ? header.getBoundingClientRect().height + 10 : 82; }
  function smoothScrollToId(id) {
    var el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - headerOffset(), behavior: "smooth" });
  }
  $$("a[href^='#']").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var href = a.getAttribute("href");
      if (!href || href === "#") return;
      var id = href.slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault(); smoothScrollToId(id); history.pushState(null, "", "#" + id);
    });
  });
  window.addEventListener("load", function () {
    var hash = (location.hash || "").replace("#", "");
    if (hash && document.getElementById(hash)) setTimeout(function () { smoothScrollToId(hash); }, 50);
  });

  /* ========== 表单验证 & 弹窗 ========== */
  var inquiryForm = $("#inquiryForm");
  var modal = $("#successModal");
  var modalRef = $("#modalRef");

  function openModal(ref) {
    if (!modal) return;
    if (modalRef) modalRef.textContent = ref || "一般询价";
    modal.hidden = false; modal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden"; document.body.style.overflow = "hidden";
  }
  function closeModal() {
    if (!modal) return;
    modal.hidden = true; modal.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = ""; document.body.style.overflow = "";
  }
  function clearErrors(form) { $$(".field", form).forEach(function (f) { f.classList.remove("error"); var t = $(".error-text", f); if (t) t.remove(); }); }
  function setError(input, msg) {
    var field = input.closest(".field"); if (!field) return;
    field.classList.add("error"); var ex = $(".error-text", field); if (ex) ex.remove();
    var div = document.createElement("div"); div.className = "error-text"; div.textContent = msg; field.appendChild(div);
  }
  function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim()); }

  if (inquiryForm) {
    inquiryForm.addEventListener("submit", function (e) {
      e.preventDefault(); clearErrors(inquiryForm);
      var nv = $("#name") ? $("#name").value.trim() : "";
      var ev = $("#email") ? $("#email").value.trim() : "";
      var mv = $("#message") ? $("#message").value.trim() : "";
      var ok = true;
      if (!nv) { ok = false; setError($("#name"), "请输入您的姓名。"); }
      if (!ev) { ok = false; setError($("#email"), "请输入您的邮箱。"); } else if (!isValidEmail(ev)) { ok = false; setError($("#email"), "请输入有效的邮箱地址。"); }
      if (!mv) { ok = false; setError($("#message"), "请输入留言内容。"); } else if (mv.length < 15) { ok = false; setError($("#message"), "请补充更多细节（型号、数量、目的地等）。"); }
      if (!ok) return;
      openModal("INQ-" + new Date().toISOString().slice(0, 10) + "-" + Math.random().toString(16).slice(2, 6).toUpperCase());
      inquiryForm.reset();
    });
  }
  if (modal) {
    modal.addEventListener("click", function (e) { var t = e.target; if (t instanceof HTMLElement && t.getAttribute("data-close") === "true") closeModal(); });
    document.addEventListener("keydown", function (e) { if (!modal.hidden && e.key === "Escape") closeModal(); });
  }

  /* ========== 登录 / 注册 / 忘记密码 ========== */
  var loginBtn = $("#loginBtn");
  var adminBtn = $("#adminBtn");
  var loginModal = $("#loginModal");
  var loginForm = $("#loginForm");
  var registerForm = $("#registerForm");
  var forgotEmailForm = $("#forgotEmailForm");
  var forgotQuestionForm = $("#forgotQuestionForm");
  var authTabsBar = $("#authTabsBar");

  var forgotPasswordEmail = '';

  function switchAuthTab(tab) {
    if (!loginModal) return;
    if (authTabsBar) authTabsBar.style.display = '';
    loginModal.querySelectorAll('.auth-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.tab === tab); });
    loginModal.querySelectorAll('.auth-form').forEach(function(f) { f.classList.remove('auth-form-active'); });
    var formId = tab === 'login' ? 'loginForm' : 'registerForm';
    var targetForm = loginModal.querySelector('#' + formId);
    if (targetForm) targetForm.classList.add('auth-form-active');
    clearAllAuthErrors();
  }

  function showForgotView(view) {
    if (authTabsBar) authTabsBar.style.display = 'none';
    loginModal.querySelectorAll('.auth-form').forEach(function(f) { f.classList.remove('auth-form-active'); });
    clearAllAuthErrors();
    if (view === 'email') {
      forgotEmailForm.classList.add('auth-form-active');
      setTimeout(function() { var e = $("#forgotEmail"); if (e) e.focus(); }, 100);
    } else if (view === 'question') {
      forgotQuestionForm.classList.add('auth-form-active');
      setTimeout(function() { var a = $("#forgotQuestionAnswer"); if (a) a.focus(); }, 100);
    }
  }

  function clearAllAuthErrors() {
    var ids = ['loginError', 'registerError', 'forgotEmailError', 'forgotEmailSuccess', 'forgotQuestionError'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el) { el.style.display = 'none'; el.textContent = ''; }
    }
  }

  function openLoginModal() {
    if (!loginModal) return;
    loginModal.hidden = false; loginModal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden"; document.body.style.overflow = "hidden";
    switchAuthTab('login');
    setTimeout(function() { var e = $("#loginEmail"); if (e) e.focus(); }, 100);
  }
  function closeLoginModal() {
    if (!loginModal) return;
    loginModal.hidden = true; loginModal.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = ""; document.body.style.overflow = "";
    clearAllAuthErrors();
  }

  function checkLoginStatus() {
    var token = localStorage.getItem('authToken');
    var user;
    try { user = JSON.parse(localStorage.getItem('authUser') || 'null'); } catch (e) { user = null; }
    if (loginBtn && adminBtn) {
      if (token && user) {
        loginBtn.style.display = 'none';
        adminBtn.style.display = 'inline-flex';
        if (user.role === 'admin') {
          adminBtn.href = 'admin.html';
          adminBtn.innerHTML = '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> 管理';
        } else {
          adminBtn.href = 'account.html';
          adminBtn.innerHTML = '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg> 询价管理';
        }
      } else {
        loginBtn.style.display = 'inline-flex';
        adminBtn.style.display = 'none';
      }
    }
  }
  checkLoginStatus();
  /* 兼容 account.html / products.html 的 inquiryManageBtn + logoutBtn */
  (function(){
    function doLogout(){
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.href = 'index.html';
    }
    window.doLogout = doLogout;
    var token = localStorage.getItem('authToken');
    var user;
    try { user = JSON.parse(localStorage.getItem('authUser') || 'null'); } catch(e) { user = null; }
    var imb = document.getElementById('inquiryManageBtn');
    var lo = document.getElementById('logoutBtn');
    var lb = document.getElementById('loginBtn');
    if(token && user){
      if(imb){
        imb.style.display = 'inline-flex';
        if(user.role === 'admin'){
          imb.href = 'admin.html';
          imb.innerHTML = '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1-1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> 管理';
        } else {
          imb.href = 'account.html';
          imb.innerHTML = '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg> 询价管理';
        }
      }
      if(lo){
        lo.style.display = 'inline-flex';
        lo.addEventListener('click', function(e){ e.preventDefault(); doLogout(); });
      }
      if(lb) lb.style.display = 'none';
    } else {
      if(imb) imb.style.display = 'none';
      if(lo) lo.style.display = 'none';
    }
  })();
  if (loginBtn) loginBtn.addEventListener('click', openLoginModal);
  if (loginModal) {
    loginModal.querySelectorAll('.auth-tab').forEach(function(tab) {
      tab.addEventListener('click', function() { switchAuthTab(this.dataset.tab); });
    });
    loginModal.addEventListener("click", function (e) { var t = e.target; if (t instanceof HTMLElement && t.getAttribute("data-close") === "true") closeLoginModal(); });
    document.addEventListener("keydown", function (e) { if (loginModal && !loginModal.hidden && e.key === "Escape") closeLoginModal(); });
  }
  document.querySelectorAll('.password-toggle').forEach(function(toggle) {
    toggle.addEventListener('click', function() {
      var wrapper = this.closest('.password-wrapper') || this.parentElement;
      var input = wrapper ? wrapper.querySelector('input') : null;
      if (!input) return;
      if (input.type === 'password') { input.type = 'text'; this.innerHTML = '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>'; }
      else { input.type = 'password'; this.innerHTML = '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>'; }
    });
  });

  document.querySelectorAll('.input-clear-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var targetId = this.getAttribute('data-target');
      var input = targetId ? document.getElementById(targetId) : null;
      if (input) input.value = '';
      var pwInput = document.getElementById('loginPassword');
      if (pwInput) pwInput.value = '';
      if (input) input.focus();
    });
  });

  var forgotPasswordLink = $("#forgotPasswordLink");
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function() { showForgotView('email'); });
  }

  var backToLoginFromForgot = $("#backToLoginFromForgot");
  if (backToLoginFromForgot) {
    backToLoginFromForgot.addEventListener('click', function() { switchAuthTab('login'); });
  }

  var backToForgotEmail = $("#backToForgotEmail");
  if (backToForgotEmail) {
    backToForgotEmail.addEventListener('click', function() { showForgotView('email'); });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var loginErr = document.getElementById('loginError');
      if (loginErr) { loginErr.style.display = 'none'; loginErr.textContent = ''; }
      var email = $("#loginEmail") ? $("#loginEmail").value.trim() : "";
      var password = $("#loginPassword") ? $("#loginPassword").value.trim() : "";
      if (!email) { if (loginErr) { loginErr.textContent = '请输入邮箱。'; loginErr.style.display = 'block'; } return; }
      if (!password) { if (loginErr) { loginErr.textContent = '请输入密码。'; loginErr.style.display = 'block'; } return; }
      if (email === 'admin') email = 'admin@zhuoshi.com';
      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      }).then(function(res) { return res.json(); }).then(function(data) {
        if (data.success) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('authUser', JSON.stringify(data.user));
          checkLoginStatus(); closeLoginModal();
          if ($("#loginEmail")) $("#loginEmail").value = ''; if ($("#loginPassword")) $("#loginPassword").value = '';
          var role = data.user && data.user.role;
          if (role === 'admin') window.location.href = 'admin.html';
          else if (role === 'user') window.location.href = 'account.html';
        } else {
          if (loginErr) { loginErr.textContent = data.message || '登录失败'; loginErr.style.display = 'block'; setTimeout(function() { loginErr.style.display = 'none'; }, 3000); }
        }
      }).catch(function() {
        if (loginErr) { loginErr.textContent = '网络错误，请稍后重试。'; loginErr.style.display = 'block'; setTimeout(function() { loginErr.style.display = 'none'; }, 3000); }
      });
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var regErr = document.getElementById('registerError');
      if (regErr) { regErr.style.display = 'none'; regErr.textContent = ''; }
      var email = $("#regEmail") ? $("#regEmail").value.trim() : "";
      var countryCode = $("#regCountryCode") ? $("#regCountryCode").value : "+86";
      var phone = $("#regPhone") ? $("#regPhone").value.trim() : "";
      var securityQuestion = $("#regSecurityQuestion") ? $("#regSecurityQuestion").value : "";
      var securityAnswer = $("#regSecurityAnswer") ? $("#regSecurityAnswer").value.trim() : "";
      var password = $("#regPassword") ? $("#regPassword").value.trim() : "";
      if (!email) { if (regErr) { regErr.textContent = '请输入邮箱。'; regErr.style.display = 'block'; } return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { if (regErr) { regErr.textContent = '邮箱格式不正确。'; regErr.style.display = 'block'; } return; }
      if (!phone) { if (regErr) { regErr.textContent = '请输入手机号。'; regErr.style.display = 'block'; } return; }
      if (!securityQuestion) { if (regErr) { regErr.textContent = 'Please select a security question.'; regErr.style.display = 'block'; } return; }
      if (!securityAnswer) { if (regErr) { regErr.textContent = 'Please provide your security answer.'; regErr.style.display = 'block'; } return; }
      if (!password) { if (regErr) { regErr.textContent = '请设置密码。'; regErr.style.display = 'block'; } return; }
      if (password.length < 6) { if (regErr) { regErr.textContent = '密码长度至少为6位。'; regErr.style.display = 'block'; return; } }
      fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, phone: phone, countryCode: countryCode, password: password, securityQuestion: securityQuestion, securityAnswer: securityAnswer })
      }).then(function(res) { return res.json(); }).then(function(data) {
        if (data.success) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('authUser', JSON.stringify(data.user));
          checkLoginStatus(); closeLoginModal();
          if ($("#regEmail")) $("#regEmail").value = ''; if ($("#regPhone")) $("#regPhone").value = '';
          if ($("#regSecurityQuestion")) $("#regSecurityQuestion").value = ''; if ($("#regSecurityAnswer")) $("#regSecurityAnswer").value = '';
          if ($("#regPassword")) $("#regPassword").value = '';
          var role = data.user && data.user.role;
          if (role === 'user') window.location.href = 'account.html';
        } else {
          if (regErr) { regErr.textContent = data.message || '注册失败'; regErr.style.display = 'block'; setTimeout(function() { regErr.style.display = 'none'; }, 3000); }
        }
      }).catch(function() {
        if (regErr) { regErr.textContent = '网络错误，请稍后重试。'; regErr.style.display = 'block'; setTimeout(function() { regErr.style.display = 'none'; }, 3000); }
      });
    });
  }

  if (forgotEmailForm) {
    forgotEmailForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var errEl = document.getElementById('forgotEmailError');
      var succEl = document.getElementById('forgotEmailSuccess');
      if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
      if (succEl) { succEl.style.display = 'none'; succEl.textContent = ''; }
      var email = $("#forgotEmail") ? $("#forgotEmail").value.trim() : "";
      if (!email) { if (errEl) { errEl.textContent = '请输入邮箱地址。'; errEl.style.display = 'block'; } return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { if (errEl) { errEl.textContent = '邮箱格式不正确。'; errEl.style.display = 'block'; } return; }
      forgotPasswordEmail = email;
      fetch('/api/get-security-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      }).then(function(res) { return res.json(); }).then(function(data) {
        if (data.success) {
          var qDisp = $("#forgotQuestionDisplay");
          if (qDisp) qDisp.value = data.securityQuestion;
          showForgotView('question');
        } else {
          if (errEl) { errEl.textContent = data.message || '获取密保问题失败'; errEl.style.display = 'block'; }
        }
      }).catch(function() {
        if (errEl) { errEl.textContent = '网络错误，请稍后重试。'; errEl.style.display = 'block'; }
      });
    });
  }

  if (forgotQuestionForm) {
    forgotQuestionForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var errEl = document.getElementById('forgotQuestionError');
      if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
      var answer = $("#forgotQuestionAnswer") ? $("#forgotQuestionAnswer").value.trim() : "";
      if (!answer) { if (errEl) { errEl.textContent = '请输入密保答案。'; errEl.style.display = 'block'; } return; }
      fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail, securityAnswer: answer })
      }).then(function(res) { return res.json(); }).then(function(data) {
        if (data.success) {
          showForgotView('email');
          var succEl = document.getElementById('forgotEmailSuccess');
          if (succEl) {
            succEl.textContent = data.message || '重置链接已发送到您的邮箱';
            succEl.style.display = 'block';
          }
          if ($("#forgotQuestionAnswer")) $("#forgotQuestionAnswer").value = '';
        } else {
          if (errEl) { errEl.textContent = data.message || '验证失败，请重试'; errEl.style.display = 'block'; }
        }
      }).catch(function() {
        if (errEl) { errEl.textContent = '网络错误，请稍后重试。'; errEl.style.display = 'block'; }
      });
    });
  }

  /* ========== Hero 轮播 ========== */
  (function initHeroSlider() {
    var wrapper = document.getElementById('heroSlider');
    var controls = document.getElementById('sliderControls');
    var prevBtn = document.getElementById('sliderPrev');
    var nextBtn = document.getElementById('sliderNext');
    if (!wrapper || !controls) return;
    var slides = wrapper.querySelectorAll('.slide');
    var total = slides.length; if (total === 0) return;
    var current = 0; var autoInterval;
    controls.innerHTML = '';
    for (var i = 0; i < total; i++) {
      var dot = document.createElement('button');
      dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', '切换到第 ' + (i + 1) + ' 张');
      (function (idx) { dot.addEventListener('click', function () { goTo(idx); }); })(i);
      controls.appendChild(dot);
    }
    function goTo(idx) {
      current = ((idx % total) + total) % total;
      wrapper.style.transform = "translateX(-" + (current * 100) + "%)";
      var dots = controls.querySelectorAll('.slider-dot');
      dots.forEach(function (d, j) { d.classList.toggle('active', j === current); });
    }
    function resetAuto() { clearInterval(autoInterval); autoInterval = setInterval(function () { goTo(current + 1); }, 5000); }
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); resetAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); resetAuto(); });
    var slider = wrapper.closest('.hero-slider');
    if (slider) { slider.addEventListener('mouseenter', function () { clearInterval(autoInterval); }); slider.addEventListener('mouseleave', resetAuto); }
    resetAuto();
  })();

  /* ========== 工厂轮播 ========== */
  function initCarousel() {
    var carouselContainer = document.querySelector('.factory-carousel');
    if (!carouselContainer) return;
    var wrapper = carouselContainer.querySelector('.carousel-wrapper');
    var items = carouselContainer.querySelectorAll('.carousel-item');
    var prevBtn = carouselContainer.querySelector('.carousel-control.prev');
    var nextBtn = carouselContainer.querySelector('.carousel-control.next');
    var indicatorsContainer = carouselContainer.querySelector('.carousel-indicators');
    var currentIndex = 0; var itemCount = items.length;
    items.forEach(function (_, index) {
      var indicator = document.createElement('button');
      indicator.className = 'carousel-indicator';
      if (index === 0) indicator.classList.add('active');
      indicator.addEventListener('click', function () { goToSlide(index); });
      indicatorsContainer.appendChild(indicator);
    });
    var indicators = carouselContainer.querySelectorAll('.carousel-indicator');
    function goToSlide(index) { currentIndex = index; wrapper.style.transform = "translateX(-" + (index * 100) + "%)"; indicators.forEach(function (d, i) { d.classList.toggle('active', i === currentIndex); }); }
    var autoSlideInterval = setInterval(function () { goToSlide((currentIndex + 1) % itemCount); }, 5000);
    if (nextBtn) nextBtn.addEventListener('click', function () { goToSlide((currentIndex + 1) % itemCount); clearInterval(autoSlideInterval); autoSlideInterval = setInterval(function () { goToSlide((currentIndex + 1) % itemCount); }, 5000); });
    if (prevBtn) prevBtn.addEventListener('click', function () { goToSlide((currentIndex - 1 + itemCount) % itemCount); clearInterval(autoSlideInterval); autoSlideInterval = setInterval(function () { goToSlide((currentIndex + 1) % itemCount); }, 5000); });
    carouselContainer.addEventListener('mouseenter', function () { clearInterval(autoSlideInterval); });
    carouselContainer.addEventListener('mouseleave', function () { autoSlideInterval = setInterval(function () { goToSlide((currentIndex + 1) % itemCount); }, 5000); });
  }
  document.addEventListener('DOMContentLoaded', initCarousel);
})();

/* ============================================================
 * 购物车管理器 (CartManager) — 含抛物线飞入动画
 * ============================================================ */
(function() {
  var CART_KEY = 'wzsp_cart';

  function getCart() {
    try {
      var data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
    }
  }

  function addToCart(product, event) {
    if (!product || !product.id) return;
    var cart = getCart();
    var existing = cart.find(function(item) { return item.id === product.id; });
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name || '',
        model: product.model || '',
        price: product.price || 0,
        quantity: 1,
        image: product.image || ''
      });
    }
    saveCart(cart);
    if (event) {
      performFlyAnimation(event, product.image);
    } else {
      updateBadge();
    }
    renderCartPanel();
  }

  function performFlyAnimation(event, imageUrl) {
    try {
      var btn = event.currentTarget || event.target;
      var productCard = btn.closest('.product-card') || btn.closest('article');
      var imgContainer = productCard ? productCard.querySelector('img') : null;
      if (!imgContainer && imageUrl) {
        var tmp = document.createElement('img');
        tmp.src = imageUrl;
        imgContainer = tmp;
      }
      var cartIcon = document.getElementById('cart-icon');
      if (!imgContainer || !cartIcon) { updateBadge(); return; }

      var startRect = imgContainer.getBoundingClientRect();
      var endRect = cartIcon.getBoundingClientRect();

      var flyingElement = document.createElement('img');
      flyingElement.src = imgContainer.src || imageUrl;
      flyingElement.classList.add('flying-img');
      flyingElement.style.top = startRect.top + 'px';
      flyingElement.style.left = startRect.left + 'px';
      flyingElement.style.width = startRect.width + 'px';
      flyingElement.style.height = startRect.height + 'px';
      document.body.appendChild(flyingElement);

      var targetCenterX = endRect.left + endRect.width / 2;
      var targetCenterY = endRect.top + endRect.height / 2;
      var finalLeft = targetCenterX - startRect.width / 2;
      var finalTop = targetCenterY - startRect.height / 2;

      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          flyingElement.style.top = finalTop + 'px';
          flyingElement.style.left = finalLeft + 'px';
          flyingElement.style.transform = 'scale(0.1)';
        });
      });

      setTimeout(function() {
        if (flyingElement.parentNode) flyingElement.parentNode.removeChild(flyingElement);
        cartIcon.classList.remove('animate-cart-bounce');
        void cartIcon.offsetWidth;
        cartIcon.classList.add('animate-cart-bounce');
        updateBadge();
      }, 800);
    } catch (e) {
    }
  }

  function updateQuantity(id, delta) {
    var cart = getCart();
    var item = cart.find(function(i) { return i.id === id; });
    if (!item) return;
    item.quantity = Math.max(1, item.quantity + delta);
    saveCart(cart);
    updateBadge();
    renderCartPanel();
  }

  function removeFromCart(id) {
    var cart = getCart().filter(function(i) { return i.id !== id; });
    saveCart(cart);
    updateBadge();
    renderCartPanel();
  }

  function calculateTotal() {
    var cart = getCart();
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      total += (cart[i].price || 0) * (cart[i].quantity || 1);
    }
    return total;
  }

  function getTotalCount() {
    var cart = getCart();
    var count = 0;
    for (var i = 0; i < cart.length; i++) {
      count += cart[i].quantity || 1;
    }
    return count;
  }

  function updateBadge() {
    var badges = document.querySelectorAll('.cart-badge');
    var count = getTotalCount();
    for (var i = 0; i < badges.length; i++) {
      badges[i].textContent = count;
      badges[i].style.display = count > 0 ? 'flex' : 'none';
    }
  }

  function renderCartPanel() {
    var panel = document.getElementById('cartPanel');
    if (!panel) return;
    var cart = getCart();
    var listEl = panel.querySelector('.cart-items-list');
    var totalEl = panel.querySelector('.cart-total-value');
    var emptyEl = panel.querySelector('.cart-empty');
    var footerEl = panel.querySelector('.cart-footer');

    if (!listEl) return;

    if (cart.length === 0) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'flex';
      if (footerEl) footerEl.style.display = 'none';
      if (totalEl) totalEl.textContent = '$0.00';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (footerEl) footerEl.style.display = 'block';

    var html = '';
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      var subtotal = ((item.price || 0) * (item.quantity || 1)).toFixed(2);
      html += '<div class="cart-item" data-id="' + item.id + '">' +
        '<div class="cart-item-image">' +
          '<img src="' + (item.image || '') + '" alt="' + (item.name || '') + '" onerror="this.style.display=\'none\';">' +
        '</div>' +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + (item.name || '') + '</div>' +
          '<div class="cart-item-model">' + (item.model || '') + '</div>' +
          '<div class="cart-item-price-row">' +
            '<span class="cart-item-price">' + (item.price > 0 ? '$' + (item.price || 0).toFixed(2) : '询价') + '</span>' +
            '<span class="cart-item-subtotal">' + (item.price > 0 ? '$' + subtotal : '') + '</span>' +
          '</div>' +
          '<div class="cart-item-qty">' +
            '<button class="cart-qty-btn cart-qty-minus" data-id="' + item.id + '" type="button">−</button>' +
            '<span class="cart-qty-value">' + item.quantity + '</span>' +
            '<button class="cart-qty-btn cart-qty-plus" data-id="' + item.id + '" type="button">+</button>' +
          '</div>' +
        '</div>' +
        '<button class="cart-item-remove" data-id="' + item.id + '" type="button" aria-label="移除">' +
          '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>' +
        '</button>' +
      '</div>';
    }
    listEl.innerHTML = html;

    var total = calculateTotal();
    if (totalEl) totalEl.textContent = total > 0 ? '$' + total.toFixed(2) : '询价';

    listEl.querySelectorAll('.cart-qty-minus').forEach(function(btn) {
      btn.addEventListener('click', function() { updateQuantity(parseInt(this.dataset.id), -1); });
    });
    listEl.querySelectorAll('.cart-qty-plus').forEach(function(btn) {
      btn.addEventListener('click', function() { updateQuantity(parseInt(this.dataset.id), 1); });
    });
    listEl.querySelectorAll('.cart-item-remove').forEach(function(btn) {
      btn.addEventListener('click', function() { removeFromCart(parseInt(this.dataset.id)); });
    });
  }

  function openCartPanel() {
    var panel = document.getElementById('cartPanel');
    var overlay = document.getElementById('cartOverlay');
    if (panel) panel.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCartPanel();
  }

  function closeCartPanel() {
    var panel = document.getElementById('cartPanel');
    var overlay = document.getElementById('cartOverlay');
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function submitInquiry() {
    var token = localStorage.getItem('authToken');
    if (!token) {
      closeCartPanel();
      if (window.openLoginModal) window.openLoginModal();
      else {
        var loginBtn = document.getElementById('loginBtn');
        if (loginBtn) loginBtn.click();
      }
      return;
    }
    var cart = getCart();
    if (cart.length === 0) return;
    var items = cart.map(function(item) {
      return { id: item.id, name: item.name, model: item.model, image: item.image, quantity: item.quantity };
    });
    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ items: items })
    }).then(function(res) { return res.json(); }).then(function(data) {
      if (data.success) {
        try { localStorage.removeItem('wzsp_cart'); } catch (e) {}
        updateBadge();
        closeCartPanel();
        showInquirySuccess();
      } else {
        alert('提交失败：' + (data.message || '未知错误'));
      }
    }).catch(function() {
      alert('网络错误，请稍后重试');
    });
  }

  function showInquirySuccess() {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99999;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = function() { document.body.removeChild(overlay); };
    overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:40px 36px;text-align:center;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.15);animation:modalIn .25s ease;" onclick="event.stopPropagation();">' +
      '<div style="width:64px;height:64px;border-radius:50%;background:rgba(11,60,106,.08);display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">' +
      '<svg style="width:32px;height:32px;color:#0B3C6A;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
      '</div>' +
      '<h3 style="font-size:20px;font-weight:700;color:#1f2937;margin:0 0 8px;">询价单已提交</h3>' +
      '<p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 28px;">您的询价单已成功提交，我们的团队将尽快与您联系。</p>' +
      '<a href="account.html" style="display:inline-block;padding:12px 32px;background:#0B3C6A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">查看我的询价单</a>' +
      '</div>';
    document.body.appendChild(overlay);
  }

  function initCartUI() {
    document.querySelectorAll('.cart-toggle-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.preventDefault(); openCartPanel(); });
    });
    var closeBtn = document.getElementById('cartCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeCartPanel);
    var overlay = document.getElementById('cartOverlay');
    if (overlay) overlay.addEventListener('click', closeCartPanel);
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeCartPanel(); });
    updateBadge();
  }

  window.CartManager = {
    getCart: getCart,
    addToCart: addToCart,
    updateQuantity: updateQuantity,
    removeFromCart: removeFromCart,
    calculateTotal: calculateTotal,
    getTotalCount: getTotalCount,
    updateBadge: updateBadge,
    renderCartPanel: renderCartPanel,
    openCartPanel: openCartPanel,
    closeCartPanel: closeCartPanel,
    initCartUI: initCartUI,
    submitInquiry: submitInquiry
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCartUI);
  } else {
    initCartUI();
  }
})();

/* ========== PRODUCTS PAGE ========== */
document.addEventListener("DOMContentLoaded", async function () {
  var productsGrid = document.getElementById("productsGrid");
  if (!productsGrid) return;

  var sidebarCategories = document.getElementById("sidebarCategories");
  var productCount = document.getElementById("productCount");
  var toolbarTitle = document.querySelector(".toolbar-title");
  var activeFilterTag = document.getElementById("activeFilterTag");
  var clearAllBtn = document.getElementById("clearAllFilters");
  var sidebarSearch = document.getElementById("sidebarSearch");
  var globalSearch = document.getElementById("globalSearch");

  var allProducts = [];
  var categoriesData = {};
  var activeCat1 = null;
  var activeCat2 = null;
  var activeCat3 = null;
  var searchTerm = "";

  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("category1")) activeCat1 = urlParams.get("category1");
  if (urlParams.get("category2")) activeCat2 = urlParams.get("category2");
  if (urlParams.get("category3")) activeCat3 = urlParams.get("category3");
  if (urlParams.get("category")) activeCat1 = urlParams.get("category");

  async function initData() {
    try {
      var response = await fetch("products.json");
      if (!response.ok) throw new Error("产品数据加载失败");
      var data = await response.json();
      allProducts = data.products || [];
      categoriesData = data.categories || {};
      renderSidebar();
      filterAndRender();
    } catch (err) {
      productsGrid.innerHTML = '<div class="note"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg><span>暂时无法加载产品，请稍后重试。</span></div>';
    }
  }

  function renderSidebar() {
    var catKeys = Object.keys(categoriesData).filter(function (k) { return k.trim() !== ""; });
    if (catKeys.length === 0) { sidebarCategories.innerHTML = '<div class="note"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg><span>暂无分类数据。</span></div>'; return; }

    var html = '<button class="cat-item cat-all' + (!activeCat1 ? ' active' : '') + '" data-cat1="">全部产品</button>';

    catKeys.forEach(function (cat1) {
      var subCats = categoriesData[cat1];
      var subKeys = Object.keys(subCats).filter(function (k) { return k.trim() !== ""; });
      var isActive1 = activeCat1 === cat1;
      var hasSub = subKeys.length > 0;

      html += '<div class="cat-group' + (isActive1 ? ' open' : '') + '">';
      html += '<button class="cat-item cat-l1' + (isActive1 ? ' active' : '') + '" data-cat1="' + cat1 + '">';
      html += '<span class="cat-arrow">' + (hasSub ? '<svg class="inline-icon" style="width:10px;height:10px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' : '') + '</span>';
      html += '<span class="cat-label">' + cat1 + '</span>';
      html += '</button>';

      if (hasSub) {
        html += '<div class="cat-sub-list"' + (isActive1 ? '' : ' style="display:none;"') + '">';
        subKeys.forEach(function (cat2) {
          var level3 = subCats[cat2] || [];
          var isActive2 = activeCat2 === cat2;
          var hasL3 = level3.length > 0;

          html += '<div class="cat-sub-group' + (isActive2 ? ' open' : '') + '">';
          html += '<button class="cat-item cat-l2' + (isActive2 ? ' active' : '') + '" data-cat1="' + cat1 + '" data-cat2="' + cat2 + '">';
          html += '<span class="cat-arrow">' + (hasL3 ? '<svg class="inline-icon" style="width:10px;height:10px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' : '') + '</span>';
          html += '<span class="cat-label">' + cat2 + '</span>';
          html += '</button>';

          if (hasL3) {
            html += '<div class="cat-sub-list cat-l3-list"' + (isActive2 ? '' : ' style="display:none;"') + '">';
            level3.forEach(function (cat3) {
              var isActive3 = activeCat3 === cat3;
              html += '<button class="cat-item cat-l3' + (isActive3 ? ' active' : '') + '" data-cat1="' + cat1 + '" data-cat2="' + cat2 + '" data-cat3="' + cat3 + '">' + cat3 + '</button>';
            });
            html += '</div>';
          }
          html += '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
    });

    sidebarCategories.innerHTML = html;
    bindSidebarEvents();
  }

  function bindSidebarEvents() {
    sidebarCategories.querySelectorAll(".cat-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var c1 = this.dataset.cat1;
        var c2 = this.dataset.cat2 || null;
        var c3 = this.dataset.cat3 || null;

        if (c1 === "") { activeCat1 = null; activeCat2 = null; activeCat3 = null; }
        else if (c3) { activeCat1 = c1; activeCat2 = c2; activeCat3 = c3; }
        else if (c2) { activeCat1 = c1; activeCat2 = c2; activeCat3 = null; }
        else { if (activeCat1 === c1 && !c2) { activeCat1 = null; activeCat2 = null; activeCat3 = null; } else { activeCat1 = c1; activeCat2 = null; activeCat3 = null; } }

        updateURL(); renderSidebar(); filterAndRender();
      });
    });

    sidebarCategories.querySelectorAll(".cat-l1 .cat-arrow, .cat-l2 .cat-arrow").forEach(function (arrow) {
      arrow.addEventListener("click", function (e) {
        e.stopPropagation();
        var catItem = this.closest(".cat-item");
        var group = catItem.parentElement;
        var subList = group.querySelector(":scope > .cat-sub-list");
        if (subList) {
          var isOpen = subList.style.display !== "none";
          subList.style.display = isOpen ? "none" : "block";
          group.classList.toggle("open", !isOpen);
          this.querySelector("i").style.transform = isOpen ? "" : "rotate(90deg)";
        }
      });
    });
  }

  function updateURL() {
    var url = new URL(window.location.origin + window.location.pathname);
    if (activeCat1) url.searchParams.set("category1", activeCat1);
    if (activeCat2) url.searchParams.set("category2", activeCat2);
    if (activeCat3) url.searchParams.set("category3", activeCat3);
    history.replaceState(null, "", url.toString());
  }

  function filterAndRender() {
    var filtered = allProducts;
    if (activeCat1) filtered = filtered.filter(function (p) { return p.category1 === activeCat1; });
    if (activeCat2) filtered = filtered.filter(function (p) { return p.category2 === activeCat2; });
    if (activeCat3) filtered = filtered.filter(function (p) { return p.category3 === activeCat3; });
    if (searchTerm) {
      var term = searchTerm.toLowerCase();
      filtered = filtered.filter(function (p) {
        return (p.name && p.name.toLowerCase().includes(term)) || (p.model && p.model.toLowerCase().includes(term)) || (p.spec && p.spec.toLowerCase().includes(term)) || (p.description && p.description.toLowerCase().includes(term));
      });
    }
    updateToolbar(filtered.length);
    renderProducts(filtered);
  }

  function updateToolbar(count) {
    productCount.textContent = count + " 件产品";
    if (activeCat1 || activeCat2 || activeCat3) {
      var parts = [];
      if (activeCat1) parts.push(activeCat1);
      if (activeCat2) parts.push(activeCat2);
      if (activeCat3) parts.push(activeCat3);
      toolbarTitle.textContent = parts.join(" / ");
      activeFilterTag.style.display = "inline-flex";
      activeFilterTag.innerHTML = '<svg class="inline-icon" style="width:11px;height:11px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> ' + parts.join(" / ") + ' <button class="tag-remove" id="tagRemove" type="button"><svg class="inline-icon" style="width:12px;height:12px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>';
      clearAllBtn.style.display = "inline-flex";
      document.getElementById("tagRemove")?.addEventListener("click", clearFilters);
    } else {
      toolbarTitle.textContent = "全部产品";
      activeFilterTag.style.display = "none";
      activeFilterTag.innerHTML = "";
      clearAllBtn.style.display = "none";
    }
  }

  function clearFilters() {
    activeCat1 = null; activeCat2 = null; activeCat3 = null; searchTerm = "";
    if (sidebarSearch) sidebarSearch.value = "";
    if (globalSearch) globalSearch.value = "";
    updateURL(); renderSidebar(); filterAndRender();
  }

  if (clearAllBtn) clearAllBtn.addEventListener("click", clearFilters);

  function renderProducts(products) {
    if (products.length === 0) { productsGrid.innerHTML = '<div class="note" style="grid-column:1/-1;"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H8a4 4 0 0 1-4-4c0 2.21 1.79 4 4 4H12"/><path d="M20 20H4a2 2 0 0 1-2-2v-4"/></svg><span>暂无该分类产品，请尝试其他筛选条件。</span></div>'; return; }
    productsGrid.innerHTML = products.map(function (product) {
      var tagHtml = product.tag ? '<div class="product-tag">' + product.tag + '</div>' : '';
      return '<article class="product-card">' +
        '<a href="product-detail.html?id=' + product.id + '" class="product-link">' +
        '<div class="product-media">' + tagHtml +
        '<img src="' + product.imagePath + '" alt="' + product.name + '" loading="lazy" onerror="this.closest(\'.product-media\').classList.add(\'img-missing\'); this.style.display=\'none\';" />' +
        '<div class="img-fallback" aria-hidden="true"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H8a4 4 0 0 1-4-4c0 2.21 1.79 4 4 4H12"/><path d="M20 20H4a2 2 0 0 1-2-2v-4"/></svg><div><div class="fallback-title">产品图片</div></div></div>' +
        '</div>' +
        '<div class="product-body">' +
        '<h3 class="product-title">' + product.name + '</h3>' +
        '<div class="product-sku"><svg class="inline-icon" style="font-size:11px;margin-right:4px;color:var(--muted-2);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-8.54-5.7a2 2 0 0 0-1.08-.3L5 16l10-13"/></svg> 型号：<strong>' + product.model + '</strong></div>' +
        '<div class="product-moq"><svg class="inline-icon" style="font-size:11px;margin-right:4px;color:var(--muted-2);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H8a4 4 0 0 1-4-4c0 2.21 1.79 4 4 4H12"/><path d="M20 20H4a2 2 0 0 1-2-2v-4"/></svg> 起订量：' + product.moq + '</div>' +
        '<p class="product-desc">' + product.description + '</p>' +
        '</div></a>' +
        '<div class="product-actions">' +
        '<button class="inquiry-btn" type="button" data-inquire="' + product.model + '"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg> 立即询价</button>' +
        '<button class="add-to-cart-btn" type="button" data-product-id="' + product.id + '" data-product-name="' + product.name + '" data-product-model="' + product.model + '" data-product-image="' + product.imagePath + '"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg></button>' +
        '</div></article>';
    }).join("");
    bindInquiryButtons();
  }

  function bindInquiryButtons() {
    productsGrid.querySelectorAll("[data-inquire]").forEach(function (button) {
      button.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); var m = this.getAttribute("data-inquire") || ""; window.location.href = "index.html#contact?model=" + encodeURIComponent(m); });
    });
    productsGrid.querySelectorAll(".add-to-cart-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var id = parseInt(this.getAttribute("data-product-id"));
        var name = this.getAttribute("data-product-name") || "";
        var model = this.getAttribute("data-product-model") || "";
        var image = this.getAttribute("data-product-image") || "";
        if (window.CartManager) {
          CartManager.addToCart({ id: id, name: name, model: model, price: 0, image: image }, e);
          this.classList.add("added");
          var origHTML = this.innerHTML; this.innerHTML = '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
          var self = this; setTimeout(function () { self.classList.remove("added"); self.innerHTML = origHTML; }, 1500);
        }
      });
    });
  }

  function setupSearch() {
    var debounce;
    function onSearch(value) { searchTerm = value.trim(); clearTimeout(debounce); debounce = setTimeout(filterAndRender, 250); }
    if (sidebarSearch) sidebarSearch.addEventListener("input", function () { if (globalSearch) globalSearch.value = this.value; onSearch(this.value); });
    if (globalSearch) globalSearch.addEventListener("input", function () { if (sidebarSearch) sidebarSearch.value = this.value; onSearch(this.value); });
  }

  setupSearch(); initData();
});

/* ========== PRODUCT RENDERER (index.html) ========== */
document.addEventListener("DOMContentLoaded", async function () {
  var productsGrid = document.getElementById("productsGrid");
  if (!productsGrid) return;

  var allProducts = [];
  try {
    var response = await fetch("products.json");
    if (!response.ok) throw new Error("产品数据加载失败: " + response.status);
    var data = await response.json();
    if (!Array.isArray(data.products)) throw new Error("产品数据格式无效。");
    allProducts = data.products;
  } catch (error) {
    productsGrid.innerHTML = '<div class="note"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg><span>暂时无法加载产品，请稍后重试。</span></div>';
    return;
  }

  var urlParams = new URLSearchParams(window.location.search);
  var activeCategory1 = urlParams.get('category1');
  var activeCategory2 = urlParams.get('category2');
  var activeCategory3 = urlParams.get('category3');
  var sectionHead = document.querySelector("#products .section-head");

  function updateFilterBreadcrumb() {
    var existing = document.getElementById("filterBreadcrumb"); if (existing) existing.remove();
    if (!activeCategory1 && !activeCategory2 && !activeCategory3) return;
    var div = document.createElement("div"); div.id = "filterBreadcrumb"; div.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;";
    var parts = []; if (activeCategory1) parts.push(activeCategory1); if (activeCategory2) parts.push(activeCategory2); if (activeCategory3) parts.push(activeCategory3);
    div.innerHTML = '<span style="font-size:13px;color:var(--muted-2);">当前筛选：</span>' +
      '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:rgba(11,60,106,.06);border:1px solid var(--line);border-radius:2px;font-size:13px;font-weight:700;color:var(--brand-blue);">' +
      '<svg class="inline-icon" style="width:11px;height:11px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> ' + parts.join(' / ') + '</span>' +
      '<button id="clearFilter" type="button" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border:1px solid var(--line);border-radius:2px;background:var(--bg);color:var(--muted);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;">' +
      '<svg class="inline-icon" style="width:10px;height:10px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> 清除筛选</button>';
    sectionHead.appendChild(div);
    document.getElementById("clearFilter")?.addEventListener("click", function () {
      activeCategory1 = null; activeCategory2 = null; activeCategory3 = null;
      history.replaceState(null, "", "index.html#products"); filterProducts(); updateFilterBreadcrumb(); highlightActiveCategory();
    });
  }

  function highlightActiveCategory() {
    document.querySelectorAll(".category-item").forEach(function (item) {
      var href = item.getAttribute("href") || "";
      var url = new URL(href, window.location.origin + window.location.pathname);
      var itemCat1 = url.searchParams.get("category1");
      if (activeCategory1 && itemCat1 === activeCategory1) { item.style.borderColor = "var(--brand-blue)"; item.style.boxShadow = "0 4px 16px rgba(11,60,106,.10)"; }
      else { item.style.borderColor = ""; item.style.boxShadow = ""; }
    });
  }

  function renderProducts(products) {
    if (products.length === 0) { productsGrid.innerHTML = '<div class="note"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg><span>该分类下暂无产品。</span></div>'; return; }
    productsGrid.innerHTML = products.map(function (product) {
      var imagePath = product.imagePath;
      var tagHtml = product.tag ? '<div class="product-tag">' + product.tag + '</div>' : '';
      return '<article class="product-card">' +
        '<a href="product-detail.html?id=' + product.id + '" class="product-link">' +
        '<div class="product-media">' + tagHtml +
        '<img src="' + imagePath + '" alt="' + product.name + '" loading="lazy" onerror="this.closest(\'.product-media\').classList.add(\'img-missing\'); this.style.display=\'none\';" />' +
        '<div class="img-fallback" aria-hidden="true"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H8a4 4 0 0 1-4-4c0 2.21 1.79 4 4 4H12"/><path d="M20 20H4a2 2 0 0 1-2-2v-4"/></svg><div><div class="fallback-title">产品图片</div></div></div>' +
        '</div>' +
        '<div class="product-body">' +
        '<h3 class="product-title">' + product.name + '</h3>' +
        '<div class="product-sku"><svg class="inline-icon" style="font-size:11px;margin-right:4px;color:var(--muted-2);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-8.54-5.7a2 2 0 0 0-1.08-.3L5 16l10-13"/></svg> 型号：<strong>' + product.model + '</strong></div>' +
        '<div class="product-moq"><svg class="inline-icon" style="font-size:11px;margin-right:4px;color:var(--muted-2);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H8a4 4 0 0 1-4-4c0 2.21 1.79 4 4 4H12"/><path d="M20 20H4a2 2 0 0 1-2-2v-4"/></svg> 起订量：' + product.moq + '</div>' +
        '<p class="product-desc">' + product.description + '</p>' +
        '</div></a>' +
        '<div class="product-actions">' +
        '<button class="inquiry-btn" type="button" data-product-name="' + product.name + '" data-inquire="' + product.model + '">' +
        '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg> 立即询价</button>' +
        '<button class="add-to-cart-btn" type="button" data-product-id="' + product.id + '" data-product-name="' + product.name + '" data-product-model="' + product.model + '" data-product-image="' + imagePath + '">' +
        '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg></button>' +
        '</div></article>';
    }).join("");
    bindInquiryButtons();
  }

  function filterProducts() {
    var filtered = allProducts;
    var searchTerm = document.getElementById("searchInput")?.value?.trim().toLowerCase() || "";
    if (activeCategory1) filtered = filtered.filter(function (p) { return p.category1 === activeCategory1; });
    if (activeCategory2) filtered = filtered.filter(function (p) { return p.category2 === activeCategory2; });
    if (activeCategory3) filtered = filtered.filter(function (p) { return p.category3 === activeCategory3; });
    if (searchTerm) {
      filtered = filtered.filter(function (p) {
        return (p.name && p.name.toLowerCase().includes(searchTerm)) || (p.model && p.model.toLowerCase().includes(searchTerm)) || (p.spec && p.spec.toLowerCase().includes(searchTerm)) || (p.description && p.description.toLowerCase().includes(searchTerm)) || (p.category1 && p.category1.toLowerCase().includes(searchTerm)) || (p.category2 && p.category2.toLowerCase().includes(searchTerm));
      });
    }
    renderProducts(filtered);
  }

  var searchInput = document.getElementById("searchInput");
  if (searchInput) {
    var debounceTimer;
    searchInput.addEventListener("input", function () { clearTimeout(debounceTimer); debounceTimer = setTimeout(filterProducts, 300); });
    searchInput.closest(".search-box")?.querySelector("button")?.addEventListener("click", filterProducts);
  }

  filterProducts(); updateFilterBreadcrumb(); highlightActiveCategory();

  if (activeCategory1 || activeCategory2 || activeCategory3) {
    setTimeout(function () {
      var productsSection = document.getElementById("products");
      if (productsSection) {
        var headerH = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
        window.scrollTo({ top: productsSection.getBoundingClientRect().top + window.scrollY - headerH - 10, behavior: "smooth" });
      }
    }, 100);
  }

  document.querySelectorAll(".category-item").forEach(function (item) {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      var href = item.getAttribute("href") || "";
      var url = new URL(href, window.location.origin + window.location.pathname);
      activeCategory1 = url.searchParams.get("category1"); activeCategory2 = url.searchParams.get("category2"); activeCategory3 = url.searchParams.get("category3");
      var newUrl = new URL(window.location.origin + window.location.pathname);
      if (activeCategory1) newUrl.searchParams.set("category1", activeCategory1);
      if (activeCategory2) newUrl.searchParams.set("category2", activeCategory2);
      if (activeCategory3) newUrl.searchParams.set("category3", activeCategory3);
      newUrl.hash = "products"; history.pushState(null, "", newUrl.toString());
      filterProducts(); updateFilterBreadcrumb(); highlightActiveCategory();
      var productsSection = document.getElementById("products");
      if (productsSection) {
        var headerH = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
        window.scrollTo({ top: window.scrollY + productsSection.getBoundingClientRect().top - headerH - 10, behavior: "smooth" });
      }
    });
  });

  function bindInquiryButtons() {
    productsGrid.querySelectorAll("[data-inquire]").forEach(function (button) {
      button.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var model = button.getAttribute("data-inquire") || "";
        var messageEl = document.getElementById("message");
        if (messageEl) {
          var template = "您好，我对型号 " + model + " 很感兴趣。\n请报价：单价、起订量、交货期、包装方式，以及运至（邮编/港口）：\n\n采购数量：\n公司名称：\n备注（OEM/ODM、贴牌等）：\n";
          if (!messageEl.value.trim()) messageEl.value = template;
          else if (!messageEl.value.includes(model)) messageEl.value = messageEl.value.trim() + "\n\n---\n感兴趣的型号：" + model + "\n";
        }
        var contactSection = document.getElementById("contact");
        if (contactSection) {
          var headerH = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
          window.scrollTo({ top: window.scrollY + contactSection.getBoundingClientRect().top - headerH - 10, behavior: "smooth" });
        }
      });
    });
    productsGrid.querySelectorAll(".add-to-cart-btn").forEach(function (button) {
      button.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var id = parseInt(button.getAttribute("data-product-id"));
        var name = button.getAttribute("data-product-name") || "";
        var model = button.getAttribute("data-product-model") || "";
        var image = button.getAttribute("data-product-image") || "";
        if (window.CartManager) {
          CartManager.addToCart({ id: id, name: name, model: model, price: 0, image: image }, e);
          button.classList.add("added"); button.innerHTML = '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          setTimeout(function () { button.classList.remove("added"); button.innerHTML = '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>'; }, 1500);
        }
      });
    });
  }
});

/* ========== PRODUCT DETAIL PAGE ========== */
document.addEventListener("DOMContentLoaded", async function () {
  var productDetail = document.getElementById('productDetail');
  var relatedProducts = document.getElementById('relatedProducts');
  if (!productDetail) return;

  var breadcrumbProduct = document.getElementById('breadcrumb-product');
  var inquiryBtn = document.getElementById('inquiryBtn');
  var urlParams = new URLSearchParams(window.location.search);
  var productId = parseInt(urlParams.get('id'));

  if (!productId) { productDetail.innerHTML = '<div class="error-state"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><h3>产品未找到</h3><p>您查看的产品不存在或已被删除。</p><a href="products.html" class="btn btn-primary"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> 返回产品列表</a></div>'; return; }

  try {
    var response = await fetch('products.json');
    if (!response.ok) throw new Error('产品数据加载失败');
    var data = await response.json();
    var products = data.products;
    var product = products.find(function (p) { return p.id === productId; });
    if (!product) throw new Error('产品未找到');

    breadcrumbProduct.textContent = product.name;
    if (inquiryBtn) inquiryBtn.setAttribute('data-inquire', product.model);

    productDetail.innerHTML =
      '<div class="product-detail-grid">' +
      '<div class="product-images"><div class="main-image">' +
      '<img src=".' + product.imagePath + '" alt="' + product.name + '" onerror="this.closest(\'.main-image\').classList.add(\'img-missing\'); this.style.display=\'none\';" />' +
      '<div class="img-fallback" aria-hidden="true"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg><div><div class="fallback-title">产品图片</div></div></div>' +
      '</div></div>' +
      '<div class="product-info">' +
      (product.tag ? '<div class="product-category">' + product.tag + '</div>' : '') +
      '<h1 class="product-title">' + product.name + '</h1>' +
      '<div class="product-model">型号：' + product.model + '</div>' +
      '<div class="product-specs">' +
      '<div class="spec-item"><span class="spec-label">规格：</span><span class="spec-value">' + product.spec + '</span></div>' +
      '<div class="spec-item"><span class="spec-label">起订量：</span><span class="spec-value">' + product.moq + '</span></div>' +
      '<div class="spec-item"><span class="spec-label">分类：</span><span class="spec-value">' +
      '<a href="products.html?category1=' + product.category1 + '" class="link">' + product.category1 + '</a>' +
      (product.category2 ? ' / <a href="products.html?category1=' + product.category1 + '&category2=' + product.category2 + '" class="link">' + product.category2 + '</a>' : '') +
      (product.category3 ? ' / <a href="products.html?category1=' + product.category1 + '&category2=' + product.category2 + '&category3=' + product.category3 + '" class="link">' + product.category3 + '</a>' : ' / 无') +
      '</span></div></div>' +
      '<div class="product-description"><h3>产品描述</h3><p>' + product.description + '</p></div>' +
      '<div class="product-actions">' +
      '<a class="btn btn-primary" href="index.html#contact" data-inquire="' + product.model + '"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> 立即询价</a>' +
      '<button class="btn btn-outline add-to-cart-btn-detail" type="button" data-product-id="' + product.id + '" data-product-name="' + product.name + '" data-product-model="' + product.model + '" data-product-image=".' + product.imagePath + '"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path><line x1="1" y1="1" x2="6" y2="6"></line><line x1="6" y1="1" x2="1" y2="6"></line></svg> 加入购物车</button>' +
      '<a class="btn btn-outline" href="products.html"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> 返回产品列表</a>' +
      '</div></div></div>';

    var related = products.filter(function (p) { return p.id !== productId && p.category1 === product.category1; });
    if (related.length > 0) {
      relatedProducts.innerHTML = related.slice(0, 4).map(function (p) {
        var tagHtml = p.tag ? '<div class="product-tag">' + p.tag + '</div>' : '';
        return '<article class="product-card">' +
          '<a href="product-detail.html?id=' + p.id + '" class="product-link">' +
          '<div class="product-media">' + tagHtml +
          '<img src=".' + p.imagePath + '" alt="' + p.name + '" loading="lazy" onerror="this.closest(\'.product-media\').classList.add(\'img-missing\'); this.style.display=\'none\';" />' +
          '<div class="img-fallback" aria-hidden="true"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg><div><div class="fallback-title">产品图片</div></div></div>' +
          '</div>' +
          '<div class="product-body">' +
          '<h3 class="product-title">' + p.name + '</h3>' +
          '<div class="product-sku"><svg style="width:11px;height:11px;display:inline-block;vertical-align:middle;margin-right:4px;color:var(--muted-2);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg> 型号：<strong>' + p.model + '</strong></div>' +
          '<div class="product-moq"><svg style="width:11px;height:11px;display:inline-block;vertical-align:middle;margin-right:4px;color:var(--muted-2);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line><polyline points="7.5 9 12 11.5 16.5 9"></polyline></svg> 起订量：' + p.moq + '</div>' +
          '<p class="product-desc">' + p.description + '</p>' +
          '</div></a>' +
          '<div class="product-actions">' +
          '<button class="inquiry-btn" type="button" data-inquire="' + p.model + '"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> 立即询价</button>' +
          '<button class="add-to-cart-btn" type="button" data-product-id="' + p.id + '" data-product-name="' + p.name + '" data-product-model="' + p.model + '" data-product-image=".' + p.imagePath + '"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg></button>' +
          '</div></article>';
      }).join('');
    } else { relatedProducts.innerHTML = '<div class="note"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg><span>该分类下暂无相关产品。</span></div>'; }
  } catch (error) { productDetail.innerHTML = '<div class="error-state"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><h3>产品加载失败</h3><p>加载产品详情时出现问题，请稍后重试。</p><a href="products.html" class="btn btn-primary"><svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> 返回产品列表</a></div>'; }

  function bindAddToCartButtons() {
    document.querySelectorAll('.add-to-cart-btn, .add-to-cart-btn-detail').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var id = parseInt(this.getAttribute('data-product-id'));
        var name = this.getAttribute('data-product-name') || '';
        var model = this.getAttribute('data-product-model') || '';
        var image = this.getAttribute('data-product-image') || '';
        if (window.CartManager) {
          CartManager.addToCart({ id: id, name: name, model: model, price: 0, image: image }, e);
          this.classList.add('added');
          var origHTML = this.innerHTML;
          this.innerHTML = this.classList.contains('add-to-cart-btn-detail') ? '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> 已加入' : '<svg class="inline-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          var self = this; setTimeout(function () { self.classList.remove('added'); self.innerHTML = origHTML; }, 1500);
        }
      });
    });
  }
  bindAddToCartButtons();
});
