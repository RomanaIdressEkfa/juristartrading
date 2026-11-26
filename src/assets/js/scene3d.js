/* ======================================================================
   Juri Star Trading — Three.js scenes
   <div data-scene="hero|heater|chiller|epoxy|pvc|interior" [data-dark]>
   Each scene renders only while on screen, follows the pointer slightly
   and keeps a static fallback (the inner .scene-fallback) if WebGL fails.
   ====================================================================== */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const GREEN = 0x0c9a4f, RED = 0x9aa39f, INK = 0x0e1a14;

function webgl() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

/* ---------------- textures ---------------- */
const ALL_TEX = []; // uploaded to the GPU up-front so texture swaps never flash black
const canvasTex = (w, h, draw, rep = [1, 1]) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...rep);
  t.anisotropy = 8;
  ALL_TEX.push(t);
  return t;
};

// Zigzag / chevron epoxy: horizontal bands of V shapes
const chevronTex = (colors = ['#0c9a4f', '#ffffff', '#dfe5e2', '#ffffff'], rep = [2, 2]) => canvasTex(512, 512, (g, w, h) => {
  const band = h / colors.length / 2;
  for (let i = -2; i < colors.length * 2 + 2; i++) {
    g.fillStyle = colors[((i % colors.length) + colors.length) % colors.length];
    g.beginPath();
    const y = i * band;
    g.moveTo(0, y); g.lineTo(w / 2, y + band * 1.6); g.lineTo(w, y);
    g.lineTo(w, y + band); g.lineTo(w / 2, y + band * 2.6); g.lineTo(0, y + band);
    g.closePath(); g.fill();
  }
}, rep);

const metallicTex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#b9c0c8'; g.fillRect(0, 0, w, h);
  const cols = ['#f2f2f0', '#c9ced2', '#e6dfcf', '#ffffff', '#aab1b6', '#dfe3e1'];
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 30 + Math.random() * 120;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, cols[i % cols.length] + 'cc'); grd.addColorStop(1, cols[i % cols.length] + '00');
    g.fillStyle = grd; g.beginPath(); g.ellipse(x, y, r, r * 0.45, Math.random() * Math.PI, 0, Math.PI * 2); g.fill();
  }
});

const seaTex = () => canvasTex(512, 512, (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, w, h);
  grd.addColorStop(0, '#ecd9a8'); grd.addColorStop(0.35, '#7fd8e6'); grd.addColorStop(0.7, '#1b8fc0'); grd.addColorStop(1, '#063e6b');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3;
  for (let i = 0; i < 9; i++) {
    g.beginPath();
    for (let x = 0; x <= w; x += 8) g.lineTo(x, 120 + i * 40 + Math.sin(x / 40 + i) * 10 + x * 0.25);
    g.stroke();
  }
});

const woodTex = (tone = 0) => canvasTex(512, 128, (g, w, h) => {
  const base = [['#a9764a', '#8a5a33'], ['#c49a6c', '#a57b4f'], ['#7b6a5d', '#5f5046']][tone % 3];
  g.fillStyle = base[0]; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = base[1] + (Math.random() > 0.5 ? '88' : '44');
    g.lineWidth = 1 + Math.random() * 2;
    g.beginPath();
    const y = Math.random() * h;
    for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / 60 + i) * 4);
    g.stroke();
  }
});

/* ---------------- materials ---------------- */
const mat = {
  white: () => new THREE.MeshPhysicalMaterial({ color: 0xf4f6f5, roughness: 0.25, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.15 }),
  steel: () => new THREE.MeshStandardMaterial({ color: 0xd9dee2, roughness: 0.18, metalness: 0.95 }),
  dark: () => new THREE.MeshStandardMaterial({ color: 0x2b3230, roughness: 0.45, metalness: 0.3 }),
  green: () => new THREE.MeshPhysicalMaterial({ color: GREEN, roughness: 0.3, metalness: 0.2, clearcoat: 0.8 }),
  red: () => new THREE.MeshPhysicalMaterial({ color: RED, roughness: 0.3, metalness: 0.2, clearcoat: 0.8 }),
  blue: () => new THREE.MeshPhysicalMaterial({ color: 0x2b8fd6, roughness: 0.3, metalness: 0.2, clearcoat: 0.8 }),
  glass: () => new THREE.MeshPhysicalMaterial({ color: 0xdff6ff, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.45, depthWrite: false }),
  glossy: (map) => new THREE.MeshPhysicalMaterial({ map, roughness: 0.12, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05 }),
};

const box = (w, h, d, m, r = 0.06) => { const o = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), m); o.castShadow = o.receiveShadow = true; return o; };
const cyl = (rt, rb, h, m, seg = 40) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.castShadow = o.receiveShadow = true; return o; };

/** Pipe along a list of points (rounded corners). */
const pipe = (pts, r, m) => {
  const curve = new THREE.CurvePath();
  for (let i = 0; i < pts.length - 1; i++) curve.add(new THREE.LineCurve3(new THREE.Vector3(...pts[i]), new THREE.Vector3(...pts[i + 1])));
  const g = new THREE.Group();
  curve.curves.forEach((c) => {
    const len = c.v1.distanceTo(c.v2);
    const p = cyl(r, r, len, m, 16);
    p.position.copy(c.v1).add(c.v2).multiplyScalar(0.5);
    p.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.v2.clone().sub(c.v1).normalize());
    g.add(p);
  });
  pts.slice(1, -1).forEach((pt) => { const j = new THREE.Mesh(new THREE.SphereGeometry(r * 1.25, 16, 12), m); j.position.set(...pt); j.castShadow = true; g.add(j); });
  return g;
};

/** Particle cloud: drift up (heat) or down (cool). */
const particles = (count, color, area, dir = 1, size = 0.06) => {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * area[0];
    pos[i * 3 + 1] = Math.random() * area[1];
    pos[i * 3 + 2] = (Math.random() - 0.5) * area[2];
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sprite = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, map: sprite, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.userData.tick = (dt) => {
    const a = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      a[i * 3 + 1] += dir * dt * (0.25 + (i % 7) * 0.05);
      a[i * 3] += Math.sin(performance.now() / 900 + i) * dt * 0.05;
      if (dir > 0 && a[i * 3 + 1] > area[1]) a[i * 3 + 1] = 0;
      if (dir < 0 && a[i * 3 + 1] < 0) a[i * 3 + 1] = area[1];
    }
    geo.attributes.position.needsUpdate = true;
  };
  return pts;
};

/* ---------------- models ---------------- */
function heaterSystem() {
  const g = new THREE.Group();
  const ticks = [];
  // Tank
  const tank = cyl(0.62, 0.62, 2.1, mat.white(), 48); tank.position.set(0, 1.15, 0); g.add(tank);
  const topCap = cyl(0.64, 0.64, 0.14, mat.dark()); topCap.position.set(0, 2.24, 0); g.add(topCap);
  const baseCap = cyl(0.66, 0.6, 0.16, mat.dark()); baseCap.position.set(0, 0.08, 0); g.add(baseCap);
    const band2 = cyl(0.625, 0.625, 0.04, mat.green()); band2.position.set(0, 1.8, 0); g.add(band2);
  // Display panel (glows)
  const panel = box(0.42, 0.26, 0.06, new THREE.MeshStandardMaterial({ color: INK, emissive: 0xffffff, emissiveIntensity: 0.15, roughness: 0.3 }), 0.03);
  panel.position.set(0, 1.35, 0.62); g.add(panel);
  // Hot (red) out, cold (blue) in
  const hot = pipe([[0.25, 2.3, 0], [0.25, 2.6, 0], [1.35, 2.6, 0], [1.35, 0.55, 0]], 0.06, mat.steel()); g.add(hot);
  const cold = pipe([[-1.35, 1.4, 0], [-1.35, 0.35, 0], [-0.62, 0.35, 0]], 0.06, mat.steel()); g.add(cold);
  // Circulation pump on the hot line
  const pump = new THREE.Group();
  const body = cyl(0.26, 0.26, 0.34, mat.white()); body.rotation.z = Math.PI / 2; pump.add(body);
  const motor = cyl(0.2, 0.2, 0.3, mat.dark()); motor.rotation.x = Math.PI / 2; motor.position.z = 0.28; pump.add(motor);
  const fan = box(0.05, 0.3, 0.04, mat.steel(), 0.02); fan.position.z = 0.45; pump.add(fan);
  pump.position.set(1.35, 0.6, 0); g.add(pump);
  ticks.push((dt) => { fan.rotation.z += dt * 12; });
  // Filter on the cold line
  const filt = new THREE.Group();
  const housing = cyl(0.2, 0.2, 0.65, mat.glass()); filt.add(housing);
  const cart = cyl(0.12, 0.12, 0.55, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })); filt.add(cart);
  const head = cyl(0.24, 0.24, 0.1, mat.steel()); head.position.y = 0.36; filt.add(head);
  filt.position.set(-1.35, 1.0, 0); g.add(filt);
  // Heat shimmer
  const heat = particles(40, 0xbdbdbd, [0.5, 1.6, 0.5], 1, 0.09); heat.position.set(1.35, 2.7, 0); g.add(heat);
  ticks.push(heat.userData.tick);
  g.userData.tick = (dt) => ticks.forEach((f) => f(dt));
  return g;
}

function chillerSystem() {
  const g = new THREE.Group();
  const ticks = [];
  // Water tank (horizontal)
  const tank = cyl(0.75, 0.75, 2.2, mat.white(), 48);
  tank.rotation.z = Math.PI / 2; tank.position.set(-0.6, 0.95, -0.4); g.add(tank);
  [-1.6, 0.4].forEach((x) => { const s = box(0.25, 0.3, 1.2, mat.dark(), 0.04); s.position.set(x, 0.15, -0.4); g.add(s); });
  const ring1 = cyl(0.77, 0.77, 0.05, mat.steel()); ring1.rotation.z = Math.PI / 2; ring1.position.set(-1.3, 0.95, -0.4); g.add(ring1);
  const ring2 = ring1.clone(); ring2.position.x = 0.1; g.add(ring2);
  // Chiller unit
  const unit = new THREE.Group();
  unit.add(box(1.3, 1.0, 1.0, mat.white(), 0.08));
  const grille = box(1.1, 0.05, 0.85, mat.dark(), 0.02); grille.position.y = 0.5; unit.add(grille);
  const fanG = new THREE.Group(); fanG.position.y = 0.55;
  for (let i = 0; i < 4; i++) { const b = box(0.36, 0.02, 0.1, mat.steel(), 0.01); b.position.x = 0.18; const piv = new THREE.Group(); piv.rotation.y = (i * Math.PI) / 2; piv.add(b); fanG.add(piv); }
  unit.add(fanG);
  const stripe = box(1.32, 0.12, 1.02, mat.green(), 0.03); stripe.position.y = -0.2; unit.add(stripe);
  const disp = box(0.34, 0.18, 0.04, new THREE.MeshStandardMaterial({ color: INK, emissive: 0xffffff, emissiveIntensity: 0.15 }), 0.02); disp.position.set(0.3, 0.15, 0.51); unit.add(disp);
  unit.position.set(1.35, 0.5, 0.55); g.add(unit);
  ticks.push((dt) => { fanG.rotation.y += dt * 9; });
  // Supply/return lines
  g.add(pipe([[0.5, 0.95, -0.4], [0.75, 0.95, -0.4], [0.75, 0.75, 0.55]], 0.055, mat.steel()));
  g.add(pipe([[0.5, 0.65, -0.4], [0.62, 0.65, -0.4], [0.62, 0.3, 0.55], [0.7, 0.3, 0.55]], 0.055, mat.steel()));
  // Cool mist
  const snow = particles(50, 0xc8c8c8, [3.2, 2.6, 2.2], -1, 0.08); snow.position.set(0, 0.2, 0); g.add(snow);
  ticks.push(snow.userData.tick);
  g.userData.tick = (dt) => ticks.forEach((f) => f(dt));
  return g;
}

