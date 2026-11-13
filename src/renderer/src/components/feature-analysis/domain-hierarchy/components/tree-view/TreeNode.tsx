import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ChevronRight, ChevronDown, Folder, Network, FileText, Play } from 'lucide-react';
import { DomainTreeNodeData, TreeNodeType } from '../../types';
import {
  TREE_ROOT_WIDTH,
  TREE_NODE_WIDTH,
  TREE_NODE_HEIGHT,
  TREE_NODE_STYLES
} from '../../constants';

const TREE_NODE_ICONS: Record<Exclude<TreeNodeType, 'root'>, typeof Folder> = {
  l1: Folder,
  l2: Network,
  l3: FileText
};

export const TreeNode: React.FC<NodeProps<DomainTreeNodeData>> = memo(({ data }) => {
  const {
    id,
    name,
    description,
    type,
    parentName,
    isExpanded,
    hasChildren,
    isSelected,
    onToggle,
    onSelect
  } = data;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect({
      id,
      name,
      description,
      type,
      parentName
    });
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(id);
  };

  if (type === 'root') {
    return (
      <>
        <div
          onClick={handleSelect}
          style={{ width: TREE_ROOT_WIDTH, height: TREE_NODE_HEIGHT }}
          className={`flex items-center justify-between gap-2 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-md transition-all cursor-pointer select-none border border-orange-400 ${
            isSelected ? 'ring-4 ring-orange-200' : ''
          }`}
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            <Play className="w-3.5 h-3.5 fill-white text-white flex-shrink-0" />
            <span className="truncate tracking-wide" title={name}>
              {name}
            </span>
          </div>

          {hasChildren && (
            <button
              type="button"
              onClick={handleToggleClick}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-orange-600/60 transition-colors flex-shrink-0 cursor-pointer"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-white" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white" />
              )}
            </button>
          )}
        </div>

        {hasChildren && (
          <Handle
            type="source"
            position={Position.Right}
            className="!w-2 !h-2 !bg-slate-400 !border !border-white"
          />
        )}
      </>
    );
  }

  const Icon = TREE_NODE_ICONS[type];
  const { iconColor, selectedClass } = TREE_NODE_STYLES[type];
  const cardBorder = isSelected
    ? selectedClass
    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md';

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-slate-400 !border !border-white"
      />

      <div
        onClick={handleSelect}
        style={{ width: TREE_NODE_WIDTH, height: TREE_NODE_HEIGHT }}
        className={`flex items-center justify-between gap-2 px-4 rounded-xl border text-slate-800 text-sm font-medium transition-all cursor-pointer select-none shadow-sm ${cardBorder}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
          <span className="truncate text-slate-700 font-medium" title={name}>
            {name}
          </span>
        </div>

        {hasChildren ? (
          <button
            type="button"
            onClick={handleToggleClick}
            className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <div className="w-2 flex-shrink-0" />
        )}
      </div>

      {hasChildren && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2 !h-2 !bg-slate-400 !border !border-white"
        />
      )}
    </>
  );
});

TreeNode.displayName = 'TreeNode';
