export interface ProgramReference {
  programName: string;
  programTitle?: string;
  programSummary?: string;
  lineNumber?: number;
  businessReason?: string;
  businessValue?: string;
  businessLogic?: string;
  conditionContext?: string;
  controlFlow?: string;
  loopContext?: string;
  contextText?: string;
  isAlias?: boolean;
}


//change according to the json o/p
export interface ReferenceDocument {
  document_id: string | number;
  relationship ?: string;
  reason? : string;
  confidence : number ;
  // type: 'confluence' | 'sharepoint' | 'jira' | 'external' | 'file';
  // fileType?: 'pdf' | 'docx' | 'txt'; // Optional, for file types
}
export interface UserStory {
  story_id: string;
  title: string;
  epic: string;
  as_a: string;
  i_want: string;
  so_that: string;
  narrative: string;
  acceptance_criteria: string[];
  background?: string | null; // Made optional for backward compatibility
  assumptions: string[];
  related_features: string[];
  related_business_rules: string[];
  related_flows: string[];
  implementation_notes?: string | null;
  technical_requirements: string[];
  data_inputs: string[];
  data_outputs: string[];
  test_scenarios: string[];
  story_points: number;
  complexity: 'simple' | 'medium' | 'complex';
  priority: 'low' | 'medium' | 'high' | 'critical';
  depends_on: string[];
  blocks: string[];
  status: 'draft' | 'ready' | 'in-progress' | 'done' | 'blocked';
  sprint?: string | null;
  created_date: string;
  tags: string[];
  // New optional client customization fields
  has_client_customizations?: boolean;
  affected_clients?: string[];
  client_specific_requirements?: string[];
  customization_type?: string;
  citations?: Citation[];
  reference_documents?: ReferenceDocument[];
}

// Extended interface for new schema with additional fields
export interface ExtendedUserStory extends UserStory {
  // Additional metadata fields from new schema
  total_count?: number;
  timestamp?: string;
  codebase_path?: string;
  language?: string;
}

// Interface for the new schema wrapper
export interface UserStoryResponse {
  stories?: ExtendedUserStory[]; // New schema format
  user_stories?: UserStory[]; // Alternative format
  feature_groups?: FeatureGroupsResponse; // Feature groups format
  total_count?: number;
  timestamp?: string;
  codebase_path?: string;
  language?: string;
}

export interface UserStoryViewerProps {
  projectId?: string;
  artifactId?: string;
  stories?: UserStory[]; // For backward compatibility (old schema)
  data?: UserStoryResponse; // For new schema
  featureGroups?: FeatureGroupsResponse; // For feature groups format
  metadata?: {
    total_count?: number;
    timestamp?: string;
    codebase_path?: string;
    language?: string;
  };
}

export interface Filters {
  status: string[];
  priority: string[];
  complexity: string[];
  epic: string[];
  tags: string[];
}

export interface ItemRemarks {
  thumbsUp: boolean | null;
  quality: 'excellent' | 'good' | 'average' | 'needs-improvement' | '';
  remarks: string;
  businessContext: string;
  storyPoints?: number;
  complexity?: 'simple' | 'medium' | 'complex';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  isFunctional?: boolean;
  feedbackId?: number;
}

// New interface for feature group format
export interface FeatureGroupStory {
  title: string;
  as_a: string;
  i_want: string;
  so_that: string;
  acceptance_criteria: string[];
  business_rules_applied: string[];
  technical_notes: string[];
  priority: string;
  effort_estimate: string;
  story_id: string;
}

// Interface for the feature groups response format
export interface FeatureGroupsResponse {
  [key: string]: FeatureGroupStory;
}


export interface Metadata {
  codebase_path: string;
  language: string;
  timestamp: string;
  use_llm: boolean;
  analysis_time: string;
}

export interface Summary {
  total_nodes: number;
  total_edges: number;
  total_flows: number;
  total_features: number;
  total_business_rules: number;
  total_user_stories: number;
  languages: string[];
}

export interface GraphMetrics {
  total_nodes: number;
  total_edges: number;
  density: number;
  is_dag: boolean;
  number_of_cycles: number;
  strongly_connected_components: number;
  entry_points: number;
  leaf_nodes: number;
  root_nodes: number;
  most_called: Array<[string, number]>;
  most_calling: Array<[string, number]>;
}

