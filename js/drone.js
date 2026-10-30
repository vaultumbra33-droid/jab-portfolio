/* drone.js — drone.core flight_sim: pilota un dron wireframe en 3D,
   esquiva firewalls rojos. HUD estilo terminal. */
(function () {
  "use strict";

  const modal   = document.getElementById("droneModal");
  const btnOpen = document.getElementById("droneLauncher")
               || document.querySelector(".drone-launch");
  const btnClose   = document.getElementById("droneClose");
  const btnStart   = document.getElementById("droneStart");
  const btnRestart = document.getElementById("droneRestart");
  const canvas  = document.getElementById("droneCanvas");
  const hudScore = document.getElementById("hudScore");
  const hudInt   = document.getElementById("hudInt");
  const hudSpd   = document.getElementById("hudSpd");
  const intro    = document.getElementById("droneIntro");
  const panic    = document.getElementById("dronePanic");
  const panicScore = document.getElementById("panicScore");

  const TWO = 0x50fa7b, RED = 0xff5555, CYAN = 0x8be9fd, YELLOW = 0xf1fa8c;

  var scene, camera, renderer, drone, rotors = [], obstacles = [], grids = [];
  var started = false, dead = false;
  var score = 0, integrity = 100, speed = 1;
  var target = { x: 0, y: 0 }, pos = { x: 0, y: 0 };
  var scrollZ = 0;
  var raf = 0, lastT = 0;

  /* ---------- abrir / cerrar ---------- */
  function open() {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    if (!scene) build();
    if (started) { // pausa al salir hasta volver
      lastT = 0;
      loop(performance.now());
    } else {
      intro.hidden = false;
      renderIdle();
    }
  }
  function close() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    cancelAnimationFrame(raf);
    raf = 0;
  }
  if (btnOpen) btnOpen.addEventListener("click", function (e) { e.preventDefault(); open(); });
  if (btnClose) btnClose.addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("open")) close();
  });

  /* ---------- construcción de la escena ---------- */
  function build() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050a08, 30, 150);
    camera = new THREE.PerspectiveCamera(70, 1, 0.1, 300);
    camera.position.set(0, 0, 8);

    renderer = new THREE.WebGLRenderer({
      canvas: canvas, antialias: true, alpha: true,
    });
    renderer.setClearColor(0x050a08, 1);
    resize();
    window.addEventListener("resize", resize);

    /* túnel: grids suelo/techo/paredes */
    var gridMat = new THREE.GridHelper(40, 20, CYAN, 0x1d3a2e);
    var floor = new THREE.GridHelper(200, 50, TWO, 0x12331f);
    floor.position.y = -7;
    var ceil = floor.clone();
    ceil.position.y = 7;
    var wallL = new THREE.GridHelper(200, 50, 0x1d5a35, 0x0f2419);
    wallL.rotation.z = Math.PI / 2;
    wallL.position.x = -12;
    var wallR = wallL.clone();
    wallR.position.x = 12;
    scene.add(floor); scene.add(ceil); scene.add(wallL); scene.add(wallR);
    grids = [floor, ceil, wallL, wallR];

    /* luces mínimas (wireframe no necesita, pero points sí) */
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    /* ---- el dron del jugador ---- */
    drone = new THREE.Group();
    var bodyMat = new THREE.MeshBasicMaterial({ color: TWO, wireframe: true });
    var body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.28, 1.1), bodyMat);
    drone.add(body);
    var dome = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), bodyMat);
    dome.position.y = 0.25;
    drone.add(dome);

    var rotorMat = new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true });
    var armPos = [[0.75, 0.75], [-0.75, 0.75], [0.75, -0.75], [-0.75, -0.75]];
    for (var i = 0; i < 4; i++) {
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.08), bodyMat);
      arm.position.set(armPos[i][0] * 0.75, 0.12, armPos[i][1] * 0.75);
      arm.lookAt(armPos[i][0], 0.12, armPos[i][1]);
      drone.add(arm);
      var rotor = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 4, 12), rotorMat);
      rotor.rotation.x = Math.PI / 2;
      rotor.position.set(armPos[i][0] * 1.05, 0.18, armPos[i][1] * 1.05);
      drone.add(rotor);
      rotors.push(rotor);
    }
    drone.position.set(0, 0, 2);
    scene.add(drone);

    /* ---- obstáculos: firewalls rojos ---- */
    var obsMat = new THREE.MeshBasicMaterial({ color: RED, wireframe: true });
    for (var o = 0; o < 10; o++) {
      var size = 2 + Math.random() * 2.5;
      var box = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), obsMat);
      respawn(box, -(o * 24) - 40, true);
      scene.add(box);
      obstacles.push(box);
    }

    /* control por mouse / flechas / dedo (touch) */
    window.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", onKeys, { passive: false });
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    canvas.addEventListener("touchmove", onTouch, { passive: false });
    canvas.addEventListener("click", function () { if (dead) return; });

    if (btnStart) btnStart.addEventListener("click", startGame);
    if (btnRestart) btnRestart.addEventListener("click", startGame);
  }

  /* límites del corredor de vuelo */
  function clampTarget() {
    target.x = Math.max(-10.5, Math.min(10.5, target.x));
    target.y = Math.max(-6.3, Math.min(6.3, target.y));
  }

  function resize() {
    if (!renderer) return;
    var w = canvas.clientWidth || modal.clientWidth;
    var h = canvas.clientHeight || modal.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  }

  function onMove(e) {
    if (!modal.classList.contains("open") || dead || !started) return;
    var r = canvas.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 2.2;
    target.y = -(e.clientY - r.top) / r.height * 5.5 + 2.75;
    clampTarget();
  }
  function onTouch(e) {
    if (!modal.classList.contains("open") || dead || !started) return;
    if (!e.touches || !e.touches.length) return;
    e.preventDefault();
    var t = e.touches[0];
    var r = canvas.getBoundingClientRect();
    target.x = ((t.clientX - r.left) / r.width - 0.5) * 2.2;
    target.y = -(t.clientY - r.top) / r.height * 5.5 + 2.75;
    clampTarget();
  }
  function onKeys(e) {
    if (!modal.classList.contains("open")) return;
    var k = e.key;
    if (k === "ArrowLeft")  { target.x -= 0.8; }
    if (k === "ArrowRight") { target.x += 0.8; }
    if (k === "ArrowUp")    { target.y += 0.6; }
    if (k === "ArrowDown")  { target.y -= 0.6; }
    if (k.indexOf("Arrow") !== -1) { e.preventDefault(); }
    target.x = Math.max(-10.5, Math.min(10.5, target.x));
    target.y = Math.max(-6.3, Math.min(6.3, target.y));
  }

  function respawn(box, zrand, init) {
    var s = box.geometry.parameters.width;
    box.position.x = THREE.MathUtils.randFloat(-8, 8);
    box.position.y = THREE.MathUtils.randFloat(-4.5, 4.5);
    box.position.z = (init === true ? zrand : -170) - Math.random() * 40;
    box.userData = {
      vz: 34 + Math.random() * 16,
      spin: (Math.random() - 0.5) * 0.6,
      gw: s,
    };
  }

  function startGame() {
    score = 0; integrity = 100; speed = 1; dead = false; started = true;
    target = { x: 0, y: 0 }; pos = { x: 0, y: 0 };
    panic.hidden = true;
    intro.hidden = true;
    for (var i = 0; i < obstacles.length; i++) respawn(obstacles[i], -(i * 26) - 60, true);
    lastT = 0;
    cancelAnimationFrame(raf);
    loop(performance.now());
  }

  function kill() {
    dead = true;
    panicScore.textContent = Math.floor(score);
    panic.hidden = false;
  }

  function loop(now) {
    if (!modal.classList.contains("open")) { raf = 0; return; }
    if (!lastT) lastT = now;
    var dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;

    /* velocidad creciente con el score */
    speed = 1 + score / 900;
    scrollZ += dt * 40 * speed;

    /* grids en movimiento hacia la cámara */
    for (var g = 0; g < grids.length; g++) {
      var gr = grids[g];
      gr.position.z = 20 - Math.abs(scrollZ % 8);
    }

    /* mover dron con suavizado + tilt */
    pos.x += (target.x - pos.x) * Math.min(dt * 6, 1);
    pos.y += (target.y - pos.y) * Math.min(dt * 6, 1);
    drone.position.x = pos.x;
    drone.position.y = pos.y;
    drone.rotation.z = (target.x - pos.x) * 0.35;
    drone.rotation.x = (target.y - pos.y) * 0.25;
    for (var r = 0; r < rotors.length; r++) rotors[r].rotation.z += dt * 30;

    /* obstáculos */
    for (var o = 0; o < obstacles.length; o++) {
      var box = obstacles[o];
      box.position.z += dt * box.userData.vz * speed;
      box.rotation.x += dt * box.userData.spin;
      box.rotation.y += dt * box.userData.spin * 0.6;

      /* pasa el obstáculo: +puntos */
      if (box.position.z > 14) {
        respawn(box);
        score += 10;
      }
      /* colisión aproximada con el dron */
      else if (Math.abs(box.position.z - drone.position.z) < box.userData.gw / 2 + 0.6) {
        var dx = Math.abs(box.position.x - drone.position.x);
        var dy = Math.abs(box.position.y - drone.position.y);
        if (dx < box.userData.gw / 2 + 0.5 && dy < box.userData.gw / 2 + 0.5) {
          integrity -= 34;
          respawn(box);
          if (integrity <= 0) { kill(); }
        }
      }
    }

    updateHud();
    renderScene();

    if (!dead) {
      raf = requestAnimationFrame(loop);
    } else {
      renderScene();
      raf = 0;
    }
  }

  function renderIdle() {
    /* fondo animado aún sin arrancar */
    scrollZ += 0.2;
    for (var g = 0; g < grids.length; g++) {
      grids[g].position.z = 20 - Math.abs(scrollZ % 8);
    }
    for (var r = 0; r < rotors.length; r++) rotors[r].rotation.z += 0.3;
    renderScene();
    if (modal.classList.contains("open") && !started) {
      raf = requestAnimationFrame(renderIdle);
    }
  }

  function renderScene() {
    camera.lookAt(drone.position.x * 0.3, drone.position.y * 0.3, -40);
    renderer.render(scene, camera);
  }

  function clampInt(v) { return Math.max(0, Math.round(v)); }

  function updateHud() {
    hudScore.textContent = String(Math.floor(score)).padStart(4, "0");
    hudInt.textContent = clampInt(integrity) + "%";
    hudInt.className = integrity > 66 ? "ok" : integrity > 33 ? "warn" : "bad";
    hudSpd.textContent = speed.toFixed(1) + "x";
  }
})();
