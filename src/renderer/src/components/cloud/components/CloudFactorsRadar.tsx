import React from 'react';
import { Info } from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { Dimension } from '../types';
import { buildRadarData } from '../utils';

const CloudFactorsRadar: React.FC<{ dimensions: Dimension[] }> = ({ dimensions }) => {
  const radarData = buildRadarData(dimensions);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">Cloud Readiness Factors</h3>
        <Info size={16} className="text-gray-400 cursor-pointer" />
      </div>

      {/* Chart */}
      <div className="flex-1" style={{ minHeight: 320 }}>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#9ca3af', fontSize: 9 }}
              tickCount={5}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#fb851e"
              fill="#fb851e"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const item = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-sm">
                    <p className="font-semibold text-gray-800">{item.subject}</p>
                    <p className="text-orange-500 font-bold">{item.score}%</p>
                  </div>
                );
              }}
            />
            <Legend
              formatter={() => 'Score'}
              iconType="square"
              iconSize={10}
              wrapperStyle={{ color: '#fb851e', fontSize: 12 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CloudFactorsRadar;
