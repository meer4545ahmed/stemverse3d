import * as THREE from 'three';
import { ActiveLabScene, LabSceneContext } from './sceneTypes';
import {
  createAnalogMeter,
  createCurvedLensMesh,
  createCylinderBetween,
  createHelicalCoil,
  makeGlassMaterial,
  makeMetalMaterial,
  updateCylinderBetween,
} from './sceneHelpers';
import {
  createIrisTexture,
  createLiveDisplayTexture,
  createMeterDialTexture,
  createProtractorTexture,
  createRetinaTexture,
  createRulerTexture,
} from '../materials/proceduralTextures';

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

function buildOpticsBench(ctx: LabSceneContext): THREE.Group {
  const bench = new THREE.Group();
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(7.4, 0.22, 0.76),
    makeMetalMaterial(0x273244, 0.28, 0.84)
  );
  rail.position.y = 0.11;
  rail.receiveShadow = true;
  rail.castShadow = true;
  bench.add(rail);

  // Machined steel guide dovetail bars
  const slotMat = makeMetalMaterial(0x94a3b8, 0.22, 0.92);
  for (const z of [-0.28, 0.28]) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(7.36, 0.04, 0.06), slotMat);
    slot.position.set(0, 0.23, z);
    bench.add(slot);
  }

  const rulerTex = createRulerTexture(ctx.maxAnisotropy);
  const scaleStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(7.0, 0.34),
    new THREE.MeshBasicMaterial({ map: rulerTex })
  );
  scaleStrip.rotation.x = -Math.PI / 2;
  scaleStrip.position.set(0, 0.226, 0.02);
  bench.add(scaleStrip);

  for (const x of [-3.35, 3.35]) {
    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.2, 1.08),
      makeMetalMaterial(0x475569, 0.26, 0.88)
    );
    foot.position.set(x, 0.1, 0);
    bench.add(foot);
    const knob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16),
      makeMetalMaterial(0xd97706, 0.24, 0.9)
    );
    knob.position.set(x, 0.24, 0.42);
    bench.add(knob);
  }
  ctx.registerComponent(
    bench,
    'bench',
    'Optical Bench',
    new THREE.Vector3(0, -0.45, 0),
    new THREE.Vector3(0, 0.25, 0.42)
  );
  return bench;
}

function createBenchConsole(
  width: number,
  height: number,
  tex: THREE.CanvasTexture
): THREE.Group {
  const g = new THREE.Group();
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.16, height + 0.16, 0.22),
    makeMetalMaterial(0x273244, 0.32, 0.78)
  );
  housing.castShadow = true;
  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.06, height + 0.06, 0.04),
    makeMetalMaterial(0x475569, 0.25, 0.9)
  );
  bezel.position.z = 0.1;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  screen.position.z = 0.125;
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.14, 0.45, 16),
    makeMetalMaterial(0x64748b, 0.25, 0.85)
  );
  pedestal.position.set(0, -(height * 0.5 + 0.26), -0.02);
  g.add(housing, bezel, screen, pedestal);
  return g;
}