export interface FlowStep {
  step_id: string;
  step_number?: number;
  node_id: string;
  node_name: string;
  node_type: string;
  action: string;
  description: string;
  input_data: string[];
  output_data: string[];
  business_rules: string[];
  // New optional fields
  inputs?: string[];
  outputs?: string[];
  conditions?: string[];
  error_conditions?: string[];
  performance_notes?: string[];
  side_effects?: string[];
}

export interface Flow {
  flow_id: string;
  flow_name: string;
  flow_type: string;
  entry_point: string;
  exit_points: string[];
  total_steps: number;
  steps: FlowStep[];
  description: string;
  purpose: string;
  business_rules_applied: string[];
  complexity_score: number;
  has_error_handling: boolean;
  has_transaction_management: boolean;
  is_idempotent: boolean;
  is_async: boolean;
  // New optional fields
  critical_path?: string[];
  alternate_paths?: string[][];
  preconditions?: string[];
  postconditions?: string[];
  input_data?: string[];
  output_data?: string[];
  data_transformations?: string[];
  business_process?: string | null;
  user_roles?: string[];
  external_systems?: string[];
  api_calls_made?: string[];
  database_operations?: string[];
  integration_points?: string[];
  error_handling_points?: string[];
  estimated_execution_time?: number | null;
  performance_indicators?: string[];
}

export interface NodeAnalysis {
  node_id: string;
  node_name: string;
  title: string;
  summary: string;
  architecture_layers: string[];
  primary_layer: string;
  complexity_score: number;
  lines_of_code: number;
  business_rules: string[];
  has_error_handling: boolean;
  data_entities: string[];
}
export interface ThresholdValue {
  value: number;
  limit: number;
  unit?: string; 
  is_exceeded: boolean;
}
export interface BusinessRule {
  rule: string;
  source: string;
  scope: string;
  confidence: string;
  node_id?: string;
  node_name?: string;
  // New optional fields from enhanced BusinessRule interface
  rule_id: string;
  name: string;
  category?: string;
  description?: string;
  statement?: string;
  conditions?: string[];
  actions?: string[];
  exceptions?: string[];
  applies_to?: string[];
  triggered_by?: string[];
  implemented_in?: string[];
  implementation_details?: string;
  data_elements?: string[];
  calculations?: string[];
  thresholds?: Record<string, ThresholdValue>;
  compliance_requirement?: string | null;
  regulatory_reference?: string | null;
  priority?: string;
  is_mandatory?: boolean;
  test_scenarios?: string[];
  validation_criteria?: string[];
  source_features?: string[];
  source_flows?: string[];
  used_in_stories?: string[];
}

export interface NodeLevelRule {
  node_id: string;
  node_name: string;
  node_type: string;
  rules: string[];
  context: string;
}

export interface RuleCategory {
  validation: BusinessRule[];
  authorization: BusinessRule[];
  business_logic: BusinessRule[];
  data_integrity: BusinessRule[];
  workflow: BusinessRule[];
  integration: BusinessRule[];
  other: BusinessRule[];
}

export interface RuleComplexity {
  total_rules: number;
  multi_node_rules: number;
  high_confidence_rules: number;
  rule_categories: number;
  complexity_score: number;
}

export interface FlowBusinessRules {
  flow_id: string;
  flow_name: string;
  node_level_rules: NodeLevelRule[];
  flow_level_rules: BusinessRule[];
  cross_node_rules: BusinessRule[];
  synthesized_rules: BusinessRule[];
  rule_categories: RuleCategory;
  rule_complexity: RuleComplexity;
}



export interface Feature {
  feature_id: string;
  name: string;
  category: string;
  title: string;
  description: string;
  business_value: string;
  related_flows: string[];
  related_nodes: string[];
  capabilities: string[];
  user_actions: string[];
  system_actions: string[];
  data_inputs: string[];
  data_outputs: string[];
  data_entities_used: string[];
  business_rules: string[];
  validations: string[];
  technologies_used: string[];
  integration_points: string[];
  user_roles: string[];
  priority: string;
  complexity: string;
  status: string;
  // New optional fields
  citations?: Citation[];
  constraints?: string[];
  implementation_patterns?: string[];
  user_interface_elements?: string[];
  user_experience_notes?: string | null;
  flow_group_id?: string;
  flow_group_name?: string;
  business_rule_ids?: string[];
  user_story_ids?: string[];
  related_documents?: ReferenceDocument[];
  client_specific_requirements?: string[];
}

export interface FeatureAnalysisData {
  metadata: Metadata;
  summary: Summary;
  graph_metrics: GraphMetrics;
  flows: Flow[];
  node_analyses: NodeAnalysis[];
  features: Feature[];
  user_stories: UserStory[];
  business_rules: FlowBusinessRules[];
}

