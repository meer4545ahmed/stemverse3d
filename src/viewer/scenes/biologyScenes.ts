import * as THREE from 'three';
import { ActiveLabScene, LabSceneContext } from './sceneTypes';
import { makeGlassMaterial, makeMetalMaterial } from './sceneHelpers';
import {
  createBrainCortexTexture,
  createIrisTexture,
  createLeafVenationTexture,
  createMyocardiumTexture,
  createRetinaTexture,
} from '../materials/proceduralTextures';

const _v = new THREE.Vector3();

function makeOrganicMat(
  color: number,
  roughness = 0.34,
  map?: THREE.Texture,
  bumpMap?: THREE.Texture
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    map,
    bumpMap,
    bumpScale: bumpMap ? 0.045 : 0,
    roughness,
    metalness: 0.02,
    clearcoat: 0.55,
    clearcoatRoughness: 0.25,
  });
}

function createSculptedHeartVentricleProfile(scaleX = 1.0): THREE.LatheGeometry {
  // Asymmetric conical heart apex profile
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.01, -0.95),
    new THREE.Vector2(0.22 * scaleX, -0.82),
    new THREE.Vector2(0.45 * scaleX, -0.52),
    new THREE.Vector2(0.58 * scaleX, -0.1),
    new THREE.Vector2(0.56 * scaleX, 0.28),
    new THREE.Vector2(0.42 * scaleX, 0.48),
    new THREE.Vector2(0.01, 0.5),
  ];
  return new THREE.LatheGeometry(pts, 36);
}

function createSculptedEyeGroup(
  ctx: LabSceneContext,
  includeLens = false
): {
  group: THREE.Group;
  irisDisc: THREE.Mesh;
  pupilDisc: THREE.Mesh;
  eyeLensMesh?: THREE.Mesh;
} {
  const group = new THREE.Group();

  // 1. Fibrous Sclera (warm pearl-ivory outer shell with cutaway front window)
  const scleraGroup = new THREE.Group();
  const scleraMat = makeOrganicMat(0xf4f1ea, 0.28);
  scleraMat.side = THREE.DoubleSide;
  const sclera = new THREE.Mesh(
    new THREE.SphereGeometry(1.28, 40, 40, 0, Math.PI * 1.62, 0.12, Math.PI - 0.24),
    scleraMat
  );
  sclera.rotation.y = 0.28;
  sclera.castShadow = true;

  // Vascular Choroid mid-layer (deep maroon-brown visible along cutaway rim)
  const choroidMat = makeOrganicMat(0x581c1c, 0.42);
  choroidMat.side = THREE.DoubleSide;
  const choroid = new THREE.Mesh(
    new THREE.SphereGeometry(1.22, 36, 36, 0, Math.PI * 1.58, 0.14, Math.PI - 0.28),
    choroidMat
  );
  choroid.rotation.y = 0.29;

  // 4 Extraocular Rectus Muscles attaching to sclera
  const muscleMat = makeOrganicMat(0xb91c1c, 0.42);
  const muscleOffsets: [number, number, number, number][] = [
    [0.25, 1.15, 0, -0.25], // Superior rectus
    [0.25, -1.15, 0, 0.25], // Inferior rectus
    [0.25, 0, 1.12, 0], // Lateral rectus
    [0.25, 0, -1.12, 0], // Medial rectus
  ];
  muscleOffsets.forEach(([mx, my, mz, rz]) => {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.16, 0.28), muscleMat);
    strap.position.set(mx, my, mz);
    strap.rotation.z = rz;
    if (Math.abs(mz) > 0.5) {
      strap.rotation.set(0, mz > 0 ? 0.25 : -0.25, 0);
      strap.scale.set(1, 1.6, 0.55);
    }
    scleraGroup.add(strap);
  });

  scleraGroup.add(sclera, choroid);
  ctx.registerComponent(
    scleraGroup,
    'sclera',
    'Sclera, Choroid & Rectus Muscles',
    new THREE.Vector3(0, 0, -0.55),
    new THREE.Vector3(0, 1.42, 0)
  );

  // 2. Sculpted Anterior Cornea Dome (Protruding refractive dome)
  const corneaGroup = new THREE.Group();
  const corneaPts: THREE.Vector2[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const ang = t * (Math.PI * 0.46);
    corneaPts.push(new THREE.Vector2(Math.sin(ang) * 0.68, Math.cos(ang) * 0.52 - 0.08));
  }
  const corneaGeo = new THREE.LatheGeometry(corneaPts, 36);
  corneaGeo.rotateZ(Math.PI / 2);
  const corneaMesh = new THREE.Mesh(corneaGeo, makeGlassMaterial(0xdbeafe, ctx.isSoftwareGl, 0.36, 1.38));
  corneaMesh.position.set(-1.12, 0, 0);
  // Limbus junction ring
  const limbus = new THREE.Mesh(
    new THREE.TorusGeometry(0.66, 0.032, 12, 36),
    makeOrganicMat(0xcbd5e1, 0.3)
  );
  limbus.rotation.y = Math.PI / 2;
  limbus.position.set(-1.08, 0, 0);
  corneaGroup.add(corneaMesh, limbus);
  ctx.registerComponent(
    corneaGroup,
    'cornea',
    'Cornea (Anterior Chamber)',
    new THREE.Vector3(-0.7, 0, 0),
    new THREE.Vector3(-1.48, 0.65, 0)
  );

  // 3. Textured Iris, Dynamic Pupil, Ciliary Body & Suspensory Zonules
  const irisGroup = new THREE.Group();
  const irisTex = createIrisTexture();
  const irisMat = new THREE.MeshStandardMaterial({
    map: irisTex,
    roughness: 0.42,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const irisDisc = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.58, 48), irisMat);
  irisDisc.rotation.y = Math.PI / 2;
  irisDisc.position.set(-0.96, 0, 0);

  const pupilDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.22, 32),
    new THREE.MeshBasicMaterial({ color: 0x05070b, side: THREE.DoubleSide })
  );
  pupilDisc.rotation.y = Math.PI / 2;
  pupilDisc.position.set(-0.955, 0, 0);

  // Ciliary body pleated ring + suspensory zonule ligaments
  const ciliaryBody = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.08, 14, 36),
    makeOrganicMat(0xbe123c, 0.45)
  );
  ciliaryBody.rotation.y = Math.PI / 2;
  ciliaryBody.position.set(-0.74, 0, 0);
  irisGroup.add(irisDisc, pupilDisc, ciliaryBody);

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const zonule = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.24, 6),
      new THREE.MeshBasicMaterial({ color: 0xe2e8f0 })
    );
    zonule.position.set(-0.68, Math.sin(a) * 0.48, Math.cos(a) * 0.48);
    zonule.rotation.x = a;
    irisGroup.add(zonule);
  }
  ctx.registerComponent(
    irisGroup,
    'iris',
    'Iris, Pupil & Ciliary Body',
    new THREE.Vector3(-0.35, 0, 0),
    new THREE.Vector3(-0.98, 0.72, 0)
  );

  // Optional Crystalline Lens
  let eyeLensMesh: THREE.Mesh | undefined;
  if (includeLens) {
    const lensPts: THREE.Vector2[] = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const r = t * 0.42;
      const z = 0.03 + 0.16 * (1 - t * t);
      lensPts.push(new THREE.Vector2(r, z));
    }
    for (let i = 14; i >= 0; i--) {
      const t = i / 14;
      const r = t * 0.42;
      const z = -(0.03 + 0.16 * (1 - t * t));
      lensPts.push(new THREE.Vector2(r, z));
    }
    const lensGeo = new THREE.LatheGeometry(lensPts, 36);
    lensGeo.rotateZ(Math.PI / 2);
    eyeLensMesh = new THREE.Mesh(lensGeo, makeGlassMaterial(0xe0f2fe, ctx.isSoftwareGl, 0.55, 1.42));
    eyeLensMesh.position.set(-0.64, 0, 0);
    ctx.registerComponent(
      eyeLensMesh,
      'lens',
      'Crystalline Lens',
      new THREE.Vector3(0, 0.35, 0.4),
      new THREE.Vector3(-0.64, 0.65, 0)
    );
    group.add(eyeLensMesh);
  }

  // 4. Vascularized Retina Fundus, Macula & Optic Nerve Trunk
  const retinaGroup = new THREE.Group();
  const retinaTex = createRetinaTexture();
  const retinaMat = makeOrganicMat(0xffffff, 0.48, retinaTex);
  retinaMat.side = THREE.DoubleSide;
  const retina = new THREE.Mesh(
    new THREE.SphereGeometry(1.16, 36, 36, -Math.PI * 0.46, Math.PI * 0.92, 0.25, Math.PI - 0.5),
    retinaMat
  );
  retina.position.set(0.06, 0, 0);
  retina.rotation.y = Math.PI;

  // Thick Myelinated Optic Nerve exiting posteriorly
  const nerveCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.14, -0.08, -0.12),
    new THREE.Vector3(1.55, -0.14, -0.18),
    new THREE.Vector3(2.05, -0.22, -0.26),
  ]);
  const opticNerve = new THREE.Mesh(
    new THREE.TubeGeometry(nerveCurve, 20, 0.21, 16, false),
    makeOrganicMat(0xfef3c7, 0.42)
  );
  // Central retinal artery/vein running along nerve sheath
  const retinalVein = new THREE.Mesh(
    new THREE.TubeGeometry(nerveCurve, 20, 0.055, 10, false),
    makeOrganicMat(0x2563eb, 0.35)
  );
  retinalVein.position.y += 0.14;

  retinaGroup.add(retina, opticNerve, retinalVein);
  ctx.registerComponent(
    retinaGroup,
    'retina',
    'Retina, Macula & Optic Nerve',
    new THREE.Vector3(0.65, 0, 0),
    new THREE.Vector3(1.35, 0.55, 0)
  );

  group.add(scleraGroup, corneaGroup, irisGroup, retinaGroup);
  return { group, irisDisc, pupilDisc, eyeLensMesh };
}

