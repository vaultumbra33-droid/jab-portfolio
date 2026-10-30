/* main-en.js — English terminal typing + matrix rain + tilt + reveal (EN version) */
(function () {
  "use strict";

  /* ================= TERMINAL ================= */
  const out = document.getElementById("termOut");
  const typeTarget = document.getElementById("typeTarget");

  const lines = [
    { html: '<span class="prompt-user">jab@core</span><span class="accent">:</span><span class="prompt-path">~</span><span class="dollar">$</span> <span class="cmd">whoami</span>' },
    { html: '<span class="out-cyan">jesus-antonio-bustamante-araujo</span> <span class="out-muted">— full stack · cybersecurity · hardware</span>', delay: 300 },
    { html: '<span class="prompt-user">jab@core</span><span class="accent">:</span><span class="prompt-path">~</span><span class="dollar">$</span> <span class="cmd">cat skills.txt</span>' },
    { html: '<span class="out-green">  ■ software</span>   <span class="out-muted">→ Node · React · Python · PHP · MySQL · Docker</span>', delay: 120 },
    { html: '<span class="out-green">  ■ security</span>  <span class="out-muted">→ Kali · Metasploit · Burp · pfSense · IDS/IPS</span>', delay: 120 },
    { html: '<span class="out-green">  ■ hardware</span>   <span class="out-muted">→ Drones UAV · ESP32 · RFID · FDM/resin 3D</span>', delay: 120 },
    { html: '<span class="out-green">  ■ telecom</span>    <span class="out-muted">→ Mikrotik · VPN · point-to-point links</span>', delay: 120 },
    { html: '<span class="out-green">  ■ local_ai</span>   <span class="out-muted">→ Ollama · self-hosted LLMs · RAG · Whisper</span>', delay: 120 },
    { html: '<span class="prompt-user">jab@core</span><span class="accent">:</span><span class="prompt-path">~</span><span class="dollar">$</span> <span class="cmd">uptime --engagement</span>' },
    { html: '<span class="out-purple">  remote · freelance · project-based · high pressure — relocation OK</span>', delay: 350 },
    { html: '<span class="out-muted">  # scroll to see shipped projects ↓</span>', delay: 500 },
  ];

  function addLine(html) {
    const span = document.createElement("span");
    span.className = "line";
    span.innerHTML = html;
    out.appendChild(span);
  }

  const commands = ["./boot jab.core", "drone_uplink --launch", "gcc -o(product) ideas.c", "nmap -sV company.com"];
  let ci = 0;
  function typeLoop() {
    const cmd = commands[ci % commands.length];
    let i = 0;
    typeTarget.textContent = "";
    function tick() {
      if (i < cmd.length) {
        typeTarget.textContent = cmd.slice(0, ++i);
        setTimeout(tick, 55 + Math.random() * 60);
      } else {
        setTimeout(function () {
          addLine('<span class="prompt-user">jab@core</span><span class="accent">:</span><span class="prompt-path">~</span><span class="dollar">$</span> <span class="cmd">' + cmd.replace(/</g, "&lt;") + '</span>');
          ci++;
          setTimeout(typeLoop, 600);
        }, 1400);
      }
    }
    tick();
  }

  function boot() {
    let idx = 0;
    function next() {
      if (idx >= lines.length) { setTimeout(typeLoop, 900); return; }
      const item = lines[idx++];
      addLine(item.html);
      setTimeout(next, item.delay || 420);
    }
    next();
  }

  const termEl = document.querySelector(".terminal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { boot(); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(termEl);
  } else {
    boot();
  }

  /* ================= MATRIX RAIN ================= */
  const rainCanvas = document.getElementById("rain");
  if (rainCanvas) {
    const ctx = rainCanvas.getContext("2d");
    let cols, drops;
    const fontSize = 14;
    const glyphs = "01アイウエオ<>{}[]$#%;/*+=ア".split("");
    function setup() {
      rainCanvas.width = window.innerWidth;
      rainCanvas.height = window.innerHeight;
      cols = Math.floor(rainCanvas.width / fontSize);
      drops = [];
      for (let i = 0; i < cols; i++) drops.push(Math.random() * -100);
    }
    setup();
    window.addEventListener("resize", setup);
    setInterval(function () {
      ctx.fillStyle = "rgba(11,13,18,0.08)";
      ctx.fillRect(0, 0, rainCanvas.width, rainCanvas.height);
      ctx.fillStyle = "#50fa7b";
      ctx.font = fontSize + "px monospace";
      for (let i = 0; i < cols; i++) {
        ctx.fillText(glyphs[(Math.random() * glyphs.length) | 0], i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > rainCanvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }, 66);
  }

  /* ================= TILT 3D ================= */
  const MAX_TILT = 8;
  const tilts = document.querySelectorAll("[data-tilt]");
  for (const el of tilts) {
    el.addEventListener("mousemove", function (e) {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = "perspective(900px) rotateY(" + (px * MAX_TILT) + "deg) rotateX(" + (-py * MAX_TILT) + "deg) scale(1.015)";
    });
    el.addEventListener("mouseleave", function () {
      el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
    });
  }

  /* ================= REVEAL + ACTIVE NAV ================= */
  if ("IntersectionObserver" in window) {
    const revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          revealIO.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    const reveals = document.querySelectorAll(".reveal");
    for (const el of reveals) revealIO.observe(el);

    const navLinks = document.querySelectorAll(".topbar-nav a:not(.lang-switch)");
    const navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (a) {
            a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id);
          });
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    const sections = document.querySelectorAll("section[id]");
    for (const s of sections) navIO.observe(s);
  } else {
    const reveals = document.querySelectorAll(".reveal");
    for (const el of reveals) el.classList.add("visible");
  }
})();