function epoxySlab(size = 3.6) {
  const textures = [chevronTex(), metallicTex(), seaTex(), chevronTex(['#0e1a14', '#ffffff', '#c9d1cd', '#ffffff'], [2, 2])];
  const m = mat.glossy(textures[0]);
  const slab = box(size, 0.18, size, m, 0.06);
  slab.position.y = -0.09;
  let i = 0, t = 0;
  slab.userData.tick = (dt) => {
    t += dt;
    if (m.map) m.map.offset.y -= dt * 0.03;
    if (t > 4) { t = 0; i = (i + 1) % textures.length; m.map = textures[i]; m.needsUpdate = true; slab.userData.pulse = 1; }
    if (slab.userData.pulse > 0) { slab.userData.pulse = Math.max(0, slab.userData.pulse - dt * 1.5); slab.scale.y = 1 + slab.userData.pulse * 0.8; }
  };
  return slab;
}

function pvcFloor() {
  const g = new THREE.Group();
  const planks = [];
  const tex = [woodTex(0), woodTex(1), woodTex(0)];
  const rows = 7, len = 1.6, wid = 0.42;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (len / 2);
    for (let c = -1; c < 3; c++) {
      const x = c * len - off - 0.8;
      if (x < -2.4 || x > 2.4) continue;
      const p = box(len - 0.03, 0.08, wid - 0.03, new THREE.MeshPhysicalMaterial({ map: tex[(r + c + 3) % 3], roughness: 0.45, clearcoat: 0.4 }), 0.02);
      p.position.set(x, 0, r * wid - (rows * wid) / 2 + wid / 2);
      p.userData.home = p.position.clone();
      planks.push(p); g.add(p);
    }
  }
  // Click-lock animation: planks drop in one by one, then lift away and repeat
  let t = 0;
  g.userData.tick = (dt) => {
    t = (t + dt) % 9;
    planks.forEach((p, i) => {
      const start = i * 0.18;
      const k = Math.min(1, Math.max(0, (t - start) / 0.5));
      const e = 1 - Math.pow(1 - k, 3);
      const out = t > 7.5 ? Math.min(1, (t - 7.5) / 0.8) : 0;
      p.position.y = p.userData.home.y + (1 - e) * 1.6 + out * 0.6;
      p.rotation.z = (1 - e) * 0.25;
      p.material.opacity = 1 - out;
      p.material.transparent = out > 0;
    });
  };
  return g;
}

function interiorRoom() {
  const g = new THREE.Group();
  const floor = box(4.2, 0.1, 4.2, new THREE.MeshPhysicalMaterial({ map: woodTex(1), roughness: 0.4, clearcoat: 0.5 }), 0.02);
  floor.material.map.repeat.set(2, 8); floor.position.y = -0.05; g.add(floor);
  const wallM = new THREE.MeshStandardMaterial({ color: 0xf3eee6, roughness: 0.9 });
  const back = box(4.2, 2.8, 0.12, wallM, 0.01); back.position.set(0, 1.4, -2.05); g.add(back);
  const side = box(0.12, 2.8, 4.2, wallM, 0.01); side.position.set(-2.05, 1.4, 0); g.add(side);
  // Fluted wall panel (green slats) on the back wall
  for (let i = 0; i < 16; i++) { const s = box(0.1, 2.2, 0.06, new THREE.MeshStandardMaterial({ color: 0xe6e6e6, roughness: 0.6 }), 0.02); s.position.set(-0.75 + i * 0.12, 1.25, -1.96); g.add(s); }
  // TV / feature
  const tv = box(1.3, 0.72, 0.05, new THREE.MeshStandardMaterial({ color: 0x0a0f0d, roughness: 0.2, metalness: 0.5 }), 0.02); tv.position.set(0.15, 1.4, -1.9); g.add(tv);
  // Gypsum bulkhead with glowing cove
  const bulk = box(4.2, 0.22, 0.8, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }), 0.02); bulk.position.set(0, 2.7, -1.6); g.add(bulk);
  const cove = box(4.0, 0.03, 0.05, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe2a8, emissiveIntensity: 1.5 }), 0.01); cove.position.set(0, 2.58, -1.18); g.add(cove);
  const coveLight = new THREE.PointLight(0xffd9a0, 4, 4); coveLight.position.set(0, 2.4, -1.2); g.add(coveLight);
  // Sofa against the side wall, facing into the room
  const sofaM = new THREE.MeshStandardMaterial({ color: 0xece6dc, roughness: 0.85 });
  const sofa = new THREE.Group();
  const seat = box(2.2, 0.4, 0.9, sofaM, 0.12); seat.position.set(0, 0.3, 0); sofa.add(seat);
  const backrest = box(2.2, 0.55, 0.25, sofaM, 0.12); backrest.position.set(0, 0.7, -0.42); sofa.add(backrest);
  [-1.1, 1.1].forEach((x) => { const arm = box(0.22, 0.55, 0.9, sofaM, 0.1); arm.position.set(x, 0.45, 0); sofa.add(arm); });
  const pillow = box(0.45, 0.4, 0.14, new THREE.MeshStandardMaterial({ color: 0xbdbdbd, roughness: 0.9 }), 0.1); pillow.position.set(-0.6, 0.68, -0.22); pillow.rotation.z = 0.15; sofa.add(pillow);
  const pillow2 = box(0.45, 0.4, 0.14, mat.green(), 0.1); pillow2.position.set(0.6, 0.68, -0.22); pillow2.rotation.z = -0.15; sofa.add(pillow2);
  sofa.rotation.y = Math.PI / 2; sofa.position.set(-1.45, 0, 0.1); g.add(sofa);
  // Coffee table
  const table = box(0.6, 0.08, 1.1, mat.dark(), 0.03); table.position.set(-0.3, 0.38, 0.1); g.add(table);
  [[-0.5, -0.35], [-0.1, -0.35], [-0.5, 0.55], [-0.1, 0.55]].forEach(([x, z]) => { const l = cyl(0.025, 0.025, 0.34, mat.steel(), 8); l.position.set(x, 0.17, z); g.add(l); });
  // Pendant
  const cord = cyl(0.008, 0.008, 0.6, mat.dark(), 6); cord.position.set(1.4, 2.3, -0.3); g.add(cord);
  const shade = cyl(0.05, 0.22, 0.22, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe2a8, emissiveIntensity: 0.6 })); shade.position.set(1.4, 1.95, -0.3); g.add(shade);
  let t = 0;
  g.userData.tick = (dt) => { t += dt; cove.material.emissiveIntensity = 1.2 + Math.sin(t * 1.5) * 0.4; coveLight.intensity = 3.5 + Math.sin(t * 1.5) * 1; };
  return g;
}

/* ---------------- diorama kit (matches the hero room) ---------------- */
const wallMat = () => new THREE.MeshStandardMaterial({ color: 0xece4d6, roughness: 0.92 });
const tileTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#f4f3ef'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(120,120,110,.25)'; g.lineWidth = 2;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.stroke(); }
}, [3, 2]);

/** White plinth with a green rim, like the hero room. */
function plinth(root, w, d) {
  const g = new THREE.Group();
  const rimM = new THREE.MeshStandardMaterial({ color: GREEN, roughness: 0.45 });
  const baseM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const rim = box(w + 0.34, 0.16, d + 0.34, rimM, 0.08); rim.position.y = -0.3; rim.castShadow = false; g.add(rim);
  const base = box(w + 0.2, 0.2, d + 0.2, baseM, 0.07); base.position.y = -0.2; base.castShadow = false; g.add(base);
  root.add(g);
  return g;
}

/** Back + left walls (cut-away corner). */
function corner(root, w, d, h, mat = wallMat()) {
  const g = new THREE.Group();
  const back = box(w, h, 0.12, mat, 0.02); back.position.set(0, h / 2, -d / 2 + 0.06); g.add(back);
  const left = box(0.12, h, d, mat, 0.02); left.position.set(-w / 2 + 0.06, h / 2, 0); g.add(left);
  root.add(g);
  return g;
}

/** Beads of water travelling along a pipe route (glowing dots). */
function flow(pts, count, color, r = 0.08, speed = 0.3) {
  const path = new THREE.CurvePath();
  for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(new THREE.Vector3(...pts[i]), new THREE.Vector3(...pts[i + 1])));
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 12, 8), new THREE.MeshBasicMaterial({ color }), count);
  const m4 = new THREE.Matrix4();
  let t = 0;
  const tick = (dt) => {
    t += dt * speed;
    for (let i = 0; i < count; i++) { const p = path.getPointAt((t + i / count) % 1); m4.makeTranslation(p.x, p.y, p.z); mesh.setMatrixAt(i, m4); }
    mesh.instanceMatrix.needsUpdate = true;
  };
  tick(0);
  return { mesh, tick };
}

function pumpRoom() {
  const g = new THREE.Group();
  const ticks = [];
  const floor = box(4.4, 0.08, 3.2, new THREE.MeshPhysicalMaterial({ color: 0xdfe4e1, roughness: 0.25, clearcoat: 0.8 }), 0.03); floor.position.y = -0.04; g.add(floor);
  // control panel with blinking LEDs
  const panel = box(0.9, 1.1, 0.22, mat.white(), 0.04); panel.position.set(-1.35, 1.35, -1.38); g.add(panel);
  const screen = box(0.5, 0.28, 0.02, new THREE.MeshStandardMaterial({ color: INK, emissive: GREEN, emissiveIntensity: 0.6 }), 0.01); screen.position.set(-1.35, 1.6, -1.26); g.add(screen);
  const leds = [0, 1, 2].map((i) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), new THREE.MeshStandardMaterial({ color: 0x9ff0c0, emissive: GREEN, emissiveIntensity: 1 })); l.position.set(-1.55 + i * 0.2, 1.22, -1.26); g.add(l); return l; });
  ticks.push((dt, t) => leds.forEach((l, i) => { l.material.emissiveIntensity = (Math.sin(t * 3 + i * 1.7) > 0.2) ? 1.6 : 0.15; }));
  // skid + two vertical multistage pumps
  const skid = box(2.0, 0.1, 1.0, mat.dark(), 0.03); skid.position.set(0.1, 0.05, 0.05); g.add(skid);
  const pumpGreen = new THREE.MeshPhysicalMaterial({ color: GREEN, roughness: 0.35, clearcoat: 0.6 });
  const fans = [];
  [-0.4, 0.55].forEach((x) => {
    const foot = box(0.42, 0.12, 0.42, mat.dark(), 0.03); foot.position.set(x, 0.16, 0.05); g.add(foot);
    const body = cyl(0.17, 0.17, 0.7, mat.steel(), 32); body.position.set(x, 0.57, 0.05); g.add(body);
    const motor = cyl(0.2, 0.2, 0.5, pumpGreen, 32); motor.position.set(x, 1.17, 0.05); g.add(motor);
    const cap = cyl(0.21, 0.21, 0.06, mat.dark(), 32); cap.position.set(x, 1.45, 0.05); g.add(cap);
    const fan = new THREE.Group(); fan.position.set(x, 1.49, 0.05);
    for (let k = 0; k < 3; k++) { const b2 = box(0.3, 0.015, 0.05, mat.steel(), 0.005); const piv = new THREE.Group(); piv.rotation.y = (k * Math.PI * 2) / 3; b2.position.x = 0.1; piv.add(b2); fan.add(piv); }
    g.add(fan); fans.push(fan);
    g.add(pipe([[x, 0.4, 0.05], [x, 0.4, 0.55]], 0.06, mat.steel()));
    g.add(pipe([[x, 0.75, 0.05], [x, 0.75, -0.45]], 0.06, mat.steel()));
  });
  ticks.push((dt) => fans.forEach((f) => { f.rotation.y += dt * 14; }));
  // manifolds, pressure vessel and riser
  g.add(pipe([[-0.7, 0.4, 0.55], [1.5, 0.4, 0.55]], 0.07, mat.steel()));
  g.add(pipe([[-0.7, 0.75, -0.45], [-1.9, 0.75, -0.45], [-1.9, 0.2, -0.45]], 0.07, mat.steel()));
  const vessel = new THREE.Group();
  const vb = cyl(0.3, 0.3, 0.7, pumpGreen, 32); vb.position.y = 0.75; vessel.add(vb);
  const vt = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), pumpGreen); vt.position.y = 1.1; vt.castShadow = true; vessel.add(vt);
  const vbot = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), pumpGreen); vbot.position.y = 0.4; vessel.add(vbot);
  [[-0.2, -0.2], [0.2, -0.2], [0, 0.22]].forEach(([dx, dz]) => { const leg = cyl(0.025, 0.025, 0.3, mat.dark(), 8); leg.position.set(dx, 0.15, dz); vessel.add(leg); });
  vessel.position.set(1.55, 0, 0.1); g.add(vessel);
  const riserPts = [[1.5, 0.4, 0.55], [1.9, 0.4, 0.55], [1.9, 0.4, -1.3], [1.9, 2.5, -1.3]];
  g.add(pipe(riserPts, 0.07, mat.steel()));
  const fl = flow(riserPts, 12, 0x5fc3ff, 0.09, 0.35); g.add(fl.mesh); ticks.push(fl.tick);
  // pressure gauge with a wobbling needle
  const gauge = new THREE.Group();
  const face = cyl(0.17, 0.17, 0.05, mat.white(), 32); face.rotation.x = Math.PI / 2; gauge.add(face);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 8, 32), mat.steel()); gauge.add(ring);
  const needle = box(0.02, 0.13, 0.01, new THREE.MeshStandardMaterial({ color: GREEN }), 0.005); needle.geometry.translate(0, 0.06, 0); needle.position.z = 0.03; gauge.add(needle);
  gauge.position.set(1.9, 1.5, -1.12); g.add(gauge);
  ticks.push((dt, t) => { needle.rotation.z = -0.6 + Math.sin(t * 1.3) * 0.25; });
  g.userData.tick = (dt, t) => ticks.forEach((f) => f(dt, t));
  return g;
}

