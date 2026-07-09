import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { ExtendedGraphData, ExtendedLinkData, ExtendedNodeData, FlowData } from './type';


const FlowGraphVisualizer :React.FC<{
  data: ExtendedGraphData;
}> = ({ data}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<ExtendedNodeData, ExtendedLinkData> | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [layout, setLayout] = useState<'LR' | 'TB'>('LR');
  const [selectedNode, setSelectedNode] = useState<ExtendedNodeData | null>(null);
  const [savedFlows, setSavedFlows] = useState<FlowData[]>([]);
  const [currentFlow, setCurrentFlow] = useState<FlowData | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [filterCollapsed, setFilterCollapsed] = useState<boolean>(false);

  const graphData = data

  // Get unique node types from the data
  const getUniqueNodeTypes = (): string[] => {
    // First try to get from metadata if available
    if (graphData.metadata?.procedure_types) {
      return Object.keys(graphData.metadata.procedure_types);
    }
    
    // Fallback: extract unique types from nodes
    const uniqueTypes = new Set<string>();
    for (const node of graphData.nodes) {
      if (node.type) {
        uniqueTypes.add(node.type);
      }
    }
    
    return Array.from(uniqueTypes).sort((a,b) => a.localeCompare(b));
  };

  const availableNodeTypes = getUniqueNodeTypes();
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<Set<string>>(new Set(availableNodeTypes));

  // Helper function to get friendly display names for node types
  const getNodeTypeDisplayName = (nodeType: string): string => {
    const typeMap: Record<string, string> = {
      'proc$': 'Procedures',
      'lp_': 'Logic Programs',
      'cr$': 'Cursors', 
      'report': 'Reports',
      'utility': 'Utilities',
      'unknown': 'Unknown'
    };
    
    return typeMap[nodeType] || nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
  };

  const getNodeStrokeColor = (
    theme: 'dark' | 'light', darkColor: string, lightColor: string
  ) => {
    if (theme === 'dark') {
      return darkColor;
    } else {
      return lightColor;
    }
  }

  const getNodeId = (end: string | number | ExtendedNodeData): string | number => typeof end === 'object' ? end.id : end;

  // Detect system theme and setup theme listener
  useEffect(() => {
    const detectTheme = () => {
      if (typeof window !== 'undefined') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(isDark ? 'dark' : 'light');
        
        // Add or remove dark class on document
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    detectTheme();

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Main graph rendering effect
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width;
    const height = dimensions.height;

    // Set background based on theme
    svg.style('background', theme === 'dark' ? 'transparent' : '#f9fafb');

    // Create container for zoom
    const container = svg.append('g');

    // Define arrow markers for both themes
    const defs = svg.append('defs');
    
    // Light theme arrow
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .style('fill', theme === 'dark' ? '#666' : '#9ca3af');

    defs.append('marker')
      .attr('id', 'arrowhead-highlighted')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .style('fill', '#fb851e');

    // Color scale for node types
    const colorScale = d3.scaleOrdinal()
      .domain(['proc$', 'lp_', 'cr$', 'report', 'utility', 'unknown'])
      .range(['#fb851e', '#ef4444', '#06b6d4', '#3b82f6', '#10b981', theme === 'dark' ? '#6b7280' : '#9ca3af']);

    // Size scale for nodes
    const sizeScale = d3.scaleLinear()
      .domain([0, d3.max(graphData.nodes, (d: ExtendedNodeData) => d.centrality || 0) || 1])
      .range([8, 24]);

    // Prepare data for visualization
    let nodes = currentFlow ? currentFlow.nodes : [...graphData.nodes];
    let links = currentFlow ? currentFlow.links : [...graphData.links];
    
    // Apply node type filter
    if (selectedNodeTypes.size > 0) {
      nodes = nodes.filter((node: ExtendedNodeData) => selectedNodeTypes.has(node.type));
      const nodeIds = new Set(nodes.map((n: ExtendedNodeData) => n.id));
      links = links.filter((link: ExtendedLinkData) => {
        const sourceId = getNodeId(link.source);
        const targetId = getNodeId(link.target);
        return nodeIds.has(sourceId as string) && nodeIds.has(targetId as string);
      });
    }

    // Create force simulation
    const simulation = d3.forceSimulation<ExtendedNodeData, ExtendedLinkData>(nodes)
      .force('link', d3.forceLink<ExtendedNodeData, ExtendedLinkData>(links).id((d: ExtendedNodeData) => d.id).distance(120))
      .force('charge', d3.forceManyBody<ExtendedNodeData>().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<ExtendedNodeData>().radius(35));

    // Apply layout-specific forces
    if (layout === 'LR') {
      simulation
        .force('x', d3.forceX<ExtendedNodeData>((d: ExtendedNodeData) => (d.depth || 0) * 180).strength(0.5))
        .force('y', d3.forceY<ExtendedNodeData>(height / 2).strength(0.1));
    } else {
      simulation
        .force('x', d3.forceX<ExtendedNodeData>(width / 2).strength(0.1))
        .force('y', d3.forceY<ExtendedNodeData>((d: ExtendedNodeData) => (d.depth || 0) * 120).strength(0.5));
    }

    simulationRef.current = simulation;

    // Add links
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', theme === 'dark' ? '#444' : '#d1d5db')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1)
      .attr('marker-end', 'url(#arrowhead)');

    // Add nodes
    const node = container.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .style('cursor', 'pointer');

    node.append('circle')
      .attr('r', (d: ExtendedNodeData) => sizeScale(d.centrality || 0))
      .style('fill', (d: ExtendedNodeData) => colorScale(d.type) as string)
      .style('stroke', theme === 'dark' ? '#333' : '#e5e7eb')
      .style('stroke-width', 1.5);

    node.append('text')
      .attr('dx', (d: ExtendedNodeData) => sizeScale(d.centrality || 0) + 5)
      .attr('dy', '.35em')
      .text((d: ExtendedNodeData) => d.name)
      .style('fill', theme === 'dark' ? '#e0e0e0' : '#374151')
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    // Node interactions
    node.on('click', (event: MouseEvent, d: ExtendedNodeData) => {
      event.stopPropagation();
      setSelectedNode(d);
      // Fix the selection by using the container instead of node for selectAll
      container.selectAll<SVGCircleElement, ExtendedNodeData>('circle')
        .style('stroke', (n: ExtendedNodeData) => n.id === d.id ? '#fb851e' : getNodeStrokeColor(theme, '#333', '#e5e7eb'))
        .style('stroke-width', (n: ExtendedNodeData) => n.id === d.id ? 3 : 1.5);
    });

    node.on('mouseover', function(event: MouseEvent, d: ExtendedNodeData) {
      // Highlight connections
      const connectedNodes = new Set<string>();
      for (const l of links) {
        const sourceId = getNodeId(l.source);
        const targetId = getNodeId(l.target);
        if (sourceId === d.id || targetId === d.id) {
          connectedNodes.add(sourceId as string);
          connectedNodes.add(targetId as string);
        }
      }

      node.style('opacity', (n: ExtendedNodeData) => connectedNodes.has(n.id) ? 1 : 0.2);
      link
        .style('stroke', (l: ExtendedLinkData) => {
          const sourceId = getNodeId(l.source);
          const targetId = getNodeId(l.target);
          return (sourceId === d.id || targetId === d.id) ? '#fb851e' : getNodeStrokeColor(theme, '#444', '#d1d5db');
        })
        .style('stroke-width', (l: ExtendedLinkData) => {
          const sourceId = getNodeId(l.source);
          const targetId = getNodeId(l.target);
          return (sourceId === d.id || targetId === d.id) ? 2 : 1;
        })
        .attr('marker-end', (l: ExtendedLinkData) => {
          const sourceId = getNodeId(l.source);
          const targetId = getNodeId(l.target);
          return (sourceId === d.id || targetId === d.id) ? 'url(#arrowhead-highlighted)' : 'url(#arrowhead)';
        });
    });

    node.on('mouseout', function() {
      node.style('opacity', 1);
      link
        .style('stroke', theme === 'dark' ? '#444' : '#d1d5db')
        .style('stroke-width', 1)
        .attr('marker-end', 'url(#arrowhead)');
    });

    // Drag functions with proper types
    const drag = d3.drag<SVGGElement, ExtendedNodeData>()
      .on('start', (event: d3.D3DragEvent<SVGGElement, ExtendedNodeData, ExtendedNodeData>, d: ExtendedNodeData) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event: d3.D3DragEvent<SVGGElement, ExtendedNodeData, ExtendedNodeData>, d: ExtendedNodeData) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event: d3.D3DragEvent<SVGGElement, ExtendedNodeData, ExtendedNodeData>, d: ExtendedNodeData) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag);

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: ExtendedLinkData) => {
          const source = d.source as ExtendedNodeData;
          return source.x || 0;
        })
        .attr('y1', (d: ExtendedLinkData) => {
          const source = d.source as ExtendedNodeData;
          return source.y || 0;
        })
        .attr('x2', (d: ExtendedLinkData) => {
          const target = d.target as ExtendedNodeData;
          return target.x || 0;
        })
        .attr('y2', (d: ExtendedLinkData) => {
          const target = d.target as ExtendedNodeData;
          return target.y || 0;
        });

      node.attr('transform', (d: ExtendedNodeData) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Zoom functionality with proper types
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        container.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    // Search highlighting
    if (searchTerm) {
      node.style('opacity', (d: ExtendedNodeData) => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.file?.toLowerCase().includes(searchTerm.toLowerCase())) ? 1 : 0.2
      );
    }

  }, [dimensions, layout, currentFlow, searchTerm, theme, selectedNodeTypes, graphData.links, graphData.nodes]);

  // Create flow from selected node
  const createFlow = useCallback(() => {
    if (!selectedNode) {
      alert('Please select a node first');
      return;
    }

    const findConnectedNodes = (startNode: ExtendedNodeData, maxDepth = 3): ExtendedNodeData[] => {
      const visited = new Set<string>();
      const queue: Array<{ node: ExtendedNodeData; depth: number }> = [{ node: startNode, depth: 0 }];
      const result: ExtendedNodeData[] = [];

      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) continue;
        const { node, depth } = item;
        
        if (visited.has(node.id) || depth > maxDepth) continue;
        
        visited.add(node.id);
        result.push(node);

        for (const link of graphData.links) {
          const sourceId = getNodeId(link.source);
          const targetId = getNodeId(link.target);
          
          const targetNode = graphData.nodes.find((n: ExtendedNodeData) => n.id === targetId);
          if (sourceId === node.id && targetNode && !visited.has(targetId as string)) {
              queue.push({ node: targetNode, depth: depth + 1 });
          }
          const sourceNode = graphData.nodes.find((n: ExtendedNodeData) => n.id === sourceId);
          if (targetId === node.id && sourceNode && !visited.has(sourceId as string)) {
              queue.push({ node: sourceNode, depth: depth + 1 });
          }
        }
      }

      return result;
    };

    let connectedNodes = findConnectedNodes(selectedNode);
    
    // Apply node type filter to connected nodes
    if (selectedNodeTypes.size > 0) {
      connectedNodes = connectedNodes.filter((node: ExtendedNodeData) => selectedNodeTypes.has(node.type));
    }
    
    const nodeIds = new Set(connectedNodes.map((n: ExtendedNodeData) => n.id));
    const connectedLinks = graphData.links.filter((link: ExtendedLinkData) => {
      const sourceId = getNodeId(link.source);
      const targetId = getNodeId(link.target);
      return nodeIds.has(sourceId as string) && nodeIds.has(targetId as string);
    });

    const flow: FlowData = {
      id: Date.now(),
      name: `Flow: ${selectedNode.name}`,
      startNode: selectedNode,
      nodes: connectedNodes,
      links: connectedLinks,
      created: new Date().toLocaleString()
    };

    setSavedFlows([...savedFlows, flow]);
  }, [selectedNode, savedFlows, selectedNodeTypes, graphData.links, graphData.nodes]);

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar */}
      <div className="w-96 bg-white dark:bg-gray-900/95 backdrop-blur border-r border-gray-200 dark:border-orange-500/20 flex flex-col shadow-sm">
        <div className="p-6 bg-gray-50 dark:bg-gradient-to-br dark:from-orange-500/10 dark:to-orange-500/5 border-b border-gray-200 dark:border-orange-500/20">
          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search procedures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-orange-500/20 rounded-lg text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-[#fb851e] dark:focus:border-orange-500 focus:bg-white dark:focus:bg-gray-800 transition-colors"
            />
            <svg className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Layout Controls */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setLayout('LR')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                layout === 'LR' 
                  ? 'bg-gradient-to-r from-[#fb851e] to-orange-600 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-orange-500/10 border border-gray-200 dark:border-orange-500/30 text-gray-700 dark:text-orange-500 hover:bg-gray-200 dark:hover:bg-orange-500/20'
              }`}
            >
              Left → Right
            </button>
            <button
              onClick={() => setLayout('TB')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                layout === 'TB' 
                  ? 'bg-gradient-to-r from-[#fb851e] to-orange-600 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-orange-500/10 border border-gray-200 dark:border-orange-500/30 text-gray-700 dark:text-orange-500 hover:bg-gray-200 dark:hover:bg-orange-500/20'
              }`}
            >
              Top → Bottom
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-orange-500/10">
              <div className="text-xl font-semibold text-[#fb851e]">{graphData.metadata?.total_procedures?.toLocaleString() || 'N/A'}</div>
              <div className="text-xs text-gray-600 dark:text-gray-500 uppercase">Procedures</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-orange-500/10">
              <div className="text-xl font-semibold text-[#fb851e]">{graphData.metadata?.total_calls?.toLocaleString() || 'N/A'}</div>
              <div className="text-xs text-gray-600 dark:text-gray-500 uppercase">Calls</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-orange-500/10">
              <div className="text-xl font-semibold text-[#fb851e]">{graphData.metadata?.files_analyzed || 'N/A'}</div>
              <div className="text-xs text-gray-600 dark:text-gray-500 uppercase">Files</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-orange-500/10">
              <div className="text-xl font-semibold text-[#fb851e]">{graphData.statistics?.max_depth || 'N/A'}</div>
              <div className="text-xs text-gray-600 dark:text-gray-500 uppercase">Max Depth</div>
            </div>
          </div>
        </div>

        {/* Flows Section */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
          <button
            onClick={createFlow}
            className="w-full py-2 px-4 bg-gradient-to-r from-[#fb851e] to-orange-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/25 transition-all"
          >
            + Create Flow from Selection
          </button>

          {/* Node Type Filter */}
          <div className="mt-6">
            <button
              onClick={() => setFilterCollapsed(!filterCollapsed)}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-3 hover:text-[#fb851e] dark:hover:text-orange-500 transition-colors"
            >
              <span>Node Type Filter</span>
              <svg 
                className={`w-4 h-4 transition-transform ${filterCollapsed ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {!filterCollapsed && (
              <div className="space-y-2 mb-4 bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg border border-gray-200 dark:border-orange-500/10">
                {availableNodeTypes.map((nodeType) => {
                  const count = graphData.metadata?.procedure_types?.[nodeType] || 
                                graphData.nodes.filter(node => node.type === nodeType).length;
                  
                  return (
                    <label key={nodeType} className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedNodeTypes.has(nodeType)}
                          onChange={(e) => {
                            const newTypes = new Set(selectedNodeTypes);
                            if (e.target.checked) {
                              newTypes.add(nodeType);
                            } else {
                              newTypes.delete(nodeType);
                            }
                            setSelectedNodeTypes(newTypes);
                          }}
                          className="rounded border-gray-300 dark:border-gray-600 text-[#fb851e] focus:ring-[#fb851e] focus:ring-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {getNodeTypeDisplayName(nodeType)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {count}
                      </span>
                    </label>
                  );
                })}
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <button
                    onClick={() => setSelectedNodeTypes(new Set(availableNodeTypes))}
                    className="text-xs px-2 py-1 bg-[#fb851e] text-white rounded hover:bg-orange-600 transition-colors"
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedNodeTypes(new Set())}
                    className="text-xs px-2 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    None
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-4">Saved Flows</div>
          
          {savedFlows.map((flow: FlowData) => (
            <button
              key={flow.id}
              onClick={() => setCurrentFlow(flow)}
              className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-orange-500/10 rounded-lg p-3 mb-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-orange-500/10 hover:border-gray-300 dark:hover:border-orange-500/30 transition-all w-full text-left"
            >
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{flow.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">{flow.nodes.length} nodes • {flow.created}</div>
            </button>
          ))}

          {currentFlow && (
            <button
              onClick={() => setCurrentFlow(null)}
              className="w-full mt-4 py-2 px-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-all"
            >
              ← Back to Full Graph
            </button>
          )}
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 relative bg-gray-50 dark:bg-gray-900" ref={containerRef}>
        {/* Selected Node Info */}
        {selectedNode && (
          <div className="absolute top-4 left-4 bg-white dark:bg-gray-900/95 backdrop-blur border border-gray-200 dark:border-orange-500/20 rounded-lg p-4 max-w-sm z-10 shadow-lg">
            <div className="text-[#fb851e] font-semibold mb-2">{selectedNode.name}</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-500">File:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedNode.file || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-500">Type:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedNode.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-500">Lines:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedNode.lines || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-500">Complexity:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedNode.complexity?.toFixed(3) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-500">Calls:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedNode.calls_count || 0} out / {selectedNode.called_by_count || 0} in</span>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-900/95 backdrop-blur border border-gray-200 dark:border-orange-500/20 rounded-lg p-2 flex gap-2 z-10 shadow-lg">
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>

        <svg 
          ref={svgRef} 
          width={dimensions.width} 
          height={dimensions.height}
          className="transition-colors"
        />
      </div>
    </div>
  );
};

export default FlowGraphVisualizer;
