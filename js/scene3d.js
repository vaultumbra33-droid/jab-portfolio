/* scene3d.js — fondo 3D con Three.js: objetos wireframe flotantes + parallax */
(function () {
  const canvas = document.getElementById("bg3d");
  if (!canvas || typeof THREE === "undefined") return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b0d12, 10, 42);

  const camera = new THREE.PerspectiveCamera(
    60, window.innerWidth / window.innerHeight, 0.1, 100
  );
  camera.position.set(0, 0, 14);

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  /* ---- Materiales ---- */
  const green = 0x50fa7b;
  const cyan = 0x8be9fd;
  const purple = 0xbd93f9;

  const matGreen = new THREE.MeshBasicMaterial({
    color: green, wireframe: true, transparent: true, opacity: 0.35,
  });
  const matCyan = new THREE.MeshBasicMaterial({
    color: cyan, wireframe: true, transparent: true, opacity: 0.25,
  });
  const matPurple = new THREE.MeshBasicMaterial({
    color: purple, wireframe: true, transparent: true, opacity: 0.18,
  });

  /* ---- Figura principal: TESSERACTO (hipercubo 4D proyectado a 3D) ---- */
  const T_SIZE = 1.5;
  const T_DIST = 4.0;
  const tVertsRaw = [];
  for (let i = 0; i < 16; i++) {
    tVertsRaw.push(new THREE.Vector4(
      T_SIZE * (i & 1 ? 1 : -1),
      T_SIZE * (i & 2 ? 1 : -1),
      T_SIZE * (i & 4 ? 1 : -1),
      T_SIZE * (i & 8 ? 1 : -1)
    ));
  }
  const tEdges = [];
  for (let i = 0; i < 16; i++) {
    for (let b = 0; b < 4; b++) {
      const j = i ^ (1 << b);
      if (j > i) tEdges.push(i, j);
    }
  }
  const tPos = new Float32Array(16 * 3);
  const tGeo = new THREE.BufferGeometry();
  tGeo.setAttribute("position", new THREE.BufferAttribute(tPos, 3));
  tGeo.setIndex(tEdges);

  const tMain = new THREE.LineSegments(
    tGeo,
    new THREE.LineBasicMaterial({
      color: green, transparent: true, opacity: 0.9,
    })
  );

  /* Vértices brillantes del tesseracto */
  const tPointGeo = new THREE.BufferGeometry();
  tPointGeo.setAttribute("position", new THREE.BufferAttribute(tPos, 3));
  const tPoints = new THREE.Points(
    tPointGeo,
    new THREE.PointsMaterial({
      color: cyan, size: 0.16, transparent: true, opacity: 1,
    })
  );

  const tesseract = new THREE.Group();
  tesseract.add(tMain);
  tesseract.add(tPoints);
  tesseract.position.set(-2.5, 0.5, 0);
  scene.add(tesseract);

  /* Rotación 4D: giro en los planos XW / YZ / YW */
  function rotate4D(v, ax1, ax2, a) {
    const x1 = v[ax1], x2 = v[ax2];
    const c = Math.cos(a), s = Math.sin(a);
    v[ax1] = x1 * c - x2 * s;
    v[ax2] = x1 * s + x2 * c;
  }

  /* ---- Objetos flotantes secundarios ---- */
  const floaters = [];
  const shapes = [
    new THREE.OctahedronGeometry(1.1),
    new THREE.IcosahedronGeometry(1.2),
    new THREE.TorusGeometry(0.9, 0.3, 10, 26),
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
  ];
  for (let i = 0; i < 14; i++) {
    const mats = [matCyan, matPurple, matGreen];
    const mesh = new THREE.Mesh(shapes[i % shapes.length], mats[i % mats.length]);
    mesh.position.set(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 18,
      -Math.random() * 18 - 3
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    mesh.userData = {
      rx: (Math.random() - 0.5) * 0.004,
      ry: (Math.random() - 0.5) * 0.005,
      yo: mesh.position.y,
      amp: 0.3 + Math.random() * 0.7,
      speed: 0.4 + Math.random() * 0.6,
    };
    scene.add(mesh);
    floaters.push(mesh);
  }

  /* ---- Partículas (puntos estilo matriz) ---- */
  const pCount = 500;
  const positions = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 45;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 2] = -Math.random() * 30;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    color: green, size: 0.07, transparent: true, opacity: 0.6,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  /* ---- Parallax por mouse ---- */
  let mouse = { x: 0, y: 0 };
  let target = { x: 0, y: 0 };
  window.addEventListener("mousemove", (e) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  /* ---- Resize ---- */
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", onResize);

  /* ---- Loop ---- */
  const clock = new THREE.Clock();
  let frame = 0;
  function animate() {
    frame = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    mouse.x += (target.x - mouse.x) * 0.05;
    mouse.y += (target.y - mouse.y) * 0.05;

    /* ---- Tesseracto: rotación en 4D + proyección a 3D ---- */
    const aXW = t * 0.5, aYZ = t * 0.32, aYW = t * 0.21;
    const proj = new THREE.Vector4();
    for (let i = 0; i < 16; i++) {
      proj.copy(tVertsRaw[i]);
      rotate4D(proj, "x", "w", aXW);
      rotate4D(proj, "y", "z", aYZ);
      rotate4D(proj, "y", "w", aYW);
      /* proyección perspectiva con k acotado (sin explosión en W extremo) */
      const k = Math.min(T_DIST / (T_DIST - proj.x), 1.9);
      tPos[i * 3]     = proj.y * k;
      tPos[i * 3 + 1] = proj.z * k;
      tPos[i * 3 + 2] = proj.w * k;
    }
    tGeo.attributes.position.needsUpdate = true;
    tPointGeo.attributes.position.needsUpdate = true;

    tesseract.rotation.z = t * 0.12 + mouse.x * 0.3;
    tesseract.rotation.x = t * 0.08 - mouse.y * 0.3;
    tesseract.position.x = -2.5 + mouse.x * 1.2;
    tesseract.position.y = 0.5 - mouse.y * 0.8;

    for (const m of floaters) {
      const u = m.userData;
      m.rotation.x += u.rx;
      m.rotation.y += u.ry;
      m.position.y = u.yo + Math.sin(t * u.speed + u.amp) * 0.6;
    }

    points.rotation.y = t * 0.02 + mouse.x * 0.08;

    camera.position.x = mouse.x * 1.6;
    camera.position.y = -mouse.y * 1.0;
    camera.lookAt(0, 0, -6);

    renderer.render(scene, camera);
  }
  animate();

  /* Pausar cuando la pestaña no está visible (rendimiento) */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
    } else {
      animate();
    }
  });
})();
