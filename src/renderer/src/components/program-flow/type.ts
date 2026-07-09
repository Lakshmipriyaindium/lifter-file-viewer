// Types for program_flow.json

export interface NodeAnalysis {
  title?: string;
  description?: string;
  key_logic?: string | string[];
  business_rules?: string | string[];
  validations?: string | string[];
  data_entities?: string | string[];
  [key: string]: unknown;
}

export interface ProgramFlowNode {
  id: string;
  name: string;
  type?: string;
  isEntryPoint?: boolean;
  calledBy?: string[];
  calls?: string[];
  metadata?: {
    analysis?: NodeAnalysis;
    [key: string]: unknown;
  };
}

export interface ProgramFlowData {
  nodes: ProgramFlowNode[];
  metadata?: {
    program?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