function maintenanceSite() {
  const g = new THREE.Group();
  const ticks = [];
  const ground = box(4.6, 0.08, 3.4, new THREE.MeshStandardMaterial({ color: 0xe7e4dd, roughness: 0.9 }), 0.03); ground.position.y = -0.04; g.add(ground);
  // small building: older beige facade
  const old = new THREE.MeshStandardMaterial({ color: 0xd6c7ab, roughness: 0.95 });
  const bld = box(3.0, 2.7, 1.3, old, 0.03); bld.position.set(-0.4, 1.35, -0.95); g.add(bld);
  const parapet = box(3.1, 0.12, 1.4, mat.white(), 0.02); parapet.position.set(-0.4, 2.76, -0.95); g.add(parapet);
  // fresh paint sweeping up the facade (pivot at the bottom)
  const fresh = new THREE.MeshStandardMaterial({ color: 0xf7f5f0, roughness: 0.8 });
  const coatGeo = new THREE.BoxGeometry(2.98, 2.66, 0.02); coatGeo.translate(0, 1.33, 0);
  const coat = new THREE.Mesh(coatGeo, fresh); coat.position.set(-0.4, 0.02, -0.29); coat.receiveShadow = true; g.add(coat);
  // windows + door on top of the paint
  const glass = new THREE.MeshStandardMaterial({ color: 0x1e2a26, roughness: 0.15, metalness: 0.4 });
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { const w = box(0.55, 0.6, 0.04, glass, 0.02); w.position.set(-1.35 + c * 0.95, 1.15 + r * 0.95, -0.27); g.add(w); }
  const door = box(0.6, 0.85, 0.04, new THREE.MeshStandardMaterial({ color: 0x6b5a49, roughness: 0.5 }), 0.02); door.position.set(-0.4, 0.43, -0.27); g.add(door);
  // paint roller riding the top edge of the fresh coat
  const roller = new THREE.Group();
  const drum = cyl(0.08, 0.08, 0.5, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), 16); drum.rotation.z = Math.PI / 2; roller.add(drum);
  const handle = cyl(0.015, 0.015, 0.7, mat.dark(), 8); handle.rotation.x = 0.5; handle.position.set(0, -0.32, 0.18); roller.add(handle);
  roller.position.set(0.55, 0.1, -0.18); g.add(roller);
  // scaffold in front of the right half
  const sc = new THREE.MeshStandardMaterial({ color: 0x9aa39f, metalness: 0.6, roughness: 0.4 });
  [[0.15, -0.1], [1.05, -0.1], [0.15, 0.35], [1.05, 0.35]].forEach(([x, z]) => { const p2 = cyl(0.025, 0.025, 2.4, sc, 8); p2.position.set(x, 1.2, z); g.add(p2); });
  [0.9, 1.8].forEach((y) => { const plank = box(1.05, 0.05, 0.5, new THREE.MeshStandardMaterial({ color: 0xc49a6c, roughness: 0.8 }), 0.01); plank.position.set(0.6, y, 0.12); g.add(plank); });
  // ladder, toolbox, cones
  const ladder = new THREE.Group();
  [-0.17, 0.17].forEach((x) => { const rail = box(0.04, 2.0, 0.04, sc, 0.01); rail.position.set(x, 1.0, 0); ladder.add(rail); });
  for (let i = 0; i < 6; i++) { const rung = box(0.34, 0.03, 0.03, sc, 0.01); rung.position.set(0, 0.25 + i * 0.32, 0); ladder.add(rung); }
  ladder.position.set(-1.85, 0, -0.1); ladder.rotation.x = -0.18; g.add(ladder);
  const tb = new THREE.Group();
  tb.add(box(0.6, 0.28, 0.3, new THREE.MeshPhysicalMaterial({ color: GREEN, roughness: 0.4, clearcoat: 0.5 }), 0.04));
  const hdl = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 24, Math.PI), mat.dark()); hdl.position.y = 0.14; tb.add(hdl);
  tb.position.set(-0.9, 0.14, 0.95); g.add(tb);
  [[1.6, 1.1], [1.95, 0.6]].forEach(([x, z]) => { const cone = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 24), new THREE.MeshStandardMaterial({ color: GREEN, roughness: 0.5 })); cone.position.set(x, 0.21, z); cone.castShadow = true; g.add(cone); const band = cyl(0.09, 0.105, 0.06, mat.white(), 24); band.position.set(x, 0.24, z); g.add(band); });
  // floating wrench
  const wrench = new THREE.Group();
  wrench.add(box(0.12, 0.7, 0.05, mat.steel(), 0.02));
  const jaw = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.05, 10, 24, Math.PI * 1.4), mat.steel()); jaw.position.y = 0.42; jaw.rotation.z = -Math.PI * 0.2; wrench.add(jaw);
  wrench.position.set(0.0, 1.0, 0.95); g.add(wrench);
  let t = 0;
  g.userData.tick = (dt) => {
    t = (t + dt) % 8;
    const k = Math.min(1, t / 5.5);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const fade = t > 7 ? (t - 7) : 0;
    coat.scale.y = Math.max(0.001, e * (1 - fade));
    roller.position.y = 0.1 + e * 2.55 * (1 - fade);
    drum.rotation.x += dt * 6;
    wrench.rotation.y += dt * 1.2;
    wrench.position.y = 1.0 + Math.sin(t * 1.6) * 0.08;
  };
  return g;
}

/* ---------------- "How it works" journey: 4 stations, camera glides between them ---------------- */
const easeOut = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
const easeBack = (k) => { k = Math.min(1, Math.max(0, k)); const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const seg = (k, a, b) => Math.min(1, Math.max(0, (k - a) / (b - a)));

const labelTex = (txt) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 6, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0c9a4f'; g.font = '800 120px Inter, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(txt, w / 2, h / 2 + 6);
});

function stationPad(n) {
  const g = new THREE.Group();
  const pad = cyl(1.02, 1.08, 0.12, new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, clearcoat: 0.6 }), 64); pad.position.y = 0.06; g.add(pad);
  const glowM = new THREE.MeshStandardMaterial({ color: 0x9ff0c0, emissive: GREEN, emissiveIntensity: 0.2, roughness: 0.3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.035, 12, 96), glowM); ring.rotation.x = Math.PI / 2; ring.position.y = 0.12; g.add(ring);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.012, 8, 96), glowM); inner.rotation.x = Math.PI / 2; inner.position.y = 0.125; g.add(inner);
  const badge = new THREE.Mesh(new THREE.CircleGeometry(0.2, 40), new THREE.MeshBasicMaterial({ map: labelTex('0' + n), transparent: true }));
  badge.position.set(0.62, 0.13, 0.62); badge.rotation.x = -Math.PI / 2; g.add(badge);
  // pulse wave on the pad when active
  const waveM = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0, depthWrite: false });
  const wave = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.0, 96), waveM); wave.rotation.x = -Math.PI / 2; wave.position.y = 0.13; g.add(wave);
  g.userData.glow = (on, t) => {
    glowM.emissiveIntensity += ((on ? 1.4 : 0.15) - glowM.emissiveIntensity) * 0.08;
    const p = (t * 0.6) % 1;
    wave.scale.setScalar(1 + p * 0.6); waveM.opacity = on ? (1 - p) * 0.35 : 0;
  };
  return g;
}

function phoneStation() {
  const g = new THREE.Group();
  const phone = new THREE.Group();
  phone.add(box(0.8, 1.56, 0.1, new THREE.MeshPhysicalMaterial({ color: 0x1a211e, roughness: 0.25, metalness: 0.6, clearcoat: 1 }), 0.11));
  const scr = box(0.7, 1.4, 0.02, new THREE.MeshStandardMaterial({ color: 0xeef5f1, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.4 }), 0.07); scr.position.z = 0.055; phone.add(scr);
  const head = box(0.7, 0.2, 0.025, new THREE.MeshStandardMaterial({ color: GREEN, emissive: GREEN, emissiveIntensity: 0.25 }), 0.03); head.position.set(0, 0.6, 0.062); phone.add(head);
  const avatar = new THREE.Mesh(new THREE.CircleGeometry(0.055, 24), new THREE.MeshBasicMaterial({ color: 0xffffff })); avatar.position.set(-0.24, 0.6, 0.077); phone.add(avatar);
  const notif = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 14), new THREE.MeshStandardMaterial({ color: 0xe0262f, emissive: 0xe0262f, emissiveIntensity: 0.5, roughness: 0.3 })); notif.position.set(0.38, 0.76, 0.05); phone.add(notif); // logo red: new message
  const bubbles = [[-0.1, 0.32, 0.42, 0xffffff], [0.12, 0.1, 0.38, 0xc9f2d8], [-0.08, -0.13, 0.46, 0xffffff], [0.14, -0.36, 0.34, 0xc9f2d8]].map(([x, y, w, c]) => {
    const b = box(w, 0.15, 0.03, new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }), 0.06);
    b.position.set(x, y, 0.075); b.scale.setScalar(0.001); phone.add(b); return b;
  });
  // photo + location pin bubble
  const pin = new THREE.Group();
  const pinHead = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 14), mat.green()); pinHead.position.y = 0.05; pin.add(pinHead);
  const pinTip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.09, 20), mat.green()); pinTip.rotation.x = Math.PI; pin.add(pinTip);
  pin.position.set(0.14, -0.36, 0.12); pin.scale.setScalar(0.001); phone.add(pin);
  phone.position.set(0, 1.05, 0); phone.rotation.set(-0.12, -0.38, 0.04); g.add(phone);
  const stand = cyl(0.26, 0.32, 0.1, mat.white(), 40); stand.position.y = 0.17; g.add(stand);
  const typing = [0, 1, 2].map((i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: GREEN })); s.position.set(-0.2 + i * 0.08, -0.6, 0.08); phone.add(s); return s; });
  // signal rings
  const rings = [0, 1, 2].map((i) => { const m = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0, depthWrite: false }); const r = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.01, 8, 48), m); r.position.set(0.3, 1.95, 0); g.add(r); return r; });
  g.userData.set = (k, tl, t) => {
    bubbles.forEach((b, i) => b.scale.setScalar(Math.max(0.001, easeBack(seg(k, 0.08 + i * 0.18, 0.28 + i * 0.18)))));
    pin.scale.setScalar(Math.max(0.001, easeBack(seg(k, 0.8, 1))));
    phone.position.y = 1.05 + Math.sin(t * 1.4) * 0.04;
    typing.forEach((s, i) => { s.position.y = -0.6 + Math.max(0, Math.sin(t * 6 - i * 0.8)) * 0.03; });
    rings.forEach((r, i) => { const p = ((t * 0.7) + i / 3) % 1; r.scale.setScalar(0.6 + p * 1.1); r.material.opacity = k > 0 && k < 1 ? (1 - p) * 0.45 : 0; });
  };
  return g;
}

