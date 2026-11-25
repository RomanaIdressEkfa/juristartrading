/* ======================================================================
   Hero 3D bedroom (Three.js + GSAP) — based on the Exotic Tint hero
   Eye-level cut-away so the ceiling decoration is visible. Plays once:
     bare room -> zigzag epoxy floor -> gypsum false ceiling (LED cove,
     downlights, ceiling fan) -> upholstered headboard wall + wardrobe ->
     decoration (bed, lamps, hanging pendants, curtains, rug, art, plant).
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
    const cols = ['#2f6a4c', '#f6f3ec', '#f6f3ec', '#ddd5c6', '#f6f3ec', '#f6f3ec'];
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
    rim: M('#1d4a37', { roughness: 0.5 }),
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

  /* ---------- room shell: plinth, floor, two walls and a plain ceiling ---------- */
  VIEW_DIR.set(0.72, 0.07, 1).normalize(); // eye-level cut-away: we look in under the ceiling
  const W = 11, D = 9, H = 4.7, T = 0.24;
  const X0 = -W / 2, XR = W / 2, ZB = -D / 2, ZF = D / 2;
  const zb = ZB + T / 2, xl = X0 + T / 2;
  const shell = new THREE.Group(); house.add(shell);
  add(box(W + 0.7, 0.34, D + 0.7, 0.17), mat.rim, [0, -0.4, 0], { parent: shell, cast: false });
  add(box(W + 0.4, 0.36, D + 0.4, 0.15), mat.base, [0, -0.25, 0], { parent: shell, cast: false });
  add(box(W, 0.12, D, 0.03), mat.concrete, [0, -0.06, 0], { parent: shell, cast: false });
  const coatGeo = box(W - 0.04, 0.02, D - 0.04, 0.01);
  coatGeo.translate((W - 0.04) / 2, 0, 0); // pivot on the left edge: scale.x sweeps the coat in
  const coat = add(coatGeo, mat.epoxy, [X0 + 0.02, 0.011, 0], { parent: shell, cast: false });
  coat.scale.x = 0.001;
  const sheen = add(new THREE.PlaneGeometry(0.5, D - 0.2), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(255,255,255,.9)'], [1, 'rgba(255,255,255,0)']]), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }), [X0, 0.04, 0], { parent: shell, cast: false, receive: false, rot: [-Math.PI / 2, 0, 0] });

  // back wall (solid) + left wall with a tall window towards the front
  const walls = new THREE.Group(); house.add(walls);
  add(box(W, H, T, 0.03), mat.wall, [0, H / 2, zb], { parent: walls });
  const wz0 = 0.5, wz1 = 3.3, wy0 = 0.8, wy1 = 3.2;
  add(box(T, H, wz0 - ZB, 0.03), mat.wall, [xl, H / 2, (ZB + wz0) / 2], { parent: walls });
  add(box(T, H, ZF - wz1, 0.03), mat.wall, [xl, H / 2, (wz1 + ZF) / 2], { parent: walls });
  add(box(T, wy0, wz1 - wz0, 0.02), mat.wall, [xl, wy0 / 2, (wz0 + wz1) / 2], { parent: walls });
  add(box(T, H - wy1, wz1 - wz0, 0.02), mat.wall, [xl, wy1 + (H - wy1) / 2, (wz0 + wz1) / 2], { parent: walls });
  const wzc = (wz0 + wz1) / 2, wyc = (wy0 + wy1) / 2;
  [[0.07, wy1 - wy0, wz0, wyc], [0.07, wy1 - wy0, wz1, wyc], [0.07, wy1 - wy0, wzc, wyc]].forEach(([w, h, zz, y]) => add(new THREE.BoxGeometry(0.16, h, w), mat.frame, [xl, y, zz], { parent: walls }));
  [wy0, wy1].forEach((y) => add(new THREE.BoxGeometry(0.16, 0.07, wz1 - wz0 + 0.07), mat.frame, [xl, y, wzc], { parent: walls }));
  add(new THREE.PlaneGeometry(wz1 - wz0, wy1 - wy0), mat.glass, [xl + 0.02, wyc, wzc], { parent: walls, cast: false, receive: false, rot: [0, Math.PI / 2, 0] });
  add(new THREE.BoxGeometry(W - 0.3, 0.12, 0.04), mat.trim, [0, 0.06, zb + 0.14], { parent: walls, cast: false });
  add(new THREE.BoxGeometry(0.04, 0.12, D - 0.3), mat.trim, [xl + 0.14, 0.06, 0], { parent: walls, cast: false });
  // plain ceiling slab (we only ever see its underside)
  add(box(W, 0.2, D, 0.02), mat.gypsum, [0, H + 0.1, 0], { parent: walls, cast: false });

  /* ---------- stage: false ceiling (tray, LED cove, downlights, ceiling fan) ---------- */
  const ceiling = new THREE.Group(); house.add(ceiling);
  const B = 1.2, CD = 0.32, cyB = H - CD / 2;
  add(box(W, CD, B, 0.02), mat.gypsum, [0, cyB, ZB + B / 2], { parent: ceiling, cast: false });
  add(box(B, CD, D - B, 0.02), mat.gypsum, [X0 + B / 2, cyB, B / 2], { parent: ceiling, cast: false });
  // hidden LED cove along the inner edge of the tray
  [[B / 2, H - 0.05, ZB + B + 0.04, W - B, 0.04, 0.04], [X0 + B + 0.04, H - 0.05, B / 2, 0.04, 0.04, D - B]]
    .forEach(([x, y, zz, w, h, d]) => add(new THREE.BoxGeometry(w, h, d), mat.cove, [x, y, zz], { parent: ceiling, cast: false }));
  // thin brass moulding inside the tray
  const mW = 5.2, mD = 4.2; // brass moulding ring around the fan
  [[0, -mD / 2, mW, 0.03], [0, mD / 2, mW, 0.03], [-mW / 2, 0, 0.03, mD], [mW / 2, 0, 0.03, mD]].forEach(([x, zz, w, d]) => add(new THREE.BoxGeometry(w, 0.02, d), mat.brass, [x + 0.2, H - 0.01, zz + 0.3], { parent: ceiling, cast: false }));
  // recessed downlights in the band
  const downMat = new THREE.MeshStandardMaterial({ color: '#fffaf0', emissive: '#ffe2b0', emissiveIntensity: 0, roughness: 0.3 });
  const downs = [];
  for (let x = X0 + 1.4; x < XR - 1; x += 1.9) downs.push([x, ZB + B / 2]);
  for (let zz = ZB + 1.9; zz < ZF - 1; zz += 1.9) downs.push([X0 + B / 2, zz]);
  downs.forEach(([x, zz]) => add(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 24), downMat, [x, H - CD - 0.01, zz], { parent: ceiling, cast: false }));
  // ceiling fan: canopy, rod, motor, five wooden blades, frosted light bowl
  const fan = new THREE.Group(); fan.position.set(0.2, H, 0.3); ceiling.add(fan);
  add(new THREE.CylinderGeometry(0.13, 0.16, 0.07, 32), mat.brass, [0, -0.035, 0], { parent: fan });
  add(new THREE.CylinderGeometry(0.022, 0.022, 0.55, 12), mat.brass, [0, -0.33, 0], { parent: fan });
  add(new THREE.CylinderGeometry(0.2, 0.25, 0.2, 32), mat.whiteGloss, [0, -0.68, 0], { parent: fan });
  add(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 32), mat.brass, [0, -0.79, 0], { parent: fan });
  const blades = new THREE.Group(); blades.position.y = -0.7; fan.add(blades);
  for (let k = 0; k < 5; k++) {
    const arm = new THREE.Group(); arm.rotation.y = (k * Math.PI * 2) / 5; blades.add(arm);
    add(box(0.32, 0.03, 0.07, 0.01), mat.brass, [0.36, 0, 0], { parent: arm });
    add(box(1.2, 0.04, 0.28, 0.015), mat.wood, [1.08, -0.01, 0], { parent: arm, rot: [0.22, 0, 0] });
  }
  const bowlMat = new THREE.MeshStandardMaterial({ color: '#fff6e6', emissive: '#ffd9a0', emissiveIntensity: 0, roughness: 0.3, transparent: true, opacity: 0.95 });
  add(new THREE.SphereGeometry(0.2, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bowlMat, [0, -0.8, 0], { parent: fan, cast: false });
  const trayLight = new THREE.RectAreaLight('#ffd9a0', 0, W - B - 1, D - B - 1);
  trayLight.position.set(B / 2, H - 0.08, B / 2); trayLight.lookAt(0, 0, 0);
  scene.add(trayLight);

  /* ---------- stage: feature walls (upholstered headboard wall + walnut wardrobe) ---------- */
  const feature = new THREE.Group(); house.add(feature);
  const BX = 0.3; // bed centre (x)
  add(box(4.8, H - 1.0, 0.08, 0.02), mat.wood, [BX, (H - 1.0) / 2, zb + 0.17], { parent: feature });
  const headFab = fabric('#c9cdbf');
  for (let i = 0; i < 11; i++) add(box(0.38, 1.55, 0.14, 0.06), headFab, [BX - 2.0 + i * 0.4, 1.3, zb + 0.27], { parent: feature });
  add(new THREE.BoxGeometry(4.6, 0.03, 0.04), mat.cove, [BX, H - 0.98, zb + 0.23], { parent: feature, cast: false });
  const halo = add(new THREE.PlaneGeometry(5.6, 3.8), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(255,214,150,0)'], [0.6, 'rgba(255,214,150,0)'], [0.74, 'rgba(255,214,150,.55)'], [1, 'rgba(255,214,150,0)']]), transparent: true, opacity: 0, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }), [BX, 1.55, zb + 0.13], { parent: feature, cast: false, receive: false });
  // wardrobe on the left wall: four walnut doors with brass pulls
  const wdx = X0 + T + 0.34, wdz = ZB + T + 1.6;
  add(box(0.66, H - 0.7, 2.9, 0.02), mat.wood, [wdx, (H - 0.7) / 2, wdz], { parent: feature });
  for (let k = 1; k < 4; k++) add(new THREE.BoxGeometry(0.02, H - 0.8, 0.015), mat.dark, [wdx + 0.335, (H - 0.7) / 2, wdz - 1.45 + k * 0.725], { parent: feature, cast: false });
  [-1.09, -0.36, 0.36, 1.09].forEach((dz, k) => add(new THREE.BoxGeometry(0.03, 0.7, 0.03), mat.brass, [wdx + 0.35, 1.7, wdz + dz + (k % 2 ? -0.28 : 0.28)], { parent: feature }));

  /* ---------- stage: decoration (bed, lamps, hanging lights, curtains, rug, art, plant, paint) ---------- */
  const decor = [];
  const piece = () => { const g = new THREE.Group(); house.add(g); decor.push(g); return g; };
  // wall decoration grows in place
  const deco = piece();
  const drape = (zz, w, material) => {
    const g = new THREE.PlaneGeometry(w, H - 0.5, 24, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 16) * 0.05);
    g.computeVertexNormals();
    return add(g, material, [xl + 0.3, (H - 0.5) / 2 + 0.05, zz], { parent: deco, cast: false, rot: [0, Math.PI / 2, 0] });
  };
  const drapeMat = new THREE.MeshStandardMaterial({ color: '#d8cdb8', roughness: 0.95, side: THREE.DoubleSide });
  drape(wz0 - 0.25, 0.8, drapeMat); drape(wz1 + 0.25, 0.8, drapeMat); drape(wzc, wz1 - wz0 - 0.2, mat.sheer);
  add(new THREE.CylinderGeometry(0.02, 0.02, wz1 - wz0 + 1.4, 8), mat.brass, [xl + 0.32, H - 0.42, wzc], { parent: deco, rot: [Math.PI / 2, 0, 0] });
  const artTex = canvasTex(256, 340, (g, w, h) => { const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, '#ede6d8'); grd.addColorStop(1, '#d6dccf'); g.fillStyle = grd; g.fillRect(0, 0, w, h); g.strokeStyle = '#2f6a4c'; g.lineWidth = 9; g.beginPath(); g.arc(w * 0.5, h * 0.42, w * 0.25, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#c9a25e'; g.fillRect(w * 0.2, h * 0.74, w * 0.6, 6); });
  add(box(1.05, 1.35, 0.05, 0.02), mat.dark, [3.9, 2.05, zb + 0.16], { parent: deco });
  add(new THREE.PlaneGeometry(0.93, 1.23), new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.8 }), [3.9, 2.05, zb + 0.19], { parent: deco, cast: false });

  const bed = piece();
  add(box(2.3, 0.34, 2.45, 0.05), mat.wood, [0, 0.19, 0], { parent: bed });
  add(box(2.12, 0.26, 2.25, 0.09), M('#f7f5f0', { roughness: 0.9 }), [0, 0.49, 0.02], { parent: bed });
  add(box(2.2, 0.12, 1.65, 0.07), fabric('#e6e1d6'), [0, 0.64, 0.38], { parent: bed });
  add(box(2.24, 0.07, 0.52, 0.03), fabric('#2f6a4c'), [0, 0.72, 0.95], { parent: bed });
  [-0.5, 0.5].forEach((x) => add(box(0.86, 0.34, 0.18, 0.09), mat.cream, [x, 0.8, -0.82], { parent: bed, rot: [-0.35, 0, 0] }));
  [-0.35, 0.35].forEach((x) => add(box(0.55, 0.3, 0.14, 0.08), fabric('#9fb8a8'), [x, 0.76, -0.6], { parent: bed, rot: [-0.3, 0, 0] }));
  bed.position.set(BX, 0.02, ZB + T + 1.3);

  const lamps = [];
  [-1.65, 1.65].forEach((dx) => {
    const g = piece();
    add(box(0.62, 0.5, 0.46, 0.04), mat.wood, [0, 0.27, 0], { parent: g });
    add(box(0.56, 0.03, 0.42, 0.01), mat.brass, [0, 0.53, 0], { parent: g });
    add(new THREE.CylinderGeometry(0.07, 0.1, 0.32, 24), mat.ceramic, [0.08, 0.7, -0.05], { parent: g });
    const shade = new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: '#ffcf87', emissiveIntensity: 0, roughness: 0.6, side: THREE.DoubleSide });
    add(new THREE.CylinderGeometry(0.14, 0.2, 0.26, 32, 1, true), shade, [0.08, 0.98, -0.05], { parent: g, cast: false });
    lamps.push(shade);
    g.position.set(BX + dx, 0.02, ZB + T + 0.42);
  });
  // two brass pendant lights hanging beside the bed
  const pendantGlow = new THREE.MeshStandardMaterial({ color: '#fff6e6', emissive: '#ffd08a', emissiveIntensity: 0, roughness: 0.2, transparent: true, opacity: 0.92 });
  [-1.65, 1.65].forEach((dx) => {
    const g = piece();
    add(new THREE.CylinderGeometry(0.006, 0.006, 1.25, 6), mat.dark, [0, -0.62, 0], { parent: g, cast: false });
    add(new THREE.SphereGeometry(0.17, 32, 24), pendantGlow, [0, -1.38, 0], { parent: g, cast: false });
    add(new THREE.TorusGeometry(0.17, 0.012, 8, 40), mat.brass, [0, -1.38, 0], { parent: g, rot: [Math.PI / 2, 0, 0] });
    add(new THREE.CylinderGeometry(0.05, 0.07, 0.08, 16), mat.brass, [0, -1.2, 0], { parent: g });
    g.position.set(BX + dx, H - CD, ZB + T + 0.55);
  });
  const rug = piece();
  add(box(3.6, 0.03, 2.8, 0.015), mat.rug, [0, 0.04, 0], { parent: rug, cast: false });
  rug.position.set(BX, 0, ZB + T + 2.1);
  const bench = piece();
  add(box(1.7, 0.16, 0.48, 0.07), fabric('#2f6a4c'), [0, 0.46, 0], { parent: bench });
  [[-0.75, -0.18], [0.75, -0.18], [-0.75, 0.18], [0.75, 0.18]].forEach(([x, zz]) => add(new THREE.CylinderGeometry(0.025, 0.02, 0.38, 8), mat.brass, [x, 0.19, zz], { parent: bench }));
  bench.position.set(BX, 0.02, ZB + T + 3.0);
  // indoor tree in the back-right corner
  const plant = piece();
  const potProfile = [[0, 0], [0.26, 0], [0.33, 0.06], [0.36, 0.5], [0.38, 0.62], [0.34, 0.64], [0.32, 0.6]].map(([a, b]) => new THREE.Vector2(a, b));
  add(new THREE.LatheGeometry(potProfile, 40), mat.ceramic, [0, 0, 0], { parent: plant });
  add(new THREE.CylinderGeometry(0.31, 0.31, 0.02, 32), mat.soil, [0, 0.58, 0], { parent: plant, cast: false });
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0.05, 1.2, 0.03), new THREE.Vector3(-0.06, 1.8, -0.02), new THREE.Vector3(0.04, 2.3, 0.02)]), 24, 0.045, 8), mat.bark, [0, 0, 0], { parent: plant });
  const leafGeo = new THREE.SphereGeometry(0.5, 10, 6); leafGeo.scale(0.2, 0.025, 0.42); leafGeo.translate(0, 0, 0.2);
  const leaves = new THREE.InstancedMesh(leafGeo, mat.leaf, 130);
  const dummy = new THREE.Object3D(), tint = new THREE.Color();
  const crowns = [[0.3, 2.0, 0.1, 0.42], [-0.32, 2.2, -0.08, 0.42], [0.18, 2.5, -0.15, 0.4], [0, 2.3, 0.05, 0.45]];
  for (let i = 0; i < 130; i++) {
    const [cx2, cy2, cz2, r] = crowns[i % crowns.length];
    const dir = new THREE.Vector3(rnd(-1, 1), rnd(-0.6, 1), rnd(-1, 1)).normalize();
    dummy.position.set(cx2 + dir.x * r * rnd(0.5, 1), cy2 + dir.y * r * rnd(0.5, 1), cz2 + dir.z * r * rnd(0.5, 1));
    dummy.lookAt(dummy.position.clone().add(dir)); dummy.rotateX(rnd(-0.6, 0.6)); dummy.rotateZ(rnd(-0.8, 0.8));
    const sc = rnd(0.75, 1.2); dummy.scale.set(sc, sc, sc); dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
    leaves.setColorAt(i, tint.setHSL(rnd(0.27, 0.33), rnd(0.3, 0.5), rnd(0.24, 0.38)));
  }
  leaves.castShadow = true; plant.add(leaves);
  plant.position.set(XR - 0.8, 0.02, ZB + 0.9);

  /* ---------- lights ---------- */
  scene.add(new THREE.HemisphereLight('#ffffff', '#e8dcc6', 0.65));
  const key = new THREE.DirectionalLight('#fff8ee', 1.3);
  key.position.set(10, 9, 16);
  scene.add(key);
  const sun = new THREE.DirectionalLight('#ffcf8a', 2.4);
  sun.position.set(-16, 7, 4);
  sun.target.position.set(0, 0, 1.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
  sun.shadow.bias = -0.0008; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const warm = new THREE.PointLight('#ffc779', 0, 8, 1.6); warm.position.set(BX, 2.2, ZB + 1.6);
  scene.add(warm);
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(W + 5, D + 5), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(0,0,0,.4)'], [0.7, 'rgba(0,0,0,.12)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2; contact.position.set(0, -0.58, 0);
  scene.add(contact);
  // warm sunbeam through the window
  const sunDir = new THREE.Vector3().subVectors(sun.target.position, sun.position).normalize();
  const toFloor = (p) => p.clone().addScaledVector(sunDir, (p.y - 0.04) / -sunDir.y);
  const rayMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color('#ffd79a') }, uOpacity: { value: 0.14 } },
    vertexShader: 'attribute float fade; varying float vFade; void main(){ vFade = fade; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uColor; uniform float uOpacity; varying float vFade; void main(){ gl_FragColor = vec4(uColor, uOpacity * pow(vFade, 1.6)); }',
  });
  {
    const top = [new THREE.Vector3(xl, wy1 - 0.05, wz0 + 0.05), new THREE.Vector3(xl, wy1 - 0.05, wz1 - 0.05), new THREE.Vector3(xl, wy0 + 0.05, wz1 - 0.05), new THREE.Vector3(xl, wy0 + 0.05, wz0 + 0.05)];
    const bot = top.map(toFloor);
    const pos = [], fade = [];
    for (let k = 0; k < 4; k++) { const a = top[k], b = top[(k + 1) % 4], c = bot[(k + 1) % 4], d = bot[k]; [a, b, c, a, c, d].forEach((v) => pos.push(v.x, v.y, v.z)); fade.push(1, 1, 0, 1, 0, 0); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('fade', new THREE.Float32BufferAttribute(fade, 1));
    scene.add(new THREE.Mesh(g, rayMat));
  }

  /* ---------- stages: bare room -> epoxy -> false ceiling -> walls -> decoration ---------- */
  const STAGES = ['shell', 'floor', 'ceiling', 'walls', 'decor'];
  const CAM = {
    shell: { x: -0.3, y: 2.2, z: -0.8, d: 24.5 },
    floor: { x: -0.3, y: 2.05, z: -0.6, d: 24 },
    ceiling: { x: -0.1, y: 2.45, z: -0.6, d: 24 },
    walls: { x: -0.4, y: 2.2, z: -1.0, d: 23.5 },
    decor: { x: -0.3, y: 2.2, z: -0.8, d: 24 },
  };
  Object.assign(focus, CAM.shell);
  ceiling.position.y = -0.6; ceiling.scale.set(1, 1, 1); ceiling.visible = false;
  feature.scale.set(1, 0.001, 1); feature.visible = false;
  decor.forEach((g) => { g.userData.y = g.position.y; g.visible = false; if (g === deco) g.scale.setScalar(0.001); else g.position.y += 2.2; });
  let fanSpeed = 0;
  const fanTarget = { v: 0 };

  function setStage(n, instant) {
    const d = instant ? 0 : 1;
    gsap.to(focus, { ...CAM[STAGES[n]], duration: 1.4 * d, ease: 'power3.inOut' });
    if (n >= 1) {
      gsap.to(coat.scale, { x: 1, duration: 1.8 * d, ease: 'power2.inOut',
        onUpdate: () => { sheen.position.x = X0 + coat.scale.x * (W - 0.04); sheen.material.opacity = coat.scale.x > 0.01 && coat.scale.x < 0.99 ? 0.8 : 0; } });
    }
    if (n >= 2) {
      ceiling.visible = true;
      gsap.to(ceiling.position, { y: 0, duration: 1.1 * d, ease: 'expo.out' });
      gsap.to(mat.cove, { emissiveIntensity: 2.4, duration: 1.2 * d, delay: 0.6 * d });
      gsap.to(downMat, { emissiveIntensity: 2.2, duration: 1 * d, delay: 0.8 * d });
      gsap.to(bowlMat, { emissiveIntensity: 1.4, duration: 1 * d, delay: 0.8 * d });
      gsap.to(trayLight, { intensity: 3.5, duration: 1.4 * d, delay: 0.6 * d });
      gsap.to(fanTarget, { v: 2.6, duration: 2.5 * d, delay: 0.9 * d });
    }
    if (n >= 3) {
      feature.visible = true;
      gsap.to(feature.scale, { y: 1, duration: 1.2 * d, ease: 'expo.out' });
      gsap.to(halo.material, { opacity: 1, duration: 1 * d, delay: 0.8 * d });
    }
    if (n >= 4) {
      const paint = new THREE.Color('#ddd0ba'), capPaint = new THREE.Color('#cdbb9f');
      gsap.to(mat.wall.color, { r: paint.r, g: paint.g, b: paint.b, duration: 1.2 * d });
      gsap.to(mat.wallCap.color, { r: capPaint.r, g: capPaint.g, b: capPaint.b, duration: 1.2 * d });
      gsap.to(lamps, { emissiveIntensity: 1.8, duration: 1 * d, delay: 1.0 * d });
      gsap.to(pendantGlow, { emissiveIntensity: 2.0, duration: 1 * d, delay: 1.0 * d });
      gsap.to(warm, { intensity: 4, duration: 1.4 * d, delay: 1.0 * d });
      decor.forEach((g, i) => {
        g.visible = true;
        if (g === deco) gsap.to(g.scale, { x: 1, y: 1, z: 1, duration: 0.9 * d, ease: 'power3.out' });
        else gsap.to(g.position, { y: g.userData.y, duration: 0.7 * d, delay: (0.3 + i * 0.08) * d, ease: 'back.out(1.3)' });
      });
    }
  }

  /* ---------- intro: the room assembles, then it is finished once ---------- */
  const intro = gsap.timeline({ delay: 0.3, paused: true });
  intro.from(shell.scale, { x: 0.001, z: 0.001, duration: 1, ease: 'expo.out' }, 0);
  intro.from(walls.position, { y: -6, duration: 1.1, ease: 'expo.out' }, 0.3);
  intro.from(house.rotation, { y: -0.3, duration: 2.4, ease: 'expo.out' }, 0);
  const play = (n) => { setStage(n); if (n < STAGES.length - 1) setTimeout(() => play(n + 1), n === 0 ? 300 : 2100); };

  /* ---------- sizing ---------- */
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.95 ? 40 : 30;
    const shift = w >= 900 ? w * 0.07 : 0; // move the room towards the right
    if (shift) camera.setViewOffset(w, h, -shift, 0, w, h); else camera.clearViewOffset();
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
    const dt = Math.min(clock.getDelta(), 0.05);
    const tt = clock.elapsedTime;
    target.set(focus.x, focus.y, focus.z);
    const dir = VIEW_DIR.clone().applyAxisAngle(UP, look.x * 0.18);
    camera.position.copy(target).addScaledVector(dir, focus.d);
    camera.position.y += -look.y * 0.5 + Math.sin(tt * 0.5) * 0.05;
    camera.lookAt(target);
    fanSpeed += (fanTarget.v - fanSpeed) * Math.min(1, dt * 2);
    blades.rotation.y += fanSpeed * dt;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  new IntersectionObserver((entries) => {
    running = entries[0].isIntersecting;
    if (running) {
      if (!started) {
        started = true;
        host.classList.add('is-ready');
        if (reduce) { setStage(STAGES.length - 1, true); gsap.globalTimeline.progress(1); fanTarget.v = 1.2; }
        else { setStage(0, true); intro.play(); intro.call(() => play(1), null, '+=0.1'); }
      }
      clock.getDelta();
      cancelAnimationFrame(raf);
      frame();
    }
  }, { threshold: 0.05 }).observe(host);
}
