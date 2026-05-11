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

export interface ReferenceDocument {
  document_id: string | number;
  relationship ?: string;
  reason? : string;
  confidence : number ;
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
  background?: string | null;
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

export interface BusinessRule {
  rule: string;
  source: string;
  scope: string;
  confidence: string;
  node_id?: string;
  node_name?: string;
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
