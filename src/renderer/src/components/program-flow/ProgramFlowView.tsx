'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  NodeProps,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import {
  GitBranch,
  X,
  Layers,
  Shield,
  BookOpen,
  Database,
  Zap,
  PlayCircle,
  FileCode,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react';
import type { ProgramFlowData, ProgramFlowNode, NodeAnalysis } from './type';

const BRAND = '#fb851e';
const BRAND_DARK = '#c2410c';

function normalizeCallKey(call: string): string {
  const s = call.trim();
  if (s.startsWith('codebase:')) return s;
  return `codebase:${s}`;
}

function callToDisplayName(call: string): string {
  const s = call.trim();
  const idx = s.lastIndexOf('::');
  if (idx >= 0) return s.slice(idx + 2);
  return s;
}

export interface ProgramFlowViewProps {
  data: ProgramFlowData;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 60;

type NodeRole = 'entry' | 'spine' | 'tail' | 'leaf';

function FlowNode({ data }: NodeProps<{ programNode: ProgramFlowNode; role: NodeRole }>) {
  const { programNode, role } = data;
  const isTail = role === 'tail';
  const isSpine = role === 'spine';
  const isLeaf = role === 'leaf';

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={isTail ? { borderColor: 'white' } : {}}
      />
      <div
        className="flex cursor-pointer items-center gap-2 overflow-hidden rounded-xl border-2 px-4 py-3 transition-all"
        style={{
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          background: isTail
            ? 'linear-gradient(135deg, #fb851e 0%, #c2410c 100%)'
            : isSpine
              ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
              : 'linear-gradient(135deg, #fff 0%, #f9fafb 100%)',
          borderColor: isTail
            ? '#c2410c'
            : isSpine
              ? '#fb923c'
              : isLeaf
                ? '#e5e7eb'
                : '#fed7aa',
          boxShadow: isTail
            ? '0 4px 20px rgba(251, 133, 30, 0.45)'
            : isSpine
              ? '0 4px 12px rgba(251, 133, 30, 0.2)'
              : '0 2px 6px rgba(0,0,0,0.05)',
          outline: isTail ? '2px solid rgba(251,133,30,0.35)' : undefined,
          outlineOffset: isTail ? '2px' : undefined,
        }}
      >
        {role === 'entry' && <PlayCircle className="h-4 w-4 shrink-0 text-orange-500" />}
        {isTail && <PlayCircle className="h-4 w-4 shrink-0 text-white/80" />}
        {isLeaf && <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
        <span
          className={`min-w-0 truncate text-sm font-semibold ${isTail ? 'text-white' : isLeaf ? 'text-gray-500' : 'text-gray-900'}`}
          title={programNode.metadata?.analysis?.title ?? programNode.name}
        >
          {programNode.metadata?.analysis?.title ?? programNode.name}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={isTail ? { borderColor: 'white' } : {}}
      />
    </>
  );
}

const nodeTypes = { flowNode: FlowNode };

function getLayoutedElements(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 40, ranksep: 80, marginx: 20, marginy: 20 });

  nodes.forEach((node) => dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => dagreGraph.setEdge(e.source, e.target));

  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((node) => {
      const pos = dagreGraph.node(node.id);
      return {
        ...node,
        position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      };
    }),
    edges,
  };
}

