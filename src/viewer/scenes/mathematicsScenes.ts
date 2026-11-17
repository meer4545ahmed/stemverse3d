import * as THREE from 'three';
import { ActiveLabScene, LabSceneContext } from './sceneTypes';
import {
  createBenchDisplayConsole,
  createCylinderBetween,
  makeMetalMaterial,
  updateCylinderBetween,
} from './sceneHelpers';
import { createCartesianGridTexture, createLiveDisplayTexture } from '../materials/proceduralTextures';

export function buildMathematicsScene(id: string, ctx: LabSceneContext): ActiveLabScene {
  const root = new THREE.Group();

  // =========================================================
  // M01: Three-Dimensional Geometric Solids (Pedestals + Clearcoat Solids + Formula Console)
  // =========================================================
  if (id === 'M01') {
    const makeSolidWithEdges = (geo: THREE.BufferGeometry, color: number, x: number, y: number) => {
      const g = new THREE.Group();
      g.position.set(x, y, 0);
      const ped = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.68, 0.08, 28),
        makeMetalMaterial(0x1f2937, 0.3, 0.8)
      );
      ped.position.y = -y + 0.04;
      const trim = new THREE.Mesh(
        new THREE.TorusGeometry(0.62, 0.015, 8, 32),
        new THREE.MeshBasicMaterial({ color })
      );
      trim.rotation.x = Math.PI / 2;
      trim.position.y = -y + 0.082;
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshPhysicalMaterial({ color, roughness: 0.16, metalness: 0.25, clearcoat: 0.9 })
      );
      mesh.castShadow = true;
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo, 20),
        new THREE.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.55 })
      );
      g.add(ped, trim, mesh, edges);
      return { g, edges };
    };

    const cube = makeSolidWithEdges(new THREE.BoxGeometry(1.05, 1.05, 1.05), 0x7867ff, -2.1, 0.62);
    const cyl = makeSolidWithEdges(new THREE.CylinderGeometry(0.5, 0.5, 1.25, 32), 0x37b6ff, -0.7, 0.72);
    const cone = makeSolidWithEdges(new THREE.ConeGeometry(0.55, 1.3, 32), 0xf59e0b, 0.7, 0.74);
    const sph = makeSolidWithEdges(new THREE.SphereGeometry(0.58, 28, 24), 0x34d399, 2.1, 0.68);

    ctx.registerComponent(cube.g, 'cube', 'Cube (a³)', new THREE.Vector3(-0.3, 0.3, 0), new THREE.Vector3(0, 0.85, 0));
    ctx.registerComponent(cyl.g, 'cylinder', 'Cylinder (πr²h)', new THREE.Vector3(-0.1, 0.5, 0), new THREE.Vector3(0, 0.95, 0));
    ctx.registerComponent(cone.g, 'cone', 'Cone (⅓πr²h)', new THREE.Vector3(0.1, 0.5, 0), new THREE.Vector3(0, 0.95, 0));
    ctx.registerComponent(sph.g, 'sphere', 'Sphere (⁴⁄₃πr³)', new THREE.Vector3(0.3, 0.3, 0), new THREE.Vector3(0, 0.85, 0));

    root.add(cube.g, cyl.g, cone.g, sph.g);
    const items = [cube, cyl, cone, sph];

    const disp = createLiveDisplayTexture(420, 200, ctx.maxAnisotropy);
    const consoleM1 = createBenchDisplayConsole(2.0, 0.96, disp.texture);
    consoleM1.position.set(0, 2.35, -1.4);
    root.add(consoleM1);
    let lastIdx = -1;
    const names = ['ALL SOLIDS OVERVIEW', 'CUBE (6 FACES)', 'CYLINDER (2 DISCS)', 'CONE (1/3 CYLINDER)', 'SPHERE (SYMMETRIC)'];
    const forms = ['Euler: V - E + F = 2', 'V = a^3  |  TSA = 6a^2', 'V = pi*r^2*h  |  TSA = 2pi*r(r+h)', 'V = (1/3)pi*r^2*h  |  l = sqrt(r^2+h^2)', 'V = (4/3)pi*r^3  |  SA = 4pi*r^2'];

    return {
      root,
      defaultCameraPos: [0, 2.6, 5.6],
      defaultTarget: [0, 0.95, 0],
      updateParams: () => {},
      update: (dt, _el, params, playing) => {
        const idx = Math.round(params.solidIndex ?? 0);
        const showEdges = (params.wireframe ?? 1) >= 0.5;
        items.forEach((it, i) => {
          it.edges.visible = showEdges;
          const targetS = idx === 0 || idx === i + 1 ? 1.05 : 0.75;
          it.g.scale.setScalar(THREE.MathUtils.damp(it.g.scale.x, targetS, 8, dt));
          if (playing) it.g.rotation.y += dt * 0.4;
        });
        if (idx !== lastIdx) {
          lastIdx = idx;
          const c = disp.ctx;
          c.fillStyle = '#070A10';
          c.fillRect(0, 0, 420, 200);
          c.strokeStyle = '#38BDF8';
          c.lineWidth = 3;
          c.strokeRect(8, 8, 404, 184);
          c.fillStyle = '#94A3B8';
          c.font = 'bold 15px monospace';
          c.textAlign = 'center';
          c.fillText('MENSURATION REFERENCE', 210, 38);
          c.fillStyle = '#38BDF8';
          c.font = 'bold 22px monospace';
          c.fillText(names[idx] || names[0], 210, 86);
          c.fillStyle = '#F8FAFC';
          c.font = 'bold 18px monospace';
          c.fillText(forms[idx] || forms[0], 210, 144);
          disp.texture.needsUpdate = true;
        }
      },
      getReadouts: () => [
        { label: 'Cube Euler Check', value: '8V - 12E + 6F = 2' },
        { label: 'Cone vs Cylinder', value: 'V_cone = ⅓ V_cyl' },
      ],
    };
  }

  // =========================================================
  // M02: Surface Area and Volume (Unfolding 3D -> 2D Net with Hinge Pins + Output Console)
  // =========================================================
  if (id === 'M02') {
    const baseFaceGroup = new THREE.Group();
    const matSide = new THREE.MeshPhysicalMaterial({ color: 0x7867ff, roughness: 0.25, metalness: 0.28, clearcoat: 0.7, side: THREE.DoubleSide });
    const matTop = new THREE.MeshPhysicalMaterial({ color: 0x37b6ff, roughness: 0.2, metalness: 0.3, clearcoat: 0.8, side: THREE.DoubleSide });
    const hingeMat = makeMetalMaterial(0xd97706, 0.22, 0.9);

    const s = 1.0;
    const plateGeo = new THREE.BoxGeometry(s, 0.04, s);
    const makePanel = (mat: THREE.Material) => {
      const m = new THREE.Mesh(plateGeo, mat);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(plateGeo),
        new THREE.LineBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.45 })
      );
      m.add(edges);
      return m;
    };
    const bottom = makePanel(matSide);

    const frontPivot = new THREE.Group();
    frontPivot.position.set(0, 0, s / 2);
    const front = makePanel(matSide);
    front.position.set(0, 0, s / 2);
    const hingeF = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, s * 0.92, 10), hingeMat);
    hingeF.rotation.z = Math.PI / 2;
    frontPivot.add(front, hingeF);

    const backPivot = new THREE.Group();
    backPivot.position.set(0, 0, -s / 2);
    const back = makePanel(matSide);
    back.position.set(0, 0, -s / 2);
    const hingeB = hingeF.clone();
    backPivot.add(back, hingeB);

    const leftPivot = new THREE.Group();
    leftPivot.position.set(-s / 2, 0, 0);
    const left = makePanel(matSide);
    left.position.set(-s / 2, 0, 0);
    const hingeL = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, s * 0.92, 10), hingeMat);
    hingeL.rotation.x = Math.PI / 2;
    leftPivot.add(left, hingeL);

    const rightPivot = new THREE.Group();
    rightPivot.position.set(s / 2, 0, 0);
    const right = makePanel(matSide);
    right.position.set(s / 2, 0, 0);
    const hingeR = hingeL.clone();
    rightPivot.add(right, hingeR);

    const topPivot = new THREE.Group();
    topPivot.position.set(0, 0, -s);
    const top = makePanel(matTop);
    top.position.set(0, 0, -s / 2);
    topPivot.add(top, hingeF.clone());
    backPivot.add(topPivot);

    baseFaceGroup.add(bottom, frontPivot, backPivot, leftPivot, rightPivot);
    baseFaceGroup.position.y = 0.04;
    ctx.registerComponent(baseFaceGroup, 'baseFace', 'Hinged Lateral Faces', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.3, 0));
    ctx.registerComponent(top, 'topCap', 'Top Cap Face', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 0.25, 0));

    const cylGroup = new THREE.Group();
    const cylBody = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.3, 32, 1, true), matSide);
    cylBody.position.y = 0.65;
    const cylCap = new THREE.Mesh(new THREE.CircleGeometry(0.65, 32), matTop);
    cylCap.rotation.x = -Math.PI / 2;
    cylCap.position.y = 1.3;
    cylGroup.add(cylBody, cylCap);
    root.add(baseFaceGroup, cylGroup);

    const netDisp = createLiveDisplayTexture(380, 200, ctx.maxAnisotropy);
    const netConsole = createBenchDisplayConsole(1.65, 0.88, netDisp.texture);
    netConsole.position.set(-2.35, 0.85, -1.35);
    netConsole.rotation.y = 0.48;
    root.add(netConsole);
    let lastNetKey = '';

    return {
      root,
      defaultCameraPos: [2.4, 3.2, 4.6],
      defaultTarget: [0, 0.55, 0],
      updateParams: () => {},
      update: (_dt, _el, params) => {
        const unfold = params.unfold ?? 0.4;
        const isCyl = (params.solidType ?? 0) >= 0.5;
        const a = params.size ?? 1.6;
        const sc = a / 1.6;
        baseFaceGroup.visible = !isCyl;
        cylGroup.visible = isCyl;
        baseFaceGroup.scale.setScalar(sc);
        cylGroup.scale.setScalar(sc);

        const foldAng = (1 - unfold) * (Math.PI / 2);
        frontPivot.rotation.x = -foldAng;
        backPivot.rotation.x = foldAng;
        leftPivot.rotation.z = -foldAng;
        rightPivot.rotation.z = foldAng;
        topPivot.rotation.x = foldAng;

        cylBody.scale.x = 1 + unfold * 0.85;
        cylBody.scale.z = Math.max(0.12, 1 - unfold * 0.82);
        cylCap.position.y = 1.3 + unfold * 0.5;
        cylCap.rotation.x = -Math.PI / 2 + unfold * 0.8;

        const key = `${isCyl ? 1 : 0}|${a.toFixed(1)}|${Math.round(unfold * 100)}`;
        if (key !== lastNetKey) {
          lastNetKey = key;
          const tsa = isCyl ? 2 * Math.PI * a * (a + a * 1.2) : 6 * a * a;
          const vol = isCyl ? Math.PI * a * a * (a * 1.2) : a * a * a;
          const c = netDisp.ctx;
          c.fillStyle = '#070A10';
          c.fillRect(0, 0, 380, 200);
          c.strokeStyle = '#38BDF8';
          c.lineWidth = 3;
          c.strokeRect(8, 8, 364, 184);
          c.fillStyle = '#94A3B8';
          c.font = 'bold 15px monospace';
          c.textAlign = 'left';
          c.fillText(isCyl ? 'CYLINDER NET' : 'CUBE 2D NET', 22, 36);
          c.fillStyle = '#38BDF8';
          c.font = 'bold 26px monospace';
          c.fillText(`TSA = ${tsa.toFixed(2)} m²`, 22, 92);
          c.fillStyle = '#34D399';
          c.fillText(`VOL = ${vol.toFixed(2)} m³`, 22, 138);
          c.fillStyle = '#F59E0B';
          c.font = 'bold 16px monospace';
          c.fillText(`UNFOLD: ${Math.round(unfold * 100)}%`, 22, 176);
          netDisp.texture.needsUpdate = true;
        }
      },
      getReadouts: (params) => {
        const isCyl = (params.solidType ?? 0) >= 0.5;
        const a = params.size ?? 1.6;
        const tsa = isCyl ? 2 * Math.PI * a * (a + a * 1.2) : 6 * a * a;
        const vol = isCyl ? Math.PI * a * a * (a * 1.2) : a * a * a;
        return [
          { label: 'Total Surface Area', value: tsa.toFixed(2), unit: 'm²' },
          { label: 'Volume', value: vol.toFixed(2), unit: 'm³' },
        ];
      },
    };
  }

  // =========================================================
  // M03: Coordinate Geometry (Framed Slate Grid + 3D Axis Cones + Live Distance Console)
  // =========================================================
  if (id === 'M03') {
    const gridTex = createCartesianGridTexture(ctx.maxAnisotropy);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(5.38, 0.06, 5.38), makeMetalMaterial(0x1f2937, 0.35, 0.8));
    frame.position.y = 0.01;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 5.2),
      new THREE.MeshBasicMaterial({ map: gridTex, side: THREE.DoubleSide })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0.045;

    const arrowX = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 14), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    arrowX.rotation.z = -Math.PI / 2;
    arrowX.position.set(2.7, 0.06, 0);
    const arrowY = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 14), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    arrowY.rotation.x = -Math.PI / 2;
    arrowY.position.set(0, 0.06, -2.7);
    root.add(frame, arrowX, arrowY);
    ctx.registerComponent(plane, 'plane', 'Cartesian Grid', new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(2.2, 0.25, 2.2));

    const pointsGroup = new THREE.Group();
    const pinA = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), new THREE.MeshStandardMaterial({ color: 0x37b6ff, emissive: 0x0284c7 }));
    const pinB = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309 }));
    const midPin = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x065f46 }));
    const segAB = createCylinderBetween(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0.04, new THREE.MeshBasicMaterial({ color: 0xe2e8f0 }));
    const dxBar = createCylinderBetween(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0.025, new THREE.MeshBasicMaterial({ color: 0x37b6ff }));
    const dyBar = createCylinderBetween(new THREE.Vector3(), new THREE.Vector3(0, 0, 1), 0.025, new THREE.MeshBasicMaterial({ color: 0x7867ff }));
    pointsGroup.add(pinA, pinB, midPin, segAB, dxBar, dyBar);
    ctx.registerComponent(pointsGroup, 'pointA', 'Points A, B & Midpoint', new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 0.65, 0));

    root.add(plane, pointsGroup);

    const updateCoords = (params: Record<string, number>) => {
      const s = 0.52;
      const x1 = (params.x1 ?? -2) * s;
      const y1 = -(params.y1 ?? -1.5) * s;
      const x2 = (params.x2 ?? 2.5) * s;
      const y2 = -(params.y2 ?? 2) * s;
      const pA = new THREE.Vector3(x1, 0.18, y1);
      const pB = new THREE.Vector3(x2, 0.18, y2);
      const corner = new THREE.Vector3(x2, 0.18, y1);

      pinA.position.copy(pA);
      pinB.position.copy(pB);
      midPin.position.copy(pA).add(pB).multiplyScalar(0.5);
      updateCylinderBetween(segAB, pA, pB);
      updateCylinderBetween(dxBar, pA, corner);
      updateCylinderBetween(dyBar, corner, pB);
    };

    return {
      root,
      defaultCameraPos: [0, 4.6, 3.8],
      defaultTarget: [0, 0.1, 0],
      updateParams: updateCoords,
      update: (_dt, _el, p) => updateCoords(p),
      getReadouts: (params) => {
        const dx = (params.x2 ?? 2.5) - (params.x1 ?? -2);
        const dy = (params.y2 ?? 2) - (params.y1 ?? -1.5);
        const dist = Math.hypot(dx, dy);
        return [
          { label: 'Distance AB', value: dist.toFixed(2), unit: 'units' },
          { label: 'Midpoint M', value: `(${(((params.x1 ?? -2) + (params.x2 ?? 2.5)) / 2).toFixed(1)}, ${(((params.y1 ?? -1.5) + (params.y2 ?? 2)) / 2).toFixed(1)})` },
        ];
      },
    };
  }

  // =========================================================
  // M04: Trigonometry (Machined Optical Right Triangle + 90° Bracket + Trig Console)
  // =========================================================
  if (id === 'M04') {
    const unitMat = new THREE.CylinderGeometry(0.055, 0.055, 1, 12);
    const hypMesh = new THREE.Mesh(unitMat, new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25 }));
    const oppMesh = new THREE.Mesh(unitMat, new THREE.MeshStandardMaterial({ color: 0x37b6ff, roughness: 0.25 }));
    const adjMesh = new THREE.Mesh(unitMat, new THREE.MeshStandardMaterial({ color: 0x7867ff, roughness: 0.25 }));

    const rightBracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.22, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x34d399, wireframe: true })
    );
    root.add(rightBracket);

    ctx.registerComponent(hypMesh, 'hypotenuse', 'Hypotenuse (H)', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 0.3, 0));
    ctx.registerComponent(oppMesh, 'opposite', 'Opposite (P)', new THREE.Vector3(0.35, 0, 0), new THREE.Vector3(0.3, 0.2, 0));
    ctx.registerComponent(adjMesh, 'adjacent', 'Adjacent (B)', new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0, -0.25, 0));

    const arc = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.5, 32, 1, 0, Math.PI / 4),
      new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide })
    );
    arc.position.set(-1.2, 0.12, 0);
    root.add(hypMesh, oppMesh, adjMesh, arc);

    const trigDisp = createLiveDisplayTexture(360, 220, ctx.maxAnisotropy);
    const trigConsole = createBenchDisplayConsole(1.55, 0.94, trigDisp.texture);
    trigConsole.position.set(2.35, 0.85, -1.1);
    trigConsole.rotation.y = -0.45;
    root.add(trigConsole);
    let lastTrigKey = '';

    const updateTrig = (params: Record<string, number>) => {
      const deg = params.angleDeg ?? 45;
      const ang = THREE.MathUtils.degToRad(deg);
      const H = params.hypotenuse ?? 2.5;
      const B = H * Math.cos(ang);
      const P = H * Math.sin(ang);
      const o = new THREE.Vector3(-1.2, 0.12, 0);
      const bPt = new THREE.Vector3(-1.2 + B, 0.12, 0);
      const topPt = new THREE.Vector3(-1.2 + B, 0.12 + P, 0);
      updateCylinderBetween(adjMesh, o, bPt);
      updateCylinderBetween(oppMesh, bPt, topPt);
      updateCylinderBetween(hypMesh, o, topPt);
      rightBracket.position.set(-1.2 + B - 0.12, 0.24, 0);
      arc.geometry.dispose();
      arc.geometry = new THREE.RingGeometry(0.42, 0.48, 24, 1, 0, ang);

      const key = `${deg.toFixed(0)}|${H.toFixed(1)}`;
      if (key !== lastTrigKey) {
        lastTrigKey = key;
        const c = trigDisp.ctx;
        c.fillStyle = '#070A10';
        c.fillRect(0, 0, 360, 220);
        c.strokeStyle = '#38BDF8';
        c.lineWidth = 3;
        c.strokeRect(8, 8, 344, 204);
        c.fillStyle = '#94A3B8';
        c.font = 'bold 15px monospace';
        c.textAlign = 'left';
        c.fillText(`TRIGONOMETRY  θ = ${deg.toFixed(0)}°`, 20, 36);
        c.fillStyle = '#38BDF8';
        c.font = 'bold 24px monospace';
        c.fillText(`sin θ = ${Math.sin(ang).toFixed(3)}`, 20, 86);
        c.fillStyle = '#A78BFA';
        c.fillText(`cos θ = ${Math.cos(ang).toFixed(3)}`, 20, 126);
        c.fillStyle = '#34D399';
        c.fillText(`tan θ = ${Math.tan(ang).toFixed(3)}`, 20, 166);
        c.fillStyle = '#F59E0B';
        c.font = 'bold 16px monospace';
        c.fillText(`sin²θ + cos²θ = 1.000`, 20, 200);
        trigDisp.texture.needsUpdate = true;
      }
    };

    return {
      root,
      defaultCameraPos: [0.3, 2.1, 4.9],
      defaultTarget: [0.2, 1.0, 0],
      updateParams: updateTrig,
      update: (_dt, _el, p) => updateTrig(p),
      getReadouts: (params) => {
        const rad = THREE.MathUtils.degToRad(params.angleDeg ?? 45);
        return [
          { label: 'sin θ', value: Math.sin(rad).toFixed(3) },
          { label: 'cos θ', value: Math.cos(rad).toFixed(3) },
          { label: 'tan θ', value: Math.tan(rad).toFixed(3) },
        ];
      },
    };
  }

  // =========================================================
  // M05: Pair of Linear Equations
  // =========================================================
  if (id === 'M05') {
    const gridTex = createCartesianGridTexture(ctx.maxAnisotropy);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(5.36, 0.06, 5.36), makeMetalMaterial(0x1f2937, 0.35, 0.8));
    frame.position.y = 0.01;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), new THREE.MeshBasicMaterial({ map: gridTex }));
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0.045;
    root.add(frame, plane);

    const unitCyl = new THREE.CylinderGeometry(0.045, 0.045, 1, 10);
    const line1 = new THREE.Mesh(unitCyl, new THREE.MeshStandardMaterial({ color: 0x37b6ff, emissive: 0x0284c7 }));
    const line2 = new THREE.Mesh(unitCyl, new THREE.MeshStandardMaterial({ color: 0x7867ff, emissive: 0x4c1d95 }));
    const inter = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 20), new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x059669 }));
    ctx.registerComponent(line1, 'line1', 'Line L₁', new THREE.Vector3(0, 0.3, 0));
    ctx.registerComponent(line2, 'line2', 'Line L₂', new THREE.Vector3(0, 0.3, 0));
    ctx.registerComponent(inter, 'intersection', 'Intersection (x*, y*)', new THREE.Vector3(0, 0.4, 0));
    root.add(line1, line2, inter);

    const updateLines = (params: Record<string, number>) => {
      const m1 = params.m1 ?? 1;
      const c1 = params.c1 ?? 0.5;
      const m2 = params.m2 ?? -0.75;
      const c2 = params.c2 ?? 1.5;
      const s = 0.52;
      const p1a = new THREE.Vector3(-4 * s, 0.12, -(m1 * -4 + c1) * s);
      const p1b = new THREE.Vector3(4 * s, 0.12, -(m1 * 4 + c1) * s);
      const p2a = new THREE.Vector3(-4 * s, 0.14, -(m2 * -4 + c2) * s);
      const p2b = new THREE.Vector3(4 * s, 0.14, -(m2 * 4 + c2) * s);
      updateCylinderBetween(line1, p1a, p1b);
      updateCylinderBetween(line2, p2a, p2b);

      if (Math.abs(m1 - m2) < 0.01) {
        inter.visible = false;
      } else {
        inter.visible = true;
        const ix = (c2 - c1) / (m1 - m2);
        const iy = m1 * ix + c1;
        inter.position.set(ix * s, 0.22, -iy * s);
      }
    };

    return {
      root,
      defaultCameraPos: [0, 4.6, 3.8],
      defaultTarget: [0, 0.1, 0],
      updateParams: updateLines,
      update: (_dt, _el, p) => updateLines(p),
      getReadouts: (params) => {
        const m1 = params.m1 ?? 1;
        const c1 = params.c1 ?? 0.5;
        const m2 = params.m2 ?? -0.75;
        const c2 = params.c2 ?? 1.5;
        if (Math.abs(m1 - m2) < 0.01) {
          return [{ label: 'Solution', value: Math.abs(c1 - c2) < 0.01 ? 'Infinite (Coincident)' : 'None (Parallel)' }];
        }
        const ix = (c2 - c1) / (m1 - m2);
        const iy = m1 * ix + c1;
        return [
          { label: 'Intersection (x, y)', value: `(${ix.toFixed(2)}, ${iy.toFixed(2)})` },
          { label: 'System Type', value: 'Consistent Unique' },
        ];
      },
    };
  }

  // =========================================================
  // M06: Quadratic Equations
  // =========================================================
  if (id === 'M06') {
    const gridTex = createCartesianGridTexture(ctx.maxAnisotropy);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(5.36, 5.36, 0.08), makeMetalMaterial(0x1f2937, 0.35, 0.8));
    frame.position.set(0, 2.6, -0.05);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), new THREE.MeshBasicMaterial({ map: gridTex, side: THREE.DoubleSide }));
    plane.position.y = 2.6;
    root.add(frame, plane);

    const parabolaGroup = new THREE.Group();
    const rootsGroup = new THREE.Group();
    const root1 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 18), new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x059669 }));
    const root2 = root1.clone();
    const vertex = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309 }));
    rootsGroup.add(root1, root2, vertex);
    ctx.registerComponent(parabolaGroup, 'parabola', 'Parabolic Curve', new THREE.Vector3(0, 0, 0.3), new THREE.Vector3(0, 3.8, 0.2));
    ctx.registerComponent(rootsGroup, 'roots', 'Real Roots & Vertex', new THREE.Vector3(0, 0, 0.5), new THREE.Vector3(0, 2.7, 0.3));
    root.add(parabolaGroup, rootsGroup);

    let lastKey = '';
    const rebuildPara = (params: Record<string, number>) => {
      const a = params.a ?? 0.75;
      const b = params.b ?? 0;
      const c = params.c ?? -1.5;
      const key = `${a}|${b}|${c}`;
      if (key === lastKey) return;
      lastKey = key;

      parabolaGroup.clear();
      const s = 0.52;
      const pts: THREE.Vector3[] = [];
      for (let i = -36; i <= 36; i++) {
        const x = (i / 36) * 4.0;
        const y = a * x * x + b * x + c;
        if (Math.abs(y) <= 4.8) {
          pts.push(new THREE.Vector3(x * s, 2.6 + y * s, 0.08));
        }
      }
      if (pts.length >= 2) {
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.045, 10, false),
          new THREE.MeshStandardMaterial({ color: 0x37b6ff, emissive: 0x0284c7 })
        );
        parabolaGroup.add(tube);
      }

      const D = b * b - 4 * a * c;
      if (Math.abs(a) < 0.01) {
        vertex.visible = false;
        root1.visible = false;
        root2.visible = false;
      } else {
        const vx = -b / (2 * a);
        const vy = a * vx * vx + b * vx + c;
        vertex.visible = true;
        vertex.position.set(vx * s, 2.6 + vy * s, 0.12);
        if (D >= 0) {
          const rA = (-b - Math.sqrt(D)) / (2 * a);
          const rB = (-b + Math.sqrt(D)) / (2 * a);
          root1.visible = true;
          root2.visible = D > 0.001;
          root1.position.set(rA * s, 2.6, 0.14);
          root2.position.set(rB * s, 2.6, 0.14);
        } else {
          root1.visible = false;
          root2.visible = false;
        }
      }
    };

    return {
      root,
      defaultCameraPos: [0, 2.6, 6.2],
      defaultTarget: [0, 2.6, 0],
      updateParams: rebuildPara,
      update: (_dt, _el, p) => rebuildPara(p),
      getReadouts: (params) => {
        const a = params.a ?? 0.75;
        const b = params.b ?? 0;
        const c = params.c ?? -1.5;
        const D = b * b - 4 * a * c;
        return [
          { label: 'Discriminant (D)', value: D.toFixed(2) },
          { label: 'Real Roots', value: D > 0.001 ? '2 Distinct Roots' : Math.abs(D) <= 0.001 ? '1 Equal Root' : '0 Real Roots' },
        ];
      },
    };
  }

  // =========================================================
  // M07: Arithmetic Progressions
  // =========================================================
  if (id === 'M07') {
    const railBase = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 0.9), makeMetalMaterial(0x1f2937, 0.35, 0.8));
    railBase.position.y = 0.06;
    root.add(railBase);

    const barsGroup = new THREE.Group();
    const gaussGroup = new THREE.Group();
    ctx.registerComponent(barsGroup, 'bars', 'AP Terms (aₙ)', new THREE.Vector3(0, 0, -0.35), new THREE.Vector3(-1.5, 2.0, 0));
    ctx.registerComponent(gaussGroup, 'gaussPair', 'Gauss Complement', new THREE.Vector3(0, 0.45, 0.35), new THREE.Vector3(1.5, 2.5, 0));
    root.add(barsGroup, gaussGroup);

    let lastKey = '';
    const rebuildAP = (params: Record<string, number>) => {
      const a = params.firstTerm ?? 1.0;
      const d = params.diff ?? 0.4;
      const n = Math.round(params.terms ?? 7);
      const showG = (params.showGauss ?? 1) >= 0.5;
      const key = `${a}|${d}|${n}|${showG}`;
      if (key === lastKey) return;
      lastKey = key;

      barsGroup.clear();
      gaussGroup.clear();
      gaussGroup.visible = showG;

      const matA = new THREE.MeshPhysicalMaterial({ color: 0x37b6ff, roughness: 0.25, metalness: 0.25, clearcoat: 0.7 });
      const matB = new THREE.MeshPhysicalMaterial({ color: 0x7867ff, roughness: 0.25, metalness: 0.25, transparent: true, opacity: 0.68 });
      const an = a + (n - 1) * d;
      const totalH = (a + an) * 0.48;

      for (let i = 0; i < n; i++) {
        const h = (a + i * d) * 0.48;
        const x = (i - (n - 1) / 2) * 0.55;
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.46, h, 0.55), matA);
        col.position.set(x, h / 2 + 0.12, 0);
        col.castShadow = true;
        barsGroup.add(col);

        const compH = Math.max(0.05, totalH - h);
        const comp = new THREE.Mesh(new THREE.BoxGeometry(0.46, compH, 0.55), matB);
        comp.position.set(x, h + compH / 2 + 0.14, 0);
        gaussGroup.add(comp);
      }
    };

    return {
      root,
      defaultCameraPos: [0.5, 2.8, 5.2],
      defaultTarget: [0, 1.35, 0],
      updateParams: rebuildAP,
      update: (_dt, _el, p) => rebuildAP(p),
      getReadouts: (params) => {
        const a = params.firstTerm ?? 1.0;
        const d = params.diff ?? 0.4;
        const n = Math.round(params.terms ?? 7);
        const an = a + (n - 1) * d;
        const sn = (n / 2) * (a + an);
        return [
          { label: `n-th Term (a_${n})`, value: an.toFixed(2) },
          { label: `Sum (S_${n})`, value: sn.toFixed(2) },
        ];
      },
    };
  }

  // =========================================================
  // M08: Similar Triangles
  // =========================================================
  if (id === 'M08') {
    const makeTri = (color: number) => {
      const geo = new THREE.BufferGeometry();
      const verts = new Float32Array([0, 0, 0, 1.4, 0, 0, 0.5, 1.2, 0]);
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.computeVertexNormals();
      const g = new THREE.Group();
      const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color, side: THREE.DoubleSide, roughness: 0.25, metalness: 0.25, clearcoat: 0.7 }));
      g.add(mesh);
      return { g, mesh };
    };

    const tri1 = makeTri(0x37b6ff);
    tri1.g.position.set(-2.1, 0.5, 0);
    const tri2 = makeTri(0x7867ff);
    tri2.g.position.set(0.3, 0.5, 0);
    ctx.registerComponent(tri1.g, 'tri1', 'Reference △ABC', new THREE.Vector3(-0.3, 0, 0), new THREE.Vector3(0.6, 1.4, 0));
    ctx.registerComponent(tri2.g, 'tri2', 'Similar △DEF', new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(0.8, 1.6, 0));
    root.add(tri1.g, tri2.g);

    const updateTris = (params: Record<string, number>) => {
      const k = params.scaleK ?? 1.4;
      const skew = params.apexSkew ?? 0.2;
      const apexX = 0.65 + skew * 0.45;
      for (const m of [tri1.mesh, tri2.mesh]) {
        const pos = m.geometry.attributes.position as THREE.BufferAttribute;
        pos.setXYZ(2, apexX, 1.25, 0);
        pos.needsUpdate = true;
        m.geometry.computeVertexNormals();
      }
      tri2.g.scale.setScalar(k);
    };

    return {
      root,
      defaultCameraPos: [0, 2.0, 5.2],
      defaultTarget: [0, 1.2, 0],
      updateParams: updateTris,
      update: (_dt, _el, p) => updateTris(p),
      getReadouts: (params) => {
        const k = params.scaleK ?? 1.4;
        return [
          { label: 'Side Ratio (k)', value: `${k.toFixed(1)} : 1` },
          { label: 'Area Ratio (k²)', value: `${(k * k).toFixed(2)} : 1` },
        ];
      },
    };
  }

  // =========================================================
  // M09: Circles and Tangents
  // =========================================================
  if (id === 'M09') {
    const circleGroup = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.045, 12, 48),
      makeMetalMaterial(0x37b6ff, 0.2, 0.7)
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.15;
    const centerPin = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: 0x059669 }));
    centerPin.position.y = 0.15;
    const radA = createCylinderBetween(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0.03, new THREE.MeshBasicMaterial({ color: 0x34d399 }));
    const radB = createCylinderBetween(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0.03, new THREE.MeshBasicMaterial({ color: 0x34d399 }));
    circleGroup.add(ring, centerPin, radA, radB);
    ctx.registerComponent(circleGroup, 'circle', 'Circle & Radii (90°)', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 0.45, 0));

    const tanGroup = new THREE.Group();
    const extPin = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 18), new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309 }));
    const tanA = createCylinderBetween(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0.035, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    const tanB = createCylinderBetween(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0.035, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    tanGroup.add(extPin, tanA, tanB);
    ctx.registerComponent(tanGroup, 'tangents', 'Tangents PA & PB', new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, 0.45, 0));
    root.add(circleGroup, tanGroup);

    const updateTan = (params: Record<string, number>) => {
      const r = 1.15;
      const op = Math.max(r + 0.3, params.distOP ?? 3.2);
      const orbit = THREE.MathUtils.degToRad(params.orbitDeg ?? 0);
      const o = new THREE.Vector3(0, 0.15, 0);
      const p = new THREE.Vector3(Math.cos(orbit) * op, 0.15, Math.sin(orbit) * op);
      const alpha = Math.acos(r / op);
      const a = new THREE.Vector3(Math.cos(orbit + alpha) * r, 0.15, Math.sin(orbit + alpha) * r);
      const b = new THREE.Vector3(Math.cos(orbit - alpha) * r, 0.15, Math.sin(orbit - alpha) * r);
      extPin.position.copy(p);
      updateCylinderBetween(radA, o, a);
      updateCylinderBetween(radB, o, b);
      updateCylinderBetween(tanA, p, a);
      updateCylinderBetween(tanB, p, b);
    };

    return {
      root,
      defaultCameraPos: [0.5, 4.4, 3.8],
      defaultTarget: [0.8, 0.15, 0],
      updateParams: updateTan,
      update: (_dt, _el, p) => updateTan(p),
      getReadouts: (params) => {
        const r = 1.15;
        const op = Math.max(r + 0.3, params.distOP ?? 3.2);
        const len = Math.sqrt(op * op - r * r);
        return [
          { label: 'PA = PB Length', value: len.toFixed(2), unit: 'm' },
          { label: '∠OAP = ∠OBP', value: '90.0°' },
        ];
      },
    };
  }

  // =========================================================
  // M10: Probability and Statistics (Real Pip-Dot 3D Die + Calibrated Frequency Histogram)
  // =========================================================
  const dieGroup = new THREE.Group();
  dieGroup.position.set(-1.8, 1.4, 0);
  const dieCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.88, 0.88),
    new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.14, clearcoat: 1.0 })
  );
  dieCube.castShadow = true;
  dieGroup.add(dieCube);

  // Add real 3D inset pips on all 6 faces (opposite faces sum to 7)
  const pipGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.02, 14);
  const pipMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25 });
  const pipAccent = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.25 });
  const addPipsOnFace = (normal: [number, number, number], coords: [number, number][], useAccent = false) => {
    const faceGrp = new THREE.Group();
    const d = 0.442;
    faceGrp.position.set(normal[0] * d, normal[1] * d, normal[2] * d);
    if (normal[0] !== 0) faceGrp.rotation.z = normal[0] > 0 ? -Math.PI / 2 : Math.PI / 2;
    else if (normal[1] < 0) faceGrp.rotation.x = Math.PI;
    else if (normal[2] !== 0) faceGrp.rotation.x = normal[2] > 0 ? Math.PI / 2 : -Math.PI / 2;
    coords.forEach(([u, v]) => {
      const pip = new THREE.Mesh(pipGeo, useAccent ? pipAccent : pipMat);
      pip.position.set(u * 0.22, 0, v * 0.22);
      faceGrp.add(pip);
    });
    dieGroup.add(faceGrp);
  };
  addPipsOnFace([0, 1, 0], [[0, 0]], true); // 1
  addPipsOnFace([0, -1, 0], [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]]); // 6
  addPipsOnFace([0, 0, 1], [[-1, -1], [1, 1]]); // 2
  addPipsOnFace([0, 0, -1], [[-1, -1], [-1, 1], [0, 0], [1, -1], [1, 1]]); // 5
  addPipsOnFace([1, 0, 0], [[-1, -1], [0, 0], [1, 1]]); // 3
  addPipsOnFace([-1, 0, 0], [[-1, -1], [-1, 1], [1, -1], [1, 1]]); // 4
  ctx.registerComponent(dieGroup, 'die', 'Fair 3D Die (1–6 Pips)', new THREE.Vector3(-0.35, 0.3, 0), new THREE.Vector3(0, 0.78, 0));

  const histGroup = new THREE.Group();
  histGroup.position.set(0.85, 0, 0);
  const histBase = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.08, 0.7), makeMetalMaterial(0x1f2937, 0.35, 0.8));
  histBase.position.y = 0.04;
  histGroup.add(histBase);
  const bars: THREE.Mesh[] = [];
  for (let i = 0; i < 11; i++) {
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 1, 0.42),
      new THREE.MeshPhysicalMaterial({ color: i % 2 === 0 ? 0x37b6ff : 0x7867ff, roughness: 0.25, clearcoat: 0.6 })
    );
    b.castShadow = true;
    histGroup.add(b);
    bars.push(b);
  }
  ctx.registerComponent(histGroup, 'histogram', 'Frequency Histogram', new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(0, 2.3, 0));
  root.add(dieGroup, histGroup);

  let lastBatchKey = '';
  let freqs: number[] = [];
  const recomputeTrials = (params: Record<string, number>) => {
    const mode = Math.round(params.mode ?? 1);
    const n = Math.round(params.trials ?? 120);
    const seed = Math.round(params.seed ?? 1);
    const key = `${mode}|${n}|${seed}`;
    if (key === lastBatchKey) return;
    lastBatchKey = key;

    const count = mode === 0 ? 6 : 11;
    freqs = new Array(count).fill(0);
    let s = seed * 9973 + n * 31;
    const rand = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return (s % 6) + 1;
    };
    for (let i = 0; i < n; i++) {
      if (mode === 0) freqs[rand() - 1]++;
      else freqs[rand() + rand() - 2]++;
    }
    const maxF = Math.max(1, ...freqs);
    bars.forEach((b, idx) => {
      b.visible = idx < count;
      if (!b.visible) return;
      const h = Math.max(0.08, (freqs[idx] / maxF) * 2.1);
      b.scale.y = h;
      b.position.set((idx - (count - 1) / 2) * 0.4, h / 2 + 0.08, 0);
    });
  };

  return {
    root,
    defaultCameraPos: [0.3, 2.8, 5.4],
    defaultTarget: [0.2, 1.15, 0],
    updateParams: recomputeTrials,
    update: (dt, _el, params, playing) => {
      recomputeTrials(params);
      if (playing) {
        dieGroup.rotation.x += dt * 1.6;
        dieGroup.rotation.y += dt * 2.1;
      }
    },
    getReadouts: (params) => {
      const mode = Math.round(params.mode ?? 1);
      const n = Math.round(params.trials ?? 120);
      return [
        { label: 'Sample Size (N)', value: String(n), unit: 'trials' },
        { label: 'Distribution', value: mode === 0 ? 'Uniform (1/6)' : '2-Dice Sum (Peak at 7)' },
      ];
    },
  };
}