function visitStation() {
  const g = new THREE.Group();
  const house = new THREE.Group();
  house.add(Object.assign(box(1.0, 0.72, 0.8, new THREE.MeshStandardMaterial({ color: 0xf2ece1, roughness: 0.9 }), 0.03), {}));
  house.children[0].position.y = 0.36;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.82, 0.46, 4), new THREE.MeshStandardMaterial({ color: 0x2b3230, roughness: 0.6 }));
  roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.82); roof.position.y = 0.95; roof.castShadow = true; house.add(roof);
  const door = box(0.22, 0.36, 0.03, new THREE.MeshStandardMaterial({ color: 0x0c9a4f, roughness: 0.5 }), 0.02); door.position.set(0.12, 0.2, 0.41); house.add(door);
  const win = box(0.2, 0.18, 0.03, new THREE.MeshStandardMaterial({ color: 0x9fd4ec, emissive: 0x5fc3ff, emissiveIntensity: 0.25, roughness: 0.1 }), 0.02); win.position.set(-0.24, 0.42, 0.41); house.add(win);
  house.position.set(-0.15, 0.12, -0.28); g.add(house);
  // service van
  const van = new THREE.Group();
  const vb = box(0.66, 0.34, 0.34, mat.white(), 0.07); vb.position.y = 0.27; van.add(vb);
  const cab = box(0.24, 0.24, 0.32, mat.white(), 0.06); cab.position.set(0.4, 0.22, 0); van.add(cab);
  const ws = box(0.02, 0.14, 0.26, new THREE.MeshStandardMaterial({ color: 0x1e2a26, roughness: 0.1, metalness: 0.5 }), 0.01); ws.position.set(0.52, 0.27, 0); van.add(ws);
  const stripe = box(0.67, 0.06, 0.35, mat.green(), 0.02); stripe.position.y = 0.24; van.add(stripe);
  [-0.12, 0.12].forEach((z) => { const tl = box(0.02, 0.06, 0.06, new THREE.MeshStandardMaterial({ color: 0xe0262f, emissive: 0xe0262f, emissiveIntensity: 0.8 }), 0.01); tl.position.set(-0.34, 0.33, z); van.add(tl); });
  const wheels = [[-0.2, 0.17], [-0.2, -0.17], [0.36, 0.17], [0.36, -0.17]].map(([x, z]) => { const w = cyl(0.08, 0.08, 0.06, mat.dark(), 20); w.rotation.x = Math.PI / 2; w.position.set(x, 0.09, z); van.add(w); return w; });
  van.position.set(1.6, 0.12, 0.55); van.rotation.y = Math.PI; g.add(van);
  // laser scan plane + measurement corners
  const scanM = new THREE.MeshBasicMaterial({ color: 0x22c76f, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.1), scanM); scan.rotation.x = -Math.PI / 2; scan.position.set(-0.15, 0.15, -0.28); g.add(scan);
  const edgeM = new THREE.LineBasicMaterial({ color: 0x0c9a4f, transparent: true, opacity: 0 });
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.2, 1.25, 1.0)), edgeM); edge.position.set(-0.15, 0.75, -0.28); g.add(edge);
  // technician tablet floating
  const tab = new THREE.Group();
  tab.add(box(0.36, 0.26, 0.03, mat.dark(), 0.03));
  const ts = box(0.32, 0.22, 0.01, new THREE.MeshStandardMaterial({ color: 0x0e1a14, emissive: GREEN, emissiveIntensity: 0.5 }), 0.02); ts.position.z = 0.02; tab.add(ts);
  tab.position.set(0.62, 1.05, 0.3); tab.rotation.set(-0.3, -0.5, 0); tab.scale.setScalar(0.001); g.add(tab);
  g.userData.set = (k, tl, t) => {
    const drive = easeOut(seg(k, 0, 0.4));
    van.position.x = 1.6 - drive * 1.05;
    van.scale.setScalar(k > 0 ? Math.min(1, 0.001 + seg(k, 0, 0.12)) : 0.001);
    wheels.forEach((w) => { w.rotation.y = -van.position.x * 6; });
    const sc = seg(k, 0.4, 1);
    const sweep = k > 0.4 && k <= 1 ? (t * 0.8) % 1 : 0;
    scan.position.y = 0.15 + sweep * 1.3;
    scanM.opacity = sc > 0 ? 0.22 * (1 - Math.abs(sweep - 0.5) * 1.2) : 0;
    edgeM.opacity = 0.9 * sc;
    tab.scale.setScalar(Math.max(0.001, easeBack(seg(k, 0.55, 0.85))));
    tab.position.y = 1.05 + Math.sin(t * 1.6) * 0.05;
  };
  return g;
}

function quoteStation() {
  const g = new THREE.Group();
  const board = new THREE.Group();
  board.add(box(1.0, 1.36, 0.06, new THREE.MeshPhysicalMaterial({ color: 0xc49a6c, roughness: 0.55, clearcoat: 0.4 }), 0.05));
  const paper = box(0.86, 1.14, 0.015, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }), 0.01); paper.position.set(0, -0.06, 0.04); board.add(paper);
  const clip = box(0.36, 0.12, 0.06, mat.steel(), 0.03); clip.position.set(0, 0.62, 0.05); board.add(clip);
  const hdr = box(0.4, 0.06, 0.01, new THREE.MeshStandardMaterial({ color: INK }), 0.02); hdr.position.set(-0.17, 0.38, 0.05); board.add(hdr);
  const lines = [0.68, 0.52, 0.6, 0.44, 0.56].map((w, i) => {
    const geo = new RoundedBoxGeometry(w, 0.04, 0.01, 2, 0.015); geo.translate(w / 2, 0, 0);
    const l = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xcfd8d3 })); l.position.set(-0.37, 0.22 - i * 0.12, 0.05); l.scale.x = 0.001; board.add(l); return l;
  });
  const totGeo = new RoundedBoxGeometry(0.46, 0.09, 0.012, 2, 0.03); totGeo.translate(0.23, 0, 0);
  const total = new THREE.Mesh(totGeo, new THREE.MeshStandardMaterial({ color: GREEN, emissive: GREEN, emissiveIntensity: 0.2 })); total.position.set(-0.08, -0.48, 0.05); total.scale.x = 0.001; board.add(total);
  // approval stamp
  const stamp = new THREE.Group();
  stamp.add(cyl(0.17, 0.17, 0.03, mat.green(), 40));
  const ck1 = box(0.05, 0.03, 0.12, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.01); ck1.position.set(-0.05, 0.02, 0.0); ck1.rotation.y = 0.8; stamp.add(ck1);
  const ck2 = box(0.05, 0.03, 0.22, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.01); ck2.position.set(0.04, 0.02, -0.01); ck2.rotation.y = -0.7; stamp.add(ck2);
  stamp.rotation.x = Math.PI / 2; stamp.position.set(0.28, -0.32, 0.08); stamp.scale.setScalar(0.001); board.add(stamp);
  board.position.set(0, 0.95, 0); board.rotation.set(-0.22, -0.3, 0); g.add(board);
  const easel = cyl(0.03, 0.03, 0.9, mat.dark(), 10); easel.position.set(0, 0.55, -0.3); easel.rotation.x = 0.35; g.add(easel);
  // coins of QAR floating
  const coins = [0, 1, 2].map((i) => { const c = cyl(0.11, 0.11, 0.03, new THREE.MeshStandardMaterial({ color: 0xe6c86b, metalness: 0.9, roughness: 0.25 }), 32); c.position.set(-0.62, 0.3 + i * 0.035, 0.35); g.add(c); return c; });
  g.userData.set = (k, tl, t) => {
    lines.forEach((l, i) => { l.scale.x = Math.max(0.001, easeOut(seg(k, 0.05 + i * 0.1, 0.25 + i * 0.1))); });
    total.scale.x = Math.max(0.001, easeOut(seg(k, 0.6, 0.78)));
    const s = seg(k, 0.8, 1); stamp.scale.setScalar(Math.max(0.001, s < 1 ? 1.6 - easeOut(s) * 0.6 : 1) * (s > 0 ? 1 : 0.001));
    board.position.y = 0.95 + Math.sin(t * 1.2 + 1) * 0.03;
    coins.forEach((c, i) => { c.rotation.y = t * 1.5 + i; });
  };
  return g;
}

function installStation() {
  const g = new THREE.Group();
  const heater = heaterSystem(); heater.scale.setScalar(0.42); g.add(heater);
  const check = new THREE.Group();
  const disc = cyl(0.22, 0.22, 0.05, new THREE.MeshStandardMaterial({ color: GREEN, emissive: GREEN, emissiveIntensity: 0.5 }), 48); disc.rotation.x = Math.PI / 2; check.add(disc);
  const c1 = box(0.06, 0.13, 0.04, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.015); c1.position.set(-0.05, -0.02, 0.03); c1.rotation.z = 0.8; check.add(c1);
  const c2 = box(0.06, 0.24, 0.04, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.015); c2.position.set(0.05, 0.03, 0.03); c2.rotation.z = -0.7; check.add(c2);
  check.position.set(0, 1.75, 0.2); check.scale.setScalar(0.001); g.add(check);
  // confetti burst
  const N = 36, cols = [GREEN, 0xffffff, 0x9ff0c0, 0xe6c86b];
  const conf = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.02, 0.08), new THREE.MeshStandardMaterial({ roughness: 0.5 }), N);
  const vel = [], col = new THREE.Color();
  for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, s = 0.6 + Math.random() * 1.1; vel.push([Math.cos(a) * s, 1.6 + Math.random() * 1.6, Math.sin(a) * s, Math.random() * 10]); conf.setColorAt(i, col.set(cols[i % cols.length])); }
  conf.frustumCulled = false; g.add(conf);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  g.userData.tick = heater.userData.tick;
  g.userData.set = (k, tl, t) => {
    const drop = easeOut(seg(k, 0, 0.45));
    heater.position.y = (1 - drop) * 2.2 + Math.abs(Math.sin(seg(k, 0.35, 0.55) * Math.PI)) * 0.06;
    heater.rotation.y = (1 - drop) * 1.2;
    const cs = seg(k, 0.62, 0.85);
    check.scale.setScalar(Math.max(0.001, easeBack(cs)));
    check.rotation.y = Math.sin(t * 1.4) * 0.35;
    check.position.y = 1.75 + Math.sin(t * 2) * 0.05;
    const ct = tl - 2.0; // seconds since the burst
    const on = ct > 0 && ct < 2.4;
    for (let i = 0; i < N; i++) {
      const v = vel[i];
      if (on) { p.set(v[0] * ct, 1.4 + v[1] * ct - 2.6 * ct * ct, v[2] * ct); e.set(v[3] + ct * 6, ct * 4, v[3]); q.setFromEuler(e); sc.setScalar(1 - Math.max(0, ct - 1.8) / 0.6); }
      else { p.set(0, -5, 0); sc.setScalar(0.001); }
      m4.compose(p, q, sc); conf.setMatrixAt(i, m4);
    }
    conf.instanceMatrix.needsUpdate = true;
  };
  return g;
}

