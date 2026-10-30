/* scene3d.js — Apple-style: formas 3D brillantes flotando con parallax suave */
(function () {
  const canvas = document.getElementById("bg3d");
  if (!canvas || typeof THREE === "undefined") return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    50, window.innerWidth / window.innerHeight, 0.1, 100
  );
  camera.position.set(0, 0, 13);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  /* ---- Luces suaves (estilo estudio de fotografía) ---- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  const fillBlue = new THREE.PointLight(0x0a84ff, 1.1, 40);
  fillBlue.position.set(-8, -3, 5);
  scene.add(fillBlue);

  const fillPurple = new THREE.PointLight(0xbf5af2, 1.0, 40);
  fillPurple.position.set(8, 4, 4);
  scene.add(fillPurple);

  const fillPink = new THREE.PointLight(0xff375f, 0.8, 40);
  fillPink.position.set(0, 6, -3);
  scene.add(fillPink);

  /* ---- Material brillante ---- */
  function glossy(color) {
    return new THREE.MeshPhysicalMaterial({
      color: color,
      roughness: 0.18,
      metalness: 0.05,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    });
  }

  const paletteBlue = 0x7fb8ff;
  const palettePurple = 0xbf9df2;
  const palettePink = 0xff9db8;
  const paletteMint = 0x8ef0d6;

  const heroMesh = new THREE.Mesh(
    new THREE.TorusGeometry(3.1, 0.85, 48, 110),
    glossy(paletteBlue)
  );
  heroMesh.position.set(0, -0.4, 0);
  scene.add(heroMesh);

  const inner = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.5, 0.42, 100, 20),
    glossy(palettePurple)
  );
  inner.position.copy(heroMesh.position);
  scene.add(inner);

  const heroGroup = new THREE.Group();
  scene.add(heroGroup);
  heroGroup.add(heroMesh);
  heroGroup.add(inner);

  /* ---- Esferas y cápsulas alrededor ---- */
  const floaters = [];
  const sphereGeo = new THREE.SphereGeometry(0.55, 32, 32);
  const icosGeo = new THREE.IcosahedronGeometry(0.62, 1);
  const colors = [paletteBlue, palettePurple, palettePink, paletteMint];

  for (let i = 0; i < 16; i++) {
    const mesh = new THREE.Mesh(
      i % 3 === 0 ? icosGeo : sphereGeo,
      glossy(colors[i % colors.length])
    );
    const angle = (i / 16) * Math.PI * 2;
    const radius = 6 + Math.random() * 4;
    mesh.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 9,
      -2 - Math.random() * 8
    );
    mesh.scale.setScalar(0.55 + Math.random() * 0.9);
    mesh.userData = {
      yo: mesh.position.y,
      amp: 0.35 + Math.random() * 0.6,
      speed: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      rx: (Math.random() - 0.5) * 0.004,
      ry: (Math.random() - 0.5) * 0.004,
    };
    scene.add(mesh);
    floaters.push(mesh);
  }

  /* ---- Partículas mínimas de brillo ---- */
  const pCount = 260;
  const positions = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 42;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 26;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.09, transparent: true, opacity: 0.55,
  }));
  scene.add(points);

  /* ---- Parallax con mouse ---- */
  const mouse = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  window.addEventListener("mousemove", (e) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  let frame = 0;
  function animate() {
    frame = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    mouse.x += (target.x - mouse.x) * 0.045;
    mouse.y += (target.y - mouse.y) * 0.045;

    heroGroup.rotation.x = t * 0.22 + mouse.y * 0.3;
    heroGroup.rotation.y = t * 0.32 + mouse.x * 0.42;
    heroGroup.position.x = mouse.x * 1.1;
    heroGroup.position.y = -mouse.y * 0.7;

    for (const m of floaters) {
      const u = m.userData;
      m.rotation.x += u.rx;
      m.rotation.y += u.ry;
      m.position.y = u.yo + Math.sin(t * u.speed + u.phase) * u.amp;
    }

    points.rotation.y = t * 0.015 + mouse.x * 0.06;

    camera.position.x = mouse.x * 1.2;
    camera.position.y = -mouse.y * 0.7;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else animate();
  });
})();
