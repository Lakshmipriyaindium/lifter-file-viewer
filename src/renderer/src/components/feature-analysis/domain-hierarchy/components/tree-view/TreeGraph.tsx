import React, { useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DomainTreeNodeData, TreeGraphProps } from '../../types';
import {
  ROOT_NODE_ID,
  ROOT_NODE_NAME,
  ROOT_NODE_DESCRIPTION,
  TREE_FLOW_CONFIG
} from '../../constants';
import {
  getDomainCapabilities,
  getDomainDescription,
  createTreeEdge,
  createTreeNode,
  getLayoutedTreeElements
} from '../../utils';
import { TreeNode } from './TreeNode';

const nodeTypes = { domainNode: TreeNode };

const TreeGraphInner: React.FC<TreeGraphProps> = ({
  data,
  expandedNodes,
  selectedNode,
  onToggleNode,
  onSelectNode,
  onCloseSidebar
}) => {
  const { fitView } = useReactFlow();
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<DomainTreeNodeData>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState([]);
  const isSidebarOpen = Boolean(selectedNode);
  const isFirstRender = useRef(true);

  const layouted = useMemo(() => {
    const rawNodes: Node<DomainTreeNodeData>[] = [];
    const rawEdges: Edge[] = [];
    const isRootExpanded = expandedNodes.has(ROOT_NODE_ID);

    // Level 0: Root Node
    rawNodes.push(
      createTreeNode({
        id: ROOT_NODE_ID,
        name: ROOT_NODE_NAME,
        description: ROOT_NODE_DESCRIPTION,
        type: 'root',
        isExpanded: isRootExpanded,
        hasChildren: data.length > 0,
        onToggle: onToggleNode,
        onSelect: onSelectNode
      })
    );

    // Level 1: L1 Domains
    if (isRootExpanded) {
      data.forEach((l1) => {
        const l2Caps = getDomainCapabilities(l1);
        const isL1Expanded = expandedNodes.has(l1.id);

        rawNodes.push(
          createTreeNode({
            id: l1.id,
            name: l1.name,
            description: getDomainDescription(l1),
            type: 'l1',
            parentName: ROOT_NODE_NAME,
            isExpanded: isL1Expanded,
            hasChildren: l2Caps.length > 0,
            onToggle: onToggleNode,
            onSelect: onSelectNode
          })
        );
        rawEdges.push(createTreeEdge(ROOT_NODE_ID, l1.id));

        // Level 2: L2 Capabilities
        if (isL1Expanded) {
          l2Caps.forEach((l2) => {
            const l3Feats = l2.l3Features || [];
            const isL2Expanded = expandedNodes.has(l2.id);

            rawNodes.push(
              createTreeNode({
                id: l2.id,
                name: l2.name,
                description: l2.description,
                type: 'l2',
                parentName: l1.name,
                isExpanded: isL2Expanded,
                hasChildren: l3Feats.length > 0,
                onToggle: onToggleNode,
                onSelect: onSelectNode
              })
            );
            rawEdges.push(createTreeEdge(l1.id, l2.id));

            // Level 3: L3 Features
            if (isL2Expanded) {
              l3Feats.forEach((l3) => {
                rawNodes.push(
                  createTreeNode({
                    id: l3.id,
                    name: l3.name,
                    description: l3.description,
                    type: 'l3',
                    parentName: l2.name,
                    isExpanded: false,
                    hasChildren: false,
                    onToggle: onToggleNode,
                    onSelect: onSelectNode
                  })
                );
                rawEdges.push(createTreeEdge(l2.id, l3.id));
              });
            }
          });
        }
      });
    }

    return getLayoutedTreeElements(rawNodes, rawEdges);
  }, [data, expandedNodes, onToggleNode, onSelectNode]);

  // Sync nodes and edges with React Flow, preserving camera when only selection changes
  useEffect(() => {
    setFlowNodes(
      layouted.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isSelected: selectedNode?.id === node.id
        }
      }))
    );
    setFlowEdges(layouted.edges);
  }, [layouted, selectedNode, setFlowNodes, setFlowEdges]);

  // Re-fit viewport only when tree topology changes (expand/collapse or data change)
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({
        duration: TREE_FLOW_CONFIG.fitDuration,
        padding: TREE_FLOW_CONFIG.fitPadding
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [layouted, fitView]);

  // Smoothly re-center tree inside available flex-1 width when sidebar opens or closes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fitView({
        duration: TREE_FLOW_CONFIG.fitDuration,
        padding: TREE_FLOW_CONFIG.sidebarFitPadding
      });
    }, 60);
    return () => clearTimeout(timer);
  }, [isSidebarOpen, fitView]);

  return (
    <div className="flex-1 min-w-0 h-full overflow-hidden bg-[#fafafb]">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onPaneClick={onCloseSidebar}
        fitView
        fitViewOptions={{ padding: TREE_FLOW_CONFIG.fitPadding }}
        minZoom={TREE_FLOW_CONFIG.minZoom}
        maxZoom={TREE_FLOW_CONFIG.maxZoom}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={TREE_FLOW_CONFIG.dotGap}
          size={TREE_FLOW_CONFIG.dotSize}
          color={TREE_FLOW_CONFIG.dotColor}
        />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
    </div>
  );
};

export const TreeGraph: React.FC<TreeGraphProps> = (props) => (
  <ReactFlowProvider>
    <TreeGraphInner {...props} />
  </ReactFlowProvider>
);
