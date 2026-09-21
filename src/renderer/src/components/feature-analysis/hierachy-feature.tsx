'use client';

import React, { useState, useMemo } from 'react';
import {
  HierarchicalFeatureAnalysisData,
  DomainFeature,
  SubFeature,
  PRIORITY_CONFIG,
  COMPLEXITY_CONFIG,
} from './type';

// ============================================================================
// Utility Components
// ============================================================================

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'priority' | 'complexity';
  color?: string;
  bgColor?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  color,
  bgColor 
}) => {
  const baseStyles = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold";
  
  if (color && bgColor) {
  return (
    <span 
    className={baseStyles}
    style={{ color, backgroundColor: bgColor }}
    >
    {children}
    </span>
  );
  }
  
  const variantStyles = {
  default: "bg-slate-100 text-slate-700",
  outline: "border border-slate-300 text-slate-600 bg-white",
  };
  
  return (
  <span className={`${baseStyles} ${variantStyles[variant as keyof typeof variantStyles] || variantStyles.default}`}>
    {children}
  </span>
  );
};

interface PriorityBadgeProps {
  priority?: string;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const config = PRIORITY_CONFIG[priority || ''] || PRIORITY_CONFIG.medium;
  return (
  <Badge color={config.color} bgColor={config.bgColor}>
    {config.label}
  </Badge>
  );
};

interface ComplexityBadgeProps {
  complexity?: string;
}

const ComplexityBadge: React.FC<ComplexityBadgeProps> = ({ complexity }) => {
  const config = COMPLEXITY_CONFIG[complexity || ''] || COMPLEXITY_CONFIG.moderate;
  return (
  <Badge color={config.color} bgColor={config.bgColor}>
    {config.label}
  </Badge>
  );
};

// ============================================================================
// Metrics Dashboard
// ============================================================================

interface MetricCardProps {
  label?: string;
  value?: number | string;
  icon?: React.ReactNode;
  accent?: boolean;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, accent, subtitle }) => (
  <div className={`metric-card ${accent ? 'accent' : ''}`}>
  <div className="metric-icon">{icon}</div>
  <div className="metric-content">
    <span className="metric-value">{value}</span>
    <span className="metric-label">{label}</span>
    {subtitle && <span className="metric-subtitle">{subtitle}</span>}
  </div>
  <style>{`
    .metric-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .metric-card:hover {
    border-color: #fb851e;
    box-shadow: 0 4px 12px rgba(251, 133, 30, 0.1);
    transform: translateY(-2px);
    }
    .metric-card.accent {
    background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%);
    border-color: #fed7aa;
    }
    .metric-icon {
    width: 48px;
    height: 48px;
    background: #f8fafc;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    }
    .metric-card.accent .metric-icon {
    background: linear-gradient(135deg, #fb851e 0%, #ea580c 100%);
    color: white;
    }
    .metric-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    }
    .metric-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1;
    font-family: 'DM Sans', sans-serif;
    }
    .metric-label {
    font-size: 0.8125rem;
    color: #64748b;
    font-weight: 500;
    }
    .metric-subtitle {
    font-size: 0.6875rem;
    color: #94a3b8;
    }
  `}</style>
  </div>
);

interface MetricsDashboardProps {
  data?: HierarchicalFeatureAnalysisData;
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ data }) => {
  const { metrics, feature_tree, metadata } = data || ({} as HierarchicalFeatureAnalysisData);
  
  return (
  <div className="metrics-dashboard">
    <div className="metrics-grid">
    <MetricCard
      label="Features"
      value={metrics?.total_features}
      accent
      icon={
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,2 2,7 12,12 22,7"/>
        <polyline points="2,17 12,22 22,17"/>
        <polyline points="2,12 12,17 22,12"/>
      </svg>
      }
    />
    <MetricCard
      label="Sub-Features"
      value={metrics?.total_sub_features}
      icon={
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
      }
    />
    <MetricCard
      label="Functionalities"
      value={metrics?.total_functionalities}
      icon={
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
      }
    />
    <MetricCard
      label="Nodes Processed"
      value={metrics?.total_nodes_processed}
      icon={
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16,18 22,12 16,6"/>
        <polyline points="8,6 2,12 8,18"/>
      </svg>
      }
    />
    <MetricCard
      label="Tree Depth"
      value={feature_tree?.total_levels}
      subtitle="levels"
      icon={
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
      }
    />
    <MetricCard
      label="Shared Utilities"
      value={feature_tree?.shared_utilities_count}
      icon={
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      }
    />
    <MetricCard
      label="Extraction Time"
      value={`${metadata?.extraction_time_seconds?.toFixed(1)}s`}
      icon={
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12,6 12,12 16,14"/>
      </svg>
      }
    />
    <MetricCard
      label="Conflict Rate"
      value={`${(metadata?.ownership?.conflict_rate ? (metadata!.ownership.conflict_rate * 100).toFixed(1) : '0.0')}%`}
      icon={
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      }
    />
    </div>
    <style>{`
    .metrics-dashboard {
      margin-bottom: 32px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    `}</style>
  </div>
  );
};

// ============================================================================
// Feature Card Component
// ============================================================================

