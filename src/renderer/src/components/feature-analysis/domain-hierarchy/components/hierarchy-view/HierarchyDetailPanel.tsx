import React from 'react';
import { Folder, Network, FileText, Bookmark, BookOpen } from 'lucide-react';
import { HierarchyDetailPanelProps } from '../../types';
import { getDomainDescription } from '../../utils';

export const HierarchyDetailPanel: React.FC<HierarchyDetailPanelProps> = ({ selectedItem }) => {
  if (!selectedItem) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <p>Select an item from the hierarchy to view details.</p>
      </div>
    );
  }

  if (selectedItem.type === 'l3') {
    const feature = selectedItem.data;
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
              <span className="text-slate-400 text-sm font-medium">
                {feature.id || feature.feature_id}
              </span>
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
            <p className="text-slate-600 text-sm leading-relaxed">
              {feature.description || 'No description available.'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-slate-800">
              User Stories ({feature.userStories?.length || 0})
            </h3>
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
              <p className="text-sm text-slate-500 italic">
                No user stories available for this feature.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (selectedItem.type === 'l2') {
    const cap = selectedItem.data;
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
    );
  }

  if (selectedItem.type === 'l1') {
    const domain = selectedItem.data;
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
          <p className="text-slate-600 text-sm">{getDomainDescription(domain) || 'No description.'}</p>
        </div>
      </div>
    );
  }

  return null;
};
