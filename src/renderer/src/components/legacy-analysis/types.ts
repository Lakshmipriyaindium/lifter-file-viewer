// TypeScript interfaces for LIFTER Legacy System Analysis

export interface Summary {
  total_files: number;
  total_lines_of_code: number;
  total_chunks: number;
  unique_procedures: number;
  unique_local_procedures: number;
  unique_common_routines: number;
  unique_domains: number;
  unique_business_features_l1: number;
}

export interface DomainFile {
  filename: string;
  relative_path: string;
  total_lines: number;
  primary_domain: string;
  primary_business_feature_l1: string;
}

export interface Domain {
  file_count: number;
  total_lines: number;
  total_occurrences: number;
  features: string[];
  files: DomainFile[];
}

export interface BusinessFeatureFile {
  filename: string;
  relative_path: string;
  total_lines: number;
  primary_domain: string;
  primary_business_feature_l1: string;
}

export interface BusinessFeature {
  file_count: number;
  total_lines: number;
  functions_l2: string[];
  files: BusinessFeatureFile[];
}

export interface Chunk {
  filename: string;
  chunk_number: number;
  start_line: number;
  end_line: number;
  total_lines_in_chunk: number;
  domain: string;
  business_feature_l1: string;
  functions_l2: string[];
  procedures_found: string[];
  local_procedures_found: string[];
  common_routines_found: string[];
  description: string;
  procedures_pattern_found: string[];
  local_procedures_pattern_found: string[];
  common_routines_pattern_found: string[];
}

export interface File {
  filename: string;
  relative_path: string;
  absolute_path: string;
  total_lines: number;
  total_chunks: number;
  chunks_analyzed: number;
  analysis_date: string;
  chunks: Chunk[];
  aggregated_procedures: string[];
  aggregated_local_procedures: string[];
  aggregated_common_routines: string[];
  primary_domain: string;
  all_domains: Record<string, number>;
  primary_business_feature_l1: string;
  all_business_features_l1: Record<string, number>;
  functions_l2_by_feature: Record<string, string[]>;
}

export interface Procedures {
  all_procedures: string[];
  all_local_procedures: string[];
  all_common_routines: string[];
}

export interface LegacyAnalysisData {
  consolidation_date: string;
  summary: Summary;
  domains: Record<string, Domain>;
  business_features_l1: Record<string, BusinessFeature>;
  procedures: Procedures;
  files: File[];
}

// Treemap specific interfaces
export interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
  fill?: string;
  domain?: string;
  feature?: string;
  fileCount?: number;
  linesOfCode?: number;
}

export interface TreemapData {
  name: string;
  children: TreemapNode[];
}

// Stats interfaces
export interface DomainStats {
  name: string;
  files: number;
  lines: number;
  percentage: number;
  features: string[];
}

export interface FeatureStats {
  name: string;
  files: number;
  lines: number;
  percentage: number;
  domains: string[];
}
