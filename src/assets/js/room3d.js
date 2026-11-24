/* ======================================================================
   Hero 3D room (Three.js + GSAP) — adapted from the Exotic Tint hero
   An isometric majlis / living room assembles itself, then a green zigzag
   epoxy coat sweeps across the bare concrete floor and the gypsum cove
   lights fade in ("Before" / "After" toggle).
   ====================================================================== */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const host = document.querySelector('[data-room]');
const canvas = host && host.querySelector('canvas');
const gsap = window.gsap;

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

if (host && canvas && gsap && supportsWebGL()) init();
else if (host) host.classList.add('room-fallback');

function init() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ar = document.documentElement.lang === 'ar';
  const fmt = (n) => (ar ? Math.round(n).toLocaleString('ar-EG') : String(Math.round(n)));

  /* ---------- renderer / scene / camera ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  // same camera in both languages (mirroring a 3D room would show it from behind a wall)
  const camBase = new THREE.Vector3(15.5, 12.5, 15.5);
  const target = new THREE.Vector3(0, 1.3, 0);
  camera.position.copy(camBase);
  camera.lookAt(target);

  /* ---------- procedural textures (no image downloads) ---------- */
  const canvasTex = (w, h, draw, rep = [1, 1], srgb = true) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const tx = new THREE.CanvasTexture(c);
    if (srgb) tx.colorSpace = THREE.SRGBColorSpace;
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.repeat.set(...rep);
    tx.anisotropy = 8;
    return tx;
  };
  const rnd = (a, b) => a + Math.random() * (b - a);
  // light oak planks
  const oak = canvasTex(1024, 1024, (g, w, h) => {
    const rows = 9, pw = w / rows;
    for (let i = 0; i < rows; i++) {
      let y = -rnd(0, h);
      while (y < h) {
        const len = rnd(h * 0.35, h * 0.7);
        const l = rnd(78, 86);
        g.fillStyle = `hsl(${rnd(32, 37)}, ${rnd(38, 48)}%, ${l}%)`;
        g.fillRect(i * pw, y, pw, len);
        for (let k = 0; k < 14; k++) {
          g.strokeStyle = `rgba(140,95,50,${rnd(0.04, 0.12)})`;
          g.lineWidth = rnd(0.6, 1.8);
          g.beginPath();
          const x = i * pw + rnd(4, pw - 4);
          g.moveTo(x, y);
          g.bezierCurveTo(x + rnd(-6, 6), y + len * 0.3, x + rnd(-6, 6), y + len * 0.7, x + rnd(-4, 4), y + len);
          g.stroke();
        }
        g.fillStyle = 'rgba(90,60,30,.28)';
        g.fillRect(i * pw, y + len - 1.5, pw, 1.5);
        y += len;
      }
      g.fillStyle = 'rgba(90,60,30,.32)';
      g.fillRect(i * pw, 0, 1.5, h);
    }
  });
  // bare concrete screed
  const concrete = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#c9c7c2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const v = rnd(150, 215); g.fillStyle = `rgba(${v},${v},${v - 4},.25)`; g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 3), rnd(1, 3)); }
    g.strokeStyle = 'rgba(90,90,90,.18)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
  }, [3, 3]);
  // decorative zigzag (chevron) epoxy: green, white and soft grey bands
  const zigzag = canvasTex(512, 512, (g, w, h) => {
    const cols = ['#0c9a4f', '#fbfbf9', '#e2e7e4', '#fbfbf9'];
    const band = h / cols.length / 2;
    for (let i = -2; i < cols.length * 2 + 2; i++) {
      g.fillStyle = cols[((i % cols.length) + cols.length) % cols.length];
      g.beginPath();
      const y = i * band;
      g.moveTo(0, y); g.lineTo(w / 2, y + band * 1.6); g.lineTo(w, y);
      g.lineTo(w, y + band); g.lineTo(w / 2, y + band * 2.6); g.lineTo(0, y + band);
      g.closePath(); g.fill();
    }
  }, [4, 4]);
  // fabric weave (bump)
  const weave = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      const v = ((x + y) % 4 === 0 ? 150 : 110) + rnd(-25, 25);
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 2, 2);
    }
  }, [6, 6], false);
  // white marble with soft veins
  const marble = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, w, h);
    g.filter = 'blur(1.2px)';
    for (let i = 0; i < 9; i++) {
      g.strokeStyle = `rgba(120,120,130,${rnd(0.15, 0.4)})`;
      g.lineWidth = rnd(0.6, 2.4);
      g.beginPath();
      let x = rnd(0, w), y = 0;
      g.moveTo(x, y);
      while (y < h) { x += rnd(-40, 40); y += rnd(20, 60); g.lineTo(x, y); }
      g.stroke();
    }
    g.filter = 'none';
  });
  // woven rug with a border
  const rugTex = canvasTex(512, 384, (g, w, h) => {
    g.fillStyle = '#eadfcb'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${rnd(150, 200)},${rnd(120, 160)},${rnd(90, 120)},.08)`; g.fillRect(rnd(0, w), rnd(0, h), 2, 2); }
    g.strokeStyle = 'rgba(160,110,70,.55)'; g.lineWidth = 6; g.strokeRect(22, 22, w - 44, h - 44);
    g.strokeStyle = 'rgba(160,110,70,.3)'; g.lineWidth = 2; g.strokeRect(38, 38, w - 76, h - 76);
  });
  // walnut grain
  const walnut = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#6e4a2f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = `rgba(${rnd(30, 60)},${rnd(18, 35)},10,${rnd(0.1, 0.35)})`;
      g.lineWidth = rnd(0.5, 2);
      g.beginPath(); const x = rnd(0, w); g.moveTo(x, 0); g.bezierCurveTo(x + rnd(-8, 8), h * 0.3, x + rnd(-8, 8), h * 0.6, x + rnd(-5, 5), h); g.stroke();
    }
  });

  /* ---------- materials ---------- */
  const M = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, envMapIntensity: 0.55, ...extra });
  const fabric = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.95, bumpMap: weave, bumpScale: 0.6, ...extra });
  const mat = {
    floor: M('#ffffff', { map: concrete, roughness: 0.9, envMapIntensity: 0.3 }),
    epoxy: new THREE.MeshPhysicalMaterial({ map: zigzag, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.9 }),
    oak: M('#ffffff', { map: oak, roughness: 0.55 }),
    rim: M('#0c9a4f', { roughness: 0.45 }),
    base: M('#ffffff', { roughness: 0.6 }),
    gypsum: M('#fbfaf7', { roughness: 0.85 }),
    cove: new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: '#ffd58a', emissiveIntensity: 0, roughness: 0.4 }),
    wall: M('#ece4d6', { roughness: 0.92 }),
    wallEdge: M('#d9cfbf'),
    trim: M('#fbf8f2', { roughness: 0.5 }),
    frame: M('#1d2b42', { roughness: 0.35, metalness: 0.5 }),
    cream: fabric('#efe6d6'),
    white: M('#ffffff', { roughness: 0.5 }),
    orange: fabric('#0c9a4f'),
    terracotta: fabric('#8fb9a0'),
    leather: M('#6b5a49', { roughness: 0.42 }),
    wood: M('#ffffff', { map: walnut, roughness: 0.5 }),
    brass: new THREE.MeshStandardMaterial({ color: '#c9a25e', metalness: 1, roughness: 0.28, envMapIntensity: 1 }),
    marble: M('#ffffff', { map: marble, roughness: 0.2 }),
    ceramic: M('#ece7df', { roughness: 0.65 }),
    soil: M('#3b2a1e', { roughness: 1 }),
    bark: M('#7a5a3c', { roughness: 0.9 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, side: THREE.DoubleSide, envMapIntensity: 0.5 }),
    dark: M('#1b1f27', { roughness: 0.35, metalness: 0.2 }),
    screen: M('#10151f', { roughness: 0.08, metalness: 0.5, emissive: '#0f1a2c', emissiveIntensity: 0.5, envMapIntensity: 1.2 }),
    book1: M('#2f4a63'), book2: M('#d8cfc0'), book3: M('#9b4f34'),
    rug: M('#ffffff', { map: rugTex, roughness: 1 }),
    sheer: M('#fffaf2', { transparent: true, opacity: 0.55, roughness: 1, side: THREE.DoubleSide, depthWrite: false }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0, clearcoat: 1, depthWrite: false }),
    film: new THREE.MeshStandardMaterial({ color: '#0f1d33', transparent: true, opacity: 0.72, roughness: 0.2, metalness: 0.4, depthWrite: false, side: THREE.DoubleSide }),
  };

  const groups = []; // pieces that assemble on intro
  const room = new THREE.Group();
  scene.add(room);
  const add = (geo, material, pos, opts = {}) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(...pos);
    if (opts.rot) m.rotation.set(...opts.rot);
    m.castShadow = opts.cast !== false;
    m.receiveShadow = opts.receive !== false;
    (opts.parent || room).add(m);
    return m;
  };
  const box = (w, h, d, r = 0.06) => new RoundedBoxGeometry(w, h, d, 3, r);

  /* ---------- floor ---------- */
  const floor = new THREE.Group();
  add(box(10.7, 0.32, 10.7, 0.16), mat.rim, [0, -0.38, 0], { parent: floor, cast: false });
  add(box(10.4, 0.34, 10.4, 0.14), mat.base, [0, -0.24, 0], { parent: floor, cast: false });
  add(box(10, 0.3, 10, 0.08), mat.floor, [0, -0.15, 0], { parent: floor, cast: false });
  // epoxy coat: pivot on the left edge so scale.x sweeps it across the room
  const coatGeo = box(9.98, 0.02, 9.98, 0.01);
  coatGeo.translate(4.99, 0, 0);
  const coat = add(coatGeo, mat.epoxy, [-4.99, 0.011, 0], { parent: floor, cast: false });
  coat.scale.x = 0.001;
  room.add(floor);
  groups.push({ obj: floor, type: 'floor' });

  /* ---------- walls (left solid with TV, back with big window) ---------- */
  const H = 4.4, T = 0.3;
  const leftWall = new THREE.Group();
  add(box(T, H, 10, 0.04), mat.wall, [-5 + T / 2, H / 2, 0], { parent: leftWall });
  add(new THREE.BoxGeometry(0.06, 1.25, 2.3), mat.dark, [-4.6, 2.3, 0.6], { parent: leftWall }); // TV
  add(new THREE.BoxGeometry(0.02, 1.13, 2.18), mat.screen, [-4.565, 2.3, 0.6], { parent: leftWall });
  for (let i = 0; i < 26; i++) add(new THREE.CylinderGeometry(0.06, 0.06, H - 0.25, 10), mat.wood, [-4.68, (H - 0.25) / 2 + 0.12, -1.35 + i * 0.155], { parent: leftWall, cast: false });
  add(box(0.55, 0.42, 3.1, 0.05), mat.wood, [-4.33, 0.36, 0.6], { parent: leftWall }); // TV console
  add(box(0.5, 0.05, 3.0, 0.02), mat.brass, [-4.33, 0.12, 0.6], { parent: leftWall });
  add(new THREE.BoxGeometry(0.05, 0.16, 9.7), mat.trim, [-4.68, 0.08, 0], { parent: leftWall, cast: false });
  room.add(leftWall);
  groups.push({ obj: leftWall, type: 'wall' });

  const backWall = new THREE.Group();
  const z = -5 + T / 2;
  const winL = -3.2, winR = 3.4, winB = 0.9, winT = 3.6;
  add(box(10, winB, T, 0.04), mat.wall, [0, winB / 2, z], { parent: backWall });
  add(box(10, H - winT, T, 0.04), mat.wall, [0, winT + (H - winT) / 2, z], { parent: backWall });
  add(box(winL + 5, winT - winB, T, 0.02), mat.wall, [(-5 + winL) / 2, (winB + winT) / 2, z], { parent: backWall });
  add(box(5 - winR, winT - winB, T, 0.02), mat.wall, [(winR + 5) / 2, (winB + winT) / 2, z], { parent: backWall });
  add(new THREE.BoxGeometry(9.7, 0.16, 0.05), mat.trim, [0, 0.08, z + 0.17], { parent: backWall, cast: false });
  room.add(backWall);
  groups.push({ obj: backWall, type: 'wall' });

  /* ---------- window: frame, glass, film ---------- */
  const win = new THREE.Group();
  const wW = winR - winL, wH = winT - winB, cx = (winL + winR) / 2, cy = (winB + winT) / 2;
  const bar = (w, h, x, y) => add(new THREE.BoxGeometry(w, h, 0.18), mat.frame, [x, y, z], { parent: win });
  bar(wW + 0.12, 0.12, cx, winB);
  bar(wW + 0.12, 0.12, cx, winT);
  bar(0.12, wH, winL, cy);
  bar(0.12, wH, winR, cy);
  bar(0.08, wH, winL + wW / 3, cy);
  bar(0.08, wH, winL + (2 * wW) / 3, cy);
  add(new THREE.PlaneGeometry(wW, wH), mat.glass, [cx, cy, z + 0.02], { parent: win, cast: false, receive: false });
  room.add(win);
  groups.push({ obj: win, type: 'drop' });

  /* ---------- gypsum ceiling bulkhead + cove light ---------- */
  const ceiling = new THREE.Group();
  add(box(0.9, 0.34, 10, 0.03), mat.gypsum, [-4.4, H - 0.17, 0], { parent: ceiling });
  add(box(10, 0.34, 0.9, 0.03), mat.gypsum, [0, H - 0.17, -4.4], { parent: ceiling });
  add(new THREE.BoxGeometry(0.05, 0.05, 9.0), mat.cove, [-3.92, H - 0.4, 0.4], { parent: ceiling, cast: false });
  add(new THREE.BoxGeometry(9.0, 0.05, 0.05), mat.cove, [0.4, H - 0.4, -3.92], { parent: ceiling, cast: false });
  room.add(ceiling);
  groups.push({ obj: ceiling, type: 'drop' });

  /* ---------- furniture ---------- */
  // sheer curtains either side of the window (gently waved)
  const curtain = (x) => {
    const g = new THREE.PlaneGeometry(0.9, H - 0.25, 18, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 14) * 0.05);
    g.computeVertexNormals();
    return add(g, mat.sheer, [x, (H - 0.25) / 2 + 0.05, z + 0.32], { cast: false, receive: false });
  };
  const curtains = new THREE.Group();
  curtains.add(curtain(winL - 0.25), curtain(winR + 0.25));
  room.add(curtains);
  groups.push({ obj: curtains, type: 'pop' });

  // woven rug
  const rug = add(box(5.8, 0.035, 3.9, 0.015), mat.rug, [1.0, 0.02, 0.5], { cast: false });
  groups.push({ obj: rug, type: 'pop' });

  // modern sofa: recessed plinth, deep seat cushions, loose back cushions, rounded arms, throw pillows
  const sofa = new THREE.Group();
  add(box(3.5, 0.1, 1.2, 0.03), mat.dark, [0, 0.06, 0.02], { parent: sofa });
  add(box(3.9, 0.36, 1.5, 0.14), mat.cream, [0, 0.29, 0], { parent: sofa });
  add(box(3.9, 0.82, 0.3, 0.14), mat.cream, [0, 0.82, -0.6], { parent: sofa });
  [-1.82, 1.82].forEach((x) => add(box(0.32, 0.66, 1.5, 0.15), mat.cream, [x, 0.62, 0], { parent: sofa }));
  [-1.1, 0, 1.1].forEach((x) => add(box(1.08, 0.24, 1.12, 0.11), mat.cream, [x, 0.59, 0.12], { parent: sofa }));
  [-1.1, 0, 1.1].forEach((x) => add(box(1.06, 0.62, 0.3, 0.14), mat.cream, [x, 0.98, -0.36], { parent: sofa, rot: [-0.14, 0, 0] }));
  add(box(0.62, 0.56, 0.2, 0.1), mat.orange, [-1.25, 1.0, -0.12], { parent: sofa, rot: [-0.3, 0.25, 0.08] });
  add(box(0.56, 0.5, 0.18, 0.09), mat.terracotta, [-0.72, 0.96, -0.12], { parent: sofa, rot: [-0.32, -0.1, -0.06] });
  add(box(0.6, 0.54, 0.2, 0.1), mat.orange, [1.28, 0.99, -0.12], { parent: sofa, rot: [-0.3, -0.25, -0.08] });
  add(box(0.9, 0.04, 1.3, 0.02), mat.terracotta, [1.55, 0.74, 0.12], { parent: sofa, rot: [0, 0, 0.06] }); // throw
  sofa.position.set(1.4, 0, 1.6);
  sofa.rotation.y = Math.PI;
  room.add(sofa);
  groups.push({ obj: sofa, type: 'drop' });

  // marble coffee table on a drum base, with books and a vase
  const table = new THREE.Group();
  add(new THREE.CylinderGeometry(0.9, 0.9, 0.07, 64), mat.marble, [0, 0.52, 0], { parent: table });
  add(new THREE.CylinderGeometry(0.5, 0.56, 0.48, 48), mat.wood, [0, 0.24, 0], { parent: table });
  add(new THREE.TorusGeometry(0.5, 0.015, 8, 48), mat.brass, [0, 0.48, 0], { parent: table, rot: [Math.PI / 2, 0, 0] });
  add(box(0.5, 0.06, 0.36, 0.01), mat.book1, [0.25, 0.59, 0.1], { parent: table, rot: [0, 0.4, 0] });
  add(box(0.44, 0.05, 0.32, 0.01), mat.book2, [0.25, 0.645, 0.1], { parent: table, rot: [0, 0.55, 0] });
  const vaseProfile = [[0, 0], [0.11, 0], [0.14, 0.08], [0.12, 0.22], [0.06, 0.3], [0.05, 0.36], [0.07, 0.4]].map(([x, y]) => new THREE.Vector2(x, y));
  add(new THREE.LatheGeometry(vaseProfile, 32), mat.ceramic, [-0.35, 0.555, -0.15], { parent: table });
  [[0.02, 0.38], [-0.05, 0.42]].forEach(([dx, hgt], k) => add(new THREE.CylinderGeometry(0.008, 0.008, hgt, 5), mat.bark, [-0.35 + dx, 0.555 + 0.36 + hgt / 2, -0.15], { parent: table, rot: [0, 0, k ? 0.25 : -0.15] }));
  table.position.set(1.2, 0, -0.4);
  room.add(table);
  groups.push({ obj: table, type: 'drop' });

  // leather lounge chair on splayed walnut legs
  const chair = new THREE.Group();
  add(box(1.05, 0.2, 0.95, 0.09), mat.leather, [0, 0.5, 0.02], { parent: chair });
  add(box(1.05, 0.85, 0.16, 0.08), mat.leather, [0, 0.92, -0.42], { parent: chair, rot: [-0.28, 0, 0] });
  [-0.5, 0.5].forEach((x) => add(box(0.08, 0.06, 0.9, 0.03), mat.wood, [x, 0.62, 0], { parent: chair }));
  [[-0.42, -0.36, 0.15, -0.15], [0.42, -0.36, -0.15, -0.15], [-0.42, 0.38, 0.15, 0.15], [0.42, 0.38, -0.15, 0.15]].forEach(([x, zz, rz, rx]) =>
    add(new THREE.CylinderGeometry(0.035, 0.022, 0.46, 10), mat.wood, [x, 0.22, zz], { parent: chair, rot: [rx, 0, rz] }));
  add(box(0.42, 0.38, 0.14, 0.08), mat.cream, [0.05, 0.75, -0.25], { parent: chair, rot: [-0.3, 0.1, 0] });
  chair.position.set(-2.4, 0, -1.9);
  chair.rotation.y = 0.6;
  room.add(chair);
  groups.push({ obj: chair, type: 'drop' });

  // indoor tree: ceramic pot, curved trunk, ~150 instanced leaves
  const plant = new THREE.Group();
  const potProfile = [[0, 0], [0.26, 0], [0.33, 0.06], [0.36, 0.5], [0.38, 0.62], [0.34, 0.64], [0.32, 0.6]].map(([x, y]) => new THREE.Vector2(x, y));
  add(new THREE.LatheGeometry(potProfile, 40), mat.ceramic, [0, 0, 0], { parent: plant });
  add(new THREE.CylinderGeometry(0.31, 0.31, 0.02, 32), mat.soil, [0, 0.58, 0], { parent: plant, cast: false });
  const trunk = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0.05, 1.2, 0.03), new THREE.Vector3(-0.06, 1.8, -0.02), new THREE.Vector3(0.04, 2.35, 0.02)]);
  add(new THREE.TubeGeometry(trunk, 24, 0.045, 8), mat.bark, [0, 0, 0], { parent: plant });
  [[[0.02, 1.5, 0], [0.35, 1.9, 0.12]], [[-0.03, 1.75, 0], [-0.36, 2.15, -0.1]], [[0.02, 2.0, 0], [0.22, 2.45, -0.2]]].forEach(([a, b2]) =>
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(...a), new THREE.Vector3(...b2)]), 6, 0.022, 6), mat.bark, [0, 0, 0], { parent: plant }));
  const leafGeo = new THREE.SphereGeometry(0.5, 10, 6);
  leafGeo.scale(0.2, 0.025, 0.42);
  leafGeo.translate(0, 0, 0.2);
  const LEAVES = 150;
  const leaves = new THREE.InstancedMesh(leafGeo, mat.leaf, LEAVES);
  const dummy = new THREE.Object3D(), tint = new THREE.Color();
  const crowns = [[0.3, 2.0, 0.1, 0.42], [-0.32, 2.2, -0.08, 0.42], [0.18, 2.55, -0.15, 0.4], [0, 2.35, 0.05, 0.45]];
  for (let i = 0; i < LEAVES; i++) {
    const [cx2, cy2, cz2, r] = crowns[i % crowns.length];
    const dir = new THREE.Vector3(rnd(-1, 1), rnd(-0.6, 1), rnd(-1, 1)).normalize();
    dummy.position.set(cx2 + dir.x * r * rnd(0.5, 1), cy2 + dir.y * r * rnd(0.5, 1), cz2 + dir.z * r * rnd(0.5, 1));
    dummy.lookAt(dummy.position.clone().add(dir));
    dummy.rotateX(rnd(-0.6, 0.6));
    dummy.rotateZ(rnd(-0.8, 0.8));
    const sc = rnd(0.75, 1.2);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
    leaves.setColorAt(i, tint.setHSL(rnd(0.27, 0.33), rnd(0.35, 0.55), rnd(0.24, 0.4)));
  }
  leaves.castShadow = true;
  plant.add(leaves);
  plant.position.set(4.0, 0, -4.0);
  room.add(plant);
  groups.push({ obj: plant, type: 'pop' });

  /* ---------- light: warm sun pouring through the window ---------- */
  const radial = (stops, size = 256) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([o, col]) => grd.addColorStop(o, col));
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  scene.add(new THREE.HemisphereLight('#ffffff', '#efe2c8', 1.05));

  // soft key light from the front: casts the room's shadow *behind* it onto the ground
  const fill = new THREE.DirectionalLight('#ffffff', 1.0);
  fill.position.set(9, 14, 13);
  fill.castShadow = false;
  fill.shadow.mapSize.set(1024, 1024);
  fill.shadow.camera.left = -12; fill.shadow.camera.right = 12; fill.shadow.camera.top = 12; fill.shadow.camera.bottom = -12;
  fill.shadow.camera.near = 1; fill.shadow.camera.far = 50;
  fill.shadow.bias = -0.001;
  fill.shadow.radius = 10;
  fill.shadow.blurSamples = 16;
  scene.add(fill);

  const SUN_ON = 4.2, SUN_OFF = 1.1;
  const sun = new THREE.DirectionalLight('#ffc46b', SUN_ON);
  sun.position.set(-1.5, 7.5, -14);
  sun.target.position.set(0.6, 0, 1.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -13; sun.shadow.camera.right = 13; sun.shadow.camera.top = 13; sun.shadow.camera.bottom = -13;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 30;
  sun.shadow.bias = -0.0008;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);

  // soft shadow behind the room (fades out, never hits the canvas edge) + tight contact shadow underneath
  const shadowTex = radial([[0, 'rgba(46,32,10,.5)'], [0.45, 'rgba(46,32,10,.22)'], [1, 'rgba(46,32,10,0)']]);
  const backShadow = new THREE.Mesh(new THREE.PlaneGeometry(15, 12), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  backShadow.rotation.x = -Math.PI / 2;
  backShadow.rotation.z = 0.5;
  backShadow.position.set(-2.4, -0.32, -2.6);
  scene.add(backShadow);
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 12.5), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(46,32,10,.38)'], [0.7, 'rgba(46,32,10,.12)'], [1, 'rgba(46,32,10,0)']]), transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(0, -0.31, 0);
  scene.add(contact);
  groups.push({ obj: backShadow, type: 'pop' }, { obj: contact, type: 'pop' });

  // warm sky + sun disc, seen through the window only
  const skyTex = (() => {
    const c = document.createElement('canvas');
    c.width = 8; c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#8fbbe8');
    grd.addColorStop(0.55, '#ffd9a0');
    grd.addColorStop(1, '#ffb45c');
    g.fillStyle = grd;
    g.fillRect(0, 0, 8, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 3.7), new THREE.MeshBasicMaterial({ map: skyTex, toneMapped: false }));
  sky.position.set(-0.6, 1.85, -6.5);
  scene.add(sky);
  const glowTex = radial([[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,240,200,1)'], [0.42, 'rgba(255,200,110,.55)'], [1, 'rgba(255,160,60,0)']]);
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  sunSprite.position.set(0.2, 2.4, -6.3);
  sunSprite.scale.set(2.6, 2.6, 1);
  scene.add(sunSprite);

  // god rays: one shaft per pane, projected along the real sun direction, fading toward the floor
  const sunDir = new THREE.Vector3().subVectors(sun.target.position, sun.position).normalize();
  const toFloor = (p) => p.clone().addScaledVector(sunDir, (p.y - 0.04) / -sunDir.y);
  const rayMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color('#ffcf85') }, uOpacity: { value: 0.22 }, uTime: { value: 0 } },
    vertexShader: 'attribute float fade; varying float vFade; varying vec3 vPos; void main(){ vFade = fade; vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uColor; uniform float uOpacity; uniform float uTime; varying float vFade; varying vec3 vPos; void main(){ float shimmer = 0.85 + 0.15 * sin(vPos.x * 3.0 + vPos.y * 2.0 + uTime * 0.8); gl_FragColor = vec4(uColor, uOpacity * pow(vFade, 1.6) * shimmer); }',
  });
  const rays = new THREE.Group();
  const paneW = wW / 3;
  for (let i = 0; i < 3; i++) {
    const x0 = winL + i * paneW + 0.08, x1 = winL + (i + 1) * paneW - 0.08;
    const top = [new THREE.Vector3(x0, winT - 0.06, z), new THREE.Vector3(x1, winT - 0.06, z), new THREE.Vector3(x1, winB + 0.06, z), new THREE.Vector3(x0, winB + 0.06, z)];
    const bot = top.map(toFloor);
    const pos = [], fade = [];
    for (let k = 0; k < 4; k++) {
      const a = top[k], b = top[(k + 1) % 4], c = bot[(k + 1) % 4], d = bot[k];
      [a, b, c, a, c, d].forEach((v) => pos.push(v.x, v.y, v.z));
      fade.push(1, 1, 0, 1, 0, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('fade', new THREE.Float32BufferAttribute(fade, 1));
    rays.add(new THREE.Mesh(g, rayMat));
  }
  scene.add(rays);
  const beamMat = rayMat.uniforms.uOpacity; // animated on tint on/off

  // dust floating in the sunbeams
  const DUST = 90;
  const dustBase = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    const p = new THREE.Vector3(THREE.MathUtils.lerp(winL, winR, Math.random()), THREE.MathUtils.lerp(winB, winT, Math.random()), z);
    const v = p.clone().lerp(toFloor(p), Math.random() * 0.92);
    dustBase.set([v.x, v.y, v.z], i * 3);
  }
  const dustPos = new Float32Array(dustBase);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ map: radial([[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']], 64), color: '#ffe2a8', size: 0.06, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending });
  scene.add(new THREE.Points(dustGeo, dustMat));

  // soft brand-gold glow pooled under the furniture
  const glowMat = new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(240,160,50,.9)'], [0.35, 'rgba(240,160,50,.5)'], [0.7, 'rgba(240,160,50,.14)'], [1, 'rgba(240,160,50,0)']]), transparent: true, depthWrite: false, toneMapped: false });
  const furnitureGlow = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 7.5), glowMat);
  furnitureGlow.rotation.x = -Math.PI / 2;
  furnitureGlow.rotation.z = -0.3;
  furnitureGlow.position.set(0.9, 0.012, 0.6);
  furnitureGlow.receiveShadow = false;
  scene.add(furnitureGlow);
  groups.push({ obj: furnitureGlow, type: 'pop' });

  // warm hot-spot glow on the floor (turns cool when tinted)
  const spotMat = new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(255,255,255,.9)'], [1, 'rgba(255,255,255,0)']]), color: '#ff9a3c', transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
  const spotC = toFloor(new THREE.Vector3((winL + winR) / 2, (winB + winT) / 2, z));
  const spot = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), spotMat);
  spot.rotation.x = -Math.PI / 2;
  spot.position.set(spotC.x, 0.05, spotC.z);
  scene.add(spot);

  /* ---------- sizing ---------- */
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole room in frame on narrow screens
    camera.fov = w / h < 0.95 ? 36 : 32;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(host);

  /* ---------- HUD + finish on / off ---------- */
  const q = (sel) => host.querySelector(sel);
  const hud = { state: q('[data-r-state]'), btns: host.querySelectorAll('[data-r-mode]') };
  const coveLights = [new THREE.PointLight('#ffcf7a', 0, 9, 1.6), new THREE.PointLight('#ffcf7a', 0, 9, 1.6)];
  coveLights[0].position.set(-3.2, H - 0.6, 0.5);
  coveLights[1].position.set(0.5, H - 0.6, -3.2);
  coveLights.forEach((l) => scene.add(l));

  let tinted = false; // "after" state: epoxy coat + lights
  function setTint(on, instant) {
    tinted = on;
    hud.btns.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.rMode === 'on') === on)));
    host.classList.toggle('is-tinted', on);
    if (hud.state) hud.state.textContent = on ? hud.state.dataset.on : hud.state.dataset.off;
    const d = instant ? 0 : 1;
    gsap.to(coat.scale, { x: on ? 1 : 0.001, duration: 1.8 * d, ease: on ? 'power2.inOut' : 'power2.in' });
    gsap.to(mat.cove, { emissiveIntensity: on ? 2.2 : 0, duration: 1.2 * d, delay: on ? 1.2 * d : 0 });
    coveLights.forEach((l) => gsap.to(l, { intensity: on ? 9 : 0, duration: 1.2 * d, delay: on ? 1.2 * d : 0 }));
    gsap.to(spotMat, { opacity: on ? 0.32 : 0.5, duration: 1.4 * d });
  }

  /* ---------- intro: the room assembles ---------- */
  const intro = gsap.timeline({ delay: 0.4, paused: true });
  groups.forEach((g, i) => {
    const o = g.obj;
    if (g.type === 'floor') intro.from(o.scale, { x: 0.001, z: 0.001, duration: 1, ease: 'expo.out' }, 0);
    else if (g.type === 'wall') intro.from(o.position, { y: -5, duration: 1.1, ease: 'expo.out' }, 0.25 + i * 0.08);
    else if (g.type === 'pop') intro.from(o.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.8, ease: 'back.out(2)' }, 0.8 + i * 0.07);
    else intro.from(o.position, { y: 7, duration: 1.1, ease: 'bounce.out' }, 0.7 + i * 0.09);
  });
  intro.from(room.rotation, { y: -0.35, duration: 2.4, ease: 'expo.out' }, 0);
  intro.call(() => setTint(true), null, '+=0.6');

  /* ---------- auto demo loop + user control ---------- */
  let auto = !reduce;
  let loop = null;
  const startLoop = () => {
    clearInterval(loop);
    if (auto) loop = setInterval(() => setTint(!tinted), 5200);
  };
  hud.btns.forEach((b) =>
    b.addEventListener('click', () => {
      auto = false;
      clearInterval(loop);
      setTint(b.dataset.rMode === 'on');
    })
  );

  /* ---------- pointer parallax ---------- */
  const look = { x: 0, y: 0 };
  if (window.matchMedia('(pointer: fine)').matches) {
    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      gsap.to(look, { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5, duration: 0.8, ease: 'power3' });
    });
    host.addEventListener('pointerleave', () => gsap.to(look, { x: 0, y: 0, duration: 1, ease: 'power3' }));
  }

  /* ---------- render only while visible ---------- */
  let running = false, started = false, raf = 0;
  const clock = new THREE.Clock();
  function frame() {
    if (!running) return;
    const tt = clock.getElapsedTime();
    camera.position.set(camBase.x + look.x * 2.2, camBase.y - look.y * 1.4 + Math.sin(tt * 0.5) * 0.12, camBase.z - look.x * 1.2);
    camera.lookAt(target);
    sunSprite.material.rotation = tt * 0.05;
    rayMat.uniforms.uTime.value = tt;
    for (let i = 0; i < DUST; i++) {
      const k = i * 3;
      dustPos[k] = dustBase[k] + Math.sin(tt * 0.35 + i) * 0.12;
      dustPos[k + 1] = dustBase[k + 1] + Math.sin(tt * 0.25 + i * 1.7) * 0.18;
      dustPos[k + 2] = dustBase[k + 2] + Math.cos(tt * 0.3 + i * 0.9) * 0.12;
    }
    dustGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  new IntersectionObserver((entries) => {
    running = entries[0].isIntersecting;
    if (running) {
      if (!started) {
        started = true;
        host.classList.add('is-ready');
        if (reduce) { setTint(true, true); } else { intro.play(); setTimeout(startLoop, 6500); }
      }
      cancelAnimationFrame(raf);
      frame();
    }
  }, { threshold: 0.05 }).observe(host);
}