function processJourney(root) {
  const ticks = [];
  const xs = [-3.3, -1.1, 1.1, 3.3], zs = [0.15, -0.15, 0.15, -0.15];
  // platform
  const deck = box(9.2, 0.16, 3.4, new THREE.MeshPhysicalMaterial({ color: 0xf6f8f7, roughness: 0.3, clearcoat: 0.7 }), 0.08); deck.position.y = -0.08; root.add(deck);
  plinth(root, 9.2, 3.4);
  // route between stations
  const routePts = [];
  xs.forEach((x, i) => { routePts.push([x, 0.02, zs[i]]); if (i < xs.length - 1) routePts.push([(x + xs[i + 1]) / 2, 0.02, 1.15]); });
  const roadM = new THREE.MeshStandardMaterial({ color: 0xe3ebe6, roughness: 0.6 });
  for (let i = 0; i < routePts.length - 1; i++) {
    const a = new THREE.Vector3(...routePts[i]), b = new THREE.Vector3(...routePts[i + 1]);
    const len = a.distanceTo(b);
    const r = box(len + 0.2, 0.03, 0.26, roadM, 0.012);
    r.position.copy(a).add(b).multiplyScalar(0.5); r.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x); r.castShadow = false; root.add(r);
  }
  const beadPts = routePts.map(([x, y, z]) => [x, 0.08, z]);
  const beads = flow(beadPts, 26, 0x13b35d, 0.03, 0.04); root.add(beads.mesh); ticks.push(beads.tick);
  // small trees for life
  [[-4.3, -1.3], [-2.2, -1.35], [0.02, -1.4], [2.25, -1.35], [4.3, -1.3]].forEach(([x, z]) => {
    const trunk = cyl(0.04, 0.05, 0.3, new THREE.MeshStandardMaterial({ color: 0x8a6a4a }), 10); trunk.position.set(x, 0.15, z); root.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 1), new THREE.MeshStandardMaterial({ color: 0x6fcf97, roughness: 0.8, flatShading: true })); crown.position.set(x, 0.48, z); crown.castShadow = true; root.add(crown);
  });
  const builders = [phoneStation, visitStation, quoteStation, installStation];
  const stations = builders.map((b, i) => {
    const holder = new THREE.Group(); holder.position.set(xs[i], 0, zs[i]);
    const pad = stationPad(i + 1); holder.add(pad);
    const st = b(); st.position.y = 0.12; holder.add(st);
    root.add(holder);
    if (st.userData.tick) ticks.push(st.userData.tick);
    return { holder, pad, st, tl: 0 };
  });
  const spot = new THREE.PointLight(0x7dffb4, 0, 4); spot.position.set(xs[0], 1.8, 1); root.add(spot);
  let active = 0;
  ticks.push((dt, t) => {
    stations.forEach((s, i) => {
      const on = i === active;
      if (on) s.tl += dt;
      const k = i < active ? 1 : i > active ? 0 : (reduce ? 1 : Math.min(1, s.tl / 3.2));
      s.st.userData.set(k, i < active ? 99 : s.tl, t);
      s.pad.userData.glow(on, t);
      const tgt = on ? 1.06 : 0.92;
      s.holder.scale.setScalar(s.holder.scale.x + (tgt - s.holder.scale.x) * 0.08);
    });
    spot.position.x += (xs[active] - spot.position.x) * 0.06;
    spot.intensity += (3 - spot.intensity) * 0.05;
  });
  const stationsCam = xs.map((x, i) => ({ cam: [x + 2.4, 4.1, zs[i] + 7.0], look: [x, 0.7, zs[i] - 0.1] }));
  return {
    ticks, calm: true, shadow: 6, stations: stationsCam,
    setStep(i) { if (i !== active) { active = i; stations[i].tl = 0; } },
    cam: stationsCam[0].cam, look: stationsCam[0].look,
  };
}

/* ---------------- Wide dioramas for the full-width service sections (home page) ---------------- */
const physWhite = () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 });
const woodM = (tone = 1) => new THREE.MeshPhysicalMaterial({ map: woodTex(tone), roughness: 0.5, clearcoat: 0.35 });
const emissive = (c, k = 1) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.4 });

function plant(h = 1) {
  const g = new THREE.Group();
  const pot = cyl(0.16 * h, 0.12 * h, 0.3 * h, new THREE.MeshPhysicalMaterial({ color: 0xece6dc, roughness: 0.6, clearcoat: 0.3 }), 24); pot.position.y = 0.15 * h; g.add(pot);
  const leafM = new THREE.MeshStandardMaterial({ color: 0x3f9a62, roughness: 0.7, flatShading: true });
  [[0, 0.55, 0, 0.24], [0.12, 0.72, 0.05, 0.18], [-0.1, 0.8, -0.04, 0.17], [0.02, 0.98, 0, 0.14]].forEach(([x, y, z, r]) => {
    const l = new THREE.Mesh(new THREE.IcosahedronGeometry(r * h, 1), leafM); l.position.set(x * h, y * h, z * h); l.castShadow = true; g.add(l);
  });
  return g;
}

function makeVan() {
  const van = new THREE.Group();
  const body = box(0.66, 0.34, 0.34, physWhite(), 0.07); body.position.y = 0.27; van.add(body);
  const cab = box(0.24, 0.24, 0.32, physWhite(), 0.06); cab.position.set(0.4, 0.22, 0); van.add(cab);
  const ws = box(0.02, 0.14, 0.26, new THREE.MeshStandardMaterial({ color: 0x1e2a26, roughness: 0.1, metalness: 0.5 }), 0.01); ws.position.set(0.52, 0.27, 0); van.add(ws);
  const stripe = box(0.67, 0.06, 0.35, mat.green(), 0.02); stripe.position.y = 0.24; van.add(stripe);
  [-0.12, 0.12].forEach((z) => { const tl = box(0.02, 0.06, 0.06, emissive(0xe0262f, 0.8), 0.01); tl.position.set(-0.34, 0.33, z); van.add(tl); const hl = box(0.02, 0.05, 0.06, emissive(0xfff3c4, 1.2), 0.01); hl.position.set(0.53, 0.17, z); van.add(hl); });
  [[-0.2, 0.17], [-0.2, -0.17], [0.36, 0.17], [0.36, -0.17]].forEach(([x, z]) => { const w = cyl(0.08, 0.08, 0.06, mat.dark(), 20); w.rotation.x = Math.PI / 2; w.position.set(x, 0.09, z); van.add(w); });
  return van;
}

/** Display whose text can be redrawn (thermostats, controllers). */
function screenTex(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; ALL_TEX.push(tex);
  return { c, g: c.getContext('2d'), tex };
}

function heaterWide(root) {
  const ticks = [];
  const W = 10, D = 4.2;
  const tiles = tileTex(); tiles.repeat.set(10, 4);
  const floor = box(W, 0.08, D, new THREE.MeshPhysicalMaterial({ map: tiles, roughness: 0.35, clearcoat: 0.5 }), 0.03); floor.position.y = -0.04; root.add(floor);
  const wTex = tileTex(); wTex.repeat.set(12, 3);
  const wallM = new THREE.MeshStandardMaterial({ map: wTex, roughness: 0.6 });
  const back = box(W, 2.9, 0.12, wallM, 0.02); back.position.set(0, 1.45, -D / 2 + 0.06); root.add(back);
  const left = box(0.12, 2.9, D, wallM, 0.02); left.position.set(-W / 2 + 0.06, 1.45, 0); root.add(left);
  [-1.75, 1.75].forEach((x) => { const p = box(0.1, 2.9, 1.7, wallMat(), 0.02); p.position.set(x, 1.45, -D / 2 + 0.9); root.add(p); });
  const Z = -D / 2 + 0.14; // pipe line along the back wall

  // kitchen (left)
  const kx = -3.35;
  const base = box(2.5, 0.84, 0.6, physWhite(), 0.03); base.position.set(kx, 0.42, -1.75); root.add(base);
  for (let i = 0; i < 4; i++) { const h = box(0.18, 0.025, 0.02, mat.steel(), 0.01); h.position.set(kx - 0.95 + i * 0.63, 0.7, -1.44); root.add(h); }
  const top = box(2.6, 0.06, 0.66, woodM(2), 0.02); top.position.set(kx, 0.87, -1.75); root.add(top);
  const sink = box(0.62, 0.03, 0.42, mat.steel(), 0.02); sink.position.set(kx + 0.3, 0.905, -1.75); root.add(sink);
  root.add(pipe([[kx + 0.3, 0.9, -1.98], [kx + 0.3, 1.24, -1.98], [kx + 0.3, 1.24, -1.8]], 0.022, mat.steel()));
  const streamM = new THREE.MeshPhysicalMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.55, roughness: 0.05 });
  const stream = cyl(0.014, 0.014, 0.3, streamM, 10); stream.position.set(kx + 0.3, 1.07, -1.8); root.add(stream);
  const upper = box(2.5, 0.7, 0.34, physWhite(), 0.03); upper.position.set(kx, 2.1, -1.88); root.add(upper);
  const kettle = cyl(0.1, 0.12, 0.2, mat.green(), 24); kettle.position.set(kx - 0.75, 1.0, -1.75); root.add(kettle);
  const pk = plant(0.8); pk.position.set(kx - 1.05, 0.9, -1.75); root.add(pk);
  const steamK = particles(24, 0xffffff, [0.25, 0.8, 0.2], 1, 0.08); steamK.position.set(kx + 0.3, 0.95, -1.75); root.add(steamK); ticks.push(steamK.userData.tick);
  ticks.push((dt, t) => { stream.scale.y = 0.9 + Math.sin(t * 20) * 0.08; });

  // utility room (centre): heater, expansion vessel, controller
  const h = heaterSystem(); h.scale.setScalar(0.92); h.position.set(0, 0, -1.2); root.add(h); ticks.push(h.userData.tick);
  const ev = new THREE.Group();
  const evb = cyl(0.17, 0.17, 0.36, mat.green(), 32); ev.add(evb);
  [0.18, -0.18].forEach((y) => { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 12, 0, Math.PI * 2, y > 0 ? 0 : Math.PI / 2, Math.PI / 2), mat.green()); cap.position.y = y; ev.add(cap); });
  ev.position.set(-1.1, 1.75, -1.85); root.add(ev);
  root.add(pipe([[-1.1, 1.4, -1.85], [-1.1, 1.15, -1.85], [-0.6, 1.15, -1.85]], 0.03, mat.steel()));
  const scr = screenTex(256, 160);
  const ctrl = box(0.5, 0.32, 0.05, new THREE.MeshStandardMaterial({ map: scr.tex, emissive: 0xffffff, emissiveMap: scr.tex, emissiveIntensity: 0.6 }), 0.03);
  ctrl.position.set(1.05, 1.55, -1.99); root.add(ctrl);
  let tc = 0;
  ticks.push((dt, t) => {
    tc += dt; if (tc < 0.25) return; tc = 0;
    const temp = 48 + Math.round((Math.sin(t * 0.6) * 0.5 + 0.5) * 9);
    const g = scr.g; g.fillStyle = '#0e1a14'; g.fillRect(0, 0, 256, 160);
    g.fillStyle = '#7dffb4'; g.font = '800 72px Inter, system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(temp + '°C', 128, 95);
    g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '600 20px Inter, system-ui, sans-serif'; g.fillText('HOT WATER', 128, 132);
    g.fillStyle = '#e0262f'; g.beginPath(); g.arc(28, 28, 8, 0, Math.PI * 2); g.fill();
    scr.tex.needsUpdate = true;
  });

  // hot-water distribution (orange) and cold inlet (blue)
  const hotM = new THREE.MeshPhysicalMaterial({ color: 0xc8643c, roughness: 0.3, metalness: 0.6, clearcoat: 0.6 }); // copper
  const hotL = [[0.24, 2.45, -1.2], [0.24, 2.62, -1.2], [0.24, 2.62, Z], [kx + 0.3, 2.62, Z], [kx + 0.3, 1.26, Z]];
  const hotR = [[0.24, 2.62, Z], [4.2, 2.62, Z], [4.2, 2.12, Z], [4.2, 2.12, -1.72]];
  const hotB = [[2.45, 2.62, Z], [2.45, 1.0, Z]];
  const cold = [[-1.7, 0.32, Z], [-0.75, 0.32, Z], [-0.75, 0.32, -1.2], [-0.55, 0.32, -1.2]];
  [hotL, hotR, hotB].forEach((pts) => root.add(pipe(pts, 0.045, hotM)));
  root.add(pipe(cold, 0.045, mat.steel()));
  [[hotL, 14], [hotR, 14], [hotB, 6]].forEach(([pts, n]) => { const f = flow(pts.map(([x, y, z]) => [x, y, z + 0.06]), n, 0xff7a3d, 0.035, 0.12); root.add(f.mesh); ticks.push(f.tick); });
  const fc = flow(cold.map(([x, y, z]) => [x, y + 0.06, z]), 8, 0x4fb3ff, 0.035, 0.12); root.add(fc.mesh); ticks.push(fc.tick);

  // bathroom (right): vanity, mirror, shower with falling water
  const van = box(1.0, 0.8, 0.5, woodM(0), 0.03); van.position.set(2.45, 0.4, -1.8); root.add(van);
  const vtop = box(1.06, 0.07, 0.56, physWhite(), 0.02); vtop.position.set(2.45, 0.83, -1.8); root.add(vtop);
  const bowl = cyl(0.2, 0.15, 0.1, physWhite(), 32); bowl.position.set(2.45, 0.91, -1.75); root.add(bowl);
  const mirror = box(0.8, 0.9, 0.03, new THREE.MeshStandardMaterial({ color: 0xe6eef0, metalness: 1, roughness: 0.04 }), 0.04); mirror.position.set(2.45, 1.65, -2.02); root.add(mirror);
  const towel = box(0.32, 0.5, 0.05, new THREE.MeshStandardMaterial({ color: 0x7fd3a4, roughness: 0.95 }), 0.04); towel.position.set(3.15, 1.25, -1.99); root.add(towel);
  const tray = box(1.15, 0.06, 1.1, physWhite(), 0.03); tray.position.set(4.25, 0.03, -1.5); root.add(tray);
  const glassP = box(0.03, 2.0, 1.1, mat.glass(), 0.01); glassP.position.set(3.67, 1.03, -1.5); root.add(glassP);
  const head = cyl(0.13, 0.1, 0.04, mat.steel(), 32); head.position.set(4.2, 2.09, -1.68); root.add(head);
  const shower = particles(70, 0xcfeeff, [0.3, 2.0, 0.3], -1, 0.05); shower.position.set(4.2, 0.08, -1.66); root.add(shower);
  ticks.push((dt) => shower.userData.tick(dt * 4));
  const steam = particles(26, 0xffffff, [0.9, 1.0, 0.8], 1, 0.12); steam.position.set(4.25, 1.4, -1.5); root.add(steam); ticks.push(steam.userData.tick);
  const rug = box(0.9, 0.02, 0.55, new THREE.MeshStandardMaterial({ color: 0xbfe7cf, roughness: 1 }), 0.01); rug.position.set(2.45, 0.01, -1.1); root.add(rug);
  const pb = plant(1.1); pb.position.set(4.6, 0, -0.35); root.add(pb);
  plinth(root, W, D);
  return { ticks, cam: [0, 4.5, 10.4], look: [0, 1.05, -0.5], fit: 2.1, shadow: 7, sway: 0.1 };
}

