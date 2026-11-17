export const PHYSICS_SCENES_JS = `
  // P01: Concave & Convex Mirrors
  if (id === 'P01') {
    const bench = buildOpticsBench();
    root.add(bench);
    const mirrorGroup = new THREE.Group(); mirrorGroup.position.set(2.4, 0, 0);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 1.0, 16), makeMetal(0x64748b));
    stand.position.y = 0.5; mirrorGroup.add(stand);
    const gimbal = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.045, 12, 32), makeMetal(0xd97706, 0.25, 0.9));
    gimbal.position.y = 1.45; gimbal.rotation.y = Math.PI / 2; mirrorGroup.add(gimbal);
    const concaveDish = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 32, 24, 0, Math.PI * 2, 0, 0.34),
      new THREE.MeshPhysicalMaterial({ color: 0xbae6fd, metalness: 0.92, roughness: 0.06, side: THREE.DoubleSide })
    );
    concaveDish.rotation.z = -Math.PI / 2; concaveDish.position.set(2.05, 1.45, 0);
    mirrorGroup.add(concaveDish);
    registerComponent(mirrorGroup, 'mirror', 'Spherical Mirror', new THREE.Vector3(0.6, 0, 0), new THREE.Vector3(0, 2.35, 0));
    root.add(mirrorGroup);

    const objectGroup = new THREE.Group();
    const objCarriage = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.52), makeMetal(0x334155));
    objCarriage.position.y = 0.3; objectGroup.add(objCarriage);
    const objStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 12), new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x78350f }));
    objStem.position.y = 1.41; objectGroup.add(objStem);
    const objHead = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 16), new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xb45309 }));
    objHead.position.y = 1.89; objectGroup.add(objHead);
    registerComponent(objectGroup, 'object', 'Object Source', new THREE.Vector3(0, 0.4, 0.5), new THREE.Vector3(0, 2.1, 0));
    root.add(objectGroup);

    const imageGroup = new THREE.Group();
    const imgScreen = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.35, 1.0), makeGlass(0x34d399, 0.3));
    imgScreen.position.y = 1.45; imageGroup.add(imgScreen);
    const imgArrow = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.65, 16), new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x065f46 }));
    imgArrow.position.y = 1.45; imageGroup.add(imgArrow);
    registerComponent(imageGroup, 'image', 'Formed Image', new THREE.Vector3(0, 0.35, -0.5), new THREE.Vector3(0, 2.25, 0));
    root.add(imageGroup);

    const unitCyl = new THREE.CylinderGeometry(0.018, 0.018, 1, 8);
    const rays = [
      new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0x37b6ff })),
      new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0x37b6ff })),
      new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0xf59e0b })),
      new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0xf59e0b })),
      new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.45 })),
      new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.45 })),
    ];
    rays.forEach((r) => root.add(r));
    const fMarker = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), new THREE.MeshStandardMaterial({ color: 0x37b6ff, emissive: 0x0284c7 }));
    const cMarker = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), new THREE.MeshStandardMaterial({ color: 0x7867ff, emissive: 0x4c1d95 }));
    root.add(fMarker, cMarker);

    const updateOptics = (params) => {
      const isConvex = (params.mirrorType || 0) >= 0.5;
      const uCm = params.objectDistance !== undefined ? params.objectDistance : 42;
      const fCm = params.focalLength !== undefined ? params.focalLength : 16;
      const scale = 0.075, mirrorX = 2.4, axisY = 1.45;
      const u = uCm * scale;
      const f = (isConvex ? fCm : -fCm) * scale;
      const objX = mirrorX - u;
      objectGroup.position.x = objX;
      concaveDish.rotation.z = isConvex ? Math.PI / 2 : -Math.PI / 2;
      concaveDish.position.x = isConvex ? -2.05 : 2.05;
      const fWorldX = mirrorX + f;
      const cWorldX = mirrorX + 2 * f;
      fMarker.position.set(THREE.MathUtils.clamp(fWorldX, -3.3, 3.6), axisY, 0);
      cMarker.position.set(THREE.MathUtils.clamp(cWorldX, -3.3, 3.6), axisY, 0);

      const uSigned = -u;
      const denom = 1 / f - 1 / uSigned;
      const vSigned = Math.abs(denom) < 0.005 ? -10 : 1 / denom;
      const mag = -vSigned / uSigned;
      const isVirtual = vSigned > 0;
      const imgX = THREE.MathUtils.clamp(mirrorX + vSigned, -3.4, 3.8);
      const imgH = THREE.MathUtils.clamp(0.45 * mag, -0.9, 0.9);
      imageGroup.position.x = imgX;
      imgScreen.visible = !isVirtual;
      imgArrow.scale.set(1, Math.max(0.25, Math.abs(imgH) / 0.5), 1);
      imgArrow.rotation.z = imgH < 0 ? Math.PI : 0;
      imgArrow.position.y = axisY + imgH * 0.5;

      const objTop = new THREE.Vector3(objX, axisY + 0.45, 0);
      const hitTop = new THREE.Vector3(mirrorX, axisY + 0.45, 0);
      const pole = new THREE.Vector3(mirrorX, axisY, 0);
      const imgTip = new THREE.Vector3(imgX, axisY + imgH, 0);
      updateCylBetween(rays[0], objTop, hitTop);
      updateCylBetween(rays[2], objTop, pole);
      if (!isVirtual) {
        updateCylBetween(rays[1], hitTop, imgTip);
        updateCylBetween(rays[3], pole, imgTip);
        rays[4].visible = false; rays[5].visible = false;
      } else {
        const fPt = new THREE.Vector3(fWorldX, axisY, 0);
        const dir1 = isConvex ? hitTop.clone().sub(fPt).normalize() : fPt.clone().sub(hitTop).normalize();
        updateCylBetween(rays[1], hitTop, hitTop.clone().addScaledVector(dir1, 2.8));
        updateCylBetween(rays[3], pole, new THREE.Vector3(objX, axisY - 0.45, 0));
        rays[4].visible = true; rays[5].visible = true;
        updateCylBetween(rays[4], hitTop, imgTip);
        updateCylBetween(rays[5], pole, imgTip);
      }
    };

    return {
      root, camPos: [0, 3.2, 6.2], target: [0.3, 1.35, 0],
      update: (_dt, _el, p) => updateOptics(p),
      readouts: (p) => {
        const isConvex = (p.mirrorType || 0) >= 0.5;
        const u = -(p.objectDistance !== undefined ? p.objectDistance : 42);
        const f = isConvex ? (p.focalLength || 16) : -(p.focalLength || 16);
        const v = 1 / (1 / f - 1 / u);
        return [
          { label: 'Image (v)', value: Number.isFinite(v) ? v.toFixed(1) : '∞', unit: 'cm' },
          { label: 'Mag (m)', value: Number.isFinite(v) ? (-v / u).toFixed(2) : '∞', unit: 'x' },
          { label: 'Nature', value: v < 0 ? 'Real, Inverted' : 'Virtual, Erect' },
        ];
      },
    };
  }

  // P02: Convex & Concave Lenses
  if (id === 'P02') {
    const bench = buildOpticsBench();
    root.add(bench);
    const lensGroup = new THREE.Group();
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 1.0, 16), makeMetal(0x64748b));
    stand.position.y = 0.5; lensGroup.add(stand);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.04, 12, 36), makeMetal(0xd97706, 0.25, 0.9));
    ring.position.y = 1.45; ring.rotation.y = Math.PI / 2; lensGroup.add(ring);
    const convexLens = createLens(true, 0.85); convexLens.position.y = 1.45;
    const concaveLens = createLens(false, 0.85); concaveLens.position.y = 1.45; concaveLens.visible = false;
    lensGroup.add(convexLens, concaveLens);
    registerComponent(lensGroup, 'lens', 'Glass Lens', new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, 2.45, 0));
    root.add(lensGroup);

    const objectGroup = new THREE.Group();
    const objBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.5), makeMetal(0x334155)); objBase.position.y = 0.3;
    const objArrow = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.55, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x92400e }));
    objArrow.position.y = 1.72; objectGroup.add(objBase, objArrow);
    registerComponent(objectGroup, 'object', 'Object Target', new THREE.Vector3(-0.4, 0, 0.4), new THREE.Vector3(0, 2.1, 0));
    root.add(objectGroup);

    const screenGroup = new THREE.Group();
    const screenPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 1.1), makeGlass(0x34d399, 0.28)); screenPanel.position.y = 1.45;
    const imgArrow = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 16), new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x065f46 }));
    screenGroup.add(screenPanel, imgArrow);
    registerComponent(screenGroup, 'screen', 'Image Screen', new THREE.Vector3(0.4, 0, -0.4), new THREE.Vector3(0, 2.35, 0));
    root.add(screenGroup);

    const unitCyl = new THREE.CylinderGeometry(0.018, 0.018, 1, 8);
    const ray1 = new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0x37b6ff }));
    const ray2 = new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0x37b6ff }));
    const ray3 = new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    const ray4 = new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    const vRay1 = new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.45 }));
    const vRay2 = new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.45 }));
    const f1Dot = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), new THREE.MeshBasicMaterial({ color: 0x7867ff }));
    const f2Dot = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), new THREE.MeshBasicMaterial({ color: 0x7867ff }));
    root.add(ray1, ray2, ray3, ray4, vRay1, vRay2, f1Dot, f2Dot);

    const updateLens = (params) => {
      const isConcave = (params.lensType || 0) >= 0.5;
      convexLens.visible = !isConcave; concaveLens.visible = isConcave;
      const uCm = params.objectDistance !== undefined ? params.objectDistance : 38;
      const fCm = params.focalLength !== undefined ? params.focalLength : 15;
      const scale = 0.058, u = -uCm * scale, f = (isConcave ? -fCm : fCm) * scale;
      const denom = 1 / f + 1 / u;
      const v = Math.abs(denom) < 0.01 ? 8 : 1 / denom;
      const mag = v / u, isVirtual = v < 0;
      f1Dot.position.set(-Math.abs(f), 1.45, 0); f2Dot.position.set(Math.abs(f), 1.45, 0);
      objectGroup.position.x = THREE.MathUtils.clamp(u, -3.4, -0.45);
      const imgX = THREE.MathUtils.clamp(v, -3.4, 3.4);
      screenGroup.position.x = imgX; screenPanel.visible = !isVirtual;
      const imgH = THREE.MathUtils.clamp(0.48 * mag, -0.8, 0.8);
      imgArrow.scale.set(1, Math.max(0.25, Math.abs(imgH) / 0.5), 1);
      imgArrow.rotation.z = imgH < 0 ? Math.PI : 0; imgArrow.position.y = 1.45 + imgH * 0.5;
      const pTop = new THREE.Vector3(objectGroup.position.x, 1.93, 0);
      const pHit = new THREE.Vector3(0, 1.93, 0);
      const center = new THREE.Vector3(0, 1.45, 0);
      const imgTip = new THREE.Vector3(imgX, 1.45 + imgH, 0);
      updateCylBetween(ray1, pTop, pHit); updateCylBetween(ray3, pTop, center);
      if (!isVirtual) {
        updateCylBetween(ray2, pHit, imgTip); updateCylBetween(ray4, center, imgTip);
        vRay1.visible = false; vRay2.visible = false;
      } else {
        updateCylBetween(ray2, pHit, pHit.clone().add(pHit.clone().sub(imgTip).normalize().multiplyScalar(2.6)));
        updateCylBetween(ray4, center, center.clone().add(center.clone().sub(pTop).normalize().multiplyScalar(2.6)));
        vRay1.visible = true; vRay2.visible = true;
        updateCylBetween(vRay1, pHit, imgTip); updateCylBetween(vRay2, center, imgTip);
      }
    };
    return {
      root, camPos: [0, 3.0, 6.2], target: [0, 1.35, 0],
      update: (_dt, _el, p) => updateLens(p),
      readouts: (p) => {
        const isConcave = (p.lensType || 0) >= 0.5;
        const u = -(p.objectDistance || 38), f = isConcave ? -(p.focalLength || 15) : (p.focalLength || 15);
        const v = 1 / (1 / f + 1 / u), power = 100 / f;
        return [
          { label: 'Power (P)', value: (power >= 0 ? '+' : '') + power.toFixed(2), unit: 'D' },
          { label: 'Image (v)', value: Number.isFinite(v) ? v.toFixed(1) : '∞', unit: 'cm' },
          { label: 'Type', value: v > 0 ? 'Real, Inverted' : 'Virtual, Erect' },
        ];
      },
    };
  }

  // P03: Refraction Through Glass Slab
  if (id === 'P03') {
    const slabMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 2.0), makeGlass(0x7dd3fc, 0.42));
    slabMesh.position.y = 0.6;
    registerComponent(slabMesh, 'slab', 'Glass Slab', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.3, 0));
    const normalLine = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 3.8, 8), new THREE.MeshBasicMaterial({ color: 0x94a3b8 }));
    normalLine.rotation.x = Math.PI / 2; normalLine.position.set(0, 0.6, 0);
    registerComponent(normalLine, 'protractor', 'Normal Axis', new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0, 0.85, 1.8));
    const normalExit = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 2.2, 8), new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.65 }));
    normalExit.rotation.x = Math.PI / 2;

    const laserGroup = new THREE.Group();
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.75, 20), makeMetal(0x334155, 0.25, 0.85)); barrel.rotation.x = Math.PI / 2;
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626 })); tip.rotation.x = Math.PI / 2; tip.position.z = 0.4;
    laserGroup.add(barrel, tip);
    registerComponent(laserGroup, 'laser', 'Laser Emitter', new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0, 0.9, 0));

    const unitCyl = new THREE.CylinderGeometry(0.025, 0.025, 1, 10);
    const bMat = new THREE.MeshBasicMaterial({ color: 0xff3b3b });
    const rayIn = new THREE.Mesh(unitCyl, bMat), rayMid = new THREE.Mesh(unitCyl, bMat), rayOut = new THREE.Mesh(unitCyl, bMat);
    const rayGhost = new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.38 }));
    const shiftBar = new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0x059669 }));
    root.add(slabMesh, normalLine, normalExit, laserGroup, rayIn, rayMid, rayOut, rayGhost, shiftBar);

    const updateSlab = (p) => {
      const iDeg = p.incidentAngle !== undefined ? p.incidentAngle : 45;
      const n = p.refractiveIndex || 1.52, thick = p.slabThickness || 2.0;
      slabMesh.scale.z = thick / 2.0;
      const iRad = THREE.MathUtils.degToRad(iDeg), rRad = Math.asin(Math.min(0.99, Math.sin(iRad) / n));
      const halfZ = thick * 0.5, entry = new THREE.Vector3(0, 0.6, halfZ);
      const src = new THREE.Vector3(-Math.sin(iRad) * 2.5, 0.6, halfZ + Math.cos(iRad) * 2.5);
      const exitX = Math.tan(rRad) * thick, exit = new THREE.Vector3(exitX, 0.6, -halfZ);
      const emergent = new THREE.Vector3(exitX + Math.sin(iRad) * 2.3, 0.6, -halfZ - Math.cos(iRad) * 2.3);
      const straight = new THREE.Vector3(Math.sin(iRad) * 2.8, 0.6, halfZ - Math.cos(iRad) * 2.8);
      normalExit.position.set(exitX, 0.6, -halfZ);
      const d = thick * Math.sin(iRad - rRad) / Math.cos(rRad);
      const perpFoot = new THREE.Vector3(exit.x + Math.cos(iRad) * d, 0.6, exit.z + Math.sin(iRad) * d);
      laserGroup.position.copy(src); laserGroup.lookAt(entry);
      updateCylBetween(rayIn, src, entry); updateCylBetween(rayMid, entry, exit);
      updateCylBetween(rayOut, exit, emergent); updateCylBetween(rayGhost, entry, straight); updateCylBetween(shiftBar, exit, perpFoot);
    };
    return {
      root, camPos: [2.2, 4.4, 4.4], target: [0.3, 0.6, 0],
      update: (_dt, _el, p) => updateSlab(p),
      readouts: (p) => {
        const i = p.incidentAngle !== undefined ? p.incidentAngle : 45, n = p.refractiveIndex || 1.52, t = p.slabThickness || 2.0;
        const rRad = Math.asin(Math.min(0.99, Math.sin(THREE.MathUtils.degToRad(i)) / n));
        const shift = (t * Math.sin(THREE.MathUtils.degToRad(i) - rRad)) / Math.cos(rRad);
        return [
          { label: 'Refraction (r)', value: THREE.MathUtils.radToDeg(rRad).toFixed(1), unit: '°' },
          { label: 'Lateral Shift (d)', value: shift.toFixed(2), unit: 'cm' },
        ];
      },
    };
  }

  // P04: Dispersion Through Prism (Exact Snell + Cauchy Physics)
  if (id === 'P04') {
    const prismGroup = new THREE.Group();
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.25, 32), makeMetal(0xd97706, 0.25, 0.9)); ped.position.y = 0.125;
    const triShape = new THREE.Shape();
    for (let k = 0; k < 3; k++) { const a = (k * 2 * Math.PI) / 3 + Math.PI / 2; if (k === 0) triShape.moveTo(Math.cos(a) * 1.05, Math.sin(a) * 1.05); else triShape.lineTo(Math.cos(a) * 1.05, Math.sin(a) * 1.05); }
    triShape.closePath();
    const prismGeo = new THREE.ExtrudeGeometry(triShape, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03 });
    prismGeo.rotateX(Math.PI / 2); prismGeo.translate(0, 1.8, 0);
    prismGroup.add(ped, new THREE.Mesh(prismGeo, makeGlass(0xe0f2fe, 0.44)));
    registerComponent(prismGroup, 'prism', 'Flint Glass Prism', new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(0, 2.0, 0));

    const sourceGroup = new THREE.Group();
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.9, 20), makeMetal(0x1e293b, 0.35, 0.7)); lamp.rotation.z = Math.PI / 2;
    sourceGroup.add(lamp); sourceGroup.position.set(-3.0, 1.15, 0);
    registerComponent(sourceGroup, 'source', 'White Light Source', new THREE.Vector3(-0.6, 0, 0), new THREE.Vector3(0, 0.45, 0));

    const screenPlate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 1.8), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 }));
    screenPlate.position.set(3.2, 1.15, 0);
    registerComponent(screenPlate, 'screen', 'Spectrum Screen', new THREE.Vector3(0.6, 0, 0), new THREE.Vector3(0, 1.25, 0));

    const whiteBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 10), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    const vibgyor = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x3b82f6, 0x6366f1, 0xa855f7];
    const lambdas = [0.68, 0.61, 0.58, 0.53, 0.47, 0.44, 0.40];
    const unitCyl = new THREE.CylinderGeometry(0.018, 0.018, 1, 8);
    const specIn = vibgyor.map((c) => new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: c })));
    const specOut = vibgyor.map((c) => new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: c })));
    root.add(prismGroup, sourceGroup, screenPlate, whiteBeam, ...specIn, ...specOut);

    const computeRay = (incDeg, disp, lam) => {
      const A = Math.PI / 3, n = 1.585 + (0.012 * disp) / (lam * lam), iRad = THREE.MathUtils.degToRad(incDeg);
      const r1 = Math.asin(THREE.MathUtils.clamp(Math.sin(iRad) / n, -0.99, 0.99));
      const e = Math.asin(THREE.MathUtils.clamp(n * Math.sin(A - r1), -0.999, 0.999));
      return { r1, deltaDeg: THREE.MathUtils.radToDeg(iRad + e - A) };
    };
    const updatePrism = (p) => {
      const incDeg = p.incidentAngle !== undefined ? p.incidentAngle : 44, disp = p.dispersion || 1.2, rotDeg = p.prismRotation || 0;
      prismGroup.rotation.y = THREE.MathUtils.degToRad(rotDeg);
      const effInc = THREE.MathUtils.clamp(incDeg + rotDeg * 0.4, 24, 78);
      const entry = new THREE.Vector3(-0.46, 1.15, 0), incWorld = THREE.MathUtils.degToRad(effInc - 30);
      const srcPos = new THREE.Vector3(entry.x - Math.cos(incWorld) * 2.5, entry.y - Math.sin(incWorld) * 2.5, 0);
      sourceGroup.position.copy(srcPos); sourceGroup.lookAt(entry); updateCylBetween(whiteBeam, srcPos, entry);
      for (let i = 0; i < 7; i++) {
        const res = computeRay(effInc, disp, lambdas[i]);
        const exitPt = new THREE.Vector3(entry.x + 0.92, entry.y - Math.tan(res.r1 - Math.PI / 6) * 0.92, 0);
        const outWorld = incWorld - THREE.MathUtils.degToRad(res.deltaDeg);
        const endPt = new THREE.Vector3(3.14, THREE.MathUtils.clamp(exitPt.y + Math.tan(outWorld) * (3.14 - exitPt.x), 0.1, 2.25), 0);
        updateCylBetween(specIn[i], entry, exitPt); updateCylBetween(specOut[i], exitPt, endPt);
      }
    };
    return {
      root, camPos: [0.2, 2.7, 5.8], target: [0, 1.1, 0],
      update: (_dt, _el, p) => updatePrism(p),
      readouts: (p) => {
        const effInc = THREE.MathUtils.clamp((p.incidentAngle || 44) + (p.prismRotation || 0) * 0.4, 24, 78), disp = p.dispersion || 1.2;
        const dR = computeRay(effInc, disp, lambdas[0]).deltaDeg, dV = computeRay(effInc, disp, lambdas[6]).deltaDeg;
        return [
          { label: 'Red (δR)', value: dR.toFixed(2), unit: '°' },
          { label: 'Violet (δV)', value: dV.toFixed(2), unit: '°' },
          { label: 'Spread', value: Math.abs(dV - dR).toFixed(2), unit: '°' },
        ];
      },
    };
  }

  // P05: Human Eye & Vision Defects (Dynamic Concave/Convex Corrective Lenses)
  if (id === 'P05') {
    const eye = buildEyeGroup(true);
    eye.group.position.set(0, 1.6, 0);
    root.add(eye.group);
    const specConcave = createLens(false, 0.56); specConcave.position.set(-1.98, 1.6, 0);
    const specConvex = createLens(true, 0.56); specConvex.position.set(-1.98, 1.6, 0);
    root.add(specConcave, specConvex);
    const unitCyl = new THREE.CylinderGeometry(0.018, 0.018, 1, 8);
    const rayMat = new THREE.MeshBasicMaterial({ color: 0x059669 });
    const rays = Array.from({ length: 6 }, () => { const r = new THREE.Mesh(unitCyl, rayMat); root.add(r); return r; });
    const focusDot = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 14), new THREE.MeshBasicMaterial({ color: 0x7c3aed }));
    root.add(focusDot);
    return {
      root, camPos: [-0.6, 2.5, 5.1], target: [-0.15, 1.6, 0],
      update: (_dt, _el, p) => {
        const mode = Math.round(p.defectMode !== undefined ? p.defectMode : 1);
        const corr = (p.correctiveLens || 0) >= 0.5;
        eye.pupilDisc.scale.setScalar(0.75 + (p.pupilSize || 0.55) * 0.55);
        specConcave.visible = corr && mode === 1;
        specConvex.visible = corr && mode === 2;
        const fx = (!corr && mode === 1) ? 0.62 : (!corr && mode === 2) ? 2.02 : 1.28;
        focusDot.position.set(fx, 1.6, 0);
        const lHit = (corr && mode === 1) ? 2.06 : (corr && mode === 2) ? 1.82 : 1.92;
        updateCylBetween(rays[0], new THREE.Vector3(-3.3, 1.95, 0), new THREE.Vector3(-1.98, 1.95, 0));
        updateCylBetween(rays[1], new THREE.Vector3(-3.3, 1.25, 0), new THREE.Vector3(-1.98, 1.25, 0));
        updateCylBetween(rays[2], new THREE.Vector3(-1.98, 1.95, 0), new THREE.Vector3(-0.62, lHit, 0));
        updateCylBetween(rays[3], new THREE.Vector3(-1.98, 1.25, 0), new THREE.Vector3(-0.62, 3.2 - lHit, 0));
        updateCylBetween(rays[4], new THREE.Vector3(-0.62, lHit, 0), focusDot.position);
        updateCylBetween(rays[5], new THREE.Vector3(-0.62, 3.2 - lHit, 0), focusDot.position);
      },
      readouts: (p) => {
        const mode = Math.round(p.defectMode !== undefined ? p.defectMode : 1), corr = (p.correctiveLens || 0) >= 0.5;
        return [
          { label: 'Condition', value: ['Emmetropia', 'Myopia (-2 D)', 'Hypermetropia (+2 D)'][mode] },
          { label: 'Lens', value: (!corr || mode === 0) ? 'None' : mode === 1 ? 'Concave' : 'Convex' },
          { label: 'Focus', value: (corr || mode === 0) ? 'On Retina' : mode === 1 ? 'Front of Retina' : 'Behind Retina' },
        ];
      },
    };
  }

  // P06: Ohm's Law
  if (id === 'P06') {
    const bat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.75), makeMetal(0x1e293b, 0.4, 0.6)); bat.position.set(-2.1, 0.45, 1.0);
    registerComponent(bat, 'battery', 'DC Supply', new THREE.Vector3(-0.3, 0, 0), new THREE.Vector3(0, 0.85, 0));
    const res = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.4, 24), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.45 })); res.rotation.z = Math.PI / 2; res.position.set(0.2, 0.45, -1.2);
    registerComponent(res, 'resistor', 'Resistor (R)', new THREE.Vector3(0, 0.3, -0.3), new THREE.Vector3(0, 0.5, 0));
    const ammeter = createMeter('A', false, 6, maxAniso); ammeter.group.position.set(2.1, 0, 0.2);
    registerComponent(ammeter.group, 'ammeter', 'Ammeter (I)', new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(0, 1.2, 0));
    const voltmeter = createMeter('V', false, 12, maxAniso); voltmeter.group.position.set(0.2, 0, 1.2);
    registerComponent(voltmeter.group, 'voltmeter', 'Voltmeter (V)', new THREE.Vector3(0, 0, 0.3), new THREE.Vector3(0, 1.2, 0));

    const wireCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.1, 0.3, 1.0), new THREE.Vector3(-2.1, 0.3, -1.2), new THREE.Vector3(2.1, 0.3, -1.2), new THREE.Vector3(2.1, 0.3, 1.0)], true);
    const wire = new THREE.Mesh(new THREE.TubeGeometry(wireCurve, 56, 0.045, 10, true), makeMetal(0xd97706, 0.25, 0.88));
    const swBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.35), makeMetal(0x334155)); swBase.position.set(-1.1, 0.25, 1.0);
    const swPivot = new THREE.Group(); swPivot.position.set(-1.32, 0.34, 1.0);
    const swBlade = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.04, 0.08), makeMetal(0xf59e0b, 0.2, 0.92)); swBlade.position.x = 0.22; swPivot.add(swBlade);
    root.add(bat, res, ammeter.group, voltmeter.group, wire, swBase, swPivot);
    const electrons = Array.from({ length: 14 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 10), new THREE.MeshBasicMaterial({ color: 0x37b6ff })); root.add(m); return m; });
    let phase = 0; const _v1 = new THREE.Vector3();
    return {
      root, camPos: [0, 3.8, 5.2], target: [0, 0.5, 0],
      update: (dt, _el, p, playing) => {
        const closed = (p.switchClosed !== undefined ? p.switchClosed : 1) >= 0.5;
        const v = p.voltage || 6, r = p.resistance || 6, i = closed ? v / r : 0;
        swPivot.rotation.z = THREE.MathUtils.damp(swPivot.rotation.z, closed ? 0 : 0.72, 10, dt);
        ammeter.needlePivot.rotation.z = THREE.MathUtils.damp(ammeter.needlePivot.rotation.z, -THREE.MathUtils.clamp((i / 6) * 1.9 - 0.95, -0.95, 0.95), 8, dt);
        voltmeter.needlePivot.rotation.z = THREE.MathUtils.damp(voltmeter.needlePivot.rotation.z, -THREE.MathUtils.clamp(((closed ? v : 0) / 12) * 1.9 - 0.95, -0.95, 0.95), 8, dt);
        if (playing && closed) phase = (phase + dt * Math.min(2.2, i * 0.22)) % 1;
        electrons.forEach((e, idx) => { e.visible = closed; wireCurve.getPointAt((phase + idx / electrons.length) % 1, _v1); e.position.copy(_v1); });
      },
      readouts: (p) => {
        const closed = (p.switchClosed !== undefined ? p.switchClosed : 1) >= 0.5, v = p.voltage || 6, r = p.resistance || 6, i = closed ? v / r : 0;
        return [{ label: 'Current (I)', value: i.toFixed(2), unit: 'A' }, { label: 'Power (VI)', value: (closed ? v * i : 0).toFixed(2), unit: 'W' }];
      },
    };
  }

  // P07: Series and Parallel Circuits
  if (id === 'P07') {
    const source = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 0.7), makeMetal(0x1e293b, 0.4, 0.6)); source.position.set(-2.3, 0.425, 0);
    registerComponent(source, 'source', '12V Supply', new THREE.Vector3(-0.3, 0, 0), new THREE.Vector3(0, 1.1, 0));
    const makeBulb = (x, z, col) => {
      const g = new THREE.Group(); g.position.set(x, 0, z);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.28, 20), makeMetal(0xd97706, 0.2, 0.9)); base.position.y = 0.14;
      const mat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: col, emissiveIntensity: 0.6, roughness: 0.15, transparent: true, opacity: 0.9 });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 20), mat); globe.position.y = 0.55;
      g.add(base, globe); return { g, mat };
    };
    const b1 = makeBulb(0.8, -0.9, 0xf59e0b), b2 = makeBulb(0.8, 0.9, 0x37b6ff);
    registerComponent(b1.g, 'load1', 'Lamp R1', new THREE.Vector3(0, 0.3, -0.3), new THREE.Vector3(0, 1.15, 0));
    registerComponent(b2.g, 'load2', 'Lamp R2', new THREE.Vector3(0, 0.3, 0.3), new THREE.Vector3(0, 1.15, 0));
    const loop1 = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.3, 0.15, -0.9), new THREE.Vector3(0.8, 0.15, -0.9), new THREE.Vector3(0.8, 0.15, 0.9), new THREE.Vector3(-2.3, 0.15, 0.9)], true);
    const br1 = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.3, 0.15, 0), new THREE.Vector3(-2.3, 0.15, -0.9), new THREE.Vector3(0.8, 0.15, -0.9), new THREE.Vector3(0.8, 0.15, 0)], true);
    const br2 = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.3, 0.15, 0), new THREE.Vector3(-2.3, 0.15, 0.9), new THREE.Vector3(0.8, 0.15, 0.9), new THREE.Vector3(0.8, 0.15, 0)], true);
    const wMat = makeMetal(0x94a3b8, 0.3, 0.85);
    const sLoop = new THREE.Mesh(new THREE.TubeGeometry(loop1, 56, 0.04, 8, true), wMat);
    const pRail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-2.3, 0.15, 0), new THREE.Vector3(0.8, 0.15, 0)]), 16, 0.04, 8, false), wMat);
    const d1 = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf59e0b })); root.add(m); return m; });
    const d2 = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0x37b6ff })); root.add(m); return m; });
    root.add(source, b1.g, b2.g, sLoop, pRail);
    let p1 = 0, p2 = 0; const _v1 = new THREE.Vector3();
    return {
      root, camPos: [0, 3.8, 4.8], target: [-0.3, 0.4, 0],
      update: (dt, _el, p, playing) => {
        const isPar = (p.topology !== undefined ? p.topology : 1) >= 0.5, r1 = p.r1 || 4, r2 = p.r2 || 6;
        pRail.visible = isPar;
        const i1 = isPar ? 12 / r1 : 12 / (r1 + r2), i2 = isPar ? 12 / r2 : 12 / (r1 + r2);
        b1.mat.emissiveIntensity = THREE.MathUtils.clamp(i1 * 0.45, 0.15, 2.2);
        b2.mat.emissiveIntensity = THREE.MathUtils.clamp(i2 * 0.45, 0.15, 2.2);
        if (playing) { p1 = (p1 + dt * Math.min(1.6, i1 * 0.18)) % 1; p2 = (p2 + dt * Math.min(1.6, i2 * 0.18)) % 1; }
        d1.forEach((m, idx) => { (isPar ? br1 : loop1).getPointAt((p1 + idx / d1.length) % 1, _v1); m.position.copy(_v1); });
        d2.forEach((m, idx) => { m.visible = isPar; if (!isPar) return; br2.getPointAt((p2 + idx / d2.length) % 1, _v1); m.position.copy(_v1); });
      },
      readouts: (p) => {
        const isPar = (p.topology !== undefined ? p.topology : 1) >= 0.5, r1 = p.r1 || 4, r2 = p.r2 || 6;
        const req = isPar ? (r1 * r2) / (r1 + r2) : r1 + r2;
        return [{ label: 'Req', value: req.toFixed(2), unit: 'Ω' }, { label: 'Current', value: (12 / req).toFixed(2), unit: 'A' }];
      },
    };
  }

  // P08: Magnetic Field Around Bar Magnet
  if (id === 'P08') {
    const magnetGroup = new THREE.Group();
    const north = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 0.55), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 })); north.position.set(-0.65, 0.65, 0);
    const south = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 0.55), new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35 })); south.position.set(0.65, 0.65, 0);
    magnetGroup.add(north, south);
    registerComponent(magnetGroup, 'magnet', 'Bar Magnet (N-S)', new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0, 1.15, 0));

    const fieldGroup = new THREE.Group(); const loopCurves = []; const fluxDots = [];
    for (let ring = 0; ring < 4; ring++) {
      const phi = (ring * Math.PI) / 2;
      [1.1, 1.65].forEach((scale) => {
        const pts = [];
        for (let s = 0; s <= 28; s++) {
          const t = (s / 28) * Math.PI * 2;
          const r = Math.sin(t) * 0.95 * scale;
          pts.push(new THREE.Vector3(-Math.cos(t) * 1.45 * scale * 0.8, Math.max(0.08, 0.65 + Math.cos(phi) * r), Math.sin(phi) * r));
        }
        const curve = new THREE.CatmullRomCurve3(pts, true); loopCurves.push(curve);
        fieldGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.018, 6, true), new THREE.MeshBasicMaterial({ color: 0x37b6ff, transparent: true, opacity: 0.65 })));
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        fieldGroup.add(dot); fluxDots.push(dot);
      });
    }
    registerComponent(fieldGroup, 'fieldLines', 'Magnetic Flux Loops', new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, 2.1, 0));

    const compass = new THREE.Group();
    const cCase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.14, 24), makeMetal(0xd97706, 0.25, 0.9)); cCase.position.y = 0.07;
    const needle = new THREE.Group(); needle.position.y = 0.16;
    const nTip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 })); nTip.rotation.x = Math.PI / 2; nTip.position.z = 0.1;
    const sTip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 8), new THREE.MeshBasicMaterial({ color: 0xf8fafc })); sTip.rotation.x = -Math.PI / 2; sTip.position.z = -0.1;
    needle.add(nTip, sTip); compass.add(cCase, needle);
    registerComponent(compass, 'compass', 'Plotting Compass', new THREE.Vector3(0, 0, 0.4), new THREE.Vector3(0, 0.5, 0));
    root.add(magnetGroup, fieldGroup, compass);
    let fluxPhase = 0; const _v1 = new THREE.Vector3();
    return {
      root, camPos: [0, 3.4, 5.4], target: [0, 0.8, 0],
      update: (dt, _el, p, playing) => {
        const ang = THREE.MathUtils.degToRad(p.compassAngle !== undefined ? p.compassAngle : 45);
        const rx = Math.cos(ang) * 2.2, rz = Math.sin(ang) * 2.2;
        compass.position.set(rx, 0, rz);
        const r = Math.hypot(rx, rz), hx = rx / r, hz = rz / r, mDotH = -hx;
        needle.rotation.y = Math.atan2(3 * mDotH * hx + 1, 3 * mDotH * hz);
        if (playing) fluxPhase = (fluxPhase + dt * 0.28 * (p.strength || 1.2)) % 1;
        loopCurves.forEach((c, idx) => { c.getPointAt((fluxPhase + idx * 0.13) % 1, _v1); fluxDots[idx].position.copy(_v1); });
      },
      readouts: (p) => [{ label: 'Field B', value: (p.strength || 1.2).toFixed(1), unit: 'T' }, { label: 'Azimuth', value: String(p.compassAngle || 45), unit: '°' }],
    };
  }

  // P09: Electric Motor & Generator
  if (id === 'P09') {
    const stator = new THREE.Group();
    const nPole = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.3, 1.5), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })); nPole.position.set(-1.55, 1.2, 0);
    const sPole = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.3, 1.5), new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 })); sPole.position.set(1.55, 1.2, 0);
    stator.add(nPole, sPole);
    registerComponent(stator, 'stator', 'Stator Poles', new THREE.Vector3(0, 0, -0.5), new THREE.Vector3(-1.6, 2.0, 0));

    const rotor = new THREE.Group(); rotor.position.set(0, 1.2, 0);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 16), makeMetal(0x94a3b8)); shaft.rotation.x = Math.PI / 2;
    const arm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.75, 0, -0.7), new THREE.Vector3(0.75, 0, -0.7), new THREE.Vector3(0.75, 0, 0.7), new THREE.Vector3(-0.75, 0, 0.7)], true), 36, 0.055, 10, true), makeMetal(0xd97706, 0.2, 0.92));
    rotor.add(shaft, arm);
    registerComponent(rotor, 'armature', 'Armature Coil', new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0, 0.65, 0));

    const comm = new THREE.Group(); comm.position.set(0, 1.2, 1.1);
    const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.35, 18, 1, false, 0.15, Math.PI - 0.3), makeMetal(0xf59e0b)); h1.rotation.x = Math.PI / 2;
    const h2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.35, 18, 1, false, Math.PI + 0.15, Math.PI - 0.3), makeMetal(0xf59e0b)); h2.rotation.x = Math.PI / 2;
    const bL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.25), makeMetal(0x334155, 0.8, 0.2)); bL.position.x = -0.32;
    const bR = bL.clone(); bR.position.x = 0.32;
    comm.add(h1, h2, bL, bR);
    registerComponent(comm, 'commutator', 'Split-Ring Commutator', new THREE.Vector3(0, 0, 0.65), new THREE.Vector3(0, 0.45, 0));
    root.add(stator, rotor, comm);
    return {
      root, camPos: [2.2, 2.6, 4.8], target: [0, 1.1, 0.2],
      update: (dt, _el, p, playing) => {
        if (playing) {
          rotor.rotation.z += dt * (p.driveLevel || 1.2) * (p.fieldStrength || 1.0) * 2.2;
          h1.rotation.y = rotor.rotation.z; h2.rotation.y = rotor.rotation.z;
        }
      },
      readouts: (p) => [
        { label: 'Mode', value: (p.mode || 0) >= 0.5 ? 'Generator' : 'DC Motor' },
        { label: 'Speed', value: String(Math.round((p.driveLevel || 1.2) * (p.fieldStrength || 1.0) * 180)), unit: 'RPM' },
      ],
    };
  }

  // P10: Electromagnetic Induction
  if (id === 'P10') {
    const coilGroup = new THREE.Group(); coilGroup.position.set(-0.7, 1.0, 0);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.0, 24, 1, true), makeGlass(0xdbeafe, 0.35)); tube.rotation.z = Math.PI / 2;
    let coilMesh = createHelicalCoil(0.5, 1.9, 8, 0.04, 0xd97706);
    coilGroup.add(tube, coilMesh);
    registerComponent(coilGroup, 'coil', 'Copper Solenoid', new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0, 0.7, 0));

    const magnetGroup = new THREE.Group(); magnetGroup.position.set(1.4, 1.0, 0);
    const magN = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.7, 20), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 })); magN.rotation.z = Math.PI / 2; magN.position.x = 0.35;
    const magS = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.7, 20), new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35 })); magS.rotation.z = Math.PI / 2; magS.position.x = -0.35;
    magnetGroup.add(magN, magS);
    registerComponent(magnetGroup, 'magnet', 'Moving Bar Magnet', new THREE.Vector3(0.4, 0, 0), new THREE.Vector3(0, 0.45, 0));

    const galv = createMeter('G', true, 10, maxAniso); galv.group.position.set(-0.7, 0, 1.6);
    registerComponent(galv.group, 'galvanometer', 'Galvanometer', new THREE.Vector3(0, 0, 0.4), new THREE.Vector3(0, 1.15, 0));
    const indDots = Array.from({ length: 6 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0x059669 })); coilGroup.add(m); return m; });
    root.add(coilGroup, magnetGroup, galv.group);
    let prevX = 1.4, lastTurns = 8, indVal = 0, indPhase = 0;
    return {
      root, camPos: [0.5, 2.8, 5.2], target: [0, 0.9, 0.3],
      update: (dt, elapsed, p, playing) => {
        const turns = Math.round(p.coilTurns || 8);
        if (turns !== lastTurns) { lastTurns = turns; coilGroup.remove(coilMesh); coilMesh.geometry.dispose(); coilMesh = createHelicalCoil(0.5, 1.9, turns, 0.04, 0xd97706); coilGroup.add(coilMesh); }
        const auto = (p.autoOscillate !== undefined ? p.autoOscillate : 1) >= 0.5;
        const targetX = auto && playing ? 0.5 + Math.sin(elapsed * 2.2) * 1.4 : 0.8 + (p.magnetOffset || 0) * 0.5;
        magnetGroup.position.x = THREE.MathUtils.damp(magnetGroup.position.x, targetX, 10, dt);
        const vel = (magnetGroup.position.x - prevX) / Math.max(0.008, dt); prevX = magnetGroup.position.x;
        indVal = THREE.MathUtils.clamp(-vel * Math.exp(-Math.pow(magnetGroup.position.x + 0.2, 2) * 0.9) * (lastTurns / 8) * 0.35, -1, 1);
        galv.needlePivot.rotation.z = THREE.MathUtils.damp(galv.needlePivot.rotation.z, -indVal * 0.9, 12, dt);
        indPhase += dt * indVal * 3.5;
        indDots.forEach((d, i) => { d.visible = Math.abs(indVal) > 0.04; const a = indPhase + (i / 6) * Math.PI * 2; d.position.set(0, Math.cos(a) * 0.52, Math.sin(a) * 0.52); });
      },
      readouts: (p) => [{ label: 'Induced Current', value: (indVal * 5).toFixed(2), unit: 'mA' }, { label: 'Turns (N)', value: String(Math.round(p.coilTurns || 8)) }],
    };
  }
`;
