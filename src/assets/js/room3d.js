/* ======================================================================
   Hero 3D majlis (Three.js + GSAP) — based on the Exotic Tint hero
   Plays once and then stays finished:
     bare concrete shell -> glossy zigzag epoxy floor -> feature walls
     (fluted walnut TV wall, backlit marble with mashrabiya) -> room
     decoration (paint, wallpaper, curtains, art, wall lights).
   ====================================================================== */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

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
  gsap.defaults({ overwrite: 'auto' }); // a newer step cancels an older tween on the same object

  /* ---------- renderer / scene / camera ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  RectAreaLightUniformsLib.init();

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);
  const VIEW_DIR = new THREE.Vector3(1, 0.74, 1).normalize();
  const focus = { x: 0, y: 1.2, z: 0, d: 29.5 }; // animated camera target + distance
  const OVERVIEW = { x: 0, y: 1.2, z: 0, d: 29.5 };

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
  const radial = (stops, size = 256) => canvasTex(size, size, (g, w) => {
    const grd = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    stops.forEach(([o, col]) => grd.addColorStop(o, col));
    g.fillStyle = grd; g.fillRect(0, 0, w, w);
  });

  const concrete = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#cfccc6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const v = rnd(160, 220); g.fillStyle = `rgba(${v},${v},${v - 5},.25)`; g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 3), rnd(1, 3)); }
  }, [3, 3]);
  // decorative zigzag epoxy: green, warm white and soft grey bands, fine scale
  const zigzag = canvasTex(1024, 1024, (g, w, h) => {
    const cols = ['#0a8a47', '#f7f5ef', '#f7f5ef', '#dcdfd9', '#f7f5ef', '#f7f5ef'];
    const band = h / cols.length / 4;
    for (let i = -4; i < cols.length * 4 + 4; i++) {
      g.fillStyle = cols[((i % cols.length) + cols.length) % cols.length];
      g.beginPath();
      const y = i * band;
      for (let k = 0; k <= 4; k++) { const x = (k * w) / 4; g.lineTo(x, y + (k % 2 ? band * 1.6 : 0)); }
      for (let k = 4; k >= 0; k--) { const x = (k * w) / 4; g.lineTo(x, y + band + (k % 2 ? band * 1.6 : 0)); }
      g.closePath(); g.fill();
    }
  }, [2.4, 2.4]);
  const oak = canvasTex(1024, 1024, (g, w, h) => {
    const rows = 9, pw = w / rows;
    for (let i = 0; i < rows; i++) {
      let y = -rnd(0, h);
      while (y < h) {
        const len = rnd(h * 0.35, h * 0.7);
        g.fillStyle = `hsl(${rnd(30, 36)}, ${rnd(30, 42)}%, ${rnd(70, 80)}%)`;
        g.fillRect(i * pw, y, pw, len);
        for (let k = 0; k < 12; k++) {
          g.strokeStyle = `rgba(120,80,40,${rnd(0.04, 0.12)})`; g.lineWidth = rnd(0.6, 1.6);
          g.beginPath(); const x = i * pw + rnd(4, pw - 4); g.moveTo(x, y); g.bezierCurveTo(x + rnd(-6, 6), y + len * 0.3, x + rnd(-6, 6), y + len * 0.7, x, y + len); g.stroke();
        }
        g.fillStyle = 'rgba(90,60,30,.28)'; g.fillRect(i * pw, y + len - 1.5, pw, 1.5);
        y += len;
      }
      g.fillStyle = 'rgba(90,60,30,.3)'; g.fillRect(i * pw, 0, 1.5, h);
    }
  });
  const weave = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) { const v = ((x + y) % 4 === 0 ? 150 : 110) + rnd(-25, 25); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 2, 2); }
  }, [6, 6], false);
  const marbleTile = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#f3f1ec'; g.fillRect(0, 0, w, h);
    g.filter = 'blur(1.2px)';
    for (let i = 0; i < 10; i++) {
      g.strokeStyle = `rgba(120,120,128,${rnd(0.12, 0.35)})`; g.lineWidth = rnd(0.6, 2.2);
      g.beginPath(); let x = rnd(0, w), y = 0; g.moveTo(x, y);
      while (y < h) { x += rnd(-40, 40); y += rnd(20, 60); g.lineTo(x, y); }
      g.stroke();
    }
    g.filter = 'none';
    g.strokeStyle = 'rgba(160,160,160,.45)'; g.lineWidth = 2;
    for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(0, (i * h) / 2); g.lineTo(w, (i * h) / 2); g.stroke(); g.beginPath(); g.moveTo((i * w) / 2, 0); g.lineTo((i * w) / 2, h); g.stroke(); }
  }, [2.5, 2.5]);
  const pavers = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#d9d5cc'; g.fillRect(0, 0, w, h);
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = rnd(205, 225); g.fillStyle = `rgb(${v},${v - 3},${v - 9})`; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6); }
  }, [2.5, 2.5]);
  const panelTank = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#f7f7f4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(130,135,130,.5)'; g.lineWidth = 3;
    for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(0, (i * h) / 2); g.lineTo(w, (i * h) / 2); g.stroke(); g.beginPath(); g.moveTo((i * w) / 2, 0); g.lineTo((i * w) / 2, h); g.stroke(); }
    g.fillStyle = 'rgba(120,125,120,.35)';
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) g.fillRect(i * w / 2 + w / 4 - 30, j * h / 2 + h / 4 - 30, 60, 60);
  }, [2, 1]);
  const walnut = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#6e4a2f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(${rnd(30, 60)},${rnd(18, 35)},10,${rnd(0.1, 0.35)})`; g.lineWidth = rnd(0.5, 2); g.beginPath(); const x = rnd(0, w); g.moveTo(x, 0); g.bezierCurveTo(x + rnd(-8, 8), h * 0.3, x + rnd(-8, 8), h * 0.6, x, h); g.stroke(); }
  });
  const rugTex = canvasTex(512, 384, (g, w, h) => {
    g.fillStyle = '#ece4d4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${rnd(150, 190)},${rnd(140, 170)},${rnd(110, 130)},.08)`; g.fillRect(rnd(0, w), rnd(0, h), 2, 2); }
    g.strokeStyle = 'rgba(12,154,79,.45)'; g.lineWidth = 6; g.strokeRect(22, 22, w - 44, h - 44);
    g.strokeStyle = 'rgba(120,100,70,.3)'; g.lineWidth = 2; g.strokeRect(38, 38, w - 76, h - 76);
  });

  /* ---------- materials ---------- */
  const M = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, envMapIntensity: 0.5, ...extra });
  const fabric = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95, bumpMap: weave, bumpScale: 0.6, envMapIntensity: 0.4 });
  const mat = {
    rim: M('#0c9a4f', { roughness: 0.4 }),
    base: M('#ffffff', { roughness: 0.55 }),
    concrete: M('#ffffff', { map: concrete, roughness: 0.9 }),
    epoxy: new THREE.MeshPhysicalMaterial({ map: zigzag, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.1 }),
    marble: new THREE.MeshPhysicalMaterial({ map: marbleTile, roughness: 0.25, clearcoat: 0.6, envMapIntensity: 0.8 }),
    tileWall: M('#ffffff', { map: marbleTile, roughness: 0.35, envMapIntensity: 0.7 }),
    pavers: M('#ffffff', { map: pavers, roughness: 0.95 }),
    wall: M('#cfcbc4', { roughness: 0.95 }),
    wallCap: M('#c4bfb6', { roughness: 0.9 }),
    gypsum: M('#fbfaf7', { roughness: 0.85 }),
    cove: new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: '#ffd58a', emissiveIntensity: 0, roughness: 0.4 }),
    trim: M('#fbf8f2', { roughness: 0.5 }),
    frame: M('#2b3330', { roughness: 0.35, metalness: 0.5 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#d9f0ff', transparent: true, opacity: 0.2, roughness: 0.04, clearcoat: 1, depthWrite: false, envMapIntensity: 1.2 }),
    cream: fabric('#efe7d9'),
    greenFab: fabric('#0c9a4f'),
    sage: fabric('#9fbfae'),
    leather: M('#7a5d44', { roughness: 0.42 }),
    wood: M('#ffffff', { map: walnut, roughness: 0.5 }),
    oak: M('#ffffff', { map: oak, roughness: 0.6 }),
    brass: new THREE.MeshStandardMaterial({ color: '#c9a25e', metalness: 1, roughness: 0.28, envMapIntensity: 1 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#e5e8ea', metalness: 1, roughness: 0.12, envMapIntensity: 1.2 }),
    copper: new THREE.MeshStandardMaterial({ color: '#c97a48', metalness: 1, roughness: 0.3, envMapIntensity: 1 }),
    steel: new THREE.MeshStandardMaterial({ color: '#c3c9cd', metalness: 0.9, roughness: 0.3, envMapIntensity: 1 }),
    pvc: M('#f1f2ef', { roughness: 0.4 }),
    whiteGloss: new THREE.MeshPhysicalMaterial({ color: '#f7f7f5', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.9 }),
    greenGloss: new THREE.MeshPhysicalMaterial({ color: '#0c9a4f', roughness: 0.3, clearcoat: 0.8, envMapIntensity: 0.8 }),
    dark: M('#1d2321', { roughness: 0.35, metalness: 0.2 }),
    screen: M('#0d1512', { roughness: 0.08, metalness: 0.5, emissive: '#0c3a22', emissiveIntensity: 0.6, envMapIntensity: 1.2 }),
    display: new THREE.MeshStandardMaterial({ color: '#0d1512', emissive: '#3be477', emissiveIntensity: 0.9 }),
    ceramic: M('#ece7df', { roughness: 0.6 }),
    soil: M('#3b2a1e', { roughness: 1 }),
    bark: M('#7a5a3c', { roughness: 0.9 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, side: THREE.DoubleSide, envMapIntensity: 0.5 }),
    rug: M('#ffffff', { map: rugTex, roughness: 1 }),
    sheer: M('#fffaf2', { transparent: true, opacity: 0.55, roughness: 1, side: THREE.DoubleSide, depthWrite: false }),
    tankPanel: M('#ffffff', { map: panelTank, roughness: 0.55 }),
  };

  const house = new THREE.Group();
  scene.add(house);
  const groups = []; // pieces that assemble on intro
  const box = (w, h, d, r = 0.06) => new RoundedBoxGeometry(w, h, d, 3, r);
  const add = (geo, material, pos, opts = {}) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(...pos);
    if (opts.rot) m.rotation.set(...opts.rot);
    m.castShadow = opts.cast !== false;
    m.receiveShadow = opts.receive !== false;
    (opts.parent || house).add(m);
    return m;
  };
  const group = (type, parent = house) => { const g = new THREE.Group(); parent.add(g); groups.push({ obj: g, type }); return g; };
  /** Straight pipe runs with rounded elbows. */
  const pipe = (pts, r, material, parent) => {
    const g = new THREE.Group();
    for (let i = 0; i < pts.length - 1; i++) {
      const a = new THREE.Vector3(...pts[i]), b = new THREE.Vector3(...pts[i + 1]);
      const m = add(new THREE.CylinderGeometry(r, r, a.distanceTo(b), 16), material, [0, 0, 0], { parent: g });
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    }
    pts.slice(1, -1).forEach((p) => add(new THREE.SphereGeometry(r * 1.2, 16, 12), material, p, { parent: g }));
    parent.add(g);
    return g;
  };
  /** Glowing beads travelling along a pipe route (switched on per chapter). */
  const beads = (pts, count, color, r) => {
    const path = new THREE.CurvePath();
    for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(new THREE.Vector3(...pts[i]), new THREE.Vector3(...pts[i + 1])));
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, toneMapped: false });
    const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 12, 8), m, count);
    const m4 = new THREE.Matrix4();
    const state = { on: 0, t: 0 };
    house.add(mesh);
    return {
      state,
      tick(dt) {
        if (state.on <= 0.01) { m.opacity = 0; return; }
        m.opacity = state.on;
        state.t += dt * 0.12;
        for (let i = 0; i < count; i++) { const p = path.getPointAt((state.t + i / count) % 1); m4.makeTranslation(p.x, p.y, p.z); mesh.setMatrixAt(i, m4); }
        mesh.instanceMatrix.needsUpdate = true;
      },
    };
  };

  /* ---------- plinth, floor, shell walls ---------- */
  const W = 11, D = 10, H = 4.3, T = 0.26;
  const X0 = -W / 2, XR = W / 2, ZB = -D / 2, ZF = D / 2;
  const z = ZB + T / 2;
  const shell = new THREE.Group(); house.add(shell);
  add(box(W + 0.7, 0.34, D + 0.7, 0.17), mat.rim, [0, -0.4, 0], { parent: shell, cast: false });
  add(box(W + 0.4, 0.36, D + 0.4, 0.15), mat.base, [0, -0.25, 0], { parent: shell, cast: false });
  add(box(W, 0.12, D, 0.03), mat.concrete, [0, -0.06, 0], { parent: shell, cast: false });
  // epoxy coat: pivot on the left edge so scale.x sweeps it across the room
  const coatGeo = box(W - 0.04, 0.02, D - 0.04, 0.01);
  coatGeo.translate((W - 0.04) / 2, 0, 0);
  const coat = add(coatGeo, mat.epoxy, [X0 + 0.02, 0.011, 0], { parent: shell, cast: false });
  coat.scale.x = 0.001;
  // a soft sheen line that rides the leading edge of the pour
  const sheen = add(new THREE.PlaneGeometry(0.5, D - 0.2), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(255,255,255,.9)'], [1, 'rgba(255,255,255,0)']]), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }), [X0, 0.04, 0], { parent: shell, cast: false, receive: false, rot: [-Math.PI / 2, 0, 0] });

  // walls: left (solid) and back (wide window on the left half)
  const walls = new THREE.Group(); house.add(walls);
  add(box(T, H, D, 0.04), mat.wall, [X0 + T / 2, H / 2, 0], { parent: walls });
  const winL = X0 + 1.4, winR = -0.6, winB = 0.7, winT = 3.5;
  add(box(W, winB, T, 0.04), mat.wall, [0, winB / 2, z], { parent: walls });
  add(box(W, H - winT, T, 0.04), mat.wall, [0, winT + (H - winT) / 2, z], { parent: walls });
  add(box(winL - X0, winT - winB, T, 0.02), mat.wall, [(X0 + winL) / 2, (winB + winT) / 2, z], { parent: walls });
  add(box(XR - winR, winT - winB, T, 0.02), mat.wall, [(winR + XR) / 2, (winB + winT) / 2, z], { parent: walls });
  const wW = winR - winL, wH = winT - winB, wcx = (winL + winR) / 2, wcy = (winB + winT) / 2;
  const bar = (w, h, x, y) => add(new THREE.BoxGeometry(w, h, 0.16), mat.frame, [x, y, z], { parent: walls });
  bar(wW + 0.1, 0.08, wcx, winB); bar(wW + 0.1, 0.08, wcx, winT); bar(0.08, wH, winL, wcy); bar(0.08, wH, winR, wcy); bar(0.06, wH, wcx, wcy);
  add(new THREE.PlaneGeometry(wW, wH), mat.glass, [wcx, wcy, z + 0.02], { parent: walls, cast: false, receive: false });
  add(new THREE.BoxGeometry(W - 0.3, 0.12, 0.04), mat.trim, [0, 0.06, z + 0.15], { parent: walls, cast: false });
  add(new THREE.BoxGeometry(0.04, 0.12, D - 0.3), mat.trim, [X0 + T + 0.02, 0.06, 0], { parent: walls, cast: false });

  const warm = new THREE.PointLight('#ffc779', 0, 9, 1.6); warm.position.set(-0.6, 2.8, 0.6);
  scene.add(warm);

  /* ---------- stage 3: feature walls ---------- */
  const feature = new THREE.Group(); house.add(feature);
  // fluted walnut TV wall on the left wall
  for (let i = 0; i < 30; i++) add(new THREE.CylinderGeometry(0.06, 0.06, H - 0.7, 10), mat.wood, [X0 + T + 0.07, (H - 0.7) / 2 + 0.15, -2.3 + i * 0.152], { parent: feature, cast: false });
  add(new THREE.BoxGeometry(0.05, 1.2, 2.2), mat.dark, [X0 + T + 0.2, 2.15, -0.1], { parent: feature });
  add(new THREE.BoxGeometry(0.02, 1.1, 2.1), mat.screen, [X0 + T + 0.235, 2.15, -0.1], { parent: feature });
  add(box(0.5, 0.36, 3.2, 0.05), mat.wood, [X0 + T + 0.3, 0.32, -0.1], { parent: feature });
  add(box(0.46, 0.04, 3.1, 0.02), mat.brass, [X0 + T + 0.3, 0.11, -0.1], { parent: feature });
  // backlit marble slab on the back wall (right of the window)
  const slabX = (winR + XR) / 2 + 0.2;
  add(box(3.2, 3.1, 0.08, 0.02), mat.marble, [slabX, 1.95, z + 0.2], { parent: feature });
  const halo = add(new THREE.PlaneGeometry(3.6, 3.5), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(255,214,150,.0)'], [0.55, 'rgba(255,214,150,.0)'], [0.72, 'rgba(255,214,150,.75)'], [1, 'rgba(255,214,150,0)']]), transparent: true, opacity: 0, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }), [slabX, 1.95, z + 0.15], { parent: feature, cast: false, receive: false });
  // carved mashrabiya lattice (8-point star geometry) inset in the marble, softly backlit
  const lattice = canvasTex(512, 768, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#c9a25e'; g.lineWidth = 7; g.lineJoin = 'round';
    const s8 = 64;
    for (let y = 0; y <= h + s8; y += s8 * 2) for (let x = 0; x <= w + s8; x += s8 * 2) {
      for (const [ox, oy] of [[0, 0], [s8, s8]]) {
        const cx = x + ox, cy = y + oy;
        g.beginPath();
        for (let k = 0; k < 16; k++) { const ang = (k * Math.PI) / 8; const rr = k % 2 ? s8 * 0.42 : s8 * 0.78; g.lineTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr); }
        g.closePath(); g.stroke();
      }
    }
    g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  });
  const mashGlow = add(box(1.5, 2.25, 0.03, 0.01), new THREE.MeshStandardMaterial({ color: '#fff1d6', emissive: '#ffcf87', emissiveIntensity: 0, roughness: 0.6 }), [slabX, 1.95, z + 0.25], { parent: feature, cast: false });
  add(new THREE.PlaneGeometry(1.5, 2.25), new THREE.MeshStandardMaterial({ map: lattice, transparent: true, alphaTest: 0.4, metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide }), [slabX, 1.95, z + 0.29], { parent: feature, cast: false });
  add(box(2.2, 0.5, 0.45, 0.04), mat.wood, [slabX, 0.4, z + 0.45], { parent: feature });
  // sheer curtains
  let room = feature; // parent for curtains; set to the decoration group below
  const curtain = (x) => {
    const g = new THREE.PlaneGeometry(0.7, H - 0.6, 18, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 14) * 0.05);
    g.computeVertexNormals();
    return add(g, mat.sheer, [x, (H - 0.6) / 2 + 0.05, z + 0.34], { parent: room, cast: false, receive: false });
  };

  /* ---------- stage 4: room decoration (paint, wallpaper, curtains, art, lights) ---------- */
  const decor = [];
  const piece = () => { const g = new THREE.Group(); house.add(g); decor.push(g); return g; };
  const deco = piece();
  room = deco;
  curtain(winL - 0.25); curtain(winR + 0.25);
  // damask wallpaper accent on the left wall (front part), framed with a brass trim
  const damask = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#e4d6bd'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(160,125,70,.45)';
    const motif = (cx, cy, r) => { g.beginPath(); for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; g.ellipse(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.34, r * 0.14, a, 0, Math.PI * 2); } g.fill(); g.beginPath(); g.arc(cx, cy, r * 0.18, 0, Math.PI * 2); g.fill(); };
    motif(w / 2, h / 2, 90); motif(0, 0, 90); motif(w, 0, 90); motif(0, h, 90); motif(w, h, 90);
  }, [2, 3]);
  add(new THREE.PlaneGeometry(2.5, H - 0.75), new THREE.MeshStandardMaterial({ map: damask, roughness: 0.85 }), [X0 + T + 0.015, (H - 0.75) / 2 + 0.15, 3.55], { parent: deco, cast: false, rot: [0, Math.PI / 2, 0] });
  [[3.55 - 1.25, 0], [3.55 + 1.25, 0]].forEach(([zz]) => add(new THREE.BoxGeometry(0.03, H - 0.75, 0.04), mat.brass, [X0 + T + 0.03, (H - 0.75) / 2 + 0.15, zz], { parent: deco, cast: false }));
  // framed art on the wallpaper
  const artTex = canvasTex(256, 320, (g, w, h) => { const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#efe7d8'); grd.addColorStop(1, '#d5ddd3'); g.fillStyle = grd; g.fillRect(0, 0, w, h); g.strokeStyle = '#0c9a4f'; g.lineWidth = 10; g.beginPath(); g.arc(w * 0.5, h * 0.42, w * 0.26, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#c9a25e'; g.fillRect(w * 0.18, h * 0.72, w * 0.64, 6); });
  add(box(0.05, 1.25, 1.0, 0.02), mat.dark, [X0 + T + 0.05, 2.25, 3.55], { parent: deco });
  add(new THREE.PlaneGeometry(0.88, 1.12), new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.8 }), [X0 + T + 0.08, 2.25, 3.55], { parent: deco, cast: false, rot: [0, Math.PI / 2, 0] });
  // brass wall sconces either side of the marble wall
  const sconceGlow = new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: '#ffcf87', emissiveIntensity: 0, roughness: 0.4 });
  [slabX - 1.95, slabX + 1.95].forEach((x) => {
    add(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16), mat.brass, [x, 2.55, z + 0.2], { parent: deco, rot: [Math.PI / 2, 0, 0] });
    add(new THREE.CylinderGeometry(0.09, 0.14, 0.32, 24, 1, true), sconceGlow, [x, 2.6, z + 0.32], { parent: deco, cast: false });
  });
  // decorative vases on the marble console
  add(new THREE.LatheGeometry([[0, 0], [0.1, 0], [0.14, 0.1], [0.11, 0.3], [0.05, 0.38], [0.07, 0.44]].map(([a, b]) => new THREE.Vector2(a, b)), 32), mat.brass, [slabX - 0.6, 0.66, z + 0.45], { parent: deco });
  add(new THREE.LatheGeometry([[0, 0], [0.08, 0], [0.12, 0.12], [0.1, 0.24], [0.04, 0.3]].map(([a, b]) => new THREE.Vector2(a, b)), 32), mat.ceramic, [slabX + 0.55, 0.66, z + 0.45], { parent: deco });
  const rug = piece();
  add(box(5.0, 0.035, 3.8, 0.015), mat.rug, [0, 0.04, 0], { parent: rug, cast: false });
  rug.position.set(-0.6, 0, 0.6);

  const sofa = piece();
  add(box(3.5, 0.1, 1.2, 0.03), mat.dark, [0, 0.06, 0.02], { parent: sofa });
  add(box(3.9, 0.36, 1.5, 0.14), mat.cream, [0, 0.29, 0], { parent: sofa });
  add(box(3.9, 0.82, 0.3, 0.14), mat.cream, [0, 0.82, -0.6], { parent: sofa });
  [-1.82, 1.82].forEach((x) => add(box(0.32, 0.66, 1.5, 0.15), mat.cream, [x, 0.62, 0], { parent: sofa }));
  [-1.1, 0, 1.1].forEach((x) => add(box(1.08, 0.24, 1.12, 0.11), mat.cream, [x, 0.59, 0.12], { parent: sofa }));
  [-1.1, 0, 1.1].forEach((x) => add(box(1.06, 0.62, 0.3, 0.14), mat.cream, [x, 0.98, -0.36], { parent: sofa, rot: [-0.14, 0, 0] }));
  add(box(0.62, 0.56, 0.2, 0.1), mat.greenFab, [-1.25, 1.0, -0.12], { parent: sofa, rot: [-0.3, 0.25, 0.08] });
  add(box(0.56, 0.5, 0.18, 0.09), mat.sage, [-0.72, 0.96, -0.12], { parent: sofa, rot: [-0.32, -0.1, -0.06] });
  add(box(0.6, 0.54, 0.2, 0.1), mat.greenFab, [1.28, 0.99, -0.12], { parent: sofa, rot: [-0.3, -0.25, -0.08] });
  sofa.position.set(1.6, 0.02, 0.6);
  sofa.rotation.y = -Math.PI / 2; // faces the TV wall

  const table = piece();
  add(new THREE.CylinderGeometry(0.8, 0.8, 0.07, 64), mat.marble, [0, 0.5, 0], { parent: table });
  add(new THREE.CylinderGeometry(0.46, 0.52, 0.46, 48), mat.wood, [0, 0.23, 0], { parent: table });
  add(new THREE.TorusGeometry(0.46, 0.015, 8, 48), mat.brass, [0, 0.46, 0], { parent: table, rot: [Math.PI / 2, 0, 0] });
  add(box(0.5, 0.06, 0.36, 0.01), M('#2f4a3f'), [0.2, 0.565, 0.1], { parent: table, rot: [0, 0.4, 0] });
  const vaseProfile = [[0, 0], [0.11, 0], [0.14, 0.08], [0.12, 0.22], [0.06, 0.3], [0.05, 0.36], [0.07, 0.4]].map(([x, y]) => new THREE.Vector2(x, y));
  add(new THREE.LatheGeometry(vaseProfile, 32), mat.ceramic, [-0.3, 0.535, -0.15], { parent: table });
  table.position.set(-0.6, 0.02, 0.6);

  const loungeChair = (x, zz, ry) => {
    const g = piece();
    add(box(1.0, 0.2, 0.92, 0.09), mat.leather, [0, 0.48, 0.02], { parent: g });
    add(box(1.0, 0.82, 0.16, 0.08), mat.leather, [0, 0.9, -0.4], { parent: g, rot: [-0.28, 0, 0] });
    [-0.48, 0.48].forEach((xx) => add(box(0.08, 0.06, 0.86, 0.03), mat.wood, [xx, 0.6, 0], { parent: g }));
    [[-0.4, -0.34, 0.15, -0.15], [0.4, -0.34, -0.15, -0.15], [-0.4, 0.36, 0.15, 0.15], [0.4, 0.36, -0.15, 0.15]].forEach(([xx, z2, rz, rx]) =>
      add(new THREE.CylinderGeometry(0.035, 0.022, 0.44, 10), mat.wood, [xx, 0.21, z2], { parent: g, rot: [rx, 0, rz] }));
    g.position.set(x, 0.02, zz); g.rotation.y = ry;
  };
  loungeChair(-1.0, -1.9, 0.35);

  // indoor trees (instanced leaves) in two corners
  const plantAt = (x, zz, s) => {
    const g = piece();
    const potProfile = [[0, 0], [0.26, 0], [0.33, 0.06], [0.36, 0.5], [0.38, 0.62], [0.34, 0.64], [0.32, 0.6]].map(([a, b]) => new THREE.Vector2(a, b));
    add(new THREE.LatheGeometry(potProfile, 40), mat.ceramic, [0, 0, 0], { parent: g });
    add(new THREE.CylinderGeometry(0.31, 0.31, 0.02, 32), mat.soil, [0, 0.58, 0], { parent: g, cast: false });
    const trunk = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0.05, 1.2, 0.03), new THREE.Vector3(-0.06, 1.8, -0.02), new THREE.Vector3(0.04, 2.35, 0.02)]);
    add(new THREE.TubeGeometry(trunk, 24, 0.045, 8), mat.bark, [0, 0, 0], { parent: g });
    const leafGeo = new THREE.SphereGeometry(0.5, 10, 6);
    leafGeo.scale(0.2, 0.025, 0.42); leafGeo.translate(0, 0, 0.2);
    const LEAVES = 140;
    const leaves = new THREE.InstancedMesh(leafGeo, mat.leaf, LEAVES);
    const dummy = new THREE.Object3D(), tint = new THREE.Color();
    const crowns = [[0.3, 2.0, 0.1, 0.42], [-0.32, 2.2, -0.08, 0.42], [0.18, 2.55, -0.15, 0.4], [0, 2.35, 0.05, 0.45]];
    for (let i = 0; i < LEAVES; i++) {
      const [cx2, cy2, cz2, r] = crowns[i % crowns.length];
      const dir = new THREE.Vector3(rnd(-1, 1), rnd(-0.6, 1), rnd(-1, 1)).normalize();
      dummy.position.set(cx2 + dir.x * r * rnd(0.5, 1), cy2 + dir.y * r * rnd(0.5, 1), cz2 + dir.z * r * rnd(0.5, 1));
      dummy.lookAt(dummy.position.clone().add(dir)); dummy.rotateX(rnd(-0.6, 0.6)); dummy.rotateZ(rnd(-0.8, 0.8));
      const sc = rnd(0.75, 1.2); dummy.scale.set(sc, sc, sc); dummy.updateMatrix();
      leaves.setMatrixAt(i, dummy.matrix);
      leaves.setColorAt(i, tint.setHSL(rnd(0.27, 0.33), rnd(0.35, 0.55), rnd(0.24, 0.4)));
    }
    leaves.castShadow = true; g.add(leaves);
    g.position.set(x, 0.02, zz); g.scale.setScalar(s);
  };
  plantAt(X0 + 0.9, ZB + 0.9, 1.05);

  /* ---------- lights ---------- */
  scene.add(new THREE.HemisphereLight('#ffffff', '#e8dcc6', 0.6));
  const key = new THREE.DirectionalLight('#fff8ee', 1.5);
  key.position.set(12, 16, 14);
  key.castShadow = false;
  key.shadow.mapSize.set(512, 512);
  Object.assign(key.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 60 });
  key.shadow.bias = -0.0006; key.shadow.radius = 6;
  scene.add(key);
  const sun = new THREE.DirectionalLight('#ffcf8a', 2.6);
  sun.position.set(-4, 8, -15);
  sun.target.position.set(-1.6, 0, 1.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 });
  sun.shadow.bias = -0.0008; sun.shadow.radius = 3;
  scene.add(sun, sun.target);

  const contact = new THREE.Mesh(new THREE.PlaneGeometry(W + 5, D + 5), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(30,40,30,.38)'], [0.7, 'rgba(30,40,30,.12)'], [1, 'rgba(30,40,30,0)']]), transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2; contact.position.set(0, -0.58, 0);
  scene.add(contact);
  const glowTex = radial([[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,240,200,1)'], [0.42, 'rgba(255,200,110,.55)'], [1, 'rgba(255,160,60,0)']]);
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  sunSprite.position.set(wcx, wcy + 0.4, ZB - 1.4); sunSprite.scale.set(2.4, 2.4, 1);
  scene.add(sunSprite);
  const sunDir = new THREE.Vector3().subVectors(sun.target.position, sun.position).normalize();
  const toFloor = (p) => p.clone().addScaledVector(sunDir, (p.y - 0.04) / -sunDir.y);
  const rayMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color('#ffd79a') }, uOpacity: { value: 0.16 } },
    vertexShader: 'attribute float fade; varying float vFade; void main(){ vFade = fade; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uColor; uniform float uOpacity; varying float vFade; void main(){ gl_FragColor = vec4(uColor, uOpacity * pow(vFade, 1.6)); }',
  });
  [[winL + 0.06, wcx - 0.05], [wcx + 0.05, winR - 0.06]].forEach(([x0, x1]) => {
    const top = [new THREE.Vector3(x0, winT - 0.05, z), new THREE.Vector3(x1, winT - 0.05, z), new THREE.Vector3(x1, winB + 0.05, z), new THREE.Vector3(x0, winB + 0.05, z)];
    const bot = top.map(toFloor);
    const pos = [], fade = [];
    for (let k = 0; k < 4; k++) { const a = top[k], b = top[(k + 1) % 4], c = bot[(k + 1) % 4], d = bot[k]; [a, b, c, a, c, d].forEach((v) => pos.push(v.x, v.y, v.z)); fade.push(1, 1, 0, 1, 0, 0); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('fade', new THREE.Float32BufferAttribute(fade, 1));
    scene.add(new THREE.Mesh(g, rayMat));
  });
  /* ---------- stages: bare shell -> epoxy -> feature walls -> decoration ---------- */
  const STAGES = ['shell', 'floor', 'walls', 'decor'];
  const CAM = {
    shell: { x: 0, y: 1.0, z: 0.2, d: 27 },
    floor: { x: 0.2, y: 0.6, z: 0.6, d: 26 },
    walls: { x: -0.4, y: 1.5, z: -0.4, d: 25.5 },
    decor: { x: 0, y: 1.2, z: 0.3, d: 26 },
  };
  Object.assign(focus, CAM.shell);
  // hidden start state for every later stage
  feature.scale.set(1, 0.001, 1); feature.visible = false;
  decor.forEach((g) => { g.userData.y = g.position.y; g.visible = false; if (g === deco) g.scale.setScalar(0.001); else g.position.y += 2.5; });

  function setStage(n, instant) {
    const d = instant ? 0 : 1;
    gsap.to(focus, { ...CAM[STAGES[n]], duration: 1.4 * d, ease: 'power3.inOut' });
    // floor: the zigzag coat sweeps across
    if (n >= 1) {
      gsap.to(coat.scale, { x: 1, duration: 1.8 * d, ease: 'power2.inOut',
        onUpdate: () => { sheen.position.x = X0 + coat.scale.x * (W - 0.04); sheen.material.opacity = coat.scale.x > 0.01 && coat.scale.x < 0.99 ? 0.8 : 0; } });
    }
    // feature walls grow up from the floor
    if (n >= 2) {
      feature.visible = true;
      gsap.to(feature.scale, { y: 1, duration: 1.2 * d, ease: 'expo.out' });
      gsap.to(halo.material, { opacity: 1, duration: 1 * d, delay: 0.8 * d });
      gsap.to(mashGlow.material, { emissiveIntensity: 1.3, duration: 1.2 * d, delay: 0.6 * d });
    }
    // decoration: repaint, wallpaper, curtains, art, lights — then the furniture settles in
    if (n >= 3) {
      const paint = new THREE.Color('#dccdb4'), capPaint = new THREE.Color('#cdbb9f');
      gsap.to(mat.wall.color, { r: paint.r, g: paint.g, b: paint.b, duration: 1.2 * d });
      gsap.to(mat.wallCap.color, { r: capPaint.r, g: capPaint.g, b: capPaint.b, duration: 1.2 * d });
      gsap.to(sconceGlow, { emissiveIntensity: 2.2, duration: 1 * d, delay: 0.6 * d });
      gsap.to(warm, { intensity: 5, duration: 1.4 * d, delay: 0.6 * d });
      decor.forEach((g, i) => {
        g.visible = true;
        if (g === deco) gsap.to(g.scale, { x: 1, y: 1, z: 1, duration: 0.9 * d, ease: 'power3.out' });
        else gsap.to(g.position, { y: g.userData.y, duration: 0.7 * d, delay: (0.5 + i * 0.08) * d, ease: 'back.out(1.4)' });
      });
    }
  }

  /* ---------- intro: shell assembles, then the room is finished once ---------- */
  const intro = gsap.timeline({ delay: 0.3, paused: true });
  intro.from(shell.scale, { x: 0.001, z: 0.001, duration: 1, ease: 'expo.out' }, 0);
  intro.from(walls.position, { y: -6, duration: 1.1, ease: 'expo.out' }, 0.3);
  intro.from(house.rotation, { y: -0.45, duration: 2.6, ease: 'expo.out' }, 0);
  const STEP_MS = [0, 2100, 1900];
  const play = (n) => { setStage(n); if (n < STAGES.length - 1) setTimeout(() => play(n + 1), STEP_MS[n + 1] || 2000); };

  /* ---------- sizing ---------- */
  const size = { w: 1, h: 1 };
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    size.w = w; size.h = h;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.95 ? 36 : 28;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(host);

  /* ---------- pointer parallax ---------- */
  const look = { x: 0, y: 0 };
  if (window.matchMedia('(pointer: fine)').matches) {
    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      gsap.to(look, { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5, duration: 0.8, ease: 'power3' });
    });
    host.addEventListener('pointerleave', () => gsap.to(look, { x: 0, y: 0, duration: 1, ease: 'power3' }));
  }

  /* ---------- render loop (only while visible) ---------- */
  let running = false, started = false, raf = 0;
  const clock = new THREE.Clock();
  const target = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  function frame() {
    if (!running) return;
    clock.getDelta();
    const tt = clock.elapsedTime;
    target.set(focus.x, focus.y, focus.z);
    const dir = VIEW_DIR.clone().applyAxisAngle(UP, look.x * 0.25);
    camera.position.copy(target).addScaledVector(dir, focus.d);
    camera.position.y += -look.y * 1.2 + Math.sin(tt * 0.5) * 0.1;
    camera.lookAt(target);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  new IntersectionObserver((entries) => {
    running = entries[0].isIntersecting;
    if (running) {
      if (!started) {
        started = true;
        host.classList.add('is-ready');
        if (reduce) { setStage(STAGES.length - 1, true); gsap.globalTimeline.progress(1); }
        else { setStage(0, true); intro.play(); intro.call(() => play(1), null, '+=0.1'); }
      }
      cancelAnimationFrame(raf);
      frame();
    }
  }, { threshold: 0.05 }).observe(host);
}