function chillerWide(root) {
  const ticks = [];
  const W = 10, D = 4.4;
  const roofM = new THREE.MeshStandardMaterial({ color: 0xdedad2, roughness: 0.95 });
  const roof = box(W, 0.1, D, roofM, 0.03); roof.position.y = -0.05; root.add(roof);
  const parM = new THREE.MeshStandardMaterial({ color: 0xf2ede4, roughness: 0.9 });
  const pb = box(W, 0.55, 0.16, parM, 0.02); pb.position.set(0, 0.27, -D / 2 + 0.08); root.add(pb);
  const pl = box(0.16, 0.55, D, parM, 0.02); pl.position.set(-W / 2 + 0.08, 0.27, 0); root.add(pl);
  // Doha skyline behind the roof
  const winTex = canvasTex(128, 256, (g, w, hh) => { g.fillStyle = '#dfe9ee'; g.fillRect(0, 0, w, hh); g.fillStyle = 'rgba(40,90,110,.28)'; for (let y = 6; y < hh; y += 16) for (let x = 6; x < w; x += 20) g.fillRect(x, y, 12, 9); }, [1, 1]);
  [[-4.2, 1.9, 0.9], [-3.0, 2.7, 1.0], [-1.4, 1.6, 0.8], [0.6, 3.1, 1.1], [2.2, 2.0, 0.9], [3.6, 2.5, 1.0], [4.6, 1.5, 0.7]].forEach(([x, hgt, wd]) => {
    const m = new THREE.MeshStandardMaterial({ map: winTex, roughness: 0.3, metalness: 0.3, transparent: true, opacity: 0.32 });
    const tw = box(wd, hgt, wd, m, 0.04); tw.position.set(x, hgt / 2 - 0.1, -D / 2 - 1.2); tw.castShadow = false; root.add(tw);
  });
  // AC condensers
  const fans = [];
  [-3.9, -2.85].forEach((x) => {
    const u = box(0.9, 0.75, 0.5, physWhite(), 0.05); u.position.set(x, 0.42, -1.55); root.add(u);
    const grill = new THREE.Mesh(new THREE.CircleGeometry(0.26, 32), mat.dark()); grill.position.set(x, 0.45, -1.29); root.add(grill);
    const fan = new THREE.Group(); fan.position.set(x, 0.45, -1.28);
    for (let k = 0; k < 3; k++) { const b = box(0.22, 0.05, 0.01, mat.steel(), 0.005); b.position.x = 0.1; const piv = new THREE.Group(); piv.rotation.z = (k * Math.PI * 2) / 3; piv.add(b); fan.add(piv); }
    root.add(fan); fans.push(fan);
  });
  ticks.push((dt) => fans.forEach((f) => { f.rotation.z += dt * 10; }));
  // main tank + chiller
  const c = chillerSystem(); c.scale.setScalar(1.08); c.position.set(-0.4, 0, 0.15); root.add(c); ticks.push(c.userData.tick);
  // vertical storage tank with ladder
  const vt = cyl(0.62, 0.62, 1.7, physWhite(), 48); vt.position.set(3.5, 0.95, -1.1); root.add(vt);
  const vtop = cyl(0.64, 0.64, 0.1, mat.dark(), 48); vtop.position.set(3.5, 1.85, -1.1); root.add(vtop);
  const band = cyl(0.63, 0.63, 0.06, mat.green(), 48); band.position.set(3.5, 1.3, -1.1); root.add(band);
  [-0.15, 0.15].forEach((dx) => { const r = box(0.03, 1.9, 0.03, mat.steel(), 0.01); r.position.set(3.5 + dx, 0.95, -0.46); root.add(r); });
  for (let i = 0; i < 6; i++) { const r = box(0.3, 0.025, 0.025, mat.steel(), 0.005); r.position.set(3.5, 0.25 + i * 0.3, -0.46); root.add(r); }
  // chilled-water lines + down pipe
  const l1 = [[1.6, 0.35, 0.75], [2.6, 0.35, 0.75], [2.6, 0.35, -1.1], [2.9, 0.35, -1.1]];
  const l2 = [[4.1, 0.3, -1.1], [4.5, 0.3, -1.1], [4.5, 0.3, 1.2], [4.5, -0.3, 1.2]];
  [l1, l2].forEach((pts) => { root.add(pipe(pts, 0.05, mat.steel())); const f = flow(pts.map(([x, y, z]) => [x, y + 0.06, z]), 10, 0x4fb3ff, 0.035, 0.14); root.add(f.mesh); ticks.push(f.tick); });
  // thermostat sign: tank water cools down from 46°C to 24°C
  const scr = screenTex(320, 200);
  const sign = box(1.0, 0.62, 0.05, new THREE.MeshStandardMaterial({ map: scr.tex, emissive: 0xffffff, emissiveMap: scr.tex, emissiveIntensity: 0.45 }), 0.04);
  sign.position.set(-3.3, 1.45, 0.6); sign.rotation.y = 0.35; root.add(sign);
  const post = cyl(0.025, 0.025, 1.15, mat.steel(), 10); post.position.set(-3.3, 0.58, 0.6); root.add(post);
  let tc = 0;
  ticks.push((dt, t) => {
    tc += dt; if (tc < 0.15) return; tc = 0;
    const k = (t % 7) / 6, temp = Math.round(46 - Math.min(1, k) * 22);
    const g = scr.g, hot = temp > 34;
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 320, 200);
    g.fillStyle = hot ? '#e0262f' : '#0c9a4f'; g.fillRect(0, 0, 320, 10);
    g.fillStyle = '#0e1a14'; g.font = '800 92px Inter, system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(temp + '°', 160, 125);
    g.fillStyle = '#5f6b66'; g.font = '600 24px Inter, system-ui, sans-serif'; g.fillText('TANK WATER', 160, 170);
    scr.tex.needsUpdate = true;
  });
  const mist = particles(70, 0xd8f0ff, [8, 2.6, 3.5], -1, 0.07); mist.position.set(0, 0.2, 0); root.add(mist); ticks.push(mist.userData.tick);
  plinth(root, W, D);
  return { ticks, cam: [0, 4.2, 10.3], look: [0, 0.85, -0.4], fit: 2.1, shadow: 7, sway: 0.1 };
}

function makeCar() {
  const car = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: 0xf6f7f6, roughness: 0.18, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04 });
  const body = box(2.3, 0.42, 1.02, paint, 0.2); body.position.y = 0.44; car.add(body);
  const cabin = box(1.2, 0.3, 0.86, paint, 0.14); cabin.position.set(-0.2, 0.78, 0); car.add(cabin);
  const glassC = box(1.08, 0.2, 0.88, new THREE.MeshPhysicalMaterial({ color: 0x24343a, roughness: 0.05, metalness: 0.5, clearcoat: 1 }), 0.08); glassC.position.set(-0.2, 0.8, 0); car.add(glassC);
  const stripe = box(2.32, 0.06, 1.04, mat.green(), 0.03); stripe.position.set(0, 0.4, 0); car.add(stripe);
  [-0.3, 0.3].forEach((z) => {
    const hl = box(0.04, 0.07, 0.2, emissive(0xffffff, 1.4), 0.02); hl.position.set(1.16, 0.52, z); car.add(hl);
    const tl = box(0.04, 0.06, 0.22, emissive(0xe0262f, 1.0), 0.02); tl.position.set(-1.16, 0.55, z); car.add(tl);
  });
  [[0.72, 0.5], [0.72, -0.5], [-0.72, 0.5], [-0.72, -0.5]].forEach(([x, z]) => {
    const tyre = cyl(0.23, 0.23, 0.18, mat.dark(), 32); tyre.rotation.x = Math.PI / 2; tyre.position.set(x, 0.23, z); car.add(tyre);
    const rim = cyl(0.14, 0.14, 0.19, mat.steel(), 24); rim.rotation.x = Math.PI / 2; rim.position.set(x, 0.23, z); car.add(rim);
  });
  return car;
}

function epoxyWide(root) {
  const ticks = [];
  const W = 10, D = 4.4;
  const textures = [chevronTex(undefined, [5, 2.2]), metallicTex(), seaTex(), chevronTex(['#0e1a14', '#ffffff', '#c9d1cd', '#ffffff'], [5, 2.2])];
  textures[1].repeat.set(3, 1.4); textures[2].repeat.set(2, 1);
  const m = mat.glossy(textures[0]);
  const slab = box(W, 0.16, D, m, 0.05); slab.position.y = -0.08; root.add(slab);
  let ti = 0, tt = 0;
  ticks.push((dt) => {
    tt += dt; if (m.map) m.map.offset.y -= dt * 0.02;
    if (tt > 5) { tt = 0; ti = (ti + 1) % textures.length; m.map = textures[ti]; m.needsUpdate = true; }
  });
  const wallM = new THREE.MeshStandardMaterial({ color: 0x3a4541, roughness: 0.7 });
  const back = box(W, 2.6, 0.12, wallM, 0.02); back.position.set(0, 1.3, -D / 2 + 0.06); root.add(back);
  const left = box(0.12, 2.6, D, wallM, 0.02); left.position.set(-W / 2 + 0.06, 1.3, 0); root.add(left);
  [1.9, 2.25].forEach((y, i) => { const s = box(W - 0.4, 0.04, 0.03, emissive(i ? 0x7dffb4 : 0xffffff, i ? 0.9 : 1.6), 0.01); s.position.set(0.1, y, -D / 2 + 0.14); root.add(s); });
  const logoBar = box(1.6, 0.36, 0.04, emissive(GREEN, 0.5), 0.05); logoBar.position.set(-2.8, 1.25, -D / 2 + 0.14); root.add(logoBar);
  const car = makeCar(); car.position.set(1.7, 0, -0.35); car.rotation.y = -0.45; root.add(car);
  // tool cabinet, bucket, cones
  const cab = box(1.1, 1.0, 0.5, mat.green(), 0.05); cab.position.set(-4.1, 0.5, -1.75); root.add(cab);
  for (let i = 0; i < 4; i++) { const d = box(1.0, 0.02, 0.02, mat.steel(), 0.005); d.position.set(-4.1, 0.25 + i * 0.22, -1.49); root.add(d); }
  const bucket = cyl(0.24, 0.21, 0.4, physWhite(), 24); bucket.position.set(-0.6, 0.2, 1.5); root.add(bucket);
  const paintTop = cyl(0.22, 0.22, 0.02, mat.green(), 24); paintTop.position.set(-0.6, 0.41, 1.5); root.add(paintTop);
  [[4.3, 1.5], [4.6, 0.9]].forEach(([x, z]) => { const cone = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.45, 24), new THREE.MeshStandardMaterial({ color: GREEN, roughness: 0.5 })); cone.position.set(x, 0.22, z); cone.castShadow = true; root.add(cone); const b = cyl(0.1, 0.11, 0.06, mat.white(), 24); b.position.set(x, 0.25, z); root.add(b); });
  // roller gliding over the front
  const roller = new THREE.Group();
  const drum = cyl(0.12, 0.12, 0.9, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), 20); drum.rotation.x = Math.PI / 2; roller.add(drum);
  const hnd = cyl(0.02, 0.02, 1.4, mat.dark(), 8); hnd.position.set(0.45, 0.6, 0); hnd.rotation.z = 0.7; roller.add(hnd);
  roller.position.set(-2.6, 0.12, 1.2); root.add(roller);
  ticks.push((dt, t) => { roller.position.x = -2.7 + Math.sin(t * 0.5) * 1.4; drum.rotation.y = -roller.position.x / 0.12; });
  const p1 = plant(1.2); p1.position.set(-4.5, 0, 0.9); root.add(p1);
  plinth(root, W, D);
  return { ticks, cam: [0, 4.2, 10.4], look: [0, 0.6, -0.3], fit: 2.1, shadow: 7, sway: 0.1 };
}

