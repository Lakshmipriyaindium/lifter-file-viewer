export type CheckStatus = 'pass' | 'warning' | 'fail';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type ChecklistFilter = 'all' | CheckStatus;

export interface Citation { file_path: string; method_name: string | null; line_number: number | null }
export interface Recommendation { title: string; priority: string; description: string; citations: Citation[] }

export interface ChecklistItem {
  title: string;
  status: CheckStatus | string;
  description: string;
  recommendations: Recommendation[] | string[];
  citations: string[];
}

export interface Antipattern {
  id: string;
  category: string;
  severity: Severity | string;
  title: string;
  detail: string;
  files_affected: number;
  locations: string[];
}

export interface ReadinessDimension { name: string; label: string; score_pct: number; status: string }

export interface ArchitectureReport {
  report_metadata: { repository_path: string; analysis_version: string; generated_at: string };
  architecture_style: {
    readiness_score: number; total_modules: number; total_functions: number;
    patterns: {
      dominant_pattern: { name: string; confidence: number; characteristics: string[]; trade_offs: string };
      layer_analysis: { layer_separation: string };
      communication_patterns: { type: string; mechanisms: string[] }[];
      technology_stack: string[];
      deployment_model: string;
    };
    metrics: {
      instability_score: number; abstractness_score: number; afferent_coupling: number;
      efferent_coupling: number; cohesion_score: number; distance_from_main_sequence: number;
    };
  };
  antipattern_analysis: {
    antipatterns: { total: number; high_severity: number; items: Antipattern[] };
    refactoring_urgency: string; executive_summary: string;
  };
  microservice_readiness: { overall_pct: number; dimensions: ReadinessDimension[]; migration_strategy: string[] };
  architecture_diagram: { mermaid_source: string };
  checklist_items: ChecklistItem[];
}

export interface StatCardProps {
  label: string;
  value: string | number;
  caption: string;
  valueClassName?: string;
}

export interface NormalizedRecommendation { title: string; description: string }

export interface ArchitectureAnalysisViewerProps {
  data?: Partial<ArchitectureReport> | null;
}