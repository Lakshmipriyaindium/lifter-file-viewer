export interface Citation {
  source_type: string;
  node_name: string;
  file_path: string;
  line_start: number;
  line_end: number;
  language: string;
}

export interface ReferenceDocument {
  document_id: string | number;
  confidence: number;
  relationship?: string;
  reason?: string;
}

export interface UserStory {
  story_id: string;
  title: string;
  epic: string;
  priority: string;
  complexity: string;
  story_points: number;
  status: string;
  as_a: string;
  i_want: string;
  so_that: string;
  narrative: string;
  background?: string | null;
  acceptance_criteria: string[];
  assumptions: string[];
  test_scenarios: string[];
  technical_requirements?: string[];
  data_inputs: string[];
  data_outputs: string[];
  has_client_customizations?: boolean;
  affected_clients?: string[];
  customization_type?: string;
  client_specific_requirements?: string[];
  implementation_notes?: string | null;
  related_features: string[];
  related_flows?: string[];
  related_business_rules?: string[];
  reference_documents?: ReferenceDocument[];
  depends_on: string[];
  blocks: string[];
  citations?: Citation[];
  tags?: string[];
  created_date?: string;
}

export interface BusinessRule {
  rule_id: string;
  name: string;
  category?: string;
  priority?: string;
  is_mandatory?: boolean;
  description?: string;
  statement?: string;
  conditions?: string[];
  actions?: string[];
}

export interface UserStoriesViewProps {
  stories: UserStory[];
  businessRules: BusinessRule[];
  language?: string;
  codebasePath?: string;
  timestamp?: string;
  onExportMarkdown: () => void;
  onExportExcel: () => void;
  isExporting: boolean;
}
