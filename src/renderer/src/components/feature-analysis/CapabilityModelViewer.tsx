import React, { useState, useMemo, useRef } from 'react';
import { Layers, Target, Search, Folder, Network, FileText, Bookmark, BookOpen, ChevronLeft, ChevronRight, ChevronDown, ZoomIn, Info, Download } from "lucide-react";
import { Treemap, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import * as htmlToImage from 'html-to-image';

export interface UserStoryCap {
  story_id: string;
  title: string;
  epic: string;
  narrative: string;
}

export interface L3Feature {
  id: string;
  name: string;
  description?: string;
  entryPointId?: string;
  feature_id?: string;
  userStories?: UserStoryCap[];
}

export interface Step {
  node_id: string;
  step_title: string;
  node_type: string;
  step_number: number;
  description?: string;
  business_rules?: string[];
}

export interface L2Capability {
  id: string;
  name: string;
  description?: string;
  keyPhases?: string[];
  criticalBusinessRules?: string[];
  businessValue?: string;
  clientVariations?: any[];
  l3Features?: L3Feature[];
  steps?: Step[];
}

export interface L1Domain {
  id: string;
  name: string;
  description?: string;
  purpose?: string;
  executive_summary?: string;
  l2Capabilities?: L2Capability[];
  l2_capabilities?: L2Capability[];
  capabilities?: L2Capability[];
  steps?: Step[];
}

const normalizeData = (data: any): L1Domain[] => {
  if (Array.isArray(data)) {
    return data;
  }
  
  if (data && data.domains) {
    const normalized: L1Domain[] = [];
    let domainId = 1;
    for (const [domainName, domainObj] of Object.entries(data.domains) as any) {
      const l2Capabilities: L2Capability[] = [];
      let capId = 1;
      
      const featuresList = domainObj.features || [];
      for (const featureName of featuresList) {
        const featureData = data.business_features_l1?.[featureName];
        const l3Features: L3Feature[] = [];
        
        if (featureData && featureData.functions_l2) {
          featureData.functions_l2.forEach((funcName: string, fIdx: number) => {
            l3Features.push({
              id: `l3-${domainId}-${capId}-${fIdx+1}`,
              name: funcName,
              description: `Mapped from functions_l2 in ${featureName}`
            });
          });
        }
        
        l2Capabilities.push({
          id: `l2-${domainId}-${capId}`,
          name: featureName,
          description: featureData ? `Mapped from business_features_l1 with ${featureData.file_count || 0} files` : '',
          l3Features: l3Features
        });
        capId++;
      }
      
      normalized.push({
        id: `l1-${domainId}`,
        name: domainName,
        description: `Mapped from domains with ${domainObj.file_count || 0} files and ${domainObj.total_lines || 0} lines of code.`,
        l2Capabilities: l2Capabilities
      });
      domainId++;
    }
    return normalized;
  }
  
  return [];
};

const COLORS = [
  '#ef4444', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899', 
  '#3b82f6', '#10b981', '#14b8a6', '#84cc16', '#6366f1', '#f43f5e', 
  '#0ea5e9', '#22c55e', '#a855f7'
];

// --- TREEMAP COMPONENTS ---

interface CustomContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  fill?: string;
  itemType?: 'Domain' | 'Capability' | 'Feature';
  capsCount?: number;
  featsCount?: number;
  storiesCount?: number;
}

