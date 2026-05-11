// Adapted for Lifter-File-Viewer (removed 'use client')

import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  MiniMap,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { GraphData, GraphNode, GraphLink, EntityType, CustomNodeProps, GraphFilters, KnowledgeGraphVisualizationProps, ConnectedNodesResult, LayoutedElements, CustomNodeData } from './type';
import { downloadSvg, exportToSvg } from './GraphExportUtils';

// Dynamic color generator
const generateColorPalette = (count: number): string[] => {
  const baseColors = [
    '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', 
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6',
    '#f43f5e', '#d946ef', '#0ea5e9', '#84cc16', '#64748b'
  ];
  
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  // Generate additional colors if needed
  const additionalColors = [];
  for (let i = baseColors.length; i < count; i++) {
    const hue = (i * 137.5) % 360; // Golden angle approximation
    additionalColors.push(`hsl(${hue}, 70%, 50%)`);
  }
  
  return [...baseColors, ...additionalColors];
};

// Extract entity types and their colors dynamically
const extractEntityTypesWithColors = (data?: GraphData): { type: string; color: string }[] => {
  if (!data?.metadata?.nodesByType) return [];
  
  const entityTypes = Object.keys(data.metadata.nodesByType);
  const colorPalette = generateColorPalette(entityTypes.length);
  
  return entityTypes.map((type, index) => ({
    type,
    color: colorPalette[index % colorPalette.length]
  }));
};

// Extract relationship types dynamically from the data
const extractRelationshipTypes = (data?: GraphData): string[] => {
  const relationshipTypes = new Set<string>();
  
  if (!data) return [];
  
  // 1. Get from edgesByType metadata
  if (data.metadata?.edgesByType) {
    for (const type of Object.keys(data.metadata.edgesByType)) {
      if (type && type.trim() !== '') {
        relationshipTypes.add(type);
      }
    }
  }
  
  // 2. Get from linksByType metadata
  if (data.metadata?.linksByType) {
    for (const type of Object.keys(data.metadata.linksByType)) {
      if (type && type.trim() !== '') {
        relationshipTypes.add(type);
      }
    }
  }
  
  // 3. Get from actual links array
  if (data.links && Array.isArray(data.links)) {
    for (const link of data.links) {
      if (link?.type && link.type.trim() !== '') {
        relationshipTypes.add(link.type);
      }
    }
  }  
  return Array.from(relationshipTypes).sort();
};

// Generate colors dynamically based on types
const getDynamicColor = (type: string, allTypes: string[]): string => {
  const colorPalette = generateColorPalette(allTypes.length);
  const typeIndex = allTypes.indexOf(type);
  return colorPalette[typeIndex % colorPalette.length] || '#64748b';
};

// Enhanced helper function to get accurate count for each relationship type
const getRelationshipCount = (type: string, data?: GraphData): number => {
  if (!data) return 0;
  
  // Count from actual links array (most accurate)
  if (data.links) {
    return data.links.filter(link => link?.type === type).length;
  }
  
  // Fallback to metadata counts
  if (data.metadata?.edgesByType?.[type]) {
    return data.metadata.edgesByType[type];
  }
  
  if (data.metadata?.linksByType?.[type]) {
    return data.metadata.linksByType[type];
  }
  
  return 0;
};

