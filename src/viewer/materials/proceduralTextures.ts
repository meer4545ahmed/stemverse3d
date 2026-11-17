import * as THREE from 'three';

export interface LiveDisplayHandle {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
}

export function createLiveDisplayTexture(
  width = 512,
  height = 320,
  maxAnisotropy = 4
): LiveDisplayHandle {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return { canvas, ctx, texture };
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 14, 128, 128, 124);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.34)');
  grad.addColorStop(1, 'rgba(6, 7, 11, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBenchSurfaceTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#090B10';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle dark optical breadboard grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // Precision M6 tapped optical table mounting holes
  ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
  for (let x = 32; x < 512; x += 64) {
    for (let y = 32; y < 512; y += 64) {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Major calibration axes
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createRulerTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0D1017';
  ctx.fillRect(0, 0, 1024, 128);

  ctx.strokeStyle = '#94A3B8';
  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';

  for (let i = 0; i <= 70; i++) {
    const x = 32 + (i / 70) * 960;
    const isMajor = i % 10 === 0;
    const isMid = i % 5 === 0;
    ctx.lineWidth = isMajor ? 2.5 : 1.2;
    ctx.strokeStyle = isMajor ? '#F8FAFC' : '#64748B';
    const h = isMajor ? 40 : isMid ? 26 : 16;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
    if (isMajor) {
      ctx.fillText(`${i}`, x, 68);
    }
  }
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('CALIBRATED OPTICAL RAIL (cm)', 512, 106);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createProtractorTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const cx = 256;
  const cy = 256;

  ctx.fillStyle = '#0E121B';
  ctx.beginPath();
  ctx.arc(cx, cy, 250, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 240, 0, Math.PI * 2);
  ctx.stroke();

  // Degree graduations
  for (let deg = 0; deg < 360; deg += 5) {
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 30 === 0;
    const isMid = deg % 15 === 0;
    const rOut = 236;
    const rIn = isMajor ? 198 : isMid ? 212 : 222;
    ctx.strokeStyle = isMajor ? '#38BDF8' : '#64748B';
    ctx.lineWidth = isMajor ? 2.5 : 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rad) * rIn, cy + Math.sin(rad) * rIn);
    ctx.lineTo(cx + Math.cos(rad) * rOut, cy + Math.sin(rad) * rOut);
    ctx.stroke();

    if (isMajor) {
      const displayDeg = deg <= 90 ? 90 - deg : deg <= 180 ? deg - 90 : deg <= 270 ? 270 - deg : deg - 270;
      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${displayDeg}°`, cx + Math.cos(rad) * 172, cy + Math.sin(rad) * 172);
    }
  }

  // Normal & interface crosshairs
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, 20);
  ctx.lineTo(cx, 492);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(20, cy);
  ctx.lineTo(492, cy);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createMeterDialTexture(
  label: string,
  centerZero = false,
  maxValue = 5,
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0D111A';
  ctx.beginPath();
  ctx.arc(256, 256, 248, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(256, 256, 232, 0, Math.PI * 2);
  ctx.stroke();

  // Outer calibrated arc
  const startAngle = Math.PI * 1.18;
  const endAngle = Math.PI * 1.82;
  ctx.strokeStyle = centerZero ? '#F59E0B' : '#38BDF8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(256, 256, 204, startAngle, endAngle);
  ctx.stroke();

  const ticks = 20;
  for (let i = 0; i <= ticks; i++) {
    const t = i / ticks;
    const ang = startAngle + t * (endAngle - startAngle);
    const isMajor = i % 5 === 0;
    const rOuter = 202;
    const rInner = isMajor ? 166 : 182;
    ctx.strokeStyle = isMajor ? '#F8FAFC' : '#64748B';
    ctx.lineWidth = isMajor ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(ang) * rInner, 256 + Math.sin(ang) * rInner);
    ctx.lineTo(256 + Math.cos(ang) * rOuter, 256 + Math.sin(ang) * rOuter);
    ctx.stroke();

    if (isMajor) {
      const val = centerZero
        ? Math.round((t - 0.5) * 2 * maxValue)
        : Number((t * maxValue).toFixed(1));
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 25px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val), 256 + Math.cos(ang) * 136, 256 + Math.sin(ang) * 136);
    }
  }

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 58px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, 256, 336);

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(centerZero ? 'CENTER-ZERO GALVANOMETER' : 'BENCH PRECISION METER', 256, 384);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createCartesianGridTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0B0E15';
  ctx.fillRect(0, 0, 1024, 1024);

  const step = 1024 / 10;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 10; i++) {
    const p = i * step;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, 1024);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(1024, p);
    ctx.stroke();
  }

  // X Axis (Cyan)
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 512);
  ctx.lineTo(1024, 512);
  ctx.stroke();

  // Y Axis (Amber)
  ctx.strokeStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(512, 0);
  ctx.lineTo(512, 1024);
  ctx.stroke();

  ctx.fillStyle = '#CBD5E1';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  for (let n = -4; n <= 4; n++) {
    if (n === 0) continue;
    const px = 512 + n * step;
    const py = 512 - n * step;
    ctx.fillText(String(n), px, 542);
    ctx.fillText(String(n), 484, py + 8);
  }
  ctx.fillStyle = '#38BDF8';
  ctx.fillText('+X', 988, 494);
  ctx.fillStyle = '#F59E0B';
  ctx.fillText('+Y', 544, 34);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createBrushedMetalRoughnessTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#555555';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y++) {
    const shade = 70 + Math.floor(Math.sin(y * 1.7) * 18 + (y % 3) * 8);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(0, y, 256, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// =========================================================
// REALISTIC ANATOMICAL & BIOLOGICAL PROCEDURAL TEXTURES
// =========================================================

export function createMyocardiumTexture(baseHex = '#991B1B', veinHex = '#450A0A'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 240; i++) {
    const y = (i / 240) * 512;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 220, 220, 0.08)' : 'rgba(40, 5, 5, 0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + Math.sin(i * 0.4) * 14, 340, y - Math.cos(i * 0.3) * 14, 512, y);
    ctx.stroke();
  }

  ctx.strokeStyle = veinHex;
  for (let v = 0; v < 14; v++) {
    let x = (v * 79) % 512;
    let y = (v * 43) % 512;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 5; s++) {
      x += Math.sin(v + s) * 28 + 20;
      y += Math.cos(v * 2 + s) * 24 + 14;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createIrisTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const cx = 256;
  const cy = 256;

  const bgGrad = ctx.createRadialGradient(cx, cy, 70, cx, cy, 250);
  bgGrad.addColorStop(0, '#D97706');
  bgGrad.addColorStop(0.24, '#0284C7');
  bgGrad.addColorStop(0.75, '#0F766E');
  bgGrad.addColorStop(0.95, '#0F172A');
  bgGrad.addColorStop(1, '#0F172A');
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 252, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 360; i++) {
    const ang = (i / 360) * Math.PI * 2;
    const len = 140 + Math.sin(i * 7) * 24 + Math.cos(i * 13) * 16;
    ctx.strokeStyle =
      i % 3 === 0 ? 'rgba(186, 230, 253, 0.35)' : i % 5 === 0 ? 'rgba(15, 23, 42, 0.25)' : 'rgba(254, 243, 199, 0.22)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * 76, cy + Math.sin(ang) * 76);
    ctx.lineTo(cx + Math.cos(ang + 0.015) * (76 + len), cy + Math.sin(ang + 0.015) * (76 + len));
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const ang = (i / 120) * Math.PI * 2;
    const r = 115 + Math.sin(i * 12) * 8;
    const px = cx + Math.cos(ang) * r;
    const py = cy + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createRetinaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 280);
  grad.addColorStop(0, '#EA580C');
  grad.addColorStop(0.5, '#DC2626');
  grad.addColorStop(1, '#991B1B');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const macula = ctx.createRadialGradient(290, 256, 4, 290, 256, 46);
  macula.addColorStop(0, 'rgba(120, 20, 10, 0.85)');
  macula.addColorStop(0.45, 'rgba(217, 119, 6, 0.4)');
  macula.addColorStop(1, 'rgba(217, 119, 6, 0)');
  ctx.fillStyle = macula;
  ctx.beginPath();
  ctx.arc(290, 256, 46, 0, Math.PI * 2);
  ctx.fill();

  const discX = 190;
  const discY = 256;
  ctx.fillStyle = '#FDE68A';
  ctx.beginPath();
  ctx.arc(discX, discY, 24, 0, Math.PI * 2);
  ctx.fill();

  const branchAngles = [-2.4, -1.9, -1.2, -0.6, 0.6, 1.2, 1.9, 2.4];
  branchAngles.forEach((ang, idx) => {
    ctx.strokeStyle = idx % 2 === 0 ? '#7F1D1D' : '#F87171';
    ctx.lineWidth = idx % 2 === 0 ? 3.5 : 2.4;
    ctx.beginPath();
    ctx.moveTo(discX, discY);
    const midX = discX + Math.cos(ang) * 95;
    const midY = discY + Math.sin(ang) * 95;
    const endX = discX + Math.cos(ang + (idx % 2 === 0 ? 0.25 : -0.25)) * 230;
    const endY = discY + Math.sin(ang + (idx % 2 === 0 ? 0.25 : -0.25)) * 210;
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBrainCortexTexture(): { color: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 512;
  cCanvas.height = 512;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = 512;
  bCanvas.height = 512;
  const bCtx = bCanvas.getContext('2d')!;

  cCtx.fillStyle = '#F3B7C0';
  cCtx.fillRect(0, 0, 512, 512);
  bCtx.fillStyle = '#D0D0D0';
  bCtx.fillRect(0, 0, 512, 512);

  for (let row = 0; row < 14; row++) {
    const baseY = row * 38 + 15;
    cCtx.strokeStyle = '#9D4E5E';
    cCtx.lineWidth = 7;
    cCtx.lineCap = 'round';
    bCtx.strokeStyle = '#2A2A2A';
    bCtx.lineWidth = 10;
    bCtx.lineCap = 'round';

    cCtx.beginPath();
    bCtx.beginPath();
    for (let x = 0; x <= 512; x += 24) {
      const y = baseY + Math.sin(x * 0.045 + row * 1.3) * 14 + Math.cos(x * 0.09 - row) * 6;
      if (x === 0) {
        cCtx.moveTo(x, y);
        bCtx.moveTo(x, y);
      } else {
        cCtx.lineTo(x, y);
        bCtx.lineTo(x, y);
      }
    }
    cCtx.stroke();
    bCtx.stroke();

    cCtx.strokeStyle = 'rgba(255, 232, 236, 0.55)';
    cCtx.lineWidth = 3;
    cCtx.beginPath();
    for (let x = 0; x <= 512; x += 24) {
      const y = baseY - 8 + Math.sin(x * 0.045 + row * 1.3) * 14;
      if (x === 0) cCtx.moveTo(x, y);
      else cCtx.lineTo(x, y);
    }
    cCtx.stroke();
  }

  const color = new THREE.CanvasTexture(cCanvas);
  color.wrapS = THREE.RepeatWrapping;
  color.wrapT = THREE.RepeatWrapping;
  color.colorSpace = THREE.SRGBColorSpace;

  const bump = new THREE.CanvasTexture(bCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;

  return { color, bump };
}

export function createLeafVenationTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#16A34A');
  grad.addColorStop(0.5, '#15803D');
  grad.addColorStop(1, '#22C55E');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#86EFAC';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  ctx.lineWidth = 3;
  for (let y = 40; y < 480; y += 44) {
    ctx.beginPath();
    ctx.moveTo(256, y);
    ctx.quadraticCurveTo(160, y - 16, 36, y - 56);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(256, y);
    ctx.quadraticCurveTo(352, y - 16, 476, y - 56);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