// Additional interfaces for enhanced analysis data structure
export interface FlowGroup {
  group_id: string;
  flow_ids: string[];
  representative_flow_id: string;
  purpose: string;
  feature_id: string;
  flow_count: number;
}

export interface TraceabilityMap {
  flows_to_groups: Record<string, string>;
  groups_to_features: Record<string, string[]>;
  features_to_flows: Record<string, string[]>;
  features_to_stories: Record<string, string[]>;
  rules_to_features: Record<string, string[]>;
  stories_to_features: Record<string, string[]>;
  stories_to_flows: Record<string, string[]>;
  rules_to_stories: Record<string, string[]>;
  features_to_rules: Record<string, string[]>;
}

export interface ClientCustomizations {
  enabled: boolean;
  total_nodes_with_customizations: number;
  clients_affected: string[];
  flows_with_customizations: number;
  client_specific_business_rules: Record<string, number>;
  total_client_specific_rules: number;
  unknown_customizations: {
    total_unknown: number;
    by_type: Record<string, number>;
    message: string;
    review_location: string;
  };
}

export interface Metrics {
  graph_metrics: Record<string, number>;
  flow_coverage: number;
  quality_scores: Record<string, number>;
  pattern_count: number;
  flow_count: number;
  flow_group_count: number;
  feature_count: number;
  business_rule_count: number;
  story_count: number;
}

export interface TotalAnalysisData {
  codebase_path: string;
  language: string;
  timestamp: string;
  metrics: Metrics;
  discovered_patterns: unknown[];
  flows: Flow[];
  flow_groups: Record<string, FlowGroup>;
  features: Feature[];
  business_rules: BusinessRule[];
  user_stories: UserStory[];
  traceability_map: TraceabilityMap;
  reflection_history: unknown[]; 
  client_customizations: ClientCustomizations;
  workflow_info: {
    type: string;
    subgraphs_integrated: boolean;
    llm_available: boolean;
    autonomous_capabilities: string[];
    subgraph_nodes: string[];
  };
  visualization_paths: string[];
}


// Feature Analysis Types for LIFTER Data File Impact Visualization

export interface FileOperation {
  operation: 'OPEN' | 'READ' | 'READNEXT' | 'SELECT' | 'WRITE' | 'DELETE' | 'UPDATE' | string;
  line_number: number;
  context: string | {
    loop_context?: string;
    condition_context?: string;
    control_flow?: string;
    business_logic_summary?: string;
  };
  variable_reference?: string;
  business_reason?: string;
  business_value?: string;
}

export interface FieldAccess {
  field_number: string;
  field_name: string;
  line_number: number;
  context: string | {
    loop_context?: string;
    condition_context?: string;
    control_flow?: string;
    business_logic_summary?: string;
  };
  description: string;
  is_alias?: boolean;
  business_reason?: string;
  business_value?: string;
}

// New types for business functions structure
export interface COOperation {
  operation: string;
  business_reason: string;
  data_requirements: string;
}

export interface BusinessFunction {
  function_name: string;
  business_description: string;
  co_operations: COOperation[];
  business_rules: string[];
  modernization_notes: string;
}

export interface AccessLine {
  line_number: number;
  code_snippet: string;
  access_type: string;
  is_comment: boolean;
}

export interface FieldSummary {
  field_number: string;
  field_name: string;
  business_label: string;
  field_description: string;
  total_accesses: number;
  access_lines: AccessLine[];
  access_type_counts: Record<string, number>;
  business_processes: unknown[];
  business_rules: string[];
  program_meaning: string;
}

export interface FileAnalysis {
  file_name: string;
  program_summary?: string; // High-level summary of how this program uses the file
  description: string;
  file_operations: FileOperation[]; // Detailed technical operations (kept for backward compatibility)
  business_functions?: BusinessFunction[]; // New: Organized business functions that use this file
  fields_accessed: FieldAccess[];
  business_purpose: string;
  usage_patterns: string[];
  dependencies: string[];
  field_descriptions: Record<string, string>;
  field_summary?: {
    program_name: string;
    program_purpose: string;
    business_processes: unknown[];
    total_unique_fields: number;
    field_summaries: FieldSummary[];
    source_file: string;
    file_name: string;
    generated_at: string;
  };
}

