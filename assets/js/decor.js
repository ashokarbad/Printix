/*
 * Printix — draws decorative product illustrations into any element with a
 * data-art attribute (used in page headers and section artwork).
 */
(function () {
  "use strict";
  var art = window.PrintixArt;
  if (!art) return;
  document.querySelectorAll("[data-art]").forEach(function (el) {
    var spec;
    try { spec = JSON.parse(el.getAttribute("data-art")); } catch (err) { return; }
    var svg = art.render(spec, Number(el.getAttribute("data-variant")) || 0, "");
    el.innerHTML = svg.replace('role="img"', 'aria-hidden="true"').replace(/ aria-label="[^"]*"/, "");
  });

  // Category jump links on the products page: make sure the group is showing first.
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#cat-"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    if (!document.getElementById(id)) {
      var all = document.querySelector('[data-filter="all"]');
      var search = document.getElementById("product-search");
      if (search && search.value) { search.value = ""; search.dispatchEvent(new Event("input")); }
      if (all) all.click();
    }
  });
})();
