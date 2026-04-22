(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const menuBtn = $("#menuBtn");
  const mobileMenu = $("#mobileMenu");

  function setMenuOpen(open) {
    if (!menuBtn || !mobileMenu) return;
    mobileMenu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    const icon = menuBtn.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars", !open);
      icon.classList.toggle("fa-xmark", open);
    }
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      setMenuOpen(!expanded);
    });
    $$("#mobileMenu a[href^='#']").forEach((a) => {
      a.addEventListener("click", () => setMenuOpen(false));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    });
    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 768px)").matches) setMenuOpen(false);
    });
  }

  const header = $(".site-header");
  function headerOffset() {
    return header ? header.getBoundingClientRect().height + 10 : 82;
  }

  function smoothScrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = window.scrollY + el.getBoundingClientRect().top - headerOffset();
    window.scrollTo({ top, behavior: "smooth" });
  }

  $$("a[href^='#']").forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const id = href.slice(1);
      if (!id) return;
      if (!document.getElementById(id)) return;
      e.preventDefault();
      smoothScrollToId(id);
      history.pushState(null, "", `#${id}`);
    });
  });

  const inquiryForm = $("#inquiryForm");
  const messageEl = $("#message");
  const modal = $("#successModal");
  const modalRef = $("#modalRef");

  function openModal(referenceText) {
    if (!modal) return;
    if (modalRef) modalRef.textContent = referenceText || "一般询价";
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const closeBtn = modal.querySelector("[data-close='true']");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }

  function clearErrors(form) {
    $$(".field", form).forEach((field) => {
      field.classList.remove("error");
      const t = $(".error-text", field);
      if (t) t.remove();
    });
  }

  function setError(inputEl, msg) {
    const field = inputEl.closest(".field");
    if (!field) return;
    field.classList.add("error");
    const existing = $(".error-text", field);
    if (existing) existing.remove();
    const div = document.createElement("div");
    div.className = "error-text";
    div.textContent = msg;
    field.appendChild(div);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  if (inquiryForm) {
    inquiryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      clearErrors(inquiryForm);
      const name = $("#name") ? $("#name").value.trim() : "";
      const email = $("#email") ? $("#email").value.trim() : "";
      const message = $("#message") ? $("#message").value.trim() : "";
      let ok = true;
      if (!name) { ok = false; setError($("#name"), "请输入您的姓名。"); }
      if (!email) { ok = false; setError($("#email"), "请输入您的邮箱。"); }
      else if (!isValidEmail(email)) { ok = false; setError($("#email"), "请输入有效的邮箱地址。"); }
      if (!message) { ok = false; setError($("#message"), "请输入留言内容。"); }
      else if (message.length < 15) { ok = false; setError($("#message"), "请补充更多细节（型号、数量、目的地等）。"); }
      if (!ok) return;
      const ref = `INQ-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
      openModal(ref);
      inquiryForm.reset();
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.getAttribute("data-close") === "true") closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (!modal.hidden && e.key === "Escape") closeModal();
    });
  }

  const loginBtn = $("#loginBtn");
  const adminBtn = $("#adminBtn");
  const loginModal = $("#loginModal");
  const loginForm = $("#loginForm");

  function openLoginModal() {
    if (!loginModal) return;
    loginModal.hidden = false;
    loginModal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const usernameInput = $("#username");
    if (usernameInput) usernameInput.focus();
  }

  function closeLoginModal() {
    if (!loginModal) return;
    loginModal.hidden = true;
    loginModal.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }

  function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (loginBtn && adminBtn) {
      if (isLoggedIn) {
        loginBtn.style.display = 'none';
        adminBtn.style.display = 'inline-flex';
      } else {
        loginBtn.style.display = 'inline-flex';
        adminBtn.style.display = 'none';
      }
    }
  }

  function login(username, password) {
    if (username === 'admin' && password === 'zsadmin414') {
      localStorage.setItem('adminLoggedIn', 'true');
      checkLoginStatus();
      closeLoginModal();
      return true;
    }
    return false;
  }

  checkLoginStatus();

  if (loginBtn) {
    loginBtn.addEventListener('click', openLoginModal);
  }

  if (loginModal) {
    loginModal.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.getAttribute("data-close") === "true") closeLoginModal();
    });
    document.addEventListener("keydown", (e) => {
      if (loginModal && !loginModal.hidden && e.key === "Escape") closeLoginModal();
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors(loginForm);
      const username = $("#username") ? $("#username").value.trim() : "";
      const password = $("#password") ? $("#password").value.trim() : "";
      let ok = true;
      if (!username) { ok = false; setError($("#username"), "请输入用户名。"); }
      if (!password) { ok = false; setError($("#password"), "请输入密码。"); }
      if (!ok) return;
      if (login(username, password)) {
        // success
      } else {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-text';
        errorDiv.textContent = '用户名或密码错误，请重试。';
        loginForm.appendChild(errorDiv);
      }
    });
  }

  window.addEventListener("load", () => {
    const hash = (location.hash || "").replace("#", "");
    if (hash && document.getElementById(hash)) {
      setTimeout(() => smoothScrollToId(hash), 50);
    }
  });

  function initCarousel() {
    const carouselContainer = document.querySelector('.factory-carousel');
    if (!carouselContainer) return;
    const wrapper = carouselContainer.querySelector('.carousel-wrapper');
    const items = carouselContainer.querySelectorAll('.carousel-item');
    const prevBtn = carouselContainer.querySelector('.carousel-control.prev');
    const nextBtn = carouselContainer.querySelector('.carousel-control.next');
    const indicatorsContainer = carouselContainer.querySelector('.carousel-indicators');
    let currentIndex = 0;
    const itemCount = items.length;
    items.forEach((_, index) => {
      const indicator = document.createElement('button');
      indicator.className = 'carousel-indicator';
      if (index === 0) indicator.classList.add('active');
      indicator.addEventListener('click', () => goToSlide(index));
      indicatorsContainer.appendChild(indicator);
    });
    const indicators = carouselContainer.querySelectorAll('.carousel-indicator');
    function updateIndicators() {
      indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentIndex);
      });
    }
    function goToSlide(index) {
      currentIndex = index;
      wrapper.style.transform = `translateX(-${index * 100}%)`;
      updateIndicators();
    }
    function nextSlide() { goToSlide((currentIndex + 1) % itemCount); }
    function prevSlide() { goToSlide((currentIndex - 1 + itemCount) % itemCount); }
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    let autoSlideInterval = setInterval(nextSlide, 5000);
    carouselContainer.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
    carouselContainer.addEventListener('mouseleave', () => { autoSlideInterval = setInterval(nextSlide, 5000); });
  }

  document.addEventListener('DOMContentLoaded', initCarousel);
})();

(function initHeroSlider() {
  const wrapper = document.getElementById('heroSlider');
  const controls = document.getElementById('sliderControls');
  const prevBtn = document.getElementById('sliderPrev');
  const nextBtn = document.getElementById('sliderNext');
  if (!wrapper || !controls) return;

  const slides = wrapper.querySelectorAll('.slide');
  const total = slides.length;
  if (total === 0) return;

  let current = 0;
  let autoInterval;

  controls.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', '切换到第 ' + (i + 1) + ' 张');
    dot.addEventListener('click', () => goTo(i));
    controls.appendChild(dot);
  }

  function goTo(index) {
    current = ((index % total) + total) % total;
    wrapper.style.transform = 'translateX(-' + (current * 100) + '%)';
    const dots = controls.querySelectorAll('.slider-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetAuto(); });

  function resetAuto() {
    clearInterval(autoInterval);
    autoInterval = setInterval(next, 5000);
  }

  const slider = wrapper.closest('.hero-slider');
  if (slider) {
    slider.addEventListener('mouseenter', () => clearInterval(autoInterval));
    slider.addEventListener('mouseleave', resetAuto);
  }

  resetAuto();
})();

document.addEventListener("DOMContentLoaded", async () => {
  const productsGrid = document.getElementById("productsGrid");
  if (!productsGrid) return;

  let allProducts = [];

  try {
    const response = await fetch("products.json");
    if (!response.ok) {
      throw new Error(`产品数据加载失败: ${response.status}`);
    }
    const { products } = await response.json();
    if (!Array.isArray(products)) {
      throw new Error("产品数据格式无效。");
    }
    allProducts = products;
  } catch (error) {
    console.error("产品渲染失败:", error);
    productsGrid.innerHTML = `
      <div class="note">
        <i class="fa-solid fa-circle-exclamation"></i>
        <span>暂时无法加载产品，请稍后重试。</span>
      </div>
    `;
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  let activeCategory1 = urlParams.get('category1');
  let activeCategory2 = urlParams.get('category2');
  let activeCategory3 = urlParams.get('category3');

  const sectionHead = document.querySelector("#products .section-head");

  function updateFilterBreadcrumb() {
    let existing = document.getElementById("filterBreadcrumb");
    if (existing) existing.remove();

    if (!activeCategory1 && !activeCategory2 && !activeCategory3) return;

    const div = document.createElement("div");
    div.id = "filterBreadcrumb";
    div.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;";

    let parts = [];
    if (activeCategory1) parts.push(activeCategory1);
    if (activeCategory2) parts.push(activeCategory2);
    if (activeCategory3) parts.push(activeCategory3);

    div.innerHTML = `
      <span style="font-size:13px;color:var(--muted-2);">当前筛选：</span>
      <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:rgba(11,60,106,.06);border:1px solid var(--line);border-radius:2px;font-size:13px;font-weight:700;color:var(--brand-blue);">
        <i class="fa-solid fa-filter" style="font-size:11px;"></i>
        ${parts.join(' / ')}
      </span>
      <button id="clearFilter" type="button" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border:1px solid var(--line);border-radius:2px;background:var(--bg);color:var(--muted);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;">
        <i class="fa-solid fa-xmark" style="font-size:10px;"></i> 清除筛选
      </button>
    `;

    sectionHead.appendChild(div);

    document.getElementById("clearFilter")?.addEventListener("click", () => {
      activeCategory1 = null;
      activeCategory2 = null;
      activeCategory3 = null;
      history.replaceState(null, "", "index.html#products");
      filterProducts();
      updateFilterBreadcrumb();
      highlightActiveCategory();
    });
  }

  function highlightActiveCategory() {
    document.querySelectorAll(".category-item").forEach(item => {
      const href = item.getAttribute("href") || "";
      const url = new URL(href, window.location.origin + window.location.pathname);
      const itemCat1 = url.searchParams.get("category1");
      if (activeCategory1 && itemCat1 === activeCategory1) {
        item.style.borderColor = "var(--brand-blue)";
        item.style.boxShadow = "0 4px 16px rgba(11,60,106,.10)";
      } else {
        item.style.borderColor = "";
        item.style.boxShadow = "";
      }
    });
  }

  function renderProducts(products) {
    if (products.length === 0) {
      productsGrid.innerHTML = `
        <div class="note">
          <i class="fa-solid fa-circle-info"></i>
          <span>该分类下暂无产品。</span>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = products.map((product) => {
      const imagePath = product.imagePath;
      const tagHtml = product.tag ? `<div class="product-tag">${product.tag}</div>` : '';

      return `
        <article class="product-card">
          <a href="product-detail.html?id=${product.id}" class="product-link">
            <div class="product-media">
              ${tagHtml}
              <img
                src="${imagePath}"
                alt="${product.name}"
                loading="lazy"
                onerror="this.closest('.product-media').classList.add('img-missing'); this.style.display='none';"
              />
              <div class="img-fallback" aria-hidden="true">
                <i class="fa-solid fa-box"></i>
                <div>
                  <div class="fallback-title">产品图片</div>
                </div>
              </div>
            </div>
            <div class="product-body">
              <h3 class="product-title">${product.name}</h3>
              <div class="product-sku"><i class="fa-solid fa-hashtag" style="font-size:11px;margin-right:4px;color:var(--muted-2);"></i> 型号：<strong>${product.model}</strong></div>
              <div class="product-moq"><i class="fa-solid fa-box-open" style="font-size:11px;margin-right:4px;color:var(--muted-2);"></i> 起订量：${product.moq}</div>
              <p class="product-desc">${product.description}</p>
            </div>
          </a>
          <div class="product-actions">
            <button
              class="inquiry-btn"
              type="button"
              data-product-name="${product.name}"
              data-inquire="${product.model}"
            >
              <i class="fa-solid fa-paper-plane"></i>
              立即询价
            </button>
          </div>
        </article>
      `;
    }).join("");

    bindInquiryButtons();
  }

  function filterProducts() {
    let filtered = allProducts;
    const searchTerm = document.getElementById("searchInput")?.value?.trim().toLowerCase() || "";

    if (activeCategory1) {
      filtered = filtered.filter(p => p.category1 === activeCategory1);
    }
    if (activeCategory2) {
      filtered = filtered.filter(p => p.category2 === activeCategory2);
    }
    if (activeCategory3) {
      filtered = filtered.filter(p => p.category3 === activeCategory3);
    }
    if (searchTerm) {
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(searchTerm)) ||
        (p.model && p.model.toLowerCase().includes(searchTerm)) ||
        (p.spec && p.spec.toLowerCase().includes(searchTerm)) ||
        (p.description && p.description.toLowerCase().includes(searchTerm)) ||
        (p.category1 && p.category1.toLowerCase().includes(searchTerm)) ||
        (p.category2 && p.category2.toLowerCase().includes(searchTerm))
      );
    }
    renderProducts(filtered);
  }

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(filterProducts, 300);
    });
    searchInput.closest(".search-box")?.querySelector("button")?.addEventListener("click", filterProducts);
  }

  filterProducts();
  updateFilterBreadcrumb();
  highlightActiveCategory();

  if (activeCategory1 || activeCategory2 || activeCategory3) {
    setTimeout(() => {
      const productsSection = document.getElementById("products");
      if (productsSection) {
        const headerH = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
        const top = productsSection.getBoundingClientRect().top + window.scrollY - headerH - 10;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 100);
  }

  document.querySelectorAll(".category-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const href = item.getAttribute("href") || "";
      const url = new URL(href, window.location.origin + window.location.pathname);
      activeCategory1 = url.searchParams.get("category1");
      activeCategory2 = url.searchParams.get("category2");
      activeCategory3 = url.searchParams.get("category3");
      const newUrl = new URL(window.location.origin + window.location.pathname);
      if (activeCategory1) newUrl.searchParams.set("category1", activeCategory1);
      if (activeCategory2) newUrl.searchParams.set("category2", activeCategory2);
      if (activeCategory3) newUrl.searchParams.set("category3", activeCategory3);
      newUrl.hash = "products";
      history.pushState(null, "", newUrl.toString());
      filterProducts();
      updateFilterBreadcrumb();
      highlightActiveCategory();
      const productsSection = document.getElementById("products");
      if (productsSection) {
        const headerH = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
        const top = window.scrollY + productsSection.getBoundingClientRect().top - headerH - 10;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  });

  function bindInquiryButtons() {
    productsGrid.querySelectorAll("[data-inquire]").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const model = button.getAttribute("data-inquire") || "";
        const messageEl = document.getElementById("message");
        if (messageEl) {
          const template =
            `您好，我对型号 ${model} 很感兴趣。\n` +
            `请报价：单价、起订量、交货期、包装方式，以及运至（邮编/港口）：\n\n` +
            `采购数量：\n` +
            `公司名称：\n` +
            `备注（OEM/ODM、贴牌等）：\n`;
          if (!messageEl.value.trim()) {
            messageEl.value = template;
          } else if (!messageEl.value.includes(model)) {
            messageEl.value = `${messageEl.value.trim()}\n\n---\n感兴趣的型号：${model}\n`;
          }
        }
        const contactSection = document.getElementById("contact");
        if (contactSection) {
          const headerH = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
          const top = window.scrollY + contactSection.getBoundingClientRect().top - headerH - 10;
          window.scrollTo({ top, behavior: "smooth" });
        }
      });
    });
  }
});