// Dynamic Relationship Types Filter Component
const RelationshipTypesFilter = ({ 
  relationshipTypes, 
  data,
  selectedRelationshipTypes,
  onRelationshipTypeToggle 
}: { 
  relationshipTypes: string[], 
  data?: GraphData,
  selectedRelationshipTypes: Set<string>,
  onRelationshipTypeToggle: (type: string) => void
}) => {
  if (relationshipTypes.length === 0) return null;
  
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: '500' }}>
          Relationship Types ({relationshipTypes.length})
        </label>
        <div style={{ fontSize: '11px', color: '#64748b' }}>
          {selectedRelationshipTypes.size} selected
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px', 
        maxHeight: '200px', 
        overflowY: 'auto',
        padding: '8px',
        background: 'rgba(0,0,0,0.02)',
        borderRadius: '6px',
        border: `1px solid #e2e8f0`
      }}>
        {relationshipTypes.map(type => {
          const count = getRelationshipCount(type, data);
          const isSelected = selectedRelationshipTypes.has(type);
          const color = getDynamicColor(type, relationshipTypes);
          
          return (
            <label 
              key={type} 
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                padding: '8px 10px',
                background: isSelected ? `${color}15` : 'white',
                borderRadius: '6px',
                border: `1px solid ${isSelected ? color : '#e2e8f0'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => onRelationshipTypeToggle(type)}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                style={{ marginRight: '10px' }}
              />
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                backgroundColor: color,
                marginRight: '10px',
                flexShrink: 0
              }} />
              <span style={{ 
                textTransform: 'capitalize', 
                fontSize: '13px',
                flex: 1,
                fontWeight: isSelected ? '600' : '400'
              }}>
                {type?.replaceAll('_', ' ') || type}
              </span>
              <span style={{ 
                fontSize: '11px', 
                color: '#64748b',
                background: '#f8fafc',
                padding: '2px 8px',
                borderRadius: '10px',
                minWidth: '30px',
                textAlign: 'center'
              }}>
                {count}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

// Custom node component with dynamic colors
const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  // Get color from node data or use default
  const nodeColor = data?.color || '#64748b';
  
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        style={{
          padding: '12px 20px',
          borderRadius: '8px',
          background: 'white',
          border: `2px solid ${nodeColor}`,
          minWidth: '150px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
      >
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b', marginBottom: '4px' }}>
          {data?.name || data?.id || 'Unknown Node'}
        </div>
        <div style={{
          fontSize: '11px',
          color: '#64748b',
          textTransform: 'capitalize',
          marginBottom: '4px'
        }}>
          {data?.type?.replace('_', ' ') || 'unknown'}
        </div>
        {data?.metadata?.analysis?.confidence_score && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: (data.metadata.analysis.confidence_score > 0.7 ? '#10b981' :
              data.metadata.analysis.confidence_score > 0.4 ? '#f59e0b' : '#ef4444')
          }} />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
};

// Define nodeTypes outside the component to prevent unnecessary re-renders
const nodeTypes = {
  custom: CustomNode,
};

// Extract entity types from the graph data
const extractEntityTypes = (data?: GraphData): string[] => {
  if (!data?.metadata?.nodesByType) return [];
  return Object.keys(data.metadata.nodesByType);
};

// Filter function that works with your JSON structure
export function getFilteredGraphData(
  data?: GraphData,
  filters?: GraphFilters
): GraphData {
  if (!data) {
    return {
      nodes: [],
      links: [],
      metadata: {}
    };
  }

  let filteredNodes = data?.nodes || [];
  let filteredLinks = data?.links || [];

  // Filter by entity types
  if (filters?.entityTypes && filters.entityTypes.size > 0) {
    filteredNodes = filteredNodes.filter(node =>
      node?.type && filters.entityTypes?.has(node.type)
    );
  }

  // Filter by relationship types
  if (filters?.relationshipTypes && filters.relationshipTypes.size > 0) {
    filteredLinks = filteredLinks.filter(link =>
      link?.type && filters.relationshipTypes?.has(link.type)
    );
  }

  // Filter by search query
  if (filters?.searchQuery && filters.searchQuery.trim() !== '') {
    const query = filters.searchQuery.toLowerCase();
    filteredNodes = filteredNodes.filter(node =>
      (node?.name || node?.id)?.toLowerCase().includes(query) ||
      node?.metadata?.description?.toLowerCase().includes(query) ||
      node?.type?.toLowerCase().includes(query) ||
      node?.metadata?.source_name?.toLowerCase().includes(query)
    );
  }

  // Filter out isolated nodes (nodes without links)
  if (filters?.hideIsolatedNodes) {
    const connectedNodeIds = new Set<string>();

    // Collect all node IDs that have connections
    for (const link of filteredLinks) {
      if (link?.source) connectedNodeIds.add(link.source);
      if (link?.target) connectedNodeIds.add(link.target);
    }

    filteredNodes = filteredNodes.filter(node =>
      node?.id && connectedNodeIds.has(node.id)
    );
  }

  // Focus on specific node (impact analysis)
  if (filters?.focusNodeId) {
    const connectedNodeIds = new Set([filters.focusNodeId]);

    // Get all directly connected nodes
    for (const link of filteredLinks) {
      if (link?.source === filters.focusNodeId && link?.target) {
        connectedNodeIds.add(link.target);
      }
      if (link?.target === filters.focusNodeId && link?.source) {
        connectedNodeIds.add(link.source);
      }
    }

    filteredNodes = filteredNodes.filter(node =>
      node?.id && connectedNodeIds.has(node.id)
    );

    // Filter links to only show relevant connections
    filteredLinks = filteredLinks.filter(link =>
      link?.source && link?.target &&
      connectedNodeIds.has(link.source) && connectedNodeIds.has(link.target)
    );
  } else {
    // Only include links between filtered nodes
    const nodeIds = new Set(filteredNodes.map(n => n?.id).filter(Boolean));
    filteredLinks = filteredLinks.filter(link =>
      link?.source && link?.target &&
      nodeIds.has(link.source) && nodeIds.has(link.target)
    );
  }

  return {
    ...data,
    nodes: filteredNodes,
    links: filteredLinks
  };
}

// Main visualization component
function KnowledgeGraphVisualizationV2Content({
  data,
}: Readonly<KnowledgeGraphVisualizationProps>) {
  const [graphData, setGraphData] = useState<GraphData>(data || {
    name: '',
    metadata: {},
    nodes: [],
    links: [],
    entryPoints: [],
    metrics: {
      totalNodes: 0,
      totalEdges: 0,
      density: 0,
      isDAG: false,
      numberOfCycles: 0,
      stronglyConnectedComponents: 0,
      entryPoints: 0,
      leafNodes: 0,
      rootNodes: 0,
      mostCalled: [],
      mostCalling: []
    }
  });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [entityTypesWithColors, setEntityTypesWithColors] = useState<{ type: string; color: string }[]>([]);
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<Set<EntityType>>(new Set());
  const [relationshipTypes, setRelationshipTypes] = useState<string[]>([]);
  const [selectedRelationshipTypes, setSelectedRelationshipTypes] = useState<Set<string>>(new Set());
  const [layoutType, setLayoutType] = useState<'force' | 'dagre-lr' | 'dagre-tb'>('dagre-tb');
  const [viewLevel, setViewLevel] = useState<'detailed' | 'application'>('detailed');
  const [applicationGroups, setApplicationGroups] = useState<Map<string, Set<string>>>(new Map());
  const [highlightTraversal, setHighlightTraversal] = useState<boolean>(true);
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState<boolean>(false);
  const [hideIsolatedNodes, setHideIsolatedNodes] = useState<boolean>(false);
  const [connectedNodes, setConnectedNodes] = useState<Set<string>>(new Set());
  const [connectedEdges, setConnectedEdges] = useState<Set<string>>(new Set());
  const [shouldFitView, setShouldFitView] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const { fitView } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [, setReactFlowInstance] = useState<ReactFlowInstance<Node, Edge> | null>(null);

  // Extract entity types and relationship types from data
  useEffect(() => {
    if (data) {
      const extractedEntityTypes = extractEntityTypes(data);
      const extractedEntityTypesWithColors = extractEntityTypesWithColors(data);
      const extractedRelationshipTypes = extractRelationshipTypes(data);
      
      setEntityTypes(extractedEntityTypes);
      setEntityTypesWithColors(extractedEntityTypesWithColors);
      setRelationshipTypes(extractedRelationshipTypes);
      
      // Initialize selected entity types with all available types
      setSelectedEntityTypes(new Set(extractedEntityTypes));
      setSelectedRelationshipTypes(new Set(extractedRelationshipTypes));
    }
  }, [data]);

  // Build application groups from metadata
  useEffect(() => {
    if (!data?.nodes) return;

    const groups = new Map<string, Set<string>>();    
      for (const node of data.nodes) {
      const appName = node?.metadata?.source_name || 'Unknown';
      if (!groups.has(appName)) {
        groups.set(appName, new Set());
      }
      if (node?.id) {
        groups.get(appName)!.add(node.id);
      }
    };
    setApplicationGroups(groups);
  }, [data]);

  // Update filtered data when filters change
  useEffect(() => {
    if (!data) return;

    let filtered = getFilteredGraphData(data, {
      entityTypes: selectedEntityTypes,
      relationshipTypes: selectedRelationshipTypes,
      searchQuery,
      hideIsolatedNodes,
    });

    // If in application view, group nodes
    if (viewLevel === 'application' && applicationGroups.size > 0) {
      const appNodes: GraphNode[] = [];
      const appLinks: GraphLink[] = [];
      const appConnections = new Map<string, Set<string>>();

      for (const [appName, nodeIds] of applicationGroups.entries()) {
        const appNodeIds = Array.from(nodeIds).filter(id =>
          filtered?.nodes?.some(n => n?.id === id)
        );

        if (appNodeIds.length === 0) continue;

        appNodes.push({
          id: `app-${appName}`,
          name: appName,
          label: appName,
          type: 'application',
          metadata: {
            description: `Application group containing ${appNodeIds.length} entities`,
            source_name: appName
          },
          calls: [],
          calledBy: [],
          dependencies: [],
          summary: null,
          classifications: [],
          complexityScore: 0,
          isEntryPoint: false,
          businessRules: [],
          integrations: [],
          dataEntities: []
        });
      }

      const createdApps = new Set(appNodes.map(n => n?.name).filter(Boolean));

      if (data?.links) {
        for (const link of data.links) {
          let sourceApp = '';
          let targetApp = '';

          for (const [appName, nodeIds] of applicationGroups.entries()) {
            if (link?.source && nodeIds.has(link.source)) sourceApp = appName;
            if (link?.target && nodeIds.has(link.target)) targetApp = appName;
          }

          if (sourceApp && targetApp && sourceApp !== targetApp &&
            createdApps.has(sourceApp) && createdApps.has(targetApp)) {
            const linkKey = `${sourceApp}-${targetApp}`;
            if (!appConnections.has(linkKey)) {
              appConnections.set(linkKey, new Set());
              appLinks.push({
                source: `app-${sourceApp}`,
                target: `app-${targetApp}`,
                type: 'integration',
                weight: 0.8,
                metadata: {
                  description: `Integration between ${sourceApp} and ${targetApp}`
                }
              });
            }
          }
        }
      }

      filtered = { ...data, nodes: appNodes, links: appLinks };
    }

    setGraphData(filtered);
  }, [selectedEntityTypes, selectedRelationshipTypes, searchQuery, data, viewLevel, applicationGroups, hideIsolatedNodes]);

  // Find all downstream nodes (forward direction only) via BFS traversal
  const findConnectedNodes = useCallback((nodeId: string, links: GraphLink[]): ConnectedNodesResult => {
    const connectedNodeIds = new Set<string>();
    const connectedEdgeIds = new Set<string>();
    const queue: string[] = [nodeId];
    const visited = new Set<string>();

    // Add the selected node itself
    connectedNodeIds.add(nodeId);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      // Only follow outgoing edges (forward direction: source → target)
      for (const [index, link] of links.entries()) {
        if (link?.source === currentId && link?.target) {
          connectedEdgeIds.add(`${link.source}-${link.target}-${index}`);
          connectedNodeIds.add(link.target);
          if (!visited.has(link.target)) {
            queue.push(link.target);
          }
        }
      }
    }

    return { connectedNodeIds, connectedEdgeIds };
  }, []);

  // Update connected nodes when selection changes
  useEffect(() => {
    if (selectedNode?.id && highlightTraversal) {
      const { connectedNodeIds, connectedEdgeIds } = findConnectedNodes(selectedNode.id, graphData?.links || []);
      setConnectedNodes(connectedNodeIds);
      setConnectedEdges(connectedEdgeIds);
    } else {
      setConnectedNodes(new Set());
      setConnectedEdges(new Set());
    }
  }, [selectedNode, graphData?.links, highlightTraversal, findConnectedNodes]);

  // Apply layout algorithm
  const getLayoutedElements = useCallback((nodes: Node[], edges: Edge[], direction: string = 'TB'): LayoutedElements => {
    if (layoutType === 'force') {
      // For force layout, return nodes with random positions and let React Flow handle it
      return {
        nodes: nodes.map((node) => ({
          ...node,
          position: {
            x: Math.random() * 800,
            y: Math.random() * 600,
          }
        })),
        edges
      };
    }

    // Use dagre for hierarchical layouts
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 200;
    const nodeHeight = 100;

    dagreGraph.setGraph({
      rankdir: direction,
      nodesep: viewLevel === 'application' ? 150 : 100,
      ranksep: viewLevel === 'application' ? 200 : 150,
    });

    for (const node of nodes) {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    }

    for (const edge of edges) {
      dagreGraph.setEdge(edge.source, edge.target);
    }

    dagre.layout(dagreGraph);

    return {
      nodes: nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
          },
        };
      }),
      edges,
    };
  }, [layoutType, viewLevel]);

  // Convert graph data to React Flow format with dynamic colors
  // Heavy dagre layout is deferred via setTimeout so the loading spinner
  // can paint before the main thread is blocked.
  useEffect(() => {
    if (!graphData?.nodes?.length) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const timerId = setTimeout(() => {
      const flowNodes: Node[] = graphData.nodes.map((node) => {
        const isConnected = connectedNodes.has(node?.id || '');
        const isHighlighted = selectedNode && highlightTraversal;

        const entityType = entityTypesWithColors.find(et => et.type === node?.type);
        const nodeColor = entityType?.color || '#64748b';

        return {
          id: node?.id || `node-${Math.random()}`,
          type: 'custom',
          data: { ...node, color: nodeColor } as CustomNodeData,
          position: { x: 0, y: 0 },
          style: { opacity: isHighlighted && !isConnected ? 0.3 : 1 },
        };
      });

      const nodeIdSet = new Set(graphData.nodes.map(n => n?.id).filter(Boolean));

      const flowEdges: Edge[] = (graphData.links || [])
        .filter(link => link?.source && link?.target && nodeIdSet.has(link.source) && nodeIdSet.has(link.target))
        .map((link, index) => {
          const edgeId = `${link.source}-${link.target}-${index}`;
          const isConnected = connectedEdges.has(edgeId);
          const isHighlighted = selectedNode && highlightTraversal;
          const relationshipColor = getDynamicColor(link.type || 'default', relationshipTypes);
          return {
            id: edgeId,
            source: link.source,
            target: link.target,
            animated: isConnected,
            style: {
              stroke: isConnected ? relationshipColor : '#94a3b8',
              strokeWidth: isConnected ? 3 : 2.5,
              opacity: isHighlighted && !isConnected ? 0.2 : 1,
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: isConnected ? relationshipColor : '#94a3b8', width: 20, height: 20 },
            label: link?.type || 'connection',
            labelStyle: { fill: isConnected ? relationshipColor : '#1e293b', fontSize: 11, fontWeight: isConnected ? 600 : 500 },
          };
        });

      const direction = layoutType === 'dagre-lr' ? 'LR' : 'TB';
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges, direction);

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setIsLoading(false);
    }, 0);

    return () => clearTimeout(timerId);
  }, [graphData, layoutType, getLayoutedElements, setNodes, setEdges, selectedNode, connectedNodes, connectedEdges, highlightTraversal, relationshipTypes, entityTypesWithColors]);

  // Fit view when nodes or layout changes, but only when shouldFitView is true
  useEffect(() => {
    if (!shouldFitView) return;
    
    setTimeout(() => {
      fitView({
        duration: 800,
        padding: 0.2
      });
    }, 100);
    
    // Reset shouldFitView after fitting to prevent repeated auto-zoom
    setShouldFitView(false);
  }, [nodes, layoutType, viewLevel, fitView, shouldFitView]);

  const toggleEntityType = (type: EntityType): void => {
    const newSet = new Set(selectedEntityTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedEntityTypes(newSet);
  };

  const toggleRelationshipType = (type: string): void => {
    const newSet = new Set(selectedRelationshipTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedRelationshipTypes(newSet);
  };

  const resetFilters = (): void => {
    setSearchQuery('');
    setSelectedEntityTypes(new Set(entityTypes));
    setSelectedRelationshipTypes(new Set(relationshipTypes));
    setSelectedNode(null);
    setViewLevel('detailed');
    setHideIsolatedNodes(false);
    setConnectedNodes(new Set());
    setConnectedEdges(new Set());
    setShouldFitView(true);
  };

  const getNodeColor = (type?: string): string => {
    const entityType = entityTypesWithColors.find(et => et.type === type);
    return entityType?.color || '#64748b';
  };

  // Update the node click handler to prevent auto-zoom
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data as GraphNode);
  }, []);

  // Calculate isolated nodes count for stats
  const isolatedNodesCount = React.useMemo(() => {
    if (!graphData?.nodes?.length || !graphData?.links?.length) return 0;

    const connectedNodeIds = new Set<string>();

    // Collect all node IDs that have connections
    for (const link of graphData.links) {
      if (link?.source) connectedNodeIds.add(link.source);
      if (link?.target) connectedNodeIds.add(link.target);
    }

    // Count nodes that are not in the connected set
    return graphData.nodes.filter(node =>
      node?.id && !connectedNodeIds.has(node.id)
    ).length;
  }, [graphData?.nodes, graphData?.links]);

  const handleExportSvg = (): void => {
    if (nodes.length === 0) {
      alert('No graph data to export');
      return;
    }

    try {
      const svgContent = exportToSvg(nodes, edges, {
        backgroundColor: '#ffffff',
        padding: 60
      });

      const filename = `${graphData?.name || 'knowledge-graph'}-${Date.now()}.svg`;
      downloadSvg(svgContent, filename);
    } catch (error) {
      console.error('Error exporting SVG:', error);
      alert('Error exporting graph as SVG. Please try again.');
    }
  };

  if (!data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: '#64748b', fontSize: '16px' }}>
        No graph data available
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: '20px' }}>
        <div style={{
          width: '56px', height: '56px',
          border: '5px solid #f1f5f9',
          borderTop: '5px solid #fb851e',
          borderRadius: '50%',
          animation: 'kg-spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes kg-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 6px 0' }}>Building Knowledge Graph…</p>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {graphData?.nodes?.length?.toLocaleString() || 0} nodes &amp; {graphData?.links?.length?.toLocaleString() || 0} edges
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px', background: '#ffffff', minHeight: '100vh', position: 'relative' }}>
      {/* Left Panel - Controls */}
      <div style={{
        width: isLeftPanelCollapsed ? '60px' : '300px',
        background: '#f8fafc',
        borderRadius: '8px',
        padding: '20px',
        color: '#1e293b',
        height: 'fit-content',
        border: `1px solid #e2e8f0`,
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          style={{
            position: 'absolute',
            top: '5px',
            right: '10px',
            background: '#fb851e',
            border: 'none',
            color: 'white',
            width: '30px',
            height: '30px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
          title={isLeftPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {isLeftPanelCollapsed ? '→' : '←'}
        </button>

        {!isLeftPanelCollapsed && (
          <>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#fb851e' }}>
              {graphData?.name || 'Knowledge Graph'}
            </h2>

            {/* Search and Export Row */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'flex-end' }}>
              {/* Search Input */}
              <div style={{ flex: 1 }}>
                <label htmlFor="search-nodes" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Search Nodes
                </label>
                <input
                  id="search-nodes"
                  type="text"
                  placeholder="Search by name, type, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid #e2e8f0`,
                    background: '#ffffff',
                    color: '#1e293b',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Export SVG Button */}
              <button
                onClick={handleExportSvg}
                disabled={nodes.length === 0}
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: `1px solid #FB851E`,
                  background: '#FB851E',
                  color: 'white',
                  fontSize: '12px',
                  cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: nodes.length === 0 ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  height: 'fit-content',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
                title="Download as interactive SVG (Zoom & Pan enabled)"
                onMouseEnter={(e) => {
                  if (nodes.length > 0) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download SVG
              </button>
            </div>

            {/* Add a small info text below */}
            <div style={{
              fontSize: '11px',
              color: '#64748b',
              textAlign: 'center',
              marginBottom: '15px',
              padding: '8px',
              background: `#10b98115`,
              borderRadius: '4px',
              border: `1px solid #10b98130`
            }}>
              <strong>SVG Features:</strong> Full zoom & pan • Interactive • High quality
            </div>

            {/* Entity Types Filter */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Entity Types ({entityTypes.length})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {entityTypesWithColors.map(({ type, color }) => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedEntityTypes.has(type)}
                      onChange={() => toggleEntityType(type)}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      marginRight: '8px'
                    }} />
                    <span style={{ textTransform: 'capitalize' }}>{type?.replace('_', ' ') || type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Relationship Types Filter */}
            <RelationshipTypesFilter 
              relationshipTypes={relationshipTypes}
              data={data}
              selectedRelationshipTypes={selectedRelationshipTypes}
              onRelationshipTypeToggle={toggleRelationshipType}
            />

            {/* View Level */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="view-level" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                View Level
              </label>
              <select
                id="view-level"
                value={viewLevel}
                onChange={(e) => setViewLevel(e.target.value as 'detailed' | 'application')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid #e2e8f0`,
                  background: '#ffffff',
                  color: '#1e293b',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="detailed">Detailed (Node Level)</option>
                <option value="application">Application (System Level)</option>
              </select>
            </div>

            {/* Layout Type */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="layout-type" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Layout
              </label>
              <select
                id="layout-type"
                value={layoutType}
                onChange={(e) => setLayoutType(e.target.value as 'force' | 'dagre-lr' | 'dagre-tb')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid #e2e8f0`,
                  background: '#ffffff',
                  color: '#1e293b',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="dagre-tb">Hierarchical (Top-Bottom)</option>
                <option value="dagre-lr">Hierarchical (Left-Right)</option>
                <option value="force">Force Directed</option>
              </select>
            </div>

            {/* Hide Isolated Nodes Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hideIsolatedNodes}
                  onChange={(e) => setHideIsolatedNodes(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Hide Isolated Nodes</span>
              </label>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', marginLeft: '24px' }}>
                Hide nodes without connections
              </div>
            </div>

            {/* Traversal Highlighting Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={highlightTraversal}
                  onChange={(e) => setHighlightTraversal(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Highlight Traversal</span>
              </label>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', marginLeft: '24px' }}>
                Show all connected nodes when selecting
              </div>
            </div>

            {/* Detail Panel Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showDetailPanel}
                  onChange={(e) => setShowDetailPanel(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Show Detail Panel</span>
              </label>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', marginLeft: '24px' }}>
                Display node details when clicking
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={resetFilters}
                style={{
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: `1px solid #e2e8f0`,
                  background: '#ffffff',
                  color: '#1e293b',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Reset Filters
              </button>
            </div>

            {/* Stats */}
            <div style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: `1px solid #e2e8f0`
            }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#1e293b' }}>Nodes:</strong> {graphData?.nodes?.length || 0}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#1e293b' }}>Relationships:</strong> {graphData?.links?.length || 0}
                </div>
                {!hideIsolatedNodes && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#f59e0b' }}>Isolated Nodes:</strong> {isolatedNodesCount}
                  </div>
                )}
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#1e293b' }}>Selected:</strong> {selectedNode ? (selectedNode?.name || selectedNode?.id) : 'None'}
                </div>
                {selectedNode && highlightTraversal && connectedNodes.size > 0 && (
                  <>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#fb851e' }}>Connected Nodes:</strong> {connectedNodes.size}
                    </div>
                    <div>
                      <strong style={{ color: '#fb851e' }}>Connected Edges:</strong> {connectedEdges.size}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Center - Graph Visualization */}
      <div style={{
        flex: 1,
        background: '#f8fafc',
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid #e2e8f0`,
        position: 'relative',
        height: '85vh',
        minHeight: '600px'
      }} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          minZoom={0.1}
          maxZoom={2}
          onInit={setReactFlowInstance}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls
            showInteractive={false}
            position="top-right"
          />
          <MiniMap
            nodeColor={(node) => getNodeColor(node.data?.type)}
            nodeStrokeWidth={3}
            zoomable
            pannable
            position="bottom-right"
          />
        </ReactFlow>
      </div>

      {/* Right Panel - Details */}
      {selectedNode && showDetailPanel && (
        <div style={{
          width: '350px',
          background: '#f8fafc',
          borderRadius: '8px',
          padding: '20px',
          color: '#1e293b',
          border: `1px solid #e2e8f0`,
          overflowY: 'auto',
          maxHeight: '85vh'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', flex: 1 }}>{selectedNode?.name || selectedNode?.id || 'Unknown Node'}</h3>
            <button
              onClick={() => setSelectedNode(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '0',
                marginLeft: '8px'
              }}
            >
              ×
            </button>
          </div>

          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '4px',
            background: `${getNodeColor(selectedNode?.type)}22`,
            color: getNodeColor(selectedNode?.type),
            fontSize: '12px',
            fontWeight: '500',
            marginBottom: '16px',
            textTransform: 'capitalize'
          }}>
            {selectedNode?.type?.replace('_', ' ') || 'unknown'}
          </div>

          {selectedNode?.metadata?.description && (
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
              {selectedNode.metadata.description}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedNode?.metadata?.source_name && (
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  Source
                </div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                  {selectedNode.metadata.source_name}
                </div>
              </div>
            )}

            {selectedNode?.filePath && (
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  File Path
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                  {selectedNode.filePath}
                </div>
              </div>
            )}

            {selectedNode?.metadata?.analysis && (
              <>
                {selectedNode.metadata.analysis?.confidence_score && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                      Confidence Score
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                      {((selectedNode.metadata.analysis.confidence_score || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                )}

                {selectedNode.metadata.analysis?.classifications && selectedNode.metadata.analysis.classifications.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                      Classifications
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {selectedNode.metadata.analysis.classifications.map((classification: string, index: number) => (
                        <span
                          key={index}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#f1f5f9',
                            color: '#1e293b',
                            fontSize: '11px',
                            border: `1px solid #e2e8f0`
                          }}
                        >
                          {classification}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap with ReactFlowProvider
export default function KnowledgeGraphVisualizationV2(props: Readonly<KnowledgeGraphVisualizationProps>) {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphVisualizationV2Content {...props} />
    </ReactFlowProvider>
  );
}