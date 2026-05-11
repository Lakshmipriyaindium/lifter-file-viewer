import * as d3 from 'd3';

export interface NodeData {
  id: string;
  name: string;
  type: string;
  language: string;
  module_name?: string;
  score: number;
  module?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface LinkData {
  source: string;
  target: string;
  type: string;
  value: number;
  score: number;
}

export interface ExtendedNodeData extends NodeData, d3.SimulationNodeDatum {
  file?: string;
  file_path?: string;
  group?: number;
  size?: number;
  lines?: number;
  calls_count?: number;
  called_by_count?: number;
  depth?: number;
  centrality?: number;
  complexity?: number;
}

// For links, we need to handle the D3 simulation requirements
export interface ExtendedLinkData extends Omit<LinkData, 'source' | 'target'>, d3.SimulationLinkDatum<ExtendedNodeData> {
  weight?: number;
}

// Extended GraphData with additional metadata
export interface ExtendedGraphData {
  nodes: ExtendedNodeData[];
  links: ExtendedLinkData[];
  metadata?: {
    total_procedures: number;
    total_calls: number;
    files_analyzed: number;
    procedure_types: Record<string, number>;
  };
  statistics?: {
    avg_complexity: number;
    avg_centrality: number;
    max_depth: number;
    total_lines: number;
    connectivity: number;
  };
}

export interface FlowData {
  id: number;
  name: string;
  startNode: ExtendedNodeData;
  nodes: ExtendedNodeData[];
  links: ExtendedLinkData[];
  created: string;
}
