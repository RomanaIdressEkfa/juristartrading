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
const GREEN = 0x0fa958, GREEN_D = 0x08803f, RED = 0xe0262f, INK = 0x04241a;

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
const chevronTex = (colors = ['#078a45', '#eef3ef', '#c4161f', '#eef3ef'], rep = [2, 2]) => canvasTex(512, 512, (g, w, h) => {
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
  const cols = ['#e9e3d3', '#8d959f', '#d4c08e', '#f7f7f7', '#6f7780', '#0fa958'];
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
  steel: () => new THREE.MeshStandardMaterial({ color: 0xc8d0d6, roughness: 0.25, metalness: 0.9 }),
  dark: () => new THREE.MeshStandardMaterial({ color: INK, roughness: 0.4, metalness: 0.3 }),
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
  const band = cyl(0.625, 0.625, 0.12, mat.red()); band.position.set(0, 1.85, 0); g.add(band);
  const band2 = cyl(0.625, 0.625, 0.05, mat.green()); band2.position.set(0, 1.74, 0); g.add(band2);
  // Display panel (glows)
  const panel = box(0.42, 0.26, 0.06, new THREE.MeshStandardMaterial({ color: INK, emissive: 0x3be477, emissiveIntensity: 0.35, roughness: 0.3 }), 0.03);
  panel.position.set(0, 1.35, 0.62); g.add(panel);
  // Hot (red) out, cold (blue) in
  const hot = pipe([[0.25, 2.3, 0], [0.25, 2.6, 0], [1.35, 2.6, 0], [1.35, 0.55, 0]], 0.065, mat.red()); g.add(hot);
  const cold = pipe([[-1.35, 1.4, 0], [-1.35, 0.35, 0], [-0.62, 0.35, 0]], 0.065, mat.blue()); g.add(cold);
  // Circulation pump on the hot line
  const pump = new THREE.Group();
  const body = cyl(0.26, 0.26, 0.34, mat.green()); body.rotation.z = Math.PI / 2; pump.add(body);
  const motor = cyl(0.2, 0.2, 0.3, mat.dark()); motor.rotation.x = Math.PI / 2; motor.position.z = 0.28; pump.add(motor);
  const fan = box(0.05, 0.3, 0.04, mat.steel(), 0.02); fan.position.z = 0.45; pump.add(fan);
  pump.position.set(1.35, 0.6, 0); g.add(pump);
  ticks.push((dt) => { fan.rotation.z += dt * 12; });
  // Filter on the cold line
  const filt = new THREE.Group();
  const housing = cyl(0.2, 0.2, 0.65, mat.glass()); filt.add(housing);
  const cart = cyl(0.12, 0.12, 0.55, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })); filt.add(cart);
  const head = cyl(0.24, 0.24, 0.1, mat.blue()); head.position.y = 0.36; filt.add(head);
  filt.position.set(-1.35, 1.0, 0); g.add(filt);
  // Heat shimmer
  const heat = particles(70, 0xff6a3d, [0.5, 1.6, 0.5], 1, 0.12); heat.position.set(1.35, 2.7, 0); g.add(heat);
  ticks.push(heat.userData.tick);
  g.userData.tick = (dt) => ticks.forEach((f) => f(dt));
  return g;
}

function chillerSystem() {
  const g = new THREE.Group();
  const ticks = [];
  // Water tank (horizontal)
  const tank = cyl(0.75, 0.75, 2.2, new THREE.MeshPhysicalMaterial({ color: 0x9fdcf5, roughness: 0.3, clearcoat: 1 }), 48);
  tank.rotation.z = Math.PI / 2; tank.position.set(-0.6, 0.95, -0.4); g.add(tank);
  [-1.6, 0.4].forEach((x) => { const s = box(0.25, 0.3, 1.2, mat.dark(), 0.04); s.position.set(x, 0.15, -0.4); g.add(s); });
  const ring1 = cyl(0.77, 0.77, 0.06, mat.blue()); ring1.rotation.z = Math.PI / 2; ring1.position.set(-1.3, 0.95, -0.4); g.add(ring1);
  const ring2 = ring1.clone(); ring2.position.x = 0.1; g.add(ring2);
  // Chiller unit
  const unit = new THREE.Group();
  unit.add(box(1.3, 1.0, 1.0, mat.white(), 0.08));
  const grille = box(1.1, 0.05, 0.85, mat.dark(), 0.02); grille.position.y = 0.5; unit.add(grille);
  const fanG = new THREE.Group(); fanG.position.y = 0.55;
  for (let i = 0; i < 4; i++) { const b = box(0.36, 0.02, 0.1, mat.steel(), 0.01); b.position.x = 0.18; const piv = new THREE.Group(); piv.rotation.y = (i * Math.PI) / 2; piv.add(b); fanG.add(piv); }
  unit.add(fanG);
  const stripe = box(1.32, 0.12, 1.02, mat.green(), 0.03); stripe.position.y = -0.2; unit.add(stripe);
  const disp = box(0.34, 0.18, 0.04, new THREE.MeshStandardMaterial({ color: INK, emissive: 0x5ee0ff, emissiveIntensity: 0.5 }), 0.02); disp.position.set(0.3, 0.15, 0.51); unit.add(disp);
  unit.position.set(1.35, 0.5, 0.55); g.add(unit);
  ticks.push((dt) => { fanG.rotation.y += dt * 9; });
  // Supply/return lines
  g.add(pipe([[0.5, 0.95, -0.4], [0.75, 0.95, -0.4], [0.75, 0.75, 0.55]], 0.06, mat.blue()));
  g.add(pipe([[0.5, 0.65, -0.4], [0.62, 0.65, -0.4], [0.62, 0.3, 0.55], [0.7, 0.3, 0.55]], 0.06, mat.green()));
  // Cool mist
  const snow = particles(90, 0x9fe8ff, [3.2, 2.6, 2.2], -1, 0.1); snow.position.set(0, 0.2, 0); g.add(snow);
  ticks.push(snow.userData.tick);
  g.userData.tick = (dt) => ticks.forEach((f) => f(dt));
  return g;
}

function epoxySlab(size = 3.6) {
  const textures = [chevronTex(), metallicTex(), seaTex(), chevronTex(['#04241a', '#0fa958', '#f4f7f5', '#0fa958'], [2, 2])];
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
  for (let i = 0; i < 16; i++) { const s = box(0.1, 2.2, 0.06, mat.green(), 0.02); s.position.set(-0.75 + i * 0.12, 1.25, -1.96); g.add(s); }
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
  const pillow = box(0.45, 0.4, 0.14, mat.red(), 0.1); pillow.position.set(-0.6, 0.68, -0.22); pillow.rotation.z = 0.15; sofa.add(pillow);
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

/* ---------------- scene setup ---------------- */
const BUILDERS = {
  hero(root) {
    const slab = epoxySlab(4.0); root.add(slab);
    const heater = heaterSystem(); heater.scale.setScalar(0.72); heater.position.set(-1.05, 0, -0.6); root.add(heater);
    const chiller = chillerSystem(); chiller.scale.setScalar(0.55); chiller.position.set(1.1, 0, 0.35); root.add(chiller);
    return { ticks: [slab.userData.tick, heater.userData.tick, chiller.userData.tick], cam: [6.1, 4.8, 7.1], look: [0, 0.6, 0] };
  },
  heater(root) {
    const h = heaterSystem(); root.add(h);
    const pad = box(3.6, 0.12, 2, mat.glossy(chevronTex(['#04241a', '#0b4d37'], [3, 2])), 0.05); pad.position.y = -0.06; root.add(pad);
    return { ticks: [h.userData.tick], cam: [4.6, 3.6, 6.8], look: [0, 1.15, 0] };
  },
  chiller(root) {
    const c = chillerSystem(); root.add(c);
    const pad = box(4, 0.12, 2.6, new THREE.MeshStandardMaterial({ color: 0xdfe7e3, roughness: 0.8 }), 0.05); pad.position.y = -0.06; root.add(pad);
    return { ticks: [c.userData.tick], cam: [4.6, 3.8, 6.6], look: [0, 0.7, 0] };
  },
  epoxy(root) {
    const s = epoxySlab(3.8); root.add(s);
    return { ticks: [s.userData.tick], cam: [4.8, 4.6, 5.8], look: [0, 0, 0] };
  },
  pvc(root) {
    const f = pvcFloor(); root.add(f);
    return { ticks: [f.userData.tick], cam: [4.2, 4.4, 5.4], look: [0, 0.2, 0] };
  },
  interior(root) {
    const r = interiorRoom(); root.add(r);
    return { ticks: [r.userData.tick], cam: [4.2, 3.0, 5.4], look: [-0.2, 1.0, -0.4] };
  },
};

function mount(el) {
  const type = el.getAttribute('data-scene');
  const build = BUILDERS[type];
  if (!build) return;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const hemi = new THREE.HemisphereLight(0xffffff, el.hasAttribute('data-dark') ? 0x062a1d : 0xd8f5e3, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(4, 7, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -4;
  sun.shadow.camera.right = sun.shadow.camera.top = 4;
  sun.shadow.radius = 6;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xff7a7a, 0.6); rim.position.set(-5, 3, -4); scene.add(rim);

  // Soft contact shadow under everything
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.18 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.19; ground.receiveShadow = true; scene.add(ground);

  const root = new THREE.Group();
  scene.add(root);
  const texFrom = ALL_TEX.length;
  const cfg = build(root);
  ALL_TEX.slice(texFrom).forEach((tx) => renderer.initTexture(tx));
  const look = new THREE.Vector3(...cfg.look);
  camera.position.set(...cfg.cam);
  camera.lookAt(look);

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
    camera.zoom = Math.min(1, camera.aspect * 1.05);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(el);
  resize();

  // Pointer parallax
  const target = { x: 0, y: 0 };
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  el.addEventListener('pointerleave', () => { target.x = target.y = 0; });

  let visible = false, last = performance.now(), time = 0;
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; if (visible) { last = performance.now(); loop(); } }, { rootMargin: '100px' }).observe(el);

  function loop() {
    if (!visible) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    if (!reduce) {
      cfg.ticks.forEach((f) => f && f(dt));
      root.rotation.y += ((Math.sin(time * 0.25) * 0.25 + target.x * 0.35) - root.rotation.y) * 0.05;
      root.rotation.x += ((target.y * 0.06) - root.rotation.x) * 0.05;
      root.position.y = Math.sin(time * 0.8) * 0.04;
    }
    renderer.render(scene, camera);
    if (reduce) return; // one static frame
    requestAnimationFrame(loop);
  }
  renderer.render(scene, camera);
}

if (webgl()) {
  document.querySelectorAll('[data-scene]').forEach((el) => {
    try { mount(el); } catch (e) { console.warn('3D scene failed', e); }
  });
}
