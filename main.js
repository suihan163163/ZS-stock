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
    if (icon) { icon.classList.toggle("fa-bars", !open); icon.classList.toggle("fa-xmark", open); }
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

  /* ========== 登录 ========== */
  var loginBtn = $("#loginBtn");
  var adminBtn = $("#adminBtn");
  var loginModal = $("#loginModal");
  var loginForm = $("#loginForm");

  function openLoginModal() {
    if (!loginModal) return;
    loginModal.hidden = false; loginModal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden"; document.body.style.overflow = "hidden";
    var u = $("#username"); if (u) u.focus();
  }
  function closeLoginModal() {
    if (!loginModal) return;
    loginModal.hidden = true; loginModal.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = ""; document.body.style.overflow = "";
  }
  function checkLoginStatus() {
    var logged = localStorage.getItem('adminLoggedIn') === 'true';
    if (loginBtn && adminBtn) { loginBtn.style.display = logged ? 'none' : 'inline-flex'; adminBtn.style.display = logged ? 'inline-flex' : 'none'; }
  }
  checkLoginStatus();
  if (loginBtn) loginBtn.addEventListener('click', openLoginModal);
  if (loginModal) {
    loginModal.addEventListener("click", function (e) { var t = e.target; if (t instanceof HTMLElement && t.getAttribute("data-close") === "true") closeLoginModal(); });
    document.addEventListener("keydown", function (e) { if (loginModal && !loginModal.hidden && e.key === "Escape") closeLoginModal(); });
  }
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault(); clearErrors(loginForm);
      var u = $("#username") ? $("#username").value.trim() : "";
      var p = $("#password") ? $("#password").value.trim() : "";
      if (!u || !p) { if (!u) setError($("#username"), "请输入用户名。"); if (!p) setError($("#password"), "请输入密码。"); return; }
      if (u === 'admin' && p === 'zsadmin414') {
        localStorage.setItem('adminLoggedIn', 'true'); checkLoginStatus(); closeLoginModal();
        if ($("#password")) $("#password").value = ''; if ($("#username")) $("#username").value = '';
      } else {
        if ($("#password")) $("#password").value = '';
        var le = document.getElementById('loginError');
        if (le) { le.textContent = '用户名或密码错误，请重试。'; le.style.display = 'block'; setTimeout(function () { le.style.display = 'none'; }, 3000); }
      }
    });
  }
  var pwToggle = document.querySelector('.password-toggle');
  var pwInput = document.getElementById('password');
  if (pwToggle && pwInput) {
    pwToggle.addEventListener('click', function () {
      if (pwInput.type === 'password') { pwInput.type = 'text'; pwToggle.innerHTML = '<i class="fa-solid fa-eye-slash"></i>'; }
      else { pwInput.type = 'password'; pwToggle.innerHTML = '<i class="fa-solid fa-eye"></i>'; }
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
      productsGrid.innerHTML = '<div class="note"><i class="fa-solid fa-circle-exclamation"></i><span>暂时无法加载产品，请稍后重试。</span></div>';
    }
  }

  function renderSidebar() {
    var catKeys = Object.keys(categoriesData).filter(function (k) { return k.trim() !== ""; });
    if (catKeys.length === 0) { sidebarCategories.innerHTML = '<div class="note"><i class="fa-solid fa-circle-info"></i><span>暂无分类数据。</span></div>'; return; }

    var html = '<button class="cat-item cat-all' + (!activeCat1 ? ' active' : '') + '" data-cat1="">全部产品</button>';

    catKeys.forEach(function (cat1) {
      var subCats = categoriesData[cat1];
      var subKeys = Object.keys(subCats).filter(function (k) { return k.trim() !== ""; });
      var isActive1 = activeCat1 === cat1;
      var hasSub = subKeys.length > 0;

      html += '<div class="cat-group' + (isActive1 ? ' open' : '') + '">';
      html += '<button class="cat-item cat-l1' + (isActive1 ? ' active' : '') + '" data-cat1="' + cat1 + '">';
      html += '<span class="cat-arrow">' + (hasSub ? '<i class="fa-solid fa-chevron-right"></i>' : '') + '</span>';
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
          html += '<span class="cat-arrow">' + (hasL3 ? '<i class="fa-solid fa-chevron-right"></i>' : '') + '</span>';
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
      activeFilterTag.innerHTML = '<i class="fa-solid fa-filter" style="font-size:11px;"></i> ' + parts.join(" / ") + ' <button class="tag-remove" id="tagRemove" type="button"><i class="fa-solid fa-xmark"></i></button>';
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
    if (products.length === 0) { productsGrid.innerHTML = '<div class="note" style="grid-column:1/-1;"><i class="fa-solid fa-box-open"></i><span>暂无该分类产品，请尝试其他筛选条件。</span></div>'; return; }
    productsGrid.innerHTML = products.map(function (product) {
      var tagHtml = product.tag ? '<div class="product-tag">' + product.tag + '</div>' : '';
      return '<article class="product-card">' +
        '<a href="product-detail.html?id=' + product.id + '" class="product-link">' +
        '<div class="product-media">' + tagHtml +
        '<img src="' + product.imagePath + '" alt="' + product.name + '" loading="lazy" onerror="this.closest(\'.product-media\').classList.add(\'img-missing\'); this.style.display=\'none\';" />' +
        '<div class="img-fallback" aria-hidden="true"><i class="fa-solid fa-box"></i><div><div class="fallback-title">产品图片</div></div></div>' +
        '</div>' +
        '<div class="product-body">' +
        '<h3 class="product-title">' + product.name + '</h3>' +
        '<div class="product-sku"><i class="fa-solid fa-hashtag" style="font-size:11px;margin-right:4px;color:var(--muted-2);"></i> 型号：<strong>' + product.model + '</strong></div>' +
        '<div class="product-moq"><i class="fa-solid fa-box-open" style="font-size:11px;margin-right:4px;color:var(--muted-2);"></i> 起订量：' + product.moq + '</div>' +
        '<p class="product-desc">' + product.description + '</p>' +
        '</div></a>' +
        '<div class="product-actions">' +
        '<button class="inquiry-btn" type="button" data-inquire="' + product.model + '"><i class="fa-solid fa-paper-plane"></i> 立即询价</button>' +
        '<button class="add-to-cart-btn" type="button" data-product-id="' + product.id + '" data-product-name="' + product.name + '" data-product-model="' + product.model + '" data-product-image="' + product.imagePath + '"><i class="fa-solid fa-cart-shopping"></i></button>' +
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
          var origHTML = this.innerHTML; this.innerHTML = '<i class="fa-solid fa-check"></i>';
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
    productsGrid.innerHTML = '<div class="note"><i class="fa-solid fa-circle-exclamation"></i><span>暂时无法加载产品，请稍后重试。</span></div>';
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
      '<i class="fa-solid fa-filter" style="font-size:11px;"></i> ' + parts.join(' / ') + '</span>' +
      '<button id="clearFilter" type="button" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border:1px solid var(--line);border-radius:2px;background:var(--bg);color:var(--muted);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;">' +
      '<i class="fa-solid fa-xmark" style="font-size:10px;"></i> 清除筛选</button>';
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
    if (products.length === 0) { productsGrid.innerHTML = '<div class="note"><i class="fa-solid fa-circle-info"></i><span>该分类下暂无产品。</span></div>'; return; }
    productsGrid.innerHTML = products.map(function (product) {
      var imagePath = product.imagePath;
      var tagHtml = product.tag ? '<div class="product-tag">' + product.tag + '</div>' : '';
      return '<article class="product-card">' +
        '<a href="product-detail.html?id=' + product.id + '" class="product-link">' +
        '<div class="product-media">' + tagHtml +
        '<img src="' + imagePath + '" alt="' + product.name + '" loading="lazy" onerror="this.closest(\'.product-media\').classList.add(\'img-missing\'); this.style.display=\'none\';" />' +
        '<div class="img-fallback" aria-hidden="true"><i class="fa-solid fa-box"></i><div><div class="fallback-title">产品图片</div></div></div>' +
        '</div>' +
        '<div class="product-body">' +
        '<h3 class="product-title">' + product.name + '</h3>' +
        '<div class="product-sku"><i class="fa-solid fa-hashtag" style="font-size:11px;margin-right:4px;color:var(--muted-2);"></i> 型号：<strong>' + product.model + '</strong></div>' +
        '<div class="product-moq"><i class="fa-solid fa-box-open" style="font-size:11px;margin-right:4px;color:var(--muted-2);"></i> 起订量：' + product.moq + '</div>' +
        '<p class="product-desc">' + product.description + '</p>' +
        '</div></a>' +
        '<div class="product-actions">' +
        '<button class="inquiry-btn" type="button" data-product-name="' + product.name + '" data-inquire="' + product.model + '">' +
        '<i class="fa-solid fa-paper-plane"></i> 立即询价</button>' +
        '<button class="add-to-cart-btn" type="button" data-product-id="' + product.id + '" data-product-name="' + product.name + '" data-product-model="' + product.model + '" data-product-image="' + imagePath + '">' +
        '<i class="fa-solid fa-cart-shopping"></i></button>' +
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
          button.classList.add("added"); button.innerHTML = '<i class="fa-solid fa-check"></i>';
          setTimeout(function () { button.classList.remove("added"); button.innerHTML = '<i class="fa-solid fa-cart-shopping"></i>'; }, 1500);
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

  if (!productId) { productDetail.innerHTML = '<div class="error-state"><i class="fa-solid fa-circle-exclamation"></i><h3>产品未找到</h3><p>您查看的产品不存在或已被删除。</p><a href="products.html" class="btn btn-primary"><i class="fa-solid fa-arrow-left"></i> 返回产品列表</a></div>'; return; }

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
      '<div class="img-fallback" aria-hidden="true"><i class="fa-solid fa-box"></i><div><div class="fallback-title">产品图片</div></div></div>' +
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
      '<a class="btn btn-primary" href="index.html#contact" data-inquire="' + product.model + '"><i class="fa-solid fa-paper-plane"></i> 立即询价</a>' +
      '<button class="btn btn-outline add-to-cart-btn-detail" type="button" data-product-id="' + product.id + '" data-product-name="' + product.name + '" data-product-model="' + product.model + '" data-product-image=".' + product.imagePath + '"><i class="fa-solid fa-cart-plus"></i> 加入购物车</button>' +
      '<a class="btn btn-outline" href="products.html"><i class="fa-solid fa-arrow-left"></i> 返回产品列表</a>' +
      '</div></div></div>';

    var related = products.filter(function (p) { return p.id !== productId && p.category1 === product.category1; });
    if (related.length > 0) {
      relatedProducts.innerHTML = related.slice(0, 4).map(function (p) {
        var tagHtml = p.tag ? '<div class="product-tag">' + p.tag + '</div>' : '';
        return '<article class="product-card">' +
          '<a href="product-detail.html?id=' + p.id + '" class="product-link">' +
          '<div class="product-media">' + tagHtml +
          '<img src=".' + p.imagePath + '" alt="' + p.name + '" loading="lazy" onerror="this.closest(\'.product-media\').classList.add(\'img-missing\'); this.style.display=\'none\';" />' +
          '<div class="img-fallback" aria-hidden="true"><i class="fa-solid fa-box"></i><div><div class="fallback-title">产品图片</div></div></div>' +
          '</div>' +
          '<div class="product-body">' +
          '<h3 class="product-title">' + p.name + '</h3>' +
          '<div class="product-sku"><i class="fa-solid fa-hashtag" style="font-size:11px;margin-right:4px;color:var(--muted-2);"></i> 型号：<strong>' + p.model + '</strong></div>' +
          '<div class="product-moq"><i class="fa-solid fa-box-open" style="font-size:11px;margin-right:4px;color:var(--muted-2);"></i> 起订量：' + p.moq + '</div>' +
          '<p class="product-desc">' + p.description + '</p>' +
          '</div></a>' +
          '<div class="product-actions">' +
          '<button class="inquiry-btn" type="button" data-inquire="' + p.model + '"><i class="fa-solid fa-paper-plane"></i> 立即询价</button>' +
          '<button class="add-to-cart-btn" type="button" data-product-id="' + p.id + '" data-product-name="' + p.name + '" data-product-model="' + p.model + '" data-product-image=".' + p.imagePath + '"><i class="fa-solid fa-cart-shopping"></i></button>' +
          '</div></article>';
      }).join('');
    } else { relatedProducts.innerHTML = '<div class="note"><i class="fa-solid fa-circle-info"></i><span>该分类下暂无相关产品。</span></div>'; }
  } catch (error) { productDetail.innerHTML = '<div class="error-state"><i class="fa-solid fa-circle-exclamation"></i><h3>产品加载失败</h3><p>加载产品详情时出现问题，请稍后重试。</p><a href="products.html" class="btn btn-primary"><i class="fa-solid fa-arrow-left"></i> 返回产品列表</a></div>'; }

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
          this.innerHTML = this.classList.contains('add-to-cart-btn-detail') ? '<i class="fa-solid fa-check"></i> 已加入' : '<i class="fa-solid fa-check"></i>';
          var self = this; setTimeout(function () { self.classList.remove('added'); self.innerHTML = origHTML; }, 1500);
        }
      });
    });
  }
  bindAddToCartButtons();
});