export function buildBiologyScene(id: string, ctx: LabSceneContext): ActiveLabScene {
  const root = new THREE.Group();

  // =========================================================
  // B01: HUMAN HEART (Realistic Multi-Chambered Anatomical Heart)
  // =========================================================
  if (id === 'B01') {
    const heartGroup = new THREE.Group();
    heartGroup.position.set(0, 1.55, 0);
    // Natural anatomical tilt toward left apex
    heartGroup.rotation.z = -0.16;

    const myoTex = createMyocardiumTexture('#A31D24', '#450A0A');
    const rightMyoTex = createMyocardiumTexture('#881337', '#1E3A8A');

    // 1. Right Atrium + Right Ventricle (Deoxygenated side)
    const rightSide = new THREE.Group();
    const rvGeo = createSculptedHeartVentricleProfile(0.82);
    const rVentricle = new THREE.Mesh(rvGeo, makeOrganicMat(0x9f1239, 0.32, rightMyoTex));
    rVentricle.scale.set(0.95, 1.0, 0.78);
    rVentricle.position.set(-0.34, -0.22, 0.22);
    rVentricle.rotation.set(0.12, 0.2, 0.25);
    rVentricle.castShadow = true;

    const rAtrium = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 28, 24),
      makeOrganicMat(0x7f1d1d, 0.34, rightMyoTex)
    );
    rAtrium.scale.set(1.05, 0.92, 0.88);
    rAtrium.position.set(-0.56, 0.45, 0.08);
    // Right Auricle appendage
    const rAuricle = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.36, 16),
      makeOrganicMat(0x6b1420, 0.36)
    );
    rAuricle.position.set(-0.42, 0.56, 0.38);
    rAuricle.rotation.set(0.9, 0, -0.5);

    // Subtle venous tint marker band on right chambers
    const venousTint = new THREE.Mesh(
      new THREE.TorusGeometry(0.41, 0.035, 10, 28),
      makeOrganicMat(0x2563eb, 0.3)
    );
    venousTint.position.set(-0.56, 0.45, 0.08);
    venousTint.rotation.x = Math.PI / 2;

    rightSide.add(rVentricle, rAtrium, rAuricle, venousTint);
    ctx.registerComponent(
      rightSide,
      'rightSide',
      'Right Atrium & Ventricle',
      new THREE.Vector3(-0.65, 0, 0.2),
      new THREE.Vector3(-0.82, 0.45, 0.2)
    );

    // 2. Left Atrium + Thick-Walled Left Ventricle + Muscular Apex + Coronary Tree
    const leftSide = new THREE.Group();
    const lvGeo = createSculptedHeartVentricleProfile(1.0);
    const lVentricle = new THREE.Mesh(lvGeo, makeOrganicMat(0xb91c1c, 0.28, myoTex));
    lVentricle.scale.set(1.05, 1.18, 0.92);
    lVentricle.position.set(0.24, -0.32, -0.05);
    lVentricle.rotation.set(0, 0, -0.28);
    lVentricle.castShadow = true;

    const lAtrium = new THREE.Mesh(
      new THREE.SphereGeometry(0.43, 28, 24),
      makeOrganicMat(0xdc2626, 0.3, myoTex)
    );
    lAtrium.scale.set(1.0, 0.9, 0.9);
    lAtrium.position.set(0.5, 0.48, -0.14);

    // Epicardial Coronary Artery Tree (LAD + Circumflex wrapping over myocardium)
    const ladCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, 0.32, 0.44),
      new THREE.Vector3(0.05, 0.0, 0.56),
      new THREE.Vector3(0.22, -0.45, 0.48),
      new THREE.Vector3(0.45, -0.88, 0.24),
    ]);
    const ladArtery = new THREE.Mesh(
      new THREE.TubeGeometry(ladCurve, 28, 0.036, 10, false),
      makeOrganicMat(0xef4444, 0.22)
    );
    const diagCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 0.0, 0.56),
      new THREE.Vector3(0.38, -0.18, 0.44),
      new THREE.Vector3(0.58, -0.42, 0.22),
    ]);
    const diagArtery = new THREE.Mesh(
      new THREE.TubeGeometry(diagCurve, 18, 0.024, 8, false),
      makeOrganicMat(0xef4444, 0.22)
    );
    const circumflexCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, 0.32, 0.44),
      new THREE.Vector3(-0.34, 0.14, 0.52),
      new THREE.Vector3(-0.56, -0.18, 0.34),
    ]);
    const circumflexVein = new THREE.Mesh(
      new THREE.TubeGeometry(circumflexCurve, 18, 0.026, 8, false),
      makeOrganicMat(0x2563eb, 0.28)
    );

    leftSide.add(lVentricle, lAtrium, ladArtery, diagArtery, circumflexVein);
    ctx.registerComponent(
      leftSide,
      'leftSide',
      'Left Atrium, Ventricle & Coronary Tree',
      new THREE.Vector3(0.65, 0, -0.15),
      new THREE.Vector3(0.85, 0.35, 0)
    );

    // 3. Aortic Arch (with 3 Superior Branches), Superior/Inferior Vena Cava & Bifurcating Pulmonary Trunk
    const vessels = new THREE.Group();
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 0.25, 0.02),
      new THREE.Vector3(0.08, 0.92, 0.06),
      new THREE.Vector3(0.32, 1.24, -0.08),
      new THREE.Vector3(0.58, 1.08, -0.32),
      new THREE.Vector3(0.52, -0.35, -0.48),
    ]);
    const aortaMesh = new THREE.Mesh(
      new THREE.TubeGeometry(aortaCurve, 44, 0.17, 18, false),
      makeOrganicMat(0xef4444, 0.26)
    );
    aortaMesh.castShadow = true;

    // 3 Superior Aortic Arch Branches (Brachiocephalic, Left Common Carotid, Left Subclavian)
    const archBranches: [number, number, number][] = [
      [0.14, 1.18, 0.0],
      [0.29, 1.24, -0.06],
      [0.44, 1.2, -0.15],
    ];
    archBranches.forEach(([bx, by, bz], idx) => {
      const br = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.062, 0.38, 14),
        makeOrganicMat(0xef4444, 0.28)
      );
      br.position.set(bx, by + 0.16, bz);
      br.rotation.z = (idx - 1) * -0.16;
      vessels.add(br);
    });

    // Superior & Inferior Vena Cava
    const svcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.62, 1.32, 0.05),
      new THREE.Vector3(-0.6, 0.85, 0.08),
      new THREE.Vector3(-0.56, 0.48, 0.08),
    ]);
    const svcMesh = new THREE.Mesh(
      new THREE.TubeGeometry(svcCurve, 22, 0.15, 16, false),
      makeOrganicMat(0x1d4ed8, 0.32)
    );
    const ivcMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.15, 0.65, 16),
      makeOrganicMat(0x1e40af, 0.34)
    );
    ivcMesh.position.set(-0.56, -0.55, -0.18);

    // Pulmonary Trunk bifurcating into Left & Right Pulmonary Arteries
    const pulmTrunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.22, 0.18, 0.28),
      new THREE.Vector3(-0.16, 0.78, 0.24),
      new THREE.Vector3(-0.08, 0.96, 0.08),
    ]);
    const pulmTrunk = new THREE.Mesh(
      new THREE.TubeGeometry(pulmTrunkCurve, 24, 0.135, 16, false),
      makeOrganicMat(0x4f46e5, 0.3)
    );
    const leftPulmArt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.11, 0.68, 14),
      makeOrganicMat(0x4f46e5, 0.3)
    );
    leftPulmArt.rotation.z = Math.PI / 2;
    leftPulmArt.position.set(0.24, 0.96, 0.08);
    const rightPulmArt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.11, 0.65, 14),
      makeOrganicMat(0x4f46e5, 0.3)
    );
    rightPulmArt.rotation.z = Math.PI / 2;
    rightPulmArt.position.set(-0.38, 0.94, 0.05);

    // 4 Pulmonary Veins entering Left Atrium
    for (const py of [0.56, 0.38]) {
      const pv = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.45, 12),
        makeOrganicMat(0xdc2626, 0.3)
      );
      pv.rotation.z = Math.PI / 2;
      pv.position.set(0.84, py, -0.18);
      vessels.add(pv);
    }

    vessels.add(aortaMesh, svcMesh, ivcMesh, pulmTrunk, leftPulmArt, rightPulmArt);
    ctx.registerComponent(
      vessels,
      'aorta',
      'Aorta, Vena Cava & Pulmonary Trunk',
      new THREE.Vector3(0, 0.72, 0),
      new THREE.Vector3(0.32, 1.48, 0)
    );

    // 4. Cardiac Valves (Cusps + Chordae Tendineae visible inside cutaway)
    const valves = new THREE.Group();
    const valveMat = makeOrganicMat(0xfef3c7, 0.32);
    const ringMat = makeOrganicMat(0xf59e0b, 0.35);
    const addValveAssembly = (vx: number, vy: number, vz: number, leaflets: number) => {
      const vg = new THREE.Group();
      vg.position.set(vx, vy, vz);
      const annulus = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 10, 24), ringMat);
      annulus.rotation.x = Math.PI / 2;
      vg.add(annulus);
      for (let k = 0; k < leaflets; k++) {
        const a = (k / leaflets) * Math.PI * 2;
        const cusp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10, 0, Math.PI, 0, Math.PI * 0.55), valveMat);
        cusp.position.set(Math.cos(a) * 0.06, -0.02, Math.sin(a) * 0.06);
        cusp.rotation.z = Math.PI;
        vg.add(cusp);

        // Delicate chordae tendineae tethering cusps to papillary muscles
        const chord = new THREE.Mesh(
          new THREE.CylinderGeometry(0.009, 0.009, 0.28, 6),
          valveMat
        );
        chord.position.set(Math.cos(a) * 0.07, -0.16, Math.sin(a) * 0.07);
        vg.add(chord);
      }
      valves.add(vg);
    };
    addValveAssembly(-0.36, 0.16, 0.24, 3); // Tricuspid (3 cusps)
    addValveAssembly(0.34, 0.16, 0.18, 2); // Mitral/Bicuspid (2 cusps)
    ctx.registerComponent(
      valves,
      'valves',
      'Tricuspid & Bicuspid Valves',
      new THREE.Vector3(0, 0, 0.72),
      new THREE.Vector3(0, 0.2, 0.52)
    );

    heartGroup.add(rightSide, leftSide, vessels, valves);
    root.add(heartGroup);

    // Double circulation blood particles
    const rightPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.62, 1.3, 0.05),
      new THREE.Vector3(-0.56, 0.45, 0.08),
      new THREE.Vector3(-0.34, -0.25, 0.22),
      new THREE.Vector3(-0.16, 0.78, 0.24),
      new THREE.Vector3(-0.62, 0.94, 0.05),
    ]);
    const leftPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.88, 0.54, -0.18),
      new THREE.Vector3(0.5, 0.48, -0.14),
      new THREE.Vector3(0.24, -0.35, -0.05),
      new THREE.Vector3(0.08, 0.92, 0.06),
      new THREE.Vector3(0.58, 1.08, -0.32),
    ]);
    const blueCells = Array.from({ length: 8 }, () => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.052, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0x2563eb })
      );
      heartGroup.add(m);
      return m;
    });
    const redCells = Array.from({ length: 8 }, () => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.052, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      heartGroup.add(m);
      return m;
    });

    let beatPhase = 0;
    return {
      root,
      defaultCameraPos: [0.2, 2.1, 4.6],
      defaultTarget: [0, 1.65, 0],
      updateParams: () => {},
      update: (dt, _el, params, playing) => {
        const bpm = params.bpm ?? 72;
        if (playing) {
          beatPhase = (beatPhase + dt * (bpm / 60)) % 1;
        }
        // Realistic two-stage lub-dub contraction: atrial kick then ventricular systole
        const atrialPulse = 1 + Math.pow(Math.sin(Math.min(1, beatPhase * 2.5) * Math.PI), 4) * 0.065;
        const ventPulse = 1 + Math.pow(Math.sin(Math.max(0, (beatPhase - 0.18) * 1.4) * Math.PI), 4) * 0.085;
        rAtrium.scale.set(1.05 * atrialPulse, 0.92 * atrialPulse, 0.88 * atrialPulse);
        lAtrium.scale.setScalar(atrialPulse);
        rVentricle.scale.set(0.95 * ventPulse, 1.0 * ventPulse, 0.78 * ventPulse);
        lVentricle.scale.set(1.05 * ventPulse, 1.18 * ventPulse, 0.92 * ventPulse);

        blueCells.forEach((c, i) => {
          rightPath.getPointAt((beatPhase * 0.5 + i / blueCells.length) % 1, _v);
          c.position.copy(_v);
        });
        redCells.forEach((c, i) => {
          leftPath.getPointAt((beatPhase * 0.5 + i / redCells.length) % 1, _v);
          c.position.copy(_v);
        });
      },
      getReadouts: (params) => {
        const bpm = Math.round(params.bpm ?? 72);
        return [
          { label: 'Heart Rate', value: String(bpm), unit: 'BPM' },
          { label: 'Cardiac Output', value: ((bpm * 70) / 1000).toFixed(2), unit: 'L/min' },
          { label: 'Cycle', value: 'Atrial → Ventricular Systole' },
        ];
      },
    };
  }

  // =========================================================
  // B02: HUMAN RESPIRATORY SYSTEM (Larynx, Bronchial Tree, Multi-Lobed Lungs)
  // =========================================================
  if (id === 'B02') {
    const tracheaGroup = new THREE.Group();
    // Larynx shield (thyroid cartilage)
    const larynx = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.14, 0.34, 20),
      makeOrganicMat(0xe2e8f0, 0.38)
    );
    larynx.position.y = 3.12;
    const windpipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 1.35, 20),
      makeOrganicMat(0xf1f5f9, 0.42)
    );
    windpipe.position.y = 2.38;
    tracheaGroup.add(larynx, windpipe);

    for (let i = 0; i < 8; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.148, 0.022, 10, 24, Math.PI * 1.65),
        makeOrganicMat(0xcbd5e1, 0.32)
      );
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = -0.35;
      ring.position.y = 1.82 + i * 0.16;
      tracheaGroup.add(ring);
    }

    // Bifurcating Primary & Secondary Bronchi
    const bronchusMat = makeOrganicMat(0x94a3b8, 0.38);
    const leftBronchus = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 1.72, 0),
          new THREE.Vector3(-0.36, 1.48, 0),
          new THREE.Vector3(-0.68, 1.24, 0.05),
        ]),
        20,
        0.09,
        12,
        false
      ),
      bronchusMat
    );
    const rightBronchus = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 1.72, 0),
          new THREE.Vector3(0.35, 1.5, 0),
          new THREE.Vector3(0.68, 1.24, 0.05),
        ]),
        20,
        0.095,
        12,
        false
      ),
      bronchusMat
    );
    tracheaGroup.add(leftBronchus, rightBronchus);
    ctx.registerComponent(
      tracheaGroup,
      'trachea',
      'Larynx, Trachea & Bronchi',
      new THREE.Vector3(0, 0.55, 0),
      new THREE.Vector3(0, 3.28, 0)
    );

    // Multi-lobed Translucent Lungs with Internal Alveolar Clusters
    const lungsGroup = new THREE.Group();
    const lungMat = new THREE.MeshPhysicalMaterial({
      color: 0xfb7185,
      roughness: 0.32,
      metalness: 0.02,
      clearcoat: 0.5,
      transparent: true,
      opacity: 0.72,
    });

    const buildLung = (side: -1 | 1) => {
      const lg = new THREE.Group();
      lg.position.set(side * 0.78, 1.42, 0);
      // Tapered anatomical lung lobe silhouette via LatheGeometry
      const pts: THREE.Vector2[] = [
        new THREE.Vector2(0.01, -0.78),
        new THREE.Vector2(0.54, -0.74),
        new THREE.Vector2(0.58, -0.25),
        new THREE.Vector2(0.48, 0.32),
        new THREE.Vector2(0.3, 0.72),
        new THREE.Vector2(0.01, 0.84),
      ];
      const lobeMesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), lungMat);
      lobeMesh.scale.set(side === 1 ? 1.06 : 0.96, 1.0, 0.78);
      lobeMesh.rotation.z = side * -0.08;
      lobeMesh.castShadow = true;

      // Internal Alveoli Grape Clusters
      const alvMat = makeOrganicMat(0xfda4af, 0.35);
      for (let k = 0; k < 7; k++) {
        const a = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), alvMat);
        a.position.set(
          Math.sin(k * 2.1) * 0.18,
          -0.25 + (k / 6) * 0.55,
          Math.cos(k * 1.7) * 0.16
        );
        lg.add(a);
      }
      lg.add(lobeMesh);
      return lg;
    };

    const leftLung = buildLung(-1);
    const rightLung = buildLung(1);
    lungsGroup.add(leftLung, rightLung);
    ctx.registerComponent(
      lungsGroup,
      'lungs',
      'Multi-Lobed Lungs & Alveoli',
      new THREE.Vector3(0, 0, 0.4),
      new THREE.Vector3(1.25, 1.95, 0)
    );

    // Muscular Diaphragm Dome
    const diaphGroup = new THREE.Group();
    const diaphMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.42, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.34),
      makeOrganicMat(0xc2410c, 0.42)
    );
    diaphMesh.scale.set(1.05, 0.65, 0.72);
    diaphMesh.position.y = -0.28;
    diaphGroup.position.y = 0.52;
    diaphGroup.add(diaphMesh);
    ctx.registerComponent(
      diaphGroup,
      'diaphragm',
      'Thoracic Diaphragm',
      new THREE.Vector3(0, -0.5, 0),
      new THREE.Vector3(0, 0.45, 0.9)
    );

    root.add(tracheaGroup, lungsGroup, diaphGroup);

    let breathPhase = 0;
    return {
      root,
      defaultCameraPos: [0, 2.05, 4.9],
      defaultTarget: [0, 1.65, 0],
      updateParams: () => {},
      update: (dt, _el, params, playing) => {
        const rate = params.breathRate ?? 14;
        const depth = params.breathDepth ?? 1.0;
        if (playing) breathPhase += dt * (rate / 60) * Math.PI * 2;
        const inhale = 0.5 + 0.5 * Math.sin(breathPhase);
        const scale = 1 + inhale * 0.16 * depth;
        leftLung.scale.set(scale, 1 + inhale * 0.08 * depth, scale);
        rightLung.scale.set(scale, 1 + inhale * 0.08 * depth, scale);
        diaphGroup.position.y = 0.6 - inhale * 0.25 * depth;
      },
      getReadouts: (params) => [
        { label: 'Breathing Rate', value: String(Math.round(params.breathRate ?? 14)), unit: 'breaths/min' },
        { label: 'Tidal Volume', value: String(Math.round(500 * (params.breathDepth ?? 1.0))), unit: 'mL' },
      ],
    };
  }

  // =========================================================
  // B03: HUMAN DIGESTIVE SYSTEM (J-Stomach, Lobed Liver, Gallbladder, Haustrated Colon)
  // =========================================================
  if (id === 'B03') {
    const oeso = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 3.35, -0.05),
          new THREE.Vector3(0.02, 2.8, 0),
          new THREE.Vector3(0.12, 2.35, 0.05),
        ]),
        20,
        0.1,
        14,
        false
      ),
      makeOrganicMat(0xf472b6, 0.4)
    );
    ctx.registerComponent(oeso, 'oesophagus', 'Oesophagus', new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(0, 3.35, 0));

    // Realistic J-shaped Stomach via variable-radius sculpted segments
    const stomachGroup = new THREE.Group();
    const stomachCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.12, 2.35, 0.05),
      new THREE.Vector3(0.45, 2.3, 0.08),
      new THREE.Vector3(0.62, 1.9, 0.12),
      new THREE.Vector3(0.32, 1.68, 0.1),
      new THREE.Vector3(-0.08, 1.72, 0.06),
    ]);
    const stomachBody = new THREE.Mesh(
      new THREE.TubeGeometry(stomachCurve, 32, 0.28, 18, false),
      makeOrganicMat(0xea580c, 0.34)
    );
    const fundusCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.31, 20, 20),
      makeOrganicMat(0xea580c, 0.34)
    );
    fundusCap.position.set(0.45, 2.26, 0.08);
    stomachGroup.add(stomachBody, fundusCap);
    ctx.registerComponent(stomachGroup, 'stomach', 'J-Shaped Stomach', new THREE.Vector3(0.45, 0.2, 0.25), new THREE.Vector3(0.75, 2.15, 0));

    // Dual-Lobed Liver + Emerald Gallbladder + Pancreas
    const liverGroup = new THREE.Group();
    const liverMat = makeOrganicMat(0x7c2d12, 0.32);
    const rightLobe = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 20), liverMat);
    rightLobe.scale.set(1.2, 0.72, 0.85);
    rightLobe.position.set(-0.48, 2.08, 0.14);
    rightLobe.rotation.z = -0.3;
    const leftLobe = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), liverMat);
    leftLobe.scale.set(1.3, 0.55, 0.65);
    leftLobe.position.set(-0.02, 2.14, 0.16);
    leftLobe.rotation.z = -0.25;
    const gallbladder = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.09, 0.16, 10, 16),
      makeOrganicMat(0x059669, 0.28)
    );
    gallbladder.position.set(-0.32, 1.82, 0.28);
    gallbladder.rotation.z = 0.45;
    liverGroup.add(rightLobe, leftLobe, gallbladder);
    ctx.registerComponent(liverGroup, 'liver', 'Liver & Gallbladder', new THREE.Vector3(-0.55, 0.2, 0.25), new THREE.Vector3(-0.85, 2.28, 0));

    // Coiled Small Intestine + Haustrated Large Intestine
    const intestines = new THREE.Group();
    const smallPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 52; i++) {
      const t = i / 52;
      smallPts.push(
        new THREE.Vector3(
          Math.sin(t * Math.PI * 6.5) * 0.42,
          1.38 - t * 0.85,
          Math.cos(t * Math.PI * 6.5) * 0.14 + 0.08
        )
      );
    }
    const smallCurve = new THREE.CatmullRomCurve3(smallPts);
    const smallMesh = new THREE.Mesh(
      new THREE.TubeGeometry(smallCurve, 80, 0.095, 12, false),
      makeOrganicMat(0xfca5a5, 0.42)
    );

    const colonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.62, 0.42, 0),
      new THREE.Vector3(-0.68, 1.42, 0),
      new THREE.Vector3(0, 1.48, 0.06),
      new THREE.Vector3(0.68, 1.38, 0),
      new THREE.Vector3(0.62, 0.38, 0),
      new THREE.Vector3(0.1, 0.22, -0.05),
    ]);
    const colonMat = makeOrganicMat(0x16a34a, 0.4);
    for (let h = 0; h <= 22; h++) {
      colonCurve.getPointAt(h / 22, _v);
      const haustrum = new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 14), colonMat);
      haustrum.position.copy(_v);
      intestines.add(haustrum);
    }
    intestines.add(smallMesh);
    ctx.registerComponent(intestines, 'intestines', 'Small & Haustrated Large Intestine', new THREE.Vector3(0, -0.3, 0.3), new THREE.Vector3(0, 0.85, 0.4));

    const bolus = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    const fullPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 3.35, -0.05),
      new THREE.Vector3(0.12, 2.35, 0.05),
      new THREE.Vector3(0.45, 2.0, 0.1),
      ...smallPts,
      new THREE.Vector3(0.1, 0.22, -0.05),
    ]);
    root.add(oeso, stomachGroup, liverGroup, intestines, bolus);

    let transit = 0.35;
    return {
      root,
      defaultCameraPos: [0, 2.0, 5.0],
      defaultTarget: [0, 1.75, 0],
      updateParams: () => {},
      update: (dt, _el, params, playing) => {
        transit = playing ? (transit + dt * 0.12) % 1 : (params.transit ?? 0.35);
        fullPath.getPointAt(transit, _v);
        bolus.position.copy(_v);
      },
      getReadouts: () => [
        { label: 'Alimentary Progress', value: `${Math.round(transit * 100)}`, unit: '%' },
        { label: 'Active Stage', value: transit < 0.22 ? 'Oesophagus (Peristalsis)' : transit < 0.4 ? 'Stomach (Acid/Pepsin)' : 'Intestinal Absorption' },
      ],
    };
  }

  // =========================================================
  // B04: HUMAN EYE (Realistic Multi-Layered Anatomical Eye)
  // =========================================================
  if (id === 'B04') {
    const eye = createSculptedEyeGroup(ctx, true);
    eye.group.position.set(0, 1.55, 0);
    root.add(eye.group);

    return {
      root,
      defaultCameraPos: [-1.4, 2.35, 4.4],
      defaultTarget: [0, 1.55, 0],
      updateParams: () => {},
      update: (_dt, _el, params) => {
        const lux = params.ambientLight ?? 0.5;
        const pupilScale = 1.25 - lux * 0.55;
        eye.pupilDisc.scale.setScalar(pupilScale);
        eye.irisDisc.scale.setScalar(1.0 + (1 - pupilScale) * 0.05);
      },
      getReadouts: (params) => [
        { label: 'Pupil Reflex', value: (params.ambientLight ?? 0.5) > 0.6 ? 'Constricted (Miosis)' : 'Dilated (Mydriasis)' },
        { label: 'Layers', value: 'Sclera · Choroid · Retina' },
      ],
    };
  }

  // =========================================================
  // B05: HUMAN BRAIN & NERVOUS SYSTEM (Textured Gyri/Sulci + Cerebellum + Spinal Roots)
  // =========================================================
  if (id === 'B05') {
    const cortexTex = createBrainCortexTexture();
    const cerebrumMat = makeOrganicMat(0xffffff, 0.42, cortexTex.color, cortexTex.bump);

    const cerebrum = new THREE.Group();
    cerebrum.position.set(0, 2.08, 0);
    const lHemi = new THREE.Mesh(new THREE.SphereGeometry(0.82, 36, 32), cerebrumMat);
    lHemi.scale.set(1.32, 0.92, 0.68);
    lHemi.position.set(0, 0, -0.34);
    lHemi.castShadow = true;

    const rHemi = new THREE.Mesh(new THREE.SphereGeometry(0.82, 36, 32), cerebrumMat);
    rHemi.scale.set(1.32, 0.92, 0.68);
    rHemi.position.set(0, 0, 0.34);
    rHemi.castShadow = true;

    // Temporal lobes
    const lTemp = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 12, 20), cerebrumMat);
    lTemp.rotation.z = Math.PI / 2 - 0.22;
    lTemp.position.set(0.12, -0.35, -0.58);
    const rTemp = lTemp.clone();
    rTemp.position.z = 0.58;

    // Corpus callosum arch inside longitudinal fissure
    const callosum = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.09, 12, 24, Math.PI),
      makeOrganicMat(0xfef3c7, 0.4)
    );
    callosum.position.set(0.05, -0.15, 0);
    cerebrum.add(lHemi, rHemi, lTemp, rTemp, callosum);
    ctx.registerComponent(cerebrum, 'cerebrum', 'Cerebral Cortex & Corpus Callosum', new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0, 0.95, 0));

    // Folia-ridged Cerebellum
    const cerebellum = new THREE.Group();
    cerebellum.position.set(-0.55, 1.32, 0);
    const cMat = makeOrganicMat(0xdbeafe, 0.45, cortexTex.color, cortexTex.bump);
    cMat.color.setHex(0x8b5cf6);
    const cL = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 20), cMat);
    cL.scale.set(1.0, 0.78, 0.9);
    cL.position.z = -0.24;
    const cR = cL.clone();
    cR.position.z = 0.24;
    cerebellum.add(cL, cR);
    ctx.registerComponent(cerebellum, 'cerebellum', 'Cerebellum', new THREE.Vector3(-0.55, -0.1, 0), new THREE.Vector3(-0.98, 1.45, 0));

    // Pons bulge & Medulla Oblongata
    const brainstem = new THREE.Group();
    const pons = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 20), makeOrganicMat(0x10b981, 0.36));
    pons.position.set(-0.02, 1.42, 0);
    const medulla = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.65, 16), makeOrganicMat(0x059669, 0.38));
    medulla.position.set(-0.1, 1.12, 0);
    brainstem.add(pons, medulla);
    ctx.registerComponent(brainstem, 'brainstem', 'Pons & Medulla Oblongata', new THREE.Vector3(0.35, 0, 0.3), new THREE.Vector3(0.45, 1.35, 0));

    // Spinal Cord with Paired Dorsal/Ventral Nerve Roots
    const spinal = new THREE.Group();
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 1.25, 16), makeOrganicMat(0xf59e0b, 0.38));
    cord.position.set(-0.1, 0.42, 0);
    spinal.add(cord);
    for (let r = 0; r < 5; r++) {
      for (const side of [-1, 1]) {
        const rootNerve = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.42, 8), makeOrganicMat(0xfde68a, 0.4));
        rootNerve.rotation.x = side * 0.9;
        rootNerve.position.set(-0.1, 0.15 + r * 0.2, side * 0.22);
        spinal.add(rootNerve);
      }
    }
    ctx.registerComponent(spinal, 'spinal', 'Spinal Cord & Nerve Roots', new THREE.Vector3(0, -0.4, 0), new THREE.Vector3(0.35, 0.5, 0));

    const impulse = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 14), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    root.add(cerebrum, cerebellum, brainstem, spinal, impulse);

    let sig = 0;
    return {
      root,
      defaultCameraPos: [2.2, 2.2, 4.5],
      defaultTarget: [-0.1, 1.45, 0],
      updateParams: () => {},
      update: (dt, _el, params, playing) => {
        const rate = params.signalRate ?? 1.25;
        const mode = Math.round(params.pathwayMode ?? 0);
        if (playing) sig = (sig + dt * rate) % 1;
        if (mode === 0) {
          impulse.position.set(Math.cos(sig * Math.PI * 2) * 0.55, 2.18 + Math.sin(sig * Math.PI * 2) * 0.25, 0.42);
        } else if (mode === 1) {
          impulse.position.set(-0.55 + Math.cos(sig * Math.PI * 2) * 0.25, 1.32, Math.sin(sig * Math.PI * 2) * 0.32);
        } else {
          impulse.position.set(-0.1, 0.05 + sig * 1.4, 0.13);
        }
      },
      getReadouts: (params) => [
        { label: 'Active Pathway', value: ['Cerebral Cortex', 'Cerebellar Balance', 'Spinal Reflex Arc'][Math.round(params.pathwayMode ?? 0)] },
      ],
    };
  }

  // =========================================================
  // B06: KIDNEY & NEPHRON (Bean-Shaped Cutaway with Renal Pyramids + Detailed Nephron)
  // =========================================================
  if (id === 'B06') {
    const kidneyGroup = new THREE.Group();
    kidneyGroup.position.set(-1.35, 1.35, 0);
    // Bean-shaped renal cortex silhouette
    const beanShape = new THREE.Shape();
    beanShape.moveTo(0, -0.95);
    beanShape.bezierCurveTo(-0.95, -0.95, -0.98, 0.95, 0, 0.95);
    beanShape.bezierCurveTo(0.45, 0.95, 0.42, 0.35, 0.18, 0.15);
    beanShape.bezierCurveTo(0.05, 0, 0.05, 0, 0.18, -0.15);
    beanShape.bezierCurveTo(0.42, -0.35, 0.45, -0.95, 0, -0.95);
    const beanGeo = new THREE.ExtrudeGeometry(beanShape, {
      depth: 0.42,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.09,
      bevelSegments: 4,
    });
    beanGeo.translate(0, 0, -0.21);
    const cortex = new THREE.Mesh(beanGeo, makeOrganicMat(0x991b1b, 0.36));
    cortex.castShadow = true;
    kidneyGroup.add(cortex);

    // 5 Triangular Renal Medulla Pyramids visible on front face
    const pyrMat = makeOrganicMat(0xe11d48, 0.38);
    for (let p = 0; p < 5; p++) {
      const ang = -1.1 + p * 0.55;
      const pyr = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 14), pyrMat);
      pyr.position.set(Math.cos(ang) * -0.32 + 0.05, Math.sin(ang) * 0.48, 0.24);
      pyr.rotation.z = ang - Math.PI / 2;
      kidneyGroup.add(pyr);
    }

    // Renal Artery (Red), Vein (Blue), and Ureter (Amber)
    const rArt = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.65, 14), makeOrganicMat(0xef4444, 0.3));
    rArt.rotation.z = Math.PI / 2;
    rArt.position.set(0.38, 0.12, 0.08);
    const rVein = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.65, 14), makeOrganicMat(0x2563eb, 0.32));
    rVein.rotation.z = Math.PI / 2;
    rVein.position.set(0.38, -0.08, -0.06);
    const ureter = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.18, 0, 0),
          new THREE.Vector3(0.38, -0.45, 0),
          new THREE.Vector3(0.45, -1.15, 0),
        ]),
        20,
        0.065,
        12,
        false
      ),
      makeOrganicMat(0xf59e0b, 0.4)
    );
    kidneyGroup.add(rArt, rVein, ureter);
    ctx.registerComponent(kidneyGroup, 'kidney', 'Kidney Cortex, Medulla & Hilum', new THREE.Vector3(-0.4, 0, 0), new THREE.Vector3(-0.1, 1.15, 0));

    const glomerulus = new THREE.Group();
    glomerulus.position.set(0.35, 1.85, 0);
    const bowman = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 24, 20, 0, Math.PI * 1.55),
      makeGlassMaterial(0xfde047, ctx.isSoftwareGl, 0.5)
    );
    const tuft = new THREE.Mesh(new THREE.TorusKnotGeometry(0.18, 0.055, 56, 10), makeOrganicMat(0xef4444, 0.3));
    const afferent = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 12), makeOrganicMat(0xef4444, 0.3));
    afferent.rotation.z = Math.PI / 2;
    afferent.position.set(-0.42, 0.14, 0);
    glomerulus.add(bowman, tuft, afferent);
    ctx.registerComponent(glomerulus, 'glomerulus', 'Bowman’s Capsule & Glomerulus', new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0.35, 2.45, 0));

    const tubuleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.75, 1.85, 0),
      new THREE.Vector3(1.15, 1.65, 0),
      new THREE.Vector3(1.15, 0.45, 0),
      new THREE.Vector3(1.55, 0.45, 0),
      new THREE.Vector3(1.55, 1.75, 0),
      new THREE.Vector3(2.05, 1.75, 0),
    ]);
    const tubule = new THREE.Mesh(new THREE.TubeGeometry(tubuleCurve, 56, 0.075, 12, false), makeOrganicMat(0xf59e0b, 0.38));
    ctx.registerComponent(tubule, 'tubule', 'Loop of Henle & Convoluted Tubules', new THREE.Vector3(0, -0.35, 0), new THREE.Vector3(1.35, 0.3, 0));

    const collecting = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.9, 16), makeOrganicMat(0xd97706, 0.4));
    collecting.position.set(2.05, 1.15, 0);
    ctx.registerComponent(collecting, 'collecting', 'Collecting Duct', new THREE.Vector3(0.45, 0, 0), new THREE.Vector3(2.05, 2.25, 0));

    const filtrate = Array.from({ length: 8 }, () => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), new THREE.MeshBasicMaterial({ color: 0x059669 }));
      root.add(m);
      return m;
    });
    root.add(kidneyGroup, glomerulus, tubule, collecting);

    let flowT = 0;
    return {
      root,
      defaultCameraPos: [0.3, 2.1, 5.2],
      defaultTarget: [0.35, 1.35, 0],
      updateParams: () => {},
      update: (dt, _el, params, playing) => {
        const bp = params.bloodPressure ?? 1.0;
        if (playing) flowT = (flowT + dt * 0.28 * bp) % 1;
        filtrate.forEach((f, i) => {
          tubuleCurve.getPointAt((flowT + i / filtrate.length) % 1, _v);
          f.position.copy(_v);
        });
      },
      getReadouts: (params) => [
        { label: 'Filtration Rate', value: String(Math.round(125 * (params.bloodPressure ?? 1.0))), unit: 'mL/min' },
        { label: 'Water Reabsorption', value: `${Math.round(99 - (params.hydration ?? 0.7) * 2)}`, unit: '%' },
      ],
    };
  }

  // =========================================================
  // B07: PLANT CELL (Grana Chloroplasts, Cristae Mitochondria, Cutaway Nucleus)
  // =========================================================
  if (id === 'B07') {
    const wallShape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const x = Math.cos(a) * 1.75;
      const y = Math.sin(a) * 1.45;
      if (i === 0) wallShape.moveTo(x, y);
      else wallShape.lineTo(x, y);
    }
    wallShape.closePath();
    const wallGeo = new THREE.ExtrudeGeometry(wallShape, { depth: 0.72, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08 });
    wallGeo.rotateX(-Math.PI / 2);
    const cellWall = new THREE.Mesh(wallGeo, makeOrganicMat(0x059669, 0.5));
    cellWall.position.y = 0.2;
    ctx.registerComponent(cellWall, 'cellWall', 'Cellulose Cell Wall', new THREE.Vector3(0, -0.4, 0), new THREE.Vector3(-1.6, 1.0, 0));

    const vacuole = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.55, 0.85, 16, 24),
      makeGlassMaterial(0x38bdf8, ctx.isSoftwareGl, 0.55)
    );
    vacuole.rotation.z = Math.PI / 2;
    vacuole.position.set(0.25, 0.9, -0.15);
    ctx.registerComponent(vacuole, 'vacuole', 'Central Vacuole', new THREE.Vector3(0, 0.45, -0.35), new THREE.Vector3(0.3, 1.65, 0));

    // Cutaway Nucleus + Nucleolus
    const nucleus = new THREE.Group();
    nucleus.position.set(-0.85, 0.95, 0.25);
    const nEnvelope = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 24, 24, 0, Math.PI * 1.45),
      makeOrganicMat(0x7c3aed, 0.35)
    );
    const nucleolus = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 18), makeOrganicMat(0x4c1d95, 0.25));
    nucleus.add(nEnvelope, nucleolus);
    ctx.registerComponent(nucleus, 'nucleus', 'Nucleus & Nucleolus', new THREE.Vector3(-0.4, 0.65, 0.3), new THREE.Vector3(-0.9, 1.6, 0.3));

    // Chloroplasts with visible stacked Thylakoid Grana
    const chloroplasts = new THREE.Group();
    for (const [cx, cz] of [[-0.2, 0.8], [1.05, 0.45], [-0.95, -0.55], [0.95, -0.6]]) {
      const cg = new THREE.Group();
      cg.position.set(cx, 0.9, cz);
      const hull = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.18, 0.28, 10, 16),
        makeGlassMaterial(0x16a34a, ctx.isSoftwareGl, 0.52)
      );
      hull.rotation.z = Math.PI / 2;
      cg.add(hull);
      for (const gx of [-0.09, 0.08]) {
        for (let s = 0; s < 3; s++) {
          const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.025, 12), makeOrganicMat(0x15803d, 0.3));
          disc.position.set(gx, -0.04 + s * 0.04, 0);
          cg.add(disc);
        }
      }
      chloroplasts.add(cg);
    }
    ctx.registerComponent(chloroplasts, 'chloroplast', 'Chloroplasts (Grana)', new THREE.Vector3(0, 0.75, 0.4), new THREE.Vector3(1.1, 1.35, 0.5));

    const mitochondria = new THREE.Group();
    for (const [mx, mz] of [[-0.35, -0.75], [0.55, 0.78]]) {
      const mg = new THREE.Group();
      mg.position.set(mx, 0.88, mz);
      mg.rotation.z = Math.PI / 3;
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.24, 8, 16), makeOrganicMat(0xea580c, 0.32));
      const cristae = new THREE.Mesh(new THREE.TorusKnotGeometry(0.068, 0.016, 22, 6), makeOrganicMat(0xfde047, 0.35));
      mg.add(m, cristae);
      mitochondria.add(mg);
    }
    ctx.registerComponent(mitochondria, 'mitochondria', 'Mitochondria (Cristae)', new THREE.Vector3(0.3, 0.85, 0), new THREE.Vector3(0.6, 1.3, 0.8));

    root.add(cellWall, vacuole, nucleus, chloroplasts, mitochondria);
    return {
      root,
      defaultCameraPos: [0, 3.6, 4.3],
      defaultTarget: [0, 0.85, 0],
      updateParams: () => {},
      update: (_dt, _el, params) => {
        vacuole.scale.setScalar(params.turgor ?? 0.9);
      },
      getReadouts: (params) => [
        { label: 'Turgor Pressure', value: (params.turgor ?? 0.9) > 0.65 ? 'Turgid (Healthy)' : 'Flaccid (Wilting)' },
      ],
    };
  }

  // =========================================================
  // B08: ANIMAL CELL (Cutaway Nucleus + Nuclear Pores + Rough ER + Cristae Mitochondria + Golgi)
  // =========================================================
  if (id === 'B08') {
    const membraneMat = makeGlassMaterial(0x10b981, ctx.isSoftwareGl, 0.36);
    membraneMat.side = THREE.DoubleSide;
    const membrane = new THREE.Mesh(
      new THREE.SphereGeometry(1.55, 36, 24, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65),
      membraneMat
    );
    membrane.position.y = 1.25;
    ctx.registerComponent(membrane, 'membrane', 'Plasma Membrane', new THREE.Vector3(0, -0.35, 0), new THREE.Vector3(-1.4, 1.3, 0));

    const nucleus = new THREE.Group();
    nucleus.position.set(0, 1.25, 0);
    const nMat = makeOrganicMat(0x7c3aed, 0.3);
    nMat.side = THREE.DoubleSide;
    const nShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 28, 28, 0, Math.PI * 1.5),
      nMat
    );
    const nucleolus = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 18), makeOrganicMat(0x4c1d95, 0.22));
    // Rough Endoplasmic Reticulum ribbon arcs around nucleus
    for (let r = 0; r < 3; r++) {
      const er = new THREE.Mesh(
        new THREE.TorusGeometry(0.6 + r * 0.09, 0.032, 8, 22, Math.PI * 0.95),
        makeOrganicMat(0x38bdf8, 0.36)
      );
      er.rotation.x = Math.PI / 2;
      er.rotation.z = 0.6 + r * 0.25;
      er.position.y = -0.1 + r * 0.08;
      nucleus.add(er);
    }
    nucleus.add(nShell, nucleolus);
    ctx.registerComponent(nucleus, 'nucleus', 'Nucleus & Rough ER', new THREE.Vector3(0, 0.75, 0), new THREE.Vector3(0, 1.95, 0));

    const mitochondria = new THREE.Group();
    for (const [mx, mz] of [[-0.82, 0.45], [0.85, -0.3], [-0.45, -0.82]]) {
      const mg = new THREE.Group();
      mg.position.set(mx, 1.05, mz);
      mg.rotation.set(0.4, 0.5, 1.1);
      const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.28, 8, 16), makeOrganicMat(0xea580c, 0.32));
      const cristae = new THREE.Mesh(new THREE.TorusKnotGeometry(0.08, 0.02, 24, 6), makeOrganicMat(0xfde047, 0.35));
      mg.add(outer, cristae);
      mitochondria.add(mg);
    }
    ctx.registerComponent(mitochondria, 'mitochondria', 'Mitochondria (Cristae)', new THREE.Vector3(-0.4, 0.55, 0.35), new THREE.Vector3(-0.85, 1.4, 0.5));

    const golgi = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.24 + i * 0.075, 0.036, 8, 20, Math.PI * 0.82), makeOrganicMat(0xf59e0b, 0.35));
      arc.position.set(0.75, 1.08 + i * 0.08, 0.55);
      arc.rotation.x = Math.PI / 2;
      golgi.add(arc);
    }
    ctx.registerComponent(golgi, 'golgi', 'Golgi Apparatus & Vesicles', new THREE.Vector3(0.45, 0.45, 0.35), new THREE.Vector3(0.95, 1.5, 0.6));

    root.add(membrane, nucleus, mitochondria, golgi);
    return {
      root,
      defaultCameraPos: [0, 3.2, 4.2],
      defaultTarget: [0, 1.15, 0],
      updateParams: () => {},
      update: (dt, _el, params, playing) => {
        if (playing) {
          root.rotation.y += dt * 0.25 * (params.metabolicRate ?? 1.0);
        }
      },
      getReadouts: (params) => [
        { label: 'ATP Synthesis', value: `${Math.round(100 * (params.metabolicRate ?? 1.0))}`, unit: '%' },
      ],
    };
  }

  // =========================================================
  // B09: PHOTOSYNTHESIS (Venation-Textured Botanical Leaves + Root Xylem)
  // =========================================================
  if (id === 'B09') {
    const rootsGroup = new THREE.Group();
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.45, 28), new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.92 }));
    soil.position.y = 0.225;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.9, 16), makeOrganicMat(0x15803d, 0.48));
    stem.position.y = 1.35;
    rootsGroup.add(soil, stem);
    ctx.registerComponent(rootsGroup, 'roots', 'Roots & Xylem Stem', new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0, 0.8, 0.4));

    const leafTex = createLeafVenationTexture();
    const leafMat = makeOrganicMat(0xffffff, 0.36, leafTex);
    const leavesGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.62, 18, 14), leafMat);
      leaf.scale.set(1.25, 0.1, 0.58);
      leaf.position.set(Math.cos(a) * 0.65, 1.95 + (i % 2) * 0.28, Math.sin(a) * 0.65);
      leaf.rotation.y = -a;
      leaf.rotation.z = 0.18;
      leavesGroup.add(leaf);
    }
    ctx.registerComponent(leavesGroup, 'leaves', 'Chlorophyll Leaves', new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0.95, 2.45, 0));

    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 24), new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.8 }));
    sun.position.set(-1.95, 3.25, -0.6);
    ctx.registerComponent(sun, 'sun', 'Solar Photons', new THREE.Vector3(-0.3, 0.3, 0), new THREE.Vector3(-1.95, 3.75, -0.6));

    const o2Bubs = Array.from({ length: 8 }, () => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), new THREE.MeshBasicMaterial({ color: 0x059669 }));
      root.add(m);
      return m;
    });
    const photons = Array.from({ length: 6 }, () => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
      root.add(m);
      return m;
    });
    root.add(rootsGroup, leavesGroup, sun);

    let phase = 0;
    return {
      root,
      defaultCameraPos: [0.4, 2.7, 5.2],
      defaultTarget: [0, 1.75, 0],
      updateParams: () => {},
      update: (dt, _el, params, playing) => {
        const light = params.sunlight ?? 1.0;
        const water = params.waterSupply ?? 1.0;
        const rate = Math.min(light, water);
        sun.scale.setScalar(0.7 + light * 0.45);
        if (playing) phase = (phase + dt * 0.55 * rate) % 1;

        photons.forEach((p, i) => {
          const t = (phase + i / photons.length) % 1;
          p.position.set(THREE.MathUtils.lerp(-1.95, 0, t), THREE.MathUtils.lerp(3.25, 2.1, t), THREE.MathUtils.lerp(-0.6, 0, t));
        });
        o2Bubs.forEach((b, i) => {
          const t = (phase + i / o2Bubs.length) % 1;
          b.position.set(Math.sin(i * 1.7) * 0.7, 2.2 + t * 1.4, Math.cos(i * 1.3) * 0.6);
        });
      },
      getReadouts: (params) => {
        const rate = Math.min(params.sunlight ?? 1.0, params.waterSupply ?? 1.0);
        return [{ label: 'Glucose & O₂ Output', value: `${Math.round(rate * 100)}`, unit: '%' }];
      },
    };
  }

  // =========================================================
  // B10: HUMAN REPRODUCTIVE SYSTEM & HEREDITY
  // =========================================================
  const dnaGroup = new THREE.Group();
  dnaGroup.position.set(-1.35, 1.45, 0);
  const bpCols = [0x38bdf8, 0xf59e0b, 0x10b981, 0xec4899];
  for (let i = 0; i < 14; i++) {
    const t = (i / 13) * Math.PI * 2;
    const y = (i - 6.5) * 0.16;
    const x1 = Math.cos(t) * 0.35;
    const z1 = Math.sin(t) * 0.35;
    const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), new THREE.MeshStandardMaterial({ color: 0x7c3aed }));
    s1.position.set(x1, y, z1);
    const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), new THREE.MeshStandardMaterial({ color: 0x059669 }));
    s2.position.set(-x1, y, -z1);
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.7, 8), new THREE.MeshStandardMaterial({ color: bpCols[i % 4], roughness: 0.3 }));
    rung.position.set(0, y, 0);
    rung.rotation.z = Math.PI / 2;
    rung.rotation.y = -t;
    dnaGroup.add(s1, s2, rung);
  }
  ctx.registerComponent(dnaGroup, 'dna', 'DNA Double Helix', new THREE.Vector3(-0.4, 0, 0), new THREE.Vector3(0, 1.3, 0));

  const gametesGroup = new THREE.Group();
  gametesGroup.position.set(0, 1.45, 0);
  const ovum = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 24), makeOrganicMat(0xec4899, 0.3));
  const spermHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), makeOrganicMat(0x059669, 0.3));
  const spermTail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.005, 0.48, 8), makeOrganicMat(0x10b981, 0.4));
  spermTail.rotation.z = Math.PI / 2;
  spermTail.position.x = 0.28;
  const sperm = new THREE.Group();
  sperm.add(spermHead, spermTail);
  gametesGroup.add(ovum, sperm);
  ctx.registerComponent(gametesGroup, 'gametes', 'Haploid Gametes (n=23)', new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, 0.65, 0));

  const punnettGroup = new THREE.Group();
  punnettGroup.position.set(1.55, 1.35, 0);
  const punnettBoard = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.55, 0.14), makeMetalMaterial(0x1f2937, 0.35, 0.8));
  punnettBoard.position.z = -0.25;
  punnettGroup.add(punnettBoard);
  const colors = [0x059669, 0x7c3aed, 0x7c3aed, 0xf59e0b];
  const cubes: THREE.Mesh[] = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const idx = r * 2 + c;
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.55, 0.55),
        new THREE.MeshPhysicalMaterial({ color: colors[idx], roughness: 0.25, clearcoat: 0.7 })
      );
      cube.position.set((c - 0.5) * 0.72, (0.5 - r) * 0.72, 0);
      punnettGroup.add(cube);
      cubes.push(cube);
    }
  }
  ctx.registerComponent(punnettGroup, 'punnett', 'Punnett Square Lattice', new THREE.Vector3(0.4, 0, 0), new THREE.Vector3(0, 0.95, 0));
  root.add(dnaGroup, gametesGroup, punnettGroup);

  return {
    root,
    defaultCameraPos: [0, 2.2, 5.1],
    defaultTarget: [0.1, 1.4, 0],
    updateParams: () => {},
    update: (dt, _el, params, playing) => {
      const prog = params.fertilizeProgress ?? 0.65;
      const isSex = (params.crossMode ?? 0) >= 0.5;
      if (playing) dnaGroup.rotation.y += dt * 0.8;
      ovum.position.x = -0.35 + prog * 0.25;
      sperm.position.x = 0.45 - prog * 0.42;
      (cubes[0].material as THREE.MeshStandardMaterial).color.setHex(isSex ? 0xec4899 : 0x059669);
      (cubes[1].material as THREE.MeshStandardMaterial).color.setHex(isSex ? 0x7c3aed : 0x7c3aed);
      (cubes[2].material as THREE.MeshStandardMaterial).color.setHex(isSex ? 0xec4899 : 0x7c3aed);
      (cubes[3].material as THREE.MeshStandardMaterial).color.setHex(isSex ? 0x7c3aed : 0xf59e0b);
    },
    getReadouts: (params) => {
      const isSex = (params.crossMode ?? 0) >= 0.5;
      return [
        { label: 'Inheritance Model', value: isSex ? 'XX × XY (50% Girl / 50% Boy)' : 'Mendel Tt × Tt (3:1 Ratio)' },
        { label: 'Diploid Count', value: '46 Chromosomes (23 pairs)' },
      ];
    },
  };
}