export function buildPhysicsScene(id: string, ctx: LabSceneContext): ActiveLabScene {
  const root = new THREE.Group();

  // P01: Concave & Convex Mirrors (With Machined Gimbal + Live Ground-Glass Output Screen)
  if (id === 'P01') {
    const bench = buildOpticsBench(ctx);
    root.add(bench);

    // Mirror assembly at x = 2.4
    const mirrorGroup = new THREE.Group();
    mirrorGroup.position.set(2.4, 0, 0);
    const carriage = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.22, 0.62),
      makeMetalMaterial(0x334155, 0.28, 0.82)
    );
    carriage.position.y = 0.32;
    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.12, 0.92, 20),
      makeMetalMaterial(0x94a3b8, 0.2, 0.9)
    );
    stand.position.y = 0.78;
    const gimbal = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.05, 14, 36),
      makeMetalMaterial(0xd97706, 0.22, 0.92)
    );
    gimbal.position.y = 1.48;
    gimbal.rotation.y = Math.PI / 2;
    const mirrorBack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.76, 0.08, 32),
      makeMetalMaterial(0x1e293b, 0.35, 0.85)
    );
    mirrorBack.rotation.z = Math.PI / 2;
    mirrorBack.position.set(0.09, 1.48, 0);
    mirrorGroup.add(carriage, stand, gimbal, mirrorBack);

    const concaveDish = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 36, 26, 0, Math.PI * 2, 0, 0.34),
      new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        metalness: 0.96,
        roughness: 0.04,
        clearcoat: 1.0,
        side: THREE.DoubleSide,
      })
    );
    concaveDish.rotation.z = -Math.PI / 2;
    concaveDish.position.set(2.05, 1.48, 0);
    mirrorGroup.add(concaveDish);
    ctx.registerComponent(
      mirrorGroup,
      'mirror',
      'Spherical Mirror Assembly',
      new THREE.Vector3(0.6, 0, 0),
      new THREE.Vector3(0, 2.38, 0)
    );
    root.add(mirrorGroup);

    // Collimated Illuminated Object Target Housing
    const objectGroup = new THREE.Group();
    const objCarriage = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.22, 0.56),
      makeMetalMaterial(0x334155, 0.28, 0.82)
    );
    objCarriage.position.y = 0.32;
    const objPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.08, 0.75, 16),
      makeMetalMaterial(0x94a3b8)
    );
    objPost.position.y = 0.72;
    const lampBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.38, 0.34),
      makeMetalMaterial(0x1f2937, 0.35, 0.75)
    );
    lampBox.position.set(-0.22, 1.48, 0);
    const objStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.36, 12),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.8 })
    );
    objStem.position.y = 1.66;
    const objHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 1.1 })
    );
    objHead.position.y = 1.92;
    objectGroup.add(objCarriage, objPost, lampBox, objStem, objHead);
    ctx.registerComponent(
      objectGroup,
      'object',
      'Illuminated Object Source',
      new THREE.Vector3(0, 0.4, 0.5),
      new THREE.Vector3(0, 2.15, 0)
    );
    root.add(objectGroup);

    // Live Ground-Glass Projection Screen WITH Real-Time Visual Output Canvas
    const outputScreenTex = createLiveDisplayTexture(360, 420, ctx.maxAnisotropy);
    const imageGroup = new THREE.Group();
    const imgCarriage = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.22, 0.56),
      makeMetalMaterial(0x334155, 0.28, 0.82)
    );
    imgCarriage.position.y = 0.32;
    const imgPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.08, 0.58, 16),
      makeMetalMaterial(0x94a3b8)
    );
    imgPost.position.y = 0.65;
    const imgFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 1.48, 1.18),
      makeMetalMaterial(0x273244, 0.3, 0.85)
    );
    imgFrame.position.y = 1.48;
    const imgCanvasFace = new THREE.Mesh(
      new THREE.PlaneGeometry(1.06, 1.36),
      new THREE.MeshBasicMaterial({ map: outputScreenTex.texture, side: THREE.DoubleSide })
    );
    imgCanvasFace.rotation.y = -Math.PI / 2;
    imgCanvasFace.position.set(-0.05, 1.48, 0);
    const imgCanvasBack = imgCanvasFace.clone();
    imgCanvasBack.rotation.y = Math.PI / 2;
    imgCanvasBack.position.set(0.05, 1.48, 0);

    const imgArrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.45, 16),
      new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.9 })
    );
    imgArrow.position.set(-0.09, 1.48, 0);
    imageGroup.add(imgCarriage, imgPost, imgFrame, imgCanvasFace, imgCanvasBack, imgArrow);
    ctx.registerComponent(
      imageGroup,
      'image',
      'Projected Output Screen',
      new THREE.Vector3(0, 0.35, -0.5),
      new THREE.Vector3(0, 2.32, 0)
    );
    root.add(imageGroup);

    // Dynamic Optical Rays
    const rayMat1 = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const rayMat2 = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const rayMatVirtual = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.62 });
    const unitCyl = new THREE.CylinderGeometry(0.018, 0.018, 1, 8);
    const rays = [
      new THREE.Mesh(unitCyl, rayMat1),
      new THREE.Mesh(unitCyl, rayMat1),
      new THREE.Mesh(unitCyl, rayMat2),
      new THREE.Mesh(unitCyl, rayMatVirtual),
    ];
    rays.forEach((r) => root.add(r));

    const fMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 })
    );
    const cMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x5b21b6 })
    );
    root.add(fMarker, cMarker);

    let lastDrawKey = '';
    const updateOptics = (params: Record<string, number>) => {
      const isConvex = (params.mirrorType ?? 0) >= 0.5;
      const uCm = params.objectDistance ?? 42;
      const fCm = params.focalLength ?? 16;
      const scale = 0.075;
      const mirrorX = 2.4;
      const axisY = 1.48;
      const u = uCm * scale;
      const f = (isConvex ? fCm : -fCm) * scale;
      const objX = THREE.MathUtils.clamp(mirrorX - u, -3.2, 1.9);

      objectGroup.position.x = objX;
      concaveDish.rotation.z = isConvex ? Math.PI / 2 : -Math.PI / 2;
      concaveDish.position.x = isConvex ? -2.05 : 2.05;
      mirrorBack.position.x = isConvex ? -0.1 : 0.1;

      const fWorldX = mirrorX + f;
      const cWorldX = mirrorX + 2 * f;
      fMarker.position.set(THREE.MathUtils.clamp(fWorldX, -3.3, 3.6), axisY, 0);
      cMarker.position.set(THREE.MathUtils.clamp(cWorldX, -3.3, 3.6), axisY, 0);

      const uSigned = -u;
      const denom = 1 / f - 1 / uSigned;
      const vSigned = Math.abs(denom) < 0.005 ? -12 : 1 / denom;
      const mag = -vSigned / uSigned;
      const imgX = THREE.MathUtils.clamp(mirrorX + vSigned, -3.35, 3.65);
      const imgH = THREE.MathUtils.clamp(0.45 * mag, -0.78, 0.78);

      imageGroup.position.x = imgX;
      imgArrow.scale.set(1, Math.max(0.25, Math.abs(imgH) / 0.45), 1);
      imgArrow.rotation.z = imgH < 0 ? Math.PI : 0;
      imgArrow.position.y = axisY + imgH * 0.5;

      const objTop = new THREE.Vector3(objX, axisY + 0.45, 0);
      const hitTop = new THREE.Vector3(mirrorX, axisY + 0.45, 0);
      const pole = new THREE.Vector3(mirrorX, axisY, 0);
      const imgTip = new THREE.Vector3(imgX, axisY + imgH, 0);

      updateCylinderBetween(rays[0], objTop, hitTop);
      updateCylinderBetween(rays[1], hitTop, imgTip);
      updateCylinderBetween(rays[2], objTop, pole);
      updateCylinderBetween(rays[3], pole, imgTip);

      // Update live 3D projection screen texture
      const key = `${isConvex ? 1 : 0}|${uCm}|${fCm}`;
      if (key !== lastDrawKey) {
        lastDrawKey = key;
        const { ctx: c, texture } = outputScreenTex;
        const W = 360;
        const H = 420;
        c.fillStyle = '#07090E';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(148,163,184,0.18)';
        c.lineWidth = 1;
        for (let gx = 30; gx < W; gx += 30) {
          c.beginPath();
          c.moveTo(gx, 48);
          c.lineTo(gx, H - 56);
          c.stroke();
        }
        for (let gy = 48; gy < H - 56; gy += 30) {
          c.beginPath();
          c.moveTo(0, gy);
          c.lineTo(W, gy);
          c.stroke();
        }
        // Optical axis line
        c.strokeStyle = 'rgba(56,189,248,0.45)';
        c.setLineDash([6, 4]);
        c.beginPath();
        c.moveTo(16, H / 2);
        c.lineTo(W - 16, H / 2);
        c.stroke();
        c.setLineDash([]);

        // Projected arrow rendered cleanly
        const isReal = vSigned < 0;
        const pxHeight = THREE.MathUtils.clamp(Math.abs(mag) * 95, 22, 145);
        const dir = imgH < 0 ? 1 : -1;
        const tipY = H / 2 + dir * pxHeight;
        c.save();
        c.strokeStyle = isReal ? '#34D399' : '#38BDF8';
        c.fillStyle = isReal ? '#34D399' : '#38BDF8';
        c.lineWidth = 8;
        c.shadowColor = isReal ? '#10B981' : '#38BDF8';
        c.shadowBlur = isReal ? 10 : 18;
        c.beginPath();
        c.moveTo(W / 2, H / 2);
        c.lineTo(W / 2, tipY);
        c.stroke();
        c.beginPath();
        c.moveTo(W / 2, tipY + dir * 16);
        c.lineTo(W / 2 - 14, tipY - dir * 4);
        c.lineTo(W / 2 + 14, tipY - dir * 4);
        c.closePath();
        c.fill();
        c.restore();

        // Top & Bottom Telemetry
        c.fillStyle = '#0B0F17';
        c.fillRect(0, 0, W, 44);
        c.fillRect(0, H - 54, W, 54);
        c.fillStyle = '#94A3B8';
        c.font = 'bold 16px monospace';
        c.textAlign = 'left';
        c.fillText('SCREEN OUTPUT', 16, 28);
        c.fillStyle = isReal ? '#34D399' : '#38BDF8';
        c.textAlign = 'right';
        c.fillText(isReal ? 'REAL · INVERTED' : 'VIRTUAL · ERECT', W - 16, 28);
        c.fillStyle = '#F8FAFC';
        c.textAlign = 'center';
        c.font = 'bold 18px monospace';
        const vCm = (vSigned / scale).toFixed(1);
        c.fillText(`v = ${vCm} cm  |  m = ${mag.toFixed(2)}x`, W / 2, H - 20);
        texture.needsUpdate = true;
      }
    };

    return {
      root,
      defaultCameraPos: [0, 3.2, 6.2],
      defaultTarget: [0.3, 1.35, 0],
      updateParams: updateOptics,
      update: (_dt, _el, params) => updateOptics(params),
      getReadouts: (params) => {
        const isConvex = (params.mirrorType ?? 0) >= 0.5;
        const u = -(params.objectDistance ?? 42);
        const f = isConvex ? (params.focalLength ?? 16) : -(params.focalLength ?? 16);
        const v = 1 / (1 / f - 1 / u);
        const m = -v / u;
        return [
          { label: 'Image Distance (v)', value: Number.isFinite(v) ? v.toFixed(1) : '∞', unit: 'cm' },
          { label: 'Magnification (m)', value: Number.isFinite(m) ? m.toFixed(2) : '∞', unit: 'x' },
          { label: 'Nature', value: v < 0 ? 'Real, Inverted' : 'Virtual, Erect' },
        ];
      },
    };
  }

  // P02: Convex & Concave Lenses (With Machined Turret + Live Projection Output Screen)
  if (id === 'P02') {
    const bench = buildOpticsBench(ctx);
    root.add(bench);

    const lensGroup = new THREE.Group();
    const carriage = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.22, 0.62),
      makeMetalMaterial(0x334155, 0.28, 0.82)
    );
    carriage.position.y = 0.32;
    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.12, 0.72, 20),
      makeMetalMaterial(0x94a3b8, 0.2, 0.9)
    );
    stand.position.y = 0.68;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.048, 14, 36),
      makeMetalMaterial(0xd97706, 0.22, 0.92)
    );
    ring.position.y = 1.48;
    ring.rotation.y = Math.PI / 2;
    lensGroup.add(carriage, stand, ring);

    const convexLens = createCurvedLensMesh(true, 0.85, ctx.isSoftwareGl);
    convexLens.position.y = 1.48;
    const concaveLens = createCurvedLensMesh(false, 0.85, ctx.isSoftwareGl);
    concaveLens.position.y = 1.48;
    concaveLens.visible = false;
    lensGroup.add(convexLens, concaveLens);
    ctx.registerComponent(
      lensGroup,
      'lens',
      'Optical Glass Lens',
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(0, 2.48, 0)
    );
    root.add(lensGroup);

    const objectGroup = new THREE.Group();
    const objBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.54), makeMetalMaterial(0x334155));
    objBase.position.y = 0.32;
    const objPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.8, 12), makeMetalMaterial(0x94a3b8));
    objPost.position.y = 0.76;
    const objArrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.55, 16),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.9 })
    );
    objArrow.position.y = 1.48 + 0.27;
    objectGroup.add(objBase, objPost, objArrow);
    ctx.registerComponent(
      objectGroup,
      'object',
      'Object Source',
      new THREE.Vector3(-0.4, 0, 0.4),
      new THREE.Vector3(0, 2.15, 0)
    );
    root.add(objectGroup);

    // Live Image Screen Output
    const lensOutTex = createLiveDisplayTexture(360, 420, ctx.maxAnisotropy);
    const screenGroup = new THREE.Group();
    const scrBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.54), makeMetalMaterial(0x334155));
    scrBase.position.y = 0.32;
    const scrPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.58, 12), makeMetalMaterial(0x94a3b8));
    scrPost.position.y = 0.65;
    const screenPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 1.5, 1.18),
      makeMetalMaterial(0x273244, 0.3, 0.85)
    );
    screenPanel.position.y = 1.48;
    const scrFace = new THREE.Mesh(
      new THREE.PlaneGeometry(1.06, 1.36),
      new THREE.MeshBasicMaterial({ map: lensOutTex.texture, side: THREE.DoubleSide })
    );
    scrFace.rotation.y = -Math.PI / 2;
    scrFace.position.set(-0.05, 1.48, 0);
    const scrBack = scrFace.clone();
    scrBack.rotation.y = Math.PI / 2;
    scrBack.position.set(0.05, 1.48, 0);
    const imgArrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.45, 16),
      new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.9 })
    );
    imgArrow.position.set(-0.09, 1.48, 0);
    screenGroup.add(scrBase, scrPost, screenPanel, scrFace, scrBack, imgArrow);
    ctx.registerComponent(
      screenGroup,
      'screen',
      'Projected Image Screen',
      new THREE.Vector3(0.4, 0, -0.4),
      new THREE.Vector3(0, 2.38, 0)
    );
    root.add(screenGroup);

    const unitCyl = new THREE.CylinderGeometry(0.018, 0.018, 1, 8);
    const ray1 = new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    const ray2 = new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    const ray3 = new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    const ray4 = new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    root.add(ray1, ray2, ray3, ray4);

    let lastKey = '';
    const updateLens = (params: Record<string, number>) => {
      const isConcave = (params.lensType ?? 0) >= 0.5;
      convexLens.visible = !isConcave;
      concaveLens.visible = isConcave;
      const uCm = params.objectDistance ?? 38;
      const fCm = params.focalLength ?? 15;
      const scale = 0.058;
      const u = -uCm * scale;
      const f = (isConcave ? -fCm : fCm) * scale;
      const denom = 1 / f + 1 / u;
      const v = Math.abs(denom) < 0.01 ? 8 : 1 / denom;
      const mag = v / u;

      objectGroup.position.x = THREE.MathUtils.clamp(u, -3.4, -0.6);
      const imgX = THREE.MathUtils.clamp(v, -3.4, 3.4);
      screenGroup.position.x = imgX;
      const imgH = THREE.MathUtils.clamp(0.48 * mag, -0.78, 0.78);
      imgArrow.scale.set(1, Math.max(0.25, Math.abs(imgH) / 0.45), 1);
      imgArrow.rotation.z = imgH < 0 ? Math.PI : 0;
      imgArrow.position.y = 1.48 + imgH * 0.5;

      _v1.set(objectGroup.position.x, 1.48 + 0.48, 0);
      _v2.set(0, 1.48 + 0.48, 0);
      const center = new THREE.Vector3(0, 1.48, 0);
      const imgTip = new THREE.Vector3(imgX, 1.48 + imgH, 0);

      updateCylinderBetween(ray1, _v1, _v2);
      updateCylinderBetween(ray2, _v2, imgTip);
      updateCylinderBetween(ray3, _v1, center);
      updateCylinderBetween(ray4, center, imgTip);

      const key = `${isConcave ? 1 : 0}|${uCm}|${fCm}`;
      if (key !== lastKey) {
        lastKey = key;
        const { ctx: c, texture } = lensOutTex;
        const W = 360;
        const H = 420;
        c.fillStyle = '#07090E';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(148,163,184,0.16)';
        c.lineWidth = 1;
        for (let g = 48; g < H - 54; g += 36) {
          c.beginPath();
          c.moveTo(0, g);
          c.lineTo(W, g);
          c.stroke();
        }
        const isReal = v > 0;
        const pxH = THREE.MathUtils.clamp(Math.abs(mag) * 95, 22, 145);
        const dir = imgH < 0 ? 1 : -1;
        const tipY = H / 2 + dir * pxH;
        c.save();
        c.strokeStyle = isReal ? '#34D399' : '#38BDF8';
        c.fillStyle = isReal ? '#34D399' : '#38BDF8';
        c.lineWidth = 8;
        c.shadowColor = isReal ? '#10B981' : '#38BDF8';
        c.shadowBlur = 12;
        c.beginPath();
        c.moveTo(W / 2, H / 2);
        c.lineTo(W / 2, tipY);
        c.stroke();
        c.beginPath();
        c.moveTo(W / 2, tipY + dir * 16);
        c.lineTo(W / 2 - 14, tipY - dir * 4);
        c.lineTo(W / 2 + 14, tipY - dir * 4);
        c.closePath();
        c.fill();
        c.restore();

        c.fillStyle = '#0B0F17';
        c.fillRect(0, 0, W, 44);
        c.fillRect(0, H - 54, W, 54);
        c.fillStyle = '#94A3B8';
        c.font = 'bold 16px monospace';
        c.textAlign = 'left';
        c.fillText(isConcave ? 'CONCAVE' : 'CONVEX', 16, 28);
        c.fillStyle = isReal ? '#34D399' : '#38BDF8';
        c.textAlign = 'right';
        c.fillText(isReal ? 'REAL · INVERTED' : 'VIRTUAL · ERECT', W - 16, 28);
        c.fillStyle = '#F8FAFC';
        c.textAlign = 'center';
        c.font = 'bold 18px monospace';
        const pwr = 100 / (isConcave ? -fCm : fCm);
        c.fillText(`P = ${pwr >= 0 ? '+' : ''}${pwr.toFixed(1)} D  |  v = ${(v / scale).toFixed(1)} cm`, W / 2, H - 20);
        texture.needsUpdate = true;
      }
    };

    return {
      root,
      defaultCameraPos: [0, 3.0, 6.2],
      defaultTarget: [0, 1.35, 0],
      updateParams: updateLens,
      update: (_dt, _el, p) => updateLens(p),
      getReadouts: (params) => {
        const isConcave = (params.lensType ?? 0) >= 0.5;
        const u = -(params.objectDistance ?? 38);
        const f = isConcave ? -(params.focalLength ?? 15) : (params.focalLength ?? 15);
        const v = 1 / (1 / f + 1 / u);
        const power = 100 / f;
        return [
          { label: 'Optical Power (P)', value: `${power >= 0 ? '+' : ''}${power.toFixed(2)}`, unit: 'D' },
          { label: 'Image Distance (v)', value: Number.isFinite(v) ? v.toFixed(1) : '∞', unit: 'cm' },
          { label: 'Image Type', value: v > 0 ? 'Real, Inverted' : 'Virtual, Erect' },
        ];
      },
    };
  }

  // P03: Refraction Through Glass Slab (With Protractor Disc + Lateral Shift Detector Screen)
  if (id === 'P03') {
    const slabGroup = new THREE.Group();
    const slabMat = makeGlassMaterial(0x7dd3fc, ctx.isSoftwareGl, 0.42, 1.52);
    const slabMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.15, 2.0), slabMat);
    slabMesh.position.y = 0.62;
    slabMesh.castShadow = true;
    // Brass corner clamps for optical precision look
    const clampMat = makeMetalMaterial(0xd97706, 0.25, 0.9);
    for (const cx of [-1.72, 1.72]) {
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), clampMat);
      clamp.position.set(cx, 0.62, 0);
      slabGroup.add(clamp);
    }
    slabGroup.add(slabMesh);
    ctx.registerComponent(slabGroup, 'slab', 'Crown Glass Slab', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.35, 0));
    root.add(slabGroup);

    const protractorGroup = new THREE.Group();
    const dialPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(2.65, 2.65, 0.04, 48),
      new THREE.MeshBasicMaterial({ map: createProtractorTexture(ctx.maxAnisotropy) })
    );
    dialPlate.position.y = 0.025;
    const normalLine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 4.4, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    normalLine.rotation.x = Math.PI / 2;
    normalLine.position.set(0, 0.62, 0);
    protractorGroup.add(dialPlate, normalLine);
    ctx.registerComponent(
      protractorGroup,
      'protractor',
      'Goniometer Stage',
      new THREE.Vector3(0, -0.25, 0),
      new THREE.Vector3(0, 0.2, 2.3)
    );
    root.add(protractorGroup);

    const laserGroup = new THREE.Group();
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.82, 20),
      makeMetalMaterial(0x334155, 0.24, 0.88)
    );
    barrel.rotation.x = Math.PI / 2;
    const brassCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.145, 0.14, 20),
      clampMat
    );
    brassCollar.rotation.x = Math.PI / 2;
    brassCollar.position.z = 0.25;
    const emitterTip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.5 })
    );
    emitterTip.rotation.x = Math.PI / 2;
    emitterTip.position.z = 0.44;
    laserGroup.add(barrel, brassCollar, emitterTip);
    ctx.registerComponent(laserGroup, 'laser', 'He-Ne Laser Diode', new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0, 0.9, 0));
    root.add(laserGroup);

    // Live Emergent Shift Detector Console
    const shiftTex = createLiveDisplayTexture(420, 260, ctx.maxAnisotropy);
    const detectorConsole = createBenchConsole(1.65, 1.0, shiftTex.texture);
    detectorConsole.position.set(2.45, 0.95, -2.0);
    detectorConsole.rotation.y = -0.32;
    root.add(detectorConsole);

    const unitCyl = new THREE.CylinderGeometry(0.025, 0.025, 1, 10);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xff3b3b });
    const rayIn = new THREE.Mesh(unitCyl, beamMat);
    const rayMid = new THREE.Mesh(unitCyl, beamMat);
    const rayOut = new THREE.Mesh(unitCyl, beamMat);
    const rayGhost = new THREE.Mesh(
      unitCyl,
      new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.4 })
    );
    root.add(rayIn, rayMid, rayOut, rayGhost);

    let lastKey = '';
    const updateSlab = (params: Record<string, number>) => {
      const iDeg = params.incidentAngle ?? 45;
      const n = params.refractiveIndex ?? 1.52;
      const thick = params.slabThickness ?? 2.0;
      slabMesh.scale.z = thick / 2.0;

      const iRad = THREE.MathUtils.degToRad(iDeg);
      const rRad = Math.asin(Math.min(0.99, Math.sin(iRad) / n));
      const halfZ = thick * 0.5;
      const entry = new THREE.Vector3(0, 0.62, halfZ);
      const src = new THREE.Vector3(-Math.sin(iRad) * 2.5, 0.62, halfZ + Math.cos(iRad) * 2.5);
      const exitX = Math.tan(rRad) * thick;
      const exit = new THREE.Vector3(exitX, 0.62, -halfZ);
      const emergent = new THREE.Vector3(exitX + Math.sin(iRad) * 2.3, 0.62, -halfZ - Math.cos(iRad) * 2.3);
      const straight = new THREE.Vector3(Math.sin(iRad) * 2.8, 0.62, halfZ - Math.cos(iRad) * 2.8);

      laserGroup.position.copy(src);
      laserGroup.lookAt(entry);
      updateCylinderBetween(rayIn, src, entry);
      updateCylinderBetween(rayMid, entry, exit);
      updateCylinderBetween(rayOut, exit, emergent);
      updateCylinderBetween(rayGhost, entry, straight);

      const key = `${iDeg}|${n}|${thick}`;
      if (key !== lastKey) {
        lastKey = key;
        const rDeg = THREE.MathUtils.radToDeg(rRad);
        const shift = (thick * Math.sin(iRad - rRad)) / Math.cos(rRad);
        const { ctx: c, texture } = shiftTex;
        c.fillStyle = '#070A10';
        c.fillRect(0, 0, 420, 260);
        c.strokeStyle = 'rgba(56,189,248,0.2)';
        c.strokeRect(14, 14, 392, 232);
        c.fillStyle = '#94A3B8';
        c.font = 'bold 16px monospace';
        c.textAlign = 'left';
        c.fillText('LATERAL SHIFT SENSOR', 26, 42);
        // Reference un-deviated crosshair vs emergent laser dot
        const cy = 128;
        const refX = 140;
        const dotX = refX + shift * 85;
        c.strokeStyle = '#64748B';
        c.setLineDash([4, 4]);
        c.beginPath();
        c.moveTo(refX, 66);
        c.lineTo(refX, 180);
        c.stroke();
        c.setLineDash([]);
        c.strokeStyle = '#38BDF8';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(refX, cy);
        c.lineTo(dotX, cy);
        c.stroke();
        c.fillStyle = '#EF4444';
        c.beginPath();
        c.arc(dotX, cy, 13, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#F8FAFC';
        c.font = 'bold 20px monospace';
        c.fillText(`d = ${shift.toFixed(2)} cm`, 26, 222);
        c.fillStyle = '#38BDF8';
        c.textAlign = 'right';
        c.fillText(`r = ${rDeg.toFixed(1)}°`, 394, 222);
        texture.needsUpdate = true;
      }
    };

    return {
      root,
      defaultCameraPos: [2.2, 4.4, 4.4],
      defaultTarget: [0.3, 0.6, 0],
      updateParams: updateSlab,
      update: (_dt, _el, p) => updateSlab(p),
      getReadouts: (params) => {
        const i = params.incidentAngle ?? 45;
        const n = params.refractiveIndex ?? 1.52;
        const t = params.slabThickness ?? 2.0;
        const rRad = Math.asin(Math.min(0.99, Math.sin(THREE.MathUtils.degToRad(i)) / n));
        const rDeg = THREE.MathUtils.radToDeg(rRad);
        const shift = (t * Math.sin(THREE.MathUtils.degToRad(i) - rRad)) / Math.cos(rRad);
        return [
          { label: 'Angle of Refraction (r)', value: rDeg.toFixed(1), unit: '°' },
          { label: 'Emergence Angle (e)', value: i.toFixed(1), unit: '°' },
          { label: 'Lateral Shift (d)', value: shift.toFixed(2), unit: 'cm' },
        ];
      },
    };
  }

  // P04: Dispersion Through Prism (With Brass Spectrometer + Live VIBGYOR Band Screen)
  if (id === 'P04') {
    const prismGroup = new THREE.Group();
    const basePedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.15, 0.25, 32),
      makeMetalMaterial(0xd97706, 0.24, 0.9)
    );
    basePedestal.position.y = 0.125;
    prismGroup.add(basePedestal);

    const triShape = new THREE.Shape();
    const R = 1.05;
    for (let k = 0; k < 3; k++) {
      const a = (k * 2 * Math.PI) / 3 + Math.PI / 2;
      const x = Math.cos(a) * R;
      const y = Math.sin(a) * R;
      if (k === 0) triShape.moveTo(x, y);
      else triShape.lineTo(x, y);
    }
    triShape.closePath();
    const prismGeo = new THREE.ExtrudeGeometry(triShape, {
      depth: 1.5,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2,
    });
    prismGeo.rotateX(Math.PI / 2);
    prismGeo.translate(0, 1.8, 0);
    const prismMesh = new THREE.Mesh(prismGeo, makeGlassMaterial(0xe0f2fe, ctx.isSoftwareGl, 0.44, 1.62));
    prismMesh.castShadow = true;
    prismGroup.add(prismMesh);
    ctx.registerComponent(prismGroup, 'prism', 'Flint Glass Prism', new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(0, 2.0, 0));
    root.add(prismGroup);

    const sourceGroup = new THREE.Group();
    const lampBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 0.96, 20),
      makeMetalMaterial(0x273244, 0.3, 0.84)
    );
    lampBody.rotation.z = Math.PI / 2;
    const lensGlow = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    lensGlow.rotation.y = Math.PI / 2;
    lensGlow.position.x = 0.49;
    sourceGroup.add(lampBody, lensGlow);
    sourceGroup.position.set(-3.1, 1.15, 0);
    ctx.registerComponent(sourceGroup, 'source', 'Xenon Slit Source', new THREE.Vector3(-0.6, 0, 0), new THREE.Vector3(0, 0.45, 0));
    root.add(sourceGroup);

    // Live VIBGYOR Spectrum Output Screen
    const specTex = createLiveDisplayTexture(360, 460, ctx.maxAnisotropy);
    const screenGroup = new THREE.Group();
    const screenPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 2.25, 1.85),
      makeMetalMaterial(0x222938, 0.35, 0.8)
    );
    screenPlate.position.y = 1.15;
    const specFace = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 2.05),
      new THREE.MeshBasicMaterial({ map: specTex.texture })
    );
    specFace.rotation.y = -Math.PI / 2;
    specFace.position.set(-0.075, 1.15, 0);
    screenGroup.add(screenPlate, specFace);
    screenGroup.position.set(3.2, 0, 0);
    ctx.registerComponent(screenGroup, 'screen', 'Spectrometer Output Screen', new THREE.Vector3(0.6, 0, 0), new THREE.Vector3(0, 2.4, 0));
    root.add(screenGroup);

    const whiteBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 1, 10),
      new THREE.MeshBasicMaterial({ color: 0xfef3c7 })
    );
    root.add(whiteBeam);

    const vibgyor = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x3b82f6, 0x6366f1, 0xa855f7];
    const unitCyl = new THREE.CylinderGeometry(0.018, 0.018, 1, 8);
    const spectrumInside = vibgyor.map((c) => new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: c })));
    const spectrumOut = vibgyor.map((c) => new THREE.Mesh(unitCyl, new THREE.MeshBasicMaterial({ color: c })));
    spectrumInside.forEach((m) => root.add(m));
    spectrumOut.forEach((m) => root.add(m));

    let lastKey = '';
    const updatePrism = (params: Record<string, number>) => {
      const incDeg = params.incidentAngle ?? 44;
      const disp = params.dispersion ?? 1.2;
      const rot = THREE.MathUtils.degToRad(params.prismRotation ?? 0);
      prismGroup.rotation.y = rot;

      const incRad = THREE.MathUtils.degToRad(incDeg - 44);
      const srcPos = new THREE.Vector3(-3.0, 1.15 - Math.sin(incRad) * 1.1, 0);
      sourceGroup.position.copy(srcPos);
      const entry = new THREE.Vector3(-0.45, 1.15, 0);
      sourceGroup.lookAt(entry);
      updateCylinderBetween(whiteBeam, srcPos, entry);

      for (let i = 0; i < 7; i++) {
        const frac = i / 6;
        const exitY = 1.15 - (0.04 + frac * 0.14 * disp);
        const exitPt = new THREE.Vector3(0.45, exitY, 0);
        const drop = 0.25 + frac * 0.68 * disp;
        const endPt = new THREE.Vector3(3.12, 1.15 - drop, 0);
        updateCylinderBetween(spectrumInside[i], entry, exitPt);
        updateCylinderBetween(spectrumOut[i], exitPt, endPt);
      }

      const key = `${incDeg}|${disp}|${params.prismRotation ?? 0}`;
      if (key !== lastKey) {
        lastKey = key;
        const { ctx: c, texture } = specTex;
        c.fillStyle = '#07090E';
        c.fillRect(0, 0, 360, 460);
        c.fillStyle = '#94A3B8';
        c.font = 'bold 17px monospace';
        c.textAlign = 'center';
        c.fillText('DISPERSION SPECTRUM (nm)', 180, 34);

        const bandTop = 100 + Math.max(0, (incDeg - 30) * 1.1);
        const bandHeight = Math.min(260, 145 * disp);
        const grad = c.createLinearGradient(0, bandTop, 0, bandTop + bandHeight);
        grad.addColorStop(0.0, '#EF4444');
        grad.addColorStop(0.18, '#F97316');
        grad.addColorStop(0.35, '#EAB308');
        grad.addColorStop(0.52, '#22C55E');
        grad.addColorStop(0.7, '#3B82F6');
        grad.addColorStop(0.85, '#6366F1');
        grad.addColorStop(1.0, '#A855F7');
        c.save();
        c.shadowColor = '#FFFFFF';
        c.shadowBlur = 12;
        c.fillStyle = grad;
        c.fillRect(48, bandTop, 264, bandHeight);
        c.restore();

        c.fillStyle = '#E2E8F0';
        c.font = 'bold 16px monospace';
        c.fillText(`650nm Red  →  400nm Violet`, 180, 434);
        texture.needsUpdate = true;
      }
    };

    return {
      root,
      defaultCameraPos: [0.2, 2.7, 5.8],
      defaultTarget: [0, 1.1, 0],
      updateParams: updatePrism,
      update: (_dt, _el, p) => updatePrism(p),
      getReadouts: (params) => {
        const disp = params.dispersion ?? 1.2;
        const devRed = 37.2 + (params.incidentAngle ?? 44) * 0.12;
        const devViolet = devRed + 2.6 * disp;
        return [
          { label: 'Red Deviation (δR)', value: devRed.toFixed(1), unit: '°' },
          { label: 'Violet Deviation (δV)', value: devViolet.toFixed(1), unit: '°' },
          { label: 'Angular Spread', value: (devViolet - devRed).toFixed(2), unit: '°' },
        ];
      },
    };
  }

  // P05: Human Eye & Vision Defects (Anatomical Eyeball + Live Snellen Retina Acuity Output)
  if (id === 'P05') {
    const scleraGroup = new THREE.Group();
    scleraGroup.position.y = 1.6;
    const sclera = new THREE.Mesh(
      new THREE.SphereGeometry(1.34, 40, 40, 0, Math.PI * 1.56, 0.12, Math.PI - 0.24),
      new THREE.MeshPhysicalMaterial({ color: 0xf4f1ea, roughness: 0.28, clearcoat: 0.5, side: THREE.DoubleSide })
    );
    sclera.rotation.y = Math.PI * 0.24;
    const choroid = new THREE.Mesh(
      new THREE.SphereGeometry(1.27, 36, 36, 0, Math.PI * 1.52, 0.14, Math.PI - 0.28),
      new THREE.MeshPhysicalMaterial({ color: 0x581c1c, roughness: 0.42, side: THREE.DoubleSide })
    );
    choroid.rotation.y = Math.PI * 0.25;
    const muscleMat = new THREE.MeshPhysicalMaterial({ color: 0xb91c1c, roughness: 0.4 });
    const supRectus = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.26), muscleMat);
    supRectus.position.set(0.22, 1.18, 0);
    supRectus.rotation.z = -0.22;
    const infRectus = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.26), muscleMat);
    infRectus.position.set(0.22, -1.18, 0);
    infRectus.rotation.z = 0.22;
    scleraGroup.add(sclera, choroid, supRectus, infRectus);
    root.add(scleraGroup);

    const corneaGroup = new THREE.Group();
    corneaGroup.position.set(-1.14, 1.6, 0);
    const corneaPts: THREE.Vector2[] = [];
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 0.46;
      corneaPts.push(new THREE.Vector2(Math.sin(a) * 0.66, Math.cos(a) * 0.5 - 0.08));
    }
    const corneaGeo = new THREE.LatheGeometry(corneaPts, 32);
    corneaGeo.rotateZ(Math.PI / 2);
    const cornea = new THREE.Mesh(corneaGeo, makeGlassMaterial(0xdbeafe, ctx.isSoftwareGl, 0.36, 1.38));
    const limbus = new THREE.Mesh(
      new THREE.TorusGeometry(0.64, 0.028, 10, 32),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1 })
    );
    limbus.rotation.y = Math.PI / 2;
    corneaGroup.add(cornea, limbus);
    ctx.registerComponent(corneaGroup, 'cornea', 'Cornea', new THREE.Vector3(-0.7, 0, 0), new THREE.Vector3(-0.3, 0.65, 0));
    root.add(corneaGroup);

    const irisGroup = new THREE.Group();
    irisGroup.position.set(-0.98, 1.6, 0);
    const iris = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.56, 48),
      new THREE.MeshStandardMaterial({ map: createIrisTexture(), side: THREE.DoubleSide, roughness: 0.42 })
    );
    iris.rotation.y = Math.PI / 2;
    const pupil = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 32),
      new THREE.MeshBasicMaterial({ color: 0x05070b, side: THREE.DoubleSide })
    );
    pupil.rotation.y = Math.PI / 2;
    pupil.position.x = 0.005;
    const ciliary = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.07, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.45 })
    );
    ciliary.rotation.y = Math.PI / 2;
    ciliary.position.x = 0.22;
    irisGroup.add(iris, pupil, ciliary);
    ctx.registerComponent(irisGroup, 'iris', 'Iris, Pupil & Ciliary Body', new THREE.Vector3(-0.35, 0, 0), new THREE.Vector3(0, 0.68, 0));
    root.add(irisGroup);

    const lensGroup = new THREE.Group();
    lensGroup.position.set(-0.62, 1.6, 0);
    const eyeLens = createCurvedLensMesh(true, 0.44, ctx.isSoftwareGl);
    lensGroup.add(eyeLens);
    ctx.registerComponent(lensGroup, 'lens', 'Crystalline Lens', new THREE.Vector3(0, 0.3, 0.4), new THREE.Vector3(0, 0.6, 0));
    root.add(lensGroup);

    const retinaGroup = new THREE.Group();
    retinaGroup.position.set(0.1, 1.6, 0);
    const retina = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 36, 36, -Math.PI * 0.46, Math.PI * 0.92, 0.28, Math.PI - 0.56),
      new THREE.MeshStandardMaterial({ map: createRetinaTexture(), roughness: 0.5, side: THREE.DoubleSide })
    );
    retina.rotation.y = Math.PI;
    const nerveCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.18, -0.08, -0.1),
      new THREE.Vector3(1.62, -0.15, -0.16),
      new THREE.Vector3(2.05, -0.22, -0.22),
    ]);
    const opticNerve = new THREE.Mesh(
      new THREE.TubeGeometry(nerveCurve, 18, 0.2, 14, false),
      new THREE.MeshPhysicalMaterial({ color: 0xfef3c7, roughness: 0.42 })
    );
    retinaGroup.add(retina, opticNerve);
    ctx.registerComponent(retinaGroup, 'retina', 'Retina & Optic Nerve', new THREE.Vector3(0.65, 0, 0), new THREE.Vector3(1.15, 0.8, 0));
    root.add(retinaGroup);

    const specLens = createCurvedLensMesh(false, 0.58, ctx.isSoftwareGl);
    specLens.position.set(-1.98, 1.6, 0);
    root.add(specLens);

    // Live Retina Visual Acuity Monitor
    const eyeTex = createLiveDisplayTexture(360, 260, ctx.maxAnisotropy);
    const eyeMonitor = createBenchConsole(1.65, 1.15, eyeTex.texture);
    eyeMonitor.position.set(2.45, 0.85, 1.05);
    eyeMonitor.rotation.y = -0.38;
    root.add(eyeMonitor);

    const unitCyl = new THREE.CylinderGeometry(0.018, 0.018, 1, 8);
    const rayMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const rays = Array.from({ length: 4 }, () => new THREE.Mesh(unitCyl, rayMat));
    rays.forEach((r) => root.add(r));
    const focusDot = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), new THREE.MeshBasicMaterial({ color: 0x34d399 }));
    root.add(focusDot);

    let lastKey = '';
    const updateEye = (params: Record<string, number>) => {
      const mode = Math.round(params.defectMode ?? 1);
      const corr = (params.correctiveLens ?? 0) >= 0.5;
      const pupilAmt = params.pupilSize ?? 0.55;
      pupil.scale.setScalar(0.75 + pupilAmt * 0.55);
      specLens.visible = corr && mode !== 0;

      let focusX = 1.28;
      if (!corr) {
        if (mode === 1) focusX = 0.62;
        if (mode === 2) focusX = 2.02;
      }
      focusDot.position.set(focusX, 1.6, 0);
      const topIn = new THREE.Vector3(-3.2, 1.95, 0);
      const botIn = new THREE.Vector3(-3.2, 1.25, 0);
      const topLens = new THREE.Vector3(-0.62, 1.92, 0);
      const botLens = new THREE.Vector3(-0.62, 1.28, 0);
      updateCylinderBetween(rays[0], topIn, topLens);
      updateCylinderBetween(rays[1], botIn, botLens);
      updateCylinderBetween(rays[2], topLens, focusDot.position);
      updateCylinderBetween(rays[3], botLens, focusDot.position);

      const key = `${mode}|${corr ? 1 : 0}`;
      if (key !== lastKey) {
        lastKey = key;
        const { ctx: c, texture } = eyeTex;
        const sharp = corr || mode === 0;
        c.fillStyle = '#070A10';
        c.fillRect(0, 0, 360, 260);
        c.fillStyle = '#94A3B8';
        c.font = 'bold 15px monospace';
        c.textAlign = 'left';
        c.fillText('RETINAL IMAGE OUTPUT', 18, 30);

        c.save();
        c.filter = sharp ? 'none' : 'blur(7px)';
        c.fillStyle = '#F8FAFC';
        c.font = 'bold 104px sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('E', 180, 128);
        c.restore();

        c.fillStyle = sharp ? '#34D399' : '#F59E0B';
        c.font = 'bold 17px monospace';
        c.textAlign = 'center';
        c.fillText(
          sharp ? 'SHARP FOCUS ON RETINA' : mode === 1 ? 'BLURRED · MYOPIA' : 'BLURRED · HYPERMETROPIA',
          180,
          232
        );
        texture.needsUpdate = true;
      }
    };

    return {
      root,
      defaultCameraPos: [-0.4, 2.5, 5.4],
      defaultTarget: [0.1, 1.5, 0.2],
      updateParams: updateEye,
      update: (_dt, _el, p) => updateEye(p),
      getReadouts: (params) => {
        const mode = Math.round(params.defectMode ?? 1);
        const corr = (params.correctiveLens ?? 0) >= 0.5;
        const label = mode === 0 ? 'Normal (Emmetropia)' : mode === 1 ? 'Myopia (-2.0 D)' : 'Hypermetropia (+2.0 D)';
        return [
          { label: 'Eye Condition', value: label },
          { label: 'Focus Plane', value: corr || mode === 0 ? 'On Retina' : mode === 1 ? 'In Front of Retina' : 'Behind Retina' },
        ];
      },
    };
  }

  // P06: Ohm's Law (Regulated DC PSU + Analog Meters + Ceramic Resistor + Live V-I Oscilloscope)
  if (id === 'P06') {
    const batteryGroup = new THREE.Group();
    batteryGroup.position.set(-2.15, 0, 1.0);
    const pack = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 0.95, 0.78),
      makeMetalMaterial(0x273244, 0.32, 0.78)
    );
    pack.position.y = 0.475;
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(1.22, 0.1, 0.82),
      makeMetalMaterial(0xd97706, 0.24, 0.88)
    );
    cap.position.y = 0.98;
    const psuTex = createLiveDisplayTexture(320, 180, ctx.maxAnisotropy);
    const psuScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.92, 0.52),
      new THREE.MeshBasicMaterial({ map: psuTex.texture })
    );
    psuScreen.position.set(0, 0.54, 0.398);
    batteryGroup.add(pack, cap, psuScreen);
    ctx.registerComponent(batteryGroup, 'battery', 'Regulated DC Supply', new THREE.Vector3(-0.3, 0, 0), new THREE.Vector3(0, 1.3, 0));
    root.add(batteryGroup);

    const resistorGroup = new THREE.Group();
    resistorGroup.position.set(0.2, 0.48, -1.2);
    const resMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, emissive: 0x7c2d12, emissiveIntensity: 0.1 });
    const resBody = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.4, 24), resMat);
    resBody.rotation.z = Math.PI / 2;
    resistorGroup.add(resBody);
    for (const bx of [-0.4, -0.1, 0.2, 0.45]) {
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.248, 0.248, 0.08, 24),
        new THREE.MeshStandardMaterial({ color: bx > 0.3 ? 0xfacc15 : 0x38bdf8 })
      );
      band.rotation.z = Math.PI / 2;
      band.position.x = bx;
      resistorGroup.add(band);
    }
    ctx.registerComponent(resistorGroup, 'resistor', 'Ceramic Resistor (R)', new THREE.Vector3(0, 0.3, -0.3), new THREE.Vector3(0, 0.5, 0));
    root.add(resistorGroup);

    const ammeter = createAnalogMeter('A', false, 6, createMeterDialTexture('A', false, 6, ctx.maxAnisotropy));
    ammeter.group.position.set(2.1, 0, 0.2);
    ctx.registerComponent(ammeter.group, 'ammeter', 'Ammeter (I)', new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(0, 1.2, 0));
    root.add(ammeter.group);

    const voltmeter = createAnalogMeter('V', false, 12, createMeterDialTexture('V', false, 12, ctx.maxAnisotropy));
    voltmeter.group.position.set(0.2, 0, 1.2);
    ctx.registerComponent(voltmeter.group, 'voltmeter', 'Voltmeter (V)', new THREE.Vector3(0, 0, 0.3), new THREE.Vector3(0, 1.2, 0));
    root.add(voltmeter.group);

    // Live V-I Characteristic Oscilloscope Console
    const scopeTex = createLiveDisplayTexture(380, 260, ctx.maxAnisotropy);
    const scopeConsole = createBenchConsole(1.5, 1.05, scopeTex.texture);
    scopeConsole.position.set(-2.25, 0.85, -1.35);
    scopeConsole.rotation.y = 0.4;
    root.add(scopeConsole);

    const wireCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-2.1, 0.3, 1.0),
        new THREE.Vector3(-2.1, 0.3, -1.2),
        new THREE.Vector3(2.1, 0.3, -1.2),
        new THREE.Vector3(2.1, 0.3, 1.0),
      ],
      true
    );
    const wireMesh = new THREE.Mesh(
      new THREE.TubeGeometry(wireCurve, 64, 0.045, 10, true),
      makeMetalMaterial(0xd97706, 0.25, 0.88)
    );
    root.add(wireMesh);

    const electrons = Array.from({ length: 16 }, () => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      root.add(m);
      return m;
    });

    let phase = 0;
    let lastDrawKey = '';
    return {
      root,
      defaultCameraPos: [0, 3.8, 5.2],
      defaultTarget: [0, 0.55, 0],
      updateParams: () => {},
      update: (dt, _el, params, playing) => {
        const closed = (params.switchClosed ?? 1) >= 0.5;
        const v = params.voltage ?? 6;
        const r = params.resistance ?? 6;
        const i = closed ? v / r : 0;

        resMat.emissiveIntensity = THREE.MathUtils.clamp((v * i) * 0.04, 0.05, 1.4);
        const aTarget = THREE.MathUtils.clamp((i / 6) * 1.9 - 0.95, -0.95, 0.95);
        const vTarget = THREE.MathUtils.clamp(((closed ? v : 0) / 12) * 1.9 - 0.95, -0.95, 0.95);
        ammeter.needlePivot.rotation.z = THREE.MathUtils.damp(ammeter.needlePivot.rotation.z, -aTarget, 8, dt);
        voltmeter.needlePivot.rotation.z = THREE.MathUtils.damp(voltmeter.needlePivot.rotation.z, -vTarget, 8, dt);

        if (playing && closed) {
          phase = (phase + dt * Math.min(2.2, i * 0.22)) % 1;
        }
        electrons.forEach((e, idx) => {
          e.visible = closed;
          const t = (phase + idx / electrons.length) % 1;
          wireCurve.getPointAt(t, _v1);
          e.position.copy(_v1);
        });

        const key = `${closed ? 1 : 0}|${v}|${r}`;
        if (key !== lastDrawKey) {
          lastDrawKey = key;
          // Update PSU OLED
          const pCtx = psuTex.ctx;
          pCtx.fillStyle = '#05080F';
          pCtx.fillRect(0, 0, 320, 180);
          pCtx.fillStyle = closed ? '#34D399' : '#EF4444';
          pCtx.font = 'bold 20px monospace';
          pCtx.textAlign = 'left';
          pCtx.fillText(closed ? 'OUTPUT ON' : 'SWITCH OPEN', 18, 34);
          pCtx.fillStyle = '#38BDF8';
          pCtx.font = 'bold 46px monospace';
          pCtx.fillText(`${(closed ? v : 0).toFixed(1)} V`, 18, 98);
          pCtx.fillStyle = '#F59E0B';
          pCtx.font = 'bold 34px monospace';
          pCtx.fillText(`${i.toFixed(2)} A  (${r.toFixed(0)} Ω)`, 18, 152);
          psuTex.texture.needsUpdate = true;

          // Update Live V-I Oscilloscope Screen
          const sCtx = scopeTex.ctx;
          sCtx.fillStyle = '#070A10';
          sCtx.fillRect(0, 0, 380, 260);
          sCtx.strokeStyle = 'rgba(148,163,184,0.16)';
          for (let gx = 40; gx < 360; gx += 40) {
            sCtx.beginPath();
            sCtx.moveTo(gx, 36);
            sCtx.lineTo(gx, 224);
            sCtx.stroke();
          }
          const ox = 46;
          const oy = 214;
          const pw = 300;
          const ph = 156;
          sCtx.strokeStyle = '#64748B';
          sCtx.lineWidth = 2;
          sCtx.beginPath();
          sCtx.moveTo(ox, 42);
          sCtx.lineTo(ox, oy);
          sCtx.lineTo(ox + pw, oy);
          sCtx.stroke();

          // Slope line
          const endI = Math.min(6, 12 / r);
          const xEnd = ox + ((endI * r) / 12) * pw;
          const yEnd = oy - (endI / 6) * ph;
          sCtx.strokeStyle = '#38BDF8';
          sCtx.lineWidth = 4;
          sCtx.beginPath();
          sCtx.moveTo(ox, oy);
          sCtx.lineTo(xEnd, yEnd);
          sCtx.stroke();

          const curX = ox + ((closed ? v : 0) / 12) * pw;
          const curY = oy - (Math.min(6, i) / 6) * ph;
          sCtx.fillStyle = '#10B981';
          sCtx.beginPath();
          sCtx.arc(curX, curY, 8, 0, Math.PI * 2);
          sCtx.fill();

          sCtx.fillStyle = '#E2E8F0';
          sCtx.font = 'bold 16px monospace';
          sCtx.textAlign = 'left';
          sCtx.fillText(`V-I TRACE · SLOPE 1/R = ${(1 / r).toFixed(2)} S`, 18, 26);
          sCtx.fillStyle = '#34D399';
          sCtx.fillText(`P = ${(closed ? v * i : 0).toFixed(2)} W`, 250, 244);
          scopeTex.texture.needsUpdate = true;
        }
      },
      getReadouts: (params) => {
        const closed = (params.switchClosed ?? 1) >= 0.5;
        const v = params.voltage ?? 6;
        const r = params.resistance ?? 6;
        const i = closed ? v / r : 0;
        return [
          { label: 'Current (I = V/R)', value: i.toFixed(2), unit: 'A' },
          { label: 'Potential (V)', value: (closed ? v : 0).toFixed(1), unit: 'V' },
          { label: 'Power (P = VI)', value: (closed ? v * i : 0).toFixed(2), unit: 'W' },
        ];
      },
    };
  }

  // P07: Series and Parallel Circuits (With Glowing Filaments + Live Digital Wattmeter Output)
  if (id === 'P07') {
    const source = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.88, 0.74),
      makeMetalMaterial(0x273244, 0.3, 0.8)
    );
    source.position.set(-2.3, 0.44, 0);
    ctx.registerComponent(source, 'source', '12V DC Supply', new THREE.Vector3(-0.3, 0, 0), new THREE.Vector3(0, 1.15, 0));
    root.add(source);

    const makeBulb = (x: number, z: number, color: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.28, 0.28, 20),
        makeMetalMaterial(0xd97706, 0.2, 0.9)
      );
      base.position.y = 0.14;
      const filamentMat = new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        emissive: color,
        emissiveIntensity: 1.0,
      });
      const filament = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 8, 20), filamentMat);
      filament.position.y = 0.58;
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xfef3c7,
        emissive: color,
        emissiveIntensity: 0.45,
        roughness: 0.1,
        transparent: true,
        opacity: 0.65,
        clearcoat: 1.0,
      });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 24), mat);
      globe.position.y = 0.56;
      g.add(base, filament, globe);
      return { g, mat, filamentMat };
    };

    const bulb1 = makeBulb(0.8, -0.9, 0xf59e0b);
    const bulb2 = makeBulb(0.8, 0.9, 0x38bdf8);
    ctx.registerComponent(bulb1.g, 'load1', 'Lamp R₁', new THREE.Vector3(0, 0.3, -0.3), new THREE.Vector3(0, 1.15, 0));
    ctx.registerComponent(bulb2.g, 'load2', 'Lamp R₂', new THREE.Vector3(0, 0.3, 0.3), new THREE.Vector3(0, 1.15, 0));
    root.add(bulb1.g, bulb2.g);

    // Live Wattmeter & Branch Ammeter Console
    const wattTex = createLiveDisplayTexture(380, 260, ctx.maxAnisotropy);
    const wattConsole = createBenchConsole(1.55, 1.05, wattTex.texture);
    wattConsole.position.set(2.45, 0.82, 0);
    wattConsole.rotation.y = -0.52;
    root.add(wattConsole);

    const wireMat = makeMetalMaterial(0x94a3b8, 0.25, 0.88);
    const seriesLoop = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          [
            new THREE.Vector3(-2.3, 0.15, -0.9),
            new THREE.Vector3(0.8, 0.15, -0.9),
            new THREE.Vector3(0.8, 0.15, 0.9),
            new THREE.Vector3(-2.3, 0.15, 0.9),
          ],
          true
        ),
        60,
        0.04,
        8,
        true
      ),
      wireMat
    );
    const parallelRail = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new THREE.Vector3(-2.3, 0.15, 0), new THREE.Vector3(0.8, 0.15, 0)]),
        16,
        0.04,
        8,
        false
      ),
      wireMat
    );
    root.add(seriesLoop, parallelRail);

    let lastKey = '';
    return {
      root,
      defaultCameraPos: [0, 3.8, 5.2],
      defaultTarget: [0.1, 0.45, 0],
      updateParams: () => {},
      update: (_dt, _el, params) => {
        const isParallel = (params.topology ?? 1) >= 0.5;
        const r1 = params.r1 ?? 4;
        const r2 = params.r2 ?? 6;
        parallelRail.visible = isParallel;
        const v = 12;
        const i1 = isParallel ? v / r1 : v / (r1 + r2);
        const i2 = isParallel ? v / r2 : v / (r1 + r2);
        bulb1.mat.emissiveIntensity = THREE.MathUtils.clamp(i1 * 0.48, 0.15, 2.2);
        bulb1.filamentMat.emissiveIntensity = THREE.MathUtils.clamp(i1 * 0.9, 0.3, 3.0);
        bulb2.mat.emissiveIntensity = THREE.MathUtils.clamp(i2 * 0.48, 0.15, 2.2);
        bulb2.filamentMat.emissiveIntensity = THREE.MathUtils.clamp(i2 * 0.9, 0.3, 3.0);

        const key = `${isParallel ? 1 : 0}|${r1}|${r2}`;
        if (key !== lastKey) {
          lastKey = key;
          const req = isParallel ? (r1 * r2) / (r1 + r2) : r1 + r2;
          const iTot = 12 / req;
          const { ctx: c, texture } = wattTex;
          c.fillStyle = '#070A10';
          c.fillRect(0, 0, 380, 260);
          c.fillStyle = isParallel ? '#38BDF8' : '#F59E0B';
          c.font = 'bold 18px monospace';
          c.textAlign = 'left';
          c.fillText(isParallel ? 'TOPOLOGY: PARALLEL' : 'TOPOLOGY: SERIES', 20, 38);
          c.fillStyle = '#F8FAFC';
          c.font = 'bold 28px monospace';
          c.fillText(`R_eq = ${req.toFixed(2)} Ω`, 20, 92);
          c.fillStyle = '#34D399';
          c.fillText(`I_total = ${iTot.toFixed(2)} A`, 20, 138);
          c.fillStyle = '#94A3B8';
          c.font = 'bold 20px monospace';
          c.fillText(`I₁=${i1.toFixed(2)}A   I₂=${i2.toFixed(2)}A`, 20, 188);
          c.fillStyle = '#FBBF24';
          c.fillText(`TOTAL POWER = ${(12 * iTot).toFixed(1)} W`, 20, 228);
          texture.needsUpdate = true;
        }
      },
      getReadouts: (params) => {
        const isParallel = (params.topology ?? 1) >= 0.5;
        const r1 = params.r1 ?? 4;
        const r2 = params.r2 ?? 6;
        const req = isParallel ? (r1 * r2) / (r1 + r2) : r1 + r2;
        return [
          { label: 'Equivalent R_eq', value: req.toFixed(2), unit: 'Ω' },
          { label: 'Total Current (12V)', value: (12 / req).toFixed(2), unit: 'A' },
          { label: 'Topology', value: isParallel ? 'Parallel' : 'Series' },
        ];
      },
    };
  }

  // P08: Magnetic Field Around Bar Magnet (With Compass Field Grid + Live Hall Gaussmeter)
  if (id === 'P08') {
    const magnetGroup = new THREE.Group();
    const north = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.45, 0.55),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.32, metalness: 0.35 })
    );
    north.position.set(-0.65, 0.65, 0);
    const south = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.45, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.32, metalness: 0.35 })
    );
    south.position.set(0.65, 0.65, 0);
    magnetGroup.add(north, south);
    ctx.registerComponent(magnetGroup, 'magnet', 'Alnico Bar Magnet (N-S)', new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0, 1.15, 0));
    root.add(magnetGroup);

    const fieldGroup = new THREE.Group();
    const loopCurves: THREE.CatmullRomCurve3[] = [];
    const fluxDots: THREE.Mesh[] = [];
    for (let ring = 0; ring < 4; ring++) {
      const phi = (ring * Math.PI) / 2;
      for (const scale of [1.1, 1.65]) {
        const pts: THREE.Vector3[] = [];
        for (let s = 0; s <= 32; s++) {
          const t = (s / 32) * Math.PI * 2;
          const x = -Math.cos(t) * 1.45 * scale * 0.8;
          const r = Math.sin(t) * 0.95 * scale;
          const y = 0.65 + Math.cos(phi) * r;
          const z = Math.sin(phi) * r;
          pts.push(new THREE.Vector3(x, Math.max(0.08, y), z));
        }
        const curve = new THREE.CatmullRomCurve3(pts, true);
        loopCurves.push(curve);
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 48, 0.018, 6, true),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 })
        );
        fieldGroup.add(tube);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        fieldGroup.add(dot);
        fluxDots.push(dot);
      }
    }
    ctx.registerComponent(fieldGroup, 'fieldLines', 'Magnetic Flux Loops', new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, 2.1, 0));
    root.add(fieldGroup);

    // Mini dipole compass grid on breadboard
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const mx = Math.cos(a) * 1.9;
      const mz = Math.sin(a) * 1.65;
      const mini = new THREE.Group();
      mini.position.set(mx, 0.06, mz);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 16), makeMetalMaterial(0x334155));
      const ptr = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.18, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      ptr.rotation.x = Math.PI / 2;
      ptr.position.y = 0.03;
      ptr.rotation.y = Math.atan2(Math.sin(2 * a), Math.cos(2 * a) + 0.4);
      mini.add(disc, ptr);
      root.add(mini);
    }

    const compassGroup = new THREE.Group();
    const cCase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.34, 0.14, 24),
      makeMetalMaterial(0xd97706, 0.24, 0.9)
    );
    cCase.position.y = 0.07;
    const needle = new THREE.Group();
    needle.position.y = 0.16;
    const nTip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    nTip.rotation.x = Math.PI / 2;
    nTip.position.z = 0.1;
    const sTip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 8), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
    sTip.rotation.x = -Math.PI / 2;
    sTip.position.z = -0.1;
    needle.add(nTip, sTip);
    compassGroup.add(cCase, needle);
    ctx.registerComponent(compassGroup, 'compass', 'Plotting Compass', new THREE.Vector3(0, 0, 0.4), new THREE.Vector3(0, 0.5, 0));
    root.add(compassGroup);

    // Live Hall-Effect Gaussmeter Display
    const gaussTex = createLiveDisplayTexture(360, 240, ctx.maxAnisotropy);
    const gaussConsole = createBenchConsole(1.45, 0.98, gaussTex.texture);
    gaussConsole.position.set(2.55, 0.8, -1.65);
    gaussConsole.rotation.y = -0.5;
    root.add(gaussConsole);

    let fluxPhase = 0;
    let lastKey = '';
    return {
      root,
      defaultCameraPos: [0, 3.4, 5.4],
      defaultTarget: [0, 0.8, 0],
      updateParams: () => {},
      update: (dt, _el, params, playing) => {
        const strength = params.strength ?? 1.2;
        const angDeg = params.compassAngle ?? 45;
        const ang = THREE.MathUtils.degToRad(angDeg);
        compassGroup.position.set(Math.cos(ang) * 2.2, 0, Math.sin(ang) * 2.2);
        needle.rotation.y = Math.atan2(Math.sin(2 * ang), Math.cos(2 * ang) + 0.4);

        if (playing) {
          fluxPhase = (fluxPhase + dt * 0.28 * strength) % 1;
        }
        loopCurves.forEach((curve, idx) => {
          curve.getPointAt((fluxPhase + idx * 0.13) % 1, _v1);
          fluxDots[idx].position.copy(_v1);
        });

        const key = `${strength}|${angDeg}`;
        if (key !== lastKey) {
          lastKey = key;
          const bMilliTesla = strength * (18 + 12 * Math.abs(Math.cos(ang)));
          const { ctx: c, texture } = gaussTex;
          c.fillStyle = '#070A10';
          c.fillRect(0, 0, 360, 240);
          c.fillStyle = '#94A3B8';
          c.font = 'bold 16px monospace';
          c.textAlign = 'left';
          c.fillText('HALL GAUSSMETER OUTPUT', 18, 34);
          c.fillStyle = '#38BDF8';
          c.font = 'bold 46px monospace';
          c.fillText(`${bMilliTesla.toFixed(1)} mT`, 18, 108);
          c.fillStyle = '#FACC15';
          c.font = 'bold 20px monospace';
          c.fillText(`AZIMUTH θ = ${angDeg}°`, 18, 162);
          c.fillStyle = '#34D399';
          c.fillText(`DIPOLE B₀ = ${strength.toFixed(1)} T`, 18, 204);
          texture.needsUpdate = true;
        }
      },
      getReadouts: (params) => [
        { label: 'Flux Density (B)', value: (params.strength ?? 1.2).toFixed(1), unit: 'T' },
        { label: 'Compass Azimuth', value: String(params.compassAngle ?? 45), unit: '°' },
      ],
    };
  }

  // P09: Electric Motor & Generator (With Laminated Stator + Load Bulb + Live EMF Oscilloscope)
  if (id === 'P09') {
    const statorGroup = new THREE.Group();
    const nPole = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 1.35, 1.55),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.36, metalness: 0.3 })
    );
    nPole.position.set(-1.55, 1.2, 0);
    const sPole = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 1.35, 1.55),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.36, metalness: 0.3 })
    );
    sPole.position.set(1.55, 1.2, 0);
    const yoke = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.2, 1.4),
      makeMetalMaterial(0x273244, 0.35, 0.8)
    );
    yoke.position.set(0, 0.1, 0);
    statorGroup.add(nPole, sPole, yoke);
    ctx.registerComponent(statorGroup, 'stator', 'Stator Poles & Yoke', new THREE.Vector3(0, 0, -0.5), new THREE.Vector3(-1.6, 2.0, 0));
    root.add(statorGroup);

    const rotor = new THREE.Group();
    rotor.position.set(0, 1.2, 0);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.1, 16), makeMetalMaterial(0x94a3b8));
    shaft.rotation.x = Math.PI / 2;
    rotor.add(shaft);

    const coilPoints = [
      new THREE.Vector3(-0.75, 0, -0.7),
      new THREE.Vector3(0.75, 0, -0.7),
      new THREE.Vector3(0.75, 0, 0.7),
      new THREE.Vector3(-0.75, 0, 0.7),
    ];
    const armatureLoop = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPoints, true), 40, 0.055, 10, true),
      makeMetalMaterial(0xd97706, 0.2, 0.92)
    );
    rotor.add(armatureLoop);
    ctx.registerComponent(rotor, 'armature', 'Armature Coil', new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0, 0.65, 0));
    root.add(rotor);

    const commGroup = new THREE.Group();
    commGroup.position.set(0, 1.2, 1.1);
    const half1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.35, 20, 1, false, 0.15, Math.PI - 0.3),
      makeMetalMaterial(0xf59e0b)
    );
    half1.rotation.x = Math.PI / 2;
    const half2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.35, 20, 1, false, Math.PI + 0.15, Math.PI - 0.3),
      makeMetalMaterial(0xf59e0b)
    );
    half2.rotation.x = Math.PI / 2;
    const brushL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.25), makeMetalMaterial(0x475569, 0.6, 0.4));
    brushL.position.x = -0.32;
    const brushR = brushL.clone();
    brushR.position.x = 0.32;
    commGroup.add(half1, half2, brushL, brushR);
    ctx.registerComponent(commGroup, 'commutator', 'Split-Ring Commutator', new THREE.Vector3(0, 0, 0.65), new THREE.Vector3(0, 0.45, 0));
    root.add(commGroup);

    // Live EMF & Torque Waveform Oscilloscope
    const emfTex = createLiveDisplayTexture(380, 260, ctx.maxAnisotropy);
    const emfConsole = createBenchConsole(1.55, 1.05, emfTex.texture);
    emfConsole.position.set(2.55, 0.85, 1.45);
    emfConsole.rotation.y = -0.58;
    root.add(emfConsole);

    let wavePhase = 0;
    let drawAccum = 0;
    return {
      root,
      defaultCameraPos: [2.2, 2.7, 5.1],
      defaultTarget: [0.2, 1.1, 0.2],
      updateParams: () => {},
      update: (dt, _el, params, playing) => {
        const speed = (params.driveLevel ?? 1.2) * (params.fieldStrength ?? 1.0);
        const isGen = (params.mode ?? 0) >= 0.5;
        if (playing) {
          rotor.rotation.z += dt * speed * 2.2;
          half1.rotation.y = rotor.rotation.z;
          half2.rotation.y = rotor.rotation.z;
          wavePhase += dt * speed * 3.5;
        }
        drawAccum += dt;
        if (drawAccum > 0.05) {
          drawAccum = 0;
          const { ctx: c, texture } = emfTex;
          c.fillStyle = '#070A10';
          c.fillRect(0, 0, 380, 260);
          c.strokeStyle = 'rgba(148,163,184,0.18)';
          c.beginPath();
          c.moveTo(20, 130);
          c.lineTo(360, 130);
          c.stroke();

          c.strokeStyle = isGen ? '#34D399' : '#38BDF8';
          c.lineWidth = 4;
          c.beginPath();
          const amp = Math.min(68, speed * 36);
          for (let px = 20; px <= 360; px += 4) {
            const val = isGen
              ? Math.abs(Math.sin(((px - 20) / 340) * Math.PI * 4 + wavePhase)) * amp
              : Math.sin(((px - 20) / 340) * Math.PI * 4 + wavePhase) * amp;
            const py = 130 - val + (isGen ? 22 : 0);
            if (px === 20) c.moveTo(px, py);
            else c.lineTo(px, py);
          }
          c.stroke();

          const rpm = Math.round(speed * 180);
          c.fillStyle = '#94A3B8';
          c.font = 'bold 16px monospace';
          c.textAlign = 'left';
          c.fillText(isGen ? 'GENERATOR EMF TRACE' : 'MOTOR TORQUE WAVE', 20, 30);
          c.fillStyle = '#F8FAFC';
          c.font = 'bold 20px monospace';
          c.fillText(`${rpm} RPM  |  B=${(params.fieldStrength ?? 1.0).toFixed(1)}T`, 20, 236);
          texture.needsUpdate = true;
        }
      },
      getReadouts: (params) => {
        const isGen = (params.mode ?? 0) >= 0.5;
        const rpm = Math.round((params.driveLevel ?? 1.2) * (params.fieldStrength ?? 1.0) * 180);
        return [
          { label: 'Operating Mode', value: isGen ? 'Generator' : 'DC Motor' },
          { label: 'Rotor Speed', value: String(rpm), unit: 'RPM' },
          { label: 'Rule', value: isGen ? 'Fleming Right-Hand' : 'Fleming Left-Hand' },
        ];
      },
    };
  }

  // P10: Electromagnetic Induction (Solenoid + Moving Magnet + Galvanometer + Bi-Polar Lenz LEDs + Pulse Scope)
  const coilGroup = new THREE.Group();
  coilGroup.position.set(-0.7, 1.0, 0);
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 2.0, 24, 1, true),
    makeGlassMaterial(0xdbeafe, ctx.isSoftwareGl, 0.35)
  );
  tube.rotation.z = Math.PI / 2;
  coilGroup.add(tube);
  let coilMesh = createHelicalCoil(0.5, 1.9, 8, 0.04, 0xd97706);
  coilGroup.add(coilMesh);
  ctx.registerComponent(coilGroup, 'coil', 'Copper Solenoid', new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0, 0.7, 0));
  root.add(coilGroup);

  const magnetGroup = new THREE.Group();
  const magN = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.7, 20),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.32 })
  );
  magN.rotation.z = Math.PI / 2;
  magN.position.x = 0.35;
  const magS = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.7, 20),
    new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.32 })
  );
  magS.rotation.z = Math.PI / 2;
  magS.position.x = -0.35;
  magnetGroup.add(magN, magS);
  magnetGroup.position.set(1.4, 1.0, 0);
  ctx.registerComponent(magnetGroup, 'magnet', 'Moving Bar Magnet', new THREE.Vector3(0.4, 0, 0), new THREE.Vector3(0, 0.45, 0));
  root.add(magnetGroup);

  const galv = createAnalogMeter('G', true, 10, createMeterDialTexture('G', true, 10, ctx.maxAnisotropy));
  galv.group.position.set(-0.7, 0, 1.6);
  ctx.registerComponent(galv.group, 'galvanometer', 'Galvanometer', new THREE.Vector3(0, 0, 0.4), new THREE.Vector3(0, 1.15, 0));
  root.add(galv.group);

  // Dual Bi-Polar Indicator LEDs (+ Cyan / - Amber) on top of Galvanometer
  const posLedMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.1 });
  const negLedMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.1 });
  const posLed = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), posLedMat);
  posLed.position.set(-0.5, 0.98, 1.6);
  const negLed = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), negLedMat);
  negLed.position.set(-0.9, 0.98, 1.6);
  root.add(posLed, negLed);

  // Live Faraday Induction Pulse Oscilloscope
  const indTex = createLiveDisplayTexture(380, 260, ctx.maxAnisotropy);
  const indConsole = createBenchConsole(1.55, 1.05, indTex.texture);
  indConsole.position.set(-2.35, 0.85, -1.25);
  indConsole.rotation.y = 0.48;
  root.add(indConsole);

  let prevMagX = 1.4;
  let lastTurns = 8;
  let inducedVal = 0;
  const emfHistory = new Array(60).fill(0);
  let drawAccum = 0;

  return {
    root,
    defaultCameraPos: [0.5, 2.8, 5.2],
    defaultTarget: [-0.2, 0.9, 0.2],
    updateParams: (params) => {
      const turns = Math.round(params.coilTurns ?? 8);
      if (turns !== lastTurns) {
        lastTurns = turns;
        coilGroup.remove(coilMesh);
        coilMesh.geometry.dispose();
        coilMesh = createHelicalCoil(0.5, 1.9, turns, 0.04, 0xd97706);
        coilGroup.add(coilMesh);
      }
    },
    update: (dt, elapsed, params, playing) => {
      const auto = (params.autoOscillate ?? 1) >= 0.5;
      const targetX = auto && playing ? 0.5 + Math.sin(elapsed * 2.2) * 1.4 : 0.8 + (params.magnetOffset ?? 0) * 0.5;
      magnetGroup.position.x = THREE.MathUtils.damp(magnetGroup.position.x, targetX, 10, dt);
      const velocity = (magnetGroup.position.x - prevMagX) / Math.max(0.008, dt);
      prevMagX = magnetGroup.position.x;

      const proximity = Math.exp(-Math.pow(magnetGroup.position.x + 0.2, 2) * 0.9);
      inducedVal = THREE.MathUtils.clamp(-velocity * proximity * (lastTurns / 8) * 0.35, -1, 1);
      galv.needlePivot.rotation.z = THREE.MathUtils.damp(galv.needlePivot.rotation.z, -inducedVal * 0.9, 12, dt);

      posLedMat.emissiveIntensity = inducedVal > 0.04 ? Math.min(2.6, inducedVal * 3.0) : 0.08;
      negLedMat.emissiveIntensity = inducedVal < -0.04 ? Math.min(2.6, -inducedVal * 3.0) : 0.08;

      drawAccum += dt;
      if (drawAccum > 0.05) {
        drawAccum = 0;
        emfHistory.push(inducedVal);
        if (emfHistory.length > 60) emfHistory.shift();

        const { ctx: c, texture } = indTex;
        c.fillStyle = '#070A10';
        c.fillRect(0, 0, 380, 260);
        c.strokeStyle = 'rgba(148,163,184,0.22)';
        c.beginPath();
        c.moveTo(20, 130);
        c.lineTo(360, 130);
        c.stroke();

        c.strokeStyle = inducedVal >= 0 ? '#38BDF8' : '#F59E0B';
        c.lineWidth = 4;
        c.beginPath();
        emfHistory.forEach((v, idx) => {
          const px = 20 + (idx / (emfHistory.length - 1)) * 340;
          const py = 130 - v * 72;
          if (idx === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        });
        c.stroke();

        c.fillStyle = '#94A3B8';
        c.font = 'bold 16px monospace';
        c.textAlign = 'left';
        c.fillText('FARADAY INDUCTION PULSE', 20, 32);
        c.fillStyle = '#F8FAFC';
        c.font = 'bold 20px monospace';
        c.fillText(`I = ${(inducedVal * 5).toFixed(2)} mA  |  N = ${lastTurns}`, 20, 236);
        texture.needsUpdate = true;
      }
    },
    getReadouts: (params) => [
      { label: 'Induced Current', value: (inducedVal * 5).toFixed(2), unit: 'mA' },
      { label: 'Coil Turns (N)', value: String(Math.round(params.coilTurns ?? 8)), unit: 'turns' },
    ],
  };
}
