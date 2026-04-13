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

  // If page loads with hash, scroll with offset
  window.addEventListener("load", () => {
    const hash = (location.hash || "").replace("#", "");
    if (hash && document.getElementById(hash)) {
      setTimeout(() => smoothScrollToId(hash), 50);
    }
  });
})();

document.addEventListener("DOMContentLoaded", async () => {
  const productsGrid = document.getElementById("productsGrid");

  if (!productsGrid) return;

  try {
    const response = await fetch("/products.json");

    if (!response.ok) {
      throw new Error(`Failed to load products.json: ${response.status}`);
    }

    const { products } = await response.json();

    if (!Array.isArray(products)) {
      throw new Error("Invalid products data.");
    }

    const productCardsHtml = products
      .map((product) => {
        const imagePath = product.imagePath;

        return `
          <article class="product-card">
            <div class="product-media">
              <div class="product-tag">${product.category}</div>
              <img
                src="${imagePath}"
                alt="${product.name}"
                loading="lazy"
                onerror="this.closest('.product-media').classList.add('img-missing'); this.style.display='none';"
              />
              <div class="img-fallback" aria-hidden="true">
                <i class="fa-solid fa-box"></i>
                <div>
                  <div class="fallback-title">Image Placeholder</div>
                  <div class="fallback-sub">\`${imagePath}\`</div>
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
          </article>
        `;
      })
      .join("");

    productsGrid.innerHTML = productCardsHtml;

    productsGrid.querySelectorAll("[data-product-name]").forEach((button) => {
      button.addEventListener("click", () => {
        alert(button.getAttribute("data-product-name"));
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
