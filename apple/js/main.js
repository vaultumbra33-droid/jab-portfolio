/* main.js — Apple-style: tilt del título del proyecto, reveal al scroll, nav activa */
(function () {
  "use strict";

  /* ================= TILT 3D en cards y media de proyectos ================= */
  document.querySelectorAll("[class~='tilt'], .glass-card, .project").forEach(function (el) {
    if (el.dataset.tiltBound) return;
    el.dataset.tiltBound = "1";
    el.addEventListener("mousemove", function (e) {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      if (el.classList.contains("project")) {
        el.style.transform =
          "perspective(1200px) rotateY(" + (px * 3.5).toFixed(2) + "deg) rotateX(" + (-py * 3.5).toFixed(2) + "deg) translateY(-6px)";
        const flot = el.querySelector(".p-float");
        if (flot) flot.style.transform =
          "translateX(" + (px * 26).toFixed(1) + "px) translateY(" + (py * 18).toFixed(1) + "px) translateZ(48px)";
      } else {
        el.style.transform =
          "perspective(900px) rotateY(" + (px * 6).toFixed(2) + "deg) rotateX(" + (-py * 6).toFixed(2) + "deg) translateY(-6px)";
      }
    });
    el.addEventListener("mouseleave", function () {
      el.style.transform = "";
      const flot = el.querySelector(".p-float");
      if (flot) flot.style.transform = "";
    });
  });

  /* ================= REVEAL al scroll ================= */
  if ("IntersectionObserver" in window) {
    const revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          revealIO.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll(".reveal").forEach(function (el) {
      revealIO.observe(el);
    });

    /* ================= NAV ACTIVA ================= */
    const navLinks = document.querySelectorAll(".nav-links a:not(.pill)");
    const navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (a) {
            a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id);
          });
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });

    document.querySelectorAll("section[id]").forEach(function (s) {
      navIO.observe(s);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("visible");
    });
  }

  /* ================= Parallax sutil del hero al scrollear ================= */
  const hero = document.querySelector(".hero");
  window.addEventListener("scroll", function () {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      hero.style.transform = "translateY(" + (y * 0.25).toFixed(1) + "px)";
      hero.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.85)));
    }
  }, { passive: true });
})();
