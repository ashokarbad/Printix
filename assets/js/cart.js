/*
 * Printix — shopping cart.
 * Items are saved in this browser (localStorage) so the cart follows the customer
 * across pages. Only product ids, choices and quantities are saved; prices are
 * always recalculated from products.js. Nothing is sent anywhere until the
 * customer presses "Send order on WhatsApp".
 */
(function () {
  "use strict";

  var cfg = window.PRINTIX_CONFIG;
  var lib = window.PrintixLib;
  var ui = window.PrintixUI;
  var art = window.PrintixArt;
  var products = window.PRINTIX_PRODUCTS;
  var esc = ui.escapeHtml;
  var base = document.body.getAttribute("data-base") || "";

  var KEY = "printix-cart-v1";
  var memory = [];       // fallback when the browser blocks storage (private mode, etc.)
  var storageOk = true;

  var ICON_WA = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  var ICON_BIN = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
  var ICON_BAG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>';

  /* ---------- Storage ---------- */

  function readSaved() {
    try {
      var raw = window.localStorage.getItem(KEY);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      storageOk = false;
      return memory.slice();
    }
  }

  function writeSaved(lines) {
    var plain = lines.map(function (l) { return { productId: l.productId, selections: l.selections, qty: l.qty }; });
    memory = plain;
    try { window.localStorage.setItem(KEY, JSON.stringify(plain)); } catch (err) { storageOk = false; }
  }

  function current() {
    return lib.priceCart(products, readSaved());
  }

  function save(lines) {
    writeSaved(lines);
    refresh();
  }

  /* ---------- Public actions ---------- */

  function add(productId, selections, qty) {
    var cart = current();
    var key = lib.cartKey(productId, selections);
    var found = false;
    var lines = cart.lines.map(function (l) {
      if (lib.cartKey(l.productId, l.selections) === key) {
        found = true;
        return { productId: l.productId, selections: l.selections, qty: Math.min(500, l.qty + qty) };
      }
      return l;
    });
    if (!found) lines.push({ productId: productId, selections: selections, qty: qty });
    var priced = lib.priceCart(products, lines);
    save(priced.lines);
    bumpBadge();
    return lib.priceCart(products, readSaved());
  }

  /* ---------- Header badge ---------- */

  function updateBadges(cart) {
    document.querySelectorAll("[data-cart-open]").forEach(function (btn) {
      var badge = btn.querySelector("[data-cart-count]");
      if (badge) {
        badge.textContent = cart.count > 99 ? "99+" : String(cart.count);
        badge.hidden = cart.count === 0;
      }
      btn.setAttribute("aria-label", "Cart, " + cart.count + (cart.count === 1 ? " item" : " items"));
    });
  }

  function bumpBadge() {
    document.querySelectorAll("[data-cart-count]").forEach(function (b) {
      b.classList.remove("bump");
      void b.offsetWidth;
      b.classList.add("bump");
    });
  }

  /* ---------- Cart panel ---------- */

  var drawer = document.createElement("dialog");
  drawer.className = "cart-drawer";
  drawer.id = "cart-drawer";
  drawer.setAttribute("aria-labelledby", "cart-title");
  drawer.innerHTML =
    '<div class="cart-panel">' +
      '<header class="cart-head">' +
        '<h2 id="cart-title">Your cart</h2>' +
        '<button type="button" class="cart-close" aria-label="Close cart">' + ICON_X + '</button>' +
      '</header>' +
      '<div class="cart-body">' +
        '<p class="cart-dropped" hidden></p>' +
        '<ul class="cart-items"></ul>' +
        '<div class="cart-empty" hidden>' +
          '<span class="cart-empty-icon">' + ICON_BAG + '</span>' +
          '<h3>Your cart is empty</h3>' +
          '<p>Choose a product and its options, then add it here. You can add several products and send them as one order.</p>' +
          '<a class="btn btn-dark" href="' + base + 'products/index.html">Browse products</a>' +
        '</div>' +
        '<form class="cart-form" id="cart-form" novalidate>' +
          '<h3>Your details</h3>' +
          '<div class="field"><label for="c-name">Name</label><input id="c-name" type="text" autocomplete="name" maxlength="60"><span class="field-error"></span></div>' +
          '<div class="field"><label for="c-phone">Mobile number</label><input id="c-phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="16" aria-describedby="c-phone-hint"><span class="hint" id="c-phone-hint">We\'ll send your design preview here on WhatsApp.</span><span class="field-error"></span></div>' +
          '<div class="field"><label for="c-notes">Notes <span class="optional">(optional)</span></label><textarea id="c-notes" maxlength="600" placeholder="Names to print, sizes for each piece, when you need it…"></textarea><span class="field-error"></span></div>' +
        '</form>' +
      '</div>' +
      '<footer class="cart-foot">' +
        '<div class="cart-total"><span data-cart-items></span><strong data-cart-total></strong></div>' +
        '<p class="cart-note"></p>' +
        '<button type="submit" form="cart-form" class="btn btn-primary btn-block" data-cart-send>' + ICON_WA + 'Send order on WhatsApp</button>' +
        '<div class="cart-status" role="status" hidden></div>' +
      '</footer>' +
    '</div>';
  document.body.appendChild(drawer);

  var listEl = drawer.querySelector(".cart-items");
  var emptyEl = drawer.querySelector(".cart-empty");
  var formEl = drawer.querySelector(".cart-form");
  var footEl = drawer.querySelector(".cart-foot");
  var statusEl = drawer.querySelector(".cart-status");
  var droppedEl = drawer.querySelector(".cart-dropped");
  var lastTrigger = null;

  drawer.querySelector(".cart-note").textContent = cfg.pricesConfirmed
    ? "We reply on WhatsApp with your design preview and how to pay."
    : "Prices are starting prices. We confirm the final price on WhatsApp with your design preview.";

  function optionText(l) {
    return l.calc.lines.map(function (o) { return o.value; }).join(" · ");
  }

  function lineHtml(l, i) {
    var p = l.calc.product;
    var min = p.minQty || 1;
    var spec = art.forSelections(p, l.selections);
    delete spec.badge; // too small to read here; the size is in the text
    var visual = p.image
      ? '<img src="' + esc(base + p.image) + '" alt="">'
      : art.render(spec, products.indexOf(p), "").replace('role="img"', 'aria-hidden="true"').replace(/ aria-label="[^"]*"/, "");
    return '<li class="cart-line" data-line="' + i + '">' +
      '<div class="cart-thumb">' + visual + '</div>' +
      '<div class="cart-info">' +
        '<div class="cart-line-top"><h3>' + esc(p.name) + '</h3>' +
          '<button type="button" class="cart-remove" data-remove="' + i + '" aria-label="Remove ' + esc(p.name) + '">' + ICON_BIN + '</button></div>' +
        (optionText(l) ? '<p class="cart-opts">' + esc(optionText(l)) + '</p>' : '') +
        '<div class="cart-line-bottom">' +
          '<div class="qty qty-sm" role="group" aria-label="Quantity for ' + esc(p.name) + '">' +
            '<button type="button" data-step="-1" data-i="' + i + '" aria-label="Decrease quantity"' + (l.qty <= min ? ' disabled' : '') + '>−</button>' +
            '<span aria-live="polite">' + l.qty + '</span>' +
            '<button type="button" data-step="1" data-i="' + i + '" aria-label="Increase quantity"' + (l.qty >= 500 ? ' disabled' : '') + '>+</button>' +
          '</div>' +
          '<span class="cart-line-price"><small>' + l.qty + ' × ' + esc(lib.formatINR(l.calc.unit)) + '</small>' + esc(lib.formatINR(l.calc.total)) + '</span>' +
        '</div>' +
      '</div>' +
    '</li>';
  }

  function render() {
    var cart = current();
    listEl.innerHTML = cart.lines.map(lineHtml).join("");
    var empty = cart.lines.length === 0;
    emptyEl.hidden = !empty;
    formEl.hidden = empty;
    footEl.hidden = empty;
    drawer.querySelector("#cart-title").textContent = empty ? "Your cart" : "Your cart (" + cart.count + ")";
    drawer.querySelector("[data-cart-items]").textContent = cart.count + (cart.count === 1 ? " item" : " items");
    drawer.querySelector("[data-cart-total]").textContent = lib.formatINR(cart.total);
    if (cart.dropped > 0) {
      droppedEl.textContent = "Some items were removed because the product or its options have changed.";
      droppedEl.hidden = false;
      writeSaved(cart.lines);
    }
    return cart;
  }

  function refresh() {
    var cart = drawer.open ? render() : current();
    updateBadges(cart);
  }

  function open(trigger) {
    lastTrigger = trigger || document.activeElement;
    statusEl.hidden = true;
    statusEl.innerHTML = "";
    droppedEl.hidden = true;
    render();
    drawer.showModal();
  }

  function close() { drawer.close(); }

  drawer.addEventListener("close", function () {
    if (lastTrigger && document.body.contains(lastTrigger) && lastTrigger.focus) lastTrigger.focus();
  });
  drawer.querySelector(".cart-close").addEventListener("click", close);
  drawer.addEventListener("click", function (e) { if (e.target === drawer) close(); });

  listEl.addEventListener("click", function (e) {
    var cart = current();
    var step = e.target.closest("[data-step]");
    var rm = e.target.closest("[data-remove]");
    if (step) {
      var i = Number(step.getAttribute("data-i"));
      var l = cart.lines[i];
      if (!l) return;
      var min = l.calc.product.minQty || 1;
      l.qty = Math.min(500, Math.max(min, l.qty + Number(step.getAttribute("data-step"))));
      save(cart.lines);
      var again = listEl.querySelector('[data-i="' + i + '"][data-step="' + step.getAttribute("data-step") + '"]');
      if (again && !again.disabled) again.focus();
    } else if (rm) {
      var idx = Number(rm.getAttribute("data-remove"));
      cart.lines.splice(idx, 1);
      save(cart.lines);
      var next = listEl.querySelector('[data-remove="' + Math.min(idx, cart.lines.length - 1) + '"]');
      if (next) next.focus(); else drawer.querySelector(".cart-close").focus();
    }
  });

  function setError(field, message) {
    var wrap = field.closest(".field");
    var out = wrap.querySelector(".field-error");
    if (message) { wrap.setAttribute("data-invalid", ""); field.setAttribute("aria-invalid", "true"); }
    else { wrap.removeAttribute("data-invalid"); field.removeAttribute("aria-invalid"); }
    out.textContent = message || "";
  }

  formEl.addEventListener("submit", function (e) {
    e.preventDefault();
    var cart = current();
    if (!cart.lines.length) { render(); return; }
    var name = formEl.querySelector("#c-name"), phone = formEl.querySelector("#c-phone"), notes = formEl.querySelector("#c-notes");
    var ok = true;
    if (name.value.trim().length < 2) { setError(name, "Enter your name."); ok = false; } else setError(name, "");
    var mobile = lib.normalizeIndianMobile(phone.value);
    if (!mobile) { setError(phone, "Enter a 10-digit Indian mobile number."); ok = false; } else setError(phone, "");
    if (!ok) { formEl.querySelector("[aria-invalid]").focus(); return; }

    var text = lib.cartMessage(cart, { name: name.value.trim(), phone: mobile, notes: notes.value.trim() }, { pricesConfirmed: cfg.pricesConfirmed });
    var link = lib.whatsappLink(cfg.whatsappNumber, text);
    var win = window.open(link, "_blank");
    if (win) { try { win.opener = null; } catch (err) { /* ignore */ } }

    statusEl.hidden = false;
    statusEl.innerHTML =
      '<p>' + (win === null
        ? 'Your order is ready. <a href="' + esc(link) + '" target="_blank" rel="noopener">Open WhatsApp to send it</a>.'
        : 'WhatsApp has opened with your order. Press send there so it reaches us, then attach your photos or designs.') + '</p>' +
      '<button type="button" class="btn btn-ghost btn-block" data-cart-clear>I\'ve sent it – empty my cart</button>';
    statusEl.querySelector("[data-cart-clear]").addEventListener("click", function () {
      save([]);
      statusEl.hidden = true;
      formEl.reset();
      drawer.querySelector(".cart-close").focus();
    });
  });

  /* ---------- Wiring ---------- */

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-cart-open]");
    if (btn) { e.preventDefault(); open(btn); }
  });

  // Keep the badge in step with other open tabs.
  window.addEventListener("storage", function (e) { if (e.key === KEY) refresh(); });

  window.PrintixCart = {
    add: add,
    open: open,
    summary: current,
    storageOk: function () { return storageOk; }
  };

  updateBadges(current());
})();