export interface ProgramAnalysis {
  source_file: string;
  source_file_name: string;
  node_title?: string; // Optional for backward compatibility
  node_summary?: string; // Optional for backward compatibility
  node_description?: string; // Optional for backward compatibility
  node_business_rules?: string[]; // Optional for backward compatibility
  node_validations?: string[]; // Optional for backward compatibility
  node_line_start?: number; // Optional for backward compatibility
  node_line_end?: number; // Optional for backward compatibility
  file_analyses?: FileAnalysis[]; // Legacy field name
  analyses?: FileAnalysis[]; // New field name (matches JSON structure)
  metadata?: {
    analysis_start_timestamp?: string;
    analysis_end_timestamp?: string;
    file_operations_count?: number;
    fields_accessed_count?: number;
  };
}

export interface FocusedFeatureAnalysisData {
  metadata?: {
    number_of_files_analyzed?: number;
    total_file_operations_count?: number;
    total_fields_accessed_count?: number;
    analysis_start_timestamp?: string;
    analysis_end_timestamp?: string;
  };
  analyses: ProgramAnalysis[];
}

// Derived types for visualization
export interface OperationSummary {
  operation: string;
  count: number;
  programs: string[];
  color: string;
}

export interface ProgramSummary {
  name: string;
  title: string;
  operations: string[];
  fieldsAccessed: number;
  dependencies: string[];
  lineCount: number;
}

export interface FieldUsageSummary {
  fieldNumber: string;
  fieldName: string;
  count?: number;
  programs?: Set<string>;
  description?: string;
  usedBy: Array<{
    program: string;
    lineNumber: number;
    context: string | {
      loop_context?: string;
      condition_context?: string;
      control_flow?: string;
      business_logic_summary?: string;
    };
  }>;
}

export interface FocusedFieldUsageSummary {
  fieldNumber: string;
  fieldName: string;
  count?: number;
  programs?: Set<string>;
  description?: string;
  businessLabel?: string;
  businessRules?: string[];
  programMeaning?: string;
  totalAccesses?: number;
  usedBy: Array<{
    program: string;
    lineNumber: number;
    context: string | {
      loop_context?: string;
      condition_context?: string;
      control_flow?: string;
      business_logic_summary?: string;
    };
  }>;
}
export interface FieldSummary {
  fieldName: string;
  fieldNumber: string;
  programs: Set<string>;
  count: number;
  description?: string;
  usedBy?: Array<{
    program: string;
    lineNumber: number;
    context: string;
  }>;
}
export interface FieldUsageCard {
  fieldNumber: string;
  fieldName: string;
  count: number;
  programs: Set<string>;
  description?: string;
  usedBy?: Array<{
    program: string;
    lineNumber: number;
    context: string;
  }>;
}

// Operation color mapping
export const OPERATION_COLORS: Record<string, string> = {
  OPEN: '#fb851e',      // orange (primary)
  READ: '#3b82f6',      // blue
  READNEXT: '#8b5cf6',  // purple
  SELECT: '#f59e0b',    // amber
  WRITE: '#ef4444',     // red
  DELETE: '#dc2626',    // dark red
  UPDATE: '#06b6d4',    // cyan
  DEFAULT: '#6b7280',   // gray
};

export const getOperationColor = (operation: string): string => {
  return OPERATION_COLORS[operation.toUpperCase()] || OPERATION_COLORS.DEFAULT;
};

// Feature Extraction Types for LIFTER Feature Tree Visualization

export interface Citation {
  source_type: string;
  source_name: string;
  node_name: string;
  file_path: string;
  line_start: number;
  line_end: number;
  language: string;
  entity_name: string | null;
  entity_type: string | null;
  schema_name: string | null;
  database: string | null;
  document_name: string | null;
  document_path: string | null;
  document_type: string | null;
}

// Database operation types
export interface DatabaseOperation {
  operation: string;
  table: string;
  description: string;
}

// Functionality (leaf level)
export interface Functionality {
  functionality_id: string;
  parent_sub_feature_id: string;
  name: string;
  description: string;
  business_rule_count: number;
  database_operations: DatabaseOperation[];
  complexity_score: number;
  citations: Citation[];
}

// Sub-feature (mid level)
export interface SubFeature {
  sub_feature_id: string;
  parent_feature_id: string;
  name: string;
  description: string;
  root_node_id: string;
  boundary_score: number;
  functionalities: Functionality[];
  total_nodes: number;
  complexity_score: number;
  citations: Citation[];
  business_value: string;
  capabilities: string[];
  user_actions: string[];
  system_actions: string[];
  validations: string[];
  data_entities: string[];
  integration_points: string[];
  user_roles: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
}