function ProgramFlowViewInner({ data }: ProgramFlowViewProps) {
  const { nodes = [], metadata = {} } = data;

  const nodeById = useMemo(() => {
    const map = new Map<string, ProgramFlowNode>();
    for (const n of nodes) {
      map.set(n.id, n);
      const programName = n.id.replace(/^codebase:/, '');
      if (!map.has(programName)) map.set(programName, n);
    }
    return map;
  }, [nodes]);

  const resolveCall = useCallback(
    (call: string): ProgramFlowNode | null => {
      const key = normalizeCallKey(call);
      return nodeById.get(key) ?? nodeById.get(call) ?? null;
    },
    [nodeById]
  );

  const programRootNode = useMemo(() => {
    const programName = (metadata.program as string) ?? '';
    return (
      nodes.find((n) => n.isEntryPoint === true) ??
      nodes.find((n) => n.name === programName) ??
      null
    );
  }, [nodes, metadata]);

  const independentNodes = useMemo(() => {
    const programName = (metadata.program as string) ?? '';
    return nodes.filter(
      (n) =>
        !(n.calledBy?.length ?? 0) &&
        n.id !== programRootNode?.id &&
        n.name !== programName &&
        n.type !== 'label'
    );
  }, [nodes, metadata, programRootNode]);

  const entryPointNodes = useMemo(() => independentNodes, [independentNodes]);
  const entryIds = useMemo(() => new Set(independentNodes.map((n) => n.id)), [independentNodes]);

  const [drillPath, setDrillPath] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<ProgramFlowNode | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [tablePath, setTablePath] = useState<ProgramFlowNode[]>([]);
  const [tableSearch, setTableSearch] = useState('');

  const dataKey = `${(metadata.program as string) ?? ''}-${nodes.length}-${nodes[0]?.id ?? ''}`;
  useEffect(() => {
    setDrillPath([]);
    setSelectedNode(null);
    setTablePath([]);
    setIsPanelOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey]);

  const pathTailId = drillPath.length > 0 ? drillPath[drillPath.length - 1] : null;
  const tailCallees = useMemo((): ProgramFlowNode[] => {
    if (!pathTailId) return [];
    const tailNode = nodeById.get(pathTailId);

    if (!tailNode?.calls?.length) {
      if (programRootNode && pathTailId === programRootNode.id && independentNodes.length > 0) {
        return independentNodes.filter((n) => !drillPath.includes(n.id));
      }
      return [];
    }

    const seen = new Set<string>();
    const out: ProgramFlowNode[] = [];
    for (const call of tailNode.calls) {
      const callee = resolveCall(call);
      if (callee && !seen.has(callee.id) && !drillPath.includes(callee.id)) {
        seen.add(callee.id);
        out.push(callee);
      }
    }
    return out;
  }, [pathTailId, nodeById, resolveCall, drillPath, programRootNode, independentNodes]);

  const tableFilteredEntryPoints = useMemo(() => {
    if (!tableSearch.trim()) return entryPointNodes;
    const q = tableSearch.toLowerCase();
    return entryPointNodes.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        (n.metadata?.analysis?.title ?? '').toLowerCase().includes(q)
    );
  }, [entryPointNodes, tableSearch]);

  const tableTail = tablePath.length > 0 ? tablePath[tablePath.length - 1] : null;
  const tableUniqueCalls = useMemo(() => {
    if (!tableTail?.calls?.length) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of tableTail.calls) {
      const k = normalizeCallKey(c);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(c);
    }
    return out;
  }, [tableTail?.calls]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const flowEdgeList: Edge[] = [];
    const edgeSet = new Set<string>();
    const visible: { id: string; role: NodeRole }[] = [];

    if (drillPath.length === 0) {
      if (programRootNode) {
        visible.push({ id: programRootNode.id, role: 'tail' });
        for (const n of independentNodes) {
          visible.push({ id: n.id, role: 'leaf' });
          flowEdgeList.push({
            id: `root->${n.id}`,
            source: programRootNode.id,
            target: n.id,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' },
            style: { stroke: '#9ca3af', strokeWidth: 1.5, strokeDasharray: '5 3' },
          });
        }
      } else {
        for (const id of entryIds) {
          visible.push({ id, role: 'entry' });
        }
      }
    } else {
      drillPath.forEach((id, i) => {
        visible.push({ id, role: i === drillPath.length - 1 ? 'tail' : 'spine' });
      });

      for (const callee of tailCallees) {
        visible.push({ id: callee.id, role: 'leaf' });
      }

      for (let i = 0; i < drillPath.length - 1; i++) {
        flowEdgeList.push({
          id: `${drillPath[i]}->${drillPath[i + 1]}`,
          source: drillPath[i],
          target: drillPath[i + 1],
          markerEnd: { type: MarkerType.ArrowClosed, color: BRAND },
          style: { stroke: BRAND, strokeWidth: 2.5 },
        });
      }

      const tailId = drillPath[drillPath.length - 1];
      for (const callee of tailCallees) {
        const edgeId = `${tailId}->${callee.id}`;
        if (edgeSet.has(edgeId)) continue;
        edgeSet.add(edgeId);
        flowEdgeList.push({
          id: edgeId,
          source: tailId,
          target: callee.id,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' },
          style: { stroke: '#9ca3af', strokeWidth: 1.5, strokeDasharray: '5 3' },
        });
      }
    }

    const flowNodeList: Node[] = visible.flatMap(({ id, role }) => {
      const programNode = nodeById.get(id);
      if (!programNode) return [];
      return [{ id, type: 'flowNode', data: { programNode, role }, position: { x: 0, y: 0 } } as Node];
    });

    const { nodes: laid, edges: laidEdges } = getLayoutedElements(flowNodeList, flowEdgeList, 'LR');
    setFlowNodes(laid);
    setFlowEdges(laidEdges);
  }, [drillPath, tailCallees, entryIds, nodeById, setFlowNodes, setFlowEdges, programRootNode, independentNodes]);

  useEffect(() => {
    if (flowNodes.length > 0) {
      setTimeout(() => fitView({ duration: 400, padding: 0.25 }), 80);
    }
  }, [flowNodes, fitView]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const programNode = (node.data as { programNode: ProgramFlowNode }).programNode;
      const id = programNode.id;
      setSelectedNode(programNode);
      setIsPanelOpen(true);

      const pathIdx = drillPath.indexOf(id);
      if (pathIdx >= 0) {
        setDrillPath(drillPath.slice(0, pathIdx + 1));
      } else {
        setDrillPath((prev) => [...prev, id]);
      }
    },
    [drillPath]
  );

  const resetToOverview = useCallback(() => {
    setDrillPath([]);
    setSelectedNode(null);
  }, []);

  const program = (metadata.program as string) || 'Program';

  const breadcrumb = useMemo(
    () =>
      drillPath.map((id) => {
        const n = nodeById.get(id);
        return { id, label: n?.metadata?.analysis?.title ?? n?.name ?? id };
      }),
    [drillPath, nodeById]
  );

  return (
    <div className="flex h-full flex-col bg-gray-50/80 font-sans text-gray-900">
      {/* Header */}
      <div
        className="shrink-0 border-b border-orange-100 px-6 py-4 shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #fff 0%, #fffbf7 50%, #fff7ed 100%)',
          borderBottomColor: 'rgba(251, 133, 30, 0.15)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
                boxShadow: '0 4px 14px rgba(251, 133, 30, 0.35)',
              }}
            >
              <GitBranch className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                Program Flow <span className="font-semibold text-orange-600">— {program}</span>
              </h1>
              <p className="mt-0.5 text-sm text-gray-500">
                {viewMode === 'table'
                  ? 'Start from an entry point, then follow the call chain in the table.'
                  : drillPath.length === 0
                    ? programRootNode
                      ? `${programRootNode.name} is the program entry point. Click any dashed node to explore its call chain.`
                      : 'Click any entry point to start exploring its call chain step by step.'
                    : 'Click a dashed child node to go deeper, or a visited node to step back.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('chart')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'chart' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Chart view"
              >
                <LayoutGrid className="h-4 w-4" />
                Chart
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Table view"
              >
                <List className="h-4 w-4" />
                Table
              </button>
            </div>
            {drillPath.length > 0 && viewMode === 'chart' && (
              <button
                type="button"
                onClick={() => setDrillPath((p) => p.slice(0, -1))}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                title="Go back one step"
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={resetToOverview}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
              title="Reset to entry points overview"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        {viewMode === 'chart' && breadcrumb.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-orange-100 pt-3">
            <button
              type="button"
              onClick={resetToOverview}
              className="rounded px-2 py-0.5 text-xs font-medium text-gray-400 hover:text-orange-600 transition-colors"
            >
              Overview
            </button>
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                <button
                  type="button"
                  onClick={() => setDrillPath(drillPath.slice(0, i + 1))}
                  className={`max-w-[180px] truncate rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                    i === breadcrumb.length - 1
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-orange-600'
                  }`}
                  title={crumb.label}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
            {tailCallees.length > 0 && (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-200" />
                <span className="rounded px-2 py-0.5 text-xs text-gray-300">
                  {tailCallees.length} child{tailCallees.length !== 1 ? 'ren' : ''} available
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 gap-4 p-4">
        {viewMode === 'chart' ? (
          <div className="min-h-[420px] flex-1 rounded-xl border border-gray-200 bg-white shadow-sm">
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.25, duration: 400 }}
              minZoom={0.1}
              maxZoom={2}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              nodesDraggable={false}
              panOnDrag={false}
              preventScrolling={false}
            >
              <Background color="#f1f5f9" gap={16} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto">
            {/* Entry Points */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <PlayCircle className="h-3.5 w-3 text-orange-500" />
                  Entry points — start here
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search entry points..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="w-full max-w-xs rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
              <div className="p-4">
                <ul className="flex flex-wrap gap-2">
                  {tableFilteredEntryPoints.map((node) => {
                    const isSelected = tablePath[0]?.id === node.id;
                    return (
                      <li key={node.id}>
                        <button
                          type="button"
                          onClick={() => setTablePath([node])}
                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-150 ${
                            isSelected
                              ? 'border-orange-300 bg-orange-50 text-orange-700 ring-1 ring-orange-200'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700'
                          }`}
                        >
                          <span>{node.metadata?.analysis?.title ?? node.name}</span>
                          {isSelected && <ChevronRight className="h-4 w-4 text-orange-500" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {tablePath.length > 0 && (
              <>
                {/* Call flow breadcrumb */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-2.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <PlayCircle className="h-3.5 w-3 text-orange-500" />
                      Call flow
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 p-4">
                    {tablePath.map((node, i) => (
                      <React.Fragment key={node.id}>
                        {i > 0 && (
                          <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" aria-hidden strokeWidth={2} />
                        )}
                        <button
                          type="button"
                          onClick={() => setTablePath(tablePath.slice(0, i + 1))}
                          className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                            i === tablePath.length - 1
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-700'
                          }`}
                          style={i === tablePath.length - 1 ? { boxShadow: '0 2px 10px rgba(251, 133, 30, 0.35)' } : undefined}
                          title={node.name}
                        >
                          {node.metadata?.analysis?.title ?? node.name}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Calls list */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <GitBranch className="h-4 w-4 text-orange-500" />
                      Calls from{' '}
                      <span className="font-semibold text-gray-900">
                        {tableTail!.metadata?.analysis?.title ?? tableTail!.name}
                      </span>
                    </p>
                  </div>
                  <div className="p-4">
                    {tableUniqueCalls.length === 0 ? (
                      <p className="rounded-lg bg-gray-50 py-6 text-center text-sm text-gray-500">
                        No calls from this node
                      </p>
                    ) : (
                      <ul className="flex flex-wrap gap-2">
                        {tableUniqueCalls.map((call) => {
                          const calleeNode = resolveCall(call);
                          const isInPath = calleeNode && tablePath.some((p) => p.id === calleeNode.id);
                          const label =
                            calleeNode?.metadata?.analysis?.title ??
                            calleeNode?.name ??
                            callToDisplayName(call);
                          return (
                            <li key={call}>
                              <button
                                type="button"
                                onClick={() => calleeNode && setTablePath((prev) => [...prev, calleeNode])}
                                disabled={!calleeNode}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-150 ${
                                  calleeNode
                                    ? isInPath
                                      ? 'border-orange-300 bg-orange-50 text-orange-700 ring-1 ring-orange-200'
                                      : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700'
                                    : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400'
                                }`}
                              >
                                {label}
                                {calleeNode && <ChevronRight className="h-4 w-4 opacity-60" />}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Detail panel — sliding drawer */}
        {(() => {
          const panelNode = viewMode === 'chart' ? selectedNode : tableTail;
          return (
            <div className="flex shrink-0 items-stretch">
              <button
                type="button"
                onClick={() => setIsPanelOpen((o) => !o)}
                title={isPanelOpen ? 'Collapse detail panel' : 'Expand detail panel'}
                className="flex w-5 shrink-0 flex-col items-center justify-center gap-1 rounded-l-xl border border-r-0 border-gray-200 bg-white transition-colors hover:border-orange-200 hover:bg-orange-50"
                style={{ boxShadow: '-2px 0 8px rgba(0,0,0,0.04)' }}
              >
                {isPanelOpen ? (
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <ChevronLeft className="h-3.5 w-3.5 text-gray-400" />
                )}
              </button>

              <div
                className="overflow-hidden"
                style={{
                  width: isPanelOpen ? 380 : 0,
                  transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  flexShrink: 0,
                }}
              >
                <div className="flex h-full w-[380px] flex-col rounded-r-xl border border-l-0 border-gray-200 bg-white shadow-sm">
                  <div
                    className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3"
                    style={{ background: 'linear-gradient(180deg, #fff 0%, #fffbf7 100%)' }}
                  >
                    <h2 className="min-w-0 truncate text-base font-bold text-gray-900">
                      {panelNode ? panelNode.name : ''}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsPanelOpen(false)}
                      className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                      aria-label="Close panel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto px-4 pb-6 pt-4">
                    {panelNode?.metadata?.analysis ? (
                      <DetailPanel analysis={panelNode.metadata.analysis} />
                    ) : (
                      <p className="rounded-lg bg-gray-50 py-8 text-center text-sm text-gray-500">
                        {panelNode
                          ? 'No analysis metadata for this node'
                          : 'Click a node to see its details'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function DetailPanel({ analysis }: { analysis: NodeAnalysis }) {
  const sections: { key: keyof NodeAnalysis; title: string; icon: React.ReactNode }[] = [
    { key: 'title', title: 'Title', icon: <FileCode className="h-4 w-4" /> },
    { key: 'description', title: 'Description', icon: <BookOpen className="h-4 w-4" /> },
    { key: 'key_logic', title: 'Key logic', icon: <Zap className="h-4 w-4" /> },
    { key: 'business_rules', title: 'Business rules', icon: <Layers className="h-4 w-4" /> },
    { key: 'validations', title: 'Validations', icon: <Shield className="h-4 w-4" /> },
    { key: 'data_entities', title: 'Data entities', icon: <Database className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {sections.map(({ key, title, icon }) => {
        const value = analysis[key];
        if (value == null || (Array.isArray(value) && value.length === 0)) return null;
        const isArray = Array.isArray(value);
        const content = isArray ? value : (value as string);
        return (
          <section
            key={key}
            className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:border-orange-100 hover:bg-orange-50/30"
          >
            <h3 className="mb-3 flex items-center gap-2.5 text-sm font-semibold text-gray-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                {icon}
              </span>
              {title}
            </h3>
            {isArray ? (
              <ul className="space-y-2 text-sm text-gray-600">
                {(content as string[]).map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-2 before:mt-1.5 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-orange-400 before:content-['']"
                  >
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="leading-relaxed text-gray-600">{String(content)}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

const ProgramFlowView: React.FC<ProgramFlowViewProps> = (props) => (
  <ReactFlowProvider>
    <ProgramFlowViewInner {...props} />
  </ReactFlowProvider>
);

export default ProgramFlowView;
