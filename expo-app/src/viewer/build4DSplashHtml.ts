export function build4DSplashHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #FFFFFF; }
  canvas { display: block; width: 100%; height: 100%; }
</style>
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js"
  }
}
</script>
</head>
<body>
<script type="module">
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / Math.max(1, window.innerHeight), 0.1, 100);
camera.position.set(0, 0.25, 6.2);

scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const gLight = new THREE.PointLight(0x10b981, 3.0, 20);
gLight.position.set(3, 3, 4);
scene.add(gLight);
const pLight = new THREE.PointLight(0x7c3aed, 2.5, 20);
pLight.position.set(-3, -2, 3);
scene.add(pLight);

// 4D Tesseract (16 hypercube vertices in [-1,1]^4, 32 edges)
const baseVerts4D = [];
for (let i = 0; i < 16; i++) {
  baseVerts4D.push([
    i & 1 ? 1 : -1,
    i & 2 ? 1 : -1,
    i & 4 ? 1 : -1,
    i & 8 ? 1 : -1,
  ]);
}
const edges = [];
for (let i = 0; i < 16; i++) {
  for (let bit = 0; bit < 4; bit++) {
    const j = i ^ (1 << bit);
    if (i < j) edges.push([i, j]);
  }
}

const hyperGroup = new THREE.Group();
hyperGroup.position.y = 0.65;
scene.add(hyperGroup);

const linePos = new Float32Array(edges.length * 6);
const lineCol = new Float32Array(edges.length * 6);
const lineGeo = new THREE.BufferGeometry();
lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
lineGeo.setAttribute('color', new THREE.BufferAttribute(lineCol, 3));
const lineSegments = new THREE.LineSegments(
  lineGeo,
  new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.92 })
);
hyperGroup.add(lineSegments);

const nodeMeshes = [];
const nodeGeo = new THREE.SphereGeometry(0.068, 12, 12);
for (let i = 0; i < 16; i++) {
  const m = new THREE.Mesh(
    nodeGeo,
    new THREE.MeshBasicMaterial({ color: (i & 8) ? 0x059669 : 0x7c3aed })
  );
  hyperGroup.add(m);
  nodeMeshes.push(m);
}

// Quantum core & orbital rings
const core = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.36, 0),
  new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.4, roughness: 0.15, metalness: 0.3 })
);
hyperGroup.add(core);

const ring1 = new THREE.Mesh(
  new THREE.TorusGeometry(2.05, 0.014, 8, 72),
  new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.42 })
);
ring1.rotation.x = 1.1;
const ring2 = new THREE.Mesh(
  new THREE.TorusGeometry(2.38, 0.012, 8, 72),
  new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.34 })
);
ring2.rotation.y = 0.95;
hyperGroup.add(ring1, ring2);

// Particle field
const particleCount = 48;
const particles = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.032, 8, 8),
  new THREE.MeshBasicMaterial({ color: 0x059669, transparent: true, opacity: 0.55 }),
  particleCount
);
scene.add(particles);
const pData = Array.from({ length: particleCount }, (_, i) => ({
  r: 2.3 + (i % 5) * 0.45,
  sp: 0.28 + (i % 4) * 0.12,
  ph: (i / particleCount) * Math.PI * 2,
  yOff: ((i % 7) - 3) * 0.52,
}));
const dummy = new THREE.Object3D();

const cGreen = new THREE.Color(0x059669);
const cPurple = new THREE.Color(0x7c3aed);
const cTmp = new THREE.Color();
const projected3D = Array.from({ length: 16 }, () => new THREE.Vector3());

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  const aXW = t * 0.72;
  const aYW = t * 0.48;
  const aZW = t * 0.34;
  const c1 = Math.cos(aXW), s1 = Math.sin(aXW);
  const c2 = Math.cos(aYW), s2 = Math.sin(aYW);
  const c3 = Math.cos(aZW), s3 = Math.sin(aZW);

  for (let i = 0; i < 16; i++) {
    let x = baseVerts4D[i][0], y = baseVerts4D[i][1], z = baseVerts4D[i][2], w = baseVerts4D[i][3];
    // Rotate XW
    const nx1 = x * c1 - w * s1;
    const nw1 = x * s1 + w * c1;
    x = nx1; w = nw1;
    // Rotate YW
    const ny2 = y * c2 - w * s2;
    const nw2 = y * s2 + w * c2;
    y = ny2; w = nw2;
    // Rotate ZW
    const nz3 = z * c3 - w * s3;
    const nw3 = z * s3 + w * c3;
    z = nz3; w = nw3;

    const k = 2.6 / (3.1 - w);
    projected3D[i].set(x * k * 0.88, y * k * 0.88, z * k * 0.88);
    nodeMeshes[i].position.copy(projected3D[i]);
    nodeMeshes[i].scale.setScalar(0.75 + (w + 1.5) * 0.25);
  }

  const pAttr = lineGeo.attributes.position;
  const cAttr = lineGeo.attributes.color;
  for (let e = 0; e < edges.length; e++) {
    const a = projected3D[edges[e][0]];
    const b = projected3D[edges[e][1]];
    pAttr.setXYZ(e * 2, a.x, a.y, a.z);
    pAttr.setXYZ(e * 2 + 1, b.x, b.y, b.z);
    const blend = 0.5 + 0.5 * Math.sin(t * 1.4 + e * 0.35);
    cTmp.copy(cGreen).lerp(cPurple, blend);
    cAttr.setXYZ(e * 2, cTmp.r, cTmp.g, cTmp.b);
    cAttr.setXYZ(e * 2 + 1, cTmp.r, cTmp.g, cTmp.b);
  }
  pAttr.needsUpdate = true;
  cAttr.needsUpdate = true;

  hyperGroup.rotation.y = t * 0.24;
  hyperGroup.rotation.x = Math.sin(t * 0.45) * 0.14;
  core.rotation.y = -t * 0.95;
  core.rotation.x = t * 0.65;
  ring1.rotation.z = t * 0.48;
  ring2.rotation.x = -t * 0.36;

  for (let i = 0; i < particleCount; i++) {
    const pd = pData[i];
    const ang = pd.ph + t * pd.sp;
    dummy.position.set(Math.cos(ang) * pd.r, 0.5 + pd.yOff + Math.sin(t + i) * 0.2, Math.sin(ang) * pd.r * 0.5);
    dummy.updateMatrix();
    particles.setMatrixAt(i, dummy.matrix);
  }
  particles.instanceMatrix.needsUpdate = true;

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
</script>
</body>
</html>`;
}
