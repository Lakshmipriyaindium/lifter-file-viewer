import React from 'react';
import { Info } from 'lucide-react';
import { getReadinessStatus } from '../utils';

const RADIUS = 80;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const CloudScoreGauge: React.FC<{
  score: number;
  onViewDetails?: () => void;
}> = ({ score, onViewDetails }) => {
  const clampedScore = Math.min(100, Math.max(0, score));
  const status = getReadinessStatus(clampedScore);
  const offset = CIRCUMFERENCE - (clampedScore / 100) * CIRCUMFERENCE;
  const displayScore = clampedScore % 1 === 0 ? clampedScore : clampedScore.toFixed(1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">Cloud Readiness Score</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onViewDetails}
            className="text-sm text-orange-500 font-medium cursor-pointer hover:underline hover:text-orange-600 transition-colors focus:outline-none"
          >
            View Details &gt;
          </button>
          <Info size={16} className="text-gray-400 cursor-pointer" />
        </div>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center justify-center flex-1 py-4">
        <div className="relative">
          <svg width={200} height={200} viewBox="0 0 200 200">
            {/* Background ring */}
            <circle
              cx={100}
              cy={100}
              r={RADIUS}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth={STROKE}
            />
            {/* Progress ring */}
            <circle
              cx={100}
              cy={100}
              r={RADIUS}
              fill="none"
              stroke={status.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{displayScore}%</span>
            <span className="text-sm text-gray-500 mt-1">Readiness</span>
          </div>
        </div>

        {/* Status label */}
        <p className={`text-xl font-bold mt-3 ${status.textColor}`}>{status.label}</p>
      </div>
    </div>
  );
};

export default CloudScoreGauge;