const TreemapCustomContent = (props: CustomContentProps) => {
  const { x = 0, y = 0, width = 0, height = 0, name = '', fill = '#8884d8', itemType, capsCount, featsCount, storiesCount } = props;

  const showName = width >= 60 && height >= 30;
  const showBasicMetrics = width >= 100 && height >= 60;
  const showDetailedMetrics = width >= 150 && height >= 100;
  
  const fontSize = Math.max(Math.min(width / 10, height / 5, 14), 10);
  const metricFontSize = Math.max(Math.min(width / 14, height / 8, 11), 8);

  return (
    <g style={{ cursor: 'pointer' }}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill,
          stroke: '#fff',
          strokeWidth: 2,
          strokeOpacity: 1,
        }}
        className="transition-all duration-300 hover:brightness-110"
      />
      {showName && (
        <text
          x={x + width / 2}
          y={showDetailedMetrics ? y + height / 2 - 25 : showBasicMetrics ? y + height / 2 - 10 : y + height / 2 + (fontSize/3)}
          textAnchor="middle"
          fill="#fff"
          fontSize={fontSize}
          fontWeight="bold"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
        >
          {width < 100 ? (name.length > 10 ? name.substring(0, 8) + '...' : name) : name}
        </text>
      )}
      
      {showDetailedMetrics ? (
        <>
          {capsCount !== undefined && capsCount > 0 && (
            <text x={x + width / 2} y={y + height / 2 + 5} textAnchor="middle" fill="#fff" fontSize={metricFontSize} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              📂 {capsCount} capabilities
            </text>
          )}
          {featsCount !== undefined && featsCount > 0 && (
            <text x={x + width / 2} y={y + height / 2 + (capsCount !== undefined ? 22 : 5)} textAnchor="middle" fill="#fff" fontSize={metricFontSize} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              ⚡ {featsCount} features
            </text>
          )}
          {storiesCount !== undefined && storiesCount > 0 && (
            <text x={x + width / 2} y={y + height / 2 + (capsCount !== undefined ? 39 : 22)} textAnchor="middle" fill="#fff" fontSize={metricFontSize} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              📋 {storiesCount} user stories
            </text>
          )}
        </>
      ) : showBasicMetrics ? (
         <text x={x + width / 2} y={y + height / 2 + 15} textAnchor="middle" fill="#fff" fontSize={metricFontSize} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {itemType === 'Domain' ? `${featsCount} features` : itemType === 'Capability' ? `${featsCount} features` : `${storiesCount} stories`}
         </text>
      ) : null}
      
      {width >= 100 && height >= 80 && (
        <g opacity="0.6">
          <circle cx={x + width - 20} cy={y + 20} r="12" fill="rgba(255, 255, 255, 0.2)" />
          <text x={x + width - 20} y={y + 25} textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">
            +
          </text>
        </g>
      )}
    </g>
  );
};

const TreemapTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-200 max-w-sm z-50">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }} />
          <h4 className="font-bold text-slate-800">{data.name}</h4>
        </div>
        <div className="space-y-1.5 text-sm text-slate-600">
          <p><span className="font-semibold text-slate-700">Type:</span> {data.itemType}</p>
          {data.capsCount !== undefined && data.capsCount > 0 && <p><span className="font-semibold text-slate-700">Capabilities:</span> {data.capsCount}</p>}
          {data.featsCount !== undefined && data.featsCount > 0 && <p><span className="font-semibold text-slate-700">Features:</span> {data.featsCount}</p>}
          {data.storiesCount !== undefined && data.storiesCount > 0 && <p><span className="font-semibold text-slate-700">User Stories:</span> {data.storiesCount}</p>}
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

// --- HIERARCHY SPLIT VIEW COMPONENT ---

