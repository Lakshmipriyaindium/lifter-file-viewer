import React from 'react';
import { TreemapTooltipProps } from '../../types';

export const TreemapTooltip: React.FC<TreemapTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length && payload[0]?.payload) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-200 max-w-sm z-50">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }} />
          <h4 className="font-bold text-slate-800">{data.name}</h4>
        </div>
        <div className="space-y-1.5 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-700">Type:</span> {data.itemType}
          </p>
          {data.capsCount !== undefined && data.capsCount > 0 && (
            <p>
              <span className="font-semibold text-slate-700">Capabilities:</span> {data.capsCount}
            </p>
          )}
          {data.featsCount !== undefined && data.featsCount > 0 && (
            <p>
              <span className="font-semibold text-slate-700">Features:</span> {data.featsCount}
            </p>
          )}
          {data.storiesCount !== undefined && data.storiesCount > 0 && (
            <p>
              <span className="font-semibold text-slate-700">User Stories:</span>{' '}
              {data.storiesCount}
            </p>
          )}
          {data.description && (
            <p className="mt-2 text-xs italic line-clamp-3 text-slate-500">{data.description}</p>
          )}
        </div>
        <p className="text-[10px] text-slate-400 mt-3 text-center uppercase tracking-widest font-semibold">
          Click to explore
        </p>
      </div>
    );
  }
  return null;
};
