// types.ts - TypeScript definitions for Business Rules

export interface Citation {
  source_type: string;
  source_name: string;
  node_name: string;
  file_path: string;
  line_start: string;
  line_end: string;
  language: string;
  entity_name: string;
  entity_type: string;
  schema_name: string;
  database: string;
  document_name: string;
  document_path: string;
  document_type: string;
}

export interface BusinessRule {
  rule_id: string;
  name: string;
  category: string;
  citations: Citation[];
  description: string;
  statement: string;
  conditions: string | string[];
  actions: string | string[];
  exceptions: string | string[];
  applies_to: string[];
  triggered_by: string[];
  implemented_in: string[];
  implementation_details: string;
  data_elements: string[];
  calculations: string[];
  thresholds: Record<string, unknown>;
  compliance_requirement: string;
  regulatory_reference: string;
  priority: string;
  is_mandatory: string;
  test_scenarios: string[];
  validation_criteria: string[];
}

export interface BusinessRulesData {
  business_rules: BusinessRule[];
}

export interface FilterState {
  category: string;
  priority: string;
  is_mandatory: string;
  language: string;
  searchTerm: string;
}

export type SortField = keyof BusinessRule | 'none';
export type SortDirection = 'asc' | 'desc';