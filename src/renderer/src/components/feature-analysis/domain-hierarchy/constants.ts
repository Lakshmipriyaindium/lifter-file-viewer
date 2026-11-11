import { MarkerType } from 'reactflow';
import { TreeNodeType, ViewType } from './types';

export const COLORS = [
  '#ef4444', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899',
  '#3b82f6', '#10b981', '#14b8a6', '#84cc16', '#6366f1', '#f43f5e',
  '#0ea5e9', '#22c55e', '#a855f7'
];

export const VIEW_OPTIONS: ReadonlyArray<{ value: ViewType; label: string }> = [
  { value: 'hierarchy', label: 'Hierarchy View' },
  { value: 'tile', label: 'Tile View' },
  { value: 'tree', label: 'Tree View' }
];

// Root node constants
export const ROOT_NODE_ID = 'root-domain-hierarchy';
export const ROOT_NODE_NAME = 'Domain Hierarchy';
export const ROOT_NODE_DESCRIPTION =
  'Top-level capability and domain architecture model containing all enterprise functional domains, capabilities, and features.';

// Tree node layout & styling constants
export const TREE_ROOT_WIDTH = 200;
export const TREE_NODE_WIDTH = 260;
export const TREE_NODE_HEIGHT = 48;

export const TREE_EDGE_STYLE = {
  stroke: '#94a3b8',
  strokeWidth: 1.75,
  strokeDasharray: '4 4'
} as const;

export const TREE_EDGE_MARKER = {
  type: MarkerType.ArrowClosed,
  width: 12,
  height: 12,
  color: '#64748b'
} as const;

export const DAGRE_GRAPH_CONFIG = {
  rankdir: 'LR',
  nodesep: 28,
  ranksep: 90,
  marginx: 40,
  marginy: 40
} as const;

export const TREE_FLOW_CONFIG = {
  minZoom: 0.2,
  maxZoom: 2,
  fitPadding: 0.25,
  sidebarFitPadding: 0.2,
  fitDuration: 300,
  dotGap: 24,
  dotSize: 1.2,
  dotColor: '#cbd5e1'
} as const;

export const TREE_NODE_STYLES: Record<
  Exclude<TreeNodeType, 'root'>,
  { iconColor: string; selectedClass: string }
> = {
  l1: {
    iconColor: 'text-orange-500',
    selectedClass: 'ring-2 ring-orange-500 border-orange-400 bg-orange-50/40 shadow-md'
  },
  l2: {
    iconColor: 'text-blue-500',
    selectedClass: 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/40 shadow-md'
  },
  l3: {
    iconColor: 'text-slate-500',
    selectedClass: 'ring-2 ring-orange-500 border-orange-400 bg-orange-50/40 shadow-md'
  }
};

export const TREE_NODE_TYPE_META: Record<TreeNodeType, { label: string; color: string }> = {
  root: { label: 'Root Model', color: 'bg-orange-100 text-orange-700' },
  l1: { label: 'L1 Domain', color: 'bg-slate-100 text-slate-700' },
  l2: { label: 'L2 Capability', color: 'bg-blue-100 text-blue-700' },
  l3: { label: 'L3 Feature', color: 'bg-orange-100 text-orange-700' }
};

// Treemap constants
export const TREEMAP_CONFIG = {
  aspectRatio: 1.5,
  exportOptions: {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: '#ffffff'
  }
} as const;

export const TREEMAP_THRESHOLDS = {
  showName: { width: 60, height: 30 },
  showBasicMetrics: { width: 100, height: 60 },
  showDetailedMetrics: { width: 150, height: 100 },
  showDrillBadge: { width: 100, height: 80 }
} as const;
