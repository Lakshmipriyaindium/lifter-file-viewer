import React, { useMemo } from 'react';
import ReportHeader from './components/ReportHeader';
import SummaryStats from './components/SummaryStats';
import ArchitectureMapCard from './components/ArchitectureMapCard';
import ArchitectureStyleCard from './components/ArchitectureStyleCard';
import MicroserviceReadinessCard from './components/MicroserviceReadinessCard';
import AntipatternsCard from './components/AntipatternsCard';
import HealthChecklist from './components/HealthChecklist';
import CouplingMetrics from './components/CouplingMetrics';
import {
  buildArchitectureStyleRows, buildCouplingStats, buildSummaryStats, getProjectTitle,
} from './utils';
import type { ArchitectureReport, ArchitectureAnalysisViewerProps } from './types';

const ArchitectureAnalysisViewer: React.FC<ArchitectureAnalysisViewerProps> = ({ data }) => {
  const report = useMemo<Partial<ArchitectureReport>>(() => data ?? {}, [data]);

  const title = useMemo(() => getProjectTitle(report), [report]);
  const summary = useMemo(() => buildSummaryStats(report), [report]);
  const styleRows = useMemo(() => buildArchitectureStyleRows(report), [report]);
  const coupling = useMemo(() => buildCouplingStats(report), [report]);

  const dominant = report.architecture_style?.patterns?.dominant_pattern;
  const ap = report.antipattern_analysis;
  const ms = report.microservice_readiness;

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <ReportHeader title={title} />
      <SummaryStats stats={summary} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        <ArchitectureMapCard source={report.architecture_diagram?.mermaid_source} />
        <ArchitectureStyleCard name={dominant?.name} confidence={dominant?.confidence} rows={styleRows} tradeOffs={dominant?.trade_offs} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <MicroserviceReadinessCard overall={ms?.overall_pct ?? 0} dimensions={ms?.dimensions ?? []} phases={ms?.migration_strategy ?? []} />
        <AntipatternsCard
          total={ap?.antipatterns?.total ?? 0}
          high={ap?.antipatterns?.high_severity ?? 0}
          items={ap?.antipatterns?.items ?? []}
          summary={ap?.executive_summary}
          urgency={ap?.refactoring_urgency}
        />
      </div>

      <HealthChecklist items={report.checklist_items ?? []} />
      <CouplingMetrics stats={coupling} cohesion={report.architecture_style?.metrics?.cohesion_score ?? 0} />
    </div>
  );
};

export default ArchitectureAnalysisViewer;
