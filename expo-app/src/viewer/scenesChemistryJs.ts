export const CHEMISTRY_SCENES_JS = `
  // C01: Types of Chemical Reactions
  if (id === 'C01') {
    const heater = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.28, 32), makeMetal(0x1e293b, 0.4, 0.7)); heater.position.y = 0.14;
    const hotRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.04, 10, 32), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.7 }));
    hotRing.rotation.x = Math.PI / 2; hotRing.position.y = 0.29;
    const heaterG = new THREE.Group(); heaterG.add(heater, hotRing);
    registerComponent(heaterG, 'heater', 'Thermal Stage', new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0.9, 0.25, 0));

    const beaker = createBeaker(0.75, 1.5, 0x38bdf8, 0.65); beaker.group.position.y = 0.28;
    registerComponent(beaker.group, 'vessel', 'Reaction Beaker', new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(-0.9, 1.0, 0));

    const molG = new THREE.Group(); molG.position.y = 2.5;
    const atomA = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 20), new THREE.MeshStandardMaterial({ color: 0x37b6ff, roughness: 0.25 }));
    const atomB = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25 }));
    const atomC = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 20), new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.25 }));
    const atomD = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), new THREE.MeshStandardMaterial({ color: 0x7867ff, roughness: 0.25 }));
    molG.add(atomA, atomB, atomC, atomD);
    registerComponent(molG, 'reactants', 'Molecular Species', new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(0, 0.55, 0));
    root.add(heaterG, beaker.group, molG);

    const names = ['Combination', 'Decomposition', 'Displacement', 'Double Displacement'];
    const liqCols = [0xfef3c7, 0xe2e8f0, 0x22c55e, 0xf8fafc];
    return {
      root, camPos: [0, 2.8, 4.8], target: [0, 1.35, 0],
      update: (_dt, elapsed, p, playing) => {
        const t = Math.round(p.reactionType !== undefined ? p.reactionType : 2);
        const prog = playing ? 0.5 + 0.5 * Math.sin(elapsed * 1.4) : (p.progress || 0.6);
        beaker.liquidMesh.material.color.setHex(t === 2 ? 0x0284c7 : 0x38bdf8).lerp(new THREE.Color(liqCols[t]), prog);
        hotRing.visible = t === 1;
        if (t === 0) { atomA.position.set(-1 + prog * 0.78, 0, 0); atomB.position.set(1 - prog * 0.78, 0, 0); atomC.visible = false; atomD.visible = false; }
        else if (t === 1) { atomA.position.set(-0.2 - prog * 0.9, 0, 0); atomB.position.set(0.2 + prog * 0.9, 0, 0); atomC.visible = false; atomD.visible = false; }
        else if (t === 2) { atomA.position.set(-1.1 + prog * 1.1, 0, 0); atomB.position.set(0.3 + prog * 0.9, 0, 0); atomC.visible = true; atomC.position.set(0.6 - prog * 0.25, 0.25, 0); atomD.visible = false; }
        else { atomA.position.set(-0.9, 0.15, 0); atomB.position.set(-0.5 + prog * 1.4, -0.15, 0); atomC.visible = true; atomC.position.set(0.5 - prog * 1.1, -0.15, 0); atomD.visible = true; atomD.position.set(0.9, 0.15, 0); }
      },
      readouts: (p) => [{ label: 'Class', value: names[Math.round(p.reactionType !== undefined ? p.reactionType : 2)] }],
    };
  }

  // C02: Balancing Chemical Equations
  if (id === 'C02') {
    const fulcrum = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.3, 24), makeMetal(0x475569)); fulcrum.position.y = 0.65;
    const beamG = new THREE.Group(); beamG.position.y = 1.3;
    beamG.add(new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 0.18), makeMetal(0xd97706, 0.22, 0.9)));
    registerComponent(beamG, 'beam', 'Analytical Beam', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 0.35, 0));

    const leftPan = new THREE.Group(); leftPan.position.set(-1.85, -0.15, 0);
    leftPan.add(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.75, 0.08, 24), makeMetal(0x94a3b8)));
    const lMols = new THREE.Group(); leftPan.add(lMols); beamG.add(leftPan);
    registerComponent(leftPan, 'reactantPan', 'Reactants (H2 + O2)', new THREE.Vector3(-0.35, 0, 0), new THREE.Vector3(0, 0.9, 0));

    const rightPan = new THREE.Group(); rightPan.position.set(1.85, -0.15, 0);
    rightPan.add(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.75, 0.08, 24), makeMetal(0x94a3b8)));
    const rMols = new THREE.Group(); rightPan.add(rMols); beamG.add(rightPan);
    registerComponent(rightPan, 'productPan', 'Product (H2O)', new THREE.Vector3(0.35, 0, 0), new THREE.Vector3(0, 0.9, 0));
    root.add(fulcrum, beamG);

    const hMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
    const oMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.25 });
    const bMat = makeMetal(0x94a3b8, 0.35, 0.7);
    const hGeo = new THREE.SphereGeometry(0.11, 14, 14), oGeo = new THREE.SphereGeometry(0.16, 16, 16);
    let lastKey = '';
    const rebuild = (p) => {
      const ch2 = Math.round(p.coeffH2 || 1), co2 = Math.round(p.coeffO2 || 1), ch2o = Math.round(p.coeffH2O || 1);
      const key = ch2 + '|' + co2 + '|' + ch2o;
      if (key === lastKey) return;
      lastKey = key; lMols.clear(); rMols.clear();
      for (let i = 0; i < ch2; i++) {
        const g = new THREE.Group(); const pa = new THREE.Vector3(-0.11, 0, 0), pb = new THREE.Vector3(0.11, 0, 0);
        const a = new THREE.Mesh(hGeo, hMat); a.position.copy(pa); const b = new THREE.Mesh(hGeo, hMat); b.position.copy(pb);
        g.add(a, b, createCylBetween(pa, pb, 0.028, bMat)); g.position.set(-0.35, 0.2 + i * 0.26, -0.25); lMols.add(g);
      }
      for (let i = 0; i < co2; i++) {
        const g = new THREE.Group(); const pa = new THREE.Vector3(-0.16, 0, 0), pb = new THREE.Vector3(0.16, 0, 0);
        const a = new THREE.Mesh(oGeo, oMat); a.position.copy(pa); const b = new THREE.Mesh(oGeo, oMat); b.position.copy(pb);
        g.add(a, b, createCylBetween(pa.clone().setY(0.03), pb.clone().setY(0.03), 0.022, bMat), createCylBetween(pa.clone().setY(-0.03), pb.clone().setY(-0.03), 0.022, bMat));
        g.position.set(0.35, 0.24 + i * 0.34, 0.25); lMols.add(g);
      }
      for (let i = 0; i < ch2o; i++) {
        const g = new THREE.Group(); const po = new THREE.Vector3(0, 0, 0), p1 = new THREE.Vector3(-0.19, 0.145, 0), p2 = new THREE.Vector3(0.19, 0.145, 0);
        const o = new THREE.Mesh(oGeo, oMat); const h1 = new THREE.Mesh(hGeo, hMat); h1.position.copy(p1); const h2 = new THREE.Mesh(hGeo, hMat); h2.position.copy(p2);
        g.add(o, h1, h2, createCylBetween(po, p1, 0.026, bMat), createCylBetween(po, p2, 0.026, bMat));
        g.position.set(i % 2 === 0 ? -0.3 : 0.3, 0.22 + Math.floor(i / 2) * 0.36, 0); rMols.add(g);
      }
    };
    return {
      root, camPos: [0, 2.7, 5.2], target: [0, 1.35, 0],
      update: (dt, _el, p) => {
        rebuild(p);
        const ch2 = Math.round(p.coeffH2 || 1), co2 = Math.round(p.coeffO2 || 1), ch2o = Math.round(p.coeffH2O || 1);
        const tilt = THREE.MathUtils.clamp(((ch2 * 2 + co2 * 32) - ch2o * 18) * 0.012, -0.35, 0.35);
        beamG.rotation.z = THREE.MathUtils.damp(beamG.rotation.z, tilt, 8, dt);
        leftPan.rotation.z = -beamG.rotation.z; rightPan.rotation.z = -beamG.rotation.z;
      },
      readouts: (p) => {
        const ch2 = Math.round(p.coeffH2 || 1), co2 = Math.round(p.coeffO2 || 1), ch2o = Math.round(p.coeffH2O || 1);
        const bal = ch2 * 2 === ch2o * 2 && co2 * 2 === ch2o;
        return [{ label: 'Mass', value: (ch2 * 2 + co2 * 32) + 'g vs ' + (ch2o * 18) + 'g' }, { label: 'Status', value: bal ? 'Balanced' : 'Unbalanced' }];
      },
    };
  }

  // C03: Acids, Bases and Indicators
  if (id === 'C03') {
    const litmus = createFlask(0.55, 1.35, 0x37b6ff); litmus.group.position.set(-1.5, 0, 0);
    registerComponent(litmus.group, 'litmusFlask', 'Litmus Flask', new THREE.Vector3(-0.3, 0, 0), new THREE.Vector3(0, 1.55, 0));
    const phen = createFlask(0.55, 1.35, 0xec4899);
    registerComponent(phen.group, 'phenFlask', 'Phenolphthalein', new THREE.Vector3(0, 0, 0.3), new THREE.Vector3(0, 1.55, 0));
    const mo = createFlask(0.55, 1.35, 0xeab308); mo.group.position.set(1.5, 0, 0);
    registerComponent(mo.group, 'moFlask', 'Methyl Orange', new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(0, 1.55, 0));

    const pipette = new THREE.Group(); pipette.position.set(0, 2.15, 0);
    pipette.add(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.02, 0.85, 14), makeGlass(0xe0f2fe, 0.45)));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 })); bulb.position.y = 0.48; pipette.add(bulb);
    registerComponent(pipette, 'pipette', 'Glass Pipette', new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0, 0.75, 0));
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), new THREE.MeshBasicMaterial({ color: 0x059669 }));
    root.add(litmus.group, phen.group, mo.group, pipette, drop);
    return {
      root, camPos: [0, 2.3, 4.8], target: [0, 1.0, 0],
      update: (_dt, elapsed, p, playing) => {
        const sol = Math.round(p.solutionType !== undefined ? p.solutionType : 2);
        litmus.liquidMesh.material.color.setHex(sol === 0 ? 0xef4444 : sol === 1 ? 0x8b5cf6 : 0x2563eb);
        phen.liquidMesh.material.color.setHex(sol === 2 ? 0xec4899 : 0xcbd5e1);
        phen.liquidMesh.material.opacity = sol === 2 ? 0.85 : 0.25;
        mo.liquidMesh.material.color.setHex(sol === 0 ? 0xef4444 : sol === 1 ? 0xf97316 : 0xeab308);
        const targetIdx = Math.floor((elapsed * 0.45) % 3) - 1;
        pipette.position.x = THREE.MathUtils.lerp(pipette.position.x, targetIdx * 1.5, 0.08);
        drop.position.set(pipette.position.x, 1.7 - (playing ? (elapsed * 1.3) % 1 : 0.3) * 1.25, 0);
      },
      readouts: (p) => [{ label: 'Medium', value: ['Acidic (HCl)', 'Neutral (H2O)', 'Basic (NaOH)'][Math.round(p.solutionType !== undefined ? p.solutionType : 2)] }],
    };
  }

  // C04: pH Scale (0-14 Rack)
  if (id === 'C04') {
    const phCols = [0xdc2626, 0xef4444, 0xf97316, 0xf59e0b, 0xeab308, 0x84cc16, 0x22c55e, 0x10b981, 0x14b8a6, 0x06b6d4, 0x0284c7, 0x2563eb, 0x4f46e5, 0x6d28d9, 0x7e22ce];
    const rack = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.16, 0.85), makeMetal(0x1e293b, 0.35, 0.7)); base.position.y = 0.08; rack.add(base);
    const tubes = [];
    for (let ph = 0; ph <= 14; ph++) {
      const x = (ph - 7) * 0.41;
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.35, 14), makeGlass(0xe0f2fe, 0.3)); glass.position.set(x, 0.84, 0);
      const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.9, 14), new THREE.MeshPhysicalMaterial({ color: phCols[ph], roughness: 0.1, transparent: true, opacity: 0.88 })); liq.position.set(x, 0.62, 0);
      rack.add(glass, liq); tubes.push(liq);
    }
    registerComponent(rack, 'rack', 'pH 0-14 Rack', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.85, 0));
    const probe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 1.2, 14), makeMetal(0x37b6ff, 0.25, 0.6)); probe.position.y = 1.95;
    registerComponent(probe, 'probe', 'pH Electrode', new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, 2.7, 0));
    root.add(rack, probe);
    return {
      root, camPos: [0, 2.3, 5.4], target: [0, 0.95, 0],
      update: (dt, _el, p) => {
        const ph = Math.max(0, Math.min(14, Math.round(p.phValue !== undefined ? p.phValue : 7)));
        probe.position.x = THREE.MathUtils.damp(probe.position.x, (ph - 7) * 0.41, 10, dt);
        tubes.forEach((t, idx) => { t.scale.x = THREE.MathUtils.damp(t.scale.x, idx === ph ? 1.18 : 1.0, 8, dt); t.scale.z = t.scale.x; });
      },
      readouts: (p) => {
        const ph = Math.max(0, Math.min(14, Math.round(p.phValue !== undefined ? p.phValue : 7)));
        return [{ label: 'pH Level', value: String(ph) }, { label: 'Medium', value: ph < 7 ? 'Acidic' : ph === 7 ? 'Neutral' : 'Alkaline' }];
      },
    };
  }

  // C05: Metal Reactivity Series
  if (id === 'C05') {
    const metals = [{ x: -1.65, c: 0xe2e8f0, r: 1.8 }, { x: -0.55, c: 0x94a3b8, r: 1.1 }, { x: 0.55, c: 0x64748b, r: 0.5 }, { x: 1.65, c: 0xd97706, r: 0 }];
    const tubesG = new THREE.Group(), stripsG = new THREE.Group(), bubbles = [];
    metals.forEach((m) => {
      const t = createBeaker(0.36, 1.5, 0x38bdf8, 0.72); t.group.position.set(m.x, 0, 0); tubesG.add(t.group);
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.15, 0.04), makeMetal(m.c, 0.28, 0.85)); s.position.set(m.x, 0.7, 0); stripsG.add(s);
      for (let b = 0; b < 5; b++) { const bub = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0x0284c7 })); root.add(bub); bubbles.push({ m: bub, bx: m.x, rate: m.r, off: b / 5 }); }
    });
    registerComponent(tubesG, 'tubes', 'Reaction Tubes', new THREE.Vector3(0, 0, -0.35), new THREE.Vector3(-1.8, 1.7, 0));
    registerComponent(stripsG, 'strips', 'Mg / Zn / Fe / Cu Strips', new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(1.8, 1.4, 0));
    root.add(tubesG, stripsG);
    return {
      root, camPos: [0, 2.2, 4.9], target: [0, 0.85, 0],
      update: (_dt, elapsed, p, playing) => {
        const conc = p.acidStrength || 1.0, bath = Math.round(p.bathType || 0);
        bubbles.forEach((b) => {
          b.m.visible = bath === 0 && b.rate > 0;
          if (!b.m.visible) return;
          const t = ((playing ? elapsed : 0) * b.rate * conc * 0.7 + b.off) % 1;
          b.m.position.set(b.bx + Math.sin(t * 9 + b.off * 6) * 0.08, 0.25 + t * 0.9, 0.06);
        });
      },
      readouts: (p) => [{ label: 'Reactivity', value: 'Mg > Zn > Fe > Cu' }, { label: 'Bath', value: (p.bathType || 0) >= 0.5 ? 'CuSO4' : 'Dilute HCl' }],
    };
  }

  // C06: Ionic Bonding (Bohr Shells + NaCl Crystal Lattice)
  if (id === 'C06') {
    const eMat = new THREE.MeshBasicMaterial({ color: 0x37b6ff }), eGeo = new THREE.SphereGeometry(0.055, 8, 8), rMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const addShells = (par, radii, counts) => radii.map((r, idx) => {
      const rg = new THREE.Group(); rg.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.014, 8, 36), rMat));
      for (let k = 0; k < counts[idx]; k++) { const a = (k / counts[idx]) * Math.PI * 2; const d = new THREE.Mesh(eGeo, eMat); d.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); rg.add(d); }
      par.add(rg); return rg;
    });
    const naG = new THREE.Group(); naG.position.set(-1.35, 1.35, 0);
    const naCore = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), new THREE.MeshStandardMaterial({ color: 0x7867ff, roughness: 0.25 })); naG.add(naCore);
    const naRings = addShells(naG, [0.52, 0.78], [2, 8]);
    registerComponent(naG, 'sodium', 'Sodium (Na+)', new THREE.Vector3(-0.4, 0, 0), new THREE.Vector3(0, 1.0, 0));

    const clG = new THREE.Group(); clG.position.set(1.35, 1.35, 0);
    const clCore = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 20), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.25 })); clG.add(clCore);
    const clRings = addShells(clG, [0.58, 0.86], [8, 7]);
    registerComponent(clG, 'chlorine', 'Chlorine (Cl-)', new THREE.Vector3(0.4, 0, 0), new THREE.Vector3(0, 1.05, 0));
    const valE = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), new THREE.MeshBasicMaterial({ color: 0x059669 }));

    const latG = new THREE.Group(); latG.position.set(0, 1.35, 0);
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      const isNa = (x + y + z) % 2 === 0;
      const ion = new THREE.Mesh(new THREE.SphereGeometry(isNa ? 0.18 : 0.26, 14, 14), new THREE.MeshStandardMaterial({ color: isNa ? 0x7867ff : 0x22c55e, roughness: 0.25 }));
      ion.position.set(x * 0.68, y * 0.68, z * 0.68); latG.add(ion);
    }
    registerComponent(latG, 'lattice', 'NaCl Crystal Lattice', new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0, 1.2, 0));
    root.add(naG, clG, valE, latG);
    return {
      root, camPos: [0, 2.3, 5.2], target: [0, 1.35, 0],
      update: (dt, elapsed, p, playing) => {
        const showL = (p.showLattice || 0) >= 0.5, t = p.transferProgress !== undefined ? p.transferProgress : 0.5;
        naG.visible = !showL; clG.visible = !showL; valE.visible = !showL; latG.visible = showL;
        naCore.scale.setScalar(1 - t * 0.16); clCore.scale.setScalar(1 + t * 0.14);
        valE.position.set(THREE.MathUtils.lerp(-0.6, 0.5, t), 1.35 + Math.sin(t * Math.PI) * 0.55, 0);
        if (playing && showL) latG.rotation.y += dt * 0.35;
        naRings[1].rotation.z = elapsed * 0.5; clRings[1].rotation.z = -elapsed * 0.4;
      },
      readouts: (p) => {
        const tr = (p.transferProgress !== undefined ? p.transferProgress : 0.5) >= 0.7;
        return [{ label: 'Na', value: tr ? 'Na+ (2,8)' : 'Na (2,8,1)' }, { label: 'Cl', value: tr ? 'Cl- (2,8,8)' : 'Cl (2,8,7)' }];
      },
    };
  }

  // C07: Electrolysis of Water
  if (id === 'C07') {
    const bath = createBeaker(1.1, 1.35, 0x38bdf8, 0.72);
    registerComponent(bath.group, 'cell', 'Electrolyte Bath', new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0, 1.5, 0));
    const cath = new THREE.Group(); cath.position.set(-0.48, 0.22, 0);
    const ct = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.85, 20), makeGlass(0xe0f2fe, 0.32)); ct.position.y = 0.92;
    const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.85, 10), makeMetal(0x1e293b, 0.6, 0.3)); cr.position.y = 0.42;
    const h2 = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.9, 16), new THREE.MeshBasicMaterial({ color: 0x37b6ff, transparent: true, opacity: 0.35 })); h2.position.y = 1.4;
    cath.add(ct, cr, h2);
    registerComponent(cath, 'cathode', 'Cathode (H2, -)', new THREE.Vector3(-0.4, 0.3, 0), new THREE.Vector3(0, 2.05, 0));

    const an = new THREE.Group(); an.position.set(0.48, 0.22, 0);
    const at = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.85, 20), makeGlass(0xe0f2fe, 0.32)); at.position.y = 0.92;
    const ar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.85, 10), makeMetal(0x1e293b, 0.6, 0.3)); ar.position.y = 0.42;
    const o2 = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.45, 16), new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.35 })); o2.position.y = 1.62;
    an.add(at, ar, o2);
    registerComponent(an, 'anode', 'Anode (O2, +)', new THREE.Vector3(0.4, 0.3, 0), new THREE.Vector3(0, 2.05, 0));
    const bubs = Array.from({ length: 12 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: i < 8 ? 0x059669 : 0xef4444 })); root.add(m); return { m, h: i < 8, off: i / 12 }; });
    root.add(bath.group, cath, an);
    return {
      root, camPos: [0, 2.2, 4.6], target: [0, 1.0, 0],
      update: (_dt, elapsed, p, playing) => {
        const v = p.voltage !== undefined ? p.voltage : 8, fill = p.elapsedMix || 0.65;
        h2.scale.y = Math.max(0.15, fill * 1.1); h2.position.y = 1.82 - h2.scale.y * 0.45;
        o2.scale.y = Math.max(0.08, fill * 0.55); o2.position.y = 1.82 - o2.scale.y * 0.22;
        bubs.forEach((b) => { b.m.visible = v > 0.5; const t = ((playing ? elapsed : 0) * (v / 8) * 0.9 + b.off) % 1; b.m.position.set(b.h ? -0.48 : 0.48, 0.35 + t * 1.35, (b.off - 0.5) * 0.14); });
      },
      readouts: (p) => {
        const f = p.elapsedMix || 0.65;
        return [{ label: 'H2 Vol', value: (f * 20).toFixed(1), unit: 'mL' }, { label: 'O2 Vol', value: (f * 10).toFixed(1), unit: 'mL' }, { label: 'Ratio', value: '2 : 1' }];
      },
    };
  }

  // C08: Carbon Compounds
  if (id === 'C08') {
    const cG = new THREE.Group(), hG = new THREE.Group(), oG = new THREE.Group(), bG = new THREE.Group();
    root.add(cG, hG, oG, bG);
    registerComponent(cG, 'carbon', 'Carbon Skeleton', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 2.2, 0));
    registerComponent(hG, 'hydrogen', 'Hydrogen Atoms', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(-1.1, 1.8, 0));
    registerComponent(oG, 'functional', 'Oxygen Functional', new THREE.Vector3(0.4, 0, 0), new THREE.Vector3(1.2, 1.9, 0));
    const cM = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 }), hM = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 }), oM = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.25 }), bM = makeMetal(0x94a3b8, 0.35, 0.7);
    let lastK = '';
    const buildMol = (p) => {
      const idx = Math.round(p.moleculeIndex !== undefined ? p.moleculeIndex : 2), sf = (p.bondStyle || 0) >= 0.5;
      const k = idx + '|' + sf; if (k === lastK) return; lastK = k;
      cG.clear(); hG.clear(); oG.clear(); bG.clear();
      const cR = sf ? 0.58 : 0.32, hR = sf ? 0.38 : 0.18, oR = sf ? 0.52 : 0.28, y0 = 1.45;
      const addA = (par, pos, r, mat) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 18), mat); m.position.copy(pos); par.add(m); return pos; };
      const addB = (a, b) => { if (!sf) bG.add(createCylBetween(a, b, 0.055, bM)); };
      if (idx === 0) {
        const c1 = addA(cG, new THREE.Vector3(0, y0, 0), cR, cM);
        [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.94, -0.33, 0), new THREE.Vector3(-0.47, -0.33, 0.81), new THREE.Vector3(-0.47, -0.33, -0.81)].forEach((d) => { const hp = addA(hG, c1.clone().addScaledVector(d, 0.92), hR, hM); addB(c1, hp); });
      } else {
        const c1 = addA(cG, new THREE.Vector3(-0.65, y0, 0), cR, cM), c2 = addA(cG, new THREE.Vector3(0.65, y0, 0), cR, cM); addB(c1, c2);
        [new THREE.Vector3(-1.25, y0 + 0.65, 0), new THREE.Vector3(-1.25, y0 - 0.45, 0.62), new THREE.Vector3(-1.25, y0 - 0.45, -0.62)].forEach((pt) => { addA(hG, pt, hR, hM); addB(c1, pt); });
        if (idx === 1) {
          [new THREE.Vector3(1.25, y0 + 0.65, 0), new THREE.Vector3(1.25, y0 - 0.45, 0.62), new THREE.Vector3(1.25, y0 - 0.45, -0.62)].forEach((pt) => { addA(hG, pt, hR, hM); addB(c2, pt); });
        } else if (idx === 2) {
          [new THREE.Vector3(0.95, y0 + 0.72, 0.35), new THREE.Vector3(0.95, y0 - 0.65, -0.35)].forEach((pt) => { addA(hG, pt, hR, hM); addB(c2, pt); });
          const o1 = addA(oG, new THREE.Vector3(1.55, y0, 0), oR, oM), hOh = addA(hG, new THREE.Vector3(2.15, y0 + 0.42, 0), hR, hM); addB(c2, o1); addB(o1, hOh);
        } else {
          const oD = addA(oG, new THREE.Vector3(1.15, y0 + 0.85, 0), oR, oM), oS = addA(oG, new THREE.Vector3(1.45, y0 - 0.55, 0), oR, oM), hA = addA(hG, new THREE.Vector3(2.15, y0 - 0.35, 0), hR, hM);
          if (!sf) { const off = new THREE.Vector3(0, 0, 0.06); bG.add(createCylBetween(c2.clone().add(off), oD.clone().add(off), 0.04, bM), createCylBetween(c2.clone().sub(off), oD.clone().sub(off), 0.04, bM)); }
          addB(c2, oS); addB(oS, hA);
        }
      }
    };
    return {
      root, camPos: [0.2, 2.2, 4.6], target: [0.2, 1.45, 0],
      update: (dt, _el, p, playing) => { buildMol(p); if (playing) root.rotation.y += dt * 0.35; },
      readouts: (p) => { const idx = Math.round(p.moleculeIndex !== undefined ? p.moleculeIndex : 2); return [{ label: 'Compound', value: ['Methane', 'Ethane', 'Ethanol', 'Ethanoic Acid'][idx] }, { label: 'Formula', value: ['CH4', 'C2H6', 'C2H5OH', 'CH3COOH'][idx] }]; },
    };
  }

  // C09: Soap and Detergent Micelle Action
  if (id === 'C09') {
    const fabric = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.14, 3.2), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })); fabric.position.y = 0.07;
    const micG = new THREE.Group();
    const grease = new THREE.Mesh(new THREE.SphereGeometry(0.55, 22, 22), new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, roughness: 0.25, clearcoat: 0.7 }));
    registerComponent(grease, 'grease', 'Oil / Grease Core', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.75, 0)); micG.add(grease);
    const tailsG = new THREE.Group(), headsG = new THREE.Group(), units = [];
    for (let i = 0; i < 24; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 24), th = Math.PI * (1 + Math.sqrt(5)) * i;
      const d = new THREE.Vector3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)).normalize();
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), new THREE.MeshStandardMaterial({ color: 0x37b6ff, emissive: 0x0369a1, emissiveIntensity: 0.3 }));
      tailsG.add(tail); headsG.add(head); units.push({ tail, head, dir: d });
    }
    registerComponent(tailsG, 'tails', 'Hydrophobic Tails', new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(-0.9, 0.9, 0));
    registerComponent(headsG, 'heads', 'Hydrophilic Heads (-COO-)', new THREE.Vector3(0, 0.85, 0), new THREE.Vector3(0.95, 1.1, 0));
    micG.add(tailsG, headsG); root.add(fabric, micG);
    const up = new THREE.Vector3(0, 1, 0);
    return {
      root, camPos: [0, 2.3, 4.4], target: [0, 1.1, 0],
      update: (dt, _el, p, playing) => {
        const prog = p.assembly !== undefined ? p.assembly : 0.65, cnt = Math.round(p.soapCount || 18);
        micG.position.y = 0.65 + prog * 1.1; if (playing) micG.rotation.y += dt * 0.4;
        units.forEach((u, idx) => {
          const vis = idx < cnt; u.tail.visible = vis; u.head.visible = vis; if (!vis) return;
          const dist = THREE.MathUtils.lerp(1.75, 0.86, prog);
          u.tail.position.copy(u.dir).multiplyScalar(dist); u.tail.quaternion.setFromUnitVectors(up, u.dir);
          u.head.position.copy(u.dir).multiplyScalar(dist + 0.36);
        });
      },
      readouts: (p) => [{ label: 'Micelle', value: Math.round((p.assembly || 0.65) * 100) + '%' }, { label: 'Molecules', value: String(Math.round(p.soapCount || 18)) }],
    };
  }

  // C10: Corrosion and Prevention
  if (id === 'C10') {
    const makeRod = (x, col) => {
      const g = new THREE.Group(); g.position.set(x, 0.8, 0);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.2, 20), makeMetal(col, 0.3, 0.8)); rod.rotation.x = Math.PI / 2;
      const rMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.92, transparent: true, opacity: 0 });
      const rust = new THREE.Mesh(new THREE.CylinderGeometry(0.295, 0.295, 1.9, 18), rMat); rust.rotation.x = Math.PI / 2;
      g.add(rod, rust); return { g, rMat, rust };
    };
    const bare = makeRod(-1.5, 0x64748b), painted = makeRod(0, 0x37b6ff), galv = makeRod(1.5, 0xcbd5e1);
    registerComponent(bare.g, 'bare', 'Bare Iron', new THREE.Vector3(-0.3, 0, 0), new THREE.Vector3(0, 0.6, 0));
    registerComponent(painted.g, 'painted', 'Painted Iron', new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 0.6, 0));
    registerComponent(galv.g, 'galvanised', 'Zinc-Galvanised', new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(0, 0.6, 0));
    const droplets = Array.from({ length: 15 }, (_, i) => {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), makeGlass(0x38bdf8, 0.65));
      d.position.set([-1.5, 0, 1.5][i % 3] + Math.sin(i * 2.1) * 0.18, 1.1, Math.cos(i * 1.7) * 0.75); root.add(d); return d;
    });
    root.add(bare.g, painted.g, galv.g);
    return {
      root, camPos: [0, 2.4, 4.6], target: [0, 0.8, 0],
      update: (_dt, _el, p) => {
        const hum = p.humidity !== undefined ? p.humidity : 0.6, scr = (p.scratched || 0) >= 0.5;
        bare.rMat.opacity = hum * 0.92; painted.rMat.opacity = scr ? hum * 0.72 : 0; painted.rust.scale.y = scr ? 0.28 : 1; galv.rMat.opacity = 0;
        droplets.forEach((d, idx) => { d.visible = hum > 0.15 && idx / droplets.length < hum; d.scale.setScalar(0.6 + hum * 0.7); });
      },
      readouts: (p) => [{ label: 'Bare Rust', value: Math.round((p.humidity || 0.6) * 100) + '%' }, { label: 'Zinc Shield', value: 'Cathodic Protection' }],
    };
  }
`;
