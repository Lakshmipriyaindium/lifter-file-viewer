import React, { useState, useMemo, useCallback } from 'react';
import { Layers, Search, Folder, Network, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { L1Domain, L2Capability, HierarchySelectedItem, HierarchySplitViewProps } from '../../types';
import { getDomainCapabilities, getDomainDescription } from '../../utils';
import { HierarchyDetailPanel } from './HierarchyDetailPanel';

export const HierarchySplitView: React.FC<HierarchySplitViewProps> = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    () => new Set(data.map((d) => d.id))
  );
  const [selectedItem, setSelectedItem] = useState<HierarchySelectedItem | null>(() =>
    data.length > 0 ? { type: 'l1', data: data[0] } : null
  );

  const toggleNode = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();

    return data
      .map((d) => {
        const l2Caps = getDomainCapabilities(d);
        const filteredL2 = l2Caps
          .map((c) => {
            const filteredL3 = (c.l3Features || []).filter(
              (f) =>
                f.name.toLowerCase().includes(lowerQuery) ||
                (f.description && f.description.toLowerCase().includes(lowerQuery))
            );
            if (
              c.name.toLowerCase().includes(lowerQuery) ||
              (c.description && c.description.toLowerCase().includes(lowerQuery)) ||
              filteredL3.length > 0
            ) {
              return {
                ...c,
                l3Features: filteredL3.length > 0 ? filteredL3 : c.l3Features
              };
            }
            return null;
          })
          .filter(Boolean) as L2Capability[];

        const domainDesc = getDomainDescription(d);
        if (
          d.name.toLowerCase().includes(lowerQuery) ||
          domainDesc.toLowerCase().includes(lowerQuery) ||
          filteredL2.length > 0
        ) {
          return { ...d, l2Capabilities: filteredL2 };
        }
        return null;
      })
      .filter(Boolean) as L1Domain[];
  }, [data, searchQuery]);

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
            {filteredData.map((l1) => {
              const isExpandedL1 = expandedNodes.has(l1.id);
              const isSelectedL1 = selectedItem?.type === 'l1' && selectedItem.data.id === l1.id;
              const l2Caps = getDomainCapabilities(l1);

              return (
                <div key={l1.id} className="select-none">
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm ${
                      isSelectedL1
                        ? 'bg-orange-100 text-orange-800'
                        : 'hover:bg-slate-200/50 text-slate-700'
                    }`}
                    onClick={() => setSelectedItem({ type: 'l1', data: l1 })}
                  >
                    <div
                      className="w-4 h-4 flex items-center justify-center cursor-pointer"
                      onClick={(e) => toggleNode(l1.id, e)}
                    >
                      {l2Caps.length > 0 &&
                        (isExpandedL1 ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        ))}
                    </div>
                    <Folder
                      className={`w-4 h-4 ${isSelectedL1 ? 'text-orange-600' : 'text-slate-400'}`}
                    />
                    <span className="font-medium truncate">{l1.name}</span>
                  </div>

                  {isExpandedL1 && l2Caps.length > 0 && (
                    <div className="ml-6 border-l border-slate-200 pl-1 mt-1 space-y-1">
                      {l2Caps.map((l2) => {
                        const isExpandedL2 = expandedNodes.has(l2.id);
                        const isSelectedL2 =
                          selectedItem?.type === 'l2' && selectedItem.data.id === l2.id;
                        const l3Feats = l2.l3Features || [];

                        return (
                          <div key={l2.id}>
                            <div
                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm ${
                                isSelectedL2
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'hover:bg-slate-200/50 text-slate-700'
                              }`}
                              onClick={() => setSelectedItem({ type: 'l2', data: l2, parent: l1 })}
                            >
                              <div
                                className="w-4 h-4 flex items-center justify-center cursor-pointer"
                                onClick={(e) => toggleNode(l2.id, e)}
                              >
                                {l3Feats.length > 0 &&
                                  (isExpandedL2 ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                  ))}
                              </div>
                              <Network
                                className={`w-4 h-4 ${
                                  isSelectedL2 ? 'text-blue-600' : 'text-blue-400'
                                }`}
                              />
                              <span className="truncate">{l2.name}</span>
                            </div>

                            {isExpandedL2 && l3Feats.length > 0 && (
                              <div className="ml-6 border-l border-slate-200 pl-1 mt-1 space-y-1">
                                {l3Feats.map((l3) => {
                                  const isSelectedL3 =
                                    selectedItem?.type === 'l3' && selectedItem.data.id === l3.id;
                                  return (
                                    <div
                                      key={l3.id}
                                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm ${
                                        isSelectedL3
                                          ? 'bg-orange-50 border border-orange-200 text-orange-800 shadow-sm'
                                          : 'hover:bg-slate-200/50 text-slate-600'
                                      }`}
                                      onClick={() =>
                                        setSelectedItem({ type: 'l3', data: l3, parent: l2 })
                                      }
                                    >
                                      <div className="w-4 h-4 flex items-center justify-center" />
                                      <FileText
                                        className={`w-3.5 h-3.5 ${
                                          isSelectedL3 ? 'text-orange-500' : 'text-slate-400'
                                        }`}
                                      />
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
        <HierarchyDetailPanel selectedItem={selectedItem} />
      </div>
    </div>
  );
};