interface FeatureCardProps {
  feature?: DomainFeature;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, isExpanded, onToggle }) => {
  const [expandedSubFeatures, setExpandedSubFeatures] = useState<Set<string>>(new Set());

  const toggleSubFeature = (id: string) => {
  setExpandedSubFeatures(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  };

  if (!feature) return null;

  return (
  <div className="feature-card">
    <div className="feature-header" onClick={onToggle}>
    <div className="feature-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12,2 2,7 12,12 22,7"/>
      <polyline points="2,17 12,22 22,17"/>
      <polyline points="2,12 12,17 22,12"/>
      </svg>
    </div>
    <div className="feature-info">
      <div className="feature-title-row">
      <h3 className="feature-name">{feature.name}</h3>
      <div className="feature-badges">
        <PriorityBadge priority={feature.priority} />
        <ComplexityBadge complexity={feature.complexity} />
      </div>
      </div>
      <p className="feature-entry">
      <span className="entry-label">Entry:</span> {feature.entry_point_name}
      </p>
      <p className="feature-description">{feature.description}</p>
    </div>
    <div className="feature-metrics">
      <div className="metric-pill">
      <span className="metric-num">{feature.sub_features?.length}</span>
      <span className="metric-txt">Sub-features</span>
      </div>
      <div className="metric-pill">
      <span className="metric-num">{feature.metrics?.total_nodes}</span>
      <span className="metric-txt">Nodes</span>
      </div>
    </div>
    <div className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6,9 12,15 18,9"/>
      </svg>
    </div>
    </div>

    {isExpanded && (
    <div className="feature-content">
      {/* Business Value */}
      <div className="content-section highlight">
      <h4 className="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        Business Value
      </h4>
      <p className="section-text">{feature.business_value}</p>
      </div>

      {/* Capabilities */}
      {feature.capabilities?.length > 0 && (
      <div className="content-section">
        <h4 className="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22,4 12,14.01 9,11.01"/>
        </svg>
        Capabilities
        </h4>
        <div className="tags-list">
        {feature.capabilities.map((cap, idx) => (
          <span key={idx} className="tag capability">{cap}</span>
        ))}
        </div>
      </div>
      )}

      {/* User Actions & System Actions */}
      <div className="content-columns">
      {feature.user_actions?.length > 0 && (
        <div className="content-section">
        <h4 className="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
          </svg>
          User Actions
        </h4>
        <ul className="action-list">
          {feature.user_actions.map((action, idx) => (
          <li key={idx}>{action}</li>
          ))}
        </ul>
        </div>
      )}
      {feature.system_actions?.length > 0 && (
        <div className="content-section">
        <h4 className="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          System Actions
        </h4>
        <ul className="action-list system">
          {feature.system_actions.map((action, idx) => (
          <li key={idx}>{action}</li>
          ))}
        </ul>
        </div>
      )}
      </div>

      {/* Validations */}
      {feature.validations?.length > 0 && (
      <div className="content-section">
        <h4 className="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Validations
        </h4>
        <ul className="validation-list">
        {feature.validations.map((val, idx) => (
          <li key={idx}>{val}</li>
        ))}
        </ul>
      </div>
      )}

      {/* Data Entities & Integration Points */}
      <div className="content-columns">
      {feature.data_entities?.length > 0 && (
        <div className="content-section">
        <h4 className="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
          Data Entities
        </h4>
        <div className="tags-list">
          {feature.data_entities.map((entity, idx) => (
          <span key={idx} className="tag entity">{entity}</span>
          ))}
        </div>
        </div>
      )}
      {feature.integration_points?.length > 0 && (
        <div className="content-section">
        <h4 className="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4"/>
          <line x1="1.05" y1="12" x2="7" y2="12"/>
          <line x1="17.01" y1="12" x2="22.96" y2="12"/>
          </svg>
          Integration Points
        </h4>
        <div className="tags-list">
          {feature.integration_points.map((point, idx) => (
          <span key={idx} className="tag integration">{point}</span>
          ))}
        </div>
        </div>
      )}
      </div>

      {/* User Roles */}
      {feature.user_roles?.length > 0 && (
      <div className="content-section">
        <h4 className="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        User Roles
        </h4>
        <div className="tags-list">
        {feature.user_roles.map((role, idx) => (
          <span key={idx} className="tag role">{role}</span>
        ))}
        </div>
      </div>
      )}

      {/* Sub-Features */}
      {feature.sub_features?.length > 0 && (
      <div className="sub-features-section">
        <h4 className="section-title large">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        Sub-Features ({feature.sub_features.length})
        </h4>
        <div className="sub-features-list">
        {feature.sub_features.map((subFeature) => (
          <SubFeatureCard
          key={subFeature.sub_feature_id}
          subFeature={subFeature}
          isExpanded={expandedSubFeatures.has(subFeature.sub_feature_id)}
          onToggle={() => toggleSubFeature(subFeature.sub_feature_id)}
          />
        ))}
        </div>
      </div>
      )}

      {/* Citations */}
      {feature.citations?.length > 0 && (
      <div className="content-section citations">
        <h4 className="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
        Source Citations
        </h4>
        <div className="citations-list">
        {feature.citations.map((citation, idx) => (
          <div key={idx} className="citation-item">
          <span className="citation-node">{citation.node_name}</span>
          <span className="citation-file">{citation.file_path.split('/').pop()}</span>
          <span className="citation-lines">L{citation.line_start}-{citation.line_end}</span>
          <span className="citation-lang">{citation.language}</span>
          </div>
        ))}
        </div>
      </div>
      )}
    </div>
    )}

    <style>{`
    .feature-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .feature-card:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    }
    .feature-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 24px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .feature-header:hover {
      background: #f8fafc;
    }
    .feature-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #fb851e 0%, #ea580c 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(251, 133, 30, 0.25);
    }
    .feature-info {
      flex: 1;
      min-width: 0;
    }
    .feature-title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 4px;
    }
    .feature-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      font-family: 'DM Sans', sans-serif;
    }
    .feature-badges {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }
    .feature-entry {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 0 0 8px 0;
      font-family: 'JetBrains Mono', monospace;
    }
    .entry-label {
      color: #fb851e;
      font-weight: 600;
    }
    .feature-description {
      font-size: 0.875rem;
      color: #475569;
      margin: 0;
      line-height: 1.6;
    }
    .feature-metrics {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-shrink: 0;
    }
    .metric-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f1f5f9;
      padding: 6px 12px;
      border-radius: 20px;
    }
    .metric-num {
      font-weight: 700;
      color: #1e293b;
      font-size: 0.875rem;
    }
    .metric-txt {
      font-size: 0.6875rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .expand-icon {
      color: #94a3b8;
      transition: transform 0.3s ease;
      flex-shrink: 0;
      margin-top: 14px;
    }
    .expand-icon.expanded {
      transform: rotate(180deg);
    }
    .feature-content {
      padding: 0 24px 24px;
      border-top: 1px solid #f1f5f9;
      animation: slideDown 0.3s ease-out;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .content-section {
      padding-top: 20px;
    }
    .content-section.highlight {
      background: linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%);
      margin: 20px -24px 0;
      padding: 20px 24px;
      border-top: 1px solid #fed7aa;
      border-bottom: 1px solid #fed7aa;
    }
    .content-section.citations {
      background: #f8fafc;
      margin: 20px -24px -24px;
      padding: 20px 24px 24px;
      border-radius: 0 0 20px 20px;
    }
    .content-columns {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 0 12px 0;
    }
    .section-title.large {
      font-size: 0.9375rem;
      color: #1e293b;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }
    .section-title svg {
      color: #fb851e;
    }
    .section-text {
      font-size: 0.9375rem;
      color: #334155;
      margin: 0;
      line-height: 1.7;
    }
    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .tag {
      font-size: 0.75rem;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 500;
    }
    .tag.capability {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .tag.entity {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .tag.integration {
      background: #faf5ff;
      color: #7c3aed;
      border: 1px solid #ddd6fe;
    }
    .tag.role {
      background: #fdf4ff;
      color: #a21caf;
      border: 1px solid #f5d0fe;
    }
    .action-list, .validation-list {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }
    .action-list li, .validation-list li {
      position: relative;
      padding-left: 20px;
      font-size: 0.8125rem;
      color: #475569;
      line-height: 1.7;
      margin-bottom: 4px;
    }
    .action-list li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
    }
    .action-list.system li::before {
      background: #6366f1;
    }
    .validation-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      top: 0;
      color: #fb851e;
      font-weight: bold;
    }
    .sub-features-section {
      margin-top: 8px;
    }
    .sub-features-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .citations-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .citation-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
    }
    .citation-node {
      font-weight: 600;
      color: #1e293b;
    }
    .citation-file {
      color: #64748b;
    }
    .citation-lines {
      color: #fb851e;
      font-weight: 500;
    }
    .citation-lang {
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
      color: #475569;
    }
    `}</style>
  </div>
  );
};

// ============================================================================
// Sub-Feature Card
// ============================================================================

interface SubFeatureCardProps {
  subFeature?: SubFeature;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const SubFeatureCard: React.FC<SubFeatureCardProps> = ({ subFeature, isExpanded, onToggle }) => {
  if (!subFeature) return null;

  return (
  <div className="sub-feature-card">
    <div className="sub-feature-header" onClick={onToggle}>
    <div className="sub-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
      </svg>
    </div>
    <div className="sub-info">
      <h5 className="sub-name">{subFeature.name}</h5>
      <p className="sub-desc">{subFeature.description}</p>
    </div>
    <div className="sub-badges">
      <PriorityBadge priority={subFeature.priority} />
      <ComplexityBadge complexity={subFeature.complexity} />
    </div>
    <div className={`expand-btn ${isExpanded ? 'expanded' : ''}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6,9 12,15 18,9"/>
      </svg>
    </div>
    </div>

    {isExpanded && (
    <div className="sub-feature-content">
      {/* Business Value */}
      <div className="sub-section">
      <h6 className="sub-section-title">Business Value</h6>
      <p className="sub-section-text">{subFeature.business_value}</p>
      </div>

      {/* Capabilities */}
      {subFeature.capabilities?.length > 0 && (
      <div className="sub-section">
        <h6 className="sub-section-title">Capabilities</h6>
        <div className="sub-tags">
        {subFeature.capabilities.map((cap, idx) => (
          <span key={idx} className="sub-tag green">{cap}</span>
        ))}
        </div>
      </div>
      )}

      {/* User & System Actions */}
      <div className="sub-columns">
      {subFeature.user_actions?.length > 0 && (
        <div className="sub-section">
        <h6 className="sub-section-title">User Actions</h6>
        <ul className="sub-list">
          {subFeature.user_actions.map((action, idx) => (
          <li key={idx}>{action}</li>
          ))}
        </ul>
        </div>
      )}
      {subFeature.system_actions?.length > 0 && (
        <div className="sub-section">
        <h6 className="sub-section-title">System Actions</h6>
        <ul className="sub-list blue">
          {subFeature.system_actions.map((action, idx) => (
          <li key={idx}>{action}</li>
          ))}
        </ul>
        </div>
      )}
      </div>

      {/* Validations */}
      {subFeature.validations?.length > 0 && (
      <div className="sub-section">
        <h6 className="sub-section-title">Validations</h6>
        <ul className="sub-list validation">
        {subFeature.validations.map((val, idx) => (
          <li key={idx}>{val}</li>
        ))}
        </ul>
      </div>
      )}

      {/* Data Entities & Integration Points */}
      <div className="sub-columns">
      {subFeature.data_entities?.length > 0 && (
        <div className="sub-section">
        <h6 className="sub-section-title">Data Entities</h6>
        <div className="sub-tags">
          {subFeature.data_entities.map((entity, idx) => (
          <span key={idx} className="sub-tag blue">{entity}</span>
          ))}
        </div>
        </div>
      )}
      {subFeature.integration_points?.length > 0 && (
        <div className="sub-section">
        <h6 className="sub-section-title">Integration Points</h6>
        <div className="sub-tags">
          {subFeature.integration_points.map((point, idx) => (
          <span key={idx} className="sub-tag purple">{point}</span>
          ))}
        </div>
        </div>
      )}
      </div>

      {/* User Roles */}
      {subFeature.user_roles?.length > 0 && (
      <div className="sub-section">
        <h6 className="sub-section-title">User Roles</h6>
        <div className="sub-tags">
        {subFeature.user_roles.map((role, idx) => (
          <span key={idx} className="sub-tag pink">{role}</span>
        ))}
        </div>
      </div>
      )}

      {/* Functionalities */}
      {subFeature.functionalities?.length > 0 && (
      <div className="sub-section funcs">
        <h6 className="sub-section-title">Functionalities ({subFeature.functionalities.length})</h6>
        <div className="functionality-list">
        {subFeature.functionalities.map((func) => (
          <div key={func.functionality_id} className="functionality-item">
          <div className="func-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div className="func-info">
            <span className="func-name">{func.name}</span>
            <span className="func-desc">{func.description}</span>
          </div>
          </div>
        ))}
        </div>
      </div>
      )}
    </div>
    )}

    <style>{`
    .sub-feature-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
    }
    .sub-feature-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .sub-feature-header:hover {
      background: #f1f5f9;
    }
    .sub-icon {
      width: 32px;
      height: 32px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fb851e;
      flex-shrink: 0;
    }
    .sub-info {
      flex: 1;
      min-width: 0;
    }
    .sub-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px 0;
    }
    .sub-desc {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .sub-badges {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
    .expand-btn {
      color: #94a3b8;
      transition: transform 0.2s;
    }
    .expand-btn.expanded {
      transform: rotate(180deg);
    }
    .sub-feature-content {
      padding: 0 16px 16px;
      border-top: 1px solid #e2e8f0;
      background: white;
    }
    .sub-section {
      padding-top: 14px;
    }
    .sub-section.funcs {
      background: #f8fafc;
      margin: 14px -16px -16px;
      padding: 14px 16px 16px;
      border-radius: 0 0 14px 14px;
    }
    .sub-section-title {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 8px 0;
    }
    .sub-section-text {
      font-size: 0.8125rem;
      color: #475569;
      margin: 0;
      line-height: 1.6;
    }
    .sub-columns {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
    }
    .sub-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .sub-tag {
      font-size: 0.6875rem;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 500;
    }
    .sub-tag.green {
      background: #ecfdf5;
      color: #047857;
    }
    .sub-tag.blue {
      background: #eff6ff;
      color: #1d4ed8;
    }
    .sub-tag.purple {
      background: #faf5ff;
      color: #7c3aed;
    }
    .sub-tag.pink {
      background: #fdf4ff;
      color: #a21caf;
    }
    .sub-list {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }
    .sub-list li {
      position: relative;
      padding-left: 16px;
      font-size: 0.75rem;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 3px;
    }
    .sub-list li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 6px;
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
    }
    .sub-list.blue li::before {
      background: #6366f1;
    }
    .sub-list.validation li::before {
      content: '✓';
      background: none;
      width: auto;
      height: auto;
      top: 0;
      color: #fb851e;
      font-size: 0.625rem;
      font-weight: bold;
    }
    .functionality-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .functionality-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .func-icon {
      width: 24px;
      height: 24px;
      background: #fff7ed;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fb851e;
      flex-shrink: 0;
    }
    .func-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .func-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1e293b;
    }
    .func-desc {
      font-size: 0.75rem;
      color: #64748b;
      line-height: 1.5;
    }
    `}</style>
  </div>
  );
};

// ============================================================================
// Traceability View
// ============================================================================

interface TraceabilityViewProps {
  data?: HierarchicalFeatureAnalysisData;
}

const TraceabilityView: React.FC<TraceabilityViewProps> = ({ data }) => {
  const traceability_map = data?.traceability_map;
  
  const nodeCount = Object.keys(traceability_map?.node_to_functionality || {}).length;
  const funcCount = Object.keys(traceability_map?.functionality_to_sub_feature || {}).length;
  const subFeatureCount = Object.keys(traceability_map?.sub_feature_to_feature || {}).length;

  return (
  <div className="traceability-view">
    <h3 className="trace-title">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
    Traceability Matrix
    </h3>
    
    <div className="trace-flow">
    <div className="trace-node">
      <div className="trace-count">{nodeCount}</div>
      <div className="trace-label">Code Nodes</div>
    </div>
    <div className="trace-arrow">
      <svg width="40" height="24" viewBox="0 0 40 24">
      <path d="M0 12 L30 12 M24 6 L30 12 L24 18" stroke="#fb851e" strokeWidth="2" fill="none"/>
      </svg>
    </div>
    <div className="trace-node">
      <div className="trace-count">{funcCount}</div>
      <div className="trace-label">Functionalities</div>
    </div>
    <div className="trace-arrow">
      <svg width="40" height="24" viewBox="0 0 40 24">
      <path d="M0 12 L30 12 M24 6 L30 12 L24 18" stroke="#fb851e" strokeWidth="2" fill="none"/>
      </svg>
    </div>
    <div className="trace-node">
      <div className="trace-count">{subFeatureCount}</div>
      <div className="trace-label">Sub-Features</div>
    </div>
    <div className="trace-arrow">
      <svg width="40" height="24" viewBox="0 0 40 24">
      <path d="M0 12 L30 12 M24 6 L30 12 L24 18" stroke="#fb851e" strokeWidth="2" fill="none"/>
      </svg>
    </div>
    <div className="trace-node accent">
      <div className="trace-count">{data?.metrics?.total_features}</div>
      <div className="trace-label">Features</div>
    </div>
    </div>

    <style>{`
    .traceability-view {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .trace-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 24px 0;
    }
    .trace-title svg {
      color: #fb851e;
    }
    .trace-flow {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .trace-node {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 24px;
      text-align: center;
      min-width: 120px;
    }
    .trace-node.accent {
      background: linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%);
      border-color: #fb851e;
    }
    .trace-count {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      font-family: 'DM Sans', sans-serif;
    }
    .trace-node.accent .trace-count {
      color: #fb851e;
    }
    .trace-label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 4px;
    }
    .trace-arrow {
      flex-shrink: 0;
    }
    `}</style>
  </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

interface HierarchicalFeatureAnalysisProps {    
  data?: HierarchicalFeatureAnalysisData;
  title?: string;
}

export const HierarchicalFeatureAnalysis: React.FC<HierarchicalFeatureAnalysisProps> = ({
  data,
  title = 'Hierarchical Feature Analysis'
}) => {
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const toggleFeature = (id: string) => {
  setExpandedFeatures(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  };

  const expandAll = () => {
  setExpandedFeatures(new Set((data?.domain_features || []).map(f => f.feature_id)));
  };

  const collapseAll = () => {
  setExpandedFeatures(new Set());
  };

  const filteredFeatures = useMemo(() => {
  return (data?.domain_features || [])?.filter(feature => {
    if (filterPriority !== 'all' && feature.priority !== filterPriority) {
    return false;
    }
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
    feature.name?.toLowerCase().includes(query) ||
    feature.entry_point_name?.toLowerCase().includes(query) ||
    feature.description?.toLowerCase().includes(query)
    );
  });
  }, [data?.domain_features, searchQuery, filterPriority]);

  const extractionDate = data?.extraction_timestamp ? new Date(data.extraction_timestamp).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
  }) : '';

  // Export to Interactive HTML
  const exportToHTML = () => {
  const escapeHtml = (text: string) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const priorityColors: Record<string, { color: string; bgColor: string; label: string }> = {
    critical: { color: '#991b1b', bgColor: '#fee2e2', label: 'Critical' },
    high: { color: '#ea580c', bgColor: '#ffedd5', label: 'High' },
    medium: { color: '#ca8a04', bgColor: '#fef3c7', label: 'Medium' },
    low: { color: '#65a30d', bgColor: '#ecfccb', label: 'Low' },
  };

  const complexityColors: Record<string, { color: string; bgColor: string; label: string }> = {
    high: { color: '#7c2d12', bgColor: '#fed7aa', label: 'High' },
    moderate: { color: '#92400e', bgColor: '#fef3c7', label: 'Moderate' },
    low: { color: '#365314', bgColor: '#d9f99d', label: 'Low' },
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hierarchical Feature Analysis</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    padding: 32px;
    color: #1e293b;
    line-height: 1.6;
    min-height: 100vh;
  }
  
  .container {
    max-width: 1400px;
    margin: 0 auto;
  }
  
  /* Header */
  .header {
    margin-bottom: 32px;
  }
  
  .header-content {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  
  .header-icon {
    width: 72px;
    height: 72px;
    background: linear-gradient(135deg, #fb851e 0%, #ea580c 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 8px 24px rgba(251, 133, 30, 0.3);
  }
  
  .header-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 4px 0;
  }
  
  .header-subtitle {
    font-size: 0.9375rem;
    color: #64748b;
    margin: 0;
  }
  
  .timestamp {
    color: #fb851e;
    font-weight: 500;
  }
  
  /* Metrics Dashboard */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }
  
  .metric-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  
  .metric-card:hover {
    border-color: #fb851e;
    box-shadow: 0 4px 12px rgba(251, 133, 30, 0.1);
    transform: translateY(-2px);
  }
  
  .metric-card.accent {
    background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%);
    border-color: #fed7aa;
  }
  
  .metric-icon {
    width: 48px;
    height: 48px;
    background: #f8fafc;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
  }
  
  .metric-card.accent .metric-icon {
    background: linear-gradient(135deg, #fb851e 0%, #ea580c 100%);
    color: white;
  }
  
  .metric-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .metric-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1;
  }
  
  .metric-label {
    font-size: 0.8125rem;
    color: #64748b;
    font-weight: 500;
  }
  
  /* Traceability */
  .traceability-view {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 32px;
  }
  
  .trace-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 24px 0;
  }
  
  .trace-flow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .trace-node {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 14px;
    padding: 16px 24px;
    text-align: center;
    min-width: 120px;
  }
  
  .trace-node.accent {
    background: linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%);
    border-color: #fb851e;
  }
  
  .trace-count {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
  }
  
  .trace-node.accent .trace-count {
    color: #fb851e;
  }
  
  .trace-label {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: 4px;
  }
  
  /* Feature Cards */
  .features-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 20px;
  }
  
  .feature-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    transition: all 0.3s ease;
  }
  
  .feature-card:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }
  
  .feature-header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 24px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .feature-header:hover {
    background: #f8fafc;
  }
  
  .feature-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #fb851e 0%, #ea580c 100%);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(251, 133, 30, 0.25);
  }
  
  .feature-info {
    flex: 1;
    min-width: 0;
  }
  
  .feature-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 4px;
  }
  
  .feature-name {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }
  
  .feature-badges {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
  
  .badge {
    font-size: 0.75rem;
    padding: 6px 12px;
    border-radius: 8px;
    font-weight: 500;
  }
  
  .feature-entry {
    font-size: 0.8125rem;
    color: #64748b;
    margin: 0 0 8px 0;
    font-family: 'JetBrains Mono', monospace;
  }
  
  .entry-label {
    color: #fb851e;
    font-weight: 600;
  }
  
  .feature-description {
    font-size: 0.875rem;
    color: #475569;
    margin: 0;
    line-height: 1.6;
  }
  
  .feature-metrics {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
  }
  
  .metric-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #f1f5f9;
    padding: 6px 12px;
    border-radius: 20px;
  }
  
  .metric-num {
    font-weight: 700;
    color: #1e293b;
    font-size: 0.875rem;
  }
  
  .metric-txt {
    font-size: 0.6875rem;
    color: #64748b;
    text-transform: uppercase;
  }
  
  .expand-icon {
    color: #94a3b8;
    transition: transform 0.3s ease;
    flex-shrink: 0;
    margin-top: 14px;
  }
  
  .expand-icon.expanded {
    transform: rotate(180deg);
  }
  
  .feature-content {
    padding: 0 24px 24px;
    border-top: 1px solid #f1f5f9;
    display: none;
  }
  
  .feature-content.expanded {
    display: block;
    animation: slideDown 0.3s ease-out;
  }
  
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .content-section {
    padding-top: 20px;
  }
  
  .content-section.highlight {
    background: linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%);
    margin: 20px -24px 0;
    padding: 20px 24px;
    border-top: 1px solid #fed7aa;
    border-bottom: 1px solid #fed7aa;
  }
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0 0 12px 0;
  }
  
  .section-title svg {
    color: #fb851e;
  }
  
  .section-text {
    font-size: 0.9375rem;
    color: #334155;
    margin: 0;
    line-height: 1.7;
  }
  
  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .tag {
    font-size: 0.75rem;
    padding: 6px 12px;
    border-radius: 8px;
    font-weight: 500;
  }
  
  .tag.capability {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }
  
  .tag.entity {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }
  
  .tag.integration {
    background: #faf5ff;
    color: #7c3aed;
    border: 1px solid #ddd6fe;
  }
  
  .tag.role {
    background: #fdf4ff;
    color: #a21caf;
    border: 1px solid #f5d0fe;
  }
  
  .action-list {
    margin: 0;
    padding-left: 0;
    list-style: none;
  }
  
  .action-list li {
    position: relative;
    padding-left: 20px;
    font-size: 0.8125rem;
    color: #475569;
    line-height: 1.7;
    margin-bottom: 4px;
  }
  
  .action-list li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
  }
  
  .action-list.system li::before {
    background: #6366f1;
  }
  
  .content-columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
  }
  
  .sub-features-section {
    margin-top: 8px;
  }
  
  .section-title.large {
    font-size: 0.9375rem;
    color: #1e293b;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #e2e8f0;
  }
  
  .sub-features-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .sub-feature-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    overflow: hidden;
  }
  
  .sub-feature-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .sub-feature-header:hover {
    background: #f1f5f9;
  }
  
  .sub-icon {
    width: 32px;
    height: 32px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fb851e;
    flex-shrink: 0;
  }
  
  .sub-info {
    flex: 1;
    min-width: 0;
  }
  
  .sub-name {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
  }
  
  .sub-desc {
    font-size: 0.8125rem;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
  }
  
  .sub-badges {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
  
  .sub-feature-content {
    padding: 0 16px 16px;
    border-top: 1px solid #e2e8f0;
    background: white;
    display: none;
  }
  
  .sub-feature-content.expanded {
    display: block;
  }
  
  .controls {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    gap: 12px;
    z-index: 1000;
  }
  
  .btn {
    background: white;
    border: none;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.2s;
    color: #64748b;
  }
  
  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #fb851e 0%, #ea580c 100%);
    color: white;
  }
  
  @media print {
    body {
    background: white;
    padding: 0;
    }
    .controls {
    display: none;
    }
  }
  </style>
</head>
<body>
  <div class="container">
  <!-- Header -->
  <div class="header">
    <div class="header-content">
    <div class="header-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="12,2 2,7 12,12 22,7"/>
      <polyline points="2,17 12,22 22,17"/>
      <polyline points="2,12 12,17 22,12"/>
      </svg>
    </div>
    <div>
      <h1 class="header-title">${title}</h1>
      <p class="header-subtitle">
      Extracted <span class="timestamp">${extractionDate}</span> using ${escapeHtml(data?.metadata?.unified_extraction?.strategy_used || '')}
      </p>
    </div>
    </div>
  </div>
  
  <!-- Metrics Dashboard -->
  <div class="metrics-grid">
    <div class="metric-card accent">
    <div class="metric-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="12,2 2,7 12,12 22,7"/>
      <polyline points="2,17 12,22 22,17"/>
      <polyline points="2,12 12,17 22,12"/>
      </svg>
    </div>
    <div class="metric-content">
      <span class="metric-value">${data?.metrics?.total_features || 0}</span>
      <span class="metric-label">Features</span>
    </div>
    </div>
    <div class="metric-card">
    <div class="metric-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
      </svg>
    </div>
    <div class="metric-content">
      <span class="metric-value">${data?.metrics?.total_sub_features || 0}</span>
      <span class="metric-label">Sub-Features</span>
    </div>
    </div>
    <div class="metric-card">
    <div class="metric-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"/>
      </svg>
    </div>
    <div class="metric-content">
      <span class="metric-value">${data?.metrics?.total_functionalities || 0}</span>
      <span class="metric-label">Functionalities</span>
    </div>
    </div>
    <div class="metric-card">
    <div class="metric-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="16,18 22,12 16,6"/>
      <polyline points="8,6 2,12 8,18"/>
      </svg>
    </div>
    <div class="metric-content">
      <span class="metric-value">${data?.metrics?.total_nodes_processed || 0}</span>
      <span class="metric-label">Nodes Processed</span>
    </div>
    </div>
  </div>
  
  <!-- Traceability View -->
  <div class="traceability-view">
    <h3 class="trace-title">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
    Traceability Matrix
    </h3>
    <div class="trace-flow">
    <div class="trace-node">
      <div class="trace-count">${Object.keys(data?.traceability_map?.node_to_functionality || {}).length}</div>
      <div class="trace-label">Code Nodes</div>
    </div>
    <div style="color: #fb851e; font-size: 1.5rem;">→</div>
    <div class="trace-node">
      <div class="trace-count">${Object.keys(data?.traceability_map?.functionality_to_sub_feature || {}).length}</div>
      <div class="trace-label">Functionalities</div>
    </div>
    <div style="color: #fb851e; font-size: 1.5rem;">→</div>
    <div class="trace-node">
      <div class="trace-count">${Object.keys(data?.traceability_map?.sub_feature_to_feature || {}).length}</div>
      <div class="trace-label">Sub-Features</div>
    </div>
    <div style="color: #fb851e; font-size: 1.5rem;">→</div>
    <div class="trace-node accent">
      <div class="trace-count">${data?.metrics?.total_features || 0}</div>
      <div class="trace-label">Features</div>
    </div>
    </div>
  </div>
  
  <!-- Features List -->
  <div class="features-list">
    ${ (data?.domain_features || []).map((feature, featureIdx) => {
    const priorityConfig = priorityColors[feature.priority || ''] || priorityColors.medium;
    const complexityConfig = complexityColors[feature.complexity || ''] || complexityColors.moderate;
    
    return `
      <div class="feature-card">
      <div class="feature-header" onclick="toggleFeature(${featureIdx})">
        <div class="feature-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12,2 2,7 12,12 22,7"/>
          <polyline points="2,17 12,22 22,17"/>
          <polyline points="2,12 12,17 22,12"/>
        </svg>
        </div>
        <div class="feature-info">
        <div class="feature-title-row">
          <h3 class="feature-name">${escapeHtml(feature.name || '')}</h3>
          <div class="feature-badges">
          <span class="badge" style="color: ${priorityConfig.color}; background-color: ${priorityConfig.bgColor};">
            ${priorityConfig.label}
          </span>
          <span class="badge" style="color: ${complexityConfig.color}; background-color: ${complexityConfig.bgColor};">
            ${complexityConfig.label}
          </span>
          </div>
        </div>
        <p class="feature-entry">
          <span class="entry-label">Entry:</span> ${escapeHtml(feature.entry_point_name || '')}
        </p>
        <p class="feature-description">${escapeHtml(feature.description || '')}</p>
        </div>
        <div class="feature-metrics">
        <div class="metric-pill">
          <span class="metric-num">${(feature.sub_features || []).length}</span>
          <span class="metric-txt">Sub-features</span>
        </div>
        <div class="metric-pill">
          <span class="metric-num">${feature.metrics?.total_nodes || 0}</span>
          <span class="metric-txt">Nodes</span>
        </div>
        </div>
        <div class="expand-icon" id="icon-${featureIdx}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
        </div>
      </div>
      
      <div class="feature-content" id="content-${featureIdx}">
        <div class="content-section highlight">
        <h4 class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          Business Value
        </h4>
        <p class="section-text">${escapeHtml(feature.business_value || '')}</p>
        </div>
        
        ${ (feature.capabilities || []).length > 0 ? `
        <div class="content-section">
          <h4 class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
          Capabilities
          </h4>
          <div class="tags-list">
          ${(feature.capabilities || []).map(cap => `<span class="tag capability">${escapeHtml(cap)}</span>`).join('')}
          </div>
        </div>
        ` : ''}
        
        ${ (feature.user_actions || []).length > 0 || (feature.system_actions || []).length > 0 ? `
        <div class="content-columns">
          ${(feature.user_actions || []).length > 0 ? `
          <div class="content-section">
            <h4 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            User Actions
            </h4>
            <ul class="action-list">
            ${(feature.user_actions || []).map(action => `<li>${escapeHtml(action)}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          ${(feature.system_actions || []).length > 0 ? `
          <div class="content-section">
            <h4 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            System Actions
            </h4>
            <ul class="action-list system">
            ${(feature.system_actions || []).map(action => `<li>${escapeHtml(action)}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
        ` : ''}
        
        ${ (feature.data_entities || []).length > 0 || (feature.integration_points || []).length > 0 ? `
        <div class="content-columns">
          ${(feature.data_entities || []).length > 0 ? `
          <div class="content-section">
            <h4 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
            Data Entities
            </h4>
            <div class="tags-list">
            ${(feature.data_entities || []).map(entity => `<span class="tag entity">${escapeHtml(entity)}</span>`).join('')}
            </div>
          </div>
          ` : ''}
          ${(feature.integration_points || []).length > 0 ? `
          <div class="content-section">
            <h4 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="4"/>
              <line x1="1.05" y1="12" x2="7" y2="12"/>
              <line x1="17.01" y1="12" x2="22.96" y2="12"/>
            </svg>
            Integration Points
            </h4>
            <div class="tags-list">
            ${(feature.integration_points || []).map(point => `<span class="tag integration">${escapeHtml(point)}</span>`).join('')}
            </div>
          </div>
          ` : ''}
        </div>
        ` : ''}
        
        ${ (feature.sub_features || []).length > 0 ? `
        <div class="sub-features-section">
          <h4 class="section-title large">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          Sub-Features (${(feature.sub_features || []).length})
          </h4>
          <div class="sub-features-list">
          ${(feature.sub_features || []).map((subFeature, subIdx) => {
            const subPriorityConfig = priorityColors[subFeature.priority || ''] || priorityColors.medium;
            const subComplexityConfig = complexityColors[subFeature.complexity || ''] || complexityColors.moderate;
            
            return `
            <div class="sub-feature-card">
              <div class="sub-feature-header" onclick="toggleSubFeature(${featureIdx}, ${subIdx})">
              <div class="sub-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                </svg>
              </div>
              <div class="sub-info">
                <h5 class="sub-name">${escapeHtml(subFeature.name || '')}</h5>
                <p class="sub-desc">${escapeHtml(subFeature.description || '')}</p>
              </div>
              <div class="sub-badges">
                <span class="badge" style="color: ${subPriorityConfig.color}; background-color: ${subPriorityConfig.bgColor}; font-size: 0.6875rem; padding: 4px 8px;">
                ${subPriorityConfig.label}
                </span>
                <span class="badge" style="color: ${subComplexityConfig.color}; background-color: ${subComplexityConfig.bgColor}; font-size: 0.6875rem; padding: 4px 8px;">
                ${subComplexityConfig.label}
                </span>
              </div>
              <div class="expand-icon" id="sub-icon-${featureIdx}-${subIdx}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6,9 12,15 18,9"/>
                </svg>
              </div>
              </div>
              <div class="sub-feature-content" id="sub-content-${featureIdx}-${subIdx}">
              <div class="content-section">
                <h4 class="section-title" style="font-size: 0.6875rem;">Business Value</h4>
                <p style="font-size: 0.8125rem; color: #475569; line-height: 1.6;">${escapeHtml(subFeature.business_value || '')}</p>
              </div>
              ${(subFeature.functionalities || []).length > 0 ? `
                <div class="content-section">
                <h4 class="section-title" style="font-size: 0.6875rem;">Functionalities (${(subFeature.functionalities || []).length})</h4>
                ${(subFeature.functionalities || []).map(func => `
                  <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px;">
                  <div style="font-size: 0.8125rem; font-weight: 600; color: #1e293b; margin-bottom: 4px;">${escapeHtml(func.name || '')}</div>
                  <div style="font-size: 0.75rem; color: #64748b;">${escapeHtml(func.description || '')}</div>
                  </div>
                `).join('')}
                </div>
              ` : ''}
              </div>
            </div>
            `;
          }).join('')}
          </div>
        </div>
        ` : ''}
      </div>
      </div>
    `;
    }).join('')}
  </div>
  </div>
  
  <div class="controls">
  <button class="btn" onclick="expandAll()">Expand All</button>
  <button class="btn" onclick="collapseAll()">Collapse All</button>
  <button class="btn btn-primary" onclick="window.print()">🖨️ Print</button>
  </div>
  
  <script>
  function toggleFeature(idx) {
    const content = document.getElementById('content-' + idx);
    const icon = document.getElementById('icon-' + idx);
    
    if (content.classList.contains('expanded')) {
    content.classList.remove('expanded');
    icon.classList.remove('expanded');
    } else {
    content.classList.add('expanded');
    icon.classList.add('expanded');
    }
  }
  
  function toggleSubFeature(featureIdx, subIdx) {
    const content = document.getElementById('sub-content-' + featureIdx + '-' + subIdx);
    const icon = document.getElementById('sub-icon-' + featureIdx + '-' + subIdx);
    
    if (content.classList.contains('expanded')) {
    content.classList.remove('expanded');
    icon.classList.remove('expanded');
    } else {
    content.classList.add('expanded');
    icon.classList.add('expanded');
    }
  }
  
  function expandAll() {
    document.querySelectorAll('.feature-content').forEach(el => {
    el.classList.add('expanded');
    });
    document.querySelectorAll('.feature-header .expand-icon').forEach(el => {
    el.classList.add('expanded');
    });
  }
  
  function collapseAll() {
    document.querySelectorAll('.feature-content').forEach(el => {
    el.classList.remove('expanded');
    });
    document.querySelectorAll('.expand-icon').forEach(el => {
    el.classList.remove('expanded');
    });
  }
  </script>
</body>
</html>`;

  // Download as file
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Hierarchical_Feature_Analysis_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  };

  return (
  <div className="feature-tree-container">
    {/* Header */}
    <div className="header">
    <div className="header-content">
      <div className="header-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,2 2,7 12,12 22,7"/>
        <polyline points="2,17 12,22 22,17"/>
        <polyline points="2,12 12,17 22,12"/>
      </svg>
      </div>
      <div>
      <h1 className="header-title">{title}</h1>
      <p className="header-subtitle">
        Extracted <span className="timestamp">{extractionDate}</span> using {data?.metadata?.unified_extraction?.strategy_used}
      </p>
      </div>
    </div>
    </div>

    {/* Metrics Dashboard */}
    <MetricsDashboard data={data} />

    {/* Traceability View */}
    <TraceabilityView data={data} />

    {/* Features Section */}
    <div className="features-section">
    <div className="features-header">
      <h2 className="features-title">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,2 2,7 12,12 22,7"/>
        <polyline points="2,17 12,22 22,17"/>
        <polyline points="2,12 12,17 22,12"/>
      </svg>
      Domain Features
      <span className="features-count">{filteredFeatures?.length}</span>
      </h2>
      
      <div className="features-actions">
      <div className="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
        type="text"
        placeholder="Search features..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <select 
        className="filter-select"
        value={filterPriority}
        onChange={(e) => setFilterPriority(e.target.value)}
      >
        <option value="all">All Priorities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <button className="export-btn" onClick={exportToHTML} title="Export to Interactive HTML">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
        </svg>
        Export HTML
      </button>
      <button className="action-btn" onClick={expandAll}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15,3 21,3 21,9"/>
        <polyline points="9,21 3,21 3,15"/>
        <line x1="21" y1="3" x2="14" y2="10"/>
        <line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
        Expand
      </button>
      <button className="action-btn" onClick={collapseAll}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4,14 10,14 10,20"/>
        <polyline points="20,10 14,10 14,4"/>
        <line x1="14" y1="10" x2="21" y2="3"/>
        <line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
        Collapse
      </button>
      </div>
    </div>

    <div className="features-list">
      {filteredFeatures?.map((feature) => (
      <FeatureCard
        key={feature.feature_id}
        feature={feature}
        isExpanded={expandedFeatures.has(feature.feature_id)}
        onToggle={() => toggleFeature(feature.feature_id)}
      />
      ))}
    </div>
    </div>

    {/* Shared Utilities */}
    {data?.shared_utilities && (
    <div className="shared-utilities">
      <h3 className="shared-title">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      {data.shared_utilities.name}
      </h3>
      <p className="shared-desc">{data.shared_utilities.description}</p>
      <div className="shared-stats">
      <div className="shared-stat">
        <span className="stat-value">{data.shared_utilities.total_shared_nodes}</span>
        <span className="stat-label">Shared Nodes</span>
      </div>
      <div className="shared-stat">
        <span className="stat-value">{data.shared_utilities.avg_reference_count.toFixed(1)}</span>
        <span className="stat-label">Avg References</span>
      </div>
      </div>
    </div>
    )}

    <style>{`
    .feature-tree-container {
      min-height: 100vh;
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      padding: 32px;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .header {
      margin-bottom: 32px;
    }
    .header-content {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .header-icon {
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, #fb851e 0%, #ea580c 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 8px 24px rgba(251, 133, 30, 0.3);
    }
    .header-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 4px 0;
    }
    .header-subtitle {
      font-size: 0.9375rem;
      color: #64748b;
      margin: 0;
    }
    .timestamp {
      color: #fb851e;
      font-weight: 500;
    }
    .features-section {
      margin-top: 8px;
    }
    .features-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
    }
    .features-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .features-title svg {
      color: #fb851e;
    }
    .features-count {
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, #fb851e 0%, #ea580c 100%);
      padding: 4px 12px;
      border-radius: 20px;
    }
    .features-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 16px;
      color: #94a3b8;
    }
    .search-box input {
      background: none;
      border: none;
      outline: none;
      color: #1e293b;
      font-size: 0.875rem;
      width: 180px;
    }
    .search-box input::placeholder {
      color: #94a3b8;
    }
    .filter-select {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 16px;
      font-size: 0.875rem;
      color: #475569;
      cursor: pointer;
      outline: none;
    }
    .filter-select:focus {
      border-color: #fb851e;
    }
    .export-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #fcd34d;
      border-radius: 12px;
      padding: 10px 16px;
      color: #92400e;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .export-btn:hover {
      background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
      border-color: #fbbf24;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
    }
    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 16px;
      color: #64748b;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .action-btn:hover {
      border-color: #fb851e;
      color: #fb851e;
    }
    .features-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .shared-utilities {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 24px;
      margin-top: 32px;
    }
    .shared-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 8px 0;
    }
    .shared-title svg {
      color: #fb851e;
    }
    .shared-desc {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0 0 16px 0;
    }
    .shared-stats {
      display: flex;
      gap: 24px;
    }
    .shared-stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #fb851e;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    @media (max-width: 768px) {
      .feature-tree-container {
      padding: 16px;
      }
      .features-header {
      flex-direction: column;
      align-items: stretch;
      }
      .features-actions {
      flex-wrap: wrap;
      }
      .search-box {
      flex: 1;
      }
      .search-box input {
      width: 100%;
      }
    }
    `}</style>
  </div>
  );
};

export default HierarchicalFeatureAnalysis;