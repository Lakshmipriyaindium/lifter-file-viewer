// Knowledge Graph Type Definitions for LIFTER

import {
  Node,
  Edge,
  NodeProps,
} from 'reactflow';

export type CloudReadinessLevel = 'high' | 'medium' | 'low' | 'not_assessed';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type Priority = 'high' | 'medium' | 'low';

// Update NodeMetadata interface
export interface NodeMetadata {
  filePath?: string;
  linesOfCode?: number;
  lastModified?: string;
  owner?: string;
  language?: string;
  framework?: string;
  description?: string;
  cloudReadiness?: CloudReadinessLevel;
  technicalDebt?: number; // 0-100 score
  securityScore?: number; // 0-100 score
  complexity?: number; // cyclomatic complexity
  riskLevel?: RiskLevel;
  migrationPriority?: Priority;
  businessImpact?: string;
  tableCount?: number; // for database nodes
  apiEndpoints?: number; // for API nodes
  documentType?: string; // for document nodes
  applicationName?: string; // application/system name
  applicationType?: string; // e.g., 'frontend', 'backend', 'api-gateway', 'database', 'documentation'
  source_name?: string; // source of the data (e.g., 'GitHub', 'Jira', 'Confluence')
  analysis?: {
    confidence_score?: number;
    classifications?: string[];
  };
  createdAt?: string;
  totalNodes?: number;
  totalEdges?: number;
  totalLinks?: number;
  languages?: string[];
  nodesByType?: { [key in string]?: number };
  edgesByType?: { [key: string]: number };
  linksByType?: { [key: string]: number };
  filesAnalyzed?: number;
  analysisTime?: number;
}

// Update GraphNode interface
export interface GraphNode {
  id: string;
  label?: string;
  type: string;
  metadata: NodeMetadata;
  group?: string; // module/package grouping
  importance?: number; // for node sizing (0-1)
  name?: string; // display name
  filePath?: string; // for display
  calls?: string[]; // function calls
  calledBy?: string[]; // called by these nodes
  dependencies?: string[]; // dependency relationships
  summary?: string | null; // node summary
  classifications?: string[]; // classification tags
  complexityScore?: number; // complexity metric
  isEntryPoint?: boolean; // is this an entry point
  businessRules?: string[]; // associated business rules
  integrations?: string[]; // integration points
  dataEntities?: string[]; // data entities used
}

// Update GraphLink interface
export interface GraphLink {
  source: string;
  target: string;
  type: string;
  strength?: number; // 0-1 for edge thickness
  bidirectional?: boolean;
  description?: string;
  weight?: number; // for layout algorithms
  metadata?: {
    description?: string;
  };
}

// Add GraphMetrics interface
export interface GraphMetrics {
  totalNodes: number;
  totalEdges: number;
  density: number;
  isDAG: boolean;
  numberOfCycles: number;
  stronglyConnectedComponents: number;
  entryPoints: number;
  leafNodes: number;
  rootNodes: number;
  mostCalled: string[];
  mostCalling: string[];
}

// Update GraphData interface
export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  name?: string; // graph name
  metadata: NodeMetadata;
  entryPoints?: string[]; // entry point node IDs
  metrics?: GraphMetrics; // graph analysis metrics
}

export interface FilterState {
  entityTypes: Set<string>;
  relationshipTypes: Set<string>;
  searchQuery: string;
  cloudReadiness: Set<CloudReadinessLevel>;
  riskLevel: Set<RiskLevel>;
  showOnlyConnectedTo?: string; // node id for impact analysis
}

export interface LayoutType {
  id: string;
  name: string;
  description: string;
}

export interface ClusterGroup {
  id: string;
  name: string;
  nodeIds: string[];
  color: string;
  collapsed: boolean;
}

// Interface for Custom Node Data
export interface CustomNodeData {
  id: string;
  name?: string;
  type: string;
  metadata?: {
    description?: string;
    source_name?: string;
    analysis?: {
      confidence_score?: number;
      classifications?: string[];
    };
  };
  filePath?: string;
  color?: string;
}

// Interface for Custom Node Props
export interface CustomNodeProps extends NodeProps {
  data: CustomNodeData;
}

// Interface for Graph Filters
export interface GraphFilters {
  entityTypes?: Set<string>;
  searchQuery?: string;
  focusNodeId?: string;
  hideIsolatedNodes?: boolean;
  relationshipTypes?: Set<string>;
}

// Interface for Connected Nodes Result
export interface ConnectedNodesResult {
  connectedNodeIds: Set<string>;
  connectedEdgeIds: Set<string>;
}

// Interface for Layouted Elements
export interface LayoutedElements {
  nodes: Node[];
  edges: Edge[];
}

export interface KnowledgeGraphVisualizationProps {
  data?: GraphData;
}