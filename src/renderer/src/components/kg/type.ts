// Knowledge Graph Type Definitions for LIFTER

import {
  Node,
  Edge,
  NodeProps,
} from 'reactflow';

export type EntityType = string;
export type RelationshipType = string;

export type CloudReadinessLevel = 'high' | 'medium' | 'low' | 'not_assessed';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type Priority = 'high' | 'medium' | 'low';

export interface NodeMetadata {
  filePath?: string;
  linesOfCode?: number;
  lastModified?: string;
  owner?: string;
  language?: string;
  framework?: string;
  description?: string;
  cloudReadiness?: CloudReadinessLevel;
  technicalDebt?: number;
  securityScore?: number;
  complexity?: number;
  riskLevel?: RiskLevel;
  migrationPriority?: Priority;
  businessImpact?: string;
  tableCount?: number;
  apiEndpoints?: number;
  documentType?: string;
  applicationName?: string;
  applicationType?: string;
  source_name?: string;
  analysis?: {
    confidence_score?: number;
    classifications?: string[];
  };
  createdAt?: string;
  totalNodes?: number;
  totalEdges?: number;
  totalLinks?: number;
  languages?: string[];
  nodesByType?: { [key in EntityType]?: number };
  edgesByType?: { [key: string]: number };
  linksByType?: { [key: string]: number };
  filesAnalyzed?: number;
  analysisTime?: number;
}

export interface GraphNode {
  id: string;
  label?: string;
  type: EntityType;
  metadata: NodeMetadata;
  group?: string;
  importance?: number;
  name?: string;
  filePath?: string;
  calls?: string[];
  calledBy?: string[];
  dependencies?: string[];
  summary?: string | null;
  classifications?: string[];
  complexityScore?: number;
  isEntryPoint?: boolean;
  businessRules?: string[];
  integrations?: string[];
  dataEntities?: string[];
}

export interface GraphLink {
  source: string;
  target: string;
  type: RelationshipType;
  strength?: number;
  bidirectional?: boolean;
  description?: string;
  weight?: number;
  metadata?: {
    description?: string;
  };
}

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

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  name?: string;
  metadata: NodeMetadata;
  entryPoints?: string[];
  metrics?: GraphMetrics;
}

export interface FilterState {
  entityTypes: Set<EntityType>;
  relationshipTypes: Set<RelationshipType>;
  searchQuery: string;
  cloudReadiness: Set<CloudReadinessLevel>;
  riskLevel: Set<RiskLevel>;
  showOnlyConnectedTo?: string;
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

export interface CustomNodeProps extends NodeProps {
  data: CustomNodeData;
}

export interface GraphFilters {
  entityTypes?: Set<string>;
  searchQuery?: string;
  focusNodeId?: string;
  hideIsolatedNodes?: boolean;
  relationshipTypes?: Set<RelationshipType>;
}

export interface ConnectedNodesResult {
  connectedNodeIds: Set<string>;
  connectedEdgeIds: Set<string>;
}

export interface LayoutedElements {
  nodes: Node[];
  edges: Edge[];
}

export interface KnowledgeGraphVisualizationProps {
  data?: GraphData;
}
