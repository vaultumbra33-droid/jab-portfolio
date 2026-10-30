/* main.js — Hybrid: terminal typing + reveal + tilt proyectos + nav activa */
(function () {
  "use strict";

  /* ================= TERMINAL (Linux) ================= */
  const out = document.getElementById("termOut");
  const lines = [
    { html: '<span class="p">jab@core</span><span class="c">:~$</span> <span>whoami</span>' },
    { html: '<span class="g">Jesús Antonio Bustamante Araujo</span>', delay: 340 },
    { html: '<span class="p">jab@core</span><span class="c">:~$</span> <span>stack --list</span>' },
    { html: '<span style="color:#50fa7b">  ✔ software</span>    <span class="mut">JS · Node · React · Python · PHP · Docker</span>', delay: 140 },
    { html: '<span style="color:#50fa7b">  ✔ seguridad</span>   <span class="mut">Kali · Metasploit · Burp · pfSense</span>', delay: 140 },
    { html: '<span style="color:#50fa7b">  ✔ hardware</span>    <span class="mut">Drones UAV · ESP32 · IoT · FDM/resina 3D</span>', delay: 140 },
    { html: '<span style="color:#50fa7b">  ✔ telecom</span>     <span class="mut">Mikrotik · VPN · enlaces punto a punto</span>', delay: 140 },
    { html: '<span class="p">jab@core</span><span class="c">:~$</span> <span>cat modalidad.txt</span>' },
    { html: '<span class="mut">  Remoto · Freelance · Por proyecto · Alta presión</span>', delay: 360 }
  ];

  function addLine(html) {
    const s = document.createElement("span");
    s.className = "line";
    s.innerHTML = html;
    if (out) out.appendChild(s);
  }

  function boot() {
    let i = 0;
    (function next() {
      if (i >= lines.length) return;
      const item = lines[i++];
      addLine(item.html);
      setTimeout(next, item.delay || 430);
    })();
  }

  const term = document.getElementById("heroTerm");
  if ("IntersectionObserver" in window && term) {
    const io = new IntersectionObserver(function (ents) {
      if (ents[0].isIntersecting) { boot(); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(term);
  } else {
    boot();
  }

  /* ================= TILT en proyectos ================= */
  document.querySelectorAll(".project").forEach(function (el) {
    el.addEventListener("mousemove", function (e) {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = "perspective(1200px) rotateY(" + (px * 3) + "deg) rotateX(" + (-py * 3) + "deg) translateY(-6px)";
      const f = el.querySelector(".p-float");
      if (f) f.style.transform = "translateX(" + (px * 24) + "px) translateY(" + (py * 16) + "px) translateZ(40px)";
    });
    el.addEventListener("mouseleave", function () {
      el.style.transform = "";
      const f = el.querySelector(".p-float");
      if (f) f.style.transform = "";
    });
  });

  /* ================= REVEAL + NAV ACTIVA ================= */
  if ("IntersectionObserver" in window) {
    const revealIO = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          revealIO.unobserve(en.target);
        }
      });
    }, { threshold: 0.14 });
    document.querySelectorAll(".reveal").forEach(function (el) { revealIO.observe(el); });

    const links = document.querySelectorAll(".nav-links a:not(.pill)");
    const navIO = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) {
            a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id);
          });
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    document.querySelectorAll("section[id]").forEach(function (s) { navIO.observe(s); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("visible"); });
  }

  /* Parallax sutil del hero */
  const hero = document.querySelector(".hero");
  if (hero) {
    window.addEventListener("scroll", function () {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        hero.style.transform = "translateY(" + (y * 0.18).toFixed(1) + "px)";
        hero.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.9)));
      }
    }, { passive: true });
  }
})();
