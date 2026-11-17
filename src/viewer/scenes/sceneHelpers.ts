import * as THREE from 'three';

export function makeGlassMaterial(
  color = 0xdbeafe,
  isSoftwareGl = false,
  opacity = 0.34,
  ior = 1.52
): THREE.MeshPhysicalMaterial {
  if (isSoftwareGl) {
    return new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.05,
      roughness: 0.08,
      transparent: true,
      opacity,
      clearcoat: 1.0,
      depthWrite: false,
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0,
    roughness: 0.04,
    transmission: 0.88,
    thickness: 0.45,
    ior,
    transparent: true,
    opacity: 0.92,
    clearcoat: 1.0,
    depthWrite: false,
  });
}

export function makeMetalMaterial(
  color = 0x94a3b8,
  roughness = 0.24,
  metalness = 0.88
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
  });
}

export function createBeakerGroup(
  radius = 0.55,
  height = 1.25,
  liquidColor = 0x38bdf8,
  liquidFill = 0.62,
  isSoftwareGl = false
): { group: THREE.Group; liquidMesh: THREE.Mesh; glassMesh: THREE.Mesh } {
  const group = new THREE.Group();

  // Lathe profile for realistic thick-walled borosilicate beaker with flared rim
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(radius * 0.96, 0),
    new THREE.Vector2(radius, 0.06),
    new THREE.Vector2(radius, height - 0.08),
    new THREE.Vector2(radius * 1.07, height),
    new THREE.Vector2(radius * 1.02, height),
    new THREE.Vector2(radius * 0.94, height - 0.08),
    new THREE.Vector2(radius * 0.94, 0.06),
    new THREE.Vector2(0, 0.06),
  ];
  const glassGeo = new THREE.LatheGeometry(pts, 36);
  const glassMat = makeGlassMaterial(0xe0f2fe, isSoftwareGl, 0.32, 1.48);
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.renderOrder = 3;
  group.add(glassMesh);

  // Inner liquid volume
  const liqH = Math.max(0.08, (height - 0.14) * liquidFill);
  const liqGeo = new THREE.CylinderGeometry(radius * 0.91, radius * 0.91, liqH, 32);
  const liqMat = new THREE.MeshPhysicalMaterial({
    color: liquidColor,
    roughness: 0.12,
    metalness: 0.02,
    transparent: true,
    opacity: 0.78,
    clearcoat: 0.9,
  });
  const liquidMesh = new THREE.Mesh(liqGeo, liqMat);
  liquidMesh.position.y = 0.07 + liqH / 2;
  liquidMesh.renderOrder = 1;
  group.add(liquidMesh);

  return { group, liquidMesh, glassMesh };
}

export function createErlenmeyerFlaskGroup(
  baseRadius = 0.56,
  height = 1.4,
  liquidColor = 0x37b6ff,
  isSoftwareGl = false
): { group: THREE.Group; liquidMesh: THREE.Mesh } {
  const group = new THREE.Group();
  const neckR = baseRadius * 0.34;
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(baseRadius * 0.9, 0),
    new THREE.Vector2(baseRadius, 0.14),
    new THREE.Vector2(neckR, height * 0.66),
    new THREE.Vector2(neckR, height * 0.94),
    new THREE.Vector2(neckR * 1.18, height),
  ];
  const glassGeo = new THREE.LatheGeometry(pts, 36);
  const glassMat = makeGlassMaterial(0xe0f2fe, isSoftwareGl, 0.32);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.renderOrder = 3;
  group.add(glass);

  // Conical liquid fill
  const liqPts: THREE.Vector2[] = [
    new THREE.Vector2(0, 0.04),
    new THREE.Vector2(baseRadius * 0.88, 0.04),
    new THREE.Vector2(baseRadius * 0.93, 0.14),
    new THREE.Vector2(baseRadius * 0.62, height * 0.44),
    new THREE.Vector2(0, height * 0.44),
  ];
  const liqGeo = new THREE.LatheGeometry(liqPts, 32);
  const liqMat = new THREE.MeshPhysicalMaterial({
    color: liquidColor,
    roughness: 0.1,
    metalness: 0.02,
    transparent: true,
    opacity: 0.82,
    clearcoat: 0.8,
  });
  const liquidMesh = new THREE.Mesh(liqGeo, liqMat);
  liquidMesh.renderOrder = 1;
  group.add(liquidMesh);

  return { group, liquidMesh };
}

