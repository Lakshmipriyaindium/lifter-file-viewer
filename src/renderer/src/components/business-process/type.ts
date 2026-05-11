export interface BusinessProcessStep {
  step_number: number;
  step_title: string;
  source: string;
  node_name: string;
  node_id: string;
  file_path: string;
  depth: number;
  called_from: string | null;
  call_reason: string | null;
  description: string;
  business_rules: string[];
  has_client_customizations: boolean;
}

export interface BusinessProcessFlow {
  process_name: string;
  purpose: string;
  business_value: string;
  executive_summary: string;
  key_phases: string[];
  critical_business_rules: string[];
  entry_points: string[];
  total_steps: number;
  nodes_visited: number;
  max_depth_reached: number;
  steps: BusinessProcessStep[];
  business_rules_summary: {
    total_rules_applied: number;
    rule_categories_affected: string[];
  };
  client_customizations_summary: {
    total_steps_with_customizations: number;
    clients_affected: string[];
  };
}
