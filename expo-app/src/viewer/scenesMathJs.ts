export const MATH_SCENES_JS = `
  // M01: 3D Geometric Solids
  if (id === 'M01') {
    const mk = (geo, col, x, y) => {
      const g = new THREE.Group(); g.position.set(x, y, 0);
      const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.18, metalness: 0.25, clearcoat: 0.8 }));
      const ed = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), new THREE.LineBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.45 }));
      g.add(m, ed); return { g, ed };
    };
    const cb = mk(new THREE.BoxGeometry(1.05, 1.05, 1.05), 0x7867ff, -2.1, 0.525);
    const cy = mk(new THREE.CylinderGeometry(0.5, 0.5, 1.25, 28), 0x37b6ff, -0.7, 0.625);
    const cn = mk(new THREE.ConeGeometry(0.55, 1.3, 28), 0xf59e0b, 0.7, 0.65);
    const sp = mk(new THREE.SphereGeometry(0.58, 24, 20), 0x34d399, 2.1, 0.58);
    registerComponent(cb.g, 'cube', 'Cube (a^3)', new THREE.Vector3(-0.3, 0.3, 0), new THREE.Vector3(0, 0.85, 0));
    registerComponent(cy.g, 'cylinder', 'Cylinder (pi r^2 h)', new THREE.Vector3(-0.1, 0.5, 0), new THREE.Vector3(0, 0.95, 0));
    registerComponent(cn.g, 'cone', 'Cone (1/3 pi r^2 h)', new THREE.Vector3(0.1, 0.5, 0), new THREE.Vector3(0, 0.95, 0));
    registerComponent(sp.g, 'sphere', 'Sphere (4/3 pi r^3)', new THREE.Vector3(0.3, 0.3, 0), new THREE.Vector3(0, 0.85, 0));
    const items = [cb, cy, cn, sp]; root.add(cb.g, cy.g, cn.g, sp.g);
    return {
      root, camPos: [0, 2.6, 5.4], target: [0, 0.65, 0],
      update: (dt, _el, p, playing) => {
        const idx = Math.round(p.solidIndex || 0), wf = (p.wireframe !== undefined ? p.wireframe : 1) >= 0.5;
        items.forEach((it, i) => { it.ed.visible = wf; it.g.scale.setScalar(THREE.MathUtils.damp(it.g.scale.x, (idx === 0 || idx === i + 1) ? 1.05 : 0.75, 8, dt)); if (playing) it.g.rotation.y += dt * 0.4; });
      },
      readouts: () => [{ label: 'Euler Check', value: 'V - E + F = 2' }, { label: 'Cone vs Cyl', value: 'V_cone = 1/3 V_cyl' }],
    };
  }

  // M02: Surface Area and Volume (Unfolding 3D -> 2D Net)
  if (id === 'M02') {
    const matS = new THREE.MeshPhysicalMaterial({ color: 0x7867ff, roughness: 0.28, metalness: 0.25, side: THREE.DoubleSide });
    const matT = new THREE.MeshPhysicalMaterial({ color: 0x37b6ff, roughness: 0.22, metalness: 0.3, side: THREE.DoubleSide });
    const baseG = new THREE.Group(); baseG.position.y = 0.04;
    const pg = new THREE.BoxGeometry(1, 0.04, 1);
    const bot = new THREE.Mesh(pg, matS);
    const fP = new THREE.Group(); fP.position.set(0, 0, 0.5); const fM = new THREE.Mesh(pg, matS); fM.position.set(0, 0, 0.5); fP.add(fM);
    const bP = new THREE.Group(); bP.position.set(0, 0, -0.5); const bM = new THREE.Mesh(pg, matS); bM.position.set(0, 0, -0.5); bP.add(bM);
    const lP = new THREE.Group(); lP.position.set(-0.5, 0, 0); const lM = new THREE.Mesh(pg, matS); lM.position.set(-0.5, 0, 0); lP.add(lM);
    const rP = new THREE.Group(); rP.position.set(0.5, 0, 0); const rM = new THREE.Mesh(pg, matS); rM.position.set(0.5, 0, 0); rP.add(rM);
    const tP = new THREE.Group(); tP.position.set(0, 0, -1); const tM = new THREE.Mesh(pg, matT); tM.position.set(0, 0, -0.5); tP.add(tM); bP.add(tP);
    baseG.add(bot, fP, bP, lP, rP);
    registerComponent(baseG, 'baseFace', 'Hinged Lateral Faces', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.3, 0));
    registerComponent(tM, 'topCap', 'Top Cap Face', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 0.25, 0));

    const cylG = new THREE.Group(), cR = 0.55, cH = 1.25, segs = 28;
    const shGeo = new THREE.PlaneGeometry(2 * Math.PI * cR, cH, segs, 1);
    const shMesh = new THREE.Mesh(shGeo, matS); shMesh.position.y = cH / 2;
    const cTopP = new THREE.Group(); cTopP.position.set(0, cH, -cR);
    const topD = new THREE.Mesh(new THREE.CircleGeometry(cR, 28), matT); topD.rotation.x = -Math.PI / 2; topD.position.set(0, 0, cR); cTopP.add(topD);
    const botD = new THREE.Mesh(new THREE.CircleGeometry(cR, 28), matT); botD.rotation.x = Math.PI / 2;
    cylG.add(shMesh, cTopP, botD); root.add(baseG, cylG);
    const morphSheet = (unf) => {
      const pos = shGeo.attributes.position, arcA = THREE.MathUtils.lerp(Math.PI * 2, 0.001, unf), R = (2 * Math.PI * cR) / arcA;
      for (let i = 0; i < pos.count; i++) {
        const u = (i % (segs + 1)) / segs - 0.5, y = i <= segs ? cH / 2 : -cH / 2, th = u * arcA;
        pos.setXYZ(i, Math.sin(th) * R, y, unf > 0.99 ? cR : -R + Math.cos(th) * R + cR);
      }
      pos.needsUpdate = true; shGeo.computeVertexNormals();
    };
    return {
      root, camPos: [2.4, 3.2, 4.4], target: [0, 0.5, 0],
      update: (_dt, _el, p) => {
        const unf = p.unfold !== undefined ? p.unfold : 0.4, isC = (p.solidType || 0) >= 0.5, sc = (p.size || 1.6) / 1.6;
        baseG.visible = !isC; cylG.visible = isC; baseG.scale.setScalar(sc); cylG.scale.setScalar(sc);
        const fa = (1 - unf) * (Math.PI / 2);
        fP.rotation.x = -fa; bP.rotation.x = fa; lP.rotation.z = -fa; rP.rotation.z = fa; tP.rotation.x = fa;
        if (isC) { morphSheet(unf); cTopP.position.set(0, cH, unf > 0.99 ? 0 : -cR); cTopP.rotation.x = -unf * (Math.PI / 2); }
      },
      readouts: (p) => { const isC = (p.solidType || 0) >= 0.5, a = p.size || 1.6; return [{ label: 'TSA', value: (isC ? 2 * Math.PI * a * (a + a * 1.2) : 6 * a * a).toFixed(2), unit: 'm2' }, { label: 'Vol', value: (isC ? Math.PI * a * a * (a * 1.2) : a * a * a).toFixed(2), unit: 'm3' }]; },
    };
  }

  // M03: Coordinate Geometry
  if (id === 'M03') {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), new THREE.MeshBasicMaterial({ map: createCartesianTex(maxAniso), side: THREE.DoubleSide }));
    plane.rotation.x = -Math.PI / 2; plane.position.y = 0.04;
    registerComponent(plane, 'plane', 'Cartesian Grid', new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(2.2, 0.25, 2.2));
    const ptsG = new THREE.Group();
    const pA = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 18), new THREE.MeshStandardMaterial({ color: 0x37b6ff }));
    const pB = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 18), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    const mid = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), new THREE.MeshStandardMaterial({ color: 0x34d399 }));
    const seg = createCylBetween(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0.04, new THREE.MeshBasicMaterial({ color: 0x0f172a }));
    const dxB = createCylBetween(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0.025, new THREE.MeshBasicMaterial({ color: 0x37b6ff }));
    const dyB = createCylBetween(new THREE.Vector3(), new THREE.Vector3(0, 0, 1), 0.025, new THREE.MeshBasicMaterial({ color: 0x7867ff }));
    ptsG.add(pA, pB, mid, seg, dxB, dyB);
    registerComponent(ptsG, 'pointA', 'Points A, B & Midpoint', new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 0.65, 0));
    root.add(plane, ptsG);
    return {
      root, camPos: [0, 4.6, 3.6], target: [0, 0.1, 0],
      update: (_dt, _el, p) => {
        const s = 0.52, x1 = (p.x1 !== undefined ? p.x1 : -2) * s, y1 = -(p.y1 !== undefined ? p.y1 : -1.5) * s, x2 = (p.x2 !== undefined ? p.x2 : 2.5) * s, y2 = -(p.y2 !== undefined ? p.y2 : 2) * s;
        const a = new THREE.Vector3(x1, 0.18, y1), b = new THREE.Vector3(x2, 0.18, y2), c = new THREE.Vector3(x2, 0.18, y1);
        pA.position.copy(a); pB.position.copy(b); mid.position.copy(a).add(b).multiplyScalar(0.5);
        updateCylBetween(seg, a, b); updateCylBetween(dxB, a, c); updateCylBetween(dyB, c, b);
      },
      readouts: (p) => { const dx = (p.x2 || 2.5) - (p.x1 || -2), dy = (p.y2 || 2) - (p.y1 || -1.5); return [{ label: 'Distance AB', value: Math.hypot(dx, dy).toFixed(2), unit: 'u' }]; },
    };
  }

  // M04: Trigonometry
  if (id === 'M04') {
    const uM = new THREE.CylinderGeometry(0.055, 0.055, 1, 10);
    const hypM = new THREE.Mesh(uM, new THREE.MeshStandardMaterial({ color: 0xf59e0b })), oppM = new THREE.Mesh(uM, new THREE.MeshStandardMaterial({ color: 0x37b6ff })), adjM = new THREE.Mesh(uM, new THREE.MeshStandardMaterial({ color: 0x7867ff }));
    registerComponent(hypM, 'hypotenuse', 'Hypotenuse (H)', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 0.3, 0));
    registerComponent(oppM, 'opposite', 'Opposite (P)', new THREE.Vector3(0.35, 0, 0), new THREE.Vector3(0.3, 0.2, 0));
    registerComponent(adjM, 'adjacent', 'Adjacent (B)', new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0, -0.25, 0));
    const arc = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.48, 20, 1, 0, Math.PI / 4), new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide })); arc.position.set(-1.2, 0.12, 0);
    const raG = new THREE.Group(), rMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const rv = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.24, 8), rMat); rv.position.set(-0.24, 0.12, 0);
    const rh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.24, 8), rMat); rh.rotation.z = Math.PI / 2; rh.position.set(-0.12, 0.24, 0);
    raG.add(rv, rh); root.add(hypM, oppM, adjM, arc, raG);
    let lastADeg = -1;
    return {
      root, camPos: [0, 2.0, 4.6], target: [0, 1.0, 0],
      update: (_dt, _el, p) => {
        const ad = p.angleDeg !== undefined ? p.angleDeg : 45, ang = THREE.MathUtils.degToRad(ad), H = p.hypotenuse || 2.5;
        const B = H * Math.cos(ang), P = H * Math.sin(ang), o = new THREE.Vector3(-1.2, 0.12, 0), bp = new THREE.Vector3(-1.2 + B, 0.12, 0), tp = new THREE.Vector3(-1.2 + B, 0.12 + P, 0);
        updateCylBetween(adjM, o, bp); updateCylBetween(oppM, bp, tp); updateCylBetween(hypM, o, tp); raG.position.copy(bp);
        if (Math.abs(ad - lastADeg) > 0.05) { lastADeg = ad; arc.geometry.dispose(); arc.geometry = new THREE.RingGeometry(0.42, 0.48, 22, 1, 0, ang); }
      },
      readouts: (p) => { const r = THREE.MathUtils.degToRad(p.angleDeg !== undefined ? p.angleDeg : 45); return [{ label: 'sin', value: Math.sin(r).toFixed(3) }, { label: 'cos', value: Math.cos(r).toFixed(3) }, { label: 'tan', value: Math.tan(r).toFixed(3) }]; },
    };
  }

  // M05: Pair of Linear Equations
  if (id === 'M05') {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), new THREE.MeshBasicMaterial({ map: createCartesianTex(maxAniso) })); plane.rotation.x = -Math.PI / 2; plane.position.y = 0.04;
    const uC = new THREE.CylinderGeometry(0.045, 0.045, 1, 8);
    const l1 = new THREE.Mesh(uC, new THREE.MeshStandardMaterial({ color: 0x37b6ff, emissive: 0x0284c7 }));
    const l2 = new THREE.Mesh(uC, new THREE.MeshStandardMaterial({ color: 0x7867ff, emissive: 0x4c1d95 }));
    const inter = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x059669 }));
    registerComponent(l1, 'line1', 'Line L1', new THREE.Vector3(0, 0.3, 0)); registerComponent(l2, 'line2', 'Line L2', new THREE.Vector3(0, 0.3, 0)); registerComponent(inter, 'intersection', 'Intersection (x*,y*)', new THREE.Vector3(0, 0.4, 0));
    root.add(plane, l1, l2, inter);
    return {
      root, camPos: [0, 4.6, 3.8], target: [0, 0.1, 0],
      update: (_dt, _el, p) => {
        const m1 = p.m1 !== undefined ? p.m1 : 1, c1 = p.c1 !== undefined ? p.c1 : 0.5, m2 = p.m2 !== undefined ? p.m2 : -0.75, c2 = p.c2 !== undefined ? p.c2 : 1.5, s = 0.52;
        updateCylBetween(l1, new THREE.Vector3(-4 * s, 0.12, -(m1 * -4 + c1) * s), new THREE.Vector3(4 * s, 0.12, -(m1 * 4 + c1) * s));
        updateCylBetween(l2, new THREE.Vector3(-4 * s, 0.14, -(m2 * -4 + c2) * s), new THREE.Vector3(4 * s, 0.14, -(m2 * 4 + c2) * s));
        if (Math.abs(m1 - m2) < 0.01) inter.visible = false;
        else { inter.visible = true; const ix = (c2 - c1) / (m1 - m2); inter.position.set(ix * s, 0.22, -(m1 * ix + c1) * s); }
      },
      readouts: (p) => {
        const m1 = p.m1 !== undefined ? p.m1 : 1, c1 = p.c1 !== undefined ? p.c1 : 0.5, m2 = p.m2 !== undefined ? p.m2 : -0.75, c2 = p.c2 !== undefined ? p.c2 : 1.5;
        if (Math.abs(m1 - m2) < 0.01) return [{ label: 'Solution', value: Math.abs(c1 - c2) < 0.01 ? 'Infinite' : 'Parallel' }];
        const ix = (c2 - c1) / (m1 - m2); return [{ label: '(x*, y*)', value: '(' + ix.toFixed(2) + ', ' + (m1 * ix + c1).toFixed(2) + ')' }];
      },
    };
  }

  // M06: Quadratic Equations
  if (id === 'M06') {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), new THREE.MeshBasicMaterial({ map: createCartesianTex(maxAniso), side: THREE.DoubleSide })); plane.position.y = 2.6;
    const pG = new THREE.Group(), rG = new THREE.Group();
    const r1 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x059669 })), r2 = r1.clone();
    const vxM = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309 }));
    const axSym = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 5.0, 8), new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.65 }));
    rG.add(r1, r2, vxM, axSym);
    registerComponent(pG, 'parabola', 'Parabolic Curve', new THREE.Vector3(0, 0, 0.3), new THREE.Vector3(0, 3.8, 0.2));
    registerComponent(rG, 'roots', 'Real Roots & Vertex', new THREE.Vector3(0, 0, 0.5), new THREE.Vector3(0, 2.7, 0.3));
    root.add(plane, pG, rG);
    let lk = '';
    return {
      root, camPos: [0, 2.6, 6.2], target: [0, 2.6, 0],
      update: (_dt, _el, p) => {
        const a = p.a !== undefined ? p.a : 0.75, b = p.b !== undefined ? p.b : 0, c = p.c !== undefined ? p.c : -1.5;
        const k = a + '|' + b + '|' + c; if (k === lk) return; lk = k; pG.clear();
        const s = 0.52, pts = [];
        for (let i = -34; i <= 34; i++) { const x = (i / 34) * 4.0, y = a * x * x + b * x + c; if (Math.abs(y) <= 4.8) pts.push(new THREE.Vector3(x * s, 2.6 + y * s, 0.08)); }
        if (pts.length >= 2) pG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.045, 8, false), new THREE.MeshStandardMaterial({ color: 0x37b6ff, emissive: 0x0284c7 })));
        const D = b * b - 4 * a * c;
        if (Math.abs(a) < 0.01) { vxM.visible = false; axSym.visible = false; r1.visible = false; r2.visible = false; }
        else {
          const vx = -b / (2 * a); vxM.visible = true; vxM.position.set(vx * s, 2.6 + (a * vx * vx + b * vx + c) * s, 0.12);
          axSym.visible = Math.abs(vx) <= 4.5; axSym.position.set(vx * s, 2.6, 0.09);
          r1.visible = D >= 0; r2.visible = D > 0.001;
          if (D >= 0) { r1.position.set(((-b - Math.sqrt(D)) / (2 * a)) * s, 2.6, 0.14); r2.position.set(((-b + Math.sqrt(D)) / (2 * a)) * s, 2.6, 0.14); }
        }
      },
      readouts: (p) => { const D = (p.b || 0) * (p.b || 0) - 4 * (p.a !== undefined ? p.a : 0.75) * (p.c !== undefined ? p.c : -1.5); return [{ label: 'Discriminant', value: D.toFixed(2) }, { label: 'Roots', value: D > 0.001 ? '2 Real' : Math.abs(D) <= 0.001 ? '1 Equal' : '0 Real' }]; },
    };
  }

  // M07: Arithmetic Progressions
  if (id === 'M07') {
    const bG = new THREE.Group(), gG = new THREE.Group();
    registerComponent(bG, 'bars', 'AP Terms (an)', new THREE.Vector3(0, 0, -0.35), new THREE.Vector3(-1.5, 2.0, 0));
    registerComponent(gG, 'gaussPair', 'Gauss Complement', new THREE.Vector3(0, 0.45, 0.35), new THREE.Vector3(1.5, 2.5, 0));
    root.add(bG, gG);
    const mA = new THREE.MeshPhysicalMaterial({ color: 0x37b6ff, roughness: 0.28 }), mB = new THREE.MeshPhysicalMaterial({ color: 0x7867ff, roughness: 0.28, transparent: true, opacity: 0.65 });
    let lk = '';
    return {
      root, camPos: [0.5, 2.8, 5.2], target: [0, 1.35, 0],
      update: (_dt, _el, p) => {
        const a = p.firstTerm !== undefined ? p.firstTerm : 1.0, d = p.diff !== undefined ? p.diff : 0.4, n = Math.round(p.terms || 7), sg = (p.showGauss !== undefined ? p.showGauss : 1) >= 0.5;
        const k = a + '|' + d + '|' + n + '|' + sg; if (k === lk) return; lk = k;
        bG.clear(); gG.clear(); gG.visible = sg;
        const totH = (2 * a + (n - 1) * d) * 0.48;
        for (let i = 0; i < n; i++) {
          const h = (a + i * d) * 0.48, x = (i - (n - 1) / 2) * 0.55;
          const col = new THREE.Mesh(new THREE.BoxGeometry(0.46, h, 0.55), mA); col.position.set(x, h / 2, 0); bG.add(col);
          const ch = Math.max(0.05, totH - h), cmp = new THREE.Mesh(new THREE.BoxGeometry(0.46, ch, 0.55), mB); cmp.position.set(x, h + ch / 2 + 0.02, 0); gG.add(cmp);
        }
      },
      readouts: (p) => { const a = p.firstTerm || 1.0, d = p.diff || 0.4, n = Math.round(p.terms || 7), an = a + (n - 1) * d; return [{ label: 'an', value: an.toFixed(2) }, { label: 'Sn', value: ((n / 2) * (a + an)).toFixed(2) }]; },
    };
  }

  // M08: Similar Triangles
  if (id === 'M08') {
    const mkT = (col) => {
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1.4, 0, 0, 0.5, 1.2, 0]), 3)); geo.computeVertexNormals();
      return new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: col, side: THREE.DoubleSide, roughness: 0.28 }));
    };
    const t1 = mkT(0x37b6ff); t1.position.set(-2.1, 0.5, 0);
    const t2 = mkT(0x7867ff); t2.position.set(0.3, 0.5, 0);
    registerComponent(t1, 'tri1', 'Reference ABC', new THREE.Vector3(-0.3, 0, 0), new THREE.Vector3(0.6, 1.4, 0));
    registerComponent(t2, 'tri2', 'Similar DEF', new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(0.8, 1.6, 0));
    root.add(t1, t2);
    return {
      root, camPos: [0, 2.0, 5.2], target: [0, 1.2, 0],
      update: (_dt, _el, p) => {
        const k = p.scaleK || 1.4, ax = 0.65 + (p.apexSkew || 0.2) * 0.45;
        [t1, t2].forEach((m) => { const pos = m.geometry.attributes.position; pos.setXYZ(2, ax, 1.25, 0); pos.needsUpdate = true; m.geometry.computeVertexNormals(); });
        t2.scale.setScalar(k);
      },
      readouts: (p) => { const k = p.scaleK || 1.4; return [{ label: 'Ratio k', value: k.toFixed(1) + ' : 1' }, { label: 'Area Ratio', value: (k * k).toFixed(2) + ' : 1' }]; },
    };
  }

  // M09: Circles and Tangents
  if (id === 'M09') {
    const cG = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.045, 10, 44), makeMetal(0x37b6ff, 0.2, 0.7)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.15;
    const cPin = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 14), new THREE.MeshBasicMaterial({ color: 0x059669 })); cPin.position.y = 0.15;
    const radA = createCylBetween(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0.03, new THREE.MeshBasicMaterial({ color: 0x34d399 }));
    const radB = createCylBetween(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0.03, new THREE.MeshBasicMaterial({ color: 0x34d399 }));
    cG.add(ring, cPin, radA, radB);
    registerComponent(cG, 'circle', 'Circle & Radii (90 deg)', new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 0.45, 0));

    const tG = new THREE.Group();
    const ext = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309 }));
    const tanA = createCylBetween(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0.035, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    const tanB = createCylBetween(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0.035, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    tG.add(ext, tanA, tanB);
    registerComponent(tG, 'tangents', 'Tangents PA & PB', new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, 0.45, 0));
    root.add(cG, tG);
    return {
      root, camPos: [0.5, 4.4, 3.8], target: [0.8, 0.15, 0],
      update: (_dt, _el, p) => {
        const r = 1.15, op = Math.max(r + 0.3, p.distOP || 3.2), orb = THREE.MathUtils.degToRad(p.orbitDeg || 0), alpha = Math.acos(r / op);
        const o = new THREE.Vector3(0, 0.15, 0), pt = new THREE.Vector3(Math.cos(orb) * op, 0.15, Math.sin(orb) * op);
        const a = new THREE.Vector3(Math.cos(orb + alpha) * r, 0.15, Math.sin(orb + alpha) * r), b = new THREE.Vector3(Math.cos(orb - alpha) * r, 0.15, Math.sin(orb - alpha) * r);
        ext.position.copy(pt); updateCylBetween(radA, o, a); updateCylBetween(radB, o, b); updateCylBetween(tanA, pt, a); updateCylBetween(tanB, pt, b);
      },
      readouts: (p) => { const op = Math.max(1.45, p.distOP || 3.2); return [{ label: 'PA = PB', value: Math.sqrt(op * op - 1.15 * 1.15).toFixed(2), unit: 'm' }, { label: 'OAP', value: '90.0°' }]; },
    };
  }

  // M10: Probability & Statistics (Pipped 3D Die + Live Histogram)
  const dieG = new THREE.Group(); dieG.position.set(-1.8, 1.35, 0);
  dieG.add(new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.18, clearcoat: 0.9 })));
  const pGeo = new THREE.SphereGeometry(0.062, 10, 10), pMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const pipF = (n, uA, vA, cr) => cr.forEach(([u, v]) => {
    const m = new THREE.Mesh(pGeo, pMat);
    m.position.set(n[0] * 0.43 + uA[0] * u * 0.22 + vA[0] * v * 0.22, n[1] * 0.43 + uA[1] * u * 0.22 + vA[1] * v * 0.22, n[2] * 0.43 + uA[2] * u * 0.22 + vA[2] * v * 0.22);
    dieG.add(m);
  });
  pipF([0, 0, 1], [1, 0, 0], [0, 1, 0], [[0, 0]]);
  pipF([0, 0, -1], [1, 0, 0], [0, 1, 0], [[-1, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]]);
  pipF([0, 1, 0], [1, 0, 0], [0, 0, 1], [[-1, -1], [1, 1]]);
  pipF([0, -1, 0], [1, 0, 0], [0, 0, 1], [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]);
  pipF([1, 0, 0], [0, 0, 1], [0, 1, 0], [[-1, -1], [0, 0], [1, 1]]);
  pipF([-1, 0, 0], [0, 0, 1], [0, 1, 0], [[-1, 1], [1, 1], [-1, -1], [1, -1]]);
  registerComponent(dieG, 'die', 'Fair 3D Die', new THREE.Vector3(-0.35, 0.3, 0), new THREE.Vector3(0, 0.75, 0));

  const histG = new THREE.Group(); histG.position.set(0.75, 0, 0);
  const bars = Array.from({ length: 11 }, (_, i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1, 0.42), new THREE.MeshPhysicalMaterial({ color: i % 2 === 0 ? 0x37b6ff : 0x7867ff, roughness: 0.25 }));
    histG.add(b); return b;
  });
  registerComponent(histG, 'histogram', 'Frequency Histogram', new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(0, 2.2, 0));
  root.add(dieG, histG);
  let lastBK = '';
  return {
    root, camPos: [0.3, 2.8, 5.4], target: [0.2, 1.15, 0],
    update: (dt, _el, p, playing) => {
      const mode = Math.round(p.mode !== undefined ? p.mode : 1), n = Math.round(p.trials || 120), seed = Math.round(p.seed || 1);
      const bk = mode + '|' + n + '|' + seed;
      if (bk !== lastBK) {
        lastBK = bk; const cnt = mode === 0 ? 6 : 11, fr = new Array(cnt).fill(0); let s = seed * 9973 + n * 31;
        const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s % 6) + 1; };
        for (let i = 0; i < n; i++) fr[mode === 0 ? rnd() - 1 : rnd() + rnd() - 2]++;
        const mf = Math.max(1, ...fr);
        bars.forEach((b, idx) => { b.visible = idx < cnt; if (!b.visible) return; const h = Math.max(0.08, (fr[idx] / mf) * 2.1); b.scale.y = h; b.position.set((idx - (cnt - 1) / 2) * 0.4, h / 2 + 0.04, 0); });
      }
      if (playing) { dieG.rotation.x += dt * 1.8; dieG.rotation.y += dt * 2.3; }
    },
    readouts: (p) => [{ label: 'Trials (N)', value: String(Math.round(p.trials || 120)) }, { label: 'Dist', value: Math.round(p.mode !== undefined ? p.mode : 1) === 0 ? 'Uniform 1/6' : '2-Dice Sum (Peak 7)' }],
  };
`;
