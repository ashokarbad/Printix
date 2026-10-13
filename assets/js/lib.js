/*
 * Printix — pricing and WhatsApp helpers.
 * Pure functions with no page access, so they can be unit tested (see tests/).
 */
(function (root) {
  "use strict";

  function formatINR(amount) {
    var n = Number(amount);
    if (!isFinite(n)) return "";
    var hasPaise = Math.round(n * 100) % 100 !== 0;
    return "₹" + n.toLocaleString("en-IN", {
      minimumFractionDigits: hasPaise ? 2 : 0,
      maximumFractionDigits: 2
    });
  }

  function findProduct(products, id) {
    for (var i = 0; i < products.length; i++) if (products[i].id === id) return products[i];
    return null;
  }

  /*
   * Works out the price from the catalogue only. Selections are option labels;
   * anything not in the catalogue is rejected rather than trusted.
   * Returns { ok, unit, total, qty, lines, error }.
   */
  function calculateOrder(products, productId, selections, quantity) {
    var product = findProduct(products, productId);
    if (!product) return { ok: false, error: "This product is no longer available." };
    if (product.price === null || typeof product.price !== "number") {
      return { ok: false, error: "This product is priced on request." };
    }
    var qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < (product.minQty || 1) || qty > 500) {
      return { ok: false, error: "Enter a quantity between " + (product.minQty || 1) + " and 500." };
    }
    var unit = product.price;
    var lines = [];
    var chosen = selections || {};
    for (var i = 0; i < product.options.length; i++) {
      var opt = product.options[i];
      var label = chosen[opt.id];
      var match = null;
      for (var j = 0; j < opt.choices.length; j++) {
        if (opt.choices[j].label === label) match = opt.choices[j];
      }
      if (!match) return { ok: false, error: "Choose a " + opt.label.toLowerCase() + "." };
      unit += match.add;
      lines.push({ label: opt.label, value: match.label, add: match.add });
    }
    return { ok: true, product: product, unit: unit, qty: qty, total: unit * qty, lines: lines };
  }

  /* ---------- Cart ---------- */

  var CART_MAX_LINES = 30;

  // Same product with the same choices counts as one line.
  function cartKey(productId, selections) {
    var sel = selections || {};
    return productId + "|" + Object.keys(sel).sort().map(function (k) { return k + "=" + sel[k]; }).join("&");
  }

  /*
   * Rebuilds a cart from saved data using the catalogue only: prices are always
   * recalculated, and lines whose product or options no longer exist are dropped.
   * Returns { lines: [{ productId, selections, qty, calc }], total, count, dropped }.
   */
  function priceCart(products, saved) {
    var lines = [], dropped = 0, seen = {};
    (Array.isArray(saved) ? saved : []).forEach(function (raw) {
      if (!raw || typeof raw.productId !== "string" || lines.length >= CART_MAX_LINES) { dropped++; return; }
      var sel = {};
      if (raw.selections && typeof raw.selections === "object") {
        Object.keys(raw.selections).forEach(function (k) {
          if (typeof raw.selections[k] === "string") sel[k] = raw.selections[k];
        });
      }
      var calc = calculateOrder(products, raw.productId, sel, raw.qty);
      if (!calc.ok) { dropped++; return; }
      var key = cartKey(raw.productId, sel);
      if (seen[key] !== undefined) {
        var line = lines[seen[key]];
        var merged = calculateOrder(products, raw.productId, sel, Math.min(500, line.qty + calc.qty));
        if (merged.ok) { line.qty = merged.qty; line.calc = merged; }
        return;
      }
      seen[key] = lines.length;
      lines.push({ productId: raw.productId, selections: sel, qty: calc.qty, calc: calc });
    });
    var total = 0, count = 0;
    lines.forEach(function (l) { total += l.calc.total; count += l.qty; });
    return { lines: lines, total: total, count: count, dropped: dropped };
  }

  /* ---------- WhatsApp messages ----------
   * Laid out for reading on a phone: WhatsApp shows *text* in bold and _text_ in italics.
   * One fact per line, bold headings, a divider before the total.
   */
  var WAVE = "👋", CART = "🛒", PERSON = "👤", CLIP = "📎", NOTE = "📝";
  var DIVIDER = new Array(15).join("─");

  // Keeps customer text from accidentally switching WhatsApp formatting on or off.
  function plain(text) {
    return String(text == null ? "" : text).replace(/[*_~`]/g, "").trim();
  }

  function prettyMobile(m) {
    return /^\d{10}$/.test(m || "") ? m.slice(0, 5) + " " + m.slice(5) : (m || "");
  }

  function detailsBlock(c) {
    var out = [PERSON + " *My details*"];
    if (c.name) out.push("Name: " + plain(c.name));
    if (c.phone) out.push("Mobile: " + prettyMobile(c.phone));
    if (c.email) out.push("Email: " + plain(c.email));
    if (c.notes) out.push("Notes: " + plain(c.notes));
    return out;
  }

  // The WhatsApp message for a whole cart.
  function cartMessage(cart, customer, options) {
    var c = customer || {};
    var opts = options || {};
    var itemWord = cart.count === 1 ? "item" : "items";
    var out = [
      "Hi Printix " + WAVE,
      "I'd like to place an order from your website.",
      "",
      CART + " *Order: " + cart.count + " " + itemWord + "*",
      ""
    ];
    cart.lines.forEach(function (l, i) {
      out.push("*" + (i + 1) + ". " + l.calc.product.name + "*");
      l.calc.lines.forEach(function (o) { out.push("• " + o.label + ": " + o.value); });
      out.push("• Qty: " + l.qty + " × " + formatINR(l.calc.unit) + " = *" + formatINR(l.calc.total) + "*");
      out.push("");
    });
    out.push(DIVIDER);
    out.push("*Total: " + formatINR(cart.total) + "*");
    if (!opts.pricesConfirmed) out.push("_Website prices. Please confirm the final price._");
    out.push("");
    out = out.concat(detailsBlock(c));
    out.push("", CLIP + " I'll send my photos or designs in this chat.");
    return out.join("\n");
  }

  // The WhatsApp message for a quote request from the contact page.
  function quoteMessage(q) {
    var out = [
      "Hi Printix " + WAVE,
      "I'd like a quote, please.",
      "",
      NOTE + " *Quote request*",
      "• Product: " + plain(q.product),
      "• Quantity: " + q.qty
    ];
    if (q.specs) out.push("• Size / colour / finish: " + plain(q.specs));
    if (q.details) out.push("• Details: " + plain(q.details));
    out.push("");
    out = out.concat(detailsBlock({ name: q.name, phone: q.phone, email: q.email }));
    out.push("", CLIP + " I'll send my design or logo in this chat.");
    return out.join("\n");
  }

  function whatsappLink(number, text) {
    var digits = String(number || "").replace(/\D/g, "");
    return "https://wa.me/" + digits + (text ? "?text=" + encodeURIComponent(text) : "");
  }

  /* Indian mobile: optional +91 / 0, then 10 digits starting 6–9. */
  function normalizeIndianMobile(input) {
    var digits = String(input || "").replace(/\D/g, "");
    if (digits.length === 12 && digits.indexOf("91") === 0) digits = digits.slice(2);
    if (digits.length === 11 && digits.charAt(0) === "0") digits = digits.slice(1);
    return /^[6-9]\d{9}$/.test(digits) ? digits : null;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
  }

  var api = {
    formatINR: formatINR,
    findProduct: findProduct,
    calculateOrder: calculateOrder,
    cartKey: cartKey,
    priceCart: priceCart,
    cartMessage: cartMessage,
    quoteMessage: quoteMessage,
    whatsappLink: whatsappLink,
    normalizeIndianMobile: normalizeIndianMobile,
    isValidEmail: isValidEmail
  };

  root.PrintixLib = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