export function createHelicalCoil(
  radius = 0.52,
  length = 2.0,
  turns = 10,
  wireRadius = 0.036,
  color = 0xd97706
): THREE.Mesh {
  const points: THREE.Vector3[] = [];
  const totalPts = Math.max(40, turns * 18);
  for (let i = 0; i <= totalPts; i++) {
    const t = i / totalPts;
    const angle = t * turns * Math.PI * 2;
    const x = -length / 2 + t * length;
    const y = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    points.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, totalPts, wireRadius, 10, false);
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.92,
    roughness: 0.22,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

export function createCurvedLensMesh(
  isConvex: boolean,
  radius = 0.85,
  isSoftwareGl = false
): THREE.Mesh {
  const pts: THREE.Vector2[] = [];
  const steps = 16;
  if (isConvex) {
    // Biconvex profile revolved around Y axis then rotated to stand along X
    for (let i = 0; i <= steps; i++) {
      const t = i / steps; // 0 (center) -> 1 (rim)
      const r = t * radius;
      const halfThick = 0.05 + 0.16 * (1 - t * t);
      pts.push(new THREE.Vector2(r, halfThick));
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const r = t * radius;
      const halfThick = -(0.05 + 0.16 * (1 - t * t));
      pts.push(new THREE.Vector2(r, halfThick));
    }
  } else {
    // Biconcave profile
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const r = t * radius;
      const halfThick = 0.05 + 0.16 * (t * t);
      pts.push(new THREE.Vector2(r, halfThick));
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const r = t * radius;
      const halfThick = -(0.05 + 0.16 * (t * t));
      pts.push(new THREE.Vector2(r, halfThick));
    }
  }
  const geo = new THREE.LatheGeometry(pts, 40);
  geo.rotateZ(Math.PI / 2);
  const mat = makeGlassMaterial(0x93c5fd, isSoftwareGl, 0.42, 1.54);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

export function createCylinderBetween(
  a: THREE.Vector3,
  b: THREE.Vector3,
  radius: number,
  material: THREE.Material
): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = Math.max(0.001, dir.length());
  const geo = new THREE.CylinderGeometry(radius, radius, len, 12);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

export function updateCylinderBetween(
  mesh: THREE.Mesh,
  a: THREE.Vector3,
  b: THREE.Vector3
): void {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = Math.max(0.001, dir.length());
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.scale.set(1, len, 1);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
}

export function createAnalogMeter(
  label: string,
  centerZero: boolean,
  maxValue: number,
  dialTex: THREE.CanvasTexture
): { group: THREE.Group; needlePivot: THREE.Group } {
  const group = new THREE.Group();

  // Sloped instrument housing
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.9, 0.65),
    makeMetalMaterial(0x263142, 0.34, 0.72)
  );
  body.position.y = 0.45;
  body.castShadow = true;
  group.add(body);

  // Brass bezel ring
  const bezel = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.035, 12, 32),
    makeMetalMaterial(0xd97706, 0.22, 0.9)
  );
  bezel.position.set(0, 0.5, 0.33);
  group.add(bezel);

  // Dial face
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(0.33, 32),
    new THREE.MeshBasicMaterial({ map: dialTex })
  );
  face.position.set(0, 0.5, 0.335);
  group.add(face);

  // Needle pivot
  const needlePivot = new THREE.Group();
  needlePivot.position.set(0, 0.44, 0.345);
  const needle = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.25, 0.01),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  needle.position.y = 0.11;
  needlePivot.add(needle);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16),
    makeMetalMaterial(0x0f172a, 0.3, 0.8)
  );
  cap.rotation.x = Math.PI / 2;
  needlePivot.add(cap);
  group.add(needlePivot);

  // Terminal posts
  const posPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.12, 12),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
  );
  posPost.position.set(0.28, 0.95, 0.1);
  group.add(posPost);

  const negPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.12, 12),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
  );
  negPost.position.set(-0.28, 0.95, 0.1);
  group.add(negPost);

  void label;
  void centerZero;
  void maxValue;
  return { group, needlePivot };
}

export function createBenchDisplayConsole(
  width: number,
  height: number,
  texture: THREE.Texture
): THREE.Group {
  const g = new THREE.Group();
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.16, height + 0.16, 0.22),
    makeMetalMaterial(0x1e293b, 0.32, 0.78)
  );
  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.06, height + 0.06, 0.04),
    makeMetalMaterial(0x475569, 0.25, 0.9)
  );
  bezel.position.z = 0.1;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture })
  );
  screen.position.z = 0.125;
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.13, 0.42, 16),
    makeMetalMaterial(0x64748b, 0.25, 0.85)
  );
  pedestal.position.set(0, -(height * 0.5 + 0.24), -0.02);
  const basePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 0.06, 20),
    makeMetalMaterial(0x1f2937, 0.35, 0.8)
  );
  basePlate.position.set(0, -(height * 0.5 + 0.46), -0.02);
  g.add(housing, bezel, screen, pedestal, basePlate);
  return g;
}
