import React from 'react';

interface LiveExperimentChartProps {
  experimentId: string;
  params: Record<string, number>;
}

export const LiveExperimentChart: React.FC<LiveExperimentChartProps> = ({ experimentId, params }) => {
  // P06 Ohm's Law I-V Curve
  if (experimentId === 'P06') {
    const v = params.voltage ?? 6;
    const r = params.resistance ?? 6;
    const closed = (params.switchClosed ?? 1) >= 0.5;
    const maxV = 12;
    const maxI = 6;
    const w = 280;
    const h = 150;
    const pad = 28;
    const plotW = w - pad * 2;
    const plotH = h - pad * 2;

    const endV = maxV;
    const endI = Math.min(maxI, endV / r);
    const xEnd = pad + ((endI * r) / maxV) * plotW;
    const yEnd = h - pad - (endI / maxI) * plotH;

    const curI = closed ? v / r : 0;
    const curX = pad + ((closed ? v : 0) / maxV) * plotW;
    const curY = h - pad - (Math.min(maxI, curI) / maxI) * plotH;

    return (
      <div className="bg-[#0B0D13] border border-[#222736] rounded-xl p-3">
        <div className="flex items-center justify-between text-xs text-[#8B93A7] mb-2">
          <span className="font-semibold text-[#F4F6FA]">Live I–V Characteristic Curve</span>
          <span className="font-mono-tech text-[#38BDF8]">Slope = 1/R = {(1 / r).toFixed(2)} S</span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36">
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#2E364D" strokeWidth="1.5" />
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#2E364D" strokeWidth="1.5" />
          <line x1={pad} y1={h - pad} x2={xEnd} y2={yEnd} stroke="#38BDF8" strokeWidth="2.5" />
          <circle cx={curX} cy={curY} r="5" fill="#10B981" stroke="#F4F6FA" strokeWidth="1.5" />
          <text x={w - pad} y={h - 8} fill="#8B93A7" fontSize="10" textAnchor="end">Voltage (V)</text>
          <text x={pad + 4} y={pad + 6} fill="#8B93A7" fontSize="10">Current (A)</text>
        </svg>
      </div>
    );
  }

  // M06 Quadratic Parabola preview
  if (experimentId === 'M06') {
    const a = params.a ?? 0.75;
    const b = params.b ?? 0;
    const c = params.c ?? -1.5;
    const w = 280;
    const h = 150;
    const pts: string[] = [];
    for (let px = 0; px <= 56; px++) {
      const x = (px / 56) * 8 - 4;
      const y = a * x * x + b * x + c;
      const sx = (px / 56) * w;
      const sy = h / 2 - y * 14;
      if (sy >= 0 && sy <= h) pts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);
    }
    return (
      <div className="bg-[#0B0D13] border border-[#222736] rounded-xl p-3">
        <div className="flex items-center justify-between text-xs text-[#8B93A7] mb-2">
          <span className="font-semibold text-[#F4F6FA]">Quadratic Curve 2D Trace</span>
          <span className="font-mono-tech text-[#F59E0B]">D = {(b * b - 4 * a * c).toFixed(2)}</span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36">
          <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="#2E364D" strokeWidth="1" />
          <line x1={w / 2} y1="0" x2={w / 2} y2={h} stroke="#2E364D" strokeWidth="1" />
          {pts.length > 1 && (
            <polyline fill="none" stroke="#F59E0B" strokeWidth="2.5" points={pts.join(' ')} />
          )}
        </svg>
      </div>
    );
  }

  // C04 pH Logarithmic Scale Visual
  if (experimentId === 'C04') {
    const ph = Math.round(params.phValue ?? 7);
    const colors = [
      '#dc2626', '#ef4444', '#f97316', '#f59e0b', '#eab308',
      '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
      '#0284c7', '#2563eb', '#4f46e5', '#6d28d9', '#7e22ce',
    ];
    return (
      <div className="bg-[#0B0D13] border border-[#222736] rounded-xl p-3">
        <div className="flex items-center justify-between text-xs text-[#8B93A7] mb-2">
          <span className="font-semibold text-[#F4F6FA]">Universal Indicator Strip</span>
          <span className="font-mono-tech text-[#10B981]">pH {ph}</span>
        </div>
        <div className="grid grid-cols-15 gap-1">
          {colors.map((hex, i) => (
            <div
              key={i}
              style={{ backgroundColor: hex }}
              className={`h-7 rounded-sm flex items-center justify-center text-[10px] font-mono-tech font-bold text-white transition-transform ${
                i === ph ? 'ring-2 ring-[#F4F6FA] scale-110 z-10' : 'opacity-70'
              }`}
            >
              {i}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
