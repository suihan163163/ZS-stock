(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Year in footer
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile menu toggle
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

    // Close menu on link click
    $$("#mobileMenu a[href^='#']").forEach((a) => {
      a.addEventListener("click", () => setMenuOpen(false));
    });

    // Close on Esc
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    });

    // Close if resized to desktop
    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 768px)").matches) setMenuOpen(false);
    });
  }

  // Smooth scroll with sticky header offset
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

  // Intercept in-page anchor clicks
  $$("a[href^='#']").forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;

      const id = href.slice(1);
      if (!id) return;

      // Allow normal behavior if target not found
      if (!document.getElementById(id)) return;

      e.preventDefault();
      smoothScrollToId(id);

      // Update URL hash without jump
      history.pushState(null, "", `#${id}`);
    });
  });

  // Product "Inquire Now" buttons -> prefill message
  const inquiryForm = $("#inquiryForm");
  const messageEl = $("#message");
  const modal = $("#successModal");
  const modalRef = $("#modalRef");

  function openModal(referenceText) {
    if (!modal) return;
    if (modalRef) modalRef.textContent = referenceText || "General Inquiry";

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");

    // Prevent background scroll
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    // Focus close button for accessibility
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

  $$("[data-inquire]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const model = btn.getAttribute("data-inquire") || "";
      if (messageEl) {
        const template =
          `Hello, I'm interested in model ${model}.\n` +
          `Please quote: unit price, MOQ, lead time, packaging options, and shipping to (ZIP/Port): \n\n` +
          `Quantity: \n` +
          `Company: \n` +
          `Notes (OEM/ODM, logo, etc.): \n`;

        // Only overwrite if empty; otherwise append politely
        if (!messageEl.value.trim()) {
          messageEl.value = template;
        } else if (!messageEl.value.includes(model)) {
          messageEl.value = `${messageEl.value.trim()}\n\n---\nInterested model: ${model}\n`;
        }
      }
    });
  });

  // Form validation + success popup (static site)
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

    // Avoid duplicates
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

      if (!name) {
        ok = false;
        setError($("#name"), "Please enter your name.");
      }

      if (!email) {
        ok = false;
        setError($("#email"), "Please enter your email.");
      } else if (!isValidEmail(email)) {
        ok = false;
        setError($("#email"), "Please enter a valid email address.");
      }

      if (!message) {
        ok = false;
        setError($("#message"), "Please enter your message.");
      } else if (message.length < 15) {
        ok = false;
        setError($("#message"), "Please add a bit more detail (model, quantity, destination).");
      }

      if (!ok) return;

      // Create a lightweight reference
      const ref = `INQ-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
      openModal(ref);

      // Reset fields (static demo)
      inquiryForm.reset();
    });
  }

  // Modal close interactions
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

  // Login functionality
  const loginBtn = $("#loginBtn");
  const adminBtn = $("#adminBtn");
  const loginModal = $("#loginModal");
  const loginForm = $("#loginForm");

  function openLoginModal() {
    if (!loginModal) return;

    loginModal.hidden = false;
    loginModal.setAttribute("aria-hidden", "false");

    // Prevent background scroll
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    // Focus username input for accessibility
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
    // Hardcoded admin credentials
    if (username === 'admin' && password === 'zsadmin414') {
      localStorage.setItem('adminLoggedIn', 'true');
      checkLoginStatus();
      closeLoginModal();
      return true;
    }
    return false;
  }

  // Check login status on page load
  checkLoginStatus();

  // Login button click event
  if (loginBtn) {
    loginBtn.addEventListener('click', openLoginModal);
  }

  // Login modal close interactions
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

  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors(loginForm);

      const username = $("#username") ? $("#username").value.trim() : "";
      const password = $("#password") ? $("#password").value.trim() : "";

      let ok = true;

      if (!username) {
        ok = false;
        setError($("#username"), "Please enter username.");
      }

      if (!password) {
        ok = false;
        setError($("#password"), "Please enter password.");
      }

      if (!ok) return;

      if (login(username, password)) {
        // Login successful
      } else {
        // Login failed
        const form = loginForm;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-text';
        errorDiv.textContent = 'Invalid username or password. Please try again.';
        form.appendChild(errorDiv);
      }
    });
  }

  // If page loads with hash, scroll with offset
  window.addEventListener("load", () => {
    const hash = (location.hash || "").replace("#", "");
    if (hash && document.getElementById(hash)) {
      setTimeout(() => smoothScrollToId(hash), 50);
    }
  });

  // Factory Carousel
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

    // Create indicators
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
        if (index === currentIndex) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      });
    }

    function goToSlide(index) {
      currentIndex = index;
      const translateX = -index * 100;
      wrapper.style.transform = `translateX(${translateX}%)`;
      updateIndicators();
    }

    function nextSlide() {
      currentIndex = (currentIndex + 1) % itemCount;
      goToSlide(currentIndex);
    }

    function prevSlide() {
      currentIndex = (currentIndex - 1 + itemCount) % itemCount;
      goToSlide(currentIndex);
    }

    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    // Auto slide
    let autoSlideInterval = setInterval(nextSlide, 5000);

    // Pause auto slide on hover
    carouselContainer.addEventListener('mouseenter', () => {
      clearInterval(autoSlideInterval);
    });

    carouselContainer.addEventListener('mouseleave', () => {
      autoSlideInterval = setInterval(nextSlide, 5000);
    });
  }

  // Initialize carousel when DOM is loaded
  document.addEventListener('DOMContentLoaded', initCarousel);
})();

document.addEventListener("DOMContentLoaded", async () => {
  const productsGrid = document.getElementById("productsGrid");

  if (!productsGrid) return;

  try {
    const response = await fetch("products.json");

    if (!response.ok) {
      throw new Error(`Failed to load products.json: ${response.status}`);
    }

    const { products } = await response.json();

    if (!Array.isArray(products)) {
      throw new Error("Invalid products data.");
    }

    // Get category parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const category1 = urlParams.get('category1');
    const category2 = urlParams.get('category2');
    const category3 = urlParams.get('category3');

    // Filter products by multi-level categories
    let filteredProducts = products;
    if (category1) {
      filteredProducts = filteredProducts.filter(product => product.category1 === category1);
    }
    if (category2) {
      filteredProducts = filteredProducts.filter(product => product.category2 === category2);
    }
    if (category3) {
      filteredProducts = filteredProducts.filter(product => product.category3 === category3);
    }

    const productCardsHtml = filteredProducts
      .map((product) => {
        const imagePath = product.imagePath;
        const categoryDisplay = product.category1 || product.category;

        return `
          <article class="product-card">
            <a href="product-detail.html?id=${product.id}" class="product-link">
              <div class="product-media">
                <div class="product-tag">${categoryDisplay}</div>
                <img
                  src="${imagePath}"
                  alt="${product.name}"
                  loading="lazy"
                  onerror="this.closest('.product-media').classList.add('img-missing'); this.style.display='none';"
                />
                <div class="img-fallback" aria-hidden="true">
                  <i class="fa-solid fa-box"></i>
                  <div>
                    <div class="fallback-title">Product Image</div>
                  </div>
                </div>
              </div>
              <div class="product-body">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-meta">
                  <span class="pill"><i class="fa-solid fa-hashtag"></i> Model: ${product.model}</span>
                  <span class="pill"><i class="fa-solid fa-ruler-combined"></i> Spec: ${product.spec}</span>
                  <span class="pill"><i class="fa-solid fa-box-open"></i> MOQ: ${product.moq}</span>
                </div>
                <p class="product-desc">${product.description}</p>
                <div class="product-actions">
                  <a
                    class="btn btn-primary w-full justify-center"
                    href="#contact"
                    data-product-name="${product.name}"
                    data-inquire="${product.model}"
                  >
                    <i class="fa-solid fa-paper-plane"></i>
                    Inquire Now
                  </a>
                </div>
              </div>
            </a>
          </article>
        `;
      })
      .join("");

    if (filteredProducts.length === 0) {
      productsGrid.innerHTML = `
        <div class="note">
          <i class="fa-solid fa-circle-info"></i>
          <span>No products found in this category.</span>
        </div>
      `;
    } else {
      productsGrid.innerHTML = productCardsHtml;
    }

    // Handle inquiry buttons
    productsGrid.querySelectorAll("[data-inquire]").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent the product link from firing
        // The href="#contact" will handle the scrolling
      });
    });
  } catch (error) {
    console.error("Product rendering failed:", error);
    productsGrid.innerHTML = `
      <div class="note">
        <i class="fa-solid fa-circle-exclamation"></i>
        <span>Unable to load products at the moment. Please try again later.</span>
      </div>
    `;
  }
});
