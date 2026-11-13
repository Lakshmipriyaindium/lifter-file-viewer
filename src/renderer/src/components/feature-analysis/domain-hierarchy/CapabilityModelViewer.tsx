import React, { useState, useMemo } from 'react';
import { CapabilityModelViewerProps, ViewType } from './types';
import { VIEW_OPTIONS } from './constants';
import { normalizeData } from './utils';
import { TileView } from './components/tile-view/TileView';
import { HierarchySplitView } from './components/hierarchy-view/HierarchySplitView';
import { TreeView } from './components/tree-view/TreeView';

export const CapabilityModelViewer: React.FC<CapabilityModelViewerProps> = ({ data: rawData }) => {
  const data = useMemo(() => normalizeData(rawData), [rawData]);
  const [viewType, setViewType] = useState<ViewType>('hierarchy');

  return (
    <div className="p-6 bg-slate-50 min-h-full overflow-y-auto w-full">
      <div className="w-full space-y-6">
        {/* Header with Title and View Switcher Dropdown */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Capability Model</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Explore domains, capabilities, features, and user stories
            </p>
          </div>
          <div className="w-48">
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as ViewType)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5 shadow-sm font-medium cursor-pointer"
            >
              {VIEW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Switcher Output */}
        {viewType === 'tile' && <TileView data={data} />}
        {viewType === 'tree' && <TreeView data={data} />}
        {viewType === 'hierarchy' && <HierarchySplitView data={data} />}
      </div>
    </div>
  );
};

export default CapabilityModelViewer;
