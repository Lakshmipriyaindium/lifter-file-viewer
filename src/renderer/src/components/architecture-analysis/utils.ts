import { SCORE_THRESHOLDS } from './constants';
import type {
  ArchitectureReport, ChecklistFilter, ChecklistItem, NormalizedRecommendation, StatCardProps,
} from './types';

export const capitalize = (s?: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
export const toPct = (n?: number): string => `${Math.round(n ?? 0)}%`;
export const toFixed2 = (n?: number): string => (n ?? 0).toFixed(2);

export const scoreTone = (pct: number): string =>
  pct >= SCORE_THRESHOLDS.good ? 'text-green-600' : pct >= SCORE_THRESHOLDS.fair ? 'text-amber-500' : 'text-red-500';

export const getProjectTitle = (data: Partial<ArchitectureReport>): string => {
  const path = data.report_metadata?.repository_path ?? '';
  const last = path.split(/[\\/]/).filter(Boolean).pop() ?? '';
  const name = last.replace(/[-_](main|master)$/i, '').replace(/[-_]+/g, ' ').trim();
  return `${name || 'Project'} - Combined Architecture Report`;
};

export const buildSummaryStats = (data: Partial<ArchitectureReport>): StatCardProps[] => {
  const total = data.antipattern_analysis?.antipatterns?.total ?? 0;
  const high = data.antipattern_analysis?.antipatterns?.high_severity ?? 0;
  const readiness = data.microservice_readiness?.overall_pct ?? 0;
  return [
    { label: 'Services Detected', value: data.architecture_style?.total_modules ?? 0, caption: 'Modules / services identified', valueClassName: 'text-gray-900' },
    { label: 'Antipatterns', value: total, caption: `${high} high severity`, valueClassName: total > 0 ? 'text-orange-500' : 'text-gray-900' },
    { label: 'Instability (avg)', value: toFixed2(data.architecture_style?.metrics?.instability_score), caption: '0 = stable · 1 = unstable', valueClassName: 'text-gray-900' },
    { label: 'Readiness Score', value: toPct(readiness), caption: 'Microservice readiness', valueClassName: scoreTone(readiness) },
  ];
};

export const buildArchitectureStyleRows = (data: Partial<ArchitectureReport>): { label: string; value: string }[] => {
  const style = data.architecture_style;
  const patterns = style?.patterns;
  const comm = patterns?.communication_patterns?.[0];
  return [
    { label: 'Deployment Model', value: patterns?.dominant_pattern?.characteristics?.[0] ?? patterns?.deployment_model ?? '—' },
    { label: 'Total Modules', value: String(style?.total_modules ?? 0) },
    { label: 'Total Functions', value: String(style?.total_functions ?? 0) },
    { label: 'Layer Separation', value: capitalize(patterns?.layer_analysis?.layer_separation) || '—' },
    { label: 'Communication', value: comm ? `${capitalize(comm.type)} (${(comm.mechanisms ?? []).join(', ')})` : '—' },
    { label: 'Tech Stack', value: (patterns?.technology_stack ?? []).join(', ') || '—' },
  ];
};

export const buildCouplingStats = (data: Partial<ArchitectureReport>): StatCardProps[] => {
  const m = data.architecture_style?.metrics;
  const efferent = m?.efferent_coupling ?? 0;
  return [
    { label: 'Afferent Coupling', value: m?.afferent_coupling ?? 0, caption: 'Incoming module dependencies', valueClassName: 'text-gray-900' },
    { label: 'Efferent Coupling', value: efferent, caption: 'Outgoing module dependencies', valueClassName: efferent > 0 ? 'text-orange-500' : 'text-gray-900' },
    { label: 'Abstractness', value: toFixed2(m?.abstractness_score), caption: 'Interfaces vs implementation ratio', valueClassName: 'text-gray-900' },
  ];
};

export const countChecklistByStatus = (items: ChecklistItem[]): Record<ChecklistFilter, number> => {
  const counts: Record<ChecklistFilter, number> = { all: items.length, pass: 0, warning: 0, fail: 0 };
  items.forEach((i) => {
    const s = i.status?.toLowerCase();
    if (s === 'pass' || s === 'warning' || s === 'fail') counts[s] += 1;
  });
  return counts;
};

export const filterChecklist = (items: ChecklistItem[], filter: ChecklistFilter): ChecklistItem[] =>
  filter === 'all' ? items : items.filter((i) => i.status?.toLowerCase() === filter);

export const normalizeRecommendations = (recs: ChecklistItem['recommendations'] | undefined): NormalizedRecommendation[] =>
  ((recs ?? []) as Array<string | { title?: string; description?: string }>).map((r) =>
    typeof r === 'string' ? { title: r, description: '' } : { title: r.title ?? '', description: r.description ?? '' },
  );

/** Strips `class X style ...` lines that Mermaid rejects. */
export const sanitizeMermaid = (src: string): string =>
  src.split('\n').filter((l) => !/^\s*class\s+\S+\s+style\b/.test(l)).join('\n');
