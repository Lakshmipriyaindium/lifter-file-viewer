'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from 'recharts';
import {
  Search,
  Download,
  Filter,
  ChevronDown,
  ChevronRight,
  Package,
  Layers,
  FileCode,
  Code2,
  Database,
  Globe,
  Building2,
  TrendingUp,
  BarChart3,
  PieChartIcon,
  FolderTree,
  X,
  SortAsc,
  SortDesc,
} from 'lucide-react';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface AnalysisMetadata {
  generated_at: string;
  analysis_version: string;
}

interface ExecutiveSummary {
  total_projects: number;
  total_files_analyzed: number;
  unique_languages: number;
  unique_domains: number;
  unique_features: number;
}

interface ProjectDomains {
  [domain: string]: number;
}

interface ProjectLanguages {
  [language: string]: number;
}

interface ProjectDetail {
  name: string;
  files: number;
  size_category: 'small' | 'medium' | 'large' | 'xlarge';
  primary_language: string;
  primary_domain: string;
  domains: ProjectDomains;
  languages: ProjectLanguages;
}

interface ProjectSizeDistribution {
  small: number;
  medium: number;
  large: number;
  xlarge: number;
}

export interface BusinessMetricsData {
  analysis_metadata: AnalysisMetadata;
  executive_summary: ExecutiveSummary;
  language_distribution: Record<string, number>;
  domain_distribution: Record<string, number>;
  feature_distribution: Record<string, number>;
  project_size_distribution: ProjectSizeDistribution;
  top_20_largest_projects: ProjectDetail[];
  all_projects: ProjectDetail[];
}

export interface BusinessMetricsProps {
  data: BusinessMetricsData;
}

// ============================================================================
// Color Palettes
// ============================================================================

const COLORS = {
  primary: '#fb851e',
  secondary: '#8b5cf6',
  accent: '#ff6b35',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
};

// const BRAND_COLOR = '#fb851e';

const CHART_COLORS = [
  '#fb851e', // Brand Orange
  '#ff6b35', // Orange variant
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#10b981', // Green
  '#f7931e', // Amber Orange
  '#ef4444', // Red
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#84cc16', // Lime
  '#14b8a6', // Teal
  '#a855f7', // Violet
];

const LANGUAGE_COLORS: Record<string, string> = {
  csharp: '#178600',
  visualbasic: '#945db7',
  java: '#b07219',
  c: '#555555',
  javascript: '#f1e05a',
  typescript: '#3178c6',
  sql: '#e38c00',
  aspnet: '#512bd4',
  php: '#4F5D95',
  markdown: '#083fa1',
  wcf: '#6a5acd',
  unknown: '#9ca3af',
};

const SIZE_COLORS: Record<string, string> = {
  small: '#10b981',
  medium: '#fb851e',
  large: '#f59e0b',
  xlarge: '#ef4444',
};

