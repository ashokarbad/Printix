/* Printix — highlights the policy section you're reading in the side navigation. */
(function () {
  "use strict";
  var links = document.querySelectorAll("[data-spy]");
  if (!links.length || !("IntersectionObserver" in window)) return;

  function setActive(id) {
    links.forEach(function (a) {
      if (a.getAttribute("data-spy") === id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: "-30% 0px -60% 0px" });

  links.forEach(function (a) {
    var section = document.getElementById(a.getAttribute("data-spy"));
    if (section) observer.observe(section);
  });
})();
