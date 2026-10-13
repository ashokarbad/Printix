/*
 * Printix — quote request form.
 * GitHub Pages cannot receive form data, so requests are handed to WhatsApp.
 */
(function () {
  "use strict";

  var cfg = window.PRINTIX_CONFIG;
  var lib = window.PrintixLib;
  var ui = window.PrintixUI;
  var products = window.PRINTIX_PRODUCTS;
  var categories = window.PRINTIX_CATEGORIES;

  function setError(field, message) {
    var wrap = field.closest(".field");
    var out = wrap.querySelector(".field-error");
    if (message) { wrap.setAttribute("data-invalid", ""); field.setAttribute("aria-invalid", "true"); }
    else { wrap.removeAttribute("data-invalid"); field.removeAttribute("aria-invalid"); }
    if (out) out.textContent = message || "";
  }

  /* ---------- Quote form ---------- */
  var form = document.getElementById("quote-form");
  if (form) {
    var select = form.querySelector("#q-product");
    var html = '<option value="">Choose a product</option>';
    categories.forEach(function (c) {
      html += '<optgroup label="' + ui.escapeHtml(c.name) + '">';
      products.filter(function (p) { return p.category === c.id; }).forEach(function (p) {
        html += '<option value="' + ui.escapeHtml(p.id) + '">' + ui.escapeHtml(p.name) + '</option>';
      });
      html += '</optgroup>';
    });
    html += '<option value="other">Something else</option>';
    select.innerHTML = html;

    var wanted = new URLSearchParams(location.search).get("product");
    if (wanted && lib.findProduct(products, wanted)) {
      select.value = wanted;
      var p = lib.findProduct(products, wanted);
      if (p.minQty > 1) form.querySelector("#q-qty").value = p.minQty;
    }

    var status = form.querySelector(".form-status");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = ""; status.className = "form-status";
      var f = {
        name: form.querySelector("#q-name"),
        phone: form.querySelector("#q-phone"),
        email: form.querySelector("#q-email"),
        product: select,
        qty: form.querySelector("#q-qty"),
        specs: form.querySelector("#q-specs"),
        message: form.querySelector("#q-message")
      };
      var ok = true;
      if (f.name.value.trim().length < 2) { setError(f.name, "Enter your name."); ok = false; } else setError(f.name, "");
      var mobile = lib.normalizeIndianMobile(f.phone.value);
      if (!mobile) { setError(f.phone, "Enter a 10-digit Indian mobile number."); ok = false; } else setError(f.phone, "");
      if (f.email.value.trim() && !lib.isValidEmail(f.email.value)) { setError(f.email, "Check the email address, or leave it empty."); ok = false; } else setError(f.email, "");
      if (!f.product.value) { setError(f.product, "Choose a product, or pick Something else."); ok = false; } else setError(f.product, "");
      var qty = Number(f.qty.value);
      if (!Number.isInteger(qty) || qty < 1 || qty > 100000) { setError(f.qty, "Enter how many pieces you need."); ok = false; } else setError(f.qty, "");
      if (f.product.value === "other" && f.message.value.trim().length < 5) { setError(f.message, "Tell us what you'd like printed."); ok = false; } else setError(f.message, "");
      if (!ok) {
        var first = form.querySelector("[aria-invalid]");
        if (first) first.focus();
        return;
      }

      var product = lib.findProduct(products, f.product.value);
      var text = lib.quoteMessage({
        product: product ? product.name : "Something else",
        qty: qty,
        specs: f.specs.value.trim(),
        details: f.message.value.trim(),
        name: f.name.value.trim(),
        phone: mobile,
        email: f.email.value.trim()
      });
      var link = lib.whatsappLink(cfg.whatsappNumber, text);
      var win = window.open(link, "_blank");
      if (win) { try { win.opener = null; } catch (err) { /* ignore */ } }
      status.className = "form-status ok";
      status.innerHTML = win === null
        ? 'Your request is ready. <a href="' + ui.escapeHtml(link) + '" target="_blank" rel="noopener">Open WhatsApp to send it</a>.'
        : "WhatsApp has opened with your request. Press send there so it reaches us, then attach your design.";
    });
  }

})();
