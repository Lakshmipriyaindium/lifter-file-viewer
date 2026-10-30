import type {
  AttentionArea,
  CloudNativeData,
  Dimension,
  MigrationStrategy,
  MigrationStrategyInfo,
  RadarDataPoint,
  ReadinessStatus,
  RoadmapItem,
} from './types';

export const MIGRATION_STRATEGIES: MigrationStrategyInfo[] = [
  { key: 'Rehost',      label: 'Rehost',      subtitle: 'Lift & Shift',      color: '#3b82f6' },
  { key: 'Replatform',  label: 'Replatform',  subtitle: 'Lift & Reshape',    color: '#8b5cf6' },
  { key: 'Rebuild',     label: 'Rebuild',     subtitle: 'Build from scratch', color: '#f59e0b' },
  { key: 'Refactor',    label: 'Refactor',    subtitle: 'Optimize code',      color: '#10b981' },
  { key: 'Rearchitect', label: 'Rearchitect', subtitle: 'Structural redesign', color: '#475569' },
  { key: 'Retain',      label: 'Retain',      subtitle: 'Keep as-is',         color: '#ef4444' },
];

export function getProjectName(repoPath: string): string {
  return repoPath.split('/').filter(Boolean).pop() ?? repoPath;
}

export function getReadinessStatus(score: number): ReadinessStatus {
  if (score >= 75) return { label: 'Cloud Native', color: '#22c55e', textColor: 'text-green-500' };
  if (score >= 50) return { label: 'Ready', color: '#3b82f6', textColor: 'text-blue-500' };
  if (score >= 25) return { label: 'Partially Ready', color: '#f59e0b', textColor: 'text-amber-500' };
  return { label: 'Not Ready', color: '#ef4444', textColor: 'text-red-500' };
}

export function getScoreBadgeClass(score: string): string {
  switch (score?.toLowerCase()) {
    case 'high':   return 'bg-green-100 text-green-700';
    case 'medium': return 'bg-amber-100 text-amber-700';
    default:       return 'bg-red-100 text-red-700';
  }
}

export function getImpactBadgeClass(impact: string): string {
  switch (impact?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-700 border border-red-200/50';
    case 'medium':
      return 'bg-amber-100/90 text-amber-700 border border-amber-200/50';
    case 'low':
      return 'bg-blue-100 text-blue-700 border border-blue-200/50';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200/50';
  }
}

export function buildRadarData(dimensions: Dimension[]): RadarDataPoint[] {
  return dimensions.map((d) => ({
    subject: d.display_name,
    score: Math.round(d.dimension_score ?? d.computed_score ?? 0),
    fullMark: 100,
  }));
}

export function getRoadmapItems(data: CloudNativeData): RoadmapItem[] {
  if (data.roadmap && data.roadmap.length > 0) {
    return data.roadmap;
  }
  const items: RoadmapItem[] = [];
  let priority = 1;
  const dimensions = data.dimensions ?? [];
  for (const dim of dimensions) {
    const criteria = dim.criteria ?? [];
    for (const crit of criteria) {
      if (crit.score?.toLowerCase() !== 'high') {
        items.push({
          priority: priority++,
          dimension: dim.display_name,
          action: `Improve ${crit.display_name}`,
          impact: crit.score?.toLowerCase() === 'low' ? 'High' : 'Medium',
          effort: 'Medium',
        });
      }
    }
  }
  return items;
}

export function getAreasNeedingAttention(data: CloudNativeData): AttentionArea[] {
  const dimensions = data.dimensions ?? [];
  if (data.areas_needing_attention && data.areas_needing_attention.length > 0) {
    return data.areas_needing_attention.map((item) => {
      const match = item.match(/\(([^)]+)\)/);
      if (match) {
        return { name: item.replace(/\s*\([^)]+\)/, '').trim(), scoreText: match[1] };
      }
      const dim = dimensions.find(
        (d) =>
          d.display_name.toLowerCase() === item.toLowerCase() ||
          d.dimension.toLowerCase() === item.toLowerCase() ||
          item.toLowerCase().includes(d.display_name.toLowerCase())
      );
      const score = dim ? (dim.dimension_score ?? dim.computed_score ?? 0) : 0;
      return {
        name: dim ? dim.display_name : item,
        scoreText: `${score.toFixed(1)}%`,
      };
    });
  }

  // Fallback: dimensions sorted by score ascending
  return [...dimensions]
    .sort((a, b) => (a.dimension_score ?? a.computed_score ?? 0) - (b.dimension_score ?? b.computed_score ?? 0))
    .map((d) => {
      const score = (d.dimension_score ?? d.computed_score ?? 0);
      return {
        name: d.display_name,
        scoreText: `${score.toFixed(1)}%`,
      };
    });
}

/**
 * Computes 1-based ranks for dimensions ordered by score ascending (lowest score = Rank #1).
 * Ties preserve the original list order.
 */
export function computeDimensionRanks(dimensions: Dimension[]): Map<string, number> {
  const sorted = [...dimensions]
    .map((dim, originalIndex) => ({
      dim,
      originalIndex,
      score: dim.dimension_score ?? dim.computed_score ?? 0,
    }))
    .sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      return a.originalIndex - b.originalIndex;
    });

  const rankMap = new Map<string, number>();
  sorted.forEach((item, sortedIndex) => {
    rankMap.set(item.dim.dimension, sortedIndex + 1);
  });
  return rankMap;
}
