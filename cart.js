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
      console.warn('购物车保存失败:', e);
    }
    updateBadge();
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
      performFlyToCartAnimation(event.target, product.image);
    }
    animateBadge();
  }

  function performFlyToCartAnimation(clickedElement, imageUrl) {
    try {
      var productCard = clickedElement.closest('.product-card');
      if (!productCard) {
        productCard = clickedElement.closest('article');
      }
      var productImg = productCard ? productCard.querySelector('.product-media img') : null;
      if (!productImg && imageUrl) {
        productImg = document.createElement('img');
        productImg.src = imageUrl;
      }
      if (!productImg) return;

      var cartBtn = document.querySelector('.cart-toggle-btn');
      if (!cartBtn) return;

      var imgRect = productImg.getBoundingClientRect();
      var cartRect = cartBtn.getBoundingClientRect();

      var flyingImg = productImg.cloneNode(true);
      flyingImg.src = productImg.src;
      flyingImg.classList.add('flying-item');
      flyingImg.style.width = imgRect.width + 'px';
      flyingImg.style.height = imgRect.height + 'px';
      flyingImg.style.left = imgRect.left + 'px';
      flyingImg.style.top = imgRect.top + 'px';
      document.body.appendChild(flyingImg);

      requestAnimationFrame(function() {
        flyingImg.style.left = cartRect.left + cartRect.width / 2 - imgRect.width / 2 + 'px';
        flyingImg.style.top = cartRect.top + cartRect.height / 2 - imgRect.height / 2 + 'px';
        flyingImg.style.transform = 'scale(0.1)';
        flyingImg.style.opacity = '0';
      });

      flyingImg.addEventListener('transitionend', function() {
        if (flyingImg.parentNode) {
          flyingImg.parentNode.removeChild(flyingImg);
        }
        var badges = document.querySelectorAll('.cart-badge');
        badges.forEach(function(badge) {
          badge.classList.remove('cart-bounce');
          void badge.offsetWidth;
          badge.classList.add('cart-bounce');
        });
      });
    } catch (e) {
      console.warn('飞入动画失败', e);
    }
  }

  function updateQuantity(id, delta) {
    var cart = getCart();
    var item = cart.find(function(i) { return i.id === id; });
    if (!item) return;
    item.quantity = Math.max(1, item.quantity + delta);
    saveCart(cart);
  }

  function removeFromCart(id) {
    var cart = getCart().filter(function(i) { return i.id !== id; });
    saveCart(cart);
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

  function animateBadge() {
    var badges = document.querySelectorAll('.cart-badge');
    for (var i = 0; i < badges.length; i++) {
      badges[i].classList.remove('cart-badge-bounce');
      void badges[i].offsetWidth;
      badges[i].classList.add('cart-badge-bounce');
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
          '<i class="fa-solid fa-trash-can"></i>' +
        '</button>' +
      '</div>';
    }
    listEl.innerHTML = html;

    var total = calculateTotal();
    if (totalEl) totalEl.textContent = total > 0 ? '$' + total.toFixed(2) : '询价';

    listEl.querySelectorAll('.cart-qty-minus').forEach(function(btn) {
      btn.addEventListener('click', function() {
        updateQuantity(parseInt(this.dataset.id), -1);
        renderCartPanel();
      });
    });
    listEl.querySelectorAll('.cart-qty-plus').forEach(function(btn) {
      btn.addEventListener('click', function() {
        updateQuantity(parseInt(this.dataset.id), 1);
        renderCartPanel();
      });
    });
    listEl.querySelectorAll('.cart-item-remove').forEach(function(btn) {
      btn.addEventListener('click', function() {
        removeFromCart(parseInt(this.dataset.id));
        renderCartPanel();
      });
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

  function initCartUI() {
    var cartBtns = document.querySelectorAll('.cart-toggle-btn');
    cartBtns.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        openCartPanel();
      });
    });

    var closeBtn = document.getElementById('cartCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeCartPanel);
    }

    var overlay = document.getElementById('cartOverlay');
    if (overlay) {
      overlay.addEventListener('click', closeCartPanel);
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeCartPanel();
    });

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
    initCartUI: initCartUI
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCartUI);
  } else {
    initCartUI();
  }
})();
