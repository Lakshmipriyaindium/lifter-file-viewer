export type CriterionScore = 'Low' | 'Medium' | 'High';
export type MigrationStrategy = 'Rehost' | 'Replatform' | 'Rebuild' | 'Refactor' | 'Rearchitect' | 'Retain';
export type ViewMode = 'factor-wise' | 'active-only' | 'roadmap-tasks';
export type RoadmapVariant = 'section' | 'modal';

/** All view modes in order, used for iteration in dropdowns. */
export const VIEW_MODES: readonly ViewMode[] = ['factor-wise', 'active-only', 'roadmap-tasks'] as const;

// ─── Utility / return types ────────────────────────────────────────────────

export interface ReadinessStatus {
  label: string;
  color: string;
  textColor: string;
}

export interface RadarDataPoint {
  subject: string;
  score: number;
  fullMark: number;
}

export interface AttentionArea {
  name: string;
  scoreText: string;
}

export interface MigrationStrategyInfo {
  key: MigrationStrategy;
  label: string;
  subtitle: string;
  color: string;
}

export interface Criterion {
  name: string;
  display_name: string;
  score: CriterionScore | string;
  weight: number;
  evidence: unknown[];
  evidence_paths: string[];
  details: string;
  score_source?: string;
  llm_reasoning?: string;
  static_score?: number | null;
}

export interface Dimension {
  dimension: string;
  display_name: string;
  dimension_active: boolean;
  criteria: Criterion[];
  weight: number;
  computed_score: number;
  summary: string;
  dimension_score: number;
}

export interface RoadmapItem {
  priority: number;
  dimension: string;
  action: string;
  impact: string;
  effort: string;
}

export interface CloudNativeData {
  repo_path: string;
  deployment_model: string;
  deployment_confidence: number;
  overall_score: number;
  recommended_strategy: MigrationStrategy | string;
  recommendation_rationale: string;
  dimensions: Dimension[];
  top_performers?: string[];
  areas_needing_attention?: string[];
  roadmap?: RoadmapItem[];
}
