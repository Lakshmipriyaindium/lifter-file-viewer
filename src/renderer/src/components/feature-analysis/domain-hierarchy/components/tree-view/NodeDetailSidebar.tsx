import React from 'react';
import { X, Bookmark, BookOpen } from 'lucide-react';
import { NodeDetailSidebarProps } from '../../types';
import { TREE_NODE_TYPE_META } from '../../constants';

export const NodeDetailSidebar: React.FC<NodeDetailSidebarProps> = ({
  selectedNode,
  onClose
}) => {
  if (!selectedNode) return null;

  const typeMeta = TREE_NODE_TYPE_META[selectedNode.type];

  return (
    <div className="shrink-0 w-[380px] h-full bg-white border-l border-slate-200 flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-700 tracking-widest uppercase">
            OPEN.FILES
          </span>
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${typeMeta.color}`}
          >
            {typeMeta.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
          title="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Title Section */}
        <div>
          <div className="flex items-center gap-2 bg-orange-50/80 border border-orange-100 text-orange-700 px-3.5 py-2 rounded-xl text-sm font-semibold">
            <Bookmark className="w-4 h-4 text-orange-500" />
            <span>Title</span>
          </div>
          <div className="mt-3 px-1">
            <h3 className="text-xl font-bold text-slate-900 leading-snug">
              {selectedNode.name}
            </h3>
          </div>
        </div>

        {/* Description Section */}
        <div>
          <div className="flex items-center gap-2 bg-orange-50/80 border border-orange-100 text-orange-700 px-3.5 py-2 rounded-xl text-sm font-semibold">
            <BookOpen className="w-4 h-4 text-orange-500" />
            <span>Description</span>
          </div>
          <div className="mt-3 px-1">
            <p className="text-sm text-slate-600 leading-relaxed">
              {selectedNode.description && selectedNode.description.trim() !== ''
                ? selectedNode.description
                : 'No description available for this item.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