// Feature metrics
export interface FeatureMetrics {
  total_nodes: number;
  owned_nodes: number;
  referenced_nodes: number;
  sub_features: number;
  functionalities: number;
  business_rules: number;
  max_depth: number;
  complexity_score: number;
}

// Domain Feature (top level)
export interface DomainFeature {
  feature_id: string;
  entry_point_id: string;
  entry_point_name: string;
  name: string;
  description: string;
  business_value: string;
  sub_features: SubFeature[];
  metrics: FeatureMetrics;
  business_rule_count: number;
  citations: Citation[];
  capabilities: string[];
  user_actions: string[];
  system_actions: string[];
  validations: string[];
  data_entities: string[];
  integration_points: string[];
  user_roles: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
}

// Shared utilities
export interface SharedUtilities {
  feature_id: string;
  name: string;
  description: string;
  total_shared_nodes: number;
  avg_reference_count: number;
}

// Feature tree summary
export interface FeatureTree {
  total_levels: number;
  total_features: number;
  total_sub_features: number;
  total_functionalities: number;
  has_shared_utilities: boolean;
  has_orphan_code: boolean;
  shared_utilities_count: number;
  orphan_code_count: number;
}

// Traceability maps
export interface TraceabilityMap {
  node_to_functionality: Record<string, string>;
  functionality_to_sub_feature: Record<string, string>;
  sub_feature_to_feature: Record<string, string>;
  functionality_to_nodes: Record<string, string[]>;
  business_rule_to_functionality: Record<string, string>;
  node_to_business_rules: Record<string, string[]>;
  bp_step_to_nodes: Record<string, string[]>;
  node_to_bp_steps: Record<string, string[]>;
}

// Extraction metadata
export interface OwnershipMetadata {
  total_claims: number;
  conflicts: number;
  transfers: number;
  shared_utilities: number;
  owned_nodes: number;
  conflict_rate: number;
}

export interface BoundaryDetection {
  total_checks: number;
  heuristic_decisions: number;
  llm_fallbacks: number;
  cache_hits: number;
  cache_size: number;
}

export interface UnifiedExtraction {
  strategy_used: string;
  paradigm_detected: string;
  paradigm_confidence: number;
  paradigm_detection_method: string;
  total_extraction_time: number;
  config: {
    strategy_mode: string;
    force_strategy: string | null;
  };
}

export interface ExtractionMetadata {
  strategy: string;
  extraction_time_seconds: number;
  llm_calls: number;
  ownership: OwnershipMetadata;
  boundary_detection: BoundaryDetection;
  unified_extraction: UnifiedExtraction;
}

// Global metrics
export interface GlobalMetrics {
  total_features: number;
  total_sub_features: number;
  total_functionalities: number;
  total_business_rules: number;
  total_nodes_processed: number;
}

// Root data structure
export interface HierarchicalFeatureAnalysisData {
  domain_features: DomainFeature[];
  shared_utilities: SharedUtilities | null;
  orphan_code: unknown | null;
  feature_tree: FeatureTree;
  traceability_map: TraceabilityMap;
  metadata: ExtractionMetadata;
  extraction_timestamp: string;
  metrics: GlobalMetrics;
}

// UI Helper types
export interface FeatureTreeNode {
  id: string;
  name: string;
  type: 'feature' | 'sub_feature' | 'functionality';
  children?: FeatureTreeNode[];
  data: DomainFeature | SubFeature | Functionality;
}

export interface PriorityConfig {
  label: string;
  color: string;
  bgColor: string;
}

export const PRIORITY_CONFIG: Record<string, PriorityConfig> = {
  critical: { label: 'Critical', color: '#dc2626', bgColor: '#fef2f2' },
  high: { label: 'High', color: '#ea580c', bgColor: '#fff7ed' },
  medium: { label: 'Medium', color: '#ca8a04', bgColor: '#fefce8' },
  low: { label: 'Low', color: '#16a34a', bgColor: '#f0fdf4' },
};

export interface ComplexityConfig {
  label: string;
  color: string;
  bgColor: string;
}

export const COMPLEXITY_CONFIG: Record<string, ComplexityConfig> = {
  simple: { label: 'Simple', color: '#16a34a', bgColor: '#f0fdf4' },
  moderate: { label: 'Moderate', color: '#ca8a04', bgColor: '#fefce8' },
  complex: { label: 'Complex', color: '#ea580c', bgColor: '#fff7ed' },
  very_complex: { label: 'Very Complex', color: '#dc2626', bgColor: '#fef2f2' },
};