function interiorWide(root) {
  const ticks = [];
  const W = 10, D = 4.6;
  const wood = woodTex(1); wood.repeat.set(3, 12); wood.rotation = Math.PI / 2;
  const floor = box(W, 0.1, D, new THREE.MeshPhysicalMaterial({ map: wood, roughness: 0.4, clearcoat: 0.5 }), 0.02); floor.position.y = -0.05; root.add(floor);
  const wM = new THREE.MeshStandardMaterial({ color: 0xf3eee6, roughness: 0.9 });
  const back = box(W, 3.0, 0.12, wM, 0.01); back.position.set(0, 1.5, -D / 2 + 0.06); root.add(back);
  const left = box(0.12, 3.0, D, wM, 0.01); left.position.set(-W / 2 + 0.06, 1.5, 0); root.add(left);
  const BZ = -D / 2 + 0.12;
  // cove-lit bulkhead
  const bulk = box(W, 0.22, 0.7, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }), 0.02); bulk.position.set(0, 2.9, BZ + 0.3); root.add(bulk);
  const cove = box(W - 0.3, 0.03, 0.04, emissive(0xffe2a8, 1.5), 0.01); cove.position.set(0, 2.77, BZ + 0.66); root.add(cove);
  const coveL = new THREE.PointLight(0xffd9a0, 5, 7); coveL.position.set(1.5, 2.5, BZ + 0.8); root.add(coveL);
  ticks.push((dt, t) => { cove.material.emissiveIntensity = 1.3 + Math.sin(t * 1.2) * 0.3; });
  // dining (left): window, table, chairs, pendants, sideboard
  const winFrame = box(2.0, 1.6, 0.06, mat.dark(), 0.02); winFrame.position.set(-2.9, 1.55, BZ); root.add(winFrame);
  const winGlass = box(1.88, 1.48, 0.02, emissive(0xfff4d6, 0.9), 0.01); winGlass.position.set(-2.9, 1.55, BZ + 0.035); root.add(winGlass);
  const mull = box(0.04, 1.5, 0.03, mat.dark(), 0.005); mull.position.set(-2.9, 1.55, BZ + 0.05); root.add(mull);
  const sunL = new THREE.SpotLight(0xffe7b8, 18, 9, 0.6, 0.6); sunL.position.set(-2.9, 2.2, BZ + 0.3); sunL.target.position.set(-2.4, 0, 0.8); root.add(sunL, sunL.target);
  const table = box(1.9, 0.07, 0.95, woodM(0), 0.03); table.position.set(-2.6, 0.76, -0.3); root.add(table);
  [[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]].forEach(([dx, dz]) => { const l = cyl(0.03, 0.03, 0.74, mat.dark(), 8); l.position.set(-2.6 + dx, 0.37, -0.3 + dz); root.add(l); });
  const chairM = new THREE.MeshStandardMaterial({ color: 0xe9e1d4, roughness: 0.85 });
  [[-3.15, -0.95, 0], [-2.05, -0.95, 0], [-3.15, 0.35, Math.PI], [-2.05, 0.35, Math.PI]].forEach(([x, z, r]) => {
    const ch = new THREE.Group();
    ch.add(Object.assign(box(0.46, 0.08, 0.44, chairM, 0.04), {}));
    ch.children[0].position.y = 0.46;
    const bk = box(0.46, 0.5, 0.07, chairM, 0.04); bk.position.set(0, 0.74, -0.2); ch.add(bk);
    [[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]].forEach(([a, b]) => { const l = cyl(0.018, 0.018, 0.44, mat.dark(), 6); l.position.set(a, 0.22, b); ch.add(l); });
    ch.position.set(x, 0, z); ch.rotation.y = r; root.add(ch);
  });
  const vase = cyl(0.07, 0.05, 0.22, mat.green(), 20); vase.position.set(-2.6, 0.9, -0.3); root.add(vase);
  [-3.1, -2.6, -2.1].forEach((x) => {
    const cord = cyl(0.006, 0.006, 0.9, mat.dark(), 6); cord.position.set(x, 2.35, -0.3); root.add(cord);
    const shade = cyl(0.06, 0.17, 0.18, emissive(0xffe2a8, 0.7), 24); shade.position.set(x, 1.85, -0.3); root.add(shade);
  });
  const side = box(1.6, 0.6, 0.4, woodM(2), 0.03); side.position.set(-4.3, 0.3, -1.4); side.rotation.y = Math.PI / 2; root.add(side);
  const pd = plant(1.4); pd.position.set(-1.25, 0, -1.8); root.add(pd);
  // living (right): fluted wall, art, sofa, rug, coffee table, armchair, lamp
  for (let i = 0; i < 26; i++) { const s = box(0.09, 2.3, 0.05, new THREE.MeshStandardMaterial({ color: i % 2 ? 0xd7c3a5 : 0xcdb595, roughness: 0.6 }), 0.02); s.position.set(1.2 + i * 0.12, 1.3, BZ + 0.03); root.add(s); }
  const art = canvasTex(256, 160, (g, w, hh) => { g.fillStyle = '#f4efe6'; g.fillRect(0, 0, w, hh); g.fillStyle = '#0c9a4f'; g.beginPath(); g.arc(90, 90, 52, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e0c9a6'; g.fillRect(130, 30, 90, 100); g.strokeStyle = '#0e1a14'; g.lineWidth = 4; g.beginPath(); g.moveTo(40, 140); g.bezierCurveTo(100, 40, 160, 160, 230, 60); g.stroke(); }, [1, 1]);
  const frame = box(1.3, 0.82, 0.04, new THREE.MeshStandardMaterial({ map: art, roughness: 0.6 }), 0.02); frame.position.set(2.75, 1.85, BZ + 0.09); root.add(frame);
  const sofaM = new THREE.MeshStandardMaterial({ color: 0xe8e1d5, roughness: 0.9 });
  const sofa = new THREE.Group();
  const seat = box(2.4, 0.4, 0.9, sofaM, 0.14); seat.position.y = 0.3; sofa.add(seat);
  const backr = box(2.4, 0.55, 0.25, sofaM, 0.12); backr.position.set(0, 0.7, -0.33); sofa.add(backr);
  [-1.2, 1.2].forEach((x) => { const arm = box(0.22, 0.55, 0.9, sofaM, 0.1); arm.position.set(x, 0.45, 0); sofa.add(arm); });
  [[-0.65, 0.12, mat.green()], [0.55, -0.12, new THREE.MeshStandardMaterial({ color: 0xc9b089, roughness: 0.9 })]].forEach(([x, r, mm]) => { const pw = box(0.45, 0.4, 0.14, mm, 0.1); pw.position.set(x, 0.68, -0.15); pw.rotation.z = r; sofa.add(pw); });
  sofa.position.set(2.75, 0, -1.45); root.add(sofa);
  const rug = box(3.0, 0.02, 2.0, new THREE.MeshStandardMaterial({ color: 0xdfe8e2, roughness: 1 }), 0.02); rug.position.set(2.75, 0.01, -0.3); root.add(rug);
  const ct = cyl(0.5, 0.5, 0.06, woodM(0), 40); ct.position.set(2.75, 0.4, -0.25); root.add(ct);
  const ctb = cyl(0.12, 0.2, 0.37, mat.dark(), 20); ctb.position.set(2.75, 0.19, -0.25); root.add(ctb);
  const book = box(0.3, 0.05, 0.22, mat.green(), 0.01); book.position.set(2.6, 0.455, -0.2); root.add(book);
  const arm = box(0.75, 0.42, 0.75, new THREE.MeshStandardMaterial({ color: 0x7a5c44, roughness: 0.7 }), 0.15); arm.position.set(4.4, 0.32, 0.2); arm.rotation.y = -0.6; root.add(arm);
  const lampP = cyl(0.015, 0.015, 1.5, mat.dark(), 8); lampP.position.set(4.55, 0.75, -1.5); root.add(lampP);
  const lampS = cyl(0.14, 0.22, 0.28, emissive(0xffe2a8, 0.8), 24); lampS.position.set(4.55, 1.55, -1.5); root.add(lampS);
  const p2 = plant(1.3); p2.position.set(0.75, 0, -1.6); root.add(p2);
  plinth(root, W, D);
  return { ticks, cam: [0, 4.5, 10.6], look: [0, 1.0, -0.6], fit: 2.1, shadow: 7, sway: 0.1 };
}

function pumpWide(root) {
  const ticks = [];
  const pr = new THREE.Group(); pr.position.x = -2.4; root.add(pr);
  const p = pumpRoom(); pr.add(p); ticks.push(p.userData.tick);
  corner(pr, 4.4, 3.2, 2.7);
  const ground = box(5.4, 0.08, 3.2, new THREE.MeshStandardMaterial({ color: 0xe4e1da, roughness: 0.9 }), 0.03); ground.position.set(2.5, -0.04, 0); root.add(ground);
  // 5-storey building fed by the riser
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0xcfe3ea, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.55 });
  const lights = [];
  const FH = 0.6;
  for (let f = 0; f < 5; f++) {
    const slab = box(2.6, 0.07, 2.2, physWhite(), 0.02); slab.position.set(2.9, f * FH + 0.03, -0.3); root.add(slab);
    const gl = box(2.5, FH - 0.08, 2.1, glassM, 0.01); gl.position.set(2.9, f * FH + FH / 2 + 0.03, -0.3); gl.castShadow = false; root.add(gl);
    const win = box(2.3, FH - 0.2, 0.02, emissive(0xffe2a0, 0.05), 0.01); win.position.set(2.9, f * FH + FH / 2 + 0.03, 0.77); root.add(win); lights.push(win);
  }
  const roofS = box(2.7, 0.1, 2.3, physWhite(), 0.03); roofS.position.set(2.9, 5 * FH + 0.05, -0.3); root.add(roofS);
  const rt = cyl(0.35, 0.35, 0.55, mat.green(), 32); rt.position.set(3.4, 5 * FH + 0.38, -0.6); root.add(rt);
  const riser = [[-0.5, 0.35, 1.15], [1.45, 0.35, 1.15], [1.45, 5 * FH + 0.25, 1.15], [3.4, 5 * FH + 0.25, 1.15], [3.4, 5 * FH + 0.25, -0.6]];
  root.add(pipe(riser, 0.06, mat.steel()));
  const fr = flow(riser.map(([x, y, z]) => [x, y, z + 0.08]), 18, 0x5fc3ff, 0.04, 0.12); root.add(fr.mesh); ticks.push(fr.tick);
  ticks.push((dt, t) => { const k = (t % 6) / 6; lights.forEach((w, i) => { const on = k > 0.12 + i * 0.14; w.material.emissiveIntensity += ((on ? 1.1 : 0.05) - w.material.emissiveIntensity) * 0.1; }); });
  const tree = plant(1.6); tree.position.set(4.6, 0, 1.1); root.add(tree);
  plinth(root, 10, 3.6);
  return { ticks, cam: [0, 4.4, 10.5], look: [0, 1.3, -0.3], fit: 2.1, shadow: 7, sway: 0.1 };
}

