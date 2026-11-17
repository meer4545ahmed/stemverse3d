import * as THREE from 'three';
import { ActiveLabScene, LabSceneContext } from './sceneTypes';
import { createLiveDisplayTexture } from '../materials/proceduralTextures';
import {
  createBeakerGroup,
  createBenchDisplayConsole,
  createCylinderBetween,
  createErlenmeyerFlaskGroup,
  makeGlassMaterial,
  makeMetalMaterial,
  updateCylinderBetween,
} from './sceneHelpers';

const _v = new THREE.Vector3();

function phToColor(ph: number): number {
  const palette = [
    0xdc2626, 0xef4444, 0xf97316, 0xf59e0b, 0xeab308,
    0x84cc16, 0x22c55e, 0x10b981, 0x14b8a6, 0x06b6d4,
    0x0284c7, 0x2563eb, 0x4f46e5, 0x6d28d9, 0x7e22ce,
  ];
  return palette[THREE.MathUtils.clamp(Math.round(ph), 0, 14)];
}

export function buildChemistryScene(id: string, ctx: LabSceneContext): ActiveLabScene {
  const root = new THREE.Group();

  // =========================================================
  // C01: Types of Chemical Reactions (Magnetic Hotplate Stirrer + Thermometer + Live Calorimeter Console)
  // =========================================================
  if (id === 'C01') {
    const heaterGroup = new THREE.Group();
    const plateBase = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.24, 1.8),
      makeMetalMaterial(0x1f2937, 0.34, 0.78)
    );
    plateBase.position.y = 0.12;
    const ceramicPad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.88, 0.92, 0.08, 36),
      makeMetalMaterial(0x334155, 0.24, 0.72)
    );
    ceramicPad.position.y = 0.28;
    const hotRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.56, 0.045, 12, 36),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.85 })
    );
    hotRing.rotation.x = Math.PI / 2;
    hotRing.position.y = 0.325;
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.08, 18), makeMetalMaterial(0x94a3b8));
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0.62, 0.12, 0.92);
    heaterGroup.add(plateBase, ceramicPad, hotRing, knob);
    ctx.registerComponent(heaterGroup, 'heater', 'Magnetic Hotplate', new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(1.05, 0.3, 0));
    root.add(heaterGroup);

    const beaker = createBeakerGroup(0.75, 1.55, 0x38bdf8, 0.65, ctx.isSoftwareGl);
    beaker.group.position.y = 0.32;
    // PTFE magnetic stir capsule spinning at bottom of beaker
    const stirBar = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.055, 0.28, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
    );
    stirBar.rotation.z = Math.PI / 2;
    stirBar.position.y = 0.14;
    beaker.group.add(stirBar);

    // Digital glass thermometer probe dipped inside solution
    const thermStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 1.5, 12),
      makeGlassMaterial(0xe0f2fe, ctx.isSoftwareGl, 0.5)
    );
    thermStem.position.set(0.42, 1.05, 0);
    thermStem.rotation.z = -0.18;
    const mercBulb = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 12), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b }));
    mercBulb.position.set(0.28, 0.32, 0);
    beaker.group.add(thermStem, mercBulb);

    ctx.registerComponent(beaker.group, 'vessel', 'Reaction Beaker & Stirrer', new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(-0.95, 1.1, 0));
    root.add(beaker.group);

    // Floating molecular assembly above beaker
    const molGroup = new THREE.Group();
    molGroup.position.y = 2.6;
    const atomA = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), new THREE.MeshStandardMaterial({ color: 0x37b6ff, roughness: 0.22 }));
    const atomB = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.22 }));
    const atomC = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.22 }));
    const atomD = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), new THREE.MeshStandardMaterial({ color: 0x7867ff, roughness: 0.22 }));
    molGroup.add(atomA, atomB, atomC, atomD);
    ctx.registerComponent(molGroup, 'reactants', 'Molecular Species', new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(0, 0.58, 0));
    root.add(molGroup);

    // Live benchtop calorimetry monitor console
    const calDisp = createLiveDisplayTexture(420, 260, ctx.maxAnisotropy);
    const calConsole = createBenchDisplayConsole(1.65, 1.05, calDisp.texture);
    calConsole.position.set(2.25, 0.98, -0.55);
    calConsole.rotation.y = -0.42;
    root.add(calConsole);

    // Rising vapor particles
    const vapors = Array.from({ length: 8 }, (_, i) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.45 })
      );
      root.add(m);
      return { m, off: i / 8 };
    });

    const reactionNames = ['Combination', 'Decomposition', 'Displacement', 'Double Displacement'];
    const eqs = ['2Mg + O2 -> 2MgO', 'CaCO3 -> CaO + CO2', 'Fe + CuSO4 -> FeSO4 + Cu', 'BaCl2 + Na2SO4 -> BaSO4'];
    const liqColors = [0xfef3c7, 0xe2e8f0, 0x22c55e, 0xf8fafc];
    let lastDraw = 0;

    return {
      root,
      defaultCameraPos: [0.4, 2.9, 5.2],
      defaultTarget: [0.35, 1.35, 0],
      updateParams: () => {},
      update: (dt, elapsed, params, playing) => {
        const type = Math.round(params.reactionType ?? 2);
        const prog = playing ? 0.5 + 0.5 * Math.sin(elapsed * 1.4) : (params.progress ?? 0.6);
        const liqMat = beaker.liquidMesh.material as THREE.MeshPhysicalMaterial;
        liqMat.color.setHex(type === 2 ? 0x0284c7 : 0x38bdf8).lerp(new THREE.Color(liqColors[type]), prog);
        hotRing.visible = type === 1;
        if (playing) stirBar.rotation.y += dt * 11;

        vapors.forEach((v, idx) => {
          v.m.visible = type === 1 || prog > 0.25;
          const t = ((playing ? elapsed * 0.55 : 0.3) + v.off) % 1;
          v.m.position.set(Math.sin(idx * 2.1 + t * 4) * 0.28, 1.35 + t * 0.9, Math.cos(idx * 1.7) * 0.22);
        });

        if (type === 0) {
          atomA.position.set(-1.0 + prog * 0.78, 0, 0);
          atomB.position.set(1.0 - prog * 0.78, 0, 0);
          atomC.visible = false;
          atomD.visible = false;
        } else if (type === 1) {
          atomA.position.set(-0.2 - prog * 0.9, 0, 0);
          atomB.position.set(0.2 + prog * 0.9, 0, 0);
          atomC.visible = false;
          atomD.visible = false;
        } else if (type === 2) {
          atomA.position.set(-1.1 + prog * 1.1, 0, 0);
          atomB.position.set(0.3 + prog * 0.9, 0, 0);
          atomC.visible = true;
          atomC.position.set(0.6 - prog * 0.25, 0.25, 0);
          atomD.visible = false;
        } else {
          atomA.position.set(-0.9, 0.15, 0);
          atomB.position.set(-0.5 + prog * 1.4, -0.15, 0);
          atomC.visible = true;
          atomC.position.set(0.5 - prog * 1.1, -0.15, 0);
          atomD.visible = true;
          atomD.position.set(0.9, 0.15, 0);
        }

        lastDraw += dt;
        if (lastDraw > 0.1) {
          lastDraw = 0;
          const tempC = type === 1 ? 840 * prog : type === 0 ? 25 + prog * 190 : 24 + prog * 18;
          const c = calDisp.ctx;
          c.fillStyle = '#070A10';
          c.fillRect(0, 0, 420, 260);
          c.strokeStyle = 'rgba(56,189,248,0.22)';
          c.strokeRect(12, 12, 396, 236);
          c.fillStyle = '#94A3B8';
          c.font = 'bold 15px monospace';
          c.textAlign = 'left';
          c.fillText('REACTION CALORIMETER', 24, 38);
          c.fillStyle = '#38BDF8';
          c.font = 'bold 21px monospace';
          c.fillText(reactionNames[type].toUpperCase(), 24, 78);
          c.fillStyle = '#F8FAFC';
          c.font = 'bold 18px monospace';
          c.fillText(eqs[type], 24, 118);
          c.fillStyle = type === 1 ? '#F59E0B' : '#34D399';
          c.font = 'bold 34px monospace';
          c.fillText(`${tempC.toFixed(1)} °C`, 24, 178);
          c.fillStyle = '#94A3B8';
          c.font = 'bold 16px monospace';
          c.fillText(type === 1 ? 'ENDOTHERMIC (ΔH > 0)' : 'EXOTHERMIC / PRECIPITATE', 24, 224);
          calDisp.texture.needsUpdate = true;
        }
      },
      getReadouts: (params) => {
        const t = Math.round(params.reactionType ?? 2);
        return [
          { label: 'Reaction Class', value: reactionNames[t] },
          { label: 'Equation', value: ['2Mg+O₂→2MgO', 'CaCO₃→CaO+CO₂', 'Fe+CuSO₄→FeSO₄+Cu', 'BaCl₂+Na₂SO₄→BaSO₄'][t] },
        ];
      },
    };
  }

  // =========================================================
  // C02: Balancing Chemical Equations (Analytical Brass Balance + Stirrup Chains + Live Stoichiometry Display)
  // =========================================================
  if (id === 'C02') {
    const pedBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 1.0), makeMetalMaterial(0x1f2937, 0.35, 0.8));
    pedBase.position.y = 0.08;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 1.32, 24), makeMetalMaterial(0xd97706, 0.24, 0.9));
    pillar.position.y = 0.8;
    const dialPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 24, 1, false, 0, Math.PI), makeMetalMaterial(0x0f172a));
    dialPlate.rotation.x = Math.PI / 2;
    dialPlate.position.set(0, 0.45, 0.16);
    root.add(pedBase, pillar, dialPlate);

    const beamGroup = new THREE.Group();
    beamGroup.position.y = 1.48;
    const beamBar = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 0.18), makeMetalMaterial(0xd97706, 0.22, 0.9));
    const pointerNeedle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.92, 10), makeMetalMaterial(0x38bdf8, 0.2, 0.8));
    pointerNeedle.position.set(0, -0.5, 0.14);
    beamGroup.add(beamBar, pointerNeedle);
    ctx.registerComponent(beamGroup, 'beam', 'Analytical Beam & Pointer', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 0.35, 0));
    root.add(beamGroup);

    const addStirrups = (pan: THREE.Group) => {
      for (const sx of [-0.65, 0.65]) {
        const rod = createCylinderBetween(new THREE.Vector3(0, 0.12, 0), new THREE.Vector3(sx, -0.45, 0), 0.018, makeMetalMaterial(0x94a3b8));
        pan.add(rod);
      }
    };

    const leftPan = new THREE.Group();
    leftPan.position.set(-1.85, -0.05, 0);
    const lPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.76, 0.08, 32), makeMetalMaterial(0x94a3b8));
    lPlate.position.y = -0.48;
    leftPan.add(lPlate);
    addStirrups(leftPan);
    const lMols = new THREE.Group();
    lMols.position.y = -0.44;
    leftPan.add(lMols);
    ctx.registerComponent(leftPan, 'reactantPan', 'Reactants (H₂ + O₂)', new THREE.Vector3(-0.35, 0, 0), new THREE.Vector3(0, 0.5, 0));
    beamGroup.add(leftPan);

    const rightPan = new THREE.Group();
    rightPan.position.set(1.85, -0.05, 0);
    const rPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.76, 0.08, 32), makeMetalMaterial(0x94a3b8));
    rPlate.position.y = -0.48;
    rightPan.add(rPlate);
    addStirrups(rightPan);
    const rMols = new THREE.Group();
    rMols.position.y = -0.44;
    rightPan.add(rMols);
    ctx.registerComponent(rightPan, 'productPan', 'Product (H₂O)', new THREE.Vector3(0.35, 0, 0), new THREE.Vector3(0, 0.5, 0));
    beamGroup.add(rightPan);

    const balDisp = createLiveDisplayTexture(420, 240, ctx.maxAnisotropy);
    const balConsole = createBenchDisplayConsole(1.85, 1.02, balDisp.texture);
    balConsole.position.set(0, 0.88, -1.65);
    root.add(balConsole);

    const hMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
    const oMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.25 });
    const hGeo = new THREE.SphereGeometry(0.11, 16, 16);
    const oGeo = new THREE.SphereGeometry(0.16, 18, 18);
    let lastBalKey = '';

    const rebuildMols = (params: Record<string, number>) => {
      const ch2 = Math.round(params.coeffH2 ?? 1);
      const co2 = Math.round(params.coeffO2 ?? 1);
      const ch2o = Math.round(params.coeffH2O ?? 1);
      const key = `${ch2}|${co2}|${ch2o}`;
      if (key === lastBalKey) return;
      lastBalKey = key;

      lMols.clear();
      rMols.clear();
      for (let i = 0; i < ch2; i++) {
        const g = new THREE.Group();
        const a = new THREE.Mesh(hGeo, hMat);
        const b = new THREE.Mesh(hGeo, hMat);
        a.position.x = -0.1;
        b.position.x = 0.1;
        g.add(a, b);
        g.position.set(-0.35, 0.18 + i * 0.26, -0.25);
        lMols.add(g);
      }
      for (let i = 0; i < co2; i++) {
        const g = new THREE.Group();
        const a = new THREE.Mesh(oGeo, oMat);
        const b = new THREE.Mesh(oGeo, oMat);
        a.position.x = -0.14;
        b.position.x = 0.14;
        g.add(a, b);
        g.position.set(0.35, 0.22 + i * 0.34, 0.25);
        lMols.add(g);
      }
      for (let i = 0; i < ch2o; i++) {
        const g = new THREE.Group();
        const o = new THREE.Mesh(oGeo, oMat);
        const h1 = new THREE.Mesh(hGeo, hMat);
        const h2 = new THREE.Mesh(hGeo, hMat);
        h1.position.set(-0.18, 0.12, 0);
        h2.position.set(0.18, 0.12, 0);
        g.add(o, h1, h2);
        g.position.set((i % 2 === 0 ? -0.3 : 0.3), 0.2 + Math.floor(i / 2) * 0.36, 0);
        rMols.add(g);
      }

      const balanced = ch2 * 2 === ch2o * 2 && co2 * 2 === ch2o;
      const c = balDisp.ctx;
      c.fillStyle = '#070A10';
      c.fillRect(0, 0, 420, 240);
      c.strokeStyle = balanced ? '#10B981' : '#F59E0B';
      c.lineWidth = 4;
      c.strokeRect(10, 10, 400, 220);
      c.fillStyle = '#94A3B8';
      c.font = 'bold 16px monospace';
      c.textAlign = 'center';
      c.fillText('MASS CONSERVATION TELEMETRY', 210, 42);
      c.fillStyle = '#F8FAFC';
      c.font = 'bold 28px monospace';
      c.fillText(`${ch2} H2 + ${co2} O2  ->  ${ch2o} H2O`, 210, 102);
      c.fillStyle = '#38BDF8';
      c.font = 'bold 18px monospace';
      c.fillText(`L: ${ch2 * 2}H, ${co2 * 2}O  |  R: ${ch2o * 2}H, ${ch2o}O`, 210, 148);
      c.fillStyle = balanced ? '#34D399' : '#F59E0B';
      c.font = 'bold 22px monospace';
      c.fillText(balanced ? 'EQUATION BALANCED' : 'UNBALANCED MASS', 210, 200);
      balDisp.texture.needsUpdate = true;
    };

    return {
      root,
      defaultCameraPos: [0, 2.7, 5.4],
      defaultTarget: [0, 1.25, 0],
      updateParams: rebuildMols,
      update: (dt, _el, params) => {
        rebuildMols(params);
        const ch2 = Math.round(params.coeffH2 ?? 1);
        const co2 = Math.round(params.coeffO2 ?? 1);
        const ch2o = Math.round(params.coeffH2O ?? 1);
        const massL = ch2 * 2 + co2 * 32;
        const massR = ch2o * 18;
        const targetTilt = THREE.MathUtils.clamp((massL - massR) * 0.012, -0.35, 0.35);
        beamGroup.rotation.z = THREE.MathUtils.damp(beamGroup.rotation.z, targetTilt, 8, dt);
        leftPan.rotation.z = -beamGroup.rotation.z;
        rightPan.rotation.z = -beamGroup.rotation.z;
      },
      getReadouts: (params) => {
        const ch2 = Math.round(params.coeffH2 ?? 1);
        const co2 = Math.round(params.coeffO2 ?? 1);
        const ch2o = Math.round(params.coeffH2O ?? 1);
        const balanced = ch2 * 2 === ch2o * 2 && co2 * 2 === ch2o;
        return [
          { label: 'Left Atoms', value: `${ch2 * 2} H, ${co2 * 2} O` },
          { label: 'Right Atoms', value: `${ch2o * 2} H, ${ch2o} O` },
          { label: 'Status', value: balanced ? 'Balanced' : 'Unbalanced' },
        ];
      },
    };
  }

  // =========================================================
  // C03: Acids, Bases and Indicators (Anodized Tray + 3 Flasks + Pipette + Indicator Matrix)
  // =========================================================
  if (id === 'C03') {
    const tray = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.12, 1.45),
      makeMetalMaterial(0x1f2937, 0.32, 0.8)
    );
    tray.position.y = 0.06;
    root.add(tray);

    const litmus = createErlenmeyerFlaskGroup(0.55, 1.35, 0x37b6ff, ctx.isSoftwareGl);
    litmus.group.position.set(-1.5, 0.12, 0);
    ctx.registerComponent(litmus.group, 'litmusFlask', 'Litmus Flask', new THREE.Vector3(-0.3, 0, 0), new THREE.Vector3(0, 1.55, 0));

    const phen = createErlenmeyerFlaskGroup(0.55, 1.35, 0xec4899, ctx.isSoftwareGl);
    phen.group.position.set(0, 0.12, 0);
    ctx.registerComponent(phen.group, 'phenFlask', 'Phenolphthalein', new THREE.Vector3(0, 0, 0.3), new THREE.Vector3(0, 1.55, 0));

    const mo = createErlenmeyerFlaskGroup(0.55, 1.35, 0xeab308, ctx.isSoftwareGl);
    mo.group.position.set(1.5, 0.12, 0);
    ctx.registerComponent(mo.group, 'moFlask', 'Methyl Orange', new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(0, 1.55, 0));

    const pipette = new THREE.Group();
    pipette.position.set(0, 2.25, 0);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.02, 0.85, 16), makeGlassMaterial(0xe0f2fe, ctx.isSoftwareGl, 0.45));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 }));
    bulb.position.y = 0.48;
    pipette.add(stem, bulb);
    ctx.registerComponent(pipette, 'pipette', 'Glass Pipette', new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0, 0.75, 0));

    const indDisp = createLiveDisplayTexture(420, 220, ctx.maxAnisotropy);
    const indConsole = createBenchDisplayConsole(1.85, 0.96, indDisp.texture);
    indConsole.position.set(0, 2.55, -1.55);
    root.add(indConsole);

    root.add(litmus.group, phen.group, mo.group, pipette);

    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), new THREE.MeshBasicMaterial({ color: 0x059669 }));
    root.add(drop);
    let lastSol = -1;

    return {
      root,
      defaultCameraPos: [0, 2.5, 5.2],
      defaultTarget: [0, 1.15, 0],
      updateParams: () => {},
      update: (_dt, elapsed, params, playing) => {
        const sol = Math.round(params.solutionType ?? 2);
        const lCol = sol === 0 ? 0xef4444 : sol === 1 ? 0x8b5cf6 : 0x2563eb;
        const pCol = sol === 2 ? 0xec4899 : 0xcbd5e1;
        const mCol = sol === 0 ? 0xef4444 : sol === 1 ? 0xf97316 : 0xeab308;
        (litmus.liquidMesh.material as THREE.MeshPhysicalMaterial).color.setHex(lCol);
        (phen.liquidMesh.material as THREE.MeshPhysicalMaterial).color.setHex(pCol);
        (phen.liquidMesh.material as THREE.MeshPhysicalMaterial).opacity = sol === 2 ? 0.85 : 0.25;
        (mo.liquidMesh.material as THREE.MeshPhysicalMaterial).color.setHex(mCol);

        const targetIdx = Math.floor((elapsed * 0.45) % 3) - 1;
        pipette.position.x = THREE.MathUtils.lerp(pipette.position.x, targetIdx * 1.5, 0.08);
        const fallT = playing ? (elapsed * 1.3) % 1 : 0.3;
        drop.position.set(pipette.position.x, 1.8 - fallT * 1.2, 0);

        if (sol !== lastSol) {
          lastSol = sol;
          const c = indDisp.ctx;
          c.fillStyle = '#070A10';
          c.fillRect(0, 0, 420, 220);
          c.strokeStyle = '#38BDF8';
          c.lineWidth = 3;
          c.strokeRect(10, 10, 400, 200);
          c.fillStyle = '#94A3B8';
          c.font = 'bold 16px monospace';
          c.textAlign = 'left';
          c.fillText('TITRATION INDICATOR MATRIX', 24, 38);
          c.fillStyle = sol === 0 ? '#EF4444' : sol === 1 ? '#A78BFA' : '#38BDF8';
          c.font = 'bold 26px monospace';
          c.fillText(['MEDIUM: ACIDIC (HCl)', 'MEDIUM: NEUTRAL (H2O)', 'MEDIUM: BASIC (NaOH)'][sol], 24, 82);
          c.fillStyle = '#E2E8F0';
          c.font = 'bold 18px monospace';
          c.fillText(`Litmus: ${['RED', 'PURPLE', 'BLUE'][sol]}`, 24, 126);
          c.fillText(`Phenolphthalein: ${sol === 2 ? 'MAGENTA PINK' : 'COLOURLESS'}`, 24, 158);
          c.fillText(`Methyl Orange: ${['RED', 'ORANGE', 'YELLOW'][sol]}`, 24, 190);
          indDisp.texture.needsUpdate = true;
        }
      },
      getReadouts: (params) => {
        const sol = Math.round(params.solutionType ?? 2);
        return [
          { label: 'Medium', value: ['Acidic (HCl)', 'Neutral (H₂O)', 'Basic (NaOH)'][sol] },
          { label: 'Litmus / Phen / MO', value: ['Red / Clear / Red', 'Purple / Clear / Orange', 'Blue / Pink / Yellow'][sol] },
        ];
      },
    };
  }

  // =========================================================
  // C04: pH Scale (15-Tube Spectrum Rack + Digital Benchtop pH Meter Console)
  // =========================================================
  if (id === 'C04') {
    const rackGroup = new THREE.Group();
    const baseBar = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.16, 0.9), makeMetalMaterial(0x1f2937, 0.28, 0.82));
    baseBar.position.y = 0.08;
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.06, 0.45), makeMetalMaterial(0x334155, 0.3, 0.85));
    topRail.position.y = 1.08;
    rackGroup.add(baseBar, topRail);

    const tubes: THREE.Mesh[] = [];
    for (let ph = 0; ph <= 14; ph++) {
      const x = (ph - 7) * 0.41;
      const glass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 1.38, 16),
        makeGlassMaterial(0xe0f2fe, ctx.isSoftwareGl, 0.32)
      );
      glass.position.set(x, 0.85, 0);
      const liq = new THREE.Mesh(
        new THREE.CylinderGeometry(0.115, 0.115, 0.92, 16),
        new THREE.MeshPhysicalMaterial({ color: phToColor(ph), roughness: 0.1, transparent: true, opacity: 0.9 })
      );
      liq.position.set(x, 0.62, 0);
      rackGroup.add(glass, liq);
      tubes.push(liq);
    }
    ctx.registerComponent(rackGroup, 'rack', 'pH 0–14 Spectrum Rack', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.75, 0));
    root.add(rackGroup);

    const probeGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 1.15, 16), makeMetalMaterial(0x37b6ff, 0.25, 0.7));
    body.position.y = 1.98;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 12), makeGlassMaterial(0xbae6fd, ctx.isSoftwareGl, 0.7));
    tip.position.y = 1.38;
    probeGroup.add(body, tip);
    ctx.registerComponent(probeGroup, 'probe', 'Glass pH Electrode', new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, 2.68, 0));
    root.add(probeGroup);

    const phDisp = createLiveDisplayTexture(420, 240, ctx.maxAnisotropy);
    const phConsole = createBenchDisplayConsole(1.85, 1.05, phDisp.texture);
    phConsole.position.set(0, 2.75, -1.35);
    root.add(phConsole);
    let lastPh = -1;

    const examples = [
      'Battery Acid', 'Gastric Juice', 'Lemon Juice', 'Vinegar', 'Tomato',
      'Black Coffee', 'Milk', 'Pure Water', 'Seawater', 'Baking Soda',
      'Antacid', 'Ammonia', 'Soapy Water', 'Bleach', 'Drain Cleaner',
    ];

    return {
      root,
      defaultCameraPos: [0, 2.5, 5.8],
      defaultTarget: [0, 1.15, 0],
      updateParams: () => {},
      update: (dt, _el, params) => {
        const ph = Math.round(params.phValue ?? 7);
        probeGroup.position.x = THREE.MathUtils.damp(probeGroup.position.x, (ph - 7) * 0.41, 10, dt);
        tubes.forEach((t, idx) => {
          const s = idx === ph ? 1.18 : 1.0;
          t.scale.x = THREE.MathUtils.damp(t.scale.x, s, 8, dt);
          t.scale.z = t.scale.x;
        });

        if (ph !== lastPh) {
          lastPh = ph;
          const c = phDisp.ctx;
          c.fillStyle = '#070A10';
          c.fillRect(0, 0, 420, 240);
          const hex = '#' + phToColor(ph).toString(16).padStart(6, '0');
          c.strokeStyle = hex;
          c.lineWidth = 5;
          c.strokeRect(10, 10, 400, 220);
          c.fillStyle = '#94A3B8';
          c.font = 'bold 16px monospace';
          c.textAlign = 'left';
          c.fillText('DIGITAL pH METER', 26, 40);
          c.fillStyle = hex;
          c.font = 'bold 54px monospace';
          c.fillText(`pH ${ph}.00`, 26, 114);
          c.fillStyle = '#F8FAFC';
          c.font = 'bold 22px monospace';
          c.fillText(examples[ph], 26, 162);
          c.fillStyle = '#38BDF8';
          c.font = 'bold 16px monospace';
          c.fillText(`[H+] = 10^-${ph} M  |  ${ph < 7 ? 'ACIDIC' : ph === 7 ? 'NEUTRAL' : 'BASIC'}`, 26, 206);
          phDisp.texture.needsUpdate = true;
        }
      },
      getReadouts: (params) => {
        const ph = Math.round(params.phValue ?? 7);
        return [
          { label: 'pH Level', value: String(ph), unit: 'pH' },
          { label: 'Nature', value: ph < 7 ? 'Acidic (H⁺ > OH⁻)' : ph === 7 ? 'Neutral' : 'Basic (OH⁻ > H⁺)' },
          { label: 'Sample', value: examples[ph] },
        ];
      },
    };
  }

  // =========================================================
  // C05: Metal Reactivity Series (Anodized Rack + Cu Displacement Plating + Bubbling)
  // =========================================================
  if (id === 'C05') {
    const rackFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.14, 0.95),
      makeMetalMaterial(0x1f2937, 0.34, 0.8)
    );
    rackFrame.position.y = 0.07;
    root.add(rackFrame);

    const tubesGroup = new THREE.Group();
    const stripsGroup = new THREE.Group();
    const metals = [
      { name: 'Mg', x: -1.65, color: 0xe2e8f0, rate: 1.8 },
      { name: 'Zn', x: -0.55, color: 0x94a3b8, rate: 1.1 },
      { name: 'Fe', x: 0.55, color: 0x64748b, rate: 0.5 },
      { name: 'Cu', x: 1.65, color: 0xd97706, rate: 0.0 },
    ];
    const bubbles: { mesh: THREE.Mesh; baseX: number; rate: number; offset: number }[] = [];
    const liquids: THREE.MeshPhysicalMaterial[] = [];
    let fePlatingMesh: THREE.Mesh | null = null;

    metals.forEach((m, idx) => {
      const tube = createBeakerGroup(0.36, 1.5, 0x38bdf8, 0.72, ctx.isSoftwareGl);
      tube.group.position.set(m.x, 0.14, 0);
      tubesGroup.add(tube.group);
      liquids.push(tube.liquidMesh.material as THREE.MeshPhysicalMaterial);

      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 1.15, 0.04),
        makeMetalMaterial(m.color, 0.28, 0.85)
      );
      strip.position.set(m.x, 0.82, 0);
      stripsGroup.add(strip);

      if (idx === 2) {
        fePlatingMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.155, 0.68, 0.055),
          makeMetalMaterial(0xd97706, 0.35, 0.82)
        );
        fePlatingMesh.position.set(m.x, 0.56, 0);
        stripsGroup.add(fePlatingMesh);
      }

      for (let b = 0; b < 6; b++) {
        const bub = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        root.add(bub);
        bubbles.push({ mesh: bub, baseX: m.x, rate: m.rate, offset: b / 6 });
      }
    });

    ctx.registerComponent(tubesGroup, 'tubes', 'Reaction Tubes (HCl / CuSO₄)', new THREE.Vector3(0, 0, -0.35), new THREE.Vector3(-1.8, 1.75, 0));
    ctx.registerComponent(stripsGroup, 'strips', 'Mg / Zn / Fe / Cu Strips', new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(1.8, 1.45, 0));
    root.add(tubesGroup, stripsGroup);

    return {
      root,
      defaultCameraPos: [0, 2.3, 5.0],
      defaultTarget: [0, 0.9, 0],
      updateParams: () => {},
      update: (_dt, elapsed, params, playing) => {
        const conc = params.acidStrength ?? 1.0;
        const bath = Math.round(params.bathType ?? 0);
        if (fePlatingMesh) fePlatingMesh.visible = bath === 1;
        liquids.forEach((lm, idx) => {
          if (bath === 1) {
            lm.color.setHex(idx === 2 ? 0x10b981 : idx < 2 ? 0xa7f3d0 : 0x0284c7);
          } else {
            lm.color.setHex(0x38bdf8);
          }
        });
        bubbles.forEach((b) => {
          b.mesh.visible = bath === 0 && b.rate > 0;
          if (!b.mesh.visible) return;
          const t = ((playing ? elapsed : 0) * b.rate * conc * 0.7 + b.offset) % 1;
          b.mesh.position.set(b.baseX + Math.sin(t * 9 + b.offset * 6) * 0.08, 0.38 + t * 0.9, 0.06);
        });
      },
      getReadouts: (params) => [
        { label: 'Reactivity Order', value: 'Mg > Zn > Fe > Cu' },
        { label: 'Bath Medium', value: (params.bathType ?? 0) >= 0.5 ? 'CuSO₄ (Cu Plated on Fe)' : 'Dilute HCl (H₂ Gas)' },
      ],
    };
  }

  // =========================================================
  // C06: Ionic Bonding (Orbital Electrons + Ionic Lattice Bond Struts)
  // =========================================================
  if (id === 'C06') {
    const naGroup = new THREE.Group();
    naGroup.position.set(-1.35, 1.35, 0);
    const naCore = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 24), new THREE.MeshStandardMaterial({ color: 0x7867ff, roughness: 0.25 }));
    const naShell = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.018, 8, 40), new THREE.MeshBasicMaterial({ color: 0x94a3b8 }));
    naGroup.add(naCore, naShell);
    for (let e = 0; e < 4; e++) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), new THREE.MeshBasicMaterial({ color: 0xa78bfa }));
      const a = (e / 4) * Math.PI * 2;
      orb.position.set(Math.cos(a) * 0.75, Math.sin(a) * 0.75, 0);
      naShell.add(orb);
    }
    ctx.registerComponent(naGroup, 'sodium', 'Sodium (Na⁺)', new THREE.Vector3(-0.4, 0, 0), new THREE.Vector3(0, 1.0, 0));

    const clGroup = new THREE.Group();
    clGroup.position.set(1.35, 1.35, 0);
    const clCore = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 24), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.25 }));
    const clShell = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.018, 8, 40), new THREE.MeshBasicMaterial({ color: 0x94a3b8 }));
    clGroup.add(clCore, clShell);
    for (let e = 0; e < 7; e++) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), new THREE.MeshBasicMaterial({ color: 0x34d399 }));
      const a = (e / 7) * Math.PI * 2;
      orb.position.set(Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0);
      clShell.add(orb);
    }
    ctx.registerComponent(clGroup, 'chlorine', 'Chlorine (Cl⁻)', new THREE.Vector3(0.4, 0, 0), new THREE.Vector3(0, 1.05, 0));

    const valenceE = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), new THREE.MeshBasicMaterial({ color: 0x37b6ff }));

    // 3x3x3 NaCl Crystal Lattice with Ionic Bond Struts
    const latticeGroup = new THREE.Group();
    latticeGroup.position.set(0, 1.35, 0);
    const bondMat = makeMetalMaterial(0x475569, 0.4, 0.6);
    const spacing = 0.68;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const isNa = (x + y + z) % 2 === 0;
          const pos = new THREE.Vector3(x * spacing, y * spacing, z * spacing);
          const ion = new THREE.Mesh(
            new THREE.SphereGeometry(isNa ? 0.17 : 0.25, 18, 18),
            new THREE.MeshStandardMaterial({ color: isNa ? 0x7867ff : 0x22c55e, roughness: 0.25 })
          );
          ion.position.copy(pos);
          latticeGroup.add(ion);
          if (x < 1) latticeGroup.add(createCylinderBetween(pos, new THREE.Vector3((x + 1) * spacing, y * spacing, z * spacing), 0.022, bondMat));
          if (y < 1) latticeGroup.add(createCylinderBetween(pos, new THREE.Vector3(x * spacing, (y + 1) * spacing, z * spacing), 0.022, bondMat));
          if (z < 1) latticeGroup.add(createCylinderBetween(pos, new THREE.Vector3(x * spacing, y * spacing, (z + 1) * spacing), 0.022, bondMat));
        }
      }
    }
    ctx.registerComponent(latticeGroup, 'lattice', 'NaCl Crystal Lattice', new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0, 1.25, 0));
    root.add(naGroup, clGroup, valenceE, latticeGroup);

    return {
      root,
      defaultCameraPos: [0, 2.3, 5.2],
      defaultTarget: [0, 1.35, 0],
      updateParams: () => {},
      update: (dt, elapsed, params, playing) => {
        const showLat = (params.showLattice ?? 0) >= 0.5;
        const t = params.transferProgress ?? 0.5;
        naGroup.visible = !showLat;
        clGroup.visible = !showLat;
        valenceE.visible = !showLat;
        latticeGroup.visible = showLat;

        naCore.scale.setScalar(1 - t * 0.16);
        clCore.scale.setScalar(1 + t * 0.14);
        valenceE.position.set(THREE.MathUtils.lerp(-0.6, 0.5, t), 1.35 + Math.sin(t * Math.PI) * 0.55, 0);
        if (playing && showLat) {
          latticeGroup.rotation.y += dt * 0.35;
        }
        naShell.rotation.z = elapsed * 0.5;
        clShell.rotation.z = -elapsed * 0.4;
      },
      getReadouts: (params) => {
        const transferred = (params.transferProgress ?? 0.5) >= 0.7;
        return [
          { label: 'Na State', value: transferred ? 'Na⁺ (2,8)' : 'Na (2,8,1)' },
          { label: 'Cl State', value: transferred ? 'Cl⁻ (2,8,8)' : 'Cl (2,8,7)' },
        ];
      },
    };
  }

  // =========================================================
  // C07: Electrolysis of Water (DC Power Console + Graduated Eudiometer Tubes + Leads)
  // =========================================================
  if (id === 'C07') {
    const bath = createBeakerGroup(1.12, 1.35, 0x38bdf8, 0.72, ctx.isSoftwareGl);
    ctx.registerComponent(bath.group, 'cell', 'Electrolyte Bath', new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0, 1.5, 0));

    const addGraduations = (grp: THREE.Group) => {
      for (let m = 0; m < 5; m++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.244, 0.008, 6, 20), new THREE.MeshBasicMaterial({ color: 0x94a3b8 }));
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.55 + m * 0.28;
        grp.add(ring);
      }
    };

    const cathodeGroup = new THREE.Group();
    cathodeGroup.position.set(-0.48, 0.22, 0);
    const cathTube = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.85, 24), makeGlassMaterial(0xe0f2fe, ctx.isSoftwareGl, 0.32));
    cathTube.position.y = 0.92;
    const cathRod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.85, 12), makeMetalMaterial(0x94a3b8, 0.3, 0.85));
    cathRod.position.y = 0.42;
    const h2Gas = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.9, 20), new THREE.MeshBasicMaterial({ color: 0x37b6ff, transparent: true, opacity: 0.38 }));
    h2Gas.position.y = 1.4;
    addGraduations(cathodeGroup);
    cathodeGroup.add(cathTube, cathRod, h2Gas);
    ctx.registerComponent(cathodeGroup, 'cathode', 'Cathode (H₂, -)', new THREE.Vector3(-0.4, 0.3, 0), new THREE.Vector3(0, 2.05, 0));

    const anodeGroup = new THREE.Group();
    anodeGroup.position.set(0.48, 0.22, 0);
    const anTube = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.85, 24), makeGlassMaterial(0xe0f2fe, ctx.isSoftwareGl, 0.32));
    anTube.position.y = 0.92;
    const anRod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.85, 12), makeMetalMaterial(0xd97706, 0.3, 0.85));
    anRod.position.y = 0.42;
    const o2Gas = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.45, 20), new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.38 }));
    o2Gas.position.y = 1.62;
    addGraduations(anodeGroup);
    anodeGroup.add(anTube, anRod, o2Gas);
    ctx.registerComponent(anodeGroup, 'anode', 'Anode (O₂, +)', new THREE.Vector3(0.4, 0.3, 0), new THREE.Vector3(0, 2.05, 0));

    const eDisp = createLiveDisplayTexture(360, 220, ctx.maxAnisotropy);
    const eConsole = createBenchDisplayConsole(1.5, 0.92, eDisp.texture);
    eConsole.position.set(2.25, 0.78, -0.5);
    eConsole.rotation.y = -0.45;
    root.add(eConsole);

    root.add(bath.group, cathodeGroup, anodeGroup);
    const bubs = Array.from({ length: 12 }, (_, i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: i < 8 ? 0x38bdf8 : 0xef4444 }));
      root.add(m);
      return { m, isH2: i < 8, off: i / 12 };
    });
    let lastKey = '';

    return {
      root,
      defaultCameraPos: [0.3, 2.3, 5.0],
      defaultTarget: [0.3, 1.05, 0],
      updateParams: () => {},
      update: (_dt, elapsed, params, playing) => {
        const v = params.voltage ?? 8;
        const fill = params.elapsedMix ?? 0.65;
        h2Gas.scale.y = Math.max(0.15, fill * 1.1);
        h2Gas.position.y = 1.82 - h2Gas.scale.y * 0.45;
        o2Gas.scale.y = Math.max(0.08, fill * 0.55);
        o2Gas.position.y = 1.82 - o2Gas.scale.y * 0.22;

        bubs.forEach((b) => {
          b.m.visible = v > 0.5;
          const t = ((playing ? elapsed : 0) * (v / 8) * 0.9 + b.off) % 1;
          b.m.position.set(b.isH2 ? -0.48 : 0.48, 0.35 + t * 1.35, (b.off - 0.5) * 0.14);
        });

        const key = `${v.toFixed(1)}|${fill.toFixed(2)}`;
        if (key !== lastKey) {
          lastKey = key;
          const c = eDisp.ctx;
          c.fillStyle = '#070A10';
          c.fillRect(0, 0, 360, 220);
          c.strokeStyle = '#38BDF8';
          c.lineWidth = 3;
          c.strokeRect(10, 10, 340, 200);
          c.fillStyle = '#94A3B8';
          c.font = 'bold 15px monospace';
          c.textAlign = 'left';
          c.fillText('VOLTAMETER SUPPLY', 22, 38);
          c.fillStyle = '#38BDF8';
          c.font = 'bold 28px monospace';
          c.fillText(`${v.toFixed(1)} V DC`, 22, 82);
          c.fillStyle = '#34D399';
          c.font = 'bold 20px monospace';
          c.fillText(`H2 (-): ${(fill * 20).toFixed(1)} mL`, 22, 134);
          c.fillStyle = '#F87171';
          c.fillText(`O2 (+): ${(fill * 10).toFixed(1)} mL`, 22, 168);
          c.fillStyle = '#F8FAFC';
          c.font = 'bold 16px monospace';
          c.fillText('STOICHIOMETRIC RATIO 2 : 1', 22, 202);
          eDisp.texture.needsUpdate = true;
        }
      },
      getReadouts: (params) => {
        const fill = params.elapsedMix ?? 0.65;
        return [
          { label: 'H₂ Volume (Cathode)', value: (fill * 20).toFixed(1), unit: 'mL' },
          { label: 'O₂ Volume (Anode)', value: (fill * 10).toFixed(1), unit: 'mL' },
          { label: 'Ratio H₂ : O₂', value: '2 : 1' },
        ];
      },
    };
  }

  // =========================================================
  // C08: Carbon Compounds (True Double-Bond Twin Rods & Electron Aura)
  // =========================================================
  if (id === 'C08') {
    const cGroup = new THREE.Group();
    const hGroup = new THREE.Group();
    const oGroup = new THREE.Group();
    const bondsGroup = new THREE.Group();
    root.add(cGroup, hGroup, oGroup, bondsGroup);

    ctx.registerComponent(cGroup, 'carbon', 'Carbon Skeleton', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 2.2, 0));
    ctx.registerComponent(hGroup, 'hydrogen', 'Hydrogen Atoms', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(-1.1, 1.8, 0));
    ctx.registerComponent(oGroup, 'functional', 'Oxygen Functional Group', new THREE.Vector3(0.4, 0, 0), new THREE.Vector3(1.2, 1.9, 0));

    const cMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.24, metalness: 0.38 });
    const hMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
    const oMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.25 });
    const bondMat = makeMetalMaterial(0x94a3b8, 0.35, 0.7);
    let lastMolKey = '';

    const buildMol = (params: Record<string, number>) => {
      const idx = Math.round(params.moleculeIndex ?? 2);
      const spaceFill = (params.bondStyle ?? 0) >= 0.5;
      const key = `${idx}|${spaceFill ? 1 : 0}`;
      if (key === lastMolKey) return;
      lastMolKey = key;

      cGroup.clear();
      hGroup.clear();
      oGroup.clear();
      bondsGroup.clear();

      const cR = spaceFill ? 0.58 : 0.32;
      const hR = spaceFill ? 0.38 : 0.18;
      const oR = spaceFill ? 0.52 : 0.28;

      const addAtom = (parent: THREE.Group, pos: THREE.Vector3, r: number, mat: THREE.Material) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 24), mat);
        m.position.copy(pos);
        m.castShadow = true;
        parent.add(m);
        return pos;
      };
      const addBond = (a: THREE.Vector3, b: THREE.Vector3, dbl = false) => {
        if (spaceFill) return;
        if (!dbl) {
          bondsGroup.add(createCylinderBetween(a, b, 0.06, bondMat));
        } else {
          const offset = new THREE.Vector3(0, 0, 0.08);
          bondsGroup.add(createCylinderBetween(a.clone().add(offset), b.clone().add(offset), 0.045, bondMat));
          bondsGroup.add(createCylinderBetween(a.clone().sub(offset), b.clone().sub(offset), 0.045, bondMat));
        }
      };

      const y0 = 1.45;
      if (idx === 0) {
        const c1 = addAtom(cGroup, new THREE.Vector3(0, y0, 0), cR, cMat);
        const dirs = [
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0.94, -0.33, 0),
          new THREE.Vector3(-0.47, -0.33, 0.81),
          new THREE.Vector3(-0.47, -0.33, -0.81),
        ];
        dirs.forEach((d) => {
          const hp = addAtom(hGroup, c1.clone().addScaledVector(d, 0.92), hR, hMat);
          addBond(c1, hp);
        });
      } else {
        const c1 = addAtom(cGroup, new THREE.Vector3(-0.65, y0, 0), cR, cMat);
        const c2 = addAtom(cGroup, new THREE.Vector3(0.65, y0, 0), cR, cMat);
        addBond(c1, c2);
        [
          new THREE.Vector3(-1.25, y0 + 0.65, 0),
          new THREE.Vector3(-1.25, y0 - 0.45, 0.62),
          new THREE.Vector3(-1.25, y0 - 0.45, -0.62),
        ].forEach((p) => {
          addAtom(hGroup, p, hR, hMat);
          addBond(c1, p);
        });
        if (idx === 1) {
          [
            new THREE.Vector3(1.25, y0 + 0.65, 0),
            new THREE.Vector3(1.25, y0 - 0.45, 0.62),
            new THREE.Vector3(1.25, y0 - 0.45, -0.62),
          ].forEach((p) => {
            addAtom(hGroup, p, hR, hMat);
            addBond(c2, p);
          });
        } else if (idx === 2) {
          [
            new THREE.Vector3(0.95, y0 + 0.72, 0.35),
            new THREE.Vector3(0.95, y0 - 0.65, -0.35),
          ].forEach((p) => {
            addAtom(hGroup, p, hR, hMat);
            addBond(c2, p);
          });
          const o1 = addAtom(oGroup, new THREE.Vector3(1.55, y0, 0), oR, oMat);
          const hOh = addAtom(hGroup, new THREE.Vector3(2.15, y0 + 0.42, 0), hR, hMat);
          addBond(c2, o1);
          addBond(o1, hOh);
        } else {
          const oDbl = addAtom(oGroup, new THREE.Vector3(1.15, y0 + 0.85, 0), oR, oMat);
          const oSingle = addAtom(oGroup, new THREE.Vector3(1.45, y0 - 0.55, 0), oR, oMat);
          const hAcid = addAtom(hGroup, new THREE.Vector3(2.15, y0 - 0.35, 0), hR, hMat);
          addBond(c2, oDbl, true);
          addBond(c2, oSingle);
          addBond(oSingle, hAcid);
        }
      }
    };

    return {
      root,
      defaultCameraPos: [0.2, 2.2, 4.6],
      defaultTarget: [0.2, 1.45, 0],
      updateParams: buildMol,
      update: (dt, _el, p, playing) => {
        buildMol(p);
        if (playing) root.rotation.y += dt * 0.35;
      },
      getReadouts: (params) => {
        const idx = Math.round(params.moleculeIndex ?? 2);
        return [
          { label: 'Compound', value: ['Methane', 'Ethane', 'Ethanol', 'Ethanoic Acid'][idx] },
          { label: 'Formula', value: ['CH₄', 'C₂H₆', 'C₂H₅OH', 'CH₃COOH'][idx] },
        ];
      },
    };
  }

  // =========================================================
  // C09: Soap and Detergent Action (Woven Fabric + Micelle Lift-off)
  // =========================================================
  if (id === 'C09') {
    const fabricGroup = new THREE.Group();
    const fabric = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.14, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 })
    );
    fabric.position.y = 0.07;
    fabricGroup.add(fabric);
    const threadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    for (let i = -4; i <= 4; i++) {
      const thX = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.02, 0.05), threadMat);
      thX.position.set(0, 0.145, i * 0.34);
      const thZ = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 3.1), threadMat);
      thZ.position.set(i * 0.5, 0.145, 0);
      fabricGroup.add(thX, thZ);
    }
    root.add(fabricGroup);

    const micelleGroup = new THREE.Group();
    const grease = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 28, 28),
      new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, roughness: 0.25, clearcoat: 0.7 })
    );
    ctx.registerComponent(grease, 'grease', 'Oil / Grease Core', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.75, 0));
    micelleGroup.add(grease);

    const tailsGroup = new THREE.Group();
    const headsGroup = new THREE.Group();
    const soapUnits: { tail: THREE.Mesh; head: THREE.Mesh; dir: THREE.Vector3 }[] = [];

    const dirs: THREE.Vector3[] = [];
    for (let i = 0; i < 24; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 24);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      dirs.push(new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)).normalize());
    }
    dirs.forEach((d) => {
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), new THREE.MeshStandardMaterial({ color: 0x37b6ff, emissive: 0x0369a1, emissiveIntensity: 0.35 }));
      tailsGroup.add(tail);
      headsGroup.add(head);
      soapUnits.push({ tail, head, dir: d });
    });

    ctx.registerComponent(tailsGroup, 'tails', 'Hydrophobic Tails', new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(-0.9, 0.9, 0));
    ctx.registerComponent(headsGroup, 'heads', 'Hydrophilic Heads (-COO⁻)', new THREE.Vector3(0, 0.85, 0), new THREE.Vector3(0.95, 1.1, 0));
    micelleGroup.add(tailsGroup, headsGroup);
    root.add(micelleGroup);

    const up = new THREE.Vector3(0, 1, 0);
    return {
      root,
      defaultCameraPos: [0, 2.3, 4.4],
      defaultTarget: [0, 1.1, 0],
      updateParams: () => {},
      update: (dt, _el, params, playing) => {
        const prog = params.assembly ?? 0.65;
        const count = Math.round(params.soapCount ?? 18);
        micelleGroup.position.y = 0.68 + prog * 1.1;
        if (playing) micelleGroup.rotation.y += dt * 0.4;

        soapUnits.forEach((u, idx) => {
          const vis = idx < count;
          u.tail.visible = vis;
          u.head.visible = vis;
          if (!vis) return;
          const dist = THREE.MathUtils.lerp(1.75, 0.86, prog);
          _v.copy(u.dir).multiplyScalar(dist);
          u.tail.position.copy(_v);
          u.tail.quaternion.setFromUnitVectors(up, u.dir);
          u.head.position.copy(u.dir).multiplyScalar(dist + 0.36);
        });
      },
      getReadouts: (params) => [
        { label: 'Micelle Assembly', value: `${Math.round((params.assembly ?? 0.65) * 100)}`, unit: '%' },
        { label: 'Soap Molecules', value: String(Math.round(params.soapCount ?? 18)) },
      ],
    };
  }

  // =========================================================
  // C10: Corrosion and Prevention (Specimen Cradle + Flaking Oxide + Sacrificial Zinc)
  // =========================================================
  const makeRod = (x: number, baseColor: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.8, 0);
    const cradle = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.22, 1.9), makeMetalMaterial(0x1f2937, 0.35, 0.8));
    cradle.position.y = -0.68;
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 2.2, 24),
      makeMetalMaterial(baseColor, 0.28, 0.85)
    );
    rod.rotation.z = Math.PI / 2;
    rod.rotation.y = Math.PI / 2;
    const rustMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.94, metalness: 0.05, transparent: true, opacity: 0 });
    const rustLayer = new THREE.Mesh(new THREE.CylinderGeometry(0.296, 0.296, 1.9, 20), rustMat);
    rustLayer.rotation.x = Math.PI / 2;
    g.add(cradle, rod, rustLayer);
    return { g, rustMat, rustLayer };
  };

  const bare = makeRod(-1.5, 0x64748b);
  const painted = makeRod(0, 0x37b6ff);
  const galv = makeRod(1.5, 0xcbd5e1);

  ctx.registerComponent(bare.g, 'bare', 'Bare Iron', new THREE.Vector3(-0.3, 0, 0), new THREE.Vector3(0, 0.6, 0));
  ctx.registerComponent(painted.g, 'painted', 'Painted Iron', new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 0.6, 0));
  ctx.registerComponent(galv.g, 'galvanised', 'Zinc-Galvanised', new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(0, 0.6, 0));
  root.add(bare.g, painted.g, galv.g);

  return {
    root,
    defaultCameraPos: [0, 2.4, 4.6],
    defaultTarget: [0, 0.8, 0],
    updateParams: () => {},
    update: (_dt, _el, params) => {
      const hum = params.humidity ?? 0.6;
      const scratched = (params.scratched ?? 0) >= 0.5;
      bare.rustMat.opacity = hum * 0.92;
      painted.rustMat.opacity = scratched ? hum * 0.72 : 0;
      painted.rustLayer.scale.y = scratched ? 0.28 : 1;
      galv.rustMat.opacity = 0;
    },
    getReadouts: (params) => {
      const scratched = (params.scratched ?? 0) >= 0.5;
      return [
        { label: 'Bare Iron Rust', value: `${Math.round((params.humidity ?? 0.6) * 100)}`, unit: '%' },
        { label: 'Painted / Zinc', value: scratched ? 'Paint Rusts / Zinc Safe' : 'Both Protected' },
      ];
    },
  };
}
