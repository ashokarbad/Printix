/*
 * Printix — product tiles, search and filters, and the order dialog.
 * Used on the home page (popular products), products page and about page.
 */
(function () {
  "use strict";

  var cfg = window.PRINTIX_CONFIG;
  var lib = window.PrintixLib;
  var ui = window.PrintixUI;
  var art = window.PrintixArt;
  var products = window.PRINTIX_PRODUCTS;
  var categories = window.PRINTIX_CATEGORIES;
  var esc = ui.escapeHtml;

  // Pages live one folder deep (products/, contact/) or at the root.
  // Links name index.html explicitly so the site also works when opened straight from the folder.
  var base = document.body.getAttribute("data-base") || "";
  var hasDialog = !!document.getElementById("order-dialog");

  var COLOUR_OPTIONS = art.COLOUR_OPTIONS;

  // Keep "T-shirt" from breaking across lines in headings.
  function nameHtml(name) { return esc(name).replace(/T-shirt/g, '<span class="nw">T-shirt</span>'); }


  function categoryById(id) {
    for (var i = 0; i < categories.length; i++) if (categories[i].id === id) return categories[i];
    return null;
  }
  function categoryName(id) { var c = categoryById(id); return c ? c.name : ""; }

  function findOption(p, id) {
    for (var i = 0; i < p.options.length; i++) if (p.options[i].id === id) return p.options[i];
    return null;
  }

  function productVisual(p, variant, selections) {
    if (p.image) return '<img src="' + esc(base + p.image) + '" alt="' + esc(p.name) + '" loading="lazy">';
    return art.render(selections ? art.forSelections(p, selections) : p.art, variant, esc(p.name));
  }

  function priceHtml(p) {
    if (p.price === null) return '<span class="price">On request</span>';
    return '<span class="price"><small>From </small>' + esc(lib.formatINR(p.price)) + '</span>';
  }

  // Small facts row on each tile: colour swatches and how many sizes.
  function optionFacts(p) {
    var out = "";
    p.options.forEach(function (o) {
      if (COLOUR_OPTIONS[o.id]) {
        var dots = o.choices.map(function (c) {
          var hex = art.colourFor(c.label);
          return hex ? '<i style="background:' + hex + '" title="' + esc(c.label) + '"></i>' : "";
        }).join("");
        if (dots) out += '<span class="swatches" aria-label="' + esc(o.label) + ': ' + esc(o.choices.map(function (c) { return c.label; }).join(", ")) + '">' + dots + '</span>';
      } else if (o.id === "size") {
        out += '<span class="fact">' + o.choices.length + ' sizes</span>';
      }
    });
    if (p.minQty > 1) out += '<span class="fact">Min ' + p.minQty + ' pcs</span>';
    return out ? '<div class="tile-facts">' + out + '</div>' : "";
  }

  function tileHtml(p, i, showCategory) {
    var action;
    if (p.price === null) {
      action = '<a class="btn btn-ghost" href="' + base + 'contact/index.html?product=' + encodeURIComponent(p.id) + '#quote">Get a quote</a>';
    } else if (hasDialog) {
      action = '<button type="button" class="btn btn-dark" data-order="' + esc(p.id) + '" aria-haspopup="dialog">Add to cart</button>';
    } else {
      action = '<a class="btn btn-dark" href="' + base + 'products/index.html#' + encodeURIComponent(p.id) + '">Add to cart</a>';
    }
    return '<article class="tile" id="' + esc(p.id) + '" data-category="' + esc(p.category) + '">' +
      '<div class="tile-art">' + productVisual(p, i) + (p.popular ? '<span class="tile-flag">Popular</span>' : '') + '</div>' +
      '<div class="tile-body">' +
        (showCategory ? '<span class="cat-tag">' + esc(categoryName(p.category)) + '</span>' : '') +
        '<h3>' + nameHtml(p.name) + '</h3>' +
        '<p>' + esc(p.summary) + '</p>' +
        optionFacts(p) +
        '<div class="tile-foot">' + priceHtml(p) + action + '</div>' +
      '</div></article>';
  }

  /* ---------- Home: popular products; home and about: category links ---------- */
  var popular = document.getElementById("popular-products");
  if (popular) {
    popular.innerHTML = products.filter(function (p) { return p.popular; })
      .map(function (p, i) { return tileHtml(p, i, true); }).join("");
  }

  var catList = document.getElementById("category-links");
  if (catList) {
    var sample = { tshirts: "photo-tshirt", mugs: "photo-mug", frames: "tabletop-frame", caps: "logo-cap" };
    catList.innerHTML = categories.map(function (c, i) {
      var p = lib.findProduct(products, sample[c.id]) || products[0];
      var count = products.filter(function (x) { return x.category === c.id; }).length;
      return '<li><a href="' + base + 'products/index.html?category=' + c.id + '">' + art.render(p.art, i, esc(c.name)) +
        '<div><strong>' + esc(c.name) + '</strong><span>' + count + ' products</span></div></a></li>';
    }).join("");
  }

  /* ---------- Products page: search, filter and grouped catalogue ---------- */
  var grid = document.getElementById("catalogue");
  var searchInput = document.getElementById("product-search");
  var filterBox = document.getElementById("category-filters");
  var emptyState = document.getElementById("catalogue-empty");
  var resultCount = document.getElementById("result-count");
  var activeCategory = "all";

  function groupHtml(cat, list, startIndex) {
    return '<section class="cat-group" id="cat-' + cat.id + '" aria-labelledby="cat-' + cat.id + '-h">' +
      '<header class="cat-head"><div><h2 id="cat-' + cat.id + '-h">' + esc(cat.name) + '</h2><p>' + esc(cat.blurb || "") + '</p></div>' +
      '<span class="cat-count">' + list.length + (list.length === 1 ? ' product' : ' products') + '</span></header>' +
      '<div class="tiles">' + list.map(function (p, i) { return tileHtml(p, startIndex + i, false); }).join("") + '</div></section>';
  }

  function renderCatalogue() {
    if (!grid) return;
    var q = (searchInput ? searchInput.value : "").trim().toLowerCase();
    var list = products.filter(function (p) {
      var inCat = activeCategory === "all" || p.category === activeCategory;
      var text = (p.name + " " + p.summary + " " + categoryName(p.category)).toLowerCase();
      return inCat && (!q || text.indexOf(q) !== -1);
    });
    if (q) {
      // Search results as one flat grid, labelled with their category.
      grid.innerHTML = '<div class="tiles">' + list.map(function (p, i) { return tileHtml(p, i, true); }).join("") + '</div>';
    } else {
      var shown = activeCategory === "all" ? categories : categories.filter(function (c) { return c.id === activeCategory; });
      var n = 0;
      grid.innerHTML = shown.map(function (c) {
        var items = list.filter(function (p) { return p.category === c.id; });
        var html = items.length ? groupHtml(c, items, n) : "";
        n += items.length;
        return html;
      }).join("");
    }
    if (emptyState) emptyState.hidden = list.length > 0;
    if (resultCount) resultCount.textContent = list.length + (list.length === 1 ? " product" : " products");
  }

  function setActiveFilter(id) {
    activeCategory = id;
    if (!filterBox) return;
    filterBox.querySelectorAll("[data-filter]").forEach(function (x) {
      x.setAttribute("aria-pressed", x.getAttribute("data-filter") === id ? "true" : "false");
    });
  }

  if (grid) {
    var params = new URLSearchParams(window.location.search);
    var requested = params.get("category");
    if (requested && categoryById(requested)) activeCategory = requested;

    if (filterBox) {
      var all = [{ id: "all", name: "All" }].concat(categories);
      filterBox.innerHTML = all.map(function (c) {
        var count = c.id === "all" ? products.length : products.filter(function (p) { return p.category === c.id; }).length;
        return '<button type="button" data-filter="' + c.id + '" aria-pressed="' + (c.id === activeCategory) + '">' + esc(c.name) + ' <span>' + count + '</span></button>';
      }).join("");
      filterBox.addEventListener("click", function (e) {
        var b = e.target.closest("[data-filter]");
        if (!b) return;
        setActiveFilter(b.getAttribute("data-filter"));
        renderCatalogue();
      });
    }
    if (searchInput) searchInput.addEventListener("input", renderCatalogue);
    var clear = document.getElementById("clear-search");
    if (clear) clear.addEventListener("click", function () {
      searchInput.value = "";
      setActiveFilter("all");
      renderCatalogue();
      searchInput.focus();
    });
    renderCatalogue();
  }

  var notice = document.getElementById("price-notice");
  if (notice && !cfg.pricesConfirmed) notice.hidden = false;

  /* ---------- Options dialog: choose options, then add to cart ---------- */
  var dialog = document.getElementById("order-dialog");
  if (!dialog) return;

  var state = null;
  var ICON_TICK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 12.5 4 4L18 8"/></svg>';

  function selectionSummary() {
    var p = state.product;
    return p.options.map(function (o) { return state.selections[o.id]; }).filter(Boolean).join(" · ");
  }

  // Redraws the product picture with the current choices. `animate` adds a short pop
  // so the customer notices what changed.
  function renderPreview(animate) {
    var p = state.product;
    var stage = dialog.querySelector(".art-stage");
    var caption = dialog.querySelector(".art-caption");
    if (!stage) return;
    stage.innerHTML = productVisual(p, products.indexOf(p), state.selections);
    caption.textContent = selectionSummary() || "Choose your options";
    if (animate) {
      stage.classList.remove("pop");
      void stage.offsetWidth;
      stage.classList.add("pop");
    }
  }

  function openOrder(productId, trigger) {
    var p = lib.findProduct(products, productId);
    if (!p || p.price === null) return;
    var selections = {};
    // Sizes are left unselected so nobody orders the wrong size by default.
    p.options.forEach(function (o) { if (o.id !== "size") selections[o.id] = o.choices[0].label; });
    state = { product: p, selections: selections, qty: p.minQty || 1, trigger: trigger };
    dialog.querySelector(".dialog-art").innerHTML =
      '<div class="art-stage" aria-hidden="true"></div>' +
      '<p class="art-caption" aria-live="polite"></p>' +
      '<p class="art-details">' + esc(p.details) + '</p>' +
      '<p class="art-note">Illustration only. We send a real preview of your design on WhatsApp.</p>';
    renderPreview(false);
    showOptions();
    dialog.showModal();
  }

  function main() { return dialog.querySelector(".dialog-main"); }

  function currentCalc() {
    return lib.calculateOrder(products, state.product.id, state.selections, state.qty);
  }

  function chipHtml(o, c) {
    var checked = state.selections[o.id] === c.label ? " checked" : "";
    var hex = COLOUR_OPTIONS[o.id] ? art.colourFor(c.label) : null;
    return '<label><input type="radio" name="opt-' + esc(o.id) + '" value="' + esc(c.label) + '" data-opt="' + esc(o.id) + '"' + checked + '>' +
      '<span>' + (hex ? '<i class="dot" style="background:' + hex + '"></i>' : '') + esc(c.label) +
      (c.add ? ' <small>+' + esc(lib.formatINR(c.add)) + '</small>' : '') + '</span></label>';
  }

  function showOptions() {
    var p = state.product;
    var html = '<h2 id="order-title">' + nameHtml(p.name) + '</h2>' +
      '<p class="dialog-price">' + priceHtml(p) + '</p>';
    p.options.forEach(function (o) {
      html += '<fieldset class="choice-group"><legend>' + esc(o.label) +
        (o.id === "size" ? ' <span class="optional">(required)</span>' : '') + '</legend><div class="choices">';
      o.choices.forEach(function (c) { html += chipHtml(o, c); });
      html += '</div></fieldset>';
    });
    html += '<div class="field"><label for="order-qty">Quantity</label>' +
      '<div class="qty"><button type="button" data-qty="-1" aria-label="Decrease quantity">−</button>' +
      '<input id="order-qty" type="number" inputmode="numeric" min="' + (p.minQty || 1) + '" max="500" value="' + state.qty + '">' +
      '<button type="button" data-qty="1" aria-label="Increase quantity">+</button></div>' +
      '</div>' +
      '<table class="summary"><tr class="total"><td>Total</td><td data-total></td></tr></table>' +
      '<p class="field-error" id="qty-error" role="alert"></p>' +
      '<button type="button" class="btn btn-primary btn-block" data-add>' + ICON_BAG + 'Add to cart</button>' +
      '<p class="small muted dialog-hint">Add as many products as you like, then send them together from your cart.</p>';
    main().innerHTML = html;
    updateTotal();
    renderPreview(false);

    main().querySelectorAll("[data-opt]").forEach(function (input) {
      input.addEventListener("change", function () {
        state.selections[input.getAttribute("data-opt")] = input.value;
        updateTotal();
        renderPreview(true);
      });
    });
    var qtyInput = main().querySelector("#order-qty");
    qtyInput.addEventListener("input", function () { state.qty = parseInt(qtyInput.value, 10) || 0; updateTotal(); });
    main().querySelectorAll("[data-qty]").forEach(function (b) {
      b.addEventListener("click", function () {
        var next = Math.min(500, Math.max(p.minQty || 1, (parseInt(qtyInput.value, 10) || 0) + Number(b.getAttribute("data-qty"))));
        qtyInput.value = next; state.qty = next; updateTotal();
      });
    });
    main().querySelector("[data-add]").addEventListener("click", function () {
      var calc = currentCalc();
      if (!calc.ok) {
        main().querySelector("#qty-error").textContent = calc.error;
        var missing = p.options.filter(function (o) { return !state.selections[o.id]; })[0];
        if (missing) main().querySelector('[data-opt="' + missing.id + '"]').focus(); else qtyInput.focus();
        return;
      }
      if (!window.PrintixCart) return;
      var cart = window.PrintixCart.add(p.id, state.selections, calc.qty);
      showAdded(calc, cart);
    });
  }

  function updateTotal() {
    var calc = currentCalc();
    var cell = main().querySelector("[data-total]");
    var err = main().querySelector("#qty-error");
    if (calc.ok) {
      cell.textContent = lib.formatINR(calc.total);
      err.textContent = "";
    } else {
      cell.textContent = Object.keys(state.selections).length < state.product.options.length ? "Choose a size" : "–";
    }
  }

  function showAdded(calc, cart) {
    var opts = calc.lines.map(function (l) { return l.value; }).join(" · ");
    main().innerHTML =
      '<div class="added">' +
        '<span class="added-tick">' + ICON_TICK + '</span>' +
        '<h2 id="order-title">Added to your cart</h2>' +
        '<p class="added-line"><strong>' + esc(state.product.name) + '</strong>' +
          (opts ? '<span>' + esc(opts) + '</span>' : '') +
          '<span>Qty ' + calc.qty + ' · ' + esc(lib.formatINR(calc.total)) + '</span></p>' +
        '<div class="added-cart"><span>Cart: ' + cart.count + (cart.count === 1 ? ' item' : ' items') + '</span><strong>' + esc(lib.formatINR(cart.total)) + '</strong></div>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" data-view-cart>' + ICON_BAG + 'View cart and send</button>' +
          '<button type="button" class="btn btn-ghost" data-keep>Keep shopping</button>' +
        '</div>' +
      '</div>';
    main().querySelector("[data-view-cart]").addEventListener("click", function () {
      state.trigger = null;
      dialog.close();
      window.PrintixCart.open(document.querySelector("[data-cart-open]"));
    });
    main().querySelector("[data-keep]").addEventListener("click", function () { dialog.close(); });
    main().querySelector("[data-view-cart]").focus();
  }

  var ICON_BAG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>';

  function closeOrder() {
    dialog.close();
  }

  dialog.addEventListener("close", function () {
    if (state && state.trigger && document.body.contains(state.trigger)) state.trigger.focus();
  });
  dialog.querySelector(".dialog-close").addEventListener("click", closeOrder);
  dialog.addEventListener("click", function (e) { if (e.target === dialog) closeOrder(); });

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-order]");
    if (!b) return;
    openOrder(b.getAttribute("data-order"), b);
  });

  // Links like products/index.html#photo-tshirt open that product directly.
  var initial = location.hash.slice(1);
  if (initial && lib.findProduct(products, initial)) {
    var target = lib.findProduct(products, initial);
    if (target.price !== null) openOrder(initial, null);
  }
})();
