import React from 'react';

interface Props { value: number; size?: number }

const ArcGauge: React.FC<Props> = ({ value, size = 120 }) => {
  const pct = Math.min(100, Math.max(0, value || 0));
  const stroke = 10;
  const r = (size - stroke) / 2;
  const d = `M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`;
  const len = Math.PI * r;
  return (
    <svg width={size} height={size / 2 + stroke} viewBox={`0 0 ${size} ${size / 2 + stroke}`} className="mt-2" aria-hidden="true">
      <path d={d} fill="none" stroke="#e5e7eb" strokeWidth={stroke} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#1f2937" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(len * pct) / 100} ${len}`} />
    </svg>
  );
};

export default ArcGauge;
