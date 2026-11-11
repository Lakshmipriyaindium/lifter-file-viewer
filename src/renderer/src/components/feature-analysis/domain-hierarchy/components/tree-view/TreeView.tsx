import React, { useState, useCallback } from 'react';
import { TreeViewProps, SelectedNodeInfo } from '../../types';
import { ROOT_NODE_ID } from '../../constants';
import { TreeGraph } from './TreeGraph';
import { NodeDetailSidebar } from './NodeDetailSidebar';

export const TreeView: React.FC<TreeViewProps> = ({ data }) => {
  // Start with ROOT_NODE_ID expanded so L1 domains are visible immediately
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    () => new Set([ROOT_NODE_ID])
  );
  const [selectedNode, setSelectedNode] = useState<SelectedNodeInfo | null>(null);

  const handleToggleNode = useCallback((id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectNode = useCallback((info: SelectedNodeInfo) => {
    setSelectedNode(info);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="flex w-full h-[calc(100vh-210px)] overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm">
      <TreeGraph
        data={data}
        expandedNodes={expandedNodes}
        selectedNode={selectedNode}
        onToggleNode={handleToggleNode}
        onSelectNode={handleSelectNode}
        onCloseSidebar={handleCloseSidebar}
      />

      <NodeDetailSidebar
        selectedNode={selectedNode}
        onClose={handleCloseSidebar}
      />
    </div>
  );
};
