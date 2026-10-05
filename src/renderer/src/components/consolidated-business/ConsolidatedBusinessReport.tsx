'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  ResponsiveContainer,
} from 'recharts';
import {
  Search,
  Download,
  Filter,
  ChevronDown,
  Building2,
  FileCode,
  Layers,
  BarChart3,
  PieChartIcon,
  FolderTree,
  X,
  SortAsc,
  SortDesc,
  Code2,
  Database,
  Globe,
  Package,
} from 'lucide-react';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface ConsolidatedReportMetadata {
  total_reports: number;
  source_directory: string;
  consolidated_at: string;
  script_version: string;
}

interface BusinessItem {
  l1_domain: string;
  l2_feature: string;
  l3_functionality: string;
  evidence: string[];
  confidence: number;
}

interface FileResult {
  file_path: string;
  language_hint: string;
  items: BusinessItem[];
}

interface ProjectReport {
  project_name: string;
  root_dir: string;
  files_analyzed: number;
  results: FileResult[];
}

export interface ConsolidatedBusinessReportsData {
  metadata: ConsolidatedReportMetadata;
  reports: ProjectReport[];
}

export interface ConsolidatedBusinessReportsProps {
  readonly data: ConsolidatedBusinessReportsData | Record<string, unknown>;
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

// ============================================================================
// Helper Components
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, color = '#fb851e' }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ backgroundColor: `${color}15`, color }}>
      {icon}
    </div>
    <div className="stat-content">
      <p className="stat-title">{title}</p>
      <p className="stat-value" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {subtitle && <p className="stat-subtitle">{subtitle}</p>}
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
      `}</style>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ConsolidatedBusinessReports: React.FC<Readonly<ConsolidatedBusinessReportsProps>> = ({ data: rawData }) => {
  const data = useMemo(() => ({
    metadata: rawData?.metadata || { generated_at: new Date().toISOString(), total_projects: 0, overall_confidence: 0, analysis_version: '1.0' },
    reports: rawData?.reports || []
  }), [rawData]);
  // State - All hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'domains' | 'features' | 'details'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [selectedProject, setSelectedProject] = useState<ProjectReport | null>(null);
  const [sortField, setSortField] = useState<'name' | 'files'>('files');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Type guard to ensure data is in the correct format
  const reportData = useMemo(() => {
    if ('metadata' in data && 'reports' in data) {
      return data as ConsolidatedBusinessReportsData;
    }
    return null;
  }, [data]);

  // Computed data - all hooks must run unconditionally
  const domainDistribution = useMemo(() => {
    if (!reportData) return [];
    const domainMap = new Map<string, number>();
    reportData.reports.forEach((project) => {
      project.results.forEach((file) => {
        file.items.forEach((item) => {
          const count = domainMap.get(item.l1_domain) || 0;
          domainMap.set(item.l1_domain, count + 1);
        });
      });
    });
    return Array.from(domainMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [reportData]);

  const featureDistribution = useMemo(() => {
    if (!reportData) return [];
    const featureMap = new Map<string, number>();
    reportData.reports.forEach((project) => {
      project.results.forEach((file) => {
        file.items.forEach((item) => {
          const count = featureMap.get(item.l2_feature) || 0;
          featureMap.set(item.l2_feature, count + 1);
        });
      });
    });
    return Array.from(featureMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.name !== 'Helper Functions' && item.name !== 'Utility')
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  }, [reportData]);

  const languageDistribution = useMemo(() => {
    if (!reportData) return [];
    const langMap = new Map<string, number>();
    reportData.reports.forEach((project) => {
      project.results.forEach((file) => {
        const lang = file.language_hint || 'unknown';
        const count = langMap.get(lang) || 0;
        langMap.set(lang, count + 1);
      });
    });
    return Array.from(langMap.entries())
      .map(([name, value]) => ({ name, value, color: LANGUAGE_COLORS[name] || '#9ca3af' }))
      .sort((a, b) => b.value - a.value);
  }, [reportData]);

  const totalFiles = useMemo(() => {
    if (!reportData) return 0;
    return reportData.reports.reduce((sum, project) => sum + project.files_analyzed, 0);
  }, [reportData]);

  const totalItems = useMemo(() => {
    if (!reportData) return 0;
    return reportData.reports.reduce((sum, project) => {
      return sum + project.results.reduce((fileSum, file) => fileSum + file.items.length, 0);
    }, 0);
  }, [reportData]);

  const filteredProjects = useMemo(() => {
    if (!reportData) return [];
    let projects = [...reportData.reports];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      projects = projects.filter((p) => p.project_name.toLowerCase().includes(query));
    }

    // Domain filter
    if (selectedDomains.size > 0) {
      projects = projects.filter((project) => {
        return project.results.some((file) =>
          file.items.some((item) => selectedDomains.has(item.l1_domain))
        );
      });
    }

    // Sort
    projects.sort((a, b) => {
      const aVal = sortField === 'name' ? a.project_name.toLowerCase() : a.files_analyzed;
      const bVal = sortField === 'name' ? b.project_name.toLowerCase() : b.files_analyzed;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return projects;
  }, [reportData, searchQuery, selectedDomains, sortField, sortDirection]);

  const uniqueDomains = useMemo(() => {
    if (!reportData) return [];
    const domains = new Set<string>();
    reportData.reports.forEach((project) => {
      project.results.forEach((file) => {
        file.items.forEach((item) => {
          if (item.l1_domain && item.l1_domain !== 'Utility' && item.l1_domain !== 'Helper Functions') {
            domains.add(item.l1_domain);
          }
        });
      });
    });
    return Array.from(domains).sort();
  }, [reportData]);

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

  const clearAllFilters = () => {
    setSelectedDomains(new Set());
    setSearchQuery('');
  };

  const hasFilters = selectedDomains.size > 0 || searchQuery;

  const handleProjectClick = (project: ProjectReport) => {
    setSelectedProject(project);
    setActiveTab('details');
  };

  // Safeguard:
  // - Redirect to projects tab if details tab is active but no project is selected
  // - Clear selected project whenever we are not on the details tab
  useEffect(() => {
    if (activeTab === 'details' && !selectedProject) {
      setActiveTab('projects');
      return;
    }

    if (activeTab !== 'details' && selectedProject) {
      setSelectedProject(null);
    }
  }, [activeTab, selectedProject]);

  const exportToCSV = () => {
    const headers = ['Project Name', 'Files Analyzed', 'Total Items', 'Root Directory'];
    const rows = filteredProjects.map((p) => {
      const totalItems = p.results.reduce((sum, file) => sum + file.items.length, 0);
      return [p.project_name, p.files_analyzed.toString(), totalItems.toString(), p.root_dir];
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consolidated_business_reports_${new Date().toISOString().split('T')[0]}.csv`;
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
    const faviconImg = createLogoImg(faviconBase64, 'Liftr.ai Favicon', '16px', '16px');
    
    const logoImgTag = logoLightImg && faviconImg
      ? `${logoLightImg}<div style="width: 1px; height: 24px; background-color: #9ca3af; margin: 0 12px; align-self: center;"></div>${faviconImg}`
      : logoLightImg || faviconImg || '';

    // Get current state
    const exportData = {
      ...reportData,
      currentState: {
        activeTab,
        searchQuery,
        selectedDomains: Array.from(selectedDomains),
        selectedProject: selectedProject ? {
          project_name: selectedProject.project_name,
          root_dir: selectedProject.root_dir,
          files_analyzed: selectedProject.files_analyzed,
          results: selectedProject.results, // Include full results for details view
        } : null,
        sortField,
        sortDirection,
      },
      computedData: {
        domainDistribution,
        featureDistribution,
        languageDistribution,
        totalFiles,
        totalItems,
        uniqueDomains,
      },
    };

    // Create a standalone HTML export
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consolidated Business Reports - Export</title>
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
      const { useState, useMemo, useEffect, createElement: h, Fragment } = React;
      const { createRoot } = ReactDOM;
      
      // Access Recharts
      let RechartsLib = null;
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
          document.getElementById('root').innerHTML = 
            '<div class="p-10 text-center text-red-500">' +
            '<h2 class="text-2xl font-bold mb-4">Error Loading Dashboard</h2>' +
            '<p>Recharts library failed to load. Please check your internet connection and try again.</p>' +
            '</div>';
          return;
        }
      }
      
      // Reset retry counter on success
      window._rechartsRetryCount = 0;
      
      // Extract Recharts components
      const { 
        BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
        Tooltip, Legend, ResponsiveContainer
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
        ]
      };

      // Helper function to create Lucide icons as SVG elements
      function createLucideIcon(iconName, size = 24, className = '') {
        try {
          const paths = iconPaths[iconName];
          if (!paths) {
            // Fallback if icon not found
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
          // Return a simple placeholder SVG
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
            h('span', { className: 'text-xl font-bold' }, payload[0].value.toLocaleString())
          )
        );
      }

      function ConsolidatedBusinessReports() {
        const [activeTab, setActiveTab] = useState(data.currentState?.activeTab || 'overview');
        const [searchQuery, setSearchQuery] = useState(data.currentState?.searchQuery || '');
        const [selectedDomains, setSelectedDomains] = useState(new Set(data.currentState?.selectedDomains || []));
        const [selectedProject, setSelectedProject] = useState(data.currentState?.selectedProject || null);
        const [sortField, setSortField] = useState(data.currentState?.sortField || 'files');
        const [sortDirection, setSortDirection] = useState(data.currentState?.sortDirection || 'desc');
        const [isDomainOpen, setIsDomainOpen] = useState(false);

        const domainDistribution = useMemo(() => data.computedData?.domainDistribution || [], []);
        const featureDistribution = useMemo(() => data.computedData?.featureDistribution || [], []);
        const languageDistribution = useMemo(() => data.computedData?.languageDistribution || [], []);
        const totalFiles = useMemo(() => data.computedData?.totalFiles || 0, []);
        const totalItems = useMemo(() => data.computedData?.totalItems || 0, []);
        const uniqueDomains = useMemo(() => data.computedData?.uniqueDomains || [], []);

        const filteredProjects = useMemo(() => {
          let projects = [...data.reports];
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            projects = projects.filter(p => p.project_name.toLowerCase().includes(query));
          }
          if (selectedDomains.size > 0) {
            projects = projects.filter(project => {
              return project.results.some(file =>
                file.items.some(item => selectedDomains.has(item.l1_domain))
              );
            });
          }
          projects.sort((a, b) => {
            const aVal = sortField === 'name' ? a.project_name.toLowerCase() : a.files_analyzed;
            const bVal = sortField === 'name' ? b.project_name.toLowerCase() : b.files_analyzed;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
              return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
          });
          return projects;
        }, [searchQuery, selectedDomains, sortField, sortDirection]);

        const toggleDomain = (domain) => {
          setSelectedDomains(prev => {
            const next = new Set(prev);
            if (next.has(domain)) next.delete(domain);
            else next.add(domain);
            return next;
          });
        };

        const clearAllFilters = () => {
          setSelectedDomains(new Set());
          setSearchQuery('');
        };

        const hasFilters = selectedDomains.size > 0 || searchQuery;

        const handleProjectClick = (project) => {
          setSelectedProject({
            project_name: project.project_name,
            root_dir: project.root_dir,
            files_analyzed: project.files_analyzed,
            results: project.results,
          });
          setActiveTab('details');
        };

        // Safeguard: Redirect to projects tab if details tab is active but no project is selected
        useEffect(() => {
          if (activeTab === 'details' && !selectedProject) {
            setActiveTab('projects');
          }
        }, [activeTab, selectedProject]);

        // Clear selectedProject when leaving details tab
        useEffect(() => {
          if (activeTab !== 'details' && selectedProject) {
            setSelectedProject(null);
          }
        }, [activeTab]);

        return h('div', { className: 'min-h-screen bg-gray-50 p-8 font-sans' },
          // Header
          h('div', { className: 'flex justify-between items-start gap-6 mb-8 flex-wrap' },
            h('div', { className: 'flex items-center gap-5' },
              h('div', { className: 'w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg' }, 
                createLucideIcon('BarChart3', 40)
              ),
              h('div', null,
                h('h1', { className: 'text-3xl font-bold text-gray-800 mb-1' }, 'Consolidated Business Reports'),
                h('p', { className: 'text-gray-600' },
                  'Analysis of ',
                  h('span', { className: 'font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded' }, data.metadata.total_reports + ' projects'),
                  ' across your codebase'
                )
              )
            ),
            h('div', { className: 'flex gap-4 items-center' },
              h('span', { className: 'flex items-center gap-1.5 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200' },
                createLucideIcon('Globe', 14),
                ' Version ' + data.metadata.script_version
              ),
              h('span', { className: 'flex items-center gap-1.5 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200' },
                createLucideIcon('Database', 14),
                ' ' + new Date(data.metadata.consolidated_at).toLocaleDateString()
              )
            )
          ),
          // Tabs
          h('div', { className: 'bg-white border border-gray-200 rounded-xl p-1 mb-6 shadow-sm' },
            h('div', { className: 'flex gap-1' },
              [
                { id: 'overview', label: 'Overview' },
                { id: 'projects', label: 'Projects' },
                { id: 'domains', label: 'Domains' },
                { id: 'features', label: 'Features' },
                { id: 'details', label: 'Details' },
              ].map(tab => {
                const isDetailsTab = tab.id === 'details';
                const isDisabled = isDetailsTab && !selectedProject;
                return h('button', {
                  key: tab.id,
                  className: 'flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-transparent border-none rounded-lg text-sm font-medium transition-all ' +
                    (isDisabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'cursor-pointer') +
                    (activeTab === tab.id && !isDisabled ? ' bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md' : isDisabled ? '' : ' text-gray-600 hover:bg-gray-100'),
                  onClick: () => {
                    if (!isDisabled) {
                      setActiveTab(tab.id);
                    }
                  },
                  disabled: isDisabled,
                  title: isDisabled ? 'Select a project to view details' : ''
                }, tab.label);
              })
            )
          ),
          // Overview Tab
          activeTab === 'overview' && h('div', { className: 'flex flex-col gap-6' },
            h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5' },
              h(StatCard, { icon: createLucideIcon('Package', 28), title: 'Total Projects', value: data.metadata.total_reports, subtitle: 'Analyzed repositories', color: COLORS.primary }),
              h(StatCard, { icon: createLucideIcon('FileCode', 28), title: 'Files Analyzed', value: totalFiles, subtitle: 'Source code files', color: COLORS.secondary }),
              h(StatCard, { icon: createLucideIcon('Layers', 28), title: 'Business Items', value: totalItems, subtitle: 'Identified features', color: COLORS.success }),
              h(StatCard, { icon: createLucideIcon('Building2', 28), title: 'Business Domains', value: domainDistribution.length, subtitle: 'Unique domains', color: COLORS.warning }),
              h(StatCard, { icon: createLucideIcon('Code2', 28), title: 'Languages', value: languageDistribution.length, subtitle: 'Programming languages', color: COLORS.info })
            ),
            h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
              h('div', null,
                h(ChartCard, { title: 'Top Domains', subtitle: 'Business domains by occurrence', icon: createLucideIcon('Building2', 20) },
                  h(ResponsiveContainer, { width: '100%', height: 300 },
                    h(BarChart, { data: domainDistribution.slice(0, 5), layout: 'vertical', margin: { left: 150 } },
                      h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#f3f4f6' }),
                      h(XAxis, { type: 'number', tick: { fill: '#6b7280', fontSize: 12 } }),
                      h(YAxis, { dataKey: 'name', type: 'category', tick: { fill: '#374151', fontSize: 11 }, width: 140 }),
                      h(Tooltip, { content: h(CustomBarTooltip) }),
                      h(Bar, { dataKey: 'value', radius: [0, 6, 6, 0] },
                        domainDistribution.slice(0, 5).map((_, index) =>
                          h(Cell, { key: 'cell-' + index, fill: CHART_COLORS[index % CHART_COLORS.length] })
                        )
                      )
                    )
                  )
                )
              ),
              h('div', null,
                h(ChartCard, { title: 'Language Distribution', subtitle: 'Files by programming language', icon: createLucideIcon('Code2', 20) },
                  h(ResponsiveContainer, { width: '100%', height: 300 },
                    h(PieChart, null,
                      h(Pie, {
                        data: languageDistribution.slice(0, 8),
                        cx: '50%',
                        cy: '50%',
                        outerRadius: 100,
                        dataKey: 'value',
                        label: ({ name, percent }) => name + ' (' + (percent * 100).toFixed(0) + '%)'
                      },
                        languageDistribution.slice(0, 8).map((entry, index) =>
                          h(Cell, { key: 'cell-' + index, fill: entry.color })
                        )
                      ),
                      h(Tooltip, { content: h(CustomBarTooltip) })
                    )
                  )
                )
              )
            ),
            h(ChartCard, { title: 'Top 5 Features', subtitle: 'Business features by occurrence', icon: createLucideIcon('Layers', 20) },
              h(ResponsiveContainer, { width: '100%', height: 400 },
                h(BarChart, { data: featureDistribution.slice(0, 5), layout: 'vertical', margin: { left: 200 } },
                  h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#f3f4f6' }),
                  h(XAxis, { type: 'number', tick: { fill: '#6b7280', fontSize: 12 } }),
                  h(YAxis, { dataKey: 'name', type: 'category', tick: { fill: '#374151', fontSize: 11 }, width: 190 }),
                  h(Tooltip, { content: h(CustomBarTooltip) }),
                  h(Bar, { dataKey: 'value', radius: [0, 6, 6, 0] },
                    featureDistribution.slice(0, 5).map((_, index) =>
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
              h('div', { className: 'flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100' },
                h('input', {
                  type: 'text',
                  placeholder: 'Search projects...',
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                  className: 'flex-1 border-none bg-transparent text-gray-800 outline-none'
                })
              ),
              h('div', { className: 'flex flex-wrap gap-3 items-center' },
                h('div', { className: 'relative' },
                  h('button', {
                    className: 'flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 cursor-pointer transition-all hover:border-orange-500 hover:bg-gray-50',
                    onClick: () => setIsDomainOpen(prev => !prev)
                  },
                    'Domain',
                    selectedDomains.size > 0 && h('span', { className: 'bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full' }, selectedDomains.size),
                    ' ▼'
                  ),
                  isDomainOpen && h('div', { className: 'absolute top-full left-0 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[220px] max-h-[300px] overflow-y-auto z-50 p-2 mt-1' },
                    uniqueDomains.map(domain =>
                      h('label', {
                        key: domain,
                        className: 'flex items-center gap-2.5 px-3 py-2.5 rounded-md cursor-pointer transition-colors hover:bg-gray-100 text-sm'
                      },
                        h('input', {
                          type: 'checkbox',
                          checked: selectedDomains.has(domain),
                          onChange: () => toggleDomain(domain),
                          className: 'w-4 h-4 accent-orange-500'
                        }),
                        h('span', null, domain)
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
                    className: 'w-4.5 h-4.5 bg-orange-500 text-white border-none rounded-full cursor-pointer transition-colors hover:bg-orange-600 flex items-center justify-center text-xs',
                    onClick: () => toggleDomain(d)
                  }, '×')
                )
              ),
              searchQuery && h('span', { className: 'inline-flex items-center gap-1.5 bg-orange-50 text-orange-800 text-xs font-medium px-3 py-1 rounded-full' },
                '"' + searchQuery + '"',
                h('button', {
                  className: 'w-4.5 h-4.5 bg-orange-500 text-white border-none rounded-full cursor-pointer transition-colors hover:bg-orange-600 flex items-center justify-center text-xs',
                  onClick: () => setSearchQuery('')
                }, '×')
              ),
              h('button', { className: 'ml-auto bg-none border-none text-red-500 text-sm font-medium cursor-pointer hover:underline' }, 'Clear All')
            ),
            h('div', { className: 'text-sm text-gray-600' },
              'Showing ',
              h('strong', { className: 'text-gray-800' }, filteredProjects.length),
              ' of ',
              h('strong', { className: 'text-gray-800' }, data.metadata.total_reports),
              ' projects'
            ),
            h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
              filteredProjects.map(project => {
                const projectItems = project.results.reduce((sum, file) => sum + file.items.length, 0);
                return h('div', {
                  key: project.project_name,
                  className: 'bg-white border border-gray-200 rounded-xl p-5 transition-all hover:border-orange-500 hover:shadow-md hover:-translate-y-0.5 flex flex-col'
                },
                  h('div', { className: 'flex justify-between items-start gap-4 mb-4' },
                    h('div', { className: 'flex-1 min-w-0 overflow-hidden' },
                      h('h3', { 
                        className: 'text-lg font-bold text-gray-800 truncate',
                        title: project.project_name
                      }, project.project_name)
                    ),
                    h('div', { className: 'flex gap-6 flex-shrink-0' },
                      h('div', { className: 'flex flex-col items-end min-w-[60px]' },
                        h('span', { className: 'text-2xl font-bold text-orange-500 leading-tight' }, project.files_analyzed),
                        h('span', { className: 'text-xs text-gray-400 mt-0.5' }, 'Files')
                      ),
                      h('div', { className: 'flex flex-col items-end min-w-[60px]' },
                        h('span', { className: 'text-2xl font-bold text-orange-500 leading-tight' }, projectItems),
                        h('span', { className: 'text-xs text-gray-400 mt-0.5' }, 'Items')
                      )
                    )
                  ),
                  h('div', { className: 'flex justify-end mt-auto' },
                    h('button', {
                      className: 'px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:-translate-y-0.5',
                      onClick: () => handleProjectClick(project)
                    }, 'View Details')
                  )
                );
              })
            ),
            filteredProjects.length === 0 && h('div', { className: 'flex flex-col items-center justify-center py-16 text-center text-gray-400' },
              h('h3', { className: 'text-xl text-gray-700 mt-4 mb-2' }, 'No projects found'),
              h('p', { className: 'mb-4' }, 'Try adjusting your filters or search query'),
              h('button', {
                className: 'bg-orange-500 text-white border-none px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-orange-600',
                onClick: clearAllFilters
              }, 'Clear Filters')
            )
          ),
          // Domains Tab
          activeTab === 'domains' && h('div', { className: 'flex flex-col gap-6' },
            h(ChartCard, { title: 'Domain Distribution', subtitle: 'Business domains by occurrence', icon: createLucideIcon('Building2', 20) },
              h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' },
                domainDistribution.map((domain, index) => {
                  const maxValue = domainDistribution[0]?.value || 1;
                  const percentage = (domain.value / maxValue) * 100;
                  const color = CHART_COLORS[index % CHART_COLORS.length];
                  
                  return h('div', { 
                    key: domain.name, 
                    className: 'bg-white border border-gray-200 rounded-xl p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-orange-500'
                  },
                    h('div', { className: 'flex justify-between items-center mb-4' },
                      h('div', { className: 'flex items-center gap-3 flex-1 min-w-0' },
                        h('div', { 
                          className: 'w-3 h-3 rounded-full flex-shrink-0',
                          style: { backgroundColor: color, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }
                        }),
                        h('span', { className: 'text-base font-semibold text-gray-800 truncate' }, domain.name)
                      ),
                      h('span', { className: 'text-xl font-bold text-gray-700 ml-3 flex-shrink-0' }, domain.value.toLocaleString())
                    ),
                    h('div', { className: 'w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2' },
                      h('div', {
                        className: 'h-full rounded-full transition-all',
                        style: { 
                          width: percentage + '%',
                          backgroundColor: color,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }
                      })
                    ),
                    h('div', { className: 'text-xs text-gray-500 text-right' }, percentage.toFixed(1) + '% of max')
                  );
                })
              )
            )
          ),
          // Features Tab
          activeTab === 'features' && h('div', { className: 'flex flex-col gap-6' },
            h(ChartCard, { title: 'Top Features', subtitle: 'Business features by occurrence', icon: createLucideIcon('Layers', 20) },
              h(ResponsiveContainer, { width: '100%', height: 500 },
                h(BarChart, { data: featureDistribution, layout: 'vertical', margin: { left: 200 } },
                  h(CartesianGrid, { strokeDasharray: '3 3', stroke: '#f3f4f6' }),
                  h(XAxis, { type: 'number', tick: { fill: '#6b7280', fontSize: 12 } }),
                  h(YAxis, { dataKey: 'name', type: 'category', tick: { fill: '#374151', fontSize: 11 }, width: 190 }),
                  h(Tooltip, { content: h(CustomBarTooltip) }),
                  h(Bar, { dataKey: 'value', radius: [0, 6, 6, 0] },
                    featureDistribution.map((_, index) =>
                      h(Cell, { key: 'cell-' + index, fill: CHART_COLORS[(index + 4) % CHART_COLORS.length] })
                    )
                  )
                )
              )
            )
          ),
          // Details Tab
          activeTab === 'details' && h('div', { className: 'flex flex-col gap-6' },
            selectedProject ? (() => {
              const fullProject = data.reports.find(p => p.project_name === selectedProject.project_name);
              if (!fullProject) return h('div', null, 'Project not found');
              return h('div', { className: 'bg-white border border-gray-200 rounded-2xl p-6' },
                h('div', { className: 'flex justify-between items-start mb-6 pb-6 border-b border-gray-200' },
                  h('div', null,
                    h('h2', { className: 'text-2xl font-bold text-gray-800 mb-2' }, fullProject.project_name)                  ),
                  h('button', {
                    className: 'bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700 cursor-pointer transition-all hover:border-orange-500 hover:text-orange-500',
                    onClick: () => setActiveTab('projects')
                  }, '← Back to Projects')
                ),
                h('div', { className: 'flex gap-6 mb-6' },
                  h('div', { className: 'flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-200' },
                    h('span', { className: 'text-3xl font-bold text-orange-500' }, fullProject.files_analyzed),
                    h('span', { className: 'text-sm text-gray-600 mt-1' }, 'Files Analyzed')
                  ),
                  h('div', { className: 'flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-200' },
                    h('span', { className: 'text-3xl font-bold text-orange-500' },
                      fullProject.results.reduce((sum, file) => sum + file.items.length, 0)
                    ),
                    h('span', { className: 'text-sm text-gray-600 mt-1' }, 'Business Items')
                  )
                ),
                h('div', { className: 'flex flex-col gap-4' },
                  fullProject.results.map((file, fileIdx) =>
                    h('div', { key: fileIdx, className: 'border border-gray-200 rounded-xl overflow-hidden' },
                      h('div', { className: 'flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200' },
                        h('div', { className: 'flex items-center gap-3 flex-1 min-w-0' },
                          h('span', { className: 'text-sm font-semibold text-gray-800' }, file.file_path.split('/').pop()),
                          h('span', {
                            className: 'text-xs font-semibold px-2 py-1 rounded bg-gray-100',
                            style: { color: LANGUAGE_COLORS[file.language_hint] || '#6b7280' }
                          }, file.language_hint)
                        ),
                        h('span', { className: 'text-sm text-gray-600 font-medium' }, file.items.length + ' items')
                      ),
                      file.items.length > 0 && h('div', { className: 'p-4 flex flex-col gap-3' },
                        file.items.map((item, itemIdx) =>
                          h('div', { key: itemIdx, className: 'p-4 bg-white border border-gray-200 rounded-lg' },
                            h('div', { className: 'flex justify-between items-center mb-2' },
                              h('div', { className: 'text-sm font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-md' }, item.l1_domain),
                              h('div', { className: 'text-xs text-green-600 font-semibold' },
                                (item.confidence * 100).toFixed(0) + '% confidence'
                              )
                            ),
                            h('div', { className: 'text-sm font-semibold text-gray-700 mb-2' }, item.l2_feature),
                            h('div', { className: 'text-sm text-gray-600 leading-relaxed mb-3' }, item.l3_functionality),
                            item.evidence.length > 0 && h('div', { className: 'mt-3 pt-3 border-t border-gray-200' },
                              h('span', { className: 'text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2' }, 'Evidence:'),
                              h('div', { className: 'flex flex-wrap gap-1.5' },
                                item.evidence.map((evidence, evIdx) =>
                                  h('span', { key: evIdx, className: 'text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md border border-gray-200' }, evidence)
                                )
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              );
            })() : h('div', { className: 'flex flex-col items-center justify-center py-16 text-center text-gray-400' },
              h('h3', { className: 'text-xl text-gray-700 mt-4 mb-2' }, 'No project selected'),
              h('p', { className: 'mb-4' }, 'Select a project from the Projects tab to view details'),
              h('button', {
                className: 'bg-orange-500 text-white border-none px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-orange-600',
                onClick: () => setActiveTab('projects')
              }, 'View Projects')
            )
          ),
        );
      }

      // Render the app with error handling
      try {
        const rootElement = document.getElementById('root');
        if (!rootElement) {
          throw new Error('Root element not found');
        }
        
        const root = createRoot(rootElement);
        root.render(h(ConsolidatedBusinessReports));
        console.log('Dashboard rendered successfully');
      } catch (error) {
        console.error('Error rendering dashboard:', error);
        document.getElementById('root').innerHTML = 
          '<div class="p-10 text-center text-red-500">' +
          '<h2 class="text-2xl font-bold mb-4">Error Rendering Dashboard</h2>' +
          '<p>' + (error.message || 'Unknown error occurred') + '</p>' +
          '</div>';
      }
    }
    
    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initApp, 300);
      });
    } else {
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
    link.download = `consolidated_business_reports_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Handle null case in render
  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <p className="text-gray-500">Invalid or missing data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="business-reports-container">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="header-icon">
            <BarChart3 size={28} />
          </div>
          <div>
            <h1 className="header-title">Consolidated Business Reports</h1>
            <p className="header-subtitle">
              Analysis of{' '}
              <span className="highlight">{reportData.metadata.total_reports} projects</span> across your codebase
            </p>
          </div>
        </div>
        <div className="header-meta">
          <span className="meta-item">
            <Globe size={14} />
            Version {reportData.metadata.script_version}
          </span>
          <span className="meta-item">
            <Database size={14} />
            {new Date(reportData.metadata.consolidated_at).toLocaleDateString()}
          </span>
          <button className="export-html-button" onClick={exportToHTML}>
            <Download size={16} />
            Export HTML
          </button>
          <button className="export-button" onClick={exportToCSV}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <div className="tabs">
          {[
            { id: 'overview', label: 'Overview', icon: <PieChartIcon size={18} /> },
            { id: 'projects', label: 'Projects', icon: <FolderTree size={18} /> },
            { id: 'domains', label: 'Domains', icon: <Building2 size={18} /> },
            { id: 'features', label: 'Features', icon: <Layers size={18} /> },
            { id: 'details', label: 'Details', icon: <FileCode size={18} /> },
          ].map((tab) => {
            const isDetailsTab = tab.id === 'details';
            const isDisabled = isDetailsTab && !selectedProject;
            return (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => {
                  if (!isDisabled) {
                    setActiveTab(tab.id as typeof activeTab);
                  }
                }}
                disabled={isDisabled}
                title={isDisabled ? 'Select a project to view details' : ''}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
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
              value={reportData.metadata.total_reports}
              subtitle="Analyzed repositories"
              color={COLORS.primary}
            />
            <StatCard
              icon={<FileCode size={28} />}
              title="Files Analyzed"
              value={totalFiles}
              subtitle="Source code files"
              color={COLORS.secondary}
            />
            <StatCard
              icon={<Layers size={28} />}
              title="Business Items"
              value={totalItems}
              subtitle="Identified features"
              color={COLORS.success}
            />
            <StatCard
              icon={<Building2 size={28} />}
              title="Business Domains"
              value={domainDistribution.length}
              subtitle="Unique domains"
              color={COLORS.warning}
            />
            <StatCard
              icon={<Code2 size={28} />}
              title="Languages"
              value={languageDistribution.length}
              subtitle="Programming languages"
              color={COLORS.info}
            />
          </div>

          {/* Charts Row */}
          <div className="charts-row">
            <div className="chart-col-2">
              <ChartCard title="Top Domains" subtitle="Business domains by occurrence" icon={<Building2 size={20} />}>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={domainDistribution.slice(0, 5)} layout="vertical" margin={{ left: 150 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: '#374151', fontSize: 11 }}
                        width={140}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {domainDistribution.slice(0, 5).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            <div className="chart-col-2">
              <ChartCard title="Language Distribution" subtitle="Files by programming language" icon={<Code2 size={20} />}>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={languageDistribution.slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {languageDistribution.slice(0, 8).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomBarTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          </div>

          {/* Top Features Chart */}
          <ChartCard title="Top 5 Features" subtitle="Business features by occurrence" icon={<Layers size={20} />}>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={featureDistribution.slice(0, 5)} layout="vertical" margin={{ left: 200 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#374151', fontSize: 11 }} width={190} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {featureDistribution.slice(0, 5).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 4) % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
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
                      <span>{domain}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                className="sort-button"
                onClick={() => {
                  if (sortField === 'files') {
                    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortField('files');
                    setSortDirection('desc');
                  }
                }}
              >
                {sortDirection === 'desc' ? <SortDesc size={16} /> : <SortAsc size={16} />}
                Sort by Files
              </button>

              <button
                className="sort-button"
                onClick={() => {
                  if (sortField === 'name') {
                    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortField('name');
                    setSortDirection('asc');
                  }
                }}
              >
                {sortField === 'name' && sortDirection === 'desc' ? <SortDesc size={16} /> : <SortAsc size={16} />}
                Sort by Name
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
              {searchQuery && <FilterBadge label={`"${searchQuery}"`} onRemove={() => setSearchQuery('')} />}
              <button className="clear-all-btn" onClick={clearAllFilters}>
                Clear All
              </button>
            </div>
          )}

          {/* Results count */}
          <div className="results-count">
            Showing <strong>{filteredProjects.length}</strong> of{' '}
            <strong>{reportData.metadata.total_reports}</strong> projects
          </div>

          {/* Projects List */}
          <div className="projects-list">
            {filteredProjects.map((project) => {
              const projectItems = project.results.reduce((sum, file) => sum + file.items.length, 0);
              return (
                <div
                  key={project.project_name}
                  className="project-item"
                >
                  <div className="project-header">
                    <div className="project-info">
                      <h3 className="project-name">{project.project_name}</h3>
                    </div>
                    <div className="project-stats">
                      <div className="stat-item">
                        <span className="stat-value">{project.files_analyzed}</span>
                        <span className="stat-label">Files</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{projectItems}</span>
                        <span className="stat-label">Items</span>
                      </div>
                    </div>
                  </div>
                  <div className="project-footer">
                    <button 
                      className="view-details-button"
                      onClick={() => handleProjectClick(project)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
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

      {/* Domains Tab */}
      {activeTab === 'domains' && (
        <div className="tab-content">
          <ChartCard title="Domain Distribution" subtitle="Business domains by occurrence" icon={<Building2 size={20} />}>
            <div className="domains-grid">
              {domainDistribution.map((domain, index) => {
                const maxValue = domainDistribution[0]?.value || 1;
                const percentage = (domain.value / maxValue) * 100;
                const color = CHART_COLORS[index % CHART_COLORS.length];
                
                return (
                  <div key={`domain-${domain.name}-${domain.value}`} className="domain-card">
                    <div className="domain-card-header">
                      <div className="domain-name-wrapper">
                        <div 
                          className="domain-color-indicator" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="domain-name">{domain.name}</span>
                      </div>
                      <span className="domain-value">{domain.value.toLocaleString()}</span>
                    </div>
                    <div className="domain-progress-container">
                      <div 
                        className="domain-progress-bar"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: color
                        }}
                      />
                    </div>
                    <div className="domain-percentage">
                      {percentage.toFixed(1)}% of max
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="tab-content">
          <ChartCard title="Top Features" subtitle="Business features by occurrence" icon={<Layers size={20} />}>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={featureDistribution} layout="vertical" margin={{ left: 200 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#374151', fontSize: 11 }} width={190} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {featureDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 4) % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="tab-content">
          {selectedProject ? (
            <div className="project-details">
              <div className="details-header">
                <div>
                  <h2 className="details-title">{selectedProject.project_name}</h2>
                </div>
                <button className="back-button" onClick={() => setActiveTab('projects')}>
                  ← Back to Projects
                </button>
              </div>

              <div className="details-stats">
                <div className="detail-stat">
                  <span className="detail-stat-value">{selectedProject.files_analyzed}</span>
                  <span className="detail-stat-label">Files Analyzed</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-value">
                    {selectedProject.results.reduce((sum, file) => sum + file.items.length, 0)}
                  </span>
                  <span className="detail-stat-label">Business Items</span>
                </div>
              </div>

              <div className="business-items-table-container">
                <table className="business-items-table">
                  <thead>
                    <tr>
                      <th>Program</th>
                      <th>L1 Domain</th>
                      <th>L2 Feature</th>
                      <th>L3 Functionality</th>
                      <th>Confidence</th>
                      <th>Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProject.results.flatMap((file, fileIdx) =>
                      file.items.map((item, itemIdx) => (
                        <tr key={`${fileIdx}-${itemIdx}`}>
                          <td>
                            <div className="program-cell">
                              <FileCode size={14} />
                              <span className="program-name">{file.file_path.split('/').pop()}</span>
                              <span
                                className="program-language"
                                style={{ color: LANGUAGE_COLORS[file.language_hint] || '#6b7280' }}
                              >
                                {file.language_hint}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="l1-badge">{item.l1_domain}</span>
                          </td>
                          <td>
                            <span className="l2-text">{item.l2_feature}</span>
                          </td>
                          <td>
                            <span className="l3-text">{item.l3_functionality}</span>
                          </td>
                          <td>
                            <span className={`confidence-badge ${item.confidence >= 0.8 ? 'high' : item.confidence >= 0.6 ? 'medium' : 'low'}`}>
                              {(item.confidence * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td>
                            {item.evidence.length > 0 ? (
                              <details className="evidence-details">
                                <summary className="evidence-summary">
                                  {item.evidence.length} item{item.evidence.length > 1 ? 's' : ''}
                                </summary>
                                <div className="evidence-dropdown">
                                  {item.evidence.map((ev, evIdx) => (
                                    <span key={evIdx} className="evidence-item">{ev}</span>
                                  ))}
                                </div>
                              </details>
                            ) : (
                              <span className="no-evidence">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {selectedProject.results.every(file => file.items.length === 0) && (
                  <div className="empty-table-message">
                    <p>No business items found in this project</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <FileCode size={48} />
              <h3>No project selected</h3>
              <p>Select a project from the Projects tab to view details</p>
              <button className="view-projects-btn" onClick={() => setActiveTab('projects')}>
                View Projects
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .business-reports-container {
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
          align-items: center;
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
          padding: 10px 14px;
          background: linear-gradient(135deg, #fb851e 0%, #ff6b35 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
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

        .export-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #fb851e;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .export-button:hover {
          background: #ea580c;
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

        .tab-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        .tab-button.disabled:hover {
          background: transparent;
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

        .sort-button {
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

        .sort-button:hover {
          border-color: #fb851e;
          background: #f9fafb;
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

        .projects-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .project-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .project-item:hover {
          border-color: #fb851e;
          box-shadow: 0 4px 12px rgba(251, 133, 30, 0.1);
          transform: translateY(-2px);
        }

        .view-details-button {
          padding: 10px 20px;
          background: linear-gradient(135deg, #fb851e 0%, #ff6b35 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(251, 133, 30, 0.3);
        }

        .view-details-button:hover {
          background: linear-gradient(135deg, #ea580c 0%, #fb851e 100%);
          box-shadow: 0 4px 12px rgba(251, 133, 30, 0.4);
          transform: translateY(-1px);
        }

        .view-details-button:active {
          transform: translateY(0);
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }

        .project-info {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }

        .project-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .project-stats {
          display: flex;
          gap: 24px;
          flex-shrink: 0;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          min-width: 60px;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fb851e;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 2px;
        }

        .project-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: auto;
        }

        .no-results,
        .no-selection {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px;
          text-align: center;
          color: #9ca3af;
        }

        .no-results h3,
        .no-selection h3 {
          font-size: 1.25rem;
          color: #374151;
          margin: 16px 0 8px 0;
        }

        .no-results p,
        .no-selection p {
          margin: 0 0 16px 0;
        }

        .no-results button,
        .view-projects-btn {
          background: #fb851e;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
        }

        .no-results button:hover,
        .view-projects-btn:hover {
          background: #ea580c;
        }

        .project-details {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
        }

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .details-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .details-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
          word-break: break-all;
        }

        .back-button {
          background: white;
          border: 1px solid #e5e7eb;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-button:hover {
          border-color: #fb851e;
          color: #fb851e;
        }

        .details-stats {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
        }

        .detail-stat {
          display: flex;
          flex-direction: column;
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .detail-stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #fb851e;
        }

        .detail-stat-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 4px;
        }

        .files-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .file-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .file-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .file-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.9375rem;
        }

        .file-language {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.05);
        }

        .file-items-count {
          font-size: 0.8125rem;
          color: #6b7280;
          font-weight: 500;
        }

        .items-list {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .item-card {
          padding: 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .item-domain {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #fb851e;
          background: #fff7ed;
          padding: 4px 12px;
          border-radius: 6px;
        }

        .item-confidence {
          font-size: 0.75rem;
          color: #10b981;
          font-weight: 600;
        }

        .item-feature {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .item-functionality {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .item-evidence {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .evidence-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          display: block;
        }

        .evidence-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .evidence-tag {
          font-size: 0.75rem;
          padding: 4px 10px;
          background: #f3f4f6;
          color: #374151;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        /* Business Items Table Styles */
        .business-items-table-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .business-items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .business-items-table thead {
          background: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
        }

        .business-items-table th {
          padding: 14px 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          font-size: 0.8125rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          white-space: nowrap;
        }

        .business-items-table tbody tr {
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.15s ease;
        }

        .business-items-table tbody tr:hover {
          background: #fafafa;
        }

        .business-items-table tbody tr:last-child {
          border-bottom: none;
        }

        .business-items-table td {
          padding: 14px 16px;
          vertical-align: top;
          color: #4b5563;
        }

        .program-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 180px;
        }

        .program-name {
          font-weight: 500;
          color: #1f2937;
          word-break: break-word;
        }

        .program-language {
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.04);
          white-space: nowrap;
        }

        .l1-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #fb851e;
          background: #fff7ed;
          padding: 4px 10px;
          border-radius: 6px;
          white-space: nowrap;
        }

        .l2-text {
          font-weight: 500;
          color: #374151;
        }

        .l3-text {
          color: #6b7280;
          line-height: 1.5;
        }

        .confidence-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          white-space: nowrap;
        }

        .confidence-badge.high {
          background: #d1fae5;
          color: #059669;
        }

        .confidence-badge.medium {
          background: #fef3c7;
          color: #d97706;
        }

        .confidence-badge.low {
          background: #fee2e2;
          color: #dc2626;
        }

        .evidence-details {
          cursor: pointer;
        }

        .evidence-summary {
          font-size: 0.8125rem;
          color: #6366f1;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 4px;
          background: #eef2ff;
          display: inline-block;
          cursor: pointer;
          user-select: none;
        }

        .evidence-summary:hover {
          background: #e0e7ff;
        }

        .evidence-dropdown {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .evidence-item {
          font-size: 0.75rem;
          padding: 6px 10px;
          background: #f3f4f6;
          color: #374151;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .no-evidence {
          color: #9ca3af;
        }

        .empty-table-message {
          padding: 40px;
          text-align: center;
          color: #6b7280;
        }

        .domains-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .domain-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .domain-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          border-color: #fb851e;
        }

        .domain-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .domain-name-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .domain-color-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .domain-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .domain-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #374151;
          margin-left: 12px;
          flex-shrink: 0;
        }

        .domain-progress-container {
          width: 100%;
          height: 12px;
          background: #f3f4f6;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 8px;
          position: relative;
        }

        .domain-progress-bar {
          height: 100%;
          border-radius: 6px;
          transition: width 0.5s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .domain-percentage {
          font-size: 0.75rem;
          color: #6b7280;
          text-align: right;
        }

        @media (max-width: 768px) {
          .business-reports-container {
            padding: 16px;
          }

          .header {
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          }

          .tabs {
            flex-direction: column;
          }

          .filter-dropdowns {
            flex-direction: column;
            align-items: stretch;
          }

          .project-header {
            flex-direction: column;
          }

          .project-stats {
            align-self: flex-start;
          }

          .domains-grid {
            grid-template-columns: 1fr;
          }

          .domain-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .domain-value {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ConsolidatedBusinessReports;
