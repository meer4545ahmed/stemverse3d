export function buildViewerHtml(
  initialExperimentId: string,
  initialParams: Record<string, number>,
  lightweight = false,
  interactive = true,
  showAnnotationsInit = true
): string {
  const initJson = JSON.stringify({
    experimentId: initialExperimentId,
    params: initialParams,
    lightweight,
    interactive,
    showAnnotations: showAnnotationsInit,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #06070B; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  #canvas-wrap { position: relative; width: 100%; height: 100%; background: #06070B; }
  #annotations { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .ann-btn {
    position: absolute; top: 0; left: 0;
    pointer-events: auto;
    padding: 4px 9px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid #262C3D;
    background: rgba(14,17,24,0.94);
    color: #F4F6FA;
    box-shadow: 0 2px 8px rgba(0,0,0,0.45);
    transform: translate3d(-999px,-999px,0);
  }
  .ann-btn.selected {
    background: #38BDF8;
    color: #06070B;
    border-color: #38BDF8;
  }
  #status-msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    background: #06070B; color: #9CA3B5; font-size: 13px; font-weight: 600; letter-spacing: 0.04em;
  }
</style>
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
  }
}
</script>
</head>
<body>
<div id="canvas-wrap">
  <div id="status-msg">Initializing 3D Apparatus...</div>
  <div id="annotations"></div>
</div>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const INIT = ${initJson};
const wrap = document.getElementById('canvas-wrap');
const annLayer = document.getElementById('annotations');
const statusEl = document.getElementById('status-msg');
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

function postToRN(payload) {
  try {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    } else if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, '*');
    }
  } catch (e) {}
}

// ---------- Procedural Dark-Studio Textures ----------
function createContactShadowTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128,128,14,128,128,124);
  g.addColorStop(0,'rgba(0,0,0,0.55)'); g.addColorStop(0.55,'rgba(0,0,0,0.22)'); g.addColorStop(1,'rgba(6,7,11,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,256,256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function createBenchTex(aniso) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#090B10'; ctx.fillRect(0,0,512,512);
  ctx.strokeStyle = 'rgba(148,163,184,0.08)'; ctx.lineWidth = 1;
  for (let i=0;i<=512;i+=32){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,512); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(512,i); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(56,189,248,0.16)'; ctx.lineWidth = 1.4;
  for (let i=0;i<=512;i+=128){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,512); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(512,i); ctx.stroke(); }
  ctx.fillStyle = 'rgba(56,189,248,0.22)';
  for (let x=16;x<512;x+=32){ for(let y=16;y<512;y+=32){ ctx.beginPath(); ctx.arc(x,y,1.5,0,Math.PI*2); ctx.fill(); } }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(3,3);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t;
}

function createRulerTex(aniso) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0E121B'; ctx.fillRect(0,0,1024,128);
  ctx.strokeStyle = '#38BDF8'; ctx.lineWidth = 2; ctx.strokeRect(2,2,1020,124);
  for (let i=0;i<=50;i++){
    const x = 22 + (i/50)*980;
    const maj = i%5===0;
    ctx.strokeStyle = maj ? '#F4F6FA' : '#64748B';
    ctx.lineWidth = maj ? 2.5 : 1.2;
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,maj?48:26); ctx.stroke();
    if(maj){ ctx.fillStyle='#94A3B8'; ctx.font='bold 20px monospace'; ctx.textAlign='center'; ctx.fillText(String((i-25)*2), x, 86); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t;
}

function createProtractorTex(aniso) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const ctx = c.getContext('2d'); const cx=256, cy=256;
  ctx.fillStyle = '#0D111A'; ctx.beginPath(); ctx.arc(cx,cy,248,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#38BDF8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx,cy,232,0,Math.PI*2); ctx.stroke();
  for(let d=0;d<360;d+=5){
    const r = (d*Math.PI)/180; const maj = d%30===0; const mid = d%15===0;
    ctx.strokeStyle = maj ? '#F4F6FA' : mid ? '#38BDF8' : '#475569';
    ctx.lineWidth = maj ? 2.5 : 1.2;
    const inn = maj ? 185 : mid ? 202 : 216;
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(r)*inn,cy+Math.sin(r)*inn); ctx.lineTo(cx+Math.cos(r)*230,cy+Math.sin(r)*230); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t;
}

function createCartesianTex(aniso) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0B0E15'; ctx.fillRect(0,0,512,512);
  const step = 512/10;
  ctx.strokeStyle = 'rgba(148,163,184,0.16)'; ctx.lineWidth = 1;
  for(let i=0;i<=10;i++){ const p=i*step; ctx.beginPath(); ctx.moveTo(p,0); ctx.lineTo(p,512); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,p); ctx.lineTo(512,p); ctx.stroke(); }
  ctx.strokeStyle = '#38BDF8'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0,256); ctx.lineTo(512,256); ctx.stroke();
  ctx.strokeStyle = '#8B5CF6'; ctx.beginPath(); ctx.moveTo(256,0); ctx.lineTo(256,512); ctx.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t;
}

function createMeterDialTex(label, centerZero, maxVal, aniso) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0D111A'; ctx.beginPath(); ctx.arc(128,128,124,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#38BDF8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(128,128,116,0,Math.PI*2); ctx.stroke();
  for(let i=0;i<=10;i++){
    const f = i/10; const a = Math.PI*1.18 + f*(Math.PI*0.64);
    ctx.strokeStyle = i%2===0 ? '#F4F6FA' : '#64748B'; ctx.lineWidth = i%2===0 ? 2.5 : 1.2;
    ctx.beginPath(); ctx.moveTo(128+Math.cos(a)*86,128+Math.sin(a)*86); ctx.lineTo(128+Math.cos(a)*102,128+Math.sin(a)*102); ctx.stroke();
  }
  ctx.fillStyle = '#38BDF8'; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'center'; ctx.fillText(label, 128, 178);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t;
}

function createLiveDisplay(w, h, aniso) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = aniso;
  return { ctx, texture };
}

function createMyocardiumTex(baseHex, veinHex) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d'); ctx.fillStyle = baseHex; ctx.fillRect(0,0,256,256);
  for(let i=0;i<100;i++){
    const y = (i/100)*256; ctx.strokeStyle = i%2===0 ? 'rgba(255,220,220,0.09)' : 'rgba(40,5,5,0.14)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0,y); ctx.quadraticCurveTo(128, y + Math.sin(i*0.5)*10, 256, y); ctx.stroke();
  }
  ctx.strokeStyle = veinHex; ctx.lineWidth = 1.2;
  for(let v=0;v<8;v++){ ctx.beginPath(); ctx.moveTo((v*37)%256,(v*23)%256); ctx.lineTo(((v*37)+70)%256,((v*23)+55)%256); ctx.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

function createIrisTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d'); const cx=128, cy=128;
  const g = ctx.createRadialGradient(cx,cy,35,cx,cy,125);
  g.addColorStop(0,'#D97706'); g.addColorStop(0.26,'#0284C7'); g.addColorStop(0.76,'#0F766E'); g.addColorStop(0.96,'#0F172A');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx,cy,126,0,Math.PI*2); ctx.fill();
  for(let i=0;i<180;i++){
    const a=(i/180)*Math.PI*2; ctx.strokeStyle = i%2===0 ? 'rgba(186,230,253,0.34)' : 'rgba(15,23,42,0.22)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*38,cy+Math.sin(a)*38); ctx.lineTo(cx+Math.cos(a)*114,cy+Math.sin(a)*114); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function createRetinaTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128,128,15,128,128,140);
  g.addColorStop(0,'#EA580C'); g.addColorStop(0.5,'#DC2626'); g.addColorStop(1,'#991B1B');
  ctx.fillStyle = g; ctx.fillRect(0,0,256,256);
  ctx.fillStyle = '#FDE68A'; ctx.beginPath(); ctx.arc(95,128,12,0,Math.PI*2); ctx.fill();
  for(let i=0;i<8;i++){
    const a = -2.4 + i*0.65; ctx.strokeStyle = i%2===0 ? '#7F1D1D' : '#F87171'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(95,128); ctx.quadraticCurveTo(95+Math.cos(a)*50,128+Math.sin(a)*50,95+Math.cos(a)*115,128+Math.sin(a)*105); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function createBrainTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#F3B7C0'; ctx.fillRect(0,0,256,256);
  const b = document.createElement('canvas'); b.width = 256; b.height = 256;
  const bctx = b.getContext('2d'); bctx.fillStyle = '#D0D0D0'; bctx.fillRect(0,0,256,256);
  for(let r=0;r<10;r++){
    const by = r*26+10;
    ctx.strokeStyle='#9D4E5E'; ctx.lineWidth=4; bctx.strokeStyle='#2A2A2A'; bctx.lineWidth=6;
    ctx.beginPath(); bctx.beginPath();
    for(let x=0;x<=256;x+=16){
      const y = by + Math.sin(x*0.07+r)*8;
      if(x===0){ctx.moveTo(x,y);bctx.moveTo(x,y);}else{ctx.lineTo(x,y);bctx.lineTo(x,y);}
    }
    ctx.stroke(); bctx.stroke();
  }
  const color = new THREE.CanvasTexture(c); color.colorSpace = THREE.SRGBColorSpace;
  const bump = new THREE.CanvasTexture(b);
  return { color, bump };
}

// ---------- Material & Apparatus Helpers ----------
function makeGlass(color, opacity) {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 0.02, roughness: 0.08, transparent: true, opacity: opacity || 0.44, clearcoat: 1.0, depthWrite: false });
}
function makeMetal(color, rough, metal) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough !== undefined ? rough : 0.28, metalness: metal !== undefined ? metal : 0.85 });
}
function makeOrganic(color, rough, map, bump) {
  return new THREE.MeshPhysicalMaterial({ color, map, bumpMap: bump, bumpScale: bump ? 0.04 : 0, roughness: rough || 0.34, metalness: 0.02, clearcoat: 0.55 });
}
function updateCylBetween(mesh, a, b) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = Math.max(0.001, dir.length());
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.scale.set(1, len, 1);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.normalize());
}
function createCylBetween(a, b, r, mat) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 10), mat);
  updateCylBetween(m, a, b);
  return m;
}
function createHelicalCoil(radius, length, turns, wireRadius, color) {
  const pts = [];
  const total = Math.max(60, turns * 18);
  for(let i=0;i<=total;i++){
    const f = i/total;
    const a = f * turns * Math.PI * 2;
    pts.push(new THREE.Vector3((f-0.5)*length, Math.cos(a)*radius, Math.sin(a)*radius));
  }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), total, wireRadius, 8, false), makeMetal(color, 0.22, 0.92));
}
function createBenchConsole(w, h, tex) {
  const g = new THREE.Group();
  const housing = new THREE.Mesh(new THREE.BoxGeometry(w+0.16, h+0.16, 0.22), makeMetal(0x273244, 0.32, 0.78));
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(w+0.06, h+0.06, 0.04), makeMetal(0x475569, 0.25, 0.9));
  bezel.position.z = 0.1;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  screen.position.z = 0.125;
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.14, 0.45, 16), makeMetal(0x64748b, 0.25, 0.85));
  pedestal.position.set(0, -(h*0.5 + 0.26), -0.02);
  g.add(housing, bezel, screen, pedestal);
  return g;
}
function createBeaker(rad, h, liqColor, fill) {
  const g = new THREE.Group();
  const pts = [new THREE.Vector2(0,0), new THREE.Vector2(rad,0), new THREE.Vector2(rad,h), new THREE.Vector2(rad*1.06,h+0.04)];
  const glass = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), makeGlass(0xdbeafe, 0.38));
  glass.renderOrder = 3;
  const lh = Math.max(0.1, (h-0.1)*fill);
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(rad*0.92,rad*0.92,lh,24), new THREE.MeshPhysicalMaterial({ color: liqColor, roughness: 0.12, transparent: true, opacity: 0.8 }));
  liq.position.y = 0.05 + lh/2;
  g.add(glass, liq);
  return { group: g, liquidMesh: liq };
}
function createMeter(label, centerZero, maxVal, aniso) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.95,0.9,0.65), makeMetal(0x263142, 0.34, 0.72));
  body.position.y = 0.45;
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.34, 28), new THREE.MeshBasicMaterial({ map: createMeterDialTex(label, centerZero, maxVal, aniso) }));
  face.position.set(0,0.5,0.335);
  const pivot = new THREE.Group(); pivot.position.set(0,0.44,0.345);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.02,0.24,0.01), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  needle.position.y = 0.1; pivot.add(needle);
  g.add(body, face, pivot);
  return { group: g, needlePivot: pivot };
}
function createLens(isConvex, radius) {
  const pts = []; const steps = 12;
  for(let i=0;i<=steps;i++){ const t=i/steps; const r=t*radius; pts.push(new THREE.Vector2(r, isConvex ? 0.04+0.15*(1-t*t) : 0.04+0.15*(t*t))); }
  for(let i=steps;i>=0;i--){ const t=i/steps; const r=t*radius; pts.push(new THREE.Vector2(r, -(isConvex ? 0.04+0.15*(1-t*t) : 0.04+0.15*(t*t)))); }
  const geo = new THREE.LatheGeometry(pts, 32); geo.rotateZ(Math.PI/2);
  return new THREE.Mesh(geo, makeGlass(0x93c5fd, 0.48));
}

// ---------- Renderer & Obsidian Studio Scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: !INIT.lightweight, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.setPixelRatio(INIT.lightweight ? 1 : Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(wrap.clientWidth, wrap.clientHeight);
wrap.insertBefore(renderer.domElement, annLayer);
statusEl.style.display = 'none';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06070b);
scene.fog = new THREE.FogExp2(0x06070b, 0.02);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

scene.add(new THREE.HemisphereLight(0xf1f5f9, 0x1e293b, 0.72));
const keyLight = new THREE.DirectionalLight(0xfffaf0, 1.55);
keyLight.position.set(4.5, 7.5, 5.0);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
rimLight.position.set(-5.0, 4.0, -5.0);
scene.add(rimLight);

const maxAniso = renderer.capabilities.getMaxAnisotropy();
const plinth = new THREE.Mesh(
  new THREE.CylinderGeometry(4.8, 5.1, 0.24, 56),
  new THREE.MeshStandardMaterial({ map: createBenchTex(maxAniso), roughness: 0.48, metalness: 0.28 })
);
plinth.position.y = -0.12;
scene.add(plinth);
const rimRing = new THREE.Mesh(new THREE.TorusGeometry(4.82, 0.025, 10, 72), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.35 }));
rimRing.rotation.x = Math.PI/2;
scene.add(rimRing);
const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(7.2,7.2), new THREE.MeshBasicMaterial({ map: createContactShadowTex(), transparent: true, depthWrite: false, opacity: 0.65 }));
shadowPlane.rotation.x = -Math.PI/2; shadowPlane.position.y = 0.005;
scene.add(shadowPlane);

const camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / Math.max(1, wrap.clientHeight), 0.1, 100);
function applyResponsiveFov(w, h) {
  const aspect = Math.max(0.42, w / Math.max(1, h));
  camera.aspect = aspect;
  if (aspect < 1.05) {
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(22.5));
    const vertFov = THREE.MathUtils.radToDeg(2 * Math.atan(tanHalf / Math.max(0.46, aspect * 0.94)));
    camera.fov = THREE.MathUtils.clamp(vertFov, 45, 76);
  } else {
    camera.fov = 45;
  }
  camera.updateProjectionMatrix();
}
applyResponsiveFov(wrap.clientWidth, wrap.clientHeight);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.07;
controls.enableRotate = INIT.interactive; controls.enableZoom = INIT.interactive; controls.enablePan = INIT.interactive;
controls.minDistance = 1.6; controls.maxDistance = 15.0; controls.maxPolarAngle = Math.PI * 0.485;

// ---------- Scene State ----------
let state = {
  experimentId: INIT.experimentId,
  params: Object.assign({}, INIT.params),
  playing: true,
  exploded: 0,
  showAnnotations: INIT.showAnnotations,
  selectedMeshKey: null,
  camTransitionActive: false,
  camGoalPos: new THREE.Vector3(0, 2.5, 4.8),
  camGoalTarget: new THREE.Vector3(0, 1.3, 0),
};
controls.addEventListener('start', () => { state.camTransitionActive = false; });

let activeScene = null;
let registered = [];
const origEmissives = new Map();

function registerComponent(object, meshKey, label, explodeOffset, labelAnchorLocal) {
  const meshes = [];
  object.traverse((ch) => {
    if (ch.isMesh) { ch.userData.meshKey = meshKey; meshes.push(ch); }
  });
  registered.push({
    meshKey, label, object,
    basePosition: object.position.clone(),
    explodeOffset: explodeOffset || new THREE.Vector3(),
    labelAnchorLocal: labelAnchorLocal || new THREE.Vector3(0, 0.5, 0),
    meshes,
  });
}

function applyHighlight(meshKey) {
  registered.forEach((comp) => {
    const isSel = meshKey !== null && comp.meshKey === meshKey;
    comp.meshes.forEach((m) => {
      const mat = m.material;
      if (mat && mat.emissive) {
        if (!origEmissives.has(mat)) origEmissives.set(mat, mat.emissive.getHex());
        mat.emissive.setHex(isSel ? 0x0284c7 : (origEmissives.get(mat) || 0x000000));
      }
    });
  });
}

function buildOpticsBench() {
  const bench = new THREE.Group();
  const rail = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.22, 0.76), makeMetal(0x273244, 0.28, 0.84));
  rail.position.y = 0.11;
  bench.add(rail);
  const slotMat = makeMetal(0x94a3b8, 0.22, 0.92);
  [-0.28, 0.28].forEach((z) => {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(7.36, 0.04, 0.06), slotMat);
    slot.position.set(0, 0.23, z);
    bench.add(slot);
  });
  const scaleStrip = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 0.34), new THREE.MeshBasicMaterial({ map: createRulerTex(maxAniso) }));
  scaleStrip.rotation.x = -Math.PI/2; scaleStrip.position.set(0, 0.226, 0.02);
  bench.add(scaleStrip);
  registerComponent(bench, 'bench', 'Optical Bench', new THREE.Vector3(0, -0.45, 0), new THREE.Vector3(0, 0.25, 0.42));
  return bench;
}

function buildEyeGroup(includeLens) {
  const g = new THREE.Group();
  const scleraGrp = new THREE.Group();
  const scleraMat = makeOrganic(0xf4f1ea, 0.28); scleraMat.side = THREE.DoubleSide;
  const sclera = new THREE.Mesh(new THREE.SphereGeometry(1.28, 36, 36, 0, Math.PI*1.62, 0.12, Math.PI-0.24), scleraMat);
  sclera.rotation.y = 0.28;
  const choroidMat = makeOrganic(0x581c1c, 0.42); choroidMat.side = THREE.DoubleSide;
  const choroid = new THREE.Mesh(new THREE.SphereGeometry(1.22, 32, 32, 0, Math.PI*1.58, 0.14, Math.PI-0.28), choroidMat);
  choroid.rotation.y = 0.29;
  const mMat = makeOrganic(0xb91c1c, 0.42);
  [[0.25,1.15,0,-0.25],[0.25,-1.15,0,0.25]].forEach(([x,y,z,rz])=>{
    const s = new THREE.Mesh(new THREE.BoxGeometry(1.1,0.15,0.26), mMat); s.position.set(x,y,z); s.rotation.z=rz; scleraGrp.add(s);
  });
  scleraGrp.add(sclera, choroid);
  registerComponent(scleraGrp, 'sclera', 'Sclera & Choroid', new THREE.Vector3(0,0,-0.55), new THREE.Vector3(0,1.42,0));

  const corneaGrp = new THREE.Group();
  const cPts = [];
  for(let i=0;i<=12;i++){ const a=(i/12)*Math.PI*0.46; cPts.push(new THREE.Vector2(Math.sin(a)*0.68, Math.cos(a)*0.52-0.08)); }
  const cGeo = new THREE.LatheGeometry(cPts, 32); cGeo.rotateZ(Math.PI/2);
  const cornea = new THREE.Mesh(cGeo, makeGlass(0xdbeafe, 0.36)); cornea.position.set(-1.12,0,0);
  const limbus = new THREE.Mesh(new THREE.TorusGeometry(0.66,0.03,10,32), makeOrganic(0xcbd5e1,0.3)); limbus.rotation.y=Math.PI/2; limbus.position.set(-1.08,0,0);
  corneaGrp.add(cornea, limbus);
  registerComponent(corneaGrp, 'cornea', 'Cornea', new THREE.Vector3(-0.7,0,0), new THREE.Vector3(-1.45,0.65,0));

  const irisGrp = new THREE.Group();
  const irisMat = new THREE.MeshStandardMaterial({ map: createIrisTex(), roughness: 0.42, side: THREE.DoubleSide });
  const irisDisc = new THREE.Mesh(new THREE.RingGeometry(0.18,0.58,40), irisMat); irisDisc.rotation.y=Math.PI/2; irisDisc.position.set(-0.96,0,0);
  const pupilDisc = new THREE.Mesh(new THREE.CircleGeometry(0.22,28), new THREE.MeshBasicMaterial({ color: 0x05070b, side: THREE.DoubleSide })); pupilDisc.rotation.y=Math.PI/2; pupilDisc.position.set(-0.955,0,0);
  const ciliary = new THREE.Mesh(new THREE.TorusGeometry(0.62,0.075,12,32), makeOrganic(0xbe123c,0.45)); ciliary.rotation.y=Math.PI/2; ciliary.position.set(-0.74,0,0);
  irisGrp.add(irisDisc, pupilDisc, ciliary);
  registerComponent(irisGrp, 'iris', 'Iris, Pupil & Ciliary', new THREE.Vector3(-0.35,0,0), new THREE.Vector3(-0.98,0.72,0));

  if (includeLens) {
    const lensM = createLens(true, 0.42); lensM.position.set(-0.64,0,0);
    registerComponent(lensM, 'lens', 'Crystalline Lens', new THREE.Vector3(0,0.35,0.4), new THREE.Vector3(-0.64,0.65,0));
    g.add(lensM);
  }

  const retGrp = new THREE.Group();
  const retMat = makeOrganic(0xffffff, 0.48, createRetinaTex()); retMat.side = THREE.DoubleSide;
  const ret = new THREE.Mesh(new THREE.SphereGeometry(1.16,32,32,-Math.PI*0.46,Math.PI*0.92,0.25,Math.PI-0.5), retMat);
  ret.position.set(0.06,0,0); ret.rotation.y = Math.PI;
  const nerveCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(1.14,-0.08,-0.12), new THREE.Vector3(1.6,-0.14,-0.18), new THREE.Vector3(2.05,-0.22,-0.26)]);
  const opticNerve = new THREE.Mesh(new THREE.TubeGeometry(nerveCurve, 18, 0.2, 14, false), makeOrganic(0xfef3c7, 0.42));
  retGrp.add(ret, opticNerve);
  registerComponent(retGrp, 'retina', 'Retina & Optic Nerve', new THREE.Vector3(0.65,0,0), new THREE.Vector3(1.35,0.55,0));

  g.add(scleraGrp, corneaGrp, irisGrp, retGrp);
  return { group: g, irisDisc, pupilDisc };
}

function buildScene(id) {
  const root = new THREE.Group();

  // P01 & P02: Optical Bench + Spherical Mirror / Lens + Live Projection Output Screen
  if (id === 'P01' || id === 'P02') {
    root.add(buildOpticsBench());
    const isMirror = id === 'P01';
    const optGroup = new THREE.Group();
    optGroup.position.set(isMirror ? 2.4 : 0, 0, 0);
    const car = new THREE.Mesh(new THREE.BoxGeometry(0.38,0.22,0.62), makeMetal(0x334155, 0.28, 0.82)); car.position.y = 0.32;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.11,0.85,18), makeMetal(0x94a3b8)); post.position.y = 0.74;
    const gimbal = new THREE.Mesh(new THREE.TorusGeometry(0.8,0.048,12,32), makeMetal(0xd97706, 0.22, 0.92)); gimbal.position.y = 1.48; gimbal.rotation.y = Math.PI/2;
    optGroup.add(car, post, gimbal);

    let mirrorDish = null, mirrorBack = null, convL = null, concL = null;
    if (isMirror) {
      mirrorBack = new THREE.Mesh(new THREE.CylinderGeometry(0.76,0.76,0.08,28), makeMetal(0x1e293b));
      mirrorBack.rotation.z = Math.PI/2; mirrorBack.position.set(0.09, 1.48, 0);
      mirrorDish = new THREE.Mesh(new THREE.SphereGeometry(2.2, 32, 24, 0, Math.PI*2, 0, 0.34), new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, metalness: 0.96, roughness: 0.04, clearcoat: 1.0, side: THREE.DoubleSide }));
      mirrorDish.rotation.z = -Math.PI/2; mirrorDish.position.set(2.05, 1.48, 0);
      optGroup.add(mirrorBack, mirrorDish);
      registerComponent(optGroup, 'mirror', 'Spherical Mirror', new THREE.Vector3(0.5,0,0), new THREE.Vector3(0,2.38,0));
    } else {
      convL = createLens(true, 0.82); convL.position.y = 1.48;
      concL = createLens(false, 0.82); concL.position.y = 1.48; concL.visible = false;
      optGroup.add(convL, concL);
      registerComponent(optGroup, 'lens', 'Optical Lens', new THREE.Vector3(0,0.45,0), new THREE.Vector3(0,2.42,0));
    }
    root.add(optGroup);

    const objGroup = new THREE.Group();
    const oCar = new THREE.Mesh(new THREE.BoxGeometry(0.32,0.2,0.52), makeMetal(0x334155)); oCar.position.y = 0.32;
    const oPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.07,0.78,12), makeMetal(0x94a3b8)); oPost.position.y = 0.72;
    const oHead = new THREE.Mesh(new THREE.ConeGeometry(0.11,0.48,16), new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 1.0 })); oHead.position.y = 1.72;
    objGroup.add(oCar, oPost, oHead);
    registerComponent(objGroup, 'object', 'Illuminated Object', new THREE.Vector3(-0.35,0,0.4), new THREE.Vector3(0,2.1,0));
    root.add(objGroup);

    const outTex = createLiveDisplay(360, 420, maxAniso);
    const scrGroup = new THREE.Group();
    const sCar = new THREE.Mesh(new THREE.BoxGeometry(0.32,0.2,0.52), makeMetal(0x334155)); sCar.position.y = 0.32;
    const sPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.07,0.6,12), makeMetal(0x94a3b8)); sPost.position.y = 0.65;
    const sFrame = new THREE.Mesh(new THREE.BoxGeometry(0.09,1.48,1.18), makeMetal(0x273244, 0.3, 0.85)); sFrame.position.y = 1.48;
    const sFace = new THREE.Mesh(new THREE.PlaneGeometry(1.06,1.36), new THREE.MeshBasicMaterial({ map: outTex.texture, side: THREE.DoubleSide }));
    sFace.rotation.y = -Math.PI/2; sFace.position.set(-0.05,1.48,0);
    const sBack = sFace.clone(); sBack.rotation.y = Math.PI/2; sBack.position.set(0.05,1.48,0);
    scrGroup.add(sCar, sPost, sFrame, sFace, sBack);
    registerComponent(scrGroup, isMirror ? 'image' : 'screen', 'Output Screen', new THREE.Vector3(0.35,0,-0.4), new THREE.Vector3(0,2.35,0));
    root.add(scrGroup);

    const rMat1 = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const rMat2 = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const r1 = createCylBetween(new THREE.Vector3(), new THREE.Vector3(1,0,0), 0.018, rMat1);
    const r2 = createCylBetween(new THREE.Vector3(), new THREE.Vector3(1,0,0), 0.018, rMat1);
    const r3 = createCylBetween(new THREE.Vector3(), new THREE.Vector3(1,0,0), 0.018, rMat2);
    const r4 = createCylBetween(new THREE.Vector3(), new THREE.Vector3(1,0,0), 0.018, rMat2);
    root.add(r1, r2, r3, r4);

    let lastKey = '';
    return {
      root, camPos: [0,3.2,6.2], target: [isMirror ? 0.3 : 0, 1.35, 0],
      update: (_dt, _el, p) => {
        const alt = isMirror ? (p.mirrorType||0)>=0.5 : (p.lensType||0)>=0.5;
        const uCm = p.objectDistance || (isMirror ? 42 : 38);
        const fCm = p.focalLength || (isMirror ? 16 : 15);
        let vCm, mag, objX, imgX;
        if (isMirror) {
          mirrorDish.rotation.z = alt ? Math.PI/2 : -Math.PI/2;
          mirrorDish.position.x = alt ? -2.05 : 2.05;
          mirrorBack.position.x = alt ? -0.1 : 0.1;
          const u = -uCm, f = alt ? fCm : -fCm;
          const den = 1/f - 1/u;
          vCm = Math.abs(den) < 0.005 ? -160 : 1/den;
          mag = -vCm / u;
          objX = THREE.MathUtils.clamp(2.4 - uCm*0.075, -3.2, 1.9);
          imgX = THREE.MathUtils.clamp(2.4 + vCm*0.075, -3.35, 3.65);
          objGroup.position.x = objX; scrGroup.position.x = imgX;
          const optX = 2.4; const imgH = THREE.MathUtils.clamp(0.45*mag, -0.78, 0.78);
          updateCylBetween(r1, new THREE.Vector3(objX,1.93,0), new THREE.Vector3(optX,1.93,0));
          updateCylBetween(r2, new THREE.Vector3(optX,1.93,0), new THREE.Vector3(imgX,1.48+imgH,0));
          updateCylBetween(r3, new THREE.Vector3(objX,1.93,0), new THREE.Vector3(optX,1.48,0));
          updateCylBetween(r4, new THREE.Vector3(optX,1.48,0), new THREE.Vector3(imgX,1.48+imgH,0));
        } else {
          convL.visible = !alt; concL.visible = alt;
          const u = -uCm, f = alt ? -fCm : fCm;
          const den = 1/f + 1/u;
          vCm = Math.abs(den) < 0.005 ? 140 : 1/den;
          mag = vCm / u;
          objX = THREE.MathUtils.clamp(u*0.058, -3.4, -0.6);
          imgX = THREE.MathUtils.clamp(vCm*0.058, -3.4, 3.4);
          objGroup.position.x = objX; scrGroup.position.x = imgX;
          const imgH = THREE.MathUtils.clamp(0.48*mag, -0.78, 0.78);
          updateCylBetween(r1, new THREE.Vector3(objX,1.96,0), new THREE.Vector3(0,1.96,0));
          updateCylBetween(r2, new THREE.Vector3(0,1.96,0), new THREE.Vector3(imgX,1.48+imgH,0));
          updateCylBetween(r3, new THREE.Vector3(objX,1.96,0), new THREE.Vector3(0,1.48,0));
          updateCylBetween(r4, new THREE.Vector3(0,1.48,0), new THREE.Vector3(imgX,1.48+imgH,0));
        }
        const key = (alt?1:0)+'|'+uCm+'|'+fCm;
        if (key !== lastKey) {
          lastKey = key;
          const c = outTex.ctx; const W = 360, H = 420;
          c.fillStyle = '#07090E'; c.fillRect(0,0,W,H);
          c.strokeStyle = 'rgba(148,163,184,0.18)'; c.lineWidth = 1;
          for(let g=48;g<H-54;g+=36){ c.beginPath(); c.moveTo(0,g); c.lineTo(W,g); c.stroke(); }
          const isReal = isMirror ? vCm < 0 : vCm > 0;
          const pxH = THREE.MathUtils.clamp(Math.abs(mag)*95, 24, 140);
          const dir = mag < 0 ? 1 : -1;
          const tipY = H/2 + dir*pxH;
          c.strokeStyle = isReal ? '#34D399' : '#38BDF8'; c.fillStyle = c.strokeStyle; c.lineWidth = 8;
          c.beginPath(); c.moveTo(W/2, H/2); c.lineTo(W/2, tipY); c.stroke();
          c.beginPath(); c.moveTo(W/2, tipY+dir*16); c.lineTo(W/2-14, tipY-dir*4); c.lineTo(W/2+14, tipY-dir*4); c.closePath(); c.fill();
          c.fillStyle = '#0B0F17'; c.fillRect(0,0,W,44); c.fillRect(0,H-54,W,54);
          c.fillStyle = '#94A3B8'; c.font = 'bold 16px monospace'; c.textAlign = 'left'; c.fillText('SCREEN OUTPUT', 14, 28);
          c.fillStyle = isReal ? '#34D399' : '#38BDF8'; c.textAlign = 'right'; c.fillText(isReal ? 'REAL · INVERTED' : 'VIRTUAL · ERECT', W-14, 28);
          c.fillStyle = '#F8FAFC'; c.textAlign = 'center'; c.font = 'bold 18px monospace';
          c.fillText('v = '+vCm.toFixed(1)+' cm  |  m = '+mag.toFixed(2)+'x', W/2, H-20);
          outTex.texture.needsUpdate = true;
        }
      },
      readouts: (p) => {
        const alt = isMirror ? (p.mirrorType||0)>=0.5 : (p.lensType||0)>=0.5;
        const u = -(p.objectDistance || (isMirror?42:38));
        const f = isMirror ? (alt?(p.focalLength||16):-(p.focalLength||16)) : (alt?-(p.focalLength||15):(p.focalLength||15));
        const v = isMirror ? 1/(1/f - 1/u) : 1/(1/f + 1/u);
        return [{ label: 'Image Distance (v)', value: Number.isFinite(v) ? v.toFixed(1) : '∞', unit: 'cm' }, { label: 'Magnification', value: (isMirror ? -v/u : v/u).toFixed(2), unit: 'x' }];
      }
    };
  }

  // P03: Glass Slab Refraction + Live Lateral Shift Sensor Console
  if (id === 'P03') {
    const slabGrp = new THREE.Group();
    const slabMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6,1.15,2.0), makeGlass(0x7dd3fc, 0.42));
    slabMesh.position.y = 0.62;
    [-1.72, 1.72].forEach((cx) => {
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.16,1.2,0.16), makeMetal(0xd97706, 0.24, 0.9));
      clamp.position.set(cx, 0.62, 0); slabGrp.add(clamp);
    });
    slabGrp.add(slabMesh);
    registerComponent(slabGrp, 'slab', 'Crown Glass Slab', new THREE.Vector3(0,0,0), new THREE.Vector3(0,1.35,0));
    root.add(slabGrp);

    const gonio = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.65,2.65,0.04,48), new THREE.MeshBasicMaterial({ map: createProtractorTex(maxAniso) }));
    plate.position.y = 0.025;
    const norm = new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,4.4,8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    norm.rotation.x = Math.PI/2; norm.position.set(0,0.62,0);
    gonio.add(plate, norm);
    registerComponent(gonio, 'protractor', 'Goniometer Stage', new THREE.Vector3(0,-0.25,0), new THREE.Vector3(0,0.2,2.3));
    root.add(gonio);

    const laser = new THREE.Group();
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.14,0.82,18), makeMetal(0x334155)); barrel.rotation.x = Math.PI/2;
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.08,14), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.5 }));
    tip.rotation.x = Math.PI/2; tip.position.z = 0.44;
    laser.add(barrel, tip);
    registerComponent(laser, 'laser', 'He-Ne Laser Diode', new THREE.Vector3(0,0.4,0), new THREE.Vector3(0,0.9,0));
    root.add(laser);

    const shiftTex = createLiveDisplay(420, 260, maxAniso);
    const console3 = createBenchConsole(1.65, 1.0, shiftTex.texture);
    console3.position.set(2.45, 0.95, -2.0); console3.rotation.y = -0.32;
    root.add(console3);

    const bMat = new THREE.MeshBasicMaterial({ color: 0xff3b3b });
    const rIn = createCylBetween(new THREE.Vector3(), new THREE.Vector3(1,0,0), 0.025, bMat);
    const rMid = createCylBetween(new THREE.Vector3(), new THREE.Vector3(1,0,0), 0.025, bMat);
    const rOut = createCylBetween(new THREE.Vector3(), new THREE.Vector3(1,0,0), 0.025, bMat);
    root.add(rIn, rMid, rOut);

    let lastKey = '';
    return {
      root, camPos: [2.2,4.4,4.4], target: [0.3,0.6,0],
      update: (_dt,_el,p) => {
        const iDeg = p.incidentAngle!==undefined ? p.incidentAngle : 45;
        const n = p.refractiveIndex || 1.52;
        const thick = p.slabThickness || 2.0;
        slabMesh.scale.z = thick / 2.0;
        const iRad = THREE.MathUtils.degToRad(iDeg);
        const rRad = Math.asin(Math.min(0.99, Math.sin(iRad)/n));
        const hz = thick*0.5;
        const entry = new THREE.Vector3(0, 0.62, hz);
        const src = new THREE.Vector3(-Math.sin(iRad)*2.5, 0.62, hz + Math.cos(iRad)*2.5);
        const exitX = Math.tan(rRad)*thick;
        const exit = new THREE.Vector3(exitX, 0.62, -hz);
        const emergent = new THREE.Vector3(exitX + Math.sin(iRad)*2.3, 0.62, -hz - Math.cos(iRad)*2.3);
        laser.position.copy(src); laser.lookAt(entry);
        updateCylBetween(rIn, src, entry); updateCylBetween(rMid, entry, exit); updateCylBetween(rOut, exit, emergent);

        const key = iDeg+'|'+n+'|'+thick;
        if (key !== lastKey) {
          lastKey = key;
          const shift = (thick * Math.sin(iRad - rRad)) / Math.cos(rRad);
          const c = shiftTex.ctx;
          c.fillStyle = '#070A10'; c.fillRect(0,0,420,260);
          c.strokeStyle = 'rgba(56,189,248,0.22)'; c.strokeRect(14,14,392,232);
          c.fillStyle = '#94A3B8'; c.font = 'bold 16px monospace'; c.textAlign = 'left'; c.fillText('LATERAL SHIFT SENSOR', 26, 42);
          const refX = 140, dotX = refX + shift*85;
          c.strokeStyle = '#64748B'; c.setLineDash([4,4]); c.beginPath(); c.moveTo(refX,66); c.lineTo(refX,180); c.stroke(); c.setLineDash([]);
          c.strokeStyle = '#38BDF8'; c.lineWidth = 3; c.beginPath(); c.moveTo(refX,128); c.lineTo(dotX,128); c.stroke();
          c.fillStyle = '#EF4444'; c.beginPath(); c.arc(dotX,128,13,0,Math.PI*2); c.fill();
          c.fillStyle = '#F8FAFC'; c.font = 'bold 20px monospace'; c.fillText('d = '+shift.toFixed(2)+' cm', 26, 222);
          c.fillStyle = '#38BDF8'; c.textAlign = 'right'; c.fillText('r = '+THREE.MathUtils.radToDeg(rRad).toFixed(1)+'°', 394, 222);
          shiftTex.texture.needsUpdate = true;
        }
      },
      readouts: (p) => {
        const i = p.incidentAngle!==undefined?p.incidentAngle:45, n = p.refractiveIndex||1.52, t = p.slabThickness||2.0;
        const rRad = Math.asin(Math.min(0.99, Math.sin(THREE.MathUtils.degToRad(i))/n));
        const shift = (t*Math.sin(THREE.MathUtils.degToRad(i)-rRad))/Math.cos(rRad);
        return [{ label: 'Refraction (r)', value: THREE.MathUtils.radToDeg(rRad).toFixed(1), unit: '°' }, { label: 'Lateral Shift (d)', value: shift.toFixed(2), unit: 'cm' }];
      }
    };
  }

  // P04: Prism Dispersion + Live VIBGYOR Spectrum Screen
  if (id === 'P04') {
    const prismGrp = new THREE.Group();
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.95,1.15,0.25,28), makeMetal(0xd97706, 0.24, 0.9)); ped.position.y = 0.125;
    const tri = new THREE.Shape();
    for(let k=0;k<3;k++){ const a=(k*2*Math.PI)/3+Math.PI/2; const x=Math.cos(a)*1.05, y=Math.sin(a)*1.05; if(k===0) tri.moveTo(x,y); else tri.lineTo(x,y); }
    tri.closePath();
    const geo = new THREE.ExtrudeGeometry(tri, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03 });
    geo.rotateX(Math.PI/2); geo.translate(0,1.8,0);
    prismGrp.add(ped, new THREE.Mesh(geo, makeGlass(0xe0f2fe, 0.45)));
    registerComponent(prismGrp, 'prism', 'Flint Glass Prism', new THREE.Vector3(0,0.45,0), new THREE.Vector3(0,2.0,0));
    root.add(prismGrp);

    const src = new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.22,0.9,18), makeMetal(0x273244)); src.rotation.z = Math.PI/2; src.position.set(-3.0,1.15,0);
    registerComponent(src, 'source', 'Xenon Slit Source', new THREE.Vector3(-0.5,0,0), new THREE.Vector3(0,0.45,0));
    root.add(src);

    const specTex = createLiveDisplay(360, 460, maxAniso);
    const scrGrp = new THREE.Group(); scrGrp.position.set(3.15, 0, 0);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.14,2.25,1.85), makeMetal(0x222938)); plate.position.y = 1.15;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.7,2.05), new THREE.MeshBasicMaterial({ map: specTex.texture }));
    face.rotation.y = -Math.PI/2; face.position.set(-0.075,1.15,0);
    scrGrp.add(plate, face);
    registerComponent(scrGrp, 'screen', 'Spectrometer Screen', new THREE.Vector3(0.5,0,0), new THREE.Vector3(0,2.38,0));
    root.add(scrGrp);

    const wBeam = createCylBetween(new THREE.Vector3(-2.6,1.15,0), new THREE.Vector3(-0.45,1.15,0), 0.03, new THREE.MeshBasicMaterial({ color: 0xfef3c7 }));
    const vib = [0xef4444,0xf97316,0xeab308,0x22c55e,0x3b82f6,0x6366f1,0xa855f7].map((c)=>createCylBetween(new THREE.Vector3(-0.45,1.15,0), new THREE.Vector3(3.05,0.6,0), 0.018, new THREE.MeshBasicMaterial({ color: c })));
    root.add(wBeam, ...vib);

    let lastKey = '';
    return {
      root, camPos: [0.2,2.7,5.8], target: [0,1.1,0],
      update: (_dt,_el,p) => {
        const inc = p.incidentAngle || 44; const disp = p.dispersion || 1.2;
        prismGrp.rotation.y = THREE.MathUtils.degToRad(p.prismRotation || 0);
        const sPos = new THREE.Vector3(-3.0, 1.15 - Math.sin(THREE.MathUtils.degToRad(inc-44))*1.1, 0);
        src.position.copy(sPos); updateCylBetween(wBeam, sPos, new THREE.Vector3(-0.45,1.15,0));
        vib.forEach((b,i) => updateCylBetween(b, new THREE.Vector3(0.45,1.15-(0.04+(i/6)*0.12*disp),0), new THREE.Vector3(3.06, 1.0-(i/6)*0.68*disp, 0)));
        const key = inc+'|'+disp+'|'+(p.prismRotation||0);
        if (key !== lastKey) {
          lastKey = key;
          const c = specTex.ctx;
          c.fillStyle = '#07090E'; c.fillRect(0,0,360,460);
          c.fillStyle = '#94A3B8'; c.font = 'bold 17px monospace'; c.textAlign = 'center'; c.fillText('DISPERSION SPECTRUM', 180, 34);
          const bt = 100 + Math.max(0,(inc-30)*1.1); const bh = Math.min(260, 145*disp);
          const g = c.createLinearGradient(0,bt,0,bt+bh);
          g.addColorStop(0,'#EF4444'); g.addColorStop(0.2,'#F97316'); g.addColorStop(0.36,'#EAB308'); g.addColorStop(0.55,'#22C55E'); g.addColorStop(0.72,'#3B82F6'); g.addColorStop(0.86,'#6366F1'); g.addColorStop(1,'#A855F7');
          c.fillStyle = g; c.fillRect(48,bt,264,bh);
          c.fillStyle = '#E2E8F0'; c.font = 'bold 16px monospace'; c.fillText('650nm Red -> 400nm Violet', 180, 434);
          specTex.texture.needsUpdate = true;
        }
      },
      readouts: (p) => [{ label: 'Angular Spread', value: (2.6*(p.dispersion||1.2)).toFixed(2), unit: '°' }]
    };
  }

  // B04 & P05: Realistic Eye + Live Snellen Retinal Acuity Output (P05)
  if (id === 'B04' || id === 'P05') {
    const eye = buildEyeGroup(id === 'P05');
    eye.group.position.set(0, 1.55, 0);
    root.add(eye.group);
    const rays = [];
    let focusDot = null, specLens = null, eyeTex = null;
    if (id === 'P05') {
      const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      for (let i=0;i<4;i++) { const r = createCylBetween(new THREE.Vector3(), new THREE.Vector3(1,0,0), 0.018, mat); root.add(r); rays.push(r); }
      focusDot = new THREE.Mesh(new THREE.SphereGeometry(0.085,14,14), new THREE.MeshBasicMaterial({ color: 0x34d399 }));
      root.add(focusDot);
      specLens = createLens(false, 0.56); specLens.position.set(-1.95, 1.55, 0); root.add(specLens);
      eyeTex = createLiveDisplay(360, 260, maxAniso);
      const mon = createBenchConsole(1.65, 1.15, eyeTex.texture);
      mon.position.set(2.45, 0.85, 1.05); mon.rotation.y = -0.38;
      root.add(mon);
    }
    let lastKey = '';
    return {
      root, camPos: [-0.7,2.45,5.3], target: [0.1,1.5,0.2],
      update: (_dt, _el, p) => {
        const lux = id === 'B04' ? (p.ambientLight!==undefined ? p.ambientLight : 0.5) : (p.pupilSize||0.55);
        eye.pupilDisc.scale.setScalar(1.25 - lux*0.5);
        if (id === 'P05' && focusDot) {
          const mode = Math.round(p.defectMode!==undefined ? p.defectMode : 1);
          const corr = (p.correctiveLens||0) >= 0.5;
          specLens.visible = corr && mode !== 0;
          const fx = (!corr && mode===1) ? 0.62 : (!corr && mode===2) ? 2.0 : 1.25;
          focusDot.position.set(fx, 1.55, 0);
          updateCylBetween(rays[0], new THREE.Vector3(-3.1,1.9,0), new THREE.Vector3(-0.64,1.88,0));
          updateCylBetween(rays[1], new THREE.Vector3(-3.1,1.2,0), new THREE.Vector3(-0.64,1.22,0));
          updateCylBetween(rays[2], new THREE.Vector3(-0.64,1.88,0), focusDot.position);
          updateCylBetween(rays[3], new THREE.Vector3(-0.64,1.22,0), focusDot.position);
          const key = mode+'|'+(corr?1:0);
          if (key !== lastKey) {
            lastKey = key;
            const sharp = corr || mode === 0;
            const c = eyeTex.ctx;
            c.fillStyle = '#070A10'; c.fillRect(0,0,360,260);
            c.fillStyle = '#94A3B8'; c.font = 'bold 15px monospace'; c.textAlign = 'left'; c.fillText('RETINAL IMAGE OUTPUT', 18, 30);
            c.save(); c.filter = sharp ? 'none' : 'blur(6px)'; c.fillStyle = '#F8FAFC'; c.font = 'bold 104px sans-serif';
            c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('E', 180, 128); c.restore();
            c.fillStyle = sharp ? '#34D399' : '#F59E0B'; c.font = 'bold 17px monospace'; c.textAlign = 'center';
            c.fillText(sharp ? 'SHARP RETINA FOCUS' : mode===1 ? 'BLURRED · MYOPIA' : 'BLURRED · HYPERMETROPIA', 180, 232);
            eyeTex.texture.needsUpdate = true;
          }
        }
      },
      readouts: (p) => id === 'B04'
        ? [{ label: 'Pupil Reflex', value: (p.ambientLight||0.5)>0.6 ? 'Constricted' : 'Dilated' }]
        : [{ label: 'Condition', value: ['Normal','Myopia','Hypermetropia'][Math.round(p.defectMode!==undefined?p.defectMode:1)] }],
    };
  }

  // P06: Ohm's Law (DC Supply + Meters + Resistor + V-I Oscilloscope)
  if (id === 'P06') {
    const bat = new THREE.Group(); bat.position.set(-2.15,0,1.0);
    const pack = new THREE.Mesh(new THREE.BoxGeometry(1.18,0.95,0.78), makeMetal(0x273244,0.32,0.78)); pack.position.y=0.475;
    const psuTex = createLiveDisplay(320,180,maxAniso);
    const psuFace = new THREE.Mesh(new THREE.PlaneGeometry(0.92,0.52), new THREE.MeshBasicMaterial({ map: psuTex.texture })); psuFace.position.set(0,0.52,0.398);
    bat.add(pack, psuFace);
    registerComponent(bat, 'battery', 'Regulated DC Supply', new THREE.Vector3(-0.3,0,0), new THREE.Vector3(0,1.25,0));
    root.add(bat);

    const resMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, emissive: 0x7c2d12, emissiveIntensity: 0.1 });
    const res = new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,1.4,24), resMat); res.rotation.z = Math.PI/2; res.position.set(0.2,0.48,-1.2);
    registerComponent(res, 'resistor', 'Ceramic Resistor (R)', new THREE.Vector3(0,0.3,-0.3), new THREE.Vector3(0,0.5,0));
    root.add(res);

    const amm = createMeter('A', false, 6, maxAniso); amm.group.position.set(2.1,0,0.2);
    registerComponent(amm.group, 'ammeter', 'Ammeter (I)', new THREE.Vector3(0.3,0,0), new THREE.Vector3(0,1.2,0));
    const vlt = createMeter('V', false, 12, maxAniso); vlt.group.position.set(0.2,0,1.2);
    registerComponent(vlt.group, 'voltmeter', 'Voltmeter (V)', new THREE.Vector3(0,0,0.3), new THREE.Vector3(0,1.2,0));
    root.add(amm.group, vlt.group);

    const scopeTex = createLiveDisplay(380,260,maxAniso);
    const scope = createBenchConsole(1.5,1.05,scopeTex.texture); scope.position.set(-2.25,0.85,-1.35); scope.rotation.y = 0.4;
    root.add(scope);

    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.1,0.3,1.0),new THREE.Vector3(-2.1,0.3,-1.2),new THREE.Vector3(2.1,0.3,-1.2),new THREE.Vector3(2.1,0.3,1.0)], true);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(curve,56,0.045,8,true), makeMetal(0xd97706,0.25,0.88)));
    const dots = Array.from({length:14}, ()=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(0.068,10,10), new THREE.MeshBasicMaterial({color:0x38bdf8})); root.add(m); return m; });

    let ph = 0, lastKey = '';
    return {
      root, camPos: [0,3.8,5.2], target: [0,0.55,0],
      update: (dt,_el,p,playing) => {
        const cl = (p.switchClosed!==undefined?p.switchClosed:1) >= 0.5;
        const v = p.voltage || 6, r = p.resistance || 6, i = cl ? v/r : 0;
        resMat.emissiveIntensity = THREE.MathUtils.clamp((v*i)*0.04, 0.05, 1.4);
        amm.needlePivot.rotation.z = THREE.MathUtils.damp(amm.needlePivot.rotation.z, -(THREE.MathUtils.clamp((i/6)*1.9-0.95,-0.95,0.95)), 8, dt);
        vlt.needlePivot.rotation.z = THREE.MathUtils.damp(vlt.needlePivot.rotation.z, -(THREE.MathUtils.clamp(((cl?v:0)/12)*1.9-0.95,-0.95,0.95)), 8, dt);
        if (playing && cl) ph = (ph + dt*Math.min(2.2, i*0.22)) % 1;
        dots.forEach((d,idx)=>{ d.visible = cl; curve.getPointAt((ph+idx/dots.length)%1, _v1); d.position.copy(_v1); });
        const key = (cl?1:0)+'|'+v+'|'+r;
        if (key !== lastKey) {
          lastKey = key;
          const pc = psuTex.ctx;
          pc.fillStyle='#05080F'; pc.fillRect(0,0,320,180);
          pc.fillStyle=cl?'#34D399':'#EF4444'; pc.font='bold 20px monospace'; pc.textAlign='left'; pc.fillText(cl?'OUTPUT ON':'OPEN', 18, 34);
          pc.fillStyle='#38BDF8'; pc.font='bold 46px monospace'; pc.fillText((cl?v:0).toFixed(1)+' V', 18, 98);
          pc.fillStyle='#F59E0B'; pc.font='bold 32px monospace'; pc.fillText(i.toFixed(2)+' A ('+r.toFixed(0)+'Ω)', 18, 152);
          psuTex.texture.needsUpdate = true;

          const sc = scopeTex.ctx;
          sc.fillStyle='#070A10'; sc.fillRect(0,0,380,260);
          const ox=46, oy=214, pw=300, phh=156;
          sc.strokeStyle='#64748B'; sc.lineWidth=2; sc.beginPath(); sc.moveTo(ox,42); sc.lineTo(ox,oy); sc.lineTo(ox+pw,oy); sc.stroke();
          const endI = Math.min(6, 12/r);
          sc.strokeStyle='#38BDF8'; sc.lineWidth=4; sc.beginPath(); sc.moveTo(ox,oy); sc.lineTo(ox+((endI*r)/12)*pw, oy-(endI/6)*phh); sc.stroke();
          sc.fillStyle='#10B981'; sc.beginPath(); sc.arc(ox+((cl?v:0)/12)*pw, oy-(Math.min(6,i)/6)*phh, 8, 0, Math.PI*2); sc.fill();
          sc.fillStyle='#E2E8F0'; sc.font='bold 16px monospace'; sc.fillText('V-I TRACE · SLOPE 1/R='+(1/r).toFixed(2)+'S', 18, 26);
          scopeTex.texture.needsUpdate = true;
        }
      },
      readouts: (p) => { const cl=(p.switchClosed!==undefined?p.switchClosed:1)>=0.5, v=p.voltage||6, r=p.resistance||6, i=cl?v/r:0; return [{ label: 'Current (I)', value: i.toFixed(2), unit: 'A' }, { label: 'Power', value: (cl?v*i:0).toFixed(2), unit: 'W' }]; }
    };
  }

  // P07: Series & Parallel Circuits + Live Wattmeter Console
  if (id === 'P07') {
    const src = new THREE.Mesh(new THREE.BoxGeometry(1.15,0.88,0.74), makeMetal(0x273244,0.3,0.8)); src.position.set(-2.3,0.44,0);
    registerComponent(src, 'source', '12V DC Supply', new THREE.Vector3(-0.3,0,0), new THREE.Vector3(0,1.15,0));
    root.add(src);
    const makeBulb = (x, z, col) => {
      const g = new THREE.Group(); g.position.set(x,0,z);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.28,0.28,18), makeMetal(0xd97706)); b.position.y=0.14;
      const fMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: col, emissiveIntensity: 1 });
      const fil = new THREE.Mesh(new THREE.TorusGeometry(0.11,0.025,8,18), fMat); fil.position.y=0.58;
      const gMat = new THREE.MeshPhysicalMaterial({ color: 0xfef3c7, emissive: col, emissiveIntensity: 0.45, transparent: true, opacity: 0.65 });
      const gl = new THREE.Mesh(new THREE.SphereGeometry(0.38,20,20), gMat); gl.position.y=0.56;
      g.add(b, fil, gl); return { g, gMat, fMat };
    };
    const b1 = makeBulb(0.8,-0.9,0xf59e0b), b2 = makeBulb(0.8,0.9,0x38bdf8);
    registerComponent(b1.g, 'load1', 'Lamp R1', new THREE.Vector3(0,0.3,-0.3), new THREE.Vector3(0,1.15,0));
    registerComponent(b2.g, 'load2', 'Lamp R2', new THREE.Vector3(0,0.3,0.3), new THREE.Vector3(0,1.15,0));
    root.add(b1.g, b2.g);
    const wattTex = createLiveDisplay(380,260,maxAniso);
    const watt = createBenchConsole(1.55,1.05,wattTex.texture); watt.position.set(2.45,0.82,0); watt.rotation.y=-0.52;
    root.add(watt);
    const wMat = makeMetal(0x94a3b8,0.25,0.88);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-2.3,0.15,-0.9),new THREE.Vector3(0.8,0.15,-0.9),new THREE.Vector3(0.8,0.15,0.9),new THREE.Vector3(-2.3,0.15,0.9)],true),50,0.04,8,true), wMat));
    const pRail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-2.3,0.15,0),new THREE.Vector3(0.8,0.15,0)]),12,0.04,8,false), wMat);
    root.add(pRail);
    let lastKey = '';
    return {
      root, camPos: [0,3.8,5.2], target: [0.1,0.45,0],
      update: (_dt,_el,p) => {
        const par = (p.topology!==undefined?p.topology:1) >= 0.5;
        const r1 = p.r1 || 4, r2 = p.r2 || 6; pRail.visible = par;
        const i1 = par ? 12/r1 : 12/(r1+r2), i2 = par ? 12/r2 : 12/(r1+r2);
        b1.gMat.emissiveIntensity = THREE.MathUtils.clamp(i1*0.48,0.15,2.2); b1.fMat.emissiveIntensity = THREE.MathUtils.clamp(i1*0.9,0.3,3.0);
        b2.gMat.emissiveIntensity = THREE.MathUtils.clamp(i2*0.48,0.15,2.2); b2.fMat.emissiveIntensity = THREE.MathUtils.clamp(i2*0.9,0.3,3.0);
        const key = (par?1:0)+'|'+r1+'|'+r2;
        if (key !== lastKey) {
          lastKey = key;
          const req = par ? (r1*r2)/(r1+r2) : r1+r2; const it = 12/req;
          const c = wattTex.ctx;
          c.fillStyle='#070A10'; c.fillRect(0,0,380,260);
          c.fillStyle=par?'#38BDF8':'#F59E0B'; c.font='bold 18px monospace'; c.textAlign='left'; c.fillText(par?'TOPOLOGY: PARALLEL':'TOPOLOGY: SERIES', 20, 38);
          c.fillStyle='#F8FAFC'; c.font='bold 28px monospace'; c.fillText('R_eq = '+req.toFixed(2)+' Ω', 20, 92);
          c.fillStyle='#34D399'; c.fillText('I_total = '+it.toFixed(2)+' A', 20, 138);
          c.fillStyle='#94A3B8'; c.font='bold 20px monospace'; c.fillText('I1='+i1.toFixed(2)+'A  I2='+i2.toFixed(2)+'A', 20, 188);
          c.fillStyle='#FBBF24'; c.fillText('POWER = '+(12*it).toFixed(1)+' W', 20, 228);
          wattTex.texture.needsUpdate = true;
        }
      },
      readouts: (p) => { const par=(p.topology!==undefined?p.topology:1)>=0.5, r1=p.r1||4, r2=p.r2||6, req=par?(r1*r2)/(r1+r2):r1+r2; return [{ label: 'R_eq', value: req.toFixed(2), unit: 'Ω' }, { label: 'Current', value: (12/req).toFixed(2), unit: 'A' }]; }
    };
  }

  // P08: Magnetic Field + Dipole Compasses + Hall Gaussmeter
  if (id === 'P08') {
    const mag = new THREE.Group();
    const nP = new THREE.Mesh(new THREE.BoxGeometry(1.3,0.45,0.55), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.32 })); nP.position.set(-0.65,0.65,0);
    const sP = new THREE.Mesh(new THREE.BoxGeometry(1.3,0.45,0.55), new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.32 })); sP.position.set(0.65,0.65,0);
    mag.add(nP, sP);
    registerComponent(mag, 'magnet', 'Bar Magnet (N-S)', new THREE.Vector3(0,0.4,0), new THREE.Vector3(0,1.15,0));
    root.add(mag);
    const fGrp = new THREE.Group(), curves = [], dots = [];
    for(let ring=0;ring<4;ring++){
      const phi = (ring*Math.PI)/2;
      [1.1, 1.65].forEach((sc)=>{
        const pts=[]; for(let s=0;s<=32;s++){ const t=(s/32)*Math.PI*2; const r=Math.sin(t)*0.95*sc; pts.push(new THREE.Vector3(-Math.cos(t)*1.45*sc*0.8, Math.max(0.08,0.65+Math.cos(phi)*r), Math.sin(phi)*r)); }
        const cu = new THREE.CatmullRomCurve3(pts,true); curves.push(cu);
        fGrp.add(new THREE.Mesh(new THREE.TubeGeometry(cu,42,0.018,6,true), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 })));
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.055,10,10), new THREE.MeshBasicMaterial({ color: 0xfacc15 })); fGrp.add(dot); dots.push(dot);
      });
    }
    registerComponent(fGrp, 'fieldLines', 'Magnetic Flux Loops', new THREE.Vector3(0,0.5,0), new THREE.Vector3(0,2.1,0));
    root.add(fGrp);
    for(let i=0;i<12;i++){
      const a=(i/12)*Math.PI*2; const mini=new THREE.Group(); mini.position.set(Math.cos(a)*1.9,0.06,Math.sin(a)*1.65);
      const disc=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,0.03,14), makeMetal(0x334155));
      const ptr=new THREE.Mesh(new THREE.ConeGeometry(0.035,0.18,8), new THREE.MeshBasicMaterial({color:0xef4444})); ptr.rotation.x=Math.PI/2; ptr.position.y=0.03; ptr.rotation.y=Math.atan2(Math.sin(2*a),Math.cos(2*a)+0.4);
      mini.add(disc,ptr); root.add(mini);
    }
    const comp = new THREE.Group();
    const cCase = new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.34,0.14,20), makeMetal(0xd97706)); cCase.position.y=0.07;
    const ndl = new THREE.Group(); ndl.position.y=0.16;
    const nt = new THREE.Mesh(new THREE.ConeGeometry(0.05,0.2,8), new THREE.MeshBasicMaterial({color:0xef4444})); nt.rotation.x=Math.PI/2; nt.position.z=0.1;
    const st = new THREE.Mesh(new THREE.ConeGeometry(0.05,0.2,8), new THREE.MeshBasicMaterial({color:0xf8fafc})); st.rotation.x=-Math.PI/2; st.position.z=-0.1;
    ndl.add(nt,st); comp.add(cCase,ndl);
    registerComponent(comp, 'compass', 'Plotting Compass', new THREE.Vector3(0,0,0.4), new THREE.Vector3(0,0.5,0));
    root.add(comp);
    const gTex = createLiveDisplay(360,240,maxAniso);
    const gCon = createBenchConsole(1.45,0.98,gTex.texture); gCon.position.set(2.55,0.8,-1.65); gCon.rotation.y=-0.5;
    root.add(gCon);
    let fp = 0, lastKey = '';
    return {
      root, camPos: [0,3.4,5.4], target: [0,0.8,0],
      update: (dt,_el,p,playing) => {
        const str = p.strength || 1.2, deg = p.compassAngle!==undefined ? p.compassAngle : 45, ang = THREE.MathUtils.degToRad(deg);
        comp.position.set(Math.cos(ang)*2.2, 0, Math.sin(ang)*2.2);
        ndl.rotation.y = Math.atan2(Math.sin(2*ang), Math.cos(2*ang)+0.4);
        if (playing) fp = (fp + dt*0.28*str) % 1;
        curves.forEach((cu,idx)=>{ cu.getPointAt((fp+idx*0.13)%1, _v1); dots[idx].position.copy(_v1); });
        const key = str+'|'+deg;
        if (key !== lastKey) {
          lastKey = key;
          const bmt = str*(18+12*Math.abs(Math.cos(ang))); const c = gTex.ctx;
          c.fillStyle='#070A10'; c.fillRect(0,0,360,240);
          c.fillStyle='#94A3B8'; c.font='bold 16px monospace'; c.textAlign='left'; c.fillText('HALL GAUSSMETER', 18, 34);
          c.fillStyle='#38BDF8'; c.font='bold 46px monospace'; c.fillText(bmt.toFixed(1)+' mT', 18, 108);
          c.fillStyle='#FACC15'; c.font='bold 20px monospace'; c.fillText('AZIMUTH = '+deg+'°', 18, 162);
          c.fillStyle='#34D399'; c.fillText('DIPOLE B0 = '+str.toFixed(1)+' T', 18, 204);
          gTex.texture.needsUpdate = true;
        }
      },
      readouts: (p) => [{ label: 'Flux Density', value: (p.strength||1.2).toFixed(1), unit: 'T' }, { label: 'Azimuth', value: String(p.compassAngle!==undefined?p.compassAngle:45), unit: '°' }]
    };
  }

  // P09: Electric Motor & Generator + Live EMF Oscilloscope
  if (id === 'P09') {
    const stat = new THREE.Group();
    const np = new THREE.Mesh(new THREE.BoxGeometry(0.72,1.35,1.55), new THREE.MeshStandardMaterial({ color: 0xef4444 })); np.position.set(-1.55,1.2,0);
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.72,1.35,1.55), new THREE.MeshStandardMaterial({ color: 0x2563eb })); sp.position.set(1.55,1.2,0);
    const yk = new THREE.Mesh(new THREE.BoxGeometry(3.8,0.2,1.4), makeMetal(0x273244)); yk.position.y = 0.1;
    stat.add(np, sp, yk);
    registerComponent(stat, 'stator', 'Stator Poles & Yoke', new THREE.Vector3(0,0,-0.5), new THREE.Vector3(-1.6,2.0,0));
    root.add(stat);
    const rotor = new THREE.Group(); rotor.position.set(0,1.2,0);
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,3.1,14), makeMetal(0x94a3b8)); sh.rotation.x=Math.PI/2;
    const loop = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.75,0,-0.7),new THREE.Vector3(0.75,0,-0.7),new THREE.Vector3(0.75,0,0.7),new THREE.Vector3(-0.75,0,0.7)],true),36,0.055,8,true), makeMetal(0xd97706,0.2,0.92));
    rotor.add(sh, loop);
    registerComponent(rotor, 'armature', 'Armature Coil', new THREE.Vector3(0,0.55,0), new THREE.Vector3(0,0.65,0));
    root.add(rotor);
    const comm = new THREE.Group(); comm.position.set(0,1.2,1.1);
    const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.35,18,1,false,0.15,Math.PI-0.3), makeMetal(0xf59e0b)); h1.rotation.x=Math.PI/2;
    const h2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.35,18,1,false,Math.PI+0.15,Math.PI-0.3), makeMetal(0xf59e0b)); h2.rotation.x=Math.PI/2;
    comm.add(h1, h2);
    registerComponent(comm, 'commutator', 'Commutator', new THREE.Vector3(0,0,0.6), new THREE.Vector3(0,0.45,0));
    root.add(comm);
    const eTex = createLiveDisplay(380,260,maxAniso);
    const eCon = createBenchConsole(1.55,1.05,eTex.texture); eCon.position.set(2.55,0.85,1.45); eCon.rotation.y=-0.58;
    root.add(eCon);
    let wp = 0, da = 0;
    return {
      root, camPos: [2.2,2.7,5.1], target: [0.2,1.1,0.2],
      update: (dt,_el,p,playing) => {
        const spd = (p.driveLevel||1.2)*(p.fieldStrength||1.0), isGen = (p.mode||0)>=0.5;
        if (playing) { rotor.rotation.z += dt*spd*2.2; h1.rotation.y = rotor.rotation.z; h2.rotation.y = rotor.rotation.z; wp += dt*spd*3.5; }
        da += dt;
        if (da > 0.06) {
          da = 0; const c = eTex.ctx;
          c.fillStyle='#070A10'; c.fillRect(0,0,380,260);
          c.strokeStyle='rgba(148,163,184,0.18)'; c.beginPath(); c.moveTo(20,130); c.lineTo(360,130); c.stroke();
          c.strokeStyle=isGen?'#34D399':'#38BDF8'; c.lineWidth=4; c.beginPath();
          const amp = Math.min(68, spd*36);
          for(let px=20;px<=360;px+=6){
            const val = isGen ? Math.abs(Math.sin(((px-20)/340)*Math.PI*4+wp))*amp : Math.sin(((px-20)/340)*Math.PI*4+wp)*amp;
            const py = 130 - val + (isGen?22:0);
            if(px===20) c.moveTo(px,py); else c.lineTo(px,py);
          }
          c.stroke();
          c.fillStyle='#94A3B8'; c.font='bold 16px monospace'; c.textAlign='left'; c.fillText(isGen?'GENERATOR EMF':'MOTOR TORQUE', 20, 30);
          c.fillStyle='#F8FAFC'; c.font='bold 20px monospace'; c.fillText(Math.round(spd*180)+' RPM', 20, 236);
          eTex.texture.needsUpdate = true;
        }
      },
      readouts: (p) => [{ label: 'Mode', value: (p.mode||0)>=0.5?'Generator':'DC Motor' }, { label: 'Speed', value: String(Math.round((p.driveLevel||1.2)*(p.fieldStrength||1.0)*180)), unit: 'RPM' }]
    };
  }

  // P10: Electromagnetic Induction + Bi-Polar Lenz LEDs + Faraday Pulse Oscilloscope
  if (id === 'P10') {
    const coilGrp = new THREE.Group(); coilGrp.position.set(-0.7,1.0,0);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,2.0,22,1,true), makeGlass(0xdbeafe, 0.35)); tube.rotation.z=Math.PI/2;
    let coilMesh = createHelicalCoil(0.5,1.9,8,0.04,0xd97706);
    coilGrp.add(tube, coilMesh);
    registerComponent(coilGrp, 'coil', 'Copper Solenoid', new THREE.Vector3(0,0.4,0), new THREE.Vector3(0,0.7,0));
    root.add(coilGrp);
    const magGrp = new THREE.Group(); magGrp.position.set(1.4,1.0,0);
    const mN = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.7,18), new THREE.MeshStandardMaterial({ color: 0xef4444 })); mN.rotation.z=Math.PI/2; mN.position.x=0.35;
    const mS = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.7,18), new THREE.MeshStandardMaterial({ color: 0x2563eb })); mS.rotation.z=Math.PI/2; mS.position.x=-0.35;
    magGrp.add(mN, mS);
    registerComponent(magGrp, 'magnet', 'Moving Magnet', new THREE.Vector3(0.4,0,0), new THREE.Vector3(0,0.45,0));
    root.add(magGrp);
    const galv = createMeter('G', true, 10, maxAniso); galv.group.position.set(-0.7,0,1.6);
    registerComponent(galv.group, 'galvanometer', 'Galvanometer', new THREE.Vector3(0,0,0.4), new THREE.Vector3(0,1.15,0));
    root.add(galv.group);
    const pMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.1 });
    const nMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.1 });
    const pLed = new THREE.Mesh(new THREE.SphereGeometry(0.08,14,14), pMat); pLed.position.set(-0.5,0.98,1.6);
    const nLed = new THREE.Mesh(new THREE.SphereGeometry(0.08,14,14), nMat); nLed.position.set(-0.9,0.98,1.6);
    root.add(pLed, nLed);
    const iTex = createLiveDisplay(380,260,maxAniso);
    const iCon = createBenchConsole(1.55,1.05,iTex.texture); iCon.position.set(-2.35,0.85,-1.25); iCon.rotation.y=0.48;
    root.add(iCon);
    let prevX = 1.4, lastTurns = 8, ind = 0, da = 0;
    const hist = new Array(50).fill(0);
    return {
      root, camPos: [0.5,2.8,5.2], target: [-0.2,0.9,0.2],
      update: (dt, elapsed, p, playing) => {
        const turns = Math.round(p.coilTurns || 8);
        if (turns !== lastTurns) { lastTurns = turns; coilGrp.remove(coilMesh); coilMesh.geometry.dispose(); coilMesh = createHelicalCoil(0.5,1.9,turns,0.04,0xd97706); coilGrp.add(coilMesh); }
        const auto = (p.autoOscillate!==undefined?p.autoOscillate:1) >= 0.5;
        const tx = auto && playing ? 0.5 + Math.sin(elapsed*2.2)*1.4 : 0.8 + (p.magnetOffset||0)*0.5;
        magGrp.position.x = THREE.MathUtils.damp(magGrp.position.x, tx, 10, dt);
        const vel = (magGrp.position.x - prevX) / Math.max(0.008, dt); prevX = magGrp.position.x;
        ind = THREE.MathUtils.clamp(-vel * Math.exp(-Math.pow(magGrp.position.x+0.2,2)*0.9) * (turns/8) * 0.35, -1, 1);
        galv.needlePivot.rotation.z = THREE.MathUtils.damp(galv.needlePivot.rotation.z, -ind*0.9, 12, dt);
        pMat.emissiveIntensity = ind > 0.04 ? Math.min(2.6, ind*3) : 0.08;
        nMat.emissiveIntensity = ind < -0.04 ? Math.min(2.6, -ind*3) : 0.08;
        da += dt;
        if (da > 0.06) {
          da = 0; hist.push(ind); if (hist.length > 50) hist.shift();
          const c = iTex.ctx; c.fillStyle='#070A10'; c.fillRect(0,0,380,260);
          c.strokeStyle='rgba(148,163,184,0.22)'; c.beginPath(); c.moveTo(20,130); c.lineTo(360,130); c.stroke();
          c.strokeStyle=ind>=0?'#38BDF8':'#F59E0B'; c.lineWidth=4; c.beginPath();
          hist.forEach((v,idx)=>{ const px=20+(idx/(hist.length-1))*340, py=130-v*72; if(idx===0)c.moveTo(px,py); else c.lineTo(px,py); });
          c.stroke();
          c.fillStyle='#94A3B8'; c.font='bold 16px monospace'; c.textAlign='left'; c.fillText('FARADAY PULSE', 20, 32);
          c.fillStyle='#F8FAFC'; c.font='bold 20px monospace'; c.fillText('I = '+(ind*5).toFixed(2)+' mA', 20, 236);
          iTex.texture.needsUpdate = true;
        }
      },
      readouts: (p) => [{ label: 'Induced Current', value: (ind*5).toFixed(2), unit: 'mA' }, { label: 'Coil Turns', value: String(Math.round(p.coilTurns||8)), unit: 'turns' }]
    };
  }

  // B01: Realistic Heart
  if (id === 'B01') {
    const hg = new THREE.Group(); hg.position.set(0,1.55,0); hg.rotation.z = -0.16;
    const myo = createMyocardiumTex('#A31D24','#450A0A');
    const rMyo = createMyocardiumTex('#881337','#1E3A8A');
    const heartPts = [new THREE.Vector2(0.01,-0.95), new THREE.Vector2(0.22,-0.82), new THREE.Vector2(0.45,-0.52), new THREE.Vector2(0.58,-0.1), new THREE.Vector2(0.56,0.28), new THREE.Vector2(0.42,0.48), new THREE.Vector2(0.01,0.5)];
    const ventGeo = new THREE.LatheGeometry(heartPts, 32);
    const rightSide = new THREE.Group();
    const rVent = new THREE.Mesh(ventGeo, makeOrganic(0x9f1239, 0.32, rMyo));
    rVent.scale.set(0.82,1.0,0.74); rVent.position.set(-0.34,-0.22,0.22); rVent.rotation.set(0.12,0.2,0.25);
    const rAtr = new THREE.Mesh(new THREE.SphereGeometry(0.45,24,20), makeOrganic(0x7f1d1d,0.34,rMyo)); rAtr.position.set(-0.56,0.45,0.08);
    const vBand = new THREE.Mesh(new THREE.TorusGeometry(0.4,0.032,8,24), makeOrganic(0x2563eb,0.3)); vBand.position.set(-0.56,0.45,0.08); vBand.rotation.x = Math.PI/2;
    rightSide.add(rVent, rAtr, vBand);
    registerComponent(rightSide, 'rightSide', 'Right Atrium & Ventricle', new THREE.Vector3(-0.65,0,0.2), new THREE.Vector3(-0.82,0.45,0.2));

    const leftSide = new THREE.Group();
    const lVent = new THREE.Mesh(ventGeo, makeOrganic(0xb91c1c, 0.28, myo));
    lVent.scale.set(1.05,1.18,0.92); lVent.position.set(0.24,-0.32,-0.05); lVent.rotation.z = -0.28;
    const lAtr = new THREE.Mesh(new THREE.SphereGeometry(0.42,24,20), makeOrganic(0xdc2626,0.3,myo)); lAtr.position.set(0.5,0.48,-0.14);
    const lad = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.02,0.32,0.44),new THREE.Vector3(0.05,0,0.56),new THREE.Vector3(0.22,-0.45,0.48),new THREE.Vector3(0.45,-0.88,0.24)]),24,0.036,8,false), makeOrganic(0xef4444,0.22));
    leftSide.add(lVent, lAtr, lad);
    registerComponent(leftSide, 'leftSide', 'Left Ventricle & Coronary', new THREE.Vector3(0.65,0,-0.15), new THREE.Vector3(0.85,0.35,0));

    const vessels = new THREE.Group();
    const aorta = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.1,0.25,0.02),new THREE.Vector3(0.08,0.92,0.06),new THREE.Vector3(0.32,1.24,-0.08),new THREE.Vector3(0.58,1.08,-0.32)]),32,0.17,14,false), makeOrganic(0xef4444,0.26));
    [[0.14,1.34,0],[0.29,1.4,-0.06],[0.44,1.36,-0.15]].forEach(([bx,by,bz])=>{
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.36,12), makeOrganic(0xef4444,0.28)); br.position.set(bx,by,bz); vessels.add(br);
    });
    const svc = new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,0.85,14), makeOrganic(0x1d4ed8,0.32)); svc.position.set(-0.6,0.9,0.07);
    const pulm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.22,0.18,0.28),new THREE.Vector3(-0.16,0.78,0.24),new THREE.Vector3(-0.62,0.94,0.05)]),20,0.13,12,false), makeOrganic(0x4f46e5,0.3));
    vessels.add(aorta, svc, pulm);
    registerComponent(vessels, 'aorta', 'Aorta & Major Vessels', new THREE.Vector3(0,0.72,0), new THREE.Vector3(0.32,1.48,0));

    const valves = new THREE.Group();
    [-0.36, 0.34].forEach((vx)=>{
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16,0.032,8,20), makeOrganic(0xf59e0b,0.35));
      ring.position.set(vx,0.16,0.22); ring.rotation.x=Math.PI/2; valves.add(ring);
    });
    registerComponent(valves, 'valves', 'Cardiac Valves', new THREE.Vector3(0,0,0.7), new THREE.Vector3(0,0.2,0.5));
    hg.add(rightSide, leftSide, vessels, valves); root.add(hg);
    let ph = 0;
    return {
      root, camPos: [0.2,2.1,4.6], target: [0,1.65,0],
      update: (dt, _el, p, playing) => {
        if (playing) ph = (ph + dt * ((p.bpm||72)/60)) % 1;
        const vp = 1 + Math.pow(Math.sin(ph*Math.PI),4)*0.085;
        rVent.scale.set(0.82*vp, vp, 0.74*vp); lVent.scale.set(1.05*vp, 1.18*vp, 0.92*vp);
      },
      readouts: (p) => [{ label: 'Heart Rate', value: String(Math.round(p.bpm||72)), unit: 'BPM' }, { label: 'Cardiac Output', value: (((p.bpm||72)*70)/1000).toFixed(2), unit: 'L/min' }],
    };
  }

  // B05: Realistic Gyri-Sulci Brain
  if (id === 'B05') {
    const bt = createBrainTex();
    const cMat = makeOrganic(0xffffff, 0.42, bt.color, bt.bump);
    const cer = new THREE.Group(); cer.position.set(0, 2.08, 0);
    const lh = new THREE.Mesh(new THREE.SphereGeometry(0.8,32,28), cMat); lh.scale.set(1.3,0.9,0.68); lh.position.z = -0.34;
    const rh = lh.clone(); rh.position.z = 0.34;
    cer.add(lh, rh);
    registerComponent(cer, 'cerebrum', 'Cerebral Cortex', new THREE.Vector3(0,0.55,0), new THREE.Vector3(0,0.95,0));
    const cbl = new THREE.Mesh(new THREE.SphereGeometry(0.44,22,18), makeOrganic(0x8b5cf6, 0.45, bt.color, bt.bump)); cbl.position.set(-0.55,1.32,0);
    registerComponent(cbl, 'cerebellum', 'Cerebellum', new THREE.Vector3(-0.5,0,0), new THREE.Vector3(-0.9,1.45,0));
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.13,0.85,16), makeOrganic(0x10b981,0.38)); stem.position.set(-0.1,1.25,0);
    registerComponent(stem, 'brainstem', 'Pons & Medulla', new THREE.Vector3(0.35,0,0.3), new THREE.Vector3(0.4,1.3,0));
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.08,1.2,14), makeOrganic(0xf59e0b,0.38)); cord.position.set(-0.1,0.4,0);
    registerComponent(cord, 'spinal', 'Spinal Cord', new THREE.Vector3(0,-0.4,0), new THREE.Vector3(0.35,0.5,0));
    const imp = new THREE.Mesh(new THREE.SphereGeometry(0.085,12,12), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    root.add(cer, cbl, stem, cord, imp);
    let sig = 0;
    return {
      root, camPos: [2.2,2.2,4.5], target: [-0.1,1.45,0],
      update: (dt, _el, p, playing) => { if (playing) sig = (sig + dt*(p.signalRate||1.25)) % 1; imp.position.set(-0.1, 0.1 + sig*1.8, 0.15); },
      readouts: () => [{ label: 'Cortex Status', value: 'Active Neural Impulse' }],
    };
  }

  // B02: Respiratory System (Trachea + Rings + Lungs + Alveoli + Diaphragm)
  if (id === 'B02') {
    const trachea = new THREE.Group();
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.35, 18), makeOrganic(0xfecdd3, 0.35));
    pipe.position.y = 2.42;
    trachea.add(pipe);
    for (let i = 0; i < 6; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.025, 8, 20), makeOrganic(0xf8fafc, 0.4));
      ring.rotation.x = Math.PI / 2; ring.position.y = 1.9 + i * 0.18;
      trachea.add(ring);
    }
    const bL = createCylBetween(new THREE.Vector3(0, 1.78, 0), new THREE.Vector3(-0.72, 1.38, 0), 0.09, makeOrganic(0xfca5a5, 0.35));
    const bR = createCylBetween(new THREE.Vector3(0, 1.78, 0), new THREE.Vector3(0.72, 1.38, 0), 0.09, makeOrganic(0xfca5a5, 0.35));
    trachea.add(bL, bR);
    registerComponent(trachea, 'trachea', 'Trachea & Bronchi', new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(0, 2.75, 0));

    const lLung = new THREE.Mesh(new THREE.SphereGeometry(0.66, 24, 20), makeOrganic(0xf472b6, 0.36));
    lLung.scale.set(0.85, 1.38, 0.72); lLung.position.set(-0.78, 1.28, 0);
    const rLung = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 20), makeOrganic(0xfb7185, 0.36));
    rLung.scale.set(0.92, 1.42, 0.75); rLung.position.set(0.8, 1.3, 0);
    registerComponent(lLung, 'leftLung', 'Left Lung Lobe', new THREE.Vector3(-0.55, 0, 0), new THREE.Vector3(-0.9, 1.6, 0));
    registerComponent(rLung, 'rightLung', 'Right Lung Lobe', new THREE.Vector3(0.55, 0, 0), new THREE.Vector3(0.9, 1.6, 0));

    const alveoli = new THREE.Group(); alveoli.position.set(0.82, 1.15, 0.52);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const sac = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), makeOrganic(0xfda4af, 0.3));
      sac.position.set(Math.cos(a) * 0.14, Math.sin(a) * 0.14, (i % 2) * 0.08);
      alveoli.add(sac);
    }
    registerComponent(alveoli, 'alveoli', 'Alveoli Cluster', new THREE.Vector3(0, 0, 0.5), new THREE.Vector3(0, 0.3, 0.2));

    const diaph = new THREE.Mesh(new THREE.SphereGeometry(1.45, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), makeOrganic(0xb91c1c, 0.38));
    diaph.scale.set(1.0, 0.38, 0.65); diaph.position.set(0, 0.28, 0);
    registerComponent(diaph, 'diaphragm', 'Muscular Diaphragm', new THREE.Vector3(0, -0.35, 0), new THREE.Vector3(0, 0.2, 0.5));
    root.add(trachea, lLung, rLung, alveoli, diaph);

    let ph = 0;
    return {
      root, camPos: [0, 2.0, 4.9], target: [0, 1.35, 0],
      update: (dt, _el, p, playing) => {
        const rate = p.breathRate || 14, depth = p.breathDepth || 1.0;
        if (playing) ph = (ph + dt * (rate / 60) * Math.PI * 2) % (Math.PI * 2);
        const exp = (Math.sin(ph) * 0.5 + 0.5) * 0.14 * depth;
        lLung.scale.set(0.85 * (1 + exp), 1.38 * (1 + exp * 0.8), 0.72 * (1 + exp));
        rLung.scale.set(0.92 * (1 + exp), 1.42 * (1 + exp * 0.8), 0.75 * (1 + exp));
        diaph.position.y = 0.28 - exp * 1.1;
      },
      readouts: (p) => [
        { label: 'Breath Rate', value: String(Math.round(p.breathRate || 14)), unit: 'BPM' },
        { label: 'Tidal Vol', value: String(Math.round(500 * (p.breathDepth || 1.0))), unit: 'mL' },
      ],
    };
  }

  // B03: Human Digestive Tract
  if (id === 'B03') {
    const eso = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 1.15, 16), makeOrganic(0xf472b6, 0.36));
    eso.position.set(0.05, 2.35, 0);
    registerComponent(eso, 'esophagus', 'Esophagus', new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0, 0.5, 0));

    const liver = new THREE.Mesh(new THREE.SphereGeometry(0.55, 22, 18), makeOrganic(0x991b1b, 0.28));
    liver.scale.set(1.25, 0.65, 0.78); liver.position.set(-0.62, 1.65, 0.14); liver.rotation.z = 0.25;
    registerComponent(liver, 'liver', 'Liver & Gallbladder', new THREE.Vector3(-0.5, 0.2, 0), new THREE.Vector3(-0.7, 0.35, 0));

    const stomCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 1.82, 0), new THREE.Vector3(0.48, 1.52, 0.1),
      new THREE.Vector3(0.35, 1.18, 0.08), new THREE.Vector3(-0.08, 1.24, 0),
    ]);
    const stomach = new THREE.Mesh(new THREE.TubeGeometry(stomCurve, 26, 0.24, 14, false), makeOrganic(0xfb7185, 0.32));
    registerComponent(stomach, 'stomach', 'Stomach (Gastric Juice)', new THREE.Vector3(0.45, 0, 0), new THREE.Vector3(0.6, 1.45, 0));

    const intPts = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      intPts.push(new THREE.Vector3(Math.sin(t * Math.PI * 5.5) * 0.58, 0.98 - t * 0.65, Math.cos(t * Math.PI * 5.5) * 0.25));
    }
    const intCurve = new THREE.CatmullRomCurve3(intPts);
    const intestines = new THREE.Mesh(new THREE.TubeGeometry(intCurve, 64, 0.11, 10, false), makeOrganic(0xfca5a5, 0.36));
    registerComponent(intestines, 'intestines', 'Small Intestine (Villi)', new THREE.Vector3(0, -0.35, 0.25), new THREE.Vector3(0, 0.65, 0.35));

    const bolus = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xd97706, emissiveIntensity: 0.6 }));
    root.add(eso, liver, stomach, intestines, bolus);

    const stages = ['Esophagus (Peristalsis)', 'Stomach (HCl + Pepsin)', 'Small Intestine (Absorption)', 'Large Intestine (Water)'];
    return {
      root, camPos: [0, 1.9, 4.9], target: [0, 1.3, 0],
      update: (dt, _el, p, playing) => {
        const t = p.transit !== undefined ? p.transit : 0.35;
        if (playing) bolus.scale.setScalar(1 + Math.sin(performance.now() * 0.006) * 0.08);
        if (t < 0.25) bolus.position.set(0.05, 2.85 - (t / 0.25) * 1.0, 0.12);
        else if (t < 0.55) { stomCurve.getPointAt((t - 0.25) / 0.3, _v1); bolus.position.copy(_v1).add(new THREE.Vector3(0, 0, 0.18)); }
        else { intCurve.getPointAt(Math.min(1, (t - 0.55) / 0.45), _v1); bolus.position.copy(_v1); }
      },
      readouts: (p) => {
        const t = p.transit !== undefined ? p.transit : 0.35;
        const idx = t < 0.25 ? 0 : t < 0.55 ? 1 : t < 0.88 ? 2 : 3;
        return [{ label: 'Bolus Location', value: stages[idx] }, { label: 'Transit', value: Math.round(t * 100) + '%' }];
      },
    };
  }

  // B06: Excretory System & Nephron
  if (id === 'B06') {
    const aorta = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.1, 14), makeOrganic(0xdc2626, 0.3)); aorta.position.set(-0.14, 1.3, -0.1);
    const cava = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.1, 14), makeOrganic(0x2563eb, 0.3)); cava.position.set(0.14, 1.3, -0.1);
    registerComponent(aorta, 'vessels', 'Aorta & Vena Cava', new THREE.Vector3(0, 0.35, -0.3), new THREE.Vector3(0, 2.1, 0));

    const kL = new THREE.Mesh(new THREE.SphereGeometry(0.42, 22, 18), makeOrganic(0x9f1239, 0.32));
    kL.scale.set(0.72, 1.18, 0.55); kL.position.set(-0.78, 1.62, 0);
    const kR = kL.clone(); kR.position.set(0.78, 1.48, 0);
    registerComponent(kL, 'leftKidney', 'Left Kidney', new THREE.Vector3(-0.5, 0.15, 0), new THREE.Vector3(-0.9, 1.8, 0));
    registerComponent(kR, 'rightKidney', 'Right Kidney', new THREE.Vector3(0.5, 0.15, 0), new THREE.Vector3(0.9, 1.65, 0));

    const uL = createCylBetween(new THREE.Vector3(-0.62, 1.3, 0), new THREE.Vector3(-0.22, 0.32, 0.1), 0.04, makeOrganic(0xfde047, 0.35));
    const uR = createCylBetween(new THREE.Vector3(0.62, 1.18, 0), new THREE.Vector3(0.22, 0.32, 0.1), 0.04, makeOrganic(0xfde047, 0.35));
    const bladder = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 18), makeOrganic(0xf59e0b, 0.35)); bladder.position.set(0, 0.25, 0.14);
    registerComponent(bladder, 'bladder', 'Ureters & Bladder', new THREE.Vector3(0, -0.3, 0.35), new THREE.Vector3(0, 0.45, 0.4));

    const glom = new THREE.Mesh(new THREE.TorusKnotGeometry(0.22, 0.045, 42, 8), makeOrganic(0xef4444, 0.28)); glom.position.set(1.65, 1.4, 0.35);
    registerComponent(glom, 'nephron', 'Glomerulus (Nephron)', new THREE.Vector3(0.5, 0.2, 0.2), new THREE.Vector3(1.7, 1.8, 0.4));
    root.add(aorta, cava, kL, kR, uL, uR, bladder, glom);
    return {
      root, camPos: [0.3, 1.9, 4.9], target: [0.15, 1.15, 0],
      update: (dt, _el, p, playing) => {
        if (playing) glom.rotation.y += dt * 0.8;
        const hyd = p.hydration !== undefined ? p.hydration : 0.7;
        bladder.scale.setScalar(0.8 + hyd * 0.4);
      },
      readouts: (p) => {
        const gfr = Math.round(95 * (p.bloodPressure || 1.0) * (0.7 + (p.hydration || 0.7) * 0.4));
        return [{ label: 'GFR Rate', value: String(gfr), unit: 'mL/min' }, { label: 'Hydration', value: Math.round((p.hydration || 0.7) * 100) + '%' }];
      },
    };
  }

  // B07 & B08: Plant Cell vs Animal Cell
  if (id === 'B07' || id === 'B08') {
    const isPlant = id === 'B07';
    const outer = isPlant
      ? new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.5, 1.9), makeGlass(0x10b981, 0.28))
      : new THREE.Mesh(new THREE.SphereGeometry(1.35, 32, 24), makeGlass(0x38bdf8, 0.25));
    outer.position.y = 1.25;
    if (!isPlant) outer.scale.set(1.15, 0.85, 1.0);
    registerComponent(outer, 'membrane', isPlant ? 'Cellulose Cell Wall' : 'Plasma Membrane', new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(0, 2.2, 0));

    const nucGrp = new THREE.Group(); nucGrp.position.set(isPlant ? -0.65 : 0, 1.25, 0);
    const env = new THREE.Mesh(new THREE.SphereGeometry(0.44, 24, 20, 0, Math.PI * 1.55), makeOrganic(0x7c3aed, 0.35));
    const nucCore = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), makeOrganic(0xe879f9, 0.25));
    nucGrp.add(env, nucCore);
    if (!isPlant) {
      for (let r = 0; r < 3; r++) {
        const er = new THREE.Mesh(new THREE.TorusGeometry(0.55 + r * 0.11, 0.025, 8, 24, Math.PI * 1.1), makeOrganic(0x6366f1, 0.35));
        er.rotation.x = Math.PI / 2; er.rotation.z = -0.5 + r * 0.2;
        nucGrp.add(er);
      }
    }
    registerComponent(nucGrp, 'nucleus', 'Nucleus & Rough ER', new THREE.Vector3(-0.3, 0.2, 0), new THREE.Vector3(-0.4, 1.8, 0));

    const mitoGrp = new THREE.Group(); mitoGrp.position.set(0.75, 1.15, 0.42);
    const mitoShell = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.3, 10, 18), makeOrganic(0xf97316, 0.32));
    mitoShell.rotation.z = Math.PI / 2;
    const crista = new THREE.Mesh(new THREE.TorusKnotGeometry(0.11, 0.022, 24, 6), makeOrganic(0xfde047, 0.25));
    crista.scale.set(1.6, 0.65, 0.65);
    mitoGrp.add(mitoShell, crista);
    registerComponent(mitoGrp, 'mitochondria', 'Mitochondria (Cristae)', new THREE.Vector3(0.4, 0.2, 0.3), new THREE.Vector3(0.8, 1.5, 0.5));

    root.add(outer, nucGrp, mitoGrp);
    let extra = null;
    if (isPlant) {
      extra = new THREE.Mesh(new THREE.SphereGeometry(0.58, 22, 18), makeGlass(0x38bdf8, 0.52));
      extra.scale.set(1.2, 0.85, 0.9); extra.position.set(0.35, 1.28, -0.1);
      registerComponent(extra, 'vacuole', 'Central Vacuole', new THREE.Vector3(0.3, 0.3, 0), new THREE.Vector3(0.4, 1.8, 0));
      const chloro = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.28, 10, 16), makeOrganic(0x16a34a, 0.28));
      chloro.rotation.z = Math.PI / 2; chloro.position.set(-0.55, 0.95, 0.55);
      registerComponent(chloro, 'chloroplast', 'Chloroplast (Grana)', new THREE.Vector3(-0.3, 0, 0.4), new THREE.Vector3(-0.6, 1.15, 0.6));
      root.add(extra, chloro);
    } else {
      extra = new THREE.Group(); extra.position.set(-0.65, 1.05, 0.42);
      for (let g = 0; g < 4; g++) {
        const sac = new THREE.Mesh(new THREE.TorusGeometry(0.16 + g * 0.03, 0.024, 8, 18, Math.PI), makeOrganic(0x10b981, 0.3));
        sac.position.y = g * 0.06; extra.add(sac);
      }
      registerComponent(extra, 'golgi', 'Golgi Apparatus', new THREE.Vector3(-0.4, 0, 0.3), new THREE.Vector3(-0.7, 1.4, 0.4));
      root.add(extra);
    }
    return {
      root, camPos: [0, 2.4, 4.9], target: [0, 1.25, 0],
      update: (dt, _el, p, playing) => {
        if (isPlant && extra) extra.scale.set(1.2 * (p.turgor || 0.9), 0.85 * (p.turgor || 0.9), 0.9 * (p.turgor || 0.9));
        if (playing) mitoGrp.rotation.y += dt * 0.6 * (p.metabolicRate || 1.0);
      },
      readouts: (p) => isPlant
        ? [{ label: 'Turgor Pressure', value: Math.round((p.turgor || 0.9) * 100) + '%' }, { label: 'State', value: (p.turgor || 0.9) > 0.65 ? 'Turgid' : 'Flaccid' }]
        : [{ label: 'ATP Synth Rate', value: (p.metabolicRate || 1.0).toFixed(1) + 'x' }, { label: 'Cell Membrane', value: 'Active Transport' }],
    };
  }

  // B09: Photosynthesis
  if (id === 'B09') {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.48, 0.72, 24), makeOrganic(0xb45309, 0.65)); pot.position.y = 0.36;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 1.7, 14), makeOrganic(0x15803d, 0.45)); stem.position.y = 1.4;
    const leaves = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), makeOrganic(0x22c55e, 0.38));
      leaf.scale.set(1.4, 0.14, 0.68);
      const a = (i / 6) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 0.42, 1.15 + i * 0.18, Math.sin(a) * 0.42);
      leaf.rotation.y = -a; leaf.rotation.z = 0.25;
      leaves.add(leaf);
    }
    registerComponent(leaves, 'chloroplast', 'Chlorophyll Leaves', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 2.2, 0));
    const sunMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 1.4 });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.45, 22, 22), sunMat); sun.position.set(-2.1, 2.9, -0.5);
    registerComponent(sun, 'sun', 'Photon Source (Sunlight)', new THREE.Vector3(-0.3, 0.3, 0), new THREE.Vector3(-2.1, 3.4, -0.5));
    const o2s = Array.from({ length: 6 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), new THREE.MeshBasicMaterial({ color: 0x38bdf8 })); root.add(m); return m; });
    root.add(pot, stem, leaves, sun);
    let ph = 0;
    return {
      root, camPos: [0.4, 2.3, 5.1], target: [-0.2, 1.5, 0],
      update: (dt, _el, p, playing) => {
        const s = p.sunlight || 1.0, w = p.waterSupply || 1.0;
        sunMat.emissiveIntensity = 0.5 + s * 1.1;
        if (playing) ph = (ph + dt * Math.min(2, s * w) * 0.65) % 1;
        o2s.forEach((b, idx) => { const t = (ph + idx / 6) % 1; b.position.set(Math.sin(t * 6 + idx) * 0.5, 1.3 + t * 1.8, Math.cos(t * 4 + idx) * 0.35); });
      },
      readouts: (p) => {
        const rate = Math.round(Math.min(p.sunlight || 1.0, p.waterSupply || 1.0) * 68);
        return [{ label: 'O₂ Evolution', value: String(rate), unit: 'bubbles/min' }, { label: 'Glucose Output', value: (rate * 0.42).toFixed(1), unit: 'mg/h' }];
      },
    };
  }

  // B10: Genetics, DNA & Punnett Square
  if (id === 'B10') {
    const helix = new THREE.Group(); helix.position.set(-1.35, 1.3, 0);
    for (let i = 0; i < 11; i++) {
      const y = (i - 5) * 0.2, a = i * 0.58;
      const p1 = new THREE.Vector3(Math.cos(a) * 0.36, y, Math.sin(a) * 0.36);
      const p2 = new THREE.Vector3(-Math.cos(a) * 0.36, y, -Math.sin(a) * 0.36);
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), makeOrganic(0x38bdf8, 0.3)); s1.position.copy(p1);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), makeOrganic(0x8b5cf6, 0.3)); s2.position.copy(p2);
      const rung = createCylBetween(p1, p2, 0.025, makeOrganic(i % 2 === 0 ? 0xf59e0b : 0x10b981, 0.35));
      helix.add(s1, s2, rung);
    }
    registerComponent(helix, 'dna', 'DNA Double Helix', new THREE.Vector3(-0.4, 0, 0), new THREE.Vector3(-1.35, 2.55, 0));

    const punnett = new THREE.Group(); punnett.position.set(1.25, 1.35, 0);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.75, 0.08), makeMetal(0x1e293b, 0.35, 0.7));
    punnett.add(board);
    const cols = [0x10b981, 0x38bdf8, 0x38bdf8, 0xf59e0b];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const cell = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.16), makeOrganic(cols[r * 2 + c], 0.3));
        cell.position.set((c - 0.5) * 0.78, (0.5 - r) * 0.78, 0.08);
        punnett.add(cell);
      }
    }
    registerComponent(punnett, 'punnett', '2×2 Punnett Matrix', new THREE.Vector3(0.4, 0, 0), new THREE.Vector3(1.25, 2.35, 0));

    const ovum = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 18), makeOrganic(0xf472b6, 0.3)); ovum.position.set(0, 0.45, 0.7);
    const sperm = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 12), makeOrganic(0x38bdf8, 0.3)); sperm.rotation.z = Math.PI / 2;
    root.add(helix, punnett, ovum, sperm);
    return {
      root, camPos: [0, 2.1, 5.1], target: [0, 1.3, 0],
      update: (dt, _el, p, playing) => {
        if (playing) helix.rotation.y += dt * 0.65;
        const fp = p.fertilizeProgress !== undefined ? p.fertilizeProgress : 0.65;
        sperm.position.set(-0.95 + fp * 0.72, 0.45, 0.7);
      },
      readouts: (p) => (p.crossMode || 0) >= 0.5
        ? [{ label: 'Cross', value: 'XX × XY' }, { label: 'Sex Ratio', value: '50% F : 50% M' }]
        : [{ label: 'Cross', value: 'Tt × Tt' }, { label: 'Phenotype', value: '3 Tall : 1 Short' }],
    };
  }

  // Chemistry C04: 15-Tube pH 0-14 Spectrum Rack & Digital pH Probe Console
  if (id === 'C04') {
    const phPalette = [0xdc2626,0xef4444,0xf97316,0xf59e0b,0xeab308,0x84cc16,0x22c55e,0x10b981,0x14b8a6,0x06b6d4,0x0284c7,0x2563eb,0x4f46e5,0x6d28d9,0x7e22ce];
    const rack = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.14, 0.8), makeMetal(0x273244, 0.32, 0.78)); base.position.y = 0.07;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(4.95, 0.08, 0.44), makeMetal(0x475569, 0.28, 0.84)); rail.position.y = 0.88;
    rack.add(base, rail);
    for (let i = 0; i < 15; i++) {
      const tx = -2.24 + i * 0.32;
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.32, 14), makeGlass(0xe0f2fe, 0.4));
      tube.position.set(tx, 0.76, 0);
      const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.82, 12), new THREE.MeshPhysicalMaterial({ color: phPalette[i], roughness: 0.15, transparent: true, opacity: 0.85 }));
      liq.position.set(tx, 0.52, 0);
      rack.add(tube, liq);
    }
    registerComponent(rack, 'rack', 'pH 0–14 Tube Rack', new THREE.Vector3(0, 0, -0.35), new THREE.Vector3(0, 1.6, 0));

    const probe = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.45, 12), makeMetal(0x38bdf8, 0.25, 0.7)); stem.position.y = 0.72;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 12), makeGlass(0xa5f3fc, 0.6)); bulb.position.y = 0.02;
    probe.add(stem, bulb); probe.position.set(0, 0.65, 0);
    registerComponent(probe, 'probe', 'Digital pH Probe', new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, 2.25, 0));

    const phTex = createLiveDisplay(380, 240, maxAniso);
    const phCon = createBenchConsole(1.6, 1.0, phTex.texture);
    phCon.position.set(0, 2.45, -1.05);
    root.add(rack, probe, phCon);

    let lastVal = -1;
    return {
      root, camPos: [0, 2.35, 5.4], target: [0, 1.15, -0.2],
      update: (dt, _el, p) => {
        const ph = Math.max(0, Math.min(14, Math.round(p.phValue !== undefined ? p.phValue : 7)));
        const tx = -2.24 + ph * 0.32;
        probe.position.x = THREE.MathUtils.damp(probe.position.x, tx, 10, dt);
        if (ph !== lastVal) {
          lastVal = ph;
          const c = phTex.ctx;
          c.fillStyle = '#070A10'; c.fillRect(0, 0, 380, 240);
          c.fillStyle = '#94A3B8'; c.font = 'bold 16px monospace'; c.textAlign = 'left'; c.fillText('DIGITAL pH METER', 20, 34);
          c.fillStyle = '#' + phPalette[ph].toString(16).padStart(6, '0');
          c.font = 'bold 54px monospace'; c.fillText('pH ' + ph.toFixed(1), 20, 112);
          c.fillStyle = '#F8FAFC'; c.font = 'bold 20px monospace';
          c.fillText(ph < 7 ? 'ACIDIC SOLUTION' : ph === 7 ? 'NEUTRAL WATER' : 'BASIC / ALKALINE', 20, 165);
          c.fillStyle = '#38BDF8'; c.font = 'bold 17px monospace'; c.fillText('[H+] = 10^-' + ph + ' M', 20, 206);
          phTex.texture.needsUpdate = true;
        }
      },
      readouts: (p) => {
        const ph = Math.max(0, Math.min(14, Math.round(p.phValue !== undefined ? p.phValue : 7)));
        return [{ label: 'Solution pH', value: ph.toFixed(1) }, { label: 'Nature', value: ph < 7 ? 'Acidic' : ph === 7 ? 'Neutral' : 'Alkaline' }];
      },
    };
  }

  // Chemistry C06: Ionic Bond & 3D NaCl Crystal Lattice
  if (id === 'C06') {
    const pairGrp = new THREE.Group();
    const na = new THREE.Mesh(new THREE.SphereGeometry(0.48, 22, 22), makeOrganic(0xa855f7, 0.3)); na.position.set(-1.25, 1.35, 0);
    const cl = new THREE.Mesh(new THREE.SphereGeometry(0.56, 22, 22), makeOrganic(0x10b981, 0.3)); cl.position.set(1.25, 1.35, 0);
    const eDot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    pairGrp.add(na, cl, eDot);
    registerComponent(pairGrp, 'atoms', 'Na⁺ & Cl⁻ Ion Pair', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 2.05, 0));

    const latGrp = new THREE.Group(); latGrp.position.set(0, 1.35, 0);
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      const isNa = (Math.abs(x + y + z) % 2) === 0;
      const ion = new THREE.Mesh(new THREE.SphereGeometry(isNa ? 0.16 : 0.22, 14, 14), makeOrganic(isNa ? 0xa855f7 : 0x10b981, 0.28));
      ion.position.set(x * 0.55, y * 0.55, z * 0.55);
      latGrp.add(ion);
    }
    root.add(pairGrp, latGrp);
    return {
      root, camPos: [0, 2.2, 5.0], target: [0, 1.35, 0],
      update: (dt, _el, p, playing) => {
        const showLat = (p.showLattice || 0) >= 0.5;
        pairGrp.visible = !showLat; latGrp.visible = showLat;
        const tr = p.transferProgress !== undefined ? p.transferProgress : 0.5;
        eDot.position.set(-1.25 + tr * 2.5, 1.35 + Math.sin(tr * Math.PI) * 0.45, 0.45);
        if (playing && showLat) latGrp.rotation.y += dt * 0.5;
      },
      readouts: (p) => (p.showLattice || 0) >= 0.5
        ? [{ label: 'Crystal', value: 'FCC NaCl Lattice' }, { label: 'Coord No.', value: '6 : 6' }]
        : [{ label: 'Bonding', value: (p.transferProgress || 0.5) > 0.7 ? 'Na⁺ + Cl⁻ Formed' : 'Valence Transfer' }],
    };
  }

  // Chemistry C07: Water Electrolysis (2:1 H2 : O2 Eudiometer + OLED Power Supply)
  if (id === 'C07') {
    const tank = createBeaker(1.4, 1.45, 0x38bdf8, 0.65); tank.group.position.set(0, 0, 0);
    const tubeH2 = createBeaker(0.32, 1.75, 0xe0f2fe, 0.45); tubeH2.group.position.set(-0.62, 0.3, 0);
    const tubeO2 = createBeaker(0.32, 1.75, 0xbae6fd, 0.72); tubeO2.group.position.set(0.62, 0.3, 0);
    registerComponent(tubeH2.group, 'cathode', 'H₂ Cathode Tube (2x)', new THREE.Vector3(-0.3, 0.4, 0), new THREE.Vector3(-0.62, 2.2, 0));
    registerComponent(tubeO2.group, 'anode', 'O₂ Anode Tube (1x)', new THREE.Vector3(0.3, 0.4, 0), new THREE.Vector3(0.62, 2.2, 0));
    const elTex = createLiveDisplay(360, 240, maxAniso);
    const elCon = createBenchConsole(1.48, 0.98, elTex.texture); elCon.position.set(2.35, 0.85, 0); elCon.rotation.y = -0.45;
    root.add(tank.group, tubeH2.group, tubeO2.group, elCon);
    let lastK = '';
    return {
      root, camPos: [0.3, 2.3, 5.1], target: [0.3, 1.1, 0],
      update: (_dt, _el, p) => {
        const v = p.voltage !== undefined ? p.voltage : 8, mix = p.elapsedMix || 0.65;
        const hGas = Math.min(0.85, (v / 12) * mix * 0.85);
        tubeH2.liquidMesh.scale.y = Math.max(0.15, 1 - hGas);
        tubeO2.liquidMesh.scale.y = Math.max(0.5, 1 - hGas * 0.5);
        const k = v + '|' + mix;
        if (k !== lastK) {
          lastK = k;
          const c = elTex.ctx;
          c.fillStyle = '#070A10'; c.fillRect(0, 0, 360, 240);
          c.fillStyle = '#94A3B8'; c.font = 'bold 16px monospace'; c.textAlign = 'left'; c.fillText('VOLTAMETER SUPPLY', 18, 34);
          c.fillStyle = '#38BDF8'; c.font = 'bold 40px monospace'; c.fillText(v.toFixed(0) + '.0 V DC', 18, 96);
          c.fillStyle = '#34D399'; c.font = 'bold 20px monospace'; c.fillText('H2:O2 RATIO = 2 : 1', 18, 154);
          c.fillStyle = '#F59E0B'; c.fillText('VOL H2 = ' + Math.round(hGas * 40) + ' mL', 18, 198);
          elTex.texture.needsUpdate = true;
        }
      },
      readouts: (p) => [{ label: 'Voltage', value: String(p.voltage || 8), unit: 'V' }, { label: 'H₂ : O₂ Ratio', value: '2 : 1' }],
    };
  }

  // Chemistry C08: Carbon & Hydrocarbons (including Twin C=O Double Bond)
  if (id === 'C08') {
    const molGrp = new THREE.Group(); molGrp.position.set(0, 1.45, 0);
    registerComponent(molGrp, 'molecule', 'Hydrocarbon Structure', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 2.35, 0));
    root.add(molGrp);
    const buildMol = (idx, sf) => {
      while (molGrp.children.length > 0) molGrp.remove(molGrp.children[0]);
      const cR = sf ? 0.52 : 0.28, hR = sf ? 0.32 : 0.16, oR = sf ? 0.46 : 0.25;
      const addA = (pos, r, col) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 18), makeOrganic(col, 0.28)); m.position.copy(pos); molGrp.add(m); };
      const addB = (a, b, dbl) => {
        if (sf) return;
        const mat = makeMetal(0xe2e8f0, 0.25, 0.7);
        if (dbl) {
          const o = new THREE.Vector3(0, 0, 0.065);
          molGrp.add(createCylBetween(a.clone().add(o), b.clone().add(o), 0.045, mat));
          molGrp.add(createCylBetween(a.clone().sub(o), b.clone().sub(o), 0.045, mat));
        } else {
          molGrp.add(createCylBetween(a, b, 0.055, mat));
        }
      };
      const c1 = new THREE.Vector3(idx === 0 ? 0 : -0.65, 0, 0); addA(c1, cR, 0x334155);
      if (idx === 0) {
        [[0,1,0],[0.9,-0.45,0.5],[-0.9,-0.45,0.5],[0,-0.45,-0.9]].forEach((v) => { const p = new THREE.Vector3(...v).multiplyScalar(0.85); addA(p, hR, 0xf8fafc); addB(c1, p, false); });
      } else {
        const c2 = new THREE.Vector3(0.65, 0, 0); addA(c2, cR, 0x334155); addB(c1, c2, false);
        [[-1.15,0.65,0],[-1.15,-0.55,0.5],[-1.15,-0.55,-0.5]].forEach((v) => { const p = new THREE.Vector3(...v); addA(p, hR, 0xf8fafc); addB(c1, p, false); });
        if (idx === 3) {
          const o1 = new THREE.Vector3(0.85, 0.92, 0); addA(o1, oR, 0xef4444); addB(c2, o1, true);
          const o2 = new THREE.Vector3(1.45, -0.45, 0); addA(o2, oR, 0xef4444); addB(c2, o2, false);
          const hOh = new THREE.Vector3(1.95, -0.1, 0); addA(hOh, hR, 0xf8fafc); addB(o2, hOh, false);
        } else {
          const o = new THREE.Vector3(1.4, 0.25, 0); addA(o, idx === 2 ? oR : hR, idx === 2 ? 0xef4444 : 0xf8fafc); addB(c2, o, false);
        }
      }
    };
    let lastK = '';
    const names = ['Methane (CH₄)', 'Ethane (C₂H₆)', 'Ethanol (C₂H₅OH)', 'Ethanoic Acid (CH₃COOH)'];
    return {
      root, camPos: [0, 2.2, 4.9], target: [0, 1.4, 0],
      update: (dt, _el, p, playing) => {
        const idx = Math.round(p.moleculeIndex !== undefined ? p.moleculeIndex : 2);
        const sf = (p.bondStyle || 0) >= 0.5;
        const k = idx + '|' + (sf ? 1 : 0);
        if (k !== lastK) { lastK = k; buildMol(idx, sf); }
        if (playing) molGrp.rotation.y += dt * 0.55;
      },
      readouts: (p) => [{ label: 'Molecule', value: names[Math.round(p.moleculeIndex !== undefined ? p.moleculeIndex : 2)] }],
    };
  }

  // Remaining Chemistry Modules (C01-C03, C05, C09-C10): Realistic Multi-Vessel Lab Bench + Live OLED Console
  if (id.startsWith('C')) {
    const heater = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.0, 0.22, 28), makeMetal(0x273244, 0.3, 0.8)); heater.position.set(-0.75, 0.11, 0);
    const b1 = createBeaker(0.75, 1.55, id === 'C03' ? 0xec4899 : id === 'C05' ? 0x0284c7 : 0x38bdf8, 0.68); b1.group.position.set(-0.75, 0.22, 0);
    registerComponent(b1.group, 'vessel', 'Primary Reaction Vessel', new THREE.Vector3(-0.35, 0, 0), new THREE.Vector3(-0.75, 1.9, 0));

    const b2 = createBeaker(0.55, 1.3, id === 'C10' ? 0xb45309 : 0x8b5cf6, 0.58); b2.group.position.set(0.95, 0, 0.25);
    registerComponent(b2.group, 'reagent', 'Secondary Reagent', new THREE.Vector3(0.35, 0, 0), new THREE.Vector3(0.95, 1.5, 0.25));

    const therm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.6, 12), makeMetal(0xe2e8f0, 0.2, 0.8)); therm.position.set(-0.48, 1.25, 0); therm.rotation.z = -0.15;
    const chemTex = createLiveDisplay(360, 240, maxAniso);
    const chemCon = createBenchConsole(1.5, 1.0, chemTex.texture); chemCon.position.set(1.95, 0.85, -1.05); chemCon.rotation.y = -0.48;
    root.add(heater, b1.group, b2.group, therm, chemCon);
    let lastK = '';
    return {
      root, camPos: [0.1, 2.35, 5.1], target: [0.2, 1.1, 0],
      update: (_dt, _el, p) => {
        if (id === 'C03') {
          const st = Math.round(p.solutionType !== undefined ? p.solutionType : 2);
          b1.liquidMesh.material.color.setHex(st === 0 ? 0xf87171 : st === 1 ? 0x38bdf8 : 0xec4899);
        }
        const k = JSON.stringify(p);
        if (k !== lastK) {
          lastK = k;
          const c = chemTex.ctx;
          c.fillStyle = '#070A10'; c.fillRect(0, 0, 360, 240);
          c.fillStyle = '#94A3B8'; c.font = 'bold 16px monospace'; c.textAlign = 'left'; c.fillText('CHEM TELEMETRY · ' + id, 18, 34);
          c.fillStyle = '#38BDF8'; c.font = 'bold 28px monospace'; c.fillText('REACTION ACTIVE', 18, 96);
          c.fillStyle = '#34D399'; c.font = 'bold 20px monospace'; c.fillText('TEMP = 298.1 K', 18, 148);
          c.fillStyle = '#F59E0B'; c.fillText('STATE: EQUILIBRIUM', 18, 194);
          chemTex.texture.needsUpdate = true;
        }
      },
      readouts: () => [{ label: 'Module', value: id + ' Chemistry Lab' }, { label: 'Temp', value: '298.1 K' }],
    };
  }

  // Mathematics M01: Surface Areas & Volumes of Solids
  if (id === 'M01') {
    const specs = [
      { key: 'cube', label: 'Cube', x: -1.95, col: 0x38bdf8, geo: new THREE.BoxGeometry(0.95, 0.95, 0.95) },
      { key: 'cylinder', label: 'Cylinder', x: -0.65, col: 0x10b981, geo: new THREE.CylinderGeometry(0.45, 0.45, 1.1, 24) },
      { key: 'cone', label: 'Cone', x: 0.65, col: 0xf59e0b, geo: new THREE.ConeGeometry(0.5, 1.15, 24) },
      { key: 'sphere', label: 'Sphere', x: 1.95, col: 0x8b5cf6, geo: new THREE.SphereGeometry(0.52, 24, 24) },
    ];
    const meshes = specs.map((s) => {
      const g = new THREE.Group(); g.position.set(s.x, 0, 0);
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.14, 24), makeMetal(0x273244, 0.35, 0.78)); ped.position.y = 0.07;
      const m = new THREE.Mesh(s.geo, makeOrganic(s.col, 0.28)); m.position.y = 0.75;
      g.add(ped, m);
      registerComponent(g, s.key, s.label, new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 1.48, 0));
      root.add(g);
      return m;
    });
    return {
      root, camPos: [0, 2.35, 5.2], target: [0, 0.85, 0],
      update: (dt, _el, p, playing) => {
        const idx = Math.round(p.solidIndex || 0);
        meshes.forEach((m, i) => {
          if (playing) m.rotation.y += dt * 0.45;
          m.scale.setScalar(idx === 0 || idx === i + 1 ? 1.0 : 0.72);
        });
      },
      readouts: (p) => [{ label: 'Selected', value: ['All 4 Solids', 'Cube (a³)', 'Cylinder (πr²h)', 'Cone (⅓πr²h)', 'Sphere (⁴⁄₃πr³)'][Math.round(p.solidIndex || 0)] }],
    };
  }

  // Mathematics M02: Hinged Unfolding Cube / Cylinder Net
  if (id === 'M02') {
    const netGrp = new THREE.Group(); netGrp.position.set(0, 0.55, 0);
    const fMat = makeOrganic(0x38bdf8, 0.3);
    const baseFace = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.8), fMat);
    const fF = new THREE.Group(); fF.position.set(0, 0, 0.4);
    const fFm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.8), makeOrganic(0x10b981, 0.3)); fFm.position.z = 0.4; fF.add(fFm);
    const fB = new THREE.Group(); fB.position.set(0, 0, -0.4);
    const fBm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.8), makeOrganic(0x8b5cf6, 0.3)); fBm.position.z = -0.4; fB.add(fBm);
    const fL = new THREE.Group(); fL.position.set(-0.4, 0, 0);
    const fLm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.8), makeOrganic(0xf59e0b, 0.3)); fLm.position.x = -0.4; fL.add(fLm);
    const fR = new THREE.Group(); fR.position.set(0.4, 0, 0);
    const fRm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.8), makeOrganic(0xef4444, 0.3)); fRm.position.x = 0.4; fR.add(fRm);
    netGrp.add(baseFace, fF, fB, fL, fR);
    registerComponent(netGrp, 'net', 'Unfolding 3D Net', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 1.4, 0));
    root.add(netGrp);
    return {
      root, camPos: [0, 3.2, 4.8], target: [0, 0.65, 0],
      update: (_dt, _el, p) => {
        const unf = p.unfold !== undefined ? p.unfold : 0.4;
        const sc = (p.size || 1.6) / 1.6;
        netGrp.scale.setScalar(sc);
        const foldAngle = (1 - unf) * (Math.PI / 2);
        fF.rotation.x = -foldAngle; fB.rotation.x = foldAngle; fL.rotation.z = -foldAngle; fR.rotation.z = foldAngle;
      },
      readouts: (p) => { const a = p.size || 1.6; return [{ label: 'Cube TSA', value: (6 * a * a).toFixed(1), unit: 'm²' }, { label: 'Volume', value: (a * a * a).toFixed(1), unit: 'm³' }]; },
    };
  }

  // Mathematics M04: Trigonometry Triangle & Unit Console
  if (id === 'M04') {
    const tTex = createLiveDisplay(360, 240, maxAniso);
    const tCon = createBenchConsole(1.5, 1.0, tTex.texture); tCon.position.set(1.9, 0.85, -1.0); tCon.rotation.y = -0.45;
    const adj = createCylBetween(new THREE.Vector3(-1.5, 0.3, 0), new THREE.Vector3(1.0, 0.3, 0), 0.05, makeOrganic(0x10b981, 0.3));
    const opp = createCylBetween(new THREE.Vector3(1.0, 0.3, 0), new THREE.Vector3(1.0, 2.0, 0), 0.05, makeOrganic(0x38bdf8, 0.3));
    const hyp = createCylBetween(new THREE.Vector3(-1.5, 0.3, 0), new THREE.Vector3(1.0, 2.0, 0), 0.055, makeOrganic(0xf59e0b, 0.3));
    registerComponent(hyp, 'triangle', 'Right-Angled Triangle', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(-0.2, 1.4, 0));
    root.add(adj, opp, hyp, tCon);
    let lastK = '';
    return {
      root, camPos: [0, 2.2, 5.1], target: [0.1, 1.05, 0],
      update: (_dt, _el, p) => {
        const deg = p.angleDeg || 45, H = p.hypotenuse || 2.5, rad = THREE.MathUtils.degToRad(deg);
        const A = H * Math.cos(rad), O = H * Math.sin(rad);
        const pA = new THREE.Vector3(-1.5, 0.3, 0), pB = new THREE.Vector3(-1.5 + A, 0.3, 0), pC = new THREE.Vector3(-1.5 + A, 0.3 + O, 0);
        updateCylBetween(adj, pA, pB); updateCylBetween(opp, pB, pC); updateCylBetween(hyp, pA, pC);
        const k = deg + '|' + H;
        if (k !== lastK) {
          lastK = k; const c = tTex.ctx;
          c.fillStyle = '#070A10'; c.fillRect(0, 0, 360, 240);
          c.fillStyle = '#94A3B8'; c.font = 'bold 16px monospace'; c.textAlign = 'left'; c.fillText('TRIG RATIOS · θ=' + deg + '°', 18, 34);
          c.fillStyle = '#38BDF8'; c.font = 'bold 26px monospace'; c.fillText('sin θ = ' + Math.sin(rad).toFixed(3), 18, 92);
          c.fillStyle = '#10B981'; c.fillText('cos θ = ' + Math.cos(rad).toFixed(3), 18, 138);
          c.fillStyle = '#F59E0B'; c.fillText('tan θ = ' + Math.tan(rad).toFixed(3), 18, 184);
          tTex.texture.needsUpdate = true;
        }
      },
      readouts: (p) => { const r = THREE.MathUtils.degToRad(p.angleDeg || 45); return [{ label: 'sin θ', value: Math.sin(r).toFixed(3) }, { label: 'cos θ', value: Math.cos(r).toFixed(3) }]; },
    };
  }

  // Mathematics M03 / M05 / M06 / M08 / M09: Interactive Coordinate / Parabola / Circle Plane
  if (id === 'M03' || id === 'M05' || id === 'M06' || id === 'M08' || id === 'M09') {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), new THREE.MeshBasicMaterial({ map: createCartesianTex(maxAniso), side: THREE.DoubleSide }));
    plane.rotation.x = -Math.PI / 2; plane.position.y = 0.04;
    registerComponent(plane, 'plane', 'Cartesian XY Grid', new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(2.0, 0.2, 2.0));
    const pinA = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 18), makeOrganic(0x10b981, 0.3)); pinA.position.set(-1, 0.2, 0.8);
    const pinB = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 18), makeOrganic(0x38bdf8, 0.3)); pinB.position.set(1.2, 0.2, -0.9);
    const line = createCylBetween(pinA.position, pinB.position, 0.045, makeOrganic(0xf59e0b, 0.3));
    registerComponent(pinA, 'pointA', 'Primary Geometry', new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 0.55, 0));
    root.add(plane, pinA, pinB, line);
    return {
      root, camPos: [0, 4.4, 3.8], target: [0, 0.1, 0],
      update: (_dt, _el, p) => {
        if (id === 'M03') {
          pinA.position.set((p.x1 !== undefined ? p.x1 : -2) * 0.55, 0.2, -(p.y1 !== undefined ? p.y1 : -1.5) * 0.55);
          pinB.position.set((p.x2 !== undefined ? p.x2 : 2.5) * 0.55, 0.2, -(p.y2 !== undefined ? p.y2 : 2) * 0.55);
          updateCylBetween(line, pinA.position, pinB.position);
        }
      },
      readouts: (p) => id === 'M03'
        ? [{ label: 'Distance d', value: Math.hypot((p.x2 || 2.5) - (p.x1 || -2), (p.y2 || 2) - (p.y1 || -1.5)).toFixed(2), unit: 'units' }]
        : [{ label: 'Coordinate Grid', value: id + ' Interactive 3D' }],
    };
  }

  // Mathematics M07: Arithmetic Progression Staircase & Gauss Sum Proof
  if (id === 'M07') {
    const apGrp = new THREE.Group();
    const bars = Array.from({ length: 10 }, (_, i) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.0, 0.32), makeOrganic(0x38bdf8, 0.3));
      m.position.set(-1.8 + i * 0.4, 0.5, 0); apGrp.add(m); return m;
    });
    registerComponent(apGrp, 'bars', 'Arithmetic Series Bars', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 2.2, 0));
    root.add(apGrp);
    return {
      root, camPos: [0, 2.4, 5.2], target: [0, 1.1, 0],
      update: (_dt, _el, p) => {
        const a = p.firstTerm || 1, d = p.diff || 0.4, n = Math.round(p.terms || 7);
        bars.forEach((b, i) => {
          b.visible = i < n;
          if (i < n) { const h = Math.max(0.2, (a + i * d) * 0.55); b.scale.y = h; b.position.y = h / 2; }
        });
      },
      readouts: (p) => { const a = p.firstTerm || 1, d = p.diff || 0.4, n = Math.round(p.terms || 7); return [{ label: 'Sum Sₙ', value: ((n / 2) * (2 * a + (n - 1) * d)).toFixed(2) }]; },
    };
  }

  // Mathematics M10: Probability 3D Pip Die & Frequency Histogram
  const dieGrp = new THREE.Group(); dieGrp.position.set(-1.55, 0.72, 0.4);
  dieGrp.add(new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), makeOrganic(0xf8fafc, 0.25)));
  const pipMat = makeMetal(0x0f172a, 0.4, 0.2);
  [[0,0,0.43],[0.2,0.2,-0.43],[-0.2,-0.2,-0.43],[0.2,0.2,0.43],[-0.2,-0.2,0.43]].forEach(([px, py, pz]) => {
    const pip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), pipMat); pip.position.set(px, py, pz); dieGrp.add(pip);
  });
  registerComponent(dieGrp, 'die', 'Balanced 6-Face Die', new THREE.Vector3(-0.35, 0.3, 0), new THREE.Vector3(-1.55, 1.45, 0.4));
  const histGrp = new THREE.Group(); histGrp.position.set(0.95, 0, -0.2);
  const hBars = Array.from({ length: 6 }, (_, i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.0, 0.28), makeOrganic(0x8b5cf6, 0.3));
    b.position.set(-0.9 + i * 0.36, 0.5, 0); histGrp.add(b); return b;
  });
  registerComponent(histGrp, 'histogram', 'Frequency Histogram', new THREE.Vector3(0.35, 0.3, 0), new THREE.Vector3(0.95, 1.9, -0.2));
  root.add(dieGrp, histGrp);
  return {
    root, camPos: [0, 2.5, 5.1], target: [0, 1.0, 0],
    update: (dt, _el, p, playing) => {
      if (playing) { dieGrp.rotation.x += dt * 0.8; dieGrp.rotation.y += dt * 1.1; }
      const s = p.seed || 1;
      hBars.forEach((b, i) => { const h = 0.65 + Math.abs(Math.sin(s * 1.7 + i * 0.9)) * 1.25; b.scale.y = h; b.position.y = h / 2; });
    },
    readouts: (p) => [{ label: 'Trials (N)', value: String(Math.round(p.trials || 120)) }, { label: 'Mode', value: (p.mode || 1) >= 0.5 ? '2-Dice Sum' : 'Single Die (1–6)' }],
  };
}

function loadExperiment(id, params) {
  if (activeScene) scene.remove(activeScene.root);
  registered = [];
  origEmissives.clear();
  annLayer.innerHTML = '';

  activeScene = buildScene(id);
  scene.add(activeScene.root);
  state.camGoalPos.set(...activeScene.camPos);
  state.camGoalTarget.set(...activeScene.target);
  camera.position.copy(state.camGoalPos);
  controls.target.copy(state.camGoalTarget);
  controls.update();

  registered.forEach((comp) => {
    const btn = document.createElement('button');
    btn.className = 'ann-btn';
    btn.textContent = comp.label;
    btn.onclick = () => {
      state.selectedMeshKey = comp.meshKey;
      applyHighlight(comp.meshKey);
      postToRN({ type: 'COMPONENT_SELECTED', meshKey: comp.meshKey });
    };
    annLayer.appendChild(btn);
    comp.domBtn = btn;
  });

  postToRN({ type: 'READOUTS', readouts: activeScene.readouts(params) });
}

function handleCommand(cmd) {
  if (!cmd || typeof cmd.type !== 'string') return;
  switch (cmd.type) {
    case 'LOAD_EXPERIMENT':
      state.experimentId = cmd.experimentId;
      state.params = Object.assign({}, cmd.params || {});
      state.exploded = 0;
      state.selectedMeshKey = null;
      loadExperiment(cmd.experimentId, state.params);
      break;
    case 'SET_PARAM':
      state.params[cmd.key] = cmd.value;
      break;
    case 'SET_PLAYING':
      state.playing = !!cmd.playing;
      break;
    case 'SET_EXPLODED':
      state.exploded = cmd.amount || 0;
      break;
    case 'TOGGLE_ANNOTATIONS':
      state.showAnnotations = !!cmd.visible;
      annLayer.style.display = state.showAnnotations ? 'block' : 'none';
      break;
    case 'SET_COMPONENT_VISIBILITY':
      registered.filter(c => c.meshKey === cmd.meshKey).forEach(c => { c.object.visible = !!cmd.visible; });
      break;
    case 'SELECT_COMPONENT':
      state.selectedMeshKey = cmd.meshKey;
      applyHighlight(cmd.meshKey);
      break;
    case 'RESET_CAMERA':
      if (activeScene) {
        state.camGoalPos.set(...activeScene.camPos);
        state.camGoalTarget.set(...activeScene.target);
        state.camTransitionActive = true;
      }
      break;
    case 'SET_CAMERA_PRESET':
      if (Array.isArray(cmd.position) && Array.isArray(cmd.target)) {
        state.camGoalPos.set(...cmd.position);
        state.camGoalTarget.set(...cmd.target);
        state.camTransitionActive = true;
      }
      break;
    case 'RESET_SIM':
      state.exploded = 0;
      state.playing = true;
      loadExperiment(state.experimentId, state.params);
      break;
  }
}

window.STEMVERSE_BRIDGE = handleCommand;
window.addEventListener('message', (e) => {
  try { handleCommand(typeof e.data === 'string' ? JSON.parse(e.data) : e.data); } catch {}
});
document.addEventListener('message', (e) => {
  try { handleCommand(typeof e.data === 'string' ? JSON.parse(e.data) : e.data); } catch {}
});

const raycaster = new THREE.Raycaster();
const ptr = new THREE.Vector2();
let dx = 0, dy = 0;
renderer.domElement.addEventListener('pointerdown', (e) => { dx = e.clientX; dy = e.clientY; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!INIT.interactive || Math.hypot(e.clientX - dx, e.clientY - dy) > 8) return;
  const r = renderer.domElement.getBoundingClientRect();
  ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(ptr, camera);
  const targets = [];
  registered.forEach(c => { if (c.object.visible) targets.push(...c.meshes); });
  const hits = raycaster.intersectObjects(targets, false);
  const key = hits.length > 0 ? hits[0].object.userData.meshKey : null;
  state.selectedMeshKey = key;
  applyHighlight(key);
  postToRN({ type: 'COMPONENT_SELECTED', meshKey: key });
});

window.addEventListener('resize', () => {
  const w = wrap.clientWidth, h = Math.max(1, wrap.clientHeight);
  applyResponsiveFov(w, h);
  renderer.setSize(w, h);
});