// ============================================================================
// Helper Components
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, color = '#fb851e', trend }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ backgroundColor: `${color}15`, color }}>
      {icon}
    </div>
    <div className="stat-content">
      <p className="stat-title">{title}</p>
      <p className="stat-value" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {subtitle && <p className="stat-subtitle">{subtitle}</p>}
      {trend !== undefined && (
        <div className={`stat-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          <TrendingUp size={14} />
          <span>{trend >= 0 ? '+' : ''}{trend}%</span>
        </div>
      )}
    </div>
    <style jsx>{`
      .stat-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 24px;
        display: flex;
        align-items: flex-start;
        gap: 16px;
        transition: all 0.3s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        border-color: ${color}40;
      }
      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .stat-content {
        flex: 1;
        min-width: 0;
      }
      .stat-title {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0 0 4px 0;
        font-weight: 500;
      }
      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        margin: 0;
        line-height: 1.2;
      }
      .stat-subtitle {
        font-size: 0.75rem;
        color: #9ca3af;
        margin: 4px 0 0 0;
      }
      .stat-trend {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 6px;
        margin-top: 8px;
      }
      .stat-trend.positive {
        background: #dcfce7;
        color: #16a34a;
      }
      .stat-trend.negative {
        background: #fee2e2;
        color: #dc2626;
      }
    `}</style>
  </div>
);

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, icon, children, actions }) => (
  <div className="chart-card">
    <div className="chart-header">
      <div className="chart-title-section">
        {icon && <div className="chart-icon">{icon}</div>}
        <div>
          <h3 className="chart-title">{title}</h3>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="chart-actions">{actions}</div>}
    </div>
    <div className="chart-content">{children}</div>
    <style jsx>{`
      .chart-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .chart-header {
        padding: 20px 24px;
        border-bottom: 1px solid #f3f4f6;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }
      .chart-title-section {
        display: flex;
        align-items: center;
        gap: 12px;
      }
        .chart-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #fb851e 0%, #ff6b35 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
      .chart-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }
      .chart-subtitle {
        font-size: 0.8125rem;
        color: #6b7280;
        margin: 4px 0 0 0;
      }
      .chart-actions {
        display: flex;
        gap: 8px;
      }
      .chart-content {
        padding: 24px;
      }
    `}</style>
  </div>
);

interface FilterBadgeProps {
  label: string;
  onRemove: () => void;
}

const FilterBadge: React.FC<FilterBadgeProps> = ({ label, onRemove }) => (
  <span className="filter-badge">
    {label}
    <button onClick={onRemove} className="filter-remove">
      <X size={12} />
    </button>
    <style jsx>{`
      .filter-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #fff7ed;
        color: #c2410c;
        font-size: 0.75rem;
        font-weight: 500;
        padding: 4px 8px 4px 12px;
        border-radius: 20px;
      }
      .filter-remove {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        background: #fb851e;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        transition: background 0.2s;
      }
      .filter-remove:hover {
        background: #ea580c;
      }
    `}</style>
  </span>
);

// ============================================================================
// Custom Tooltip Components
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; payload?: Record<string, unknown> }>;
  label?: string;
}

const CustomBarTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="tooltip-label">{label}</p>
      <p className="tooltip-value">
        <span className="tooltip-number">{payload[0].value.toLocaleString()}</span>
        <span className="tooltip-suffix"> files</span>
      </p>
      <style jsx>{`
        .custom-tooltip {
          background: rgba(17, 24, 39, 0.95);
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
        .tooltip-label {
          color: #9ca3af;
          font-size: 0.75rem;
          margin: 0 0 4px 0;
          text-transform: capitalize;
        }
        .tooltip-value {
          margin: 0;
          color: white;
        }
        .tooltip-number {
          font-size: 1.25rem;
          font-weight: 700;
        }
        .tooltip-suffix {
          font-size: 0.875rem;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const BusinessMetricsAnalysis: React.FC<BusinessMetricsProps> = ({ data: rawData }) => {
  const data = useMemo(() => ({
    analysis_metadata: rawData?.analysis_metadata || { generated_at: new Date().toISOString(), analysis_version: '1.0' },
    executive_summary: rawData?.executive_summary || { total_projects: 0, total_files_analyzed: 0, unique_languages: 0, unique_domains: 0, unique_features: 0 },
    language_distribution: rawData?.language_distribution || {},
    domain_distribution: rawData?.domain_distribution || {},
    feature_distribution: rawData?.feature_distribution || {},
    project_size_distribution: rawData?.project_size_distribution || { small: 0, medium: 0, large: 0, xlarge: 0 },
    top_20_largest_projects: rawData?.top_20_largest_projects || [],
    all_projects: rawData?.all_projects || []
  }), [rawData]);
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'languages' | 'domains' | 'projects'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'name' | 'files'>('files');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  // Computed data
  const languageChartData = useMemo(() => {
    return Object.entries(data.language_distribution)
      .map(([name, value]) => ({ name, value, color: LANGUAGE_COLORS[name] || '#9ca3af' }))
      .sort((a, b) => b.value - a.value);
  }, [data.language_distribution]);

  // Domains/features to exclude from charts
  const CHART_EXCLUDED_ITEMS = ['Utility', 'Helper Functions'];

  const domainChartData = useMemo(() => {
    return Object.entries(data.domain_distribution)
      .filter(([name]) => !CHART_EXCLUDED_ITEMS.includes(name))
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data.domain_distribution]);

  const featureChartData = useMemo(() => {
    return Object.entries(data.feature_distribution)
      .filter(([name]) => !CHART_EXCLUDED_ITEMS.includes(name))
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [data.feature_distribution]);

  const sizeChartData = useMemo(() => {
    return Object.entries(data.project_size_distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: SIZE_COLORS[name],
    }));
  }, [data.project_size_distribution]);

  const treemapData = useMemo(() => {
    const filteredDomains = Object.entries(data.domain_distribution)
      .filter(([name]) => !CHART_EXCLUDED_ITEMS.includes(name))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12);
    return {
      name: 'Domains',
      children: filteredDomains.map(([name, value], idx) => ({
        name,
        size: value,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      })),
    };
  }, [data.domain_distribution]);

  const filteredProjects = useMemo(() => {
    let projects = [...data.all_projects];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      projects = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.primary_domain.toLowerCase().includes(query) ||
          p.primary_language.toLowerCase().includes(query)
      );
    }

    // Domain filter
    if (selectedDomains.size > 0) {
      projects = projects.filter((p) => selectedDomains.has(p.primary_domain));
    }

    // Language filter
    if (selectedLanguages.size > 0) {
      projects = projects.filter((p) => selectedLanguages.has(p.primary_language));
    }

    // Size filter
    if (selectedSizes.size > 0) {
      projects = projects.filter((p) => selectedSizes.has(p.size_category));
    }

    // Sort
    projects.sort((a, b) => {
      const aVal = sortField === 'name' ? a.name.toLowerCase() : a.files;
      const bVal = sortField === 'name' ? b.name.toLowerCase() : b.files;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return projects;
  }, [data.all_projects, searchQuery, selectedDomains, selectedLanguages, selectedSizes, sortField, sortDirection]);

  // Domains/features to exclude from visualizations
  const EXCLUDED_ITEMS = ['Utility', 'Helper Functions'];

  const uniqueDomains = useMemo(
    () => [...new Set(data.all_projects.map((p) => p.primary_domain))]
      .filter((d): d is string => d != null && !EXCLUDED_ITEMS.includes(d))
      .sort((a, b) => a.localeCompare(b)),
    [data.all_projects]
  );

  const uniqueLanguages = useMemo(
    () => [...new Set(data.all_projects.map((p) => p.primary_language))]
      .filter((l): l is string => l != null)
      .sort((a, b) => a.localeCompare(b)),
    [data.all_projects]
  );

  // Handlers
  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(lang)) {
        next.delete(lang);
      } else {
        next.add(lang);
      }
      return next;
    });
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => {
      const next = new Set(prev);
      if (next.has(size)) {
        next.delete(size);
      } else {
        next.add(size);
      }
      return next;
    });
  };

  const clearAllFilters = () => {
    setSelectedDomains(new Set());
    setSelectedLanguages(new Set());
    setSelectedSizes(new Set());
    setSearchQuery('');
  };

  const exportToCSV = () => {
    const headers = ['Project Name', 'Files', 'Size Category', 'Primary Language', 'Primary Domain'];
    const rows = filteredProjects.map((p) => [
      p.name,
      p.files.toString(),
      p.size_category,
      p.primary_language,
      p.primary_domain,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `business_metrics_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportToHTML = async () => {
    // Load and convert logo to base64
    const loadLogoAsBase64 = async (logoPath: string): Promise<string> => {
      try {
        const response = await fetch(logoPath);
        if (!response.ok) {
          return '';
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.warn('Failed to load logo image:', error);
        return '';
      }
    };

    // Load both logos
    const logoLightBase64 = await loadLogoAsBase64('/assets/logo-light.png');
    const faviconBase64 = await loadLogoAsBase64('/favicon-3.webp');
    
    const createLogoImg = (base64: string, alt: string, height: string = '48px', width: string = '48px') => {
      if (base64) {
        return `<img src="${base64}" alt="${alt}" style="width: ${width}; height: ${height}; flex-shrink: 0; object-fit: contain; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; display: block;">`;
      }
      return '';
    };

    const logoLightImg = createLogoImg(logoLightBase64, 'Liftr.ai Logo', '70px', '70px');
    const faviconImg = createLogoImg(faviconBase64, 'Liftr.ai Favicon', '20px', '20px');
    
    const logoImgTag = logoLightImg && faviconImg
      ? `${logoLightImg}<div style="width: 1px; height: 24px; background-color: #9ca3af; margin: 0 12px; align-self: center;"></div>${faviconImg}`
      : logoLightImg || faviconImg || '';

    // Get current state
    const exportData = {
      ...data,
      currentState: {
        activeTab,
        searchQuery,
        selectedDomains: Array.from(selectedDomains),
        selectedLanguages: Array.from(selectedLanguages),
        selectedSizes: Array.from(selectedSizes),
        sortField,
        sortDirection,
      },
    };

    // Create a standalone HTML export with Tailwind CSS and Lucide icons
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Business Metrics Dashboard - Export</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/prop-types/prop-types.min.js"></script>
  <script src="https://unpkg.com/recharts@1.6.2/umd/Recharts.js"></script>
  <style>
    body {
      position: relative;
      min-height: 100vh;
      margin: 0;
      padding: 0;
    }
    #root {
      min-height: 100vh;
      padding-bottom: 60px;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // Wait for all libraries to load
    function initApp() {
      // Check if all required libraries are loaded
      if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
        setTimeout(initApp, 100);
        return;
      }
      
      // Access React and ReactDOM from global scope
      const { useState, useMemo, createElement: h, Fragment } = React;
      const { createRoot } = ReactDOM;
      
      // Access Recharts - version 1.8.5 UMD exposes it as window.Recharts
      let RechartsLib = null;
      
      // Check various possible global names
      if (typeof Recharts !== 'undefined') {
        RechartsLib = Recharts;
      } else if (window.Recharts) {
        RechartsLib = window.Recharts;
      }
      
      // If Recharts still not found, wait a bit more and try again (max 5 seconds)
      if (!RechartsLib) {
        const retryCount = window._rechartsRetryCount || 0;
        if (retryCount < 50) {
          window._rechartsRetryCount = retryCount + 1;
          setTimeout(initApp, 100);
          return;
        } else {
          // Show error after max retries
          document.getElementById('root').innerHTML = 
            '<div class="p-10 text-center text-red-500">' +
            '<h2 class="text-2xl font-bold mb-4">Error Loading Dashboard</h2>' +
            '<p>Recharts library failed to load. Please check your internet connection and try again.</p>' +
            '<p class="text-xs text-gray-600 mt-5">If the problem persists, the Recharts CDN may be unavailable.</p>' +
            '</div>';
          return;
        }
      }
      
      // Reset retry counter on success
      window._rechartsRetryCount = 0;
      
      // Extract Recharts components - Recharts 1.8.5 UMD exposes components directly
      const { 
        BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
        Tooltip, Legend, ResponsiveContainer, Treemap, RadarChart, PolarGrid,
        PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area
      } = RechartsLib;

    const COLORS = {
      primary: '#fb851e',
      secondary: '#8b5cf6',
      accent: '#ff6b35',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#06b6d4',
    };

    const CHART_COLORS = [
      '#fb851e', '#ff6b35', '#8b5cf6', '#06b6d4', '#10b981', '#f7931e',
      '#ef4444', '#ec4899', '#6366f1', '#84cc16', '#14b8a6', '#a855f7',
    ];

    const LANGUAGE_COLORS = {
      csharp: '#178600',
      visualbasic: '#945db7',
      java: '#b07219',
      c: '#555555',
      javascript: '#f1e05a',
      typescript: '#3178c6',
      sql: '#e38c00',
      aspnet: '#512bd4',
      php: '#4F5D95',
      markdown: '#083fa1',
      wcf: '#6a5acd',
      unknown: '#9ca3af',
    };

    const SIZE_COLORS = {
      small: '#10b981',
      medium: '#fb851e',
      large: '#f59e0b',
      xlarge: '#ef4444',
    };

    const CHART_EXCLUDED_ITEMS = ['Utility', 'Helper Functions'];

    const data = ${JSON.stringify(exportData, null, 2).replace(/</g, '\\u003c')};

    // Icon path data mapping for Lucide icons (simplified SVG paths)
    const iconPaths = {
      BarChart3: [
        h('path', { key: '1', d: 'M3 3v18h18' }),
        h('path', { key: '2', d: 'M18 17V9' }),
        h('path', { key: '3', d: 'M13 17V5' }),
        h('path', { key: '4', d: 'M8 17v-3' })
      ],
      Package: [
        h('path', { key: '1', d: 'M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 10z' }),
        h('path', { key: '2', d: 'M3.29 7 12 12l8.71-5' }),
        h('path', { key: '3', d: 'M12 22V12' })
      ],
      FileCode: [
        h('path', { key: '1', d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' }),
        h('polyline', { key: '2', points: '14 2 14 8 20 8' }),
        h('path', { key: '3', d: 'm10 13-2 2 2 2' }),
        h('path', { key: '4', d: 'm14 17 2-2-2-2' })
      ],
      Layers: [
        h('path', { key: '1', d: 'm12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z' }),
        h('path', { key: '2', d: 'm22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65' }),
        h('path', { key: '3', d: 'm22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65' })
      ],
      Building2: [
        h('path', { key: '1', d: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z' }),
        h('path', { key: '2', d: 'M6 12h12' }),
        h('path', { key: '3', d: 'M6 18h12' }),
        h('path', { key: '4', d: 'M6 6h12' }),
        h('path', { key: '5', d: 'M10 8h.01' }),
        h('path', { key: '6', d: 'M10 14h.01' }),
        h('path', { key: '7', d: 'M14 8h.01' }),
        h('path', { key: '8', d: 'M14 14h.01' })
      ],
      Code2: [
        h('path', { key: '1', d: 'm18 16 4-4-4-4' }),
        h('path', { key: '2', d: 'm6 8-4 4 4 4' }),
        h('path', { key: '3', d: 'm14.5 4-5 16' })
      ],
      Globe: [
        h('circle', { key: '1', cx: '12', cy: '12', r: '10' }),
        h('path', { key: '2', d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' }),
        h('path', { key: '3', d: 'M2 12h20' })
      ],
      Database: [
        h('ellipse', { key: '1', cx: '12', cy: '5', rx: '9', ry: '3' }),
        h('path', { key: '2', d: 'M21 12c0 1.66-4 3-9 3s-9-1.34-9-3' }),
        h('path', { key: '3', d: 'M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5' })
      ],
      ChevronDown: [
        h('path', { key: '1', d: 'm6 9 6 6 6-6' })
      ],
      ChevronRight: [
        h('path', { key: '1', d: 'm9 18 6-6-6-6' })
      ],
      X: [
        h('path', { key: '1', d: 'M18 6 6 18' }),
        h('path', { key: '2', d: 'm6 6 12 12' })
      ],
      PieChartIcon: [
        h('path', { key: '1', d: 'M21.21 15.89A10 10 0 1 1 8 2.83' }),
        h('path', { key: '2', d: 'M22 12A10 10 0 0 0 12 2v10z' })
      ],
      FolderTree: [
        h('path', { key: '1', d: 'M13 10h7a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5' }),
        h('path', { key: '2', d: 'M13 10v3a1 1 0 0 1-1 1H9' }),
        h('path', { key: '3', d: 'M13 7v3' })
      ]
    };

    // Helper function to create Lucide icons as SVG elements
    function createLucideIcon(iconName, size = 24, className = '') {
      try {
        const paths = iconPaths[iconName];
        if (!paths) {
          return h('svg', {
            width: size,
            height: size,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 2,
            className: className,
            'aria-hidden': 'true'
          });
        }
        
        return h('svg', {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          className: className,
          'aria-hidden': 'true'
        }, paths);
      } catch (error) {
        console.warn('Error creating icon:', iconName, error);
        return h('svg', {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          className: className,
          'aria-hidden': 'true'
        });
      }
    }

    function StatCard({ icon, title, value, subtitle, color = '#fb851e' }) {
      return h('div', { className: 'bg-white border border-gray-200 rounded-2xl p-6 flex items-start gap-4 transition-all hover:shadow-lg hover:-translate-y-1' },
        h('div', { className: 'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0', style: { backgroundColor: color + '15', color } }, icon),
        h('div', { className: 'flex-1 min-w-0' },
          h('p', { className: 'text-sm text-gray-600 mb-1 font-medium' }, title),
          h('p', { className: 'text-3xl font-bold', style: { color } }, 
            typeof value === 'number' ? value.toLocaleString() : value
          ),
          subtitle && h('p', { className: 'text-xs text-gray-400 mt-1' }, subtitle)
        )
      );
    }

    function ChartCard({ title, subtitle, icon, children }) {
      return h('div', { className: 'bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm' },
        h('div', { className: 'px-6 py-5 border-b border-gray-100 flex justify-between items-center flex-wrap gap-3' },
          h('div', { className: 'flex items-center gap-3' },
            icon && h('div', { className: 'w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white' }, icon),
            h('div', null,
              h('h3', { className: 'text-lg font-bold text-gray-800 m-0' }, title),
              subtitle && h('p', { className: 'text-sm text-gray-600 mt-1 mb-0' }, subtitle)
            )
          )
        ),
        h('div', { className: 'p-6' }, children)
      );
    }

    function CustomBarTooltip({ active, payload, label }) {
      if (!active || !payload?.length) return null;
      return h('div', { className: 'bg-gray-900 bg-opacity-95 p-3 rounded-lg border border-white border-opacity-10 shadow-xl' },
        h('p', { className: 'text-gray-400 text-xs mb-1 capitalize' }, label),
        h('p', { className: 'text-white m-0' },
          h('span', { className: 'text-xl font-bold' }, payload[0].value.toLocaleString()),
          h('span', { className: 'text-sm text-gray-400 ml-1' }, ' files')
        )
      );
    }

    function BusinessMetricsAnalysis() {
      const [activeTab, setActiveTab] = useState(data.currentState?.activeTab || 'overview');
      const [searchQuery, setSearchQuery] = useState(data.currentState?.searchQuery || '');
      const [selectedDomains, setSelectedDomains] = useState(new Set(data.currentState?.selectedDomains || []));
      const [selectedLanguages, setSelectedLanguages] = useState(new Set(data.currentState?.selectedLanguages || []));
      const [selectedSizes, setSelectedSizes] = useState(new Set(data.currentState?.selectedSizes || []));
      const [sortField, setSortField] = useState(data.currentState?.sortField || 'files');
      const [sortDirection, setSortDirection] = useState(data.currentState?.sortDirection || 'desc');
      const [expandedProject, setExpandedProject] = useState(null);

      const languageChartData = useMemo(() => {
        return Object.entries(data.language_distribution)
          .map(([name, value]) => ({ name, value, color: LANGUAGE_COLORS[name] || '#9ca3af' }))
          .sort((a, b) => b.value - a.value);
      }, []);

      const domainChartData = useMemo(() => {
        return Object.entries(data.domain_distribution)
          .filter(([name]) => !CHART_EXCLUDED_ITEMS.includes(name))
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
      }, []);

      const featureChartData = useMemo(() => {
        return Object.entries(data.feature_distribution)
          .filter(([name]) => !CHART_EXCLUDED_ITEMS.includes(name))
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 15);
      }, []);

      const sizeChartData = useMemo(() => {
        return Object.entries(data.project_size_distribution).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: SIZE_COLORS[name],
        }));
      }, []);

      const treemapData = useMemo(() => {
        const filteredDomains = Object.entries(data.domain_distribution)
          .filter(([name]) => !CHART_EXCLUDED_ITEMS.includes(name))
          .sort(([, a], [, b]) => b - a)
          .slice(0, 12);
        return {
          name: 'Domains',
          children: filteredDomains.map(([name, value], idx) => ({
            name,
            size: value,
            color: CHART_COLORS[idx % CHART_COLORS.length],
          })),
        };
      }, []);

      const filteredProjects = useMemo(() => {
        let projects = [...data.all_projects];
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          projects = projects.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.primary_domain.toLowerCase().includes(query) ||
            p.primary_language.toLowerCase().includes(query)
          );
        }
        if (selectedDomains.size > 0) {
          projects = projects.filter(p => selectedDomains.has(p.primary_domain));
        }
        if (selectedLanguages.size > 0) {
          projects = projects.filter(p => selectedLanguages.has(p.primary_language));
        }
        if (selectedSizes.size > 0) {
          projects = projects.filter(p => selectedSizes.has(p.size_category));
        }
        projects.sort((a, b) => {
          const aVal = sortField === 'name' ? a.name.toLowerCase() : a.files;
          const bVal = sortField === 'name' ? b.name.toLowerCase() : b.files;
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
          }
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });
        return projects;
      }, [searchQuery, selectedDomains, selectedLanguages, selectedSizes, sortField, sortDirection]);

      const uniqueDomains = useMemo(() => {
        return [...new Set(data.all_projects.map(p => p.primary_domain))]
          .filter(d => d != null && !CHART_EXCLUDED_ITEMS.includes(d))
          .sort();
      }, []);

      const uniqueLanguages = useMemo(() => {
        return [...new Set(data.all_projects.map(p => p.primary_language))]
          .filter(l => l != null)
          .sort();
      }, []);

      const radarData = useMemo(() => {
        const top6Domains = Object.entries(data.domain_distribution)
          .filter(([name]) => !CHART_EXCLUDED_ITEMS.includes(name))
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6);
        const maxValue = Math.max(...top6Domains.map(([, v]) => v), 1);
        return top6Domains.map(([name, value]) => ({
          domain: name.length > 15 ? name.slice(0, 15) + '...' : name,
          fullName: name,
          value,
          normalized: Math.round((value / maxValue) * 100),
        }));
      }, []);

      const toggleDomain = (domain) => {
        setSelectedDomains(prev => {
          const next = new Set(prev);
          if (next.has(domain)) next.delete(domain);
          else next.add(domain);
          return next;
        });
      };

      const toggleLanguage = (lang) => {
        setSelectedLanguages(prev => {
          const next = new Set(prev);
          if (next.has(lang)) next.delete(lang);
          else next.add(lang);
          return next;
        });
      };

      const toggleSize = (size) => {
        setSelectedSizes(prev => {
          const next = new Set(prev);
          if (next.has(size)) next.delete(size);
          else next.add(size);
          return next;
        });
      };

      const clearAllFilters = () => {
        setSelectedDomains(new Set());
        setSelectedLanguages(new Set());
        setSelectedSizes(new Set());
        setSearchQuery('');
      };

      const hasFilters = selectedDomains.size > 0 || selectedLanguages.size > 0 || selectedSizes.size > 0 || searchQuery;

      return h('div', { className: 'min-h-screen bg-gray-50 p-8 font-sans' },
        // Header
        h('div', { className: 'flex justify-between items-start gap-6 mb-8 flex-wrap' },
          h('div', { className: 'flex items-center gap-5' },
            h('div', { className: 'w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg' }, 
              createLucideIcon('BarChart3', 40)
            ),
            h('div', null,
              h('h1', { className: 'text-3xl font-bold text-gray-800 mb-1' }, 'Business Metrics Dashboard'),
              h('p', { className: 'text-gray-600' },
                'Comprehensive analysis of ',
                h('span', { className: 'font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded' }, data.executive_summary.total_projects + ' projects'),
                ' across your codebase'
              )
            )
          ),
          h('div', { className: 'flex gap-4 items-center' },
            h('span', { className: 'flex items-center gap-1.5 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200' },
              createLucideIcon('Globe', 14),
              ' Analysis v' + data.analysis_metadata.analysis_version
            ),
            h('span', { className: 'flex items-center gap-1.5 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200' },
              createLucideIcon('Database', 14),
              ' ' + new Date(data.analysis_metadata.generated_at).toLocaleDateString()
            )
          )
        ),
        // Tabs
        h('div', { className: 'bg-white border border-gray-200 rounded-xl p-1 mb-6 shadow-sm' },
          h('div', { className: 'flex gap-1' },
            [
              { id: 'overview', label: 'Overview' },
              { id: 'languages', label: 'Languages' },
              { id: 'domains', label: 'Domains & Features' },
              { id: 'projects', label: 'Project Explorer' },
            ].map(tab =>
              h('button', {
                key: tab.id,
                className: 'flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-transparent border-none rounded-lg text-sm font-medium transition-all cursor-pointer ' +
                  (activeTab === tab.id ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'),
                onClick: () => setActiveTab(tab.id)
              }, tab.label)
            )
          )
        ),
        // Overview Tab
        activeTab === 'overview' && h('div', { className: 'flex flex-col gap-6' },
          h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5' },
            h(StatCard, { icon: createLucideIcon('Package', 28), title: 'Total Projects', value: data.executive_summary.total_projects, subtitle: 'Analyzed repositories', color: COLORS.primary }),
            h(StatCard, { icon: createLucideIcon('FileCode', 28), title: 'Files Analyzed', value: data.executive_summary.total_files_analyzed, subtitle: 'Source code files', color: COLORS.secondary }),
            h(StatCard, { icon: createLucideIcon('Code2', 28), title: 'Languages', value: data.executive_summary.unique_languages, subtitle: 'Programming languages', color: COLORS.success }),
            h(StatCard, { icon: createLucideIcon('Building2', 28), title: 'Business Domains', value: data.executive_summary.unique_domains, subtitle: 'Identified domains', color: COLORS.warning }),
            h(StatCard, { icon: createLucideIcon('Layers', 28), title: 'Features', value: data.executive_summary.unique_features, subtitle: 'Business features', color: COLORS.info })
          ),
          h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
            h(ChartCard, { title: 'Project Size Distribution', subtitle: 'Categorized by file count', icon: createLucideIcon('PieChartIcon', 20) },
              h(ResponsiveContainer, { width: '100%', height: 300 },
                h(PieChart, null,
                  h(Pie, {
                    data: sizeChartData,
                    cx: '50%',
                    cy: '50%',
                    innerRadius: 60,
                    outerRadius: 100,
                    paddingAngle: 5,
                    dataKey: 'value',
                    label: ({ name, percent }) => name + ' (' + (percent * 100).toFixed(0) + '%)'
                  },
                    sizeChartData.map((entry, index) =>
                      h(Cell, { key: 'cell-' + index, fill: entry.color })
                    )
                  ),
                  h(Tooltip, { content: h(CustomBarTooltip) }),
                  h(Legend)
                )
              ),
              h('div', { className: 'flex flex-wrap gap-4 justify-center pt-4 border-t border-gray-100 mt-4' },
                ['small', 'medium', 'large', 'xlarge'].map(size =>
                  h('div', { key: size, className: 'flex items-center gap-1.5 text-xs text-gray-600' },
                    h('span', { className: 'w-3 h-3 rounded', style: { background: SIZE_COLORS[size] } }),
                    h('span', null, size.charAt(0).toUpperCase() + size.slice(1) + 
                      (size === 'small' ? ' (<50 files)' : 
                       size === 'medium' ? ' (50-150 files)' :
                       size === 'large' ? ' (150-300 files)' : ' (300+ files)'))
                  )
                )
              )
            ),
            h(ChartCard, { title: 'Domain Radar Analysis', subtitle: 'Top 6 business domains', icon: createLucideIcon('Building2', 20) },
              h(ResponsiveContainer, { width: '100%', height: 350 },
                h(RadarChart, { data: radarData },
                  h(PolarGrid, { stroke: '#e5e7eb' }),
                  h(PolarAngleAxis, { dataKey: 'domain', tick: { fill: '#6b7280', fontSize: 11 } }),
                  h(PolarRadiusAxis, { angle: 30, domain: [0, 100], tick: { fill: '#9ca3af', fontSize: 10 } }),
                  h(Radar, {
                    name: 'Domain Coverage',
                    dataKey: 'normalized',
                    stroke: '#fb851e',
                    fill: '#fb851e',
                    fillOpacity: 0.3
                  }),
                  h(Tooltip, {
                    content: ({ payload }) => {
                      if (!payload?.length) return null;
                      const item = payload[0].payload;
                      return h('div', { className: 'bg-gray-900 bg-opacity-95 p-3 rounded-lg shadow-xl' },
                        h('p', { className: 'text-gray-400 text-xs mb-1' }, item.fullName),
                        h('p', { className: 'text-white text-base font-bold m-0' }, item.value.toLocaleString() + ' files')
                      );
                    }
                  })
                )
              )
            )
          ),
          h(ChartCard, { title: 'Language Distribution', subtitle: 'Files by programming language', icon: createLucideIcon('Code2', 20) },
            h(ResponsiveContainer, { width: '100%', height: 400 },
              h(BarChart, { data: languageChartData, layout: 'vertical', margin: { left: 100 } },
                h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#f3f4f6' }),
                h(XAxis, { type: 'number', tick: { fill: '#6b7280', fontSize: 12 } }),
                h(YAxis, {
                  dataKey: 'name',
                  type: 'category',
                  tick: { fill: '#374151', fontSize: 12 },
                  tickFormatter: value => value.charAt(0).toUpperCase() + value.slice(1),
                  width: 90
                }),
                h(Tooltip, { content: h(CustomBarTooltip) }),
                h(Bar, { dataKey: 'value', radius: [0, 6, 6, 0] },
                  languageChartData.map((entry, index) =>
                    h(Cell, { key: 'cell-' + index, fill: entry.color })
                  )
                )
              )
            )
          ),
          h(ChartCard, { title: 'Top 10 Largest Projects', subtitle: 'By file count', icon: createLucideIcon('Package', 20) },
            h('div', { className: 'flex flex-col gap-3' },
              data.top_20_largest_projects.slice(0, 10).map((project, idx) =>
                h('div', { key: project.name, className: 'grid grid-cols-12 md:grid-cols-[48px_1fr_auto_200px] items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 transition-all hover:bg-white hover:border-orange-500 hover:shadow-md' },
                  h('div', { className: 'w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xl font-bold rounded-xl flex items-center justify-center' }, idx + 1),
                  h('div', { className: 'min-w-0 col-span-7 md:col-span-1' },
                    h('h4', { className: 'text-base font-semibold text-gray-800 mb-2 truncate' }, project.name),
                    h('div', { className: 'flex gap-2 flex-wrap' },
                      h('span', {
                        className: 'text-[0.6875rem] font-semibold px-2 py-0.5 rounded uppercase border',
                        style: {
                          backgroundColor: (LANGUAGE_COLORS[project.primary_language] || '#9ca3af') + '20',
                          color: LANGUAGE_COLORS[project.primary_language] || '#6b7280',
                          borderColor: LANGUAGE_COLORS[project.primary_language] || '#9ca3af'
                        }
                      }, project.primary_language),
                      h('span', { className: 'text-[0.6875rem] font-semibold px-2 py-0.5 rounded uppercase bg-orange-50 text-orange-800' }, project.primary_domain),
                      h('span', { 
                        className: 'text-[0.6875rem] font-semibold px-2 py-0.5 rounded uppercase text-white',
                        style: { backgroundColor: SIZE_COLORS[project.size_category] }
                      }, project.size_category)
                    )
                  ),
                  h('div', { className: 'text-right hidden md:block' },
                    h('span', { className: 'text-2xl font-bold text-gray-800 block' }, project.files.toLocaleString()),
                    h('span', { className: 'text-xs text-gray-400' }, 'files')
                  ),
                  h('div', { className: 'hidden md:block h-2 bg-gray-200 rounded overflow-hidden' },
                    h('div', {
                      className: 'h-full rounded transition-all duration-500',
                      style: {
                        width: (project.files / (data.top_20_largest_projects[0]?.files || 1)) * 100 + '%',
                        backgroundColor: SIZE_COLORS[project.size_category]
                      }
                    })
                  )
                )
              )
            )
          )
        ),
        // Languages Tab
        activeTab === 'languages' && h('div', { className: 'flex flex-col gap-6' },
          h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
            h(ChartCard, { title: 'Language Share', subtitle: 'Pie chart view', icon: createLucideIcon('PieChartIcon', 20) },
              h(ResponsiveContainer, { width: '100%', height: 400 },
                h(PieChart, null,
                  h(Pie, {
                    data: languageChartData.slice(0, 8),
                    cx: '50%',
                    cy: '50%',
                    outerRadius: 150,
                    dataKey: 'value',
                    label: ({ name, percent }) => name + ' (' + (percent * 100).toFixed(1) + '%)'
                  },
                    languageChartData.slice(0, 8).map((entry, index) =>
                      h(Cell, { key: 'cell-' + index, fill: entry.color })
                    )
                  ),
                  h(Tooltip, { content: h(CustomBarTooltip) })
                )
              )
            ),
            h(ChartCard, { title: 'Language Statistics', subtitle: 'Detailed breakdown', icon: createLucideIcon('Code2', 20) },
              h('div', { className: 'flex flex-col gap-4 max-h-[400px] overflow-y-auto' },
                languageChartData.map((lang, idx) => {
                  const percentage = (lang.value / data.executive_summary.total_files_analyzed) * 100;
                  return h('div', { key: lang.name, className: 'p-3 bg-gray-50 rounded-lg' },
                    h('div', { className: 'flex items-center gap-3 mb-2' },
                      h('span', { className: 'text-xs font-bold text-gray-400' }, '#' + (idx + 1)),
                      h('span', { className: 'font-semibold text-sm flex-1', style: { color: lang.color } },
                        lang.name.charAt(0).toUpperCase() + lang.name.slice(1)
                      ),
                      h('span', { className: 'text-sm text-gray-700 font-semibold' }, lang.value.toLocaleString() + ' files'),
                      h('span', { className: 'text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full' }, percentage.toFixed(1) + '%')
                    ),
                    h('div', { className: 'h-1.5 bg-gray-200 rounded overflow-hidden' },
                      h('div', {
                        className: 'h-full rounded transition-all duration-500',
                        style: {
                          width: percentage + '%',
                          backgroundColor: lang.color
                        }
                      })
                    )
                  );
                })
              )
            )
          ),
          h(ChartCard, { title: 'Language Area Distribution', subtitle: 'Visual representation of language spread', icon: createLucideIcon('Code2', 20) },
            h(ResponsiveContainer, { width: '100%', height: 300 },
              h(AreaChart, { data: languageChartData },
                h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#f3f4f6' }),
                h(XAxis, {
                  dataKey: 'name',
                  tick: { fill: '#6b7280', fontSize: 11 },
                  tickFormatter: value => value.charAt(0).toUpperCase() + value.slice(1)
                }),
                h(YAxis, { tick: { fill: '#6b7280', fontSize: 12 } }),
                h(Tooltip, { content: h(CustomBarTooltip) }),
                h(Area, {
                  type: 'monotone',
                  dataKey: 'value',
                  stroke: '#fb851e',
                  fill: 'url(#colorValue)',
                  strokeWidth: 2
                }),
                h('defs', null,
                  h('linearGradient', { id: 'colorValue', x1: '0', y1: '0', x2: '0', y2: '1' },
                    h('stop', { offset: '5%', stopColor: '#fb851e', stopOpacity: 0.3 }),
                    h('stop', { offset: '95%', stopColor: '#fb851e', stopOpacity: 0 })
                  )
                )
              )
            )
          )
        ),
        // Domains Tab
        activeTab === 'domains' && h('div', { className: 'flex flex-col gap-6' },
          h(ChartCard, { title: 'Domain Distribution', subtitle: 'Business domains by file count', icon: createLucideIcon('Building2', 20) },
            h(ResponsiveContainer, { width: '100%', height: 500 },
              h(BarChart, { data: domainChartData, layout: 'vertical', margin: { left: 180 } },
                h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#f3f4f6' }),
                h(XAxis, { type: 'number', tick: { fill: '#6b7280', fontSize: 12 } }),
                h(YAxis, { dataKey: 'name', type: 'category', tick: { fill: '#374151', fontSize: 12 }, width: 170 }),
                h(Tooltip, { content: h(CustomBarTooltip) }),
                h(Bar, { dataKey: 'value', radius: [0, 6, 6, 0] },
                  domainChartData.map((_, index) =>
                    h(Cell, { key: 'cell-' + index, fill: CHART_COLORS[index % CHART_COLORS.length] })
                  )
                )
              )
            )
          ),
          h(ChartCard, { title: 'Domain Treemap', subtitle: 'Proportional view of domains', icon: createLucideIcon('Layers', 20) },
            h(ResponsiveContainer, { width: '100%', height: 400 },
              h(Treemap, {
                data: treemapData.children,
                dataKey: 'size',
                aspectRatio: 4 / 3,
                stroke: '#fff'
              },
                treemapData.children.map((entry, index) =>
                  h(Cell, { key: 'cell-' + index, fill: entry.color })
                ),
                h(Tooltip, {
                  content: ({ payload }) => {
                    if (!payload?.length) return null;
                    const item = payload[0].payload;
                    return h('div', { className: 'bg-gray-900 bg-opacity-95 p-3 rounded-lg shadow-xl' },
                      h('p', { className: 'text-gray-400 text-xs mb-1' }, item.name),
                      h('p', { className: 'text-white text-base font-bold m-0' },
                        item.size?.toLocaleString() + ' files'
                      )
                    );
                  }
                })
              )
            )
          ),
          h(ChartCard, { title: 'Top 15 Features', subtitle: 'Business features by occurrence', icon: createLucideIcon('Layers', 20) },
            h(ResponsiveContainer, { width: '100%', height: 450 },
              h(BarChart, { data: featureChartData, layout: 'vertical', margin: { left: 200 } },
                h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#f3f4f6' }),
                h(XAxis, { type: 'number', tick: { fill: '#6b7280', fontSize: 12 } }),
                h(YAxis, { dataKey: 'name', type: 'category', tick: { fill: '#374151', fontSize: 11 }, width: 190 }),
                h(Tooltip, { content: h(CustomBarTooltip) }),
                h(Bar, { dataKey: 'value', fill: '#8b5cf6', radius: [0, 6, 6, 0] },
                  featureChartData.map((_, index) =>
                    h(Cell, { key: 'cell-' + index, fill: CHART_COLORS[(index + 4) % CHART_COLORS.length] })
                  )
                )
              )
            )
          )
        ),
        // Projects Tab
        activeTab === 'projects' && h('div', { className: 'flex flex-col gap-6' },
          h('div', { className: 'bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4' },
            h('div', { className: 'flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 transition-all focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10' },
              h('input', {
                type: 'text',
                placeholder: 'Search projects...',
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: 'flex-1 border-none bg-transparent text-[0.9375rem] text-gray-800 outline-none placeholder:text-gray-400'
              })
            ),
            h('div', { className: 'flex flex-wrap gap-3 items-center' },
              h('div', { className: 'relative group' },
                h('button', { className: 'flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 cursor-pointer transition-all hover:border-orange-500 hover:bg-gray-50' },
                  'Domain',
                  selectedDomains.size > 0 && h('span', { className: 'bg-orange-500 text-white text-[0.6875rem] font-bold px-1.5 py-0.5 rounded-full' }, selectedDomains.size),
                  createLucideIcon('ChevronDown', 16)
                ),
                h('div', { className: 'hidden group-hover:block group-focus-within:block absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[220px] max-h-[300px] overflow-y-auto z-[100] p-2' },
                  uniqueDomains.map(domain =>
                    h('label', { key: domain, className: 'flex items-center gap-2.5 px-3 py-2.5 rounded-md cursor-pointer transition-all hover:bg-gray-100 text-sm' },
                      h('input', {
                        type: 'checkbox',
                        checked: selectedDomains.has(domain),
                        onChange: () => toggleDomain(domain),
                        className: 'w-4 h-4 accent-orange-500'
                      }),
                      h('span', null, domain || 'Unknown')
                    )
                  )
                )
              ),
              h('div', { className: 'relative group' },
                h('button', { className: 'flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 cursor-pointer transition-all hover:border-orange-500 hover:bg-gray-50' },
                  'Language',
                  selectedLanguages.size > 0 && h('span', { className: 'bg-orange-500 text-white text-[0.6875rem] font-bold px-1.5 py-0.5 rounded-full' }, selectedLanguages.size),
                  createLucideIcon('ChevronDown', 16)
                ),
                h('div', { className: 'hidden group-hover:block group-focus-within:block absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[220px] max-h-[300px] overflow-y-auto z-[100] p-2' },
                  uniqueLanguages.map(lang =>
                    h('label', { key: lang, className: 'flex items-center gap-2.5 px-3 py-2.5 rounded-md cursor-pointer transition-all hover:bg-gray-100 text-sm' },
                      h('input', {
                        type: 'checkbox',
                        checked: selectedLanguages.has(lang),
                        onChange: () => toggleLanguage(lang),
                        className: 'w-4 h-4 accent-orange-500'
                      }),
                      h('span', { style: { color: LANGUAGE_COLORS[lang] || '#6b7280' } },
                        lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : 'Unknown'
                      )
                    )
                  )
                )
              ),
              h('div', { className: 'relative group' },
                h('button', { className: 'flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 cursor-pointer transition-all hover:border-orange-500 hover:bg-gray-50' },
                  'Size',
                  selectedSizes.size > 0 && h('span', { className: 'bg-orange-500 text-white text-[0.6875rem] font-bold px-1.5 py-0.5 rounded-full' }, selectedSizes.size),
                  createLucideIcon('ChevronDown', 16)
                ),
                h('div', { className: 'hidden group-hover:block group-focus-within:block absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[220px] max-h-[300px] overflow-y-auto z-[100] p-2' },
                  ['small', 'medium', 'large', 'xlarge'].map(size =>
                    h('label', { key: size, className: 'flex items-center gap-2.5 px-3 py-2.5 rounded-md cursor-pointer transition-all hover:bg-gray-100 text-sm' },
                      h('input', {
                        type: 'checkbox',
                        checked: selectedSizes.has(size),
                        onChange: () => toggleSize(size),
                        className: 'w-4 h-4 accent-orange-500'
                      }),
                      h('span', { style: { color: SIZE_COLORS[size] } },
                        size.charAt(0).toUpperCase() + size.slice(1)
                      )
                    )
                  )
                )
              ),
              h('button', {
                className: 'flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 cursor-pointer transition-all hover:border-orange-500 hover:bg-gray-50',
                onClick: () => {
                  if (sortField === 'files') {
                    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                  } else {
                    setSortField('files');
                    setSortDirection('desc');
                  }
                }
              }, 'Sort by Files'),
              h('button', {
                className: 'flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 cursor-pointer transition-all hover:border-orange-500 hover:bg-gray-50',
                onClick: () => {
                  if (sortField === 'name') {
                    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                  } else {
                    setSortField('name');
                    setSortDirection('asc');
                  }
                }
              }, 'Sort by Name')
            )
          ),
          hasFilters && h('div', { className: 'flex flex-wrap items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg' },
            h('span', { className: 'text-sm text-gray-600 font-medium' }, 'Active Filters:'),
            Array.from(selectedDomains).map(d =>
              h('span', { key: d, className: 'inline-flex items-center gap-1.5 bg-orange-50 text-orange-800 text-xs font-medium px-3 py-1 rounded-full' },
                d,
                h('button', {
                  className: 'flex items-center justify-center w-[18px] h-[18px] bg-orange-500 text-white rounded-full border-none cursor-pointer transition-all hover:bg-orange-600',
                  onClick: () => toggleDomain(d)
                }, createLucideIcon('X', 12))
              )
            ),
            Array.from(selectedLanguages).map(l =>
              h('span', { key: l, className: 'inline-flex items-center gap-1.5 bg-orange-50 text-orange-800 text-xs font-medium px-3 py-1 rounded-full' },
                l,
                h('button', {
                  className: 'flex items-center justify-center w-[18px] h-[18px] bg-orange-500 text-white rounded-full border-none cursor-pointer transition-all hover:bg-orange-600',
                  onClick: () => toggleLanguage(l)
                }, createLucideIcon('X', 12))
              )
            ),
            Array.from(selectedSizes).map(s =>
              h('span', { key: s, className: 'inline-flex items-center gap-1.5 bg-orange-50 text-orange-800 text-xs font-medium px-3 py-1 rounded-full' },
                s,
                h('button', {
                  className: 'flex items-center justify-center w-[18px] h-[18px] bg-orange-500 text-white rounded-full border-none cursor-pointer transition-all hover:bg-orange-600',
                  onClick: () => toggleSize(s)
                }, createLucideIcon('X', 12))
              )
            ),
            searchQuery && h('span', { className: 'inline-flex items-center gap-1.5 bg-orange-50 text-orange-800 text-xs font-medium px-3 py-1 rounded-full' },
              '"' + searchQuery + '"',
              h('button', {
                className: 'flex items-center justify-center w-[18px] h-[18px] bg-orange-500 text-white rounded-full border-none cursor-pointer transition-all hover:bg-orange-600',
                onClick: () => setSearchQuery('')
              }, createLucideIcon('X', 12))
            ),
            h('button', { className: 'ml-auto bg-transparent border-none text-red-500 text-sm font-medium cursor-pointer hover:underline', onClick: clearAllFilters }, 'Clear All')
          ),
          h('div', { className: 'text-sm text-gray-600' },
            'Showing ',
            h('strong', { className: 'text-gray-800' }, filteredProjects.length),
            ' of ',
            h('strong', { className: 'text-gray-800' }, data.all_projects.length),
            ' projects'
          ),
          h('div', { className: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5' },
            filteredProjects.map(project =>
              h('div', {
                key: project.name,
                className: 'bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all hover:border-orange-500 hover:shadow-lg ' +
                  (expandedProject === project.name ? 'border-orange-500' : '')
              },
                h('div', {
                  className: 'flex justify-between items-center p-5 cursor-pointer transition-all hover:bg-gray-50',
                  onClick: () => setExpandedProject(expandedProject === project.name ? null : project.name)
                },
                  h('div', { className: 'min-w-0 flex-1' },
                    h('h3', { className: 'text-lg font-bold text-gray-800 mb-2 truncate' }, project.name),
                    h('div', { className: 'flex gap-2 flex-wrap' },
                      h('span', {
                        className: 'text-[0.6875rem] font-semibold px-2.5 py-1 rounded uppercase border',
                        style: {
                          backgroundColor: (LANGUAGE_COLORS[project.primary_language] || '#9ca3af') + '20',
                          color: LANGUAGE_COLORS[project.primary_language] || '#6b7280',
                          borderColor: LANGUAGE_COLORS[project.primary_language] || '#9ca3af'
                        }
                      }, project.primary_language),
                      h('span', { 
                        className: 'text-[0.6875rem] font-semibold px-2.5 py-1 rounded uppercase text-white',
                        style: { backgroundColor: SIZE_COLORS[project.size_category] }
                      }, project.size_category)
                    )
                  ),
                  h('div', { className: 'flex items-center gap-3' },
                    h('span', { className: 'text-base font-bold text-gray-800' }, project.files.toLocaleString() + ' files'),
                    h('span', { className: 'text-gray-400 transition-transform duration-300 ' + (expandedProject === project.name ? 'rotate-90' : '') },
                      createLucideIcon(expandedProject === project.name ? 'ChevronDown' : 'ChevronRight', 20)
                    )
                  )
                ),
                h('div', { className: 'flex items-center gap-2 px-5 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600' },
                  createLucideIcon('Building2', 14),
                  project.primary_domain
                ),
                expandedProject === project.name && h('div', { className: 'p-5 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300' },
                  h('div', { className: 'mb-5' },
                    h('h4', { className: 'text-xs font-bold text-gray-700 uppercase tracking-wide mb-3' }, 'Domains'),
                    h('div', { className: 'flex flex-col gap-3' },
                      Object.entries(project.domains)
                        .sort(([, a], [, b]) => b - a)
                        .map(([domain, count], idx) => {
                          const maxCount = Math.max(...Object.values(project.domains));
                          const percentage = (count / maxCount) * 100;
                          return h('div', { key: domain, className: 'flex flex-col gap-1' },
                            h('div', { className: 'flex justify-between items-center' },
                              h('span', { className: 'text-sm text-gray-700' }, domain),
                              h('span', { className: 'text-xs font-semibold text-gray-600' }, count)
                            ),
                            h('div', { className: 'h-2 bg-gray-200 rounded overflow-hidden' },
                              h('div', {
                                className: 'h-full rounded transition-all duration-500',
                                style: {
                                  width: percentage + '%',
                                  backgroundColor: CHART_COLORS[idx % CHART_COLORS.length]
                                }
                              })
                            )
                          );
                        })
                    )
                  ),
                  h('div', null,
                    h('h4', { className: 'text-xs font-bold text-gray-700 uppercase tracking-wide mb-3' }, 'Languages'),
                    h('div', { className: 'flex flex-wrap gap-2' },
                      Object.entries(project.languages)
                        .sort(([, a], [, b]) => b - a)
                        .map(([lang, count]) =>
                          h('span', {
                            key: lang,
                            className: 'text-xs font-semibold px-3 py-1.5 rounded-lg border',
                            style: {
                              backgroundColor: (LANGUAGE_COLORS[lang] || '#9ca3af') + '15',
                              color: LANGUAGE_COLORS[lang] || '#6b7280',
                              borderColor: LANGUAGE_COLORS[lang] || '#9ca3af'
                            }
                          }, lang + ': ' + count)
                        )
                    )
                  )
                )
              )
            )
          ),
          filteredProjects.length === 0 && h('div', { className: 'flex flex-col items-center justify-center py-16 text-center text-gray-400' },
            createLucideIcon('Package', 48),
            h('h3', { className: 'text-xl text-gray-700 mt-4 mb-2' }, 'No projects found'),
            h('p', { className: 'mb-4' }, 'Try adjusting your filters or search query'),
            h('button', { 
              className: 'bg-orange-500 text-white border-none px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-orange-600 transition-all',
              onClick: clearAllFilters 
            }, 'Clear Filters')
          )
        )
      );
    }

      // Render the app with error handling
      try {
        const rootElement = document.getElementById('root');
        if (!rootElement) {
          throw new Error('Root element not found');
        }
        
        const root = createRoot(rootElement);
        root.render(h(BusinessMetricsAnalysis));
        console.log('Dashboard rendered successfully');
      } catch (error) {
        console.error('Error rendering dashboard:', error);
        document.getElementById('root').innerHTML = 
          '<div class="p-10 text-center text-red-500">' +
          '<h2 class="text-2xl font-bold mb-4">Error Rendering Dashboard</h2>' +
          '<p>' + (error.message || 'Unknown error occurred') + '</p>' +
          '<p class="text-xs text-gray-600 mt-5">Please check the browser console for more details.</p>' +
          '</div>';
      }
    }
    
    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initApp, 300);
      });
    } else {
      // DOM already loaded, but wait a bit for scripts
      setTimeout(initApp, 500);
    }
  </script>
  <!-- Footer with Trademark Logo -->
  <footer style="position: absolute; bottom: 0; right: 0; padding: 24px 32px; z-index: 1000;">
    <div style="display: flex; align-items: center; justify-content: flex-end;">
      ${logoImgTag}
    </div>
  </footer>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `business_metrics_dashboard_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const hasFilters = selectedDomains.size > 0 || selectedLanguages.size > 0 || selectedSizes.size > 0 || searchQuery;

  // Radar chart data for domain analysis
  const radarData = useMemo(() => {
    const top6Domains = Object.entries(data.domain_distribution)
      .filter(([name]) => !CHART_EXCLUDED_ITEMS.includes(name))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
    const maxValue = Math.max(...top6Domains.map(([, v]) => v), 1);
    return top6Domains.map(([name, value]) => ({
      domain: name.length > 15 ? name.slice(0, 15) + '...' : name,
      fullName: name,
      value,
      normalized: Math.round((value / maxValue) * 100),
    }));
  }, [data.domain_distribution]);

  return (
    <div className="business-metrics-container">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="header-icon">
            <BarChart3 size={28} />
          </div>
          <div>
            <h1 className="header-title">Business Metrics Dashboard</h1>
            <p className="header-subtitle">
              Comprehensive analysis of{' '}
              <span className="highlight">{data.executive_summary.total_projects} projects</span> across your codebase
            </p>
          </div>
        </div>
        <div className="header-meta">
          <span className="meta-item">
            <Globe size={14} />
            Analysis v{data.analysis_metadata.analysis_version}
          </span>
          <span className="meta-item">
            <Database size={14} />
            {new Date(data.analysis_metadata.generated_at).toLocaleDateString()}
          </span>
          <button className="export-html-button" onClick={exportToHTML}>
            <Download size={16} />
            Export HTML
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <div className="tabs">
          {[
            { id: 'overview', label: 'Overview', icon: <PieChartIcon size={18} /> },
            { id: 'languages', label: 'Languages', icon: <Code2 size={18} /> },
            { id: 'domains', label: 'Domains & Features', icon: <Building2 size={18} /> },
            { id: 'projects', label: 'Project Explorer', icon: <FolderTree size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          {/* Executive Summary Cards */}
          <div className="stats-grid">
            <StatCard
              icon={<Package size={28} />}
              title="Total Projects"
              value={data.executive_summary.total_projects}
              subtitle="Analyzed repositories"
              color={COLORS.primary}
            />
            <StatCard
              icon={<FileCode size={28} />}
              title="Files Analyzed"
              value={data.executive_summary.total_files_analyzed}
              subtitle="Source code files"
              color={COLORS.secondary}
            />
            <StatCard
              icon={<Code2 size={28} />}
              title="Languages"
              value={data.executive_summary.unique_languages}
              subtitle="Programming languages"
              color={COLORS.success}
            />
            <StatCard
              icon={<Building2 size={28} />}
              title="Business Domains"
              value={data.executive_summary.unique_domains}
              subtitle="Identified domains"
              color={COLORS.warning}
            />
            <StatCard
              icon={<Layers size={28} />}
              title="Features"
              value={data.executive_summary.unique_features}
              subtitle="Business features"
              color={COLORS.info}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="charts-row">
            <div className="chart-col-2">
              <ChartCard title="Project Size Distribution" subtitle="Categorized by file count" icon={<PieChartIcon size={20} />}>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sizeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {sizeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomBarTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="size-legend">
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: SIZE_COLORS.small }} />
                    <span>Small (&lt;50 files)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: SIZE_COLORS.medium }} />
                    <span>Medium (50-150 files)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: SIZE_COLORS.large }} />
                    <span>Large (150-300 files)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: SIZE_COLORS.xlarge }} />
                    <span>XLarge (300+ files)</span>
                  </div>
                </div>
              </ChartCard>
            </div>

            <div className="chart-col-2">
              <ChartCard title="Domain Radar Analysis" subtitle="Top 6 business domains" icon={<Building2 size={20} />}>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="domain" tick={{ fill: '#6b7280', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <Radar
                        name="Domain Coverage"
                        dataKey="normalized"
                        stroke="#fb851e"
                        fill="#fb851e"
                        fillOpacity={0.3}
                      />
                      <Tooltip
                        content={({ payload }) => {
                          if (!payload?.length) return null;
                          const item = payload[0].payload;
                          return (
                            <div className="radar-tooltip">
                              <p className="radar-tooltip-title">{item.fullName}</p>
                              <p className="radar-tooltip-value">{item.value.toLocaleString()} files</p>
                            </div>
                          );
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          </div>

          {/* Top Languages Bar Chart */}
          <ChartCard
            title="Language Distribution"
            subtitle="Files by programming language"
            icon={<Code2 size={20} />}
          >
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={languageChartData} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: '#374151', fontSize: 12 }}
                    tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                    width={90}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {languageChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Top 10 Largest Projects */}
          <ChartCard
            title="Top 10 Largest Projects"
            subtitle="By file count"
            icon={<TrendingUp size={20} />}
          >
            <div className="top-projects-list">
              {data.top_20_largest_projects.slice(0, 10).map((project, idx) => (
                <div key={project.name} className="top-project-item">
                  <div className="project-rank">{idx + 1}</div>
                  <div className="project-info">
                    <h4 className="project-name">{project.name}</h4>
                    <div className="project-meta-row">
                      <span
                        className="project-badge lang"
                        style={{ backgroundColor: `${LANGUAGE_COLORS[project.primary_language] || '#9ca3af'}20`, color: LANGUAGE_COLORS[project.primary_language] || '#6b7280' }}
                      >
                        {project.primary_language}
                      </span>
                      <span className="project-badge domain">{project.primary_domain}</span>
                      <span className={`project-badge size ${project.size_category}`}>{project.size_category}</span>
                    </div>
                  </div>
                  <div className="project-files">
                    <span className="files-count">{project.files.toLocaleString()}</span>
                    <span className="files-label">files</span>
                  </div>
                  <div className="project-bar-container">
                    <div
                      className="project-bar"
                      style={{
                        width: `${(project.files / (data.top_20_largest_projects[0]?.files || 1)) * 100}%`,
                        backgroundColor: SIZE_COLORS[project.size_category],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {/* Languages Tab */}
      {activeTab === 'languages' && (
        <div className="tab-content">
          <div className="charts-row">
            <div className="chart-col-2">
              <ChartCard title="Language Share" subtitle="Pie chart view" icon={<PieChartIcon size={20} />}>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={languageChartData.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                    >
                      {languageChartData.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomBarTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="chart-col-2">
              <ChartCard title="Language Statistics" subtitle="Detailed breakdown" icon={<BarChart3 size={20} />}>
                <div className="language-stats">
                  {languageChartData.map((lang, idx) => {
                    const percentage = (lang.value / data.executive_summary.total_files_analyzed) * 100;
                    return (
                      <div key={lang.name} className="language-stat-item">
                        <div className="lang-header">
                          <span className="lang-rank">#{idx + 1}</span>
                          <span className="lang-name" style={{ color: lang.color }}>
                            {lang.name.charAt(0).toUpperCase() + lang.name.slice(1)}
                          </span>
                          <span className="lang-count">{lang.value.toLocaleString()} files</span>
                          <span className="lang-percent">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="lang-bar-bg">
                          <div
                            className="lang-bar-fill"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: lang.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            </div>
          </div>

          {/* Language Trends Area Chart */}
          <ChartCard title="Language Area Distribution" subtitle="Visual representation of language spread" icon={<Code2 size={20} />}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={languageChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip content={<CustomBarTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#fb851e"
                  fill="url(#colorValue)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb851e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb851e" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Domains & Features Tab */}
      {activeTab === 'domains' && (
        <div className="tab-content">
          {/* Domain Distribution */}
          <ChartCard title="Domain Distribution" subtitle="Business domains by file count" icon={<Building2 size={20} />}>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={domainChartData} layout="vertical" margin={{ left: 180 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#374151', fontSize: 12 }} width={170} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {domainChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Domain Treemap */}
          <ChartCard title="Domain Treemap" subtitle="Proportional view of domains" icon={<Layers size={20} />}>
            <ResponsiveContainer width="100%" height={400}>
              <Treemap
                data={treemapData.children}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#fff"
              >
                {treemapData.children.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div style={{
                        background: 'rgba(17, 24, 39, 0.95)',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                      }}>
                        <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: '0 0 4px 0' }}>{item.name}</p>
                        <p style={{ color: 'white', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                          {item.size?.toLocaleString()} files
                        </p>
                      </div>
                    );
                  }}
                />
              </Treemap>
            </ResponsiveContainer>
          </ChartCard>

          {/* Feature Distribution */}
          <ChartCard title="Top 15 Features" subtitle="Business features by occurrence" icon={<Layers size={20} />}>
            <ResponsiveContainer width="100%" height={450}>
              <BarChart data={featureChartData} layout="vertical" margin={{ left: 200 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#374151', fontSize: 11 }} width={190} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]}>
                  {featureChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 4) % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="tab-content">
          {/* Filters */}
          <div className="filters-section">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-dropdowns">
              <div className="filter-dropdown">
                <button className="filter-trigger">
                  <Filter size={16} />
                  Domain
                  {selectedDomains.size > 0 && <span className="filter-count">{selectedDomains.size}</span>}
                  <ChevronDown size={16} />
                </button>
                <div className="dropdown-content">
                  {uniqueDomains.map((domain) => (
                    <label key={domain} className="dropdown-item">
                      <input
                        type="checkbox"
                        checked={selectedDomains.has(domain)}
                        onChange={() => toggleDomain(domain)}
                      />
                      <span>{domain || 'Unknown'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-dropdown">
                <button className="filter-trigger">
                  <Code2 size={16} />
                  Language
                  {selectedLanguages.size > 0 && <span className="filter-count">{selectedLanguages.size}</span>}
                  <ChevronDown size={16} />
                </button>
                <div className="dropdown-content">
                  {uniqueLanguages.map((lang) => (
                    <label key={lang} className="dropdown-item">
                      <input
                        type="checkbox"
                        checked={selectedLanguages.has(lang)}
                        onChange={() => toggleLanguage(lang)}
                      />
                      <span style={{ color: LANGUAGE_COLORS[lang] || '#6b7280' }}>
                        {lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : 'Unknown'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-dropdown">
                <button className="filter-trigger">
                  <Package size={16} />
                  Size
                  {selectedSizes.size > 0 && <span className="filter-count">{selectedSizes.size}</span>}
                  <ChevronDown size={16} />
                </button>
                <div className="dropdown-content">
                  {['small', 'medium', 'large', 'xlarge'].map((size) => (
                    <label key={size} className="dropdown-item">
                      <input
                        type="checkbox"
                        checked={selectedSizes.has(size)}
                        onChange={() => toggleSize(size)}
                      />
                      <span style={{ color: SIZE_COLORS[size] }}>
                        {size.charAt(0).toUpperCase() + size.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button className="sort-button" onClick={() => {
                if (sortField === 'files') {
                  setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortField('files');
                  setSortDirection('desc');
                }
              }}>
                {sortDirection === 'desc' ? <SortDesc size={16} /> : <SortAsc size={16} />}
                Sort by Files
              </button>

              <button className="sort-button" onClick={() => {
                if (sortField === 'name') {
                  setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortField('name');
                  setSortDirection('asc');
                }
              }}>
                {sortField === 'name' && sortDirection === 'desc' ? <SortDesc size={16} /> : <SortAsc size={16} />}
                Sort by Name
              </button>

              <button className="export-button" onClick={exportToCSV}>
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {hasFilters && (
            <div className="active-filters">
              <span className="active-filters-label">Active Filters:</span>
              {Array.from(selectedDomains).map((d) => (
                <FilterBadge key={d} label={d} onRemove={() => toggleDomain(d)} />
              ))}
              {Array.from(selectedLanguages).map((l) => (
                <FilterBadge key={l} label={l} onRemove={() => toggleLanguage(l)} />
              ))}
              {Array.from(selectedSizes).map((s) => (
                <FilterBadge key={s} label={s} onRemove={() => toggleSize(s)} />
              ))}
              {searchQuery && <FilterBadge label={`"${searchQuery}"`} onRemove={() => setSearchQuery('')} />}
              <button className="clear-all-btn" onClick={clearAllFilters}>
                Clear All
              </button>
            </div>
          )}

          {/* Results count */}
          <div className="results-count">
            Showing <strong>{filteredProjects.length}</strong> of{' '}
            <strong>{data.all_projects.length}</strong> projects
          </div>

          {/* Projects Grid */}
          <div className="projects-grid">
            {filteredProjects.map((project) => (
              <div
                key={project.name}
                className={`project-card ${expandedProject === project.name ? 'expanded' : ''}`}
              >
                <div className="project-card-header" onClick={() => setExpandedProject(expandedProject === project.name ? null : project.name)}>
                  <div className="project-card-info">
                    <h3 className="project-card-name">{project.name}</h3>
                    <div className="project-card-badges">
                      <span
                        className="badge lang"
                        style={{
                          backgroundColor: `${LANGUAGE_COLORS[project.primary_language] || '#9ca3af'}20`,
                          color: LANGUAGE_COLORS[project.primary_language] || '#6b7280',
                        }}
                      >
                        {project.primary_language}
                      </span>
                      <span className={`badge size ${project.size_category}`}>{project.size_category}</span>
                    </div>
                  </div>
                  <div className="project-card-stats">
                    <span className="files-stat">{project.files.toLocaleString()} files</span>
                    <span className={`expand-icon ${expandedProject === project.name ? 'expanded' : ''}`}>
                      {expandedProject === project.name ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </span>
                  </div>
                </div>

                <div className="project-card-domain">
                  <Building2 size={14} />
                  {project.primary_domain}
                </div>

                {expandedProject === project.name && (
                  <div className="project-card-details">
                    <div className="details-section">
                      <h4>Domains</h4>
                      <div className="domain-bars">
                        {Object.entries(project.domains)
                          .sort(([, a], [, b]) => b - a)
                          .map(([domain, count], idx) => {
                            const maxCount = Math.max(...Object.values(project.domains));
                            const percentage = (count / maxCount) * 100;
                            return (
                              <div key={domain} className="domain-bar-item">
                                <div className="domain-bar-label">
                                  <span className="domain-name">{domain}</span>
                                  <span className="domain-count">{count}</span>
                                </div>
                                <div className="domain-bar-bg">
                                  <div
                                    className="domain-bar-fill"
                                    style={{
                                      width: `${percentage}%`,
                                      backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    <div className="details-section">
                      <h4>Languages</h4>
                      <div className="language-chips">
                        {Object.entries(project.languages)
                          .sort(([, a], [, b]) => b - a)
                          .map(([lang, count]) => (
                            <span
                              key={lang}
                              className="language-chip"
                              style={{
                                backgroundColor: `${LANGUAGE_COLORS[lang] || '#9ca3af'}15`,
                                color: LANGUAGE_COLORS[lang] || '#6b7280',
                                borderColor: LANGUAGE_COLORS[lang] || '#9ca3af',
                              }}
                            >
                              {lang}: {count}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="no-results">
              <Package size={48} />
              <h3>No projects found</h3>
              <p>Try adjusting your filters or search query</p>
              <button onClick={clearAllFilters}>Clear Filters</button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .business-metrics-container {
          min-height: 100vh;
          background: #f9fafb;
          padding: 32px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #fb851e 0%, #ff6b35 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 20px rgba(251, 133, 30, 0.3);
        }

        .header-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .header-subtitle {
          font-size: 0.9375rem;
          color: #6b7280;
          margin: 0;
        }

        .highlight {
          font-weight: 700;
          color: #fb851e;
          background: #fff7ed;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .header-meta {
          display: flex;
          gap: 16px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          color: #6b7280;
          background: white;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .export-html-button {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: white;
          background: linear-gradient(135deg, #fb851e 0%, #ff6b35 100%);
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(251, 133, 30, 0.3);
        }

        .export-html-button:hover {
          background: linear-gradient(135deg, #ea580c 0%, #fb851e 100%);
          box-shadow: 0 4px 12px rgba(251, 133, 30, 0.4);
          transform: translateY(-1px);
        }

        .export-html-button:active {
          transform: translateY(0);
        }

        .tabs-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tabs {
          display: flex;
          gap: 4px;
        }

        .tab-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .tab-button.active {
          background: linear-gradient(135deg, #fb851e 0%, #ff6b35 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(251, 133, 30, 0.3);
        }

        .tab-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .charts-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .charts-row {
            grid-template-columns: 1fr;
          }
        }

        .chart-col-2 {
          display: flex;
          flex-direction: column;
        }

        .chart-wrapper {
          width: 100%;
        }

        .size-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
          margin-top: 16px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        .radar-tooltip {
          background: rgba(17, 24, 39, 0.95);
          padding: 12px 16px;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }

        .radar-tooltip-title {
          color: #9ca3af;
          font-size: 0.75rem;
          margin: 0 0 4px 0;
        }

        .radar-tooltip-value {
          color: white;
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
        }

        .top-projects-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .top-project-item {
          display: grid;
          grid-template-columns: 48px 1fr auto 200px;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
        }

        .top-project-item:hover {
          background: white;
          border-color: #fb851e;
          box-shadow: 0 4px 12px rgba(251, 133, 30, 0.1);
        }

        .project-rank {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #fb851e 0%, #ff6b35 100%);
          color: white;
          font-size: 1.25rem;
          font-weight: 700;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .project-info {
          min-width: 0;
        }

        .project-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 8px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .project-meta-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .project-badge {
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .project-badge.lang {
          border: 1px solid currentColor;
        }

        .project-badge.domain {
          background: #fff7ed;
          color: #c2410c;
        }

        .project-badge.size {
          color: white;
        }

        .project-badge.size.small {
          background: ${SIZE_COLORS.small};
        }

        .project-badge.size.medium {
          background: ${SIZE_COLORS.medium};
        }

        .project-badge.size.large {
          background: ${SIZE_COLORS.large};
        }

        .project-badge.size.xlarge {
          background: ${SIZE_COLORS.xlarge};
        }

        .project-files {
          text-align: right;
        }

        .files-count {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          display: block;
        }

        .files-label {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .project-bar-container {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .project-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        /* Language Stats */
        .language-stats {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 400px;
          overflow-y: auto;
        }

        .language-stat-item {
          padding: 12px;
          background: #f9fafb;
          border-radius: 10px;
        }

        .lang-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .lang-rank {
          font-size: 0.75rem;
          font-weight: 700;
          color: #9ca3af;
        }

        .lang-name {
          font-weight: 600;
          font-size: 0.875rem;
          flex: 1;
        }

        .lang-count {
          font-size: 0.8125rem;
          color: #374151;
          font-weight: 600;
        }

        .lang-percent {
          font-size: 0.75rem;
          color: #9ca3af;
          background: #f3f4f6;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .lang-bar-bg {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }

        .lang-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        /* Filters Section */
        .filters-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px 16px;
          transition: all 0.2s;
        }

        .search-box:focus-within {
          border-color: #fb851e;
          box-shadow: 0 0 0 3px rgba(251, 133, 30, 0.1);
        }

        .search-box input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 0.9375rem;
          color: #1f2937;
          outline: none;
        }

        .search-box input::placeholder {
          color: #9ca3af;
        }

        .filter-dropdowns {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

        .filter-dropdown {
          position: relative;
        }

        .filter-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-trigger:hover {
          border-color: #fb851e;
          background: #f9fafb;
        }

        .filter-count {
          background: #fb851e;
          color: white;
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
        }

        .dropdown-content {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          min-width: 220px;
          max-height: 300px;
          overflow-y: auto;
          z-index: 100;
          padding: 8px;
          margin-top: 4px;
        }

        .filter-dropdown:hover .dropdown-content,
        .filter-dropdown:focus-within .dropdown-content {
          display: block;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
          font-size: 0.875rem;
        }

        .dropdown-item:hover {
          background: #f3f4f6;
        }

        .dropdown-item input {
          width: 16px;
          height: 16px;
          accent-color: #fb851e;
        }

        .sort-button,
        .export-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sort-button:hover,
        .export-button:hover {
          border-color: #fb851e;
          background: #f9fafb;
        }

        .export-button {
          background: #fb851e;
          color: white;
          border-color: #fb851e;
        }

        .export-button:hover {
          background: #2563eb;
        }

        .active-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #f9fafb;
          border-radius: 10px;
        }

        .active-filters-label {
          font-size: 0.8125rem;
          color: #6b7280;
          font-weight: 500;
        }

        .clear-all-btn {
          background: none;
          border: none;
          color: #ef4444;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          margin-left: auto;
        }

        .clear-all-btn:hover {
          text-decoration: underline;
        }

        .results-count {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .results-count strong {
          color: #1f2937;
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
        }

        @media (max-width: 768px) {
          .projects-grid {
            grid-template-columns: 1fr;
          }
        }

        .project-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .project-card:hover {
          border-color: #fb851e;
          box-shadow: 0 8px 24px rgba(251, 133, 30, 0.15);
        }

        .project-card.expanded {
          border-color: #fb851e;
        }

        .project-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .project-card-header:hover {
          background: #f9fafb;
        }

        .project-card-info {
          min-width: 0;
          flex: 1;
        }

        .project-card-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .project-card-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .badge {
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .badge.lang {
          border: 1px solid currentColor;
        }

        .badge.size {
          color: white;
        }

        .badge.size.small {
          background: ${SIZE_COLORS.small};
        }

        .badge.size.medium {
          background: ${SIZE_COLORS.medium};
        }

        .badge.size.large {
          background: ${SIZE_COLORS.large};
        }

        .badge.size.xlarge {
          background: ${SIZE_COLORS.xlarge};
        }

        .project-card-stats {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .files-stat {
          font-size: 1rem;
          font-weight: 700;
          color: #1f2937;
        }

        .expand-icon {
          color: #9ca3af;
          transition: transform 0.3s;
        }

        .expand-icon.expanded {
          transform: rotate(90deg);
        }

        .project-card-domain {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          font-size: 0.8125rem;
          color: #6b7280;
        }

        .project-card-details {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .details-section {
          margin-bottom: 20px;
        }

        .details-section:last-child {
          margin-bottom: 0;
        }

        .details-section h4 {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 12px 0;
        }

        .domain-bars {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .domain-bar-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .domain-bar-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .domain-name {
          font-size: 0.8125rem;
          color: #374151;
        }

        .domain-count {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
        }

        .domain-bar-bg {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .domain-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .language-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .language-chip {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid;
        }

        .no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px;
          text-align: center;
          color: #9ca3af;
        }

        .no-results h3 {
          font-size: 1.25rem;
          color: #374151;
          margin: 16px 0 8px 0;
        }

        .no-results p {
          margin: 0 0 16px 0;
        }

        .no-results button {
          background: #fb851e;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
        }

        .no-results button:hover {
          background: #2563eb;
        }

        @media (max-width: 768px) {
          .business-metrics-container {
            padding: 16px;
          }

          .header {
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          }

          .top-project-item {
            grid-template-columns: 40px 1fr;
            gap: 12px;
          }

          .project-files,
          .project-bar-container {
            display: none;
          }

          .tabs {
            flex-direction: column;
          }

          .filter-dropdowns {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default BusinessMetricsAnalysis;
