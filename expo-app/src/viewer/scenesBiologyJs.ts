export const BIOLOGY_SCENES_JS = `
  // B01: Human Heart (Realistic Multi-Chambered Anatomical Heart)
  if (id === 'B01') {
    const hg = new THREE.Group(); hg.position.set(0, 1.55, 0); hg.rotation.z = -0.16;
    const myo = createMyocardiumTex('#A31D24', '#450A0A'), rMyo = createMyocardiumTex('#881337', '#1E3A8A');
    const hPts = [new THREE.Vector2(0.01, -0.95), new THREE.Vector2(0.22, -0.82), new THREE.Vector2(0.45, -0.52), new THREE.Vector2(0.58, -0.1), new THREE.Vector2(0.56, 0.28), new THREE.Vector2(0.42, 0.48), new THREE.Vector2(0.01, 0.5)];
    const ventGeo = new THREE.LatheGeometry(hPts, 32);

    const rightSide = new THREE.Group();
    const rVent = new THREE.Mesh(ventGeo, makeOrganic(0x9f1239, 0.32, rMyo)); rVent.scale.set(0.82, 1.0, 0.74); rVent.position.set(-0.34, -0.22, 0.22); rVent.rotation.set(0.12, 0.2, 0.25);
    const rAtr = new THREE.Mesh(new THREE.SphereGeometry(0.45, 22, 18), makeOrganic(0x7f1d1d, 0.34, rMyo)); rAtr.position.set(-0.56, 0.45, 0.08);
    const vBand = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.032, 8, 24), makeOrganic(0x2563eb, 0.3)); vBand.position.set(-0.56, 0.45, 0.08); vBand.rotation.x = Math.PI / 2;
    rightSide.add(rVent, rAtr, vBand);
    registerComponent(rightSide, 'rightSide', 'Right Atrium & Ventricle', new THREE.Vector3(-0.65, 0, 0.2), new THREE.Vector3(-0.82, 0.45, 0.2));

    const leftSide = new THREE.Group();
    const lVent = new THREE.Mesh(ventGeo, makeOrganic(0xb91c1c, 0.28, myo)); lVent.scale.set(1.05, 1.18, 0.92); lVent.position.set(0.24, -0.32, -0.05); lVent.rotation.z = -0.28;
    const lAtr = new THREE.Mesh(new THREE.SphereGeometry(0.42, 22, 18), makeOrganic(0xdc2626, 0.3, myo)); lAtr.position.set(0.5, 0.48, -0.14);
    const lad = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.02, 0.32, 0.44), new THREE.Vector3(0.05, 0, 0.56), new THREE.Vector3(0.22, -0.45, 0.48), new THREE.Vector3(0.45, -0.88, 0.24)]), 24, 0.036, 8, false), makeOrganic(0xef4444, 0.22));
    leftSide.add(lVent, lAtr, lad);
    registerComponent(leftSide, 'leftSide', 'Left Ventricle & Coronary Tree', new THREE.Vector3(0.65, 0, -0.15), new THREE.Vector3(0.85, 0.35, 0));

    const vessels = new THREE.Group();
    const aorta = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.1, 0.25, 0.02), new THREE.Vector3(0.08, 0.92, 0.06), new THREE.Vector3(0.32, 1.24, -0.08), new THREE.Vector3(0.58, 1.08, -0.32)]), 32, 0.17, 14, false), makeOrganic(0xef4444, 0.26));
    [[0.14, 1.34, 0], [0.29, 1.4, -0.06], [0.44, 1.36, -0.15]].forEach(([bx, by, bz]) => {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.36, 12), makeOrganic(0xef4444, 0.28)); br.position.set(bx, by, bz); vessels.add(br);
    });
    const svc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.85, 14), makeOrganic(0x1d4ed8, 0.32)); svc.position.set(-0.6, 0.9, 0.07);
    const pulm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.22, 0.18, 0.28), new THREE.Vector3(-0.16, 0.78, 0.24), new THREE.Vector3(-0.62, 0.94, 0.05)]), 20, 0.13, 12, false), makeOrganic(0x4f46e5, 0.3));
    vessels.add(aorta, svc, pulm);
    registerComponent(vessels, 'aorta', 'Aorta & Major Vessels', new THREE.Vector3(0, 0.72, 0), new THREE.Vector3(0.32, 1.48, 0));

    const valves = new THREE.Group();
    [-0.36, 0.34].forEach((vx) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.032, 8, 20), makeOrganic(0xf59e0b, 0.35)); ring.position.set(vx, 0.16, 0.22); ring.rotation.x = Math.PI / 2; valves.add(ring); });
    registerComponent(valves, 'valves', 'Tricuspid & Bicuspid Valves', new THREE.Vector3(0, 0, 0.7), new THREE.Vector3(0, 0.2, 0.5));
    hg.add(rightSide, leftSide, vessels, valves); root.add(hg);
    let ph = 0;
    return {
      root, camPos: [0.2, 2.1, 4.6], target: [0, 1.65, 0],
      update: (dt, _el, p, playing) => {
        if (playing) ph = (ph + dt * ((p.bpm || 72) / 60)) % 1;
        const ap = 1 + Math.pow(Math.sin(Math.min(1, ph * 2.5) * Math.PI), 4) * 0.065;
        const vp = 1 + Math.pow(Math.sin(Math.max(0, (ph - 0.18) * 1.4) * Math.PI), 4) * 0.085;
        rAtr.scale.setScalar(ap); lAtr.scale.setScalar(ap);
        rVent.scale.set(0.82 * vp, vp, 0.74 * vp); lVent.scale.set(1.05 * vp, 1.18 * vp, 0.92 * vp);
      },
      readouts: (p) => [{ label: 'Heart Rate', value: String(Math.round(p.bpm || 72)), unit: 'BPM' }, { label: 'Output', value: (((p.bpm || 72) * 70) / 1000).toFixed(2), unit: 'L/min' }],
    };
  }

  // B02: Human Respiratory System
  if (id === 'B02') {
    const tracheaG = new THREE.Group();
    const larynx = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.34, 18), makeOrganic(0xe2e8f0, 0.38)); larynx.position.y = 3.12;
    const windpipe = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.35, 18), makeOrganic(0xf1f5f9, 0.42)); windpipe.position.y = 2.38;
    tracheaG.add(larynx, windpipe);
    for (let i = 0; i < 8; i++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.148, 0.022, 8, 22, Math.PI * 1.65), makeOrganic(0xcbd5e1, 0.32));
      r.rotation.x = Math.PI / 2; r.rotation.z = -0.35; r.position.y = 1.82 + i * 0.16; tracheaG.add(r);
    }
    const brMat = makeOrganic(0x94a3b8, 0.38);
    tracheaG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.72, 0), new THREE.Vector3(-0.36, 1.48, 0), new THREE.Vector3(-0.68, 1.24, 0.05)]), 16, 0.09, 10, false), brMat));
    tracheaG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.72, 0), new THREE.Vector3(0.35, 1.5, 0), new THREE.Vector3(0.68, 1.24, 0.05)]), 16, 0.095, 10, false), brMat));
    registerComponent(tracheaG, 'trachea', 'Larynx, Trachea & Bronchi', new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0, 3.28, 0));

    const lungsG = new THREE.Group();
    const lungMat = new THREE.MeshPhysicalMaterial({ color: 0xfb7185, roughness: 0.32, clearcoat: 0.5, transparent: true, opacity: 0.72 });
    const buildLung = (side) => {
      const lg = new THREE.Group(); lg.position.set(side * 0.78, 1.42, 0);
      const pts = [new THREE.Vector2(0.01, -0.78), new THREE.Vector2(0.54, -0.74), new THREE.Vector2(0.58, -0.25), new THREE.Vector2(0.48, 0.32), new THREE.Vector2(0.3, 0.72), new THREE.Vector2(0.01, 0.84)];
      const lobe = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), lungMat); lobe.scale.set(side === 1 ? 1.06 : 0.96, 1.0, 0.78); lobe.rotation.z = side * -0.08;
      const alvM = makeOrganic(0xfda4af, 0.35);
      for (let k = 0; k < 6; k++) { const a = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), alvM); a.position.set(Math.sin(k * 2.1) * 0.18, -0.25 + (k / 5) * 0.55, Math.cos(k * 1.7) * 0.16); lg.add(a); }
      lg.add(lobe); return lg;
    };
    const lLung = buildLung(-1), rLung = buildLung(1); lungsG.add(lLung, rLung);
    registerComponent(lungsG, 'lungs', 'Multi-Lobed Lungs & Alveoli', new THREE.Vector3(0, 0, 0.4), new THREE.Vector3(1.25, 1.95, 0));

    const diaphG = new THREE.Group(); diaphG.position.y = 0.52;
    const dm = new THREE.Mesh(new THREE.SphereGeometry(1.42, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.34), makeOrganic(0xc2410c, 0.42));
    dm.scale.set(1.05, 0.65, 0.72); dm.position.y = -0.28; diaphG.add(dm);
    registerComponent(diaphG, 'diaphragm', 'Thoracic Diaphragm', new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(0, 0.45, 0.9));
    root.add(tracheaG, lungsG, diaphG);
    let bPh = 0;
    return {
      root, camPos: [0, 2.05, 4.9], target: [0, 1.65, 0],
      update: (dt, _el, p, playing) => {
        const rate = p.breathRate || 14, depth = p.breathDepth || 1.0;
        if (playing) bPh += dt * (rate / 60) * Math.PI * 2;
        const inh = 0.5 + 0.5 * Math.sin(bPh), sc = 1 + inh * 0.16 * depth;
        lLung.scale.set(sc, 1 + inh * 0.08 * depth, sc); rLung.scale.set(sc, 1 + inh * 0.08 * depth, sc);
        diaphG.position.y = 0.6 - inh * 0.25 * depth;
      },
      readouts: (p) => [{ label: 'Rate', value: String(Math.round(p.breathRate || 14)), unit: 'bpm' }, { label: 'Tidal Vol', value: String(Math.round(500 * (p.breathDepth || 1.0))), unit: 'mL' }],
    };
  }

  // B03: Human Digestive System
  if (id === 'B03') {
    const oeso = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 3.35, -0.05), new THREE.Vector3(0.02, 2.8, 0), new THREE.Vector3(0.12, 2.35, 0.05)]), 16, 0.1, 12, false), makeOrganic(0xf472b6, 0.4));
    registerComponent(oeso, 'oesophagus', 'Oesophagus', new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(0, 3.35, 0));

    const stomachG = new THREE.Group();
    const stBody = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.12, 2.35, 0.05), new THREE.Vector3(0.45, 2.3, 0.08), new THREE.Vector3(0.62, 1.9, 0.12), new THREE.Vector3(0.32, 1.68, 0.1), new THREE.Vector3(-0.08, 1.72, 0.06)]), 26, 0.28, 16, false), makeOrganic(0xea580c, 0.34));
    const fundus = new THREE.Mesh(new THREE.SphereGeometry(0.31, 18, 18), makeOrganic(0xea580c, 0.34)); fundus.position.set(0.45, 2.26, 0.08);
    stomachG.add(stBody, fundus);
    registerComponent(stomachG, 'stomach', 'J-Shaped Stomach', new THREE.Vector3(0.45, 0.2, 0.25), new THREE.Vector3(0.75, 2.15, 0));

    const liverG = new THREE.Group(); const livM = makeOrganic(0x7c2d12, 0.32);
    const rL = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), livM); rL.scale.set(1.2, 0.72, 0.85); rL.position.set(-0.48, 2.08, 0.14); rL.rotation.z = -0.3;
    const lL = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 14), livM); lL.scale.set(1.3, 0.55, 0.65); lL.position.set(-0.02, 2.14, 0.16); lL.rotation.z = -0.25;
    const gb = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.16, 8, 14), makeOrganic(0x059669, 0.28)); gb.position.set(-0.32, 1.82, 0.28); gb.rotation.z = 0.45;
    liverG.add(rL, lL, gb);
    registerComponent(liverG, 'liver', 'Liver & Gallbladder', new THREE.Vector3(-0.55, 0.2, 0.25), new THREE.Vector3(-0.85, 2.28, 0));

    const intG = new THREE.Group(); const smallPts = [];
    for (let i = 0; i <= 48; i++) { const t = i / 48; smallPts.push(new THREE.Vector3(Math.sin(t * Math.PI * 6.5) * 0.42, 1.38 - t * 0.85, Math.cos(t * Math.PI * 6.5) * 0.14 + 0.08)); }
    intG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smallPts), 64, 0.095, 10, false), makeOrganic(0xfca5a5, 0.42)));
    const colCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.62, 0.42, 0), new THREE.Vector3(-0.68, 1.42, 0), new THREE.Vector3(0, 1.48, 0.06), new THREE.Vector3(0.68, 1.38, 0), new THREE.Vector3(0.62, 0.38, 0), new THREE.Vector3(0.1, 0.22, -0.05)]);
    const colM = makeOrganic(0x16a34a, 0.4), _hv = new THREE.Vector3();
    for (let h = 0; h <= 20; h++) { colCurve.getPointAt(h / 20, _hv); const hm = new THREE.Mesh(new THREE.SphereGeometry(0.175, 12, 12), colM); hm.position.copy(_hv); intG.add(hm); }
    registerComponent(intG, 'intestines', 'Small & Haustrated Colon', new THREE.Vector3(0, -0.3, 0.3), new THREE.Vector3(0, 0.85, 0.4));

    const bolus = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    const fullPath = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 3.35, -0.05), new THREE.Vector3(0.12, 2.35, 0.05), new THREE.Vector3(0.45, 2.0, 0.1), ...smallPts, new THREE.Vector3(0.1, 0.22, -0.05)]);
    root.add(oeso, stomachG, liverG, intG, bolus);
    let tr = 0.35;
    return {
      root, camPos: [0, 2.0, 5.0], target: [0, 1.75, 0],
      update: (dt, _el, p, playing) => { tr = playing ? (tr + dt * 0.12) % 1 : (p.transit || 0.35); fullPath.getPointAt(tr, _hv); bolus.position.copy(_hv); },
      readouts: () => [{ label: 'Transit', value: Math.round(tr * 100) + '%' }, { label: 'Organ', value: tr < 0.22 ? 'Oesophagus' : tr < 0.4 ? 'Stomach' : 'Intestines' }],
    };
  }

  // B04: Realistic Human Eye
  if (id === 'B04') {
    const eye = buildEyeGroup(true); eye.group.position.set(0, 1.55, 0); root.add(eye.group);
    return {
      root, camPos: [-1.4, 2.35, 4.4], target: [0, 1.55, 0],
      update: (_dt, _el, p) => {
        const sc = 1.25 - (p.ambientLight !== undefined ? p.ambientLight : 0.5) * 0.55;
        eye.pupilDisc.scale.setScalar(sc); eye.irisDisc.scale.setScalar(1.0 + (1 - sc) * 0.05);
      },
      readouts: (p) => [{ label: 'Pupil Reflex', value: (p.ambientLight || 0.5) > 0.6 ? 'Constricted (Miosis)' : 'Dilated (Mydriasis)' }],
    };
  }

  // B05: Realistic Gyri-Sulci Human Brain
  if (id === 'B05') {
    const bt = createBrainTex(), cMat = makeOrganic(0xffffff, 0.42, bt.color, bt.bump);
    const cer = new THREE.Group(); cer.position.set(0, 2.08, 0);
    const lh = new THREE.Mesh(new THREE.SphereGeometry(0.82, 32, 28), cMat); lh.scale.set(1.32, 0.92, 0.68); lh.position.z = -0.34;
    const rh = lh.clone(); rh.position.z = 0.34;
    const lT = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 10, 16), cMat); lT.rotation.z = Math.PI / 2 - 0.22; lT.position.set(0.12, -0.35, -0.58);
    const rT = lT.clone(); rT.position.z = 0.58;
    const cal = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.09, 10, 22, Math.PI), makeOrganic(0xfef3c7, 0.4)); cal.position.set(0.05, -0.15, 0);
    cer.add(lh, rh, lT, rT, cal);
    registerComponent(cer, 'cerebrum', 'Cerebral Cortex', new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0, 0.95, 0));

    const cbl = new THREE.Group(); cbl.position.set(-0.55, 1.32, 0);
    const cMat2 = makeOrganic(0x8b5cf6, 0.45, bt.color, bt.bump);
    const cL = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 16), cMat2); cL.scale.set(1.0, 0.78, 0.9); cL.position.z = -0.24;
    const cR = cL.clone(); cR.position.z = 0.24; cbl.add(cL, cR);
    registerComponent(cbl, 'cerebellum', 'Cerebellum', new THREE.Vector3(-0.55, -0.1, 0), new THREE.Vector3(-0.98, 1.45, 0));

    const bstem = new THREE.Group();
    const pons = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 18), makeOrganic(0x10b981, 0.36)); pons.position.set(-0.02, 1.42, 0);
    const med = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.65, 14), makeOrganic(0x059669, 0.38)); med.position.set(-0.1, 1.12, 0);
    bstem.add(pons, med);
    registerComponent(bstem, 'brainstem', 'Pons & Medulla', new THREE.Vector3(0.35, 0, 0.3), new THREE.Vector3(0.45, 1.35, 0));

    const spinal = new THREE.Group();
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 1.25, 14), makeOrganic(0xf59e0b, 0.38)); cord.position.set(-0.1, 0.42, 0); spinal.add(cord);
    for (let r = 0; r < 5; r++) [-1, 1].forEach((side) => {
      const rn = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.42, 8), makeOrganic(0xfde68a, 0.4));
      rn.rotation.x = side * 0.9; rn.position.set(-0.1, 0.15 + r * 0.2, side * 0.22); spinal.add(rn);
    });
    registerComponent(spinal, 'spinal', 'Spinal Cord & Nerve Roots', new THREE.Vector3(0, -0.4, 0), new THREE.Vector3(0.35, 0.5, 0));
    const imp = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    root.add(cer, cbl, bstem, spinal, imp);
    let sig = 0;
    return {
      root, camPos: [2.2, 2.2, 4.5], target: [-0.1, 1.45, 0],
      update: (dt, _el, p, playing) => {
        const mode = Math.round(p.pathwayMode || 0);
        if (playing) sig = (sig + dt * (p.signalRate || 1.25)) % 1;
        if (mode === 0) imp.position.set(Math.cos(sig * Math.PI * 2) * 0.55, 2.18 + Math.sin(sig * Math.PI * 2) * 0.25, 0.42);
        else if (mode === 1) imp.position.set(-0.55 + Math.cos(sig * Math.PI * 2) * 0.25, 1.32, Math.sin(sig * Math.PI * 2) * 0.32);
        else imp.position.set(-0.1, 0.05 + sig * 1.4, 0.13);
      },
      readouts: (p) => [{ label: 'Pathway', value: ['Cerebral Cortex', 'Cerebellar Balance', 'Spinal Reflex Arc'][Math.round(p.pathwayMode || 0)] }],
    };
  }

  // B06: Kidney & Nephron
  if (id === 'B06') {
    const kidG = new THREE.Group(); kidG.position.set(-1.35, 1.35, 0);
    const bs = new THREE.Shape(); bs.moveTo(0, -0.95); bs.bezierCurveTo(-0.95, -0.95, -0.98, 0.95, 0, 0.95); bs.bezierCurveTo(0.45, 0.95, 0.42, 0.35, 0.18, 0.15); bs.bezierCurveTo(0.05, 0, 0.05, 0, 0.18, -0.15); bs.bezierCurveTo(0.42, -0.35, 0.45, -0.95, 0, -0.95);
    const bGeo = new THREE.ExtrudeGeometry(bs, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.09, bevelSegments: 3 }); bGeo.translate(0, 0, -0.21);
    kidG.add(new THREE.Mesh(bGeo, makeOrganic(0x991b1b, 0.36)));
    for (let p = 0; p < 5; p++) {
      const a = -1.1 + p * 0.55, pyr = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 12), makeOrganic(0xe11d48, 0.38));
      pyr.position.set(Math.cos(a) * -0.32 + 0.05, Math.sin(a) * 0.48, 0.24); pyr.rotation.z = a - Math.PI / 2; kidG.add(pyr);
    }
    const rA = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.65, 12), makeOrganic(0xef4444, 0.3)); rA.rotation.z = Math.PI / 2; rA.position.set(0.38, 0.12, 0.08);
    const rV = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.65, 12), makeOrganic(0x2563eb, 0.32)); rV.rotation.z = Math.PI / 2; rV.position.set(0.38, -0.08, -0.06);
    const ur = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.18, 0, 0), new THREE.Vector3(0.38, -0.45, 0), new THREE.Vector3(0.45, -1.15, 0)]), 16, 0.065, 10, false), makeOrganic(0xf59e0b, 0.4));
    kidG.add(rA, rV, ur);
    registerComponent(kidG, 'kidney', 'Kidney & Medulla', new THREE.Vector3(-0.4, 0, 0), new THREE.Vector3(-0.1, 1.15, 0));

    const glom = new THREE.Group(); glom.position.set(0.35, 1.85, 0);
    glom.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16, 0, Math.PI * 1.55), makeGlass(0xfde047, 0.5)));
    glom.add(new THREE.Mesh(new THREE.TorusKnotGeometry(0.18, 0.055, 42, 8), makeOrganic(0xef4444, 0.3)));
    registerComponent(glom, 'glomerulus', 'Bowman Capsule & Glomerulus', new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0.35, 2.45, 0));

    const tCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.75, 1.85, 0), new THREE.Vector3(1.15, 1.65, 0), new THREE.Vector3(1.15, 0.45, 0), new THREE.Vector3(1.55, 0.45, 0), new THREE.Vector3(1.55, 1.75, 0), new THREE.Vector3(2.05, 1.75, 0)]);
    const tubule = new THREE.Mesh(new THREE.TubeGeometry(tCurve, 48, 0.075, 10, false), makeOrganic(0xf59e0b, 0.38));
    registerComponent(tubule, 'tubule', 'Loop of Henle', new THREE.Vector3(0, -0.35, 0), new THREE.Vector3(1.35, 0.3, 0));
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.9, 14), makeOrganic(0xd97706, 0.4)); col.position.set(2.05, 1.15, 0);
    registerComponent(col, 'collecting', 'Collecting Duct', new THREE.Vector3(0.45, 0, 0), new THREE.Vector3(2.05, 2.25, 0));
    const filt = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0x059669 })); root.add(m); return m; });
    root.add(kidG, glom, tubule, col);
    let flowT = 0; const _fv = new THREE.Vector3();
    return {
      root, camPos: [0.3, 2.1, 5.2], target: [0.35, 1.35, 0],
      update: (dt, _el, p, playing) => { if (playing) flowT = (flowT + dt * 0.28 * (p.bloodPressure || 1.0)) % 1; filt.forEach((f, i) => { tCurve.getPointAt((flowT + i / 8) % 1, _fv); f.position.copy(_fv); }); },
      readouts: (p) => [{ label: 'GFR', value: String(Math.round(125 * (p.bloodPressure || 1.0))), unit: 'mL/min' }, { label: 'Reabsorbed', value: Math.round(99 - (p.hydration || 0.7) * 2) + '%' }],
    };
  }

  // B07: Plant Cell
  if (id === 'B07') {
    const ws = new THREE.Shape();
    for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; if (i === 0) ws.moveTo(Math.cos(a) * 1.75, Math.sin(a) * 1.45); else ws.lineTo(Math.cos(a) * 1.75, Math.sin(a) * 1.45); }
    ws.closePath();
    const wGeo = new THREE.ExtrudeGeometry(ws, { depth: 0.72, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08 }); wGeo.rotateX(-Math.PI / 2);
    const wall = new THREE.Mesh(wGeo, makeOrganic(0x059669, 0.5)); wall.position.y = 0.2;
    registerComponent(wall, 'cellWall', 'Cellulose Cell Wall', new THREE.Vector3(0, -0.4, 0), new THREE.Vector3(-1.6, 1.0, 0));
    const vac = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 0.85, 14, 20), makeGlass(0x38bdf8, 0.55)); vac.rotation.z = Math.PI / 2; vac.position.set(0.25, 0.9, -0.15);
    registerComponent(vac, 'vacuole', 'Central Vacuole', new THREE.Vector3(0, 0.45, -0.35), new THREE.Vector3(0.3, 1.65, 0));

    const nuc = new THREE.Group(); nuc.position.set(-0.85, 0.95, 0.25);
    nuc.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 20, 0, Math.PI * 1.45), makeOrganic(0x7c3aed, 0.35)));
    nuc.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 14), makeOrganic(0x4c1d95, 0.25)));
    registerComponent(nuc, 'nucleus', 'Nucleus & Nucleolus', new THREE.Vector3(-0.4, 0.65, 0.3), new THREE.Vector3(-0.9, 1.6, 0.3));

    const chls = new THREE.Group();
    [[-0.2, 0.8], [1.05, 0.45], [-0.95, -0.55], [0.95, -0.6]].forEach(([cx, cz]) => {
      const cg = new THREE.Group(); cg.position.set(cx, 0.9, cz);
      const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.28, 8, 14), makeGlass(0x16a34a, 0.52)); hull.rotation.z = Math.PI / 2; cg.add(hull);
      [-0.09, 0.08].forEach((gx) => { for (let s = 0; s < 3; s++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.025, 10), makeOrganic(0x15803d, 0.3)); d.position.set(gx, -0.04 + s * 0.04, 0); cg.add(d); } });
      chls.add(cg);
    });
    registerComponent(chls, 'chloroplast', 'Chloroplasts (Grana)', new THREE.Vector3(0, 0.75, 0.4), new THREE.Vector3(1.1, 1.35, 0.5));
    const mito = new THREE.Group();
    [[-0.35, -0.75], [0.55, 0.78]].forEach(([mx, mz]) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.24, 8, 14), makeOrganic(0xea580c, 0.32)); m.rotation.z = Math.PI / 3; m.position.set(mx, 0.88, mz); mito.add(m); });
    registerComponent(mito, 'mitochondria', 'Mitochondria', new THREE.Vector3(0.3, 0.85, 0), new THREE.Vector3(0.6, 1.3, 0.8));
    root.add(wall, vac, nuc, chls, mito);
    return {
      root, camPos: [0, 3.6, 4.3], target: [0, 0.85, 0],
      update: (_dt, _el, p) => { vac.scale.setScalar(p.turgor || 0.9); },
      readouts: (p) => [{ label: 'Turgor', value: (p.turgor || 0.9) > 0.65 ? 'Turgid (Healthy)' : 'Flaccid (Wilting)' }],
    };
  }

  // B08: Animal Cell
  if (id === 'B08') {
    const mMat = makeGlass(0x10b981, 0.36); mMat.side = THREE.DoubleSide;
    const mem = new THREE.Mesh(new THREE.SphereGeometry(1.55, 32, 20, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), mMat); mem.position.y = 1.25;
    registerComponent(mem, 'membrane', 'Plasma Membrane', new THREE.Vector3(0, -0.35, 0), new THREE.Vector3(-1.4, 1.3, 0));
    const nuc = new THREE.Group(); nuc.position.set(0, 1.25, 0);
    nuc.add(new THREE.Mesh(new THREE.SphereGeometry(0.48, 22, 22, 0, Math.PI * 1.5), makeOrganic(0x7c3aed, 0.3)));
    nuc.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), makeOrganic(0x4c1d95, 0.22)));
    registerComponent(nuc, 'nucleus', 'Nucleus & Nucleolus', new THREE.Vector3(0, 0.75, 0), new THREE.Vector3(0, 1.95, 0));
    const mito = new THREE.Group();
    [[-0.82, 0.45], [0.85, -0.3], [-0.45, -0.82]].forEach(([mx, mz]) => {
      const mg = new THREE.Group(); mg.position.set(mx, 1.05, mz); mg.rotation.set(0.4, 0.5, 1.1);
      mg.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.28, 8, 14), makeOrganic(0xea580c, 0.32)), new THREE.Mesh(new THREE.TorusKnotGeometry(0.08, 0.02, 20, 6), makeOrganic(0xfde047, 0.35)));
      mito.add(mg);
    });
    registerComponent(mito, 'mitochondria', 'Mitochondria (Cristae)', new THREE.Vector3(-0.4, 0.55, 0.35), new THREE.Vector3(-0.85, 1.4, 0.5));
    const golgi = new THREE.Group();
    for (let i = 0; i < 4; i++) { const arc = new THREE.Mesh(new THREE.TorusGeometry(0.24 + i * 0.075, 0.036, 8, 18, Math.PI * 0.82), makeOrganic(0xf59e0b, 0.35)); arc.position.set(0.75, 1.08 + i * 0.08, 0.55); arc.rotation.x = Math.PI / 2; golgi.add(arc); }
    registerComponent(golgi, 'golgi', 'Golgi Apparatus', new THREE.Vector3(0.45, 0.45, 0.35), new THREE.Vector3(0.95, 1.5, 0.6));
    root.add(mem, nuc, mito, golgi);
    return {
      root, camPos: [0, 3.2, 4.2], target: [0, 1.15, 0],
      update: (dt, _el, p, playing) => { if (playing) root.rotation.y += dt * 0.25 * (p.metabolicRate || 1.0); },
      readouts: (p) => [{ label: 'ATP Output', value: Math.round(100 * (p.metabolicRate || 1.0)) + '%' }],
    };
  }

  // B09: Photosynthesis
  if (id === 'B09') {
    const rootsG = new THREE.Group();
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.45, 24), new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.92 })); soil.position.y = 0.225;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.9, 14), makeOrganic(0x15803d, 0.48)); stem.position.y = 1.35;
    rootsG.add(soil, stem);
    registerComponent(rootsG, 'roots', 'Roots & Xylem Stem', new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0, 0.8, 0.4));

    const leafM = makeOrganic(0xffffff, 0.36, createLeafVenationTex()), leavesG = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6, lf = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), leafM);
      lf.scale.set(1.25, 0.1, 0.58); lf.position.set(Math.cos(a) * 0.65, 1.95 + (i % 2) * 0.28, Math.sin(a) * 0.65); lf.rotation.y = -a; lf.rotation.z = 0.18; leavesG.add(lf);
    }
    registerComponent(leavesG, 'leaves', 'Chlorophyll Leaves', new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0.95, 2.45, 0));
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 20), new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.8 })); sun.position.set(-1.95, 3.25, -0.6);
    registerComponent(sun, 'sun', 'Solar Photons', new THREE.Vector3(-0.3, 0.3, 0), new THREE.Vector3(-1.95, 3.75, -0.6));
    const o2Bubs = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0x059669 })); root.add(m); return m; });
    const photons = Array.from({ length: 6 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf59e0b })); root.add(m); return m; });
    root.add(rootsG, leavesG, sun);
    let phase = 0;
    return {
      root, camPos: [0.4, 2.7, 5.2], target: [0, 1.75, 0],
      update: (dt, _el, p, playing) => {
        const rate = Math.min(p.sunlight !== undefined ? p.sunlight : 1.0, p.waterSupply !== undefined ? p.waterSupply : 1.0);
        sun.scale.setScalar(0.7 + (p.sunlight || 1.0) * 0.45);
        if (playing) phase = (phase + dt * 0.55 * rate) % 1;
        photons.forEach((ph, i) => { const t = (phase + i / 6) % 1; ph.position.set(THREE.MathUtils.lerp(-1.95, 0, t), THREE.MathUtils.lerp(3.25, 2.1, t), THREE.MathUtils.lerp(-0.6, 0, t)); });
        o2Bubs.forEach((b, i) => { const t = (phase + i / 8) % 1; b.position.set(Math.sin(i * 1.7) * 0.7, 2.2 + t * 1.4, Math.cos(i * 1.3) * 0.6); });
      },
      readouts: (p) => [{ label: 'Glucose & O2 Rate', value: Math.round(Math.min(p.sunlight || 1.0, p.waterSupply || 1.0) * 100) + '%' }],
    };
  }

  // B10: Human Reproduction & Heredity
  if (id === 'B10') {
    const dnaG = new THREE.Group(); dnaG.position.set(-1.35, 1.45, 0);
    for (let i = 0; i < 14; i++) {
      const t = (i / 13) * Math.PI * 2, y = (i - 6.5) * 0.16, x1 = Math.cos(t) * 0.35, z1 = Math.sin(t) * 0.35;
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), new THREE.MeshStandardMaterial({ color: 0x7c3aed })); s1.position.set(x1, y, z1);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), new THREE.MeshStandardMaterial({ color: 0x059669 })); s2.position.set(-x1, y, -z1);
      const rg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8), makeMetal(0x64748b)); rg.position.set(0, y, 0); rg.rotation.z = Math.PI / 2; rg.rotation.y = -t;
      dnaG.add(s1, s2, rg);
    }
    registerComponent(dnaG, 'dna', 'DNA Double Helix', new THREE.Vector3(-0.4, 0, 0), new THREE.Vector3(0, 1.3, 0));

    const gamG = new THREE.Group(); gamG.position.set(0, 1.45, 0);
    const ovum = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 20), makeOrganic(0xec4899, 0.3));
    const spHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), makeOrganic(0x059669, 0.3));
    const spTail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.005, 0.48, 8), makeOrganic(0x10b981, 0.4)); spTail.rotation.z = Math.PI / 2; spTail.position.x = 0.28;
    const sperm = new THREE.Group(); sperm.add(spHead, spTail); gamG.add(ovum, sperm);
    registerComponent(gamG, 'gametes', 'Haploid Gametes (n=23)', new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, 0.65, 0));

    const punG = new THREE.Group(); punG.position.set(1.55, 1.35, 0);
    const cols = [0x059669, 0x7c3aed, 0x7c3aed, 0xf59e0b], cubes = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      const cb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), new THREE.MeshStandardMaterial({ color: cols[r * 2 + c], roughness: 0.3 }));
      cb.position.set((c - 0.5) * 0.72, (0.5 - r) * 0.72, 0); punG.add(cb); cubes.push(cb);
    }
    registerComponent(punG, 'punnett', 'Punnett Square Lattice', new THREE.Vector3(0.4, 0, 0), new THREE.Vector3(0, 0.95, 0));
    root.add(dnaG, gamG, punG);
    return {
      root, camPos: [0, 2.2, 5.1], target: [0.1, 1.4, 0],
      update: (dt, _el, p, playing) => {
        const pr = p.fertilizeProgress !== undefined ? p.fertilizeProgress : 0.65, sx = (p.crossMode || 0) >= 0.5;
        if (playing) dnaG.rotation.y += dt * 0.8;
        ovum.position.x = -0.35 + pr * 0.25; sperm.position.x = 0.45 - pr * 0.42;
        cubes[0].material.color.setHex(sx ? 0xec4899 : 0x059669); cubes[1].material.color.setHex(0x7c3aed);
        cubes[2].material.color.setHex(sx ? 0xec4899 : 0x7c3aed); cubes[3].material.color.setHex(sx ? 0x7c3aed : 0xf59e0b);
      },
      readouts: (p) => [{ label: 'Model', value: (p.crossMode || 0) >= 0.5 ? 'XX x XY (50/50)' : 'Mendel Tt x Tt (3:1)' }, { label: 'Diploid', value: '46 Chromosomes' }],
    };
  }
`;
