import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Treemap, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ZoomIn, Info, Download, ChevronLeft } from 'lucide-react';
import { L1Domain, L2Capability, TileViewProps } from '../../types';
import { COLORS, TREEMAP_CONFIG } from '../../constants';
import { getDomainCapabilities, getDomainDescription, exportElementAsPng } from '../../utils';
import { TreemapCustomContent } from './TreemapCustomContent';
import { TreemapTooltip } from './TreemapTooltip';

export const TileView: React.FC<TileViewProps> = ({ data }) => {
  const [activeDomain, setActiveDomain] = useState<L1Domain | null>(null);
  const [activeCapability, setActiveCapability] = useState<L2Capability | null>(null);
  const [isTooltipEnabled, setIsTooltipEnabled] = useState(true);
  const treemapRef = useRef<HTMLDivElement>(null);

  const treemapData = useMemo(() => {
    if (activeCapability) {
      const l3Feats = activeCapability.l3Features || [];
      return l3Feats.map((f, i) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        value: 1,
        storiesCount: f.userStories?.length || 0,
        fill: COLORS[i % COLORS.length],
        itemType: 'Feature'
      }));
    } else if (activeDomain) {
      const l2Caps = getDomainCapabilities(activeDomain);
      return l2Caps.map((c, i) => {
        const totalStories = (c.l3Features || []).reduce(
          (acc, f) => acc + (f.userStories?.length || 0),
          0
        );
        return {
          id: c.id,
          name: c.name,
          description: c.description,
          value: Math.max(c.l3Features?.length || 1, 1),
          featsCount: c.l3Features?.length || 0,
          storiesCount: totalStories,
          fill: COLORS[i % COLORS.length],
          itemType: 'Capability',
          capRef: c
        };
      });
    } else {
      return data
        .map((d, i) => {
          const l2Caps = getDomainCapabilities(d);
          const totalFeatures = l2Caps.reduce(
            (acc, cap) => acc + (cap.l3Features?.length || 1),
            0
          );
          const totalStories = l2Caps.reduce(
            (acc, cap) =>
              acc + (cap.l3Features || []).reduce((acc2, f) => acc2 + (f.userStories?.length || 0), 0),
            0
          );
          return {
            id: d.id,
            name: d.name,
            description: getDomainDescription(d),
            value: Math.max(totalFeatures, 1),
            capsCount: l2Caps.length,
            featsCount: totalFeatures,
            storiesCount: totalStories,
            fill: COLORS[i % COLORS.length],
            itemType: 'Domain',
            domainRef: d
          };
        })
        .sort((a, b) => b.value - a.value);
    }
  }, [data, activeDomain, activeCapability]);

  const handleTreemapClick = useCallback((node: any) => {
    if (node.itemType === 'Domain' && node.domainRef) {
      setActiveDomain(node.domainRef);
      setActiveCapability(null);
    } else if (node.itemType === 'Capability' && node.capRef) {
      setActiveCapability(node.capRef);
    }
  }, []);

  const handleExportImage = useCallback(async () => {
    if (!treemapRef.current) return;
    try {
      await exportElementAsPng(treemapRef.current, 'capability-model');
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Failed to export image. Please try again.');
    }
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-900">
            {activeCapability
              ? `Features in ${activeCapability.name}`
              : activeDomain
                ? `Capabilities in ${activeDomain.name}`
                : 'Domain Distribution'}
          </h2>

          {!activeDomain && !activeCapability && (
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <ZoomIn size={16} />
              <span>Click a domain to explore features</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTooltipEnabled(!isTooltipEnabled)}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isTooltipEnabled
                ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
            title={isTooltipEnabled ? 'Disable tooltip' : 'Enable tooltip'}
          >
            <Info size={16} />
            <span>{isTooltipEnabled ? 'Tooltip On' : 'Tooltip Off'}</span>
          </button>
          <button
            onClick={() =>
              alert('HTML Export is available through the single file viewer or Legacy Visualizer.')
            }
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
            title="Export as standalone HTML"
          >
            <Download size={16} />
            <span>Export HTML</span>
          </button>
          <button
            onClick={handleExportImage}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm"
            title="Export as image"
          >
            <Download size={16} />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      {(activeDomain || activeCapability) && (
        <div className="mb-4 pb-4 border-b border-slate-100">
          <button
            onClick={() => {
              if (activeCapability) {
                setActiveCapability(null);
              } else {
                setActiveDomain(null);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            {activeCapability ? 'Back to Capabilities' : 'Back to Domains'}
          </button>
        </div>
      )}

      <div className="w-full h-[700px] rounded-xl overflow-hidden" ref={treemapRef}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="value"
            aspectRatio={TREEMAP_CONFIG.aspectRatio}
            stroke="#fff"
            content={<TreemapCustomContent />}
            isAnimationActive={false}
            onClick={(nodeData: any) => {
              const payload = nodeData?.payload || nodeData?.node?.data || nodeData;
              if (payload) {
                handleTreemapClick(payload);
              }
            }}
          >
            {isTooltipEnabled && <RechartsTooltip content={<TreemapTooltip />} />}
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