const HierarchySplitView: React.FC<{ data: any }> = ({ data: rawData }) => {
  const data = useMemo(() => normalizeData(rawData), [rawData]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(data.map(d => d.id)));
  const [selectedItem, setSelectedItem] = useState<{type: 'l1'|'l2'|'l3', data: any, parent?: any} | null>({
    type: 'l1', data: data[0]
  });

  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    
    return data.map(d => {
      const l2Caps = d.l2Capabilities || d.l2_capabilities || d.capabilities || [];
      const filteredL2 = l2Caps.map(c => {
        const filteredL3 = (c.l3Features || []).filter(f => f.name.toLowerCase().includes(lowerQuery) || (f.description && f.description.toLowerCase().includes(lowerQuery)));
        if (c.name.toLowerCase().includes(lowerQuery) || (c.description && c.description.toLowerCase().includes(lowerQuery)) || filteredL3.length > 0) {
          return { ...c, l3Features: filteredL3.length > 0 ? filteredL3 : c.l3Features };
        }
        return null;
      }).filter(Boolean) as L2Capability[];

      if (d.name.toLowerCase().includes(lowerQuery) || (d.description && d.description.toLowerCase().includes(lowerQuery)) || filteredL2.length > 0) {
        return { ...d, l2Capabilities: filteredL2 };
      }
      return null;
    }).filter(Boolean) as L1Domain[];
  }, [data, searchQuery]);

  const renderDetails = () => {
    if (!selectedItem) {
      return (
        <div className="flex items-center justify-center h-full text-slate-400">
          <p>Select an item from the hierarchy to view details.</p>
        </div>
      );
    }

    if (selectedItem.type === 'l3') {
      const feature = selectedItem.data as L3Feature;
      return (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 text-white shadow-sm mt-1">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded uppercase tracking-wider">
                  L3 Feature
                </span>
                <span className="text-slate-400 text-sm font-medium">{feature.id || feature.feature_id}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{feature.name}</h2>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-slate-800">Description</h3>
            </div>
            <div className="p-5">
              <p className="text-slate-600 text-sm leading-relaxed">{feature.description || 'No description available.'}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-slate-800">User Stories ({feature.userStories?.length || 0})</h3>
            </div>
            <div className="p-5 space-y-4">
              {feature.userStories && feature.userStories.length > 0 ? (
                feature.userStories.map((story, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800 text-sm">{story.title}</h4>
                      <span className="text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-500 font-mono">
                        {story.story_id}
                      </span>
                    </div>
                    {story.epic && (
                      <div className="mb-3">
                        <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wide">
                          Epic: {story.epic}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-slate-600 italic border-l-2 border-slate-300 pl-3 py-1">
                      "{story.narrative}"
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 italic">No user stories available for this feature.</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (selectedItem.type === 'l2') {
        const cap = selectedItem.data as L2Capability;
        return (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0 text-white shadow-sm mt-1">
                  <Network className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase tracking-wider">
                      L2 Capability
                    </span>
                    <span className="text-slate-400 text-sm font-medium">{cap.id}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{cap.name}</h2>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                 <h3 className="font-semibold text-slate-800 mb-2">Description</h3>
                 <p className="text-slate-600 text-sm">{cap.description || 'No description.'}</p>
              </div>
            </div>
        )
    }

    if (selectedItem.type === 'l1') {
        const domain = selectedItem.data as L1Domain;
        return (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0 text-white shadow-sm mt-1">
                  <Folder className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-bold rounded uppercase tracking-wider">
                      L1 Domain
                    </span>
                    <span className="text-slate-400 text-sm font-medium">{domain.id}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{domain.name}</h2>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                 <h3 className="font-semibold text-slate-800 mb-2">Description</h3>
                 <p className="text-slate-600 text-sm">{domain.description || domain.purpose || domain.executive_summary || 'No description.'}</p>
              </div>
            </div>
        )
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Sidebar Tree */}
      <div className="w-1/3 min-w-[300px] border-r border-slate-200 bg-slate-50 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-slate-800">Domain Hierarchy</h2>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search capabilities or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {filteredData.map(l1 => {
              const isExpandedL1 = expandedNodes.has(l1.id);
              const isSelectedL1 = selectedItem?.type === 'l1' && selectedItem.data.id === l1.id;
              const l2Caps = l1.l2Capabilities || l1.l2_capabilities || l1.capabilities || [];
              
              return (
                <div key={l1.id} className="select-none">
                  <div 
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm ${isSelectedL1 ? 'bg-orange-100 text-orange-800' : 'hover:bg-slate-200/50 text-slate-700'}`}
                    onClick={() => setSelectedItem({type: 'l1', data: l1})}
                  >
                    <div className="w-4 h-4 flex items-center justify-center cursor-pointer" onClick={(e) => toggleNode(l1.id, e)}>
                       {l2Caps.length > 0 && (
                         isExpandedL1 ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                       )}
                    </div>
                    <Folder className={`w-4 h-4 ${isSelectedL1 ? 'text-orange-600' : 'text-slate-400'}`} />
                    <span className="font-medium truncate">{l1.name}</span>
                  </div>

                  {isExpandedL1 && l2Caps.length > 0 && (
                    <div className="ml-6 border-l border-slate-200 pl-1 mt-1 space-y-1">
                      {l2Caps.map(l2 => {
                        const isExpandedL2 = expandedNodes.has(l2.id);
                        const isSelectedL2 = selectedItem?.type === 'l2' && selectedItem.data.id === l2.id;
                        
                        return (
                          <div key={l2.id}>
                            <div 
                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm ${isSelectedL2 ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-200/50 text-slate-700'}`}
                              onClick={() => setSelectedItem({type: 'l2', data: l2, parent: l1})}
                            >
                              <div className="w-4 h-4 flex items-center justify-center cursor-pointer" onClick={(e) => toggleNode(l2.id, e)}>
                                {l2.l3Features && l2.l3Features.length > 0 && (
                                  isExpandedL2 ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </div>
                              <Network className={`w-4 h-4 ${isSelectedL2 ? 'text-blue-600' : 'text-blue-400'}`} />
                              <span className="truncate">{l2.name}</span>
                            </div>

                            {isExpandedL2 && l2.l3Features && l2.l3Features.length > 0 && (
                              <div className="ml-6 border-l border-slate-200 pl-1 mt-1 space-y-1">
                                {l2.l3Features.map(l3 => {
                                  const isSelectedL3 = selectedItem?.type === 'l3' && selectedItem.data.id === l3.id;
                                  return (
                                    <div 
                                      key={l3.id}
                                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm ${isSelectedL3 ? 'bg-orange-50 border border-orange-200 text-orange-800 shadow-sm' : 'hover:bg-slate-200/50 text-slate-600'}`}
                                      onClick={() => setSelectedItem({type: 'l3', data: l3, parent: l2})}
                                    >
                                      <div className="w-4 h-4 flex items-center justify-center" />
                                      <FileText className={`w-3.5 h-3.5 ${isSelectedL3 ? 'text-orange-500' : 'text-slate-400'}`} />
                                      <span className="truncate">{l3.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Details */}
      <div className="flex-1 bg-white overflow-y-auto p-8">
        {renderDetails()}
      </div>
    </div>
  );
};


// --- MAIN VIEWER COMPONENT ---

const CapabilityModelViewer: React.FC<{ data: any }> = ({ data: rawData }) => {
  const data = useMemo(() => normalizeData(rawData), [rawData]);
  const [viewType, setViewType] = useState<'hierarchy' | 'tile'>('hierarchy');
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
      // Show capabilities of active domain
      const l2Caps = activeDomain.l2Capabilities || activeDomain.l2_capabilities || activeDomain.capabilities || [];
      return l2Caps.map((c, i) => {
        const totalStories = (c.l3Features || []).reduce((acc, f) => acc + (f.userStories?.length || 0), 0);
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
      // Show all domains
      return data.map((d, i) => {
        const l2Caps = d.l2Capabilities || d.l2_capabilities || d.capabilities || [];
        const totalFeatures = l2Caps.reduce((acc, cap) => acc + (cap.l3Features?.length || 1), 0);
        const totalStories = l2Caps.reduce((acc, cap) => acc + (cap.l3Features || []).reduce((acc2, f) => acc2 + (f.userStories?.length || 0), 0), 0);
        return {
          id: d.id,
          name: d.name,
          description: d.description || d.purpose || d.executive_summary,
          value: Math.max(totalFeatures, 1),
          capsCount: l2Caps.length,
          featsCount: totalFeatures,
          storiesCount: totalStories,
          fill: COLORS[i % COLORS.length],
          itemType: 'Domain',
          domainRef: d
        };
      }).sort((a, b) => b.value - a.value);
    }
  }, [data, activeDomain, activeCapability]);

  const handleTreemapClick = (node: any) => {
    if (node.itemType === 'Domain' && node.domainRef) {
       setActiveDomain(node.domainRef);
       setActiveCapability(null);
    } else if (node.itemType === 'Capability' && node.capRef) {
       setActiveCapability(node.capRef);
    }
  };

  const handleExportImage = async () => {
    if (!treemapRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(treemapRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `capability-model-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Failed to export image. Please try again.');
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-full overflow-y-auto w-full">
      <div className="w-full space-y-6">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Capability Model</h1>
            <p className="text-slate-500 mt-1 text-sm">Explore domains, capabilities, features, and user stories</p>
          </div>
          <div className="w-48">
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as 'hierarchy' | 'tile')}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5 shadow-sm font-medium cursor-pointer"
            >
              <option value="hierarchy">Hierarchy View</option>
              <option value="tile">Tile View</option>
            </select>
          </div>
        </div>

        {viewType === 'tile' ? (
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
                      className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isTooltipEnabled
                        ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      title={isTooltipEnabled ? 'Disable tooltip' : 'Enable tooltip'}
                    >
                      <Info size={16} />
                      <span>{isTooltipEnabled ? 'Tooltip On' : 'Tooltip Off'}</span>
                    </button>
                    <button
                      onClick={() => alert("HTML Export is available through the single file viewer or Legacy Visualizer.")}
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
                       className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
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
                     aspectRatio={1.5}
                     stroke="#fff"
                     content={<TreemapCustomContent />}
                     isAnimationActive={false}
                     onClick={(data: any) => {
                        const payload = data?.payload || data?.node?.data || data;
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
        ) : (
            <HierarchySplitView data={data} />
        )}
      </div>
    </div>
  );
};

export default CapabilityModelViewer;