loadExperiment(state.experimentId, state.params);
annLayer.style.display = state.showAnnotations ? 'block' : 'none';
postToRN({ type: 'READY' });

const clock = new THREE.Clock();
const _targetPos = new THREE.Vector3();
const _proj = new THREE.Vector3();
const _world = new THREE.Vector3();
let readoutT = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.08);
  const el = clock.elapsedTime;

  if (state.camTransitionActive) {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, state.camGoalPos.x, 7, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, state.camGoalPos.y, 7, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, state.camGoalPos.z, 7, dt);
    controls.target.x = THREE.MathUtils.damp(controls.target.x, state.camGoalTarget.x, 7, dt);
    controls.target.y = THREE.MathUtils.damp(controls.target.y, state.camGoalTarget.y, 7, dt);
    controls.target.z = THREE.MathUtils.damp(controls.target.z, state.camGoalTarget.z, 7, dt);
    if (camera.position.distanceTo(state.camGoalPos) < 0.02) state.camTransitionActive = false;
  }
  controls.update();

  registered.forEach((c) => {
    _targetPos.copy(c.basePosition).addScaledVector(c.explodeOffset, state.exploded);
    c.object.position.x = THREE.MathUtils.damp(c.object.position.x, _targetPos.x, 8, dt);
    c.object.position.y = THREE.MathUtils.damp(c.object.position.y, _targetPos.y, 8, dt);
    c.object.position.z = THREE.MathUtils.damp(c.object.position.z, _targetPos.z, 8, dt);
  });

  if (activeScene) {
    activeScene.update(dt, el, state.params, state.playing);
    readoutT += dt;
    if (readoutT > 0.3) {
      readoutT = 0;
      postToRN({ type: 'READOUTS', readouts: activeScene.readouts(state.params) });
    }
  }

  renderer.render(scene, camera);

  if (state.showAnnotations) {
    const cw = wrap.clientWidth, ch = wrap.clientHeight;
    registered.forEach((c) => {
      const btn = c.domBtn;
      if (!btn) return;
      if (!c.object.visible) { btn.style.display = 'none'; return; }
      _world.copy(c.labelAnchorLocal);
      c.object.localToWorld(_world);
      _proj.copy(_world).project(camera);
      const x = ((_proj.x + 1)/2) * cw;
      const y = ((-_proj.y + 1)/2) * ch;
      if (_proj.z < 1 && _proj.z > -1 && x > 40 && x < cw - 40 && y > 40 && y < ch - 40) {
        btn.style.display = 'block';
        btn.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(-50%,-100%)';
        btn.className = state.selectedMeshKey === c.meshKey ? 'ann-btn selected' : 'ann-btn';
      } else {
        btn.style.display = 'none';
      }
    });
  }
}
animate();
</script>
</body>
</html>`;
}
