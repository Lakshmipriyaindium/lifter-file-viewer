// customization-types.ts - TypeScript definitions for Client Customizations

export interface Customization {
  customization_id: string;
  type: string;
  chain_identifier: string;
  chain_name: string;
  line_start: number;
  line_end: number;
  condition_code: string;
  customization_code: string;
  purpose: string | null;
  business_rule: string | null;
  confidence_score: number;
  complexity_level: string;
  requires_review: boolean;
}

export interface BusinessRule {
  rule_name: string;
  business_rule_statement: string;
  business_justification: string;
  implementation_logic: string;
  business_impact: string;
  data_elements: string[];
  rule_category: string;
  priority: string;
  node_id?: string;
  node_name?: string;
  file_path?: string;
}

export interface LLMAnalysis {
  client_id: string;
  client_name: string;
  business_rules: BusinessRule[];
  customization_patterns: string[];
  risk_assessment: string;
  maintenance_complexity: string;
}

export interface CustomizationNode {
  node_id: string;
  node_name: string;
  file_path: string;
  customizations: Customization[];
  llm_analysis: LLMAnalysis;
}

export interface ClientCustomizationData {
  client_id: string;
  total_customizations: number;
  customizations: CustomizationNode[];
  business_rules?: BusinessRule[];
}

export interface FilterState {
  complexity: string;
  priority: string;
  category: string;
  riskLevel: string;
  requiresReview: string;
  searchTerm?: string;
  fileFilter?: string;
  chainFilter?: string;
  confidenceMin?: number;
}


export type SortField = 
  | 'rule_name' 
  | 'priority' 
  | 'category' 
  | 'node_name'
  | 'complexity_level'
  | 'confidence_score'
  | 'node_name'
  | 'total_customizations'
  | 'overall_risk'
  | 'average_confidence'
  | 'chains_count'
  | 'none';

export type SortDirection = 'asc' | 'desc';

export interface CustomizationStats {
  totalCustomizations: number;
  highPriorityRules: number;
  requiresReview: number;
  uniqueFiles: number;
  averageConfidence: number;
  complexityBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  riskLevel: string;
}

// node-analysis-types.ts - TypeScript definitions for Node-Based Customization Analysis

export interface DetectedCustomization {
  customization_id: string;
  type: string;
  chain_identifier: string;
  chain_name: string;
  line_start: number;
  line_end: number;
  condition_code: string;
  customization_code: string;
  purpose: string | null;
  business_rule: string | null;
  confidence_score: number;
  complexity_level: string;
  requires_review: boolean;
}

export interface PatternAnalysis {
  total_customizations: number;
  by_chain: Record<string, number>;
  by_type: Record<string, number>;
  average_confidence: number;
  complexity_distribution: Record<string, number>;
  chains_with_most_customizations: Array<[string, unknown[]]>;
  requires_review_count: number;
}

export interface BusinessRule {
  rule_name: string;
  business_rule_statement: string;
  business_justification: string;
  implementation_logic: string;
  business_impact: string;
  data_elements: string[];
  rule_category: string;
  priority: string;
}

export interface ClientLLMAnalysis {
  client_id: string;
  client_name: string;
  business_rules: BusinessRule[];
  customization_patterns: string[];
  risk_assessment: string;
  maintenance_complexity: string;
}

export interface CustomizationNode {
  node_id: string;
  node_name: string;
  file_path: string;
  detected_customizations: DetectedCustomization[];
  pattern_analysis: PatternAnalysis;
  customization_summary: string;
  llm_analyses_by_client: Record<string, ClientLLMAnalysis>;
  total_customizations: number;
  high_confidence_customizations: number;
  chains_involved: string[];
  customization_types: string[];
  overall_risk: string;
  maintenance_complexity: string;
  analysis_timestamp: string;
  analyzer_version: string;
}

export interface ClientCustomizationNodeAnalysisData {
  [nodeId: string]: CustomizationNode;
}





export interface AggregatedStats {
  totalNodes: number;
  totalCustomizations: number;
  totalBusinessRules: number;
  highConfidenceCount: number;
  requiresReviewCount: number;
  averageConfidence: number;
  uniqueChains: Set<string>;
  riskDistribution: Record<string, number>;
  complexityDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  chainDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
}