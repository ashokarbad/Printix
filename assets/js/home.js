/* Printix — home page hero: four products laid out like a press sheet with crop marks. */
(function () {
  "use strict";
  var art = window.PrintixArt;
  if (!art) return;

  function decorative(svgHtml) {
    return svgHtml.replace('role="img"', 'aria-hidden="true"').replace(/ aria-label="[^"]*"/, "");
  }

  var sheet = document.getElementById("hero-sheet");
  if (sheet) {
    var items = [
      { kind: "tee", body: "#FFFFFF" },
      { kind: "mug", body: "#FFFFFF" },
      { kind: "frame" },
      { kind: "cap", body: "#13204A" }
    ];
    sheet.innerHTML = items.map(function (a, i) {
      return '<div class="crop">' + decorative(art.render(a, i, "")) + "</div>";
    }).join("");
  }

  var thumb = document.getElementById("hero-preview-thumb");
  if (thumb) thumb.innerHTML = decorative(art.render({ kind: "mug", body: "#FFFFFF" }, 1, ""));

  // Price tag comes from the catalogue so it never disagrees with the products page.
  var tag = document.getElementById("hero-price");
  var lib = window.PrintixLib;
  var mug = lib && window.PRINTIX_PRODUCTS ? lib.findProduct(window.PRINTIX_PRODUCTS, "photo-mug") : null;
  if (tag && mug && typeof mug.price === "number") {
    tag.textContent = "Photo mugs from " + lib.formatINR(mug.price);
    tag.hidden = false;
  }
})();