function maintenanceWide(root) {
  const ticks = [];
  const pave = canvasTex(256, 256, (g, w, hh) => { g.fillStyle = '#e9e6df'; g.fillRect(0, 0, w, hh); g.strokeStyle = 'rgba(120,110,95,.18)'; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, hh); g.stroke(); } }, [6, 2.5]);
  const ground = box(10, 0.08, 4, new THREE.MeshStandardMaterial({ map: pave, roughness: 0.9 }), 0.03); ground.position.y = -0.045; root.add(ground);
  const m = maintenanceSite(); m.position.set(0.3, 0.005, 0); root.add(m); ticks.push(m.userData.tick);
  const van = makeVan(); van.scale.setScalar(1.55); van.position.set(-3.4, 0, 1.0); van.rotation.y = 0.35; root.add(van);
  // street light that flickers, then gets fixed
  const pole = cyl(0.04, 0.05, 2.6, mat.dark(), 12); pole.position.set(4.2, 1.3, 0.9); root.add(pole);
  const armL = box(0.6, 0.04, 0.04, mat.dark(), 0.01); armL.position.set(3.95, 2.58, 0.9); root.add(armL);
  const lampM = emissive(0xfff1c8, 1.2);
  const lamp = box(0.32, 0.07, 0.16, lampM, 0.03); lamp.position.set(3.72, 2.53, 0.9); root.add(lamp);
  const lampL = new THREE.PointLight(0xffe2a8, 2.5, 3.5); lampL.position.set(3.72, 2.3, 0.9); root.add(lampL);
  ticks.push((dt, t) => { const k = t % 8; const on = k > 4 ? 1 : (Math.sin(t * 37) > 0.3 ? 1 : 0.1); lampM.emissiveIntensity = 1.3 * on; lampL.intensity = 2.5 * on; });
  // electrical panel with blinking status LEDs
  const panel = box(0.55, 0.8, 0.18, physWhite(), 0.03); panel.position.set(3.0, 0.75, -1.55); root.add(panel);
  const leds = [0, 1, 2].map((i) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), emissive(i === 2 ? 0xe0262f : GREEN, 1)); l.position.set(2.85 + i * 0.15, 0.95, -1.45); root.add(l); return l; });
  ticks.push((dt, t) => leds.forEach((l, i) => { l.material.emissiveIntensity = Math.sin(t * 4 + i * 2) > 0 ? 1.6 : 0.2; }));
  const tp = plant(1.5); tp.position.set(-4.5, 0, -1.4); root.add(tp);
  plinth(root, 10, 4);
  return { ticks, cam: [0, 4.2, 10.3], look: [0, 1.05, -0.3], fit: 2.1, shadow: 7, sway: 0.1 };
}

/* ---------------- scene setup ---------------- */
const BUILDERS = {
  process: processJourney,
  'heater-wide': heaterWide, 'chiller-wide': chillerWide, 'epoxy-wide': epoxyWide, 'interior-wide': interiorWide, 'pump-wide': pumpWide, 'maintenance-wide': maintenanceWide,
  hero(root) {
    const slab = epoxySlab(4.0); root.add(slab);
    const heater = heaterSystem(); heater.scale.setScalar(0.72); heater.position.set(-1.05, 0, -0.6); root.add(heater);
    const chiller = chillerSystem(); chiller.scale.setScalar(0.55); chiller.position.set(1.1, 0, 0.35); root.add(chiller);
    plinth(root, 4.0, 4.0);
    return { ticks: [slab.userData.tick, heater.userData.tick, chiller.userData.tick], cam: [5.0, 3.9, 5.9], look: [0, 0.55, 0] };
  },
  heater(root) {
    const floor = box(3.8, 0.08, 2.4, new THREE.MeshStandardMaterial({ map: tileTex(), roughness: 0.5 }), 0.03); floor.position.y = -0.04; root.add(floor);
    corner(root, 3.8, 2.4, 2.9, new THREE.MeshStandardMaterial({ map: tileTex(), roughness: 0.6 }));
    const h = heaterSystem(); h.position.z = -0.25; root.add(h);
    plinth(root, 3.8, 2.4);
    return { ticks: [h.userData.tick], cam: [5.4, 4.2, 7.4], look: [0, 1.15, 0] };
  },
  chiller(root) {
    const roof = box(4.2, 0.08, 3.0, new THREE.MeshStandardMaterial({ color: 0xe3e1dc, roughness: 0.9 }), 0.03); roof.position.y = -0.04; root.add(roof);
    const par = new THREE.MeshStandardMaterial({ color: 0xf2ede4, roughness: 0.9 });
    const pb = box(4.2, 0.45, 0.14, par, 0.02); pb.position.set(0, 0.22, -1.43); root.add(pb);
    const pl = box(0.14, 0.45, 3.0, par, 0.02); pl.position.set(-2.03, 0.22, 0); root.add(pl);
    const c = chillerSystem(); root.add(c);
    plinth(root, 4.2, 3.0);
    return { ticks: [c.userData.tick], cam: [4.8, 3.8, 6.4], look: [0, 0.7, 0] };
  },
  epoxy(root) {
    const s2 = epoxySlab(3.8); root.add(s2);
    corner(root, 3.8, 3.8, 2.2, new THREE.MeshStandardMaterial({ color: 0xf6f4ef, roughness: 0.9 }));
    // roller gliding across the fresh coat
    const roller = new THREE.Group();
    const drum = cyl(0.12, 0.12, 0.9, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), 20); drum.rotation.x = Math.PI / 2; roller.add(drum);
    const h = cyl(0.02, 0.02, 1.4, mat.dark(), 8); h.position.set(0.45, 0.6, 0); h.rotation.z = 0.7; roller.add(h);
    roller.position.set(0, 0.14, 0.4); root.add(roller);
    const bucket = cyl(0.25, 0.22, 0.42, new THREE.MeshPhysicalMaterial({ color: GREEN, roughness: 0.4, clearcoat: 0.6 }), 24); bucket.position.set(1.4, 0.21, -1.3); root.add(bucket);
    let t = 0;
    const tickRoll = (dt) => { t += dt; roller.position.x = Math.sin(t * 0.6) * 1.3; drum.rotation.y = -roller.position.x / 0.12; };
    plinth(root, 3.8, 3.8);
    return { ticks: [s2.userData.tick, tickRoll], cam: [5.2, 4.6, 6.2], look: [0, 0.4, 0] };
  },
  interior(root) {
    const r = interiorRoom(); root.add(r);
    plinth(root, 4.2, 4.2);
    return { ticks: [r.userData.tick], cam: [5.6, 4.0, 7.0], look: [-0.2, 1.0, -0.4] };
  },
  pump(root) {
    const pr = pumpRoom(); root.add(pr);
    corner(root, 4.4, 3.2, 2.7);
    plinth(root, 4.4, 3.2);
    return { ticks: [pr.userData.tick], cam: [5.2, 3.9, 6.6], look: [0, 0.95, 0] };
  },
  maintenance(root) {
    const m = maintenanceSite(); root.add(m);
    plinth(root, 4.6, 3.4);
    return { ticks: [m.userData.tick], cam: [5.0, 3.6, 6.8], look: [0, 1.1, 0] };
  },
};

/** Build one live scene inside `el`; returns a function that tears it down (frees the WebGL context). */
function create(el) {
  const type = el.getAttribute('data-scene');
  const build = BUILDERS[type];
  if (!build) return null;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  const lite = el.hasAttribute('data-lite');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1 : 1.25));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xe6e6e6, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(4, 7, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -4;
  sun.shadow.camera.right = sun.shadow.camera.top = 4;
  sun.shadow.radius = 6;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xffffff, 0.5); rim.position.set(-5, 3, -4); scene.add(rim);

  // Soft contact shadow under everything
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.18 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.39; ground.receiveShadow = true; scene.add(ground);

  const root = new THREE.Group();
  scene.add(root);
  const texFrom = ALL_TEX.length;
  const cfg = build(root);
  if (cfg.shadow) { const S = cfg.shadow; sun.shadow.camera.left = sun.shadow.camera.bottom = -S; sun.shadow.camera.right = sun.shadow.camera.top = S; sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.far = 40; sun.position.set(5, 9, 7); sun.shadow.camera.updateProjectionMatrix(); }
  const myTex = ALL_TEX.slice(texFrom);
  myTex.forEach((tx) => renderer.initTexture(tx));
  const look = new THREE.Vector3(...cfg.look);
  camera.position.set(...cfg.cam);
  camera.lookAt(look);
  // Scenes with stations (process journey): the page picks the step, the camera glides to it
  const camTo = new THREE.Vector3(...cfg.cam), lookTo = look.clone();
  if (cfg.stations) {
    el.__setStep = (i) => {
      i = Math.max(0, Math.min(cfg.stations.length - 1, i | 0));
      cfg.setStep(i); camTo.set(...cfg.stations[i].cam); lookTo.set(...cfg.stations[i].look);
      if (reduce) { camera.position.copy(camTo); look.copy(lookTo); camera.lookAt(look); cfg.ticks.forEach((f) => f && f(0, 0)); renderer.render(scene, camera); }
    };
    el.__setStep(+el.dataset.step || 0);
    camera.position.copy(camTo); look.copy(lookTo); camera.lookAt(look);
  }

  el.appendChild(renderer.domElement);
  const fb = el.querySelector('.scene-fallback');
  if (fb) fb.hidden = true;
  // If the GPU drops the context (low-memory phones), show the static fallback instead of a blank box
  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); renderer.domElement.style.visibility = 'hidden'; if (fb) fb.hidden = false; });
  renderer.domElement.addEventListener('webglcontextrestored', () => { renderer.domElement.style.visibility = ''; if (fb) fb.hidden = true; });

  const resize = () => {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the model framed on narrow / tall containers
    camera.zoom = Math.min(1, camera.aspect / (+el.dataset.fit || cfg.fit || 0.95)); // wide dioramas zoom out on narrow frames so nothing is cut
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  // Pointer parallax
  const target = { x: 0, y: 0 };
  const ac = new AbortController();
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, { signal: ac.signal });
  el.addEventListener('pointerleave', () => { target.x = target.y = 0; }, { signal: ac.signal });

  let visible = false, alive = true, raf = 0, last = performance.now(), time = 0;
  const io = new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; if (visible) { last = performance.now(); cancelAnimationFrame(raf); loop(); } }, { rootMargin: '100px' });
  io.observe(el);

  function loop() {
    if (!visible || !alive) return;
    const now = performance.now();
    if (lite && now - last < 32) { raf = requestAnimationFrame(loop); return; } // small cards: ~30 fps
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    if (!reduce) {
      cfg.ticks.forEach((f) => f && f(dt, time));
      if (cfg.calm) {
        camera.position.x += (camTo.x + target.x * 0.5 - camera.position.x) * 0.045;
        camera.position.y += (camTo.y - target.y * 0.3 - camera.position.y) * 0.045;
        camera.position.z += (camTo.z - camera.position.z) * 0.045;
        look.lerp(lookTo, 0.045); camera.lookAt(look);
      } else {
        const sw = cfg.sway == null ? 0.25 : cfg.sway;
        root.rotation.y += ((Math.sin(time * 0.25) * sw + target.x * (sw < 0.2 ? 0.15 : 0.35)) - root.rotation.y) * 0.05;
        root.rotation.x += ((target.y * 0.06) - root.rotation.x) * 0.05;
        root.position.y = Math.sin(time * 0.8) * (sw < 0.2 ? 0.015 : 0.04);
      }
    }
    renderer.render(scene, camera);
    if (reduce) return; // one static frame
    raf = requestAnimationFrame(loop);
  }
  renderer.render(scene, camera);

  return function destroy() {
    alive = false;
    cancelAnimationFrame(raf);
    io.disconnect(); ro.disconnect(); ac.abort();
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => m.dispose());
    });
    myTex.forEach((tx) => { tx.dispose(); const k = ALL_TEX.indexOf(tx); if (k > -1) ALL_TEX.splice(k, 1); });
    if (scene.environment) scene.environment.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    delete el.__setStep;
    if (fb) fb.hidden = false;
  };
}

/* Many scenes on one page: only keep a WebGL context for scenes near the screen
   (browsers cap live contexts at ~16), and free it again when the scene scrolls far away. */
function mount(el) {
  let destroy = null;
  // phones: service cards sit in a sideways-scrolling row, so keep their scenes ready while the row is near (each still only animates while it is on screen)
  const rail = window.matchMedia('(max-width: 767px)').matches ? el.closest('.bento') : null;
  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      if (!destroy) { try { destroy = create(el); } catch (e) { console.warn('3D scene failed', e); } }
    } else if (destroy) { destroy(); destroy = null; }
  }, { rootMargin: '250px 0px' }).observe(rail || el);
}

if (webgl()) {
  document.querySelectorAll('[data-scene]').forEach(mount);
}
