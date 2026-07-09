import React, { useState, useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Download, Filter, ChevronDown, ChevronRight, Package, Layers, FileCode, AlertCircle } from 'lucide-react';

// TypeScript Interfaces
// interface Technology {
//   name: string;
//   count: number;
// }

interface L3Component {
  l3_component: string;
  l3_description: string;
  related_files: string[];
}

interface L2Feature {
  l2_feature: string;
  l2_description: string;
  l3_components: L3Component[];
}

interface L1Domain {
  l1_domain: string;
  l1_description: string;
  l2_features: L2Feature[];
}

interface Project {
  project_name: string;
  analysis_date: string;
  technology_stack: string[];
  business_features: L1Domain[];
}

interface Statistics {
  total_projects_analyzed: number;
  projects_with_errors: number;
  projects_successfully_analyzed: number;
  technology_analysis: {
    unique_technologies: number;
    total_technology_references: number;
    top_technologies: Record<string, number>;
    projects_by_technology_count: Record<string, number>;
  };
  business_domain_analysis: {
    unique_l1_domains: number;
    total_l1_references: number;
    top_l1_domains: Record<string, number>;
    average_domains_per_project: number;
  };
  feature_analysis: {
    unique_l2_features: number;
    total_l2_references: number;
    top_l2_features: Record<string, number>;
    average_features_per_project: number;
  };
  component_analysis: {
    unique_l3_components: number;
    total_l3_references: number;
    top_l3_components: Record<string, number>;
    average_components_per_project: number;
  };
}

export interface ModuleAnalysisData {
  consolidation_date: string;
  source_directory: string;
  total_projects: number;
  projects: Project[];
  statistics: Statistics;
}

export interface ModuleAnalysisProps {
    data: ModuleAnalysisData;
}

const BRAND_COLOR = '#fb851e';
const COLORS = ['#fb851e', '#ff6b35', '#f7931e', '#ffa500', '#ffb347', '#ffc04d', '#ffd27f'];

const ModuleAnalysisViz: React.FC<ModuleAnalysisProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'technologies' | 'domains' | 'features' | 'projects'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [featureSearchTerm, setFeatureSearchTerm] = useState('');
  const [selectedL1Filter, setSelectedL1Filter] = useState<string>('all');

  // Process data for visualizations
  const techData = useMemo(() => {
    return Object.entries(data.statistics.technology_analysis.top_technologies)
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));
  }, [data.statistics.technology_analysis.top_technologies]);

  const domainData = useMemo(() => {
    return Object.entries(data.statistics.business_domain_analysis.top_l1_domains)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [data.statistics.business_domain_analysis.top_l1_domains]);

  const featureData = useMemo(() => {
    return Object.entries(data.statistics.feature_analysis.top_l2_features)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [data.statistics.feature_analysis.top_l2_features]);

  const projectComplexityData = useMemo(() => {
    return Object.entries(data.statistics.technology_analysis.projects_by_technology_count)
      .map(([range, count]) => ({ range, count }));
  }, [data.statistics.technology_analysis.projects_by_technology_count]);

  const filteredProjects = useMemo(() => {
    return data.projects.filter(project =>
      project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.technology_stack.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [data.projects, searchTerm]);

  // Flatten business features for grid view
  const businessFeaturesGrid = useMemo(() => {
    const features: Array<{
      projectName: string;
      l1Domain: string;
      l1Description: string;
      l2Feature: string;
      l2Description: string;
      componentCount: number;
    }> = [];

    for (const project of data.projects) {
      if (project.business_features) {
        for (const domain of project.business_features) {
          for (const feature of domain.l2_features) {
            features.push({
              projectName: project.project_name,
              l1Domain: domain.l1_domain,
              l1Description: domain.l1_description,
              l2Feature: feature.l2_feature,
              l2Description: feature.l2_description,
              componentCount: feature.l3_components?.length
            });
          }
        }
      }
    }

    return features;
  }, [data.projects]);

  // Get unique L1 domains for filter
  const uniqueL1Domains = useMemo(() => {
    const domains = new Set<string>();
    for (const f of businessFeaturesGrid) {
      domains.add(f.l1Domain);
    }
    return Array.from(domains).sort((a,b) => a.localeCompare(b));
  }, [businessFeaturesGrid]);

  // Filter business features grid
  const filteredBusinessFeatures = useMemo(() => {
    return businessFeaturesGrid.filter(feature => {
      const matchesSearch = 
        feature.projectName.toLowerCase().includes(featureSearchTerm.toLowerCase()) ||
        feature.l1Domain.toLowerCase().includes(featureSearchTerm.toLowerCase()) ||
        feature.l2Feature.toLowerCase().includes(featureSearchTerm.toLowerCase()) ||
        feature.l2Description.toLowerCase().includes(featureSearchTerm.toLowerCase());
      
      const matchesL1Filter = selectedL1Filter === 'all' || feature.l1Domain === selectedL1Filter;
      
      return matchesSearch && matchesL1Filter;
    });
  }, [businessFeaturesGrid, featureSearchTerm, selectedL1Filter]);

  const toggleDomain = (domain: string) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain);
    } else {
      newExpanded.add(domain);
    }
    setExpandedDomains(newExpanded);
  };

  const exportToCSV = () => {
    const headers = ['Project Name', 'Analysis Date', 'Technologies', 'Domains', 'Features', 'Components'];
    const rows = data.projects.map(project => [
      project.project_name,
      project.analysis_date,
      project.technology_stack.join('; '),
      project.business_features.length,
      project.business_features.reduce((sum, d) => sum + d.l2_features.length, 0),
      project.business_features.reduce((sum, d) => sum + d.l2_features.reduce((s, f) => s + (f.l3_components?.length || 0), 0), 0)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lifter_analysis_export.csv';
    a.click();
  };

  const exportToMarkdown = () => {
    let md = `# The Lifter Consolidated Module Analysis Report\n\n`;
    md += `**Generated:** ${data.consolidation_date}\n\n`;
    md += `**Total Projects:** ${data.total_projects}\n\n`;
    md += `## Executive Summary\n\n`;
    md += `- **Unique Technologies:** ${data.statistics.technology_analysis.unique_technologies}\n`;
    md += `- **Business Domains:** ${data.statistics.business_domain_analysis.unique_l1_domains}\n`;
    md += `- **Features Identified:** ${data.statistics.feature_analysis.unique_l2_features}\n`;
    md += `- **Components Mapped:** ${data.statistics.component_analysis.unique_l3_components}\n\n`;
    
    md += `## Top Technologies\n\n`;
    for (const tech of techData) {
      md += `- **${tech.name}**: ${tech.count} projects\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lifter_analysis_report.md';
    a.click();
  };

  const handleExportHTML = async () => {
    try {
      // Serialize current state
      const exportState = {
        activeTab,
        searchTerm,
        selectedProject: selectedProject?.project_name || null,
        expandedDomains: Array.from(expandedDomains),
        featureSearchTerm,
        selectedL1Filter,
        data
      };

      // Generate filename
      const filename = `module-analysis-${activeTab}-${new Date().toISOString().split('T')[0]}.html`;

      // Load and convert logo to base64
      let logoBase64 = '';
      try {
        const response = await fetch('/assets/logo-light.png');
        if (response.ok) {
          const blob = await response.blob();
          logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              resolve(base64String);
            };
            reader.readAsDataURL(blob);
          });
        }
      } catch (logoError) {
        console.warn('Could not load logo image:', logoError);
      }

      // Load and convert favicon to base64
      let faviconBase64 = '';
      try {
        const response = await fetch('/favicon-3.webp');
        if (response.ok) {
          const blob = await response.blob();
          faviconBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              resolve(base64String);
            };
            reader.readAsDataURL(blob);
          });
        }
      } catch (faviconError) {
        console.warn('Could not load favicon image:', faviconError);
      }

      // Generate the HTML content
      const htmlContent = generateStandaloneHTML(exportState, logoBase64, faviconBase64);

      // Create and download the file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting HTML:', error);
      alert('Failed to export HTML. Please try again.');
    }
  };

  // Generate standalone HTML with embedded component
  const generateStandaloneHTML = (state: {
    activeTab: 'overview' | 'technologies' | 'domains' | 'features' | 'projects';
    searchTerm: string;
    selectedProject: string | null;
    expandedDomains: string[];
    featureSearchTerm: string;
    selectedL1Filter: string;
    data: ModuleAnalysisData;
  }, logoBase64: string = '', faviconBase64: string = ''): string => {
    const dataJson = JSON.stringify(state.data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
    const initialStateJson = JSON.stringify({
      activeTab: state.activeTab,
      searchTerm: state.searchTerm,
      selectedProject: state.selectedProject,
      expandedDomains: state.expandedDomains,
      featureSearchTerm: state.featureSearchTerm,
      selectedL1Filter: state.selectedL1Filter
    }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LIFTR.ai Consolidated Module Analysis</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/prop-types@15/prop-types.min.js"></script>
  <script src="https://unpkg.com/recharts@1.6.2/umd/Recharts.js"></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // Ensure PropTypes is available for Recharts
    if (typeof PropTypes !== 'undefined' && typeof React !== 'undefined') {
      React.PropTypes = PropTypes;
    }
    const { createElement: h, useState, useMemo } = React;
    const { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = Recharts;

    // Embedded data
    const DATA = ${dataJson};
    const INITIAL_STATE = ${initialStateJson};
    const LOGO_BASE64 = ${logoBase64 ? `'${logoBase64}'` : "''"};
    const FAVICON_BASE64 = ${faviconBase64 ? `'${faviconBase64}'` : "''"};
    const BRAND_COLOR = '#fb851e';
    const COLORS = ['#fb851e', '#ff6b35', '#f7931e', '#ffa500', '#ffb347', '#ffc04d', '#ffd27f'];

    // Icons (using Lucide)
    const icons = {
      Search: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('circle', { cx: 11, cy: 11, r: 8 }), h('path', { d: 'm21 21-4.35-4.35' })),
      Download: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }), h('polyline', { points: '7 10 12 15 17 10' }), h('line', { x1: 12, y1: 15, x2: 12, y2: 3 })),
      Filter: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('polygon', { points: '22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' })),
      ChevronDown: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('polyline', { points: '6 9 12 15 18 9' })),
      ChevronRight: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('polyline', { points: '9 18 15 12 9 6' })),
      Package: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('line', { x1: 16.5, y1: 9.4, x2: 7.5, y2: 4.21 }), h('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }), h('polyline', { points: '3.27 6.96 12 12.01 20.73 6.96' }), h('line', { x1: 12, y1: 22.08, x2: 12, y2: 12 })),
      Layers: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('polygon', { points: '12 2 2 7 12 12 22 7 12 2' }), h('polyline', { points: '2 17 12 22 22 17' }), h('polyline', { points: '2 12 12 17 22 12' })),
      FileCode: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }), h('polyline', { points: '14 2 14 8 20 8' }), h('polyline', { points: '16 13 13 16 16 19' }), h('polyline', { points: '8 13 11 16 8 19' })),
      AlertCircle: () => h('svg', { width: 48, height: 48, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('circle', { cx: 12, cy: 12, r: 10 }), h('line', { x1: 12, y1: 8, x2: 12, y2: 12 }), h('line', { x1: 12, y1: 16, x2: 12.01, y2: 16 }))
    };

    // Main Component
    function ModuleAnalysisViz() {
      const [activeTab, setActiveTab] = useState(INITIAL_STATE.activeTab);
      const [searchTerm, setSearchTerm] = useState(INITIAL_STATE.searchTerm);
      const [selectedProject, setSelectedProject] = useState(INITIAL_STATE.selectedProject);
      const [expandedDomains, setExpandedDomains] = useState(new Set(INITIAL_STATE.expandedDomains));
      const [featureSearchTerm, setFeatureSearchTerm] = useState(INITIAL_STATE.featureSearchTerm);
      const [selectedL1Filter, setSelectedL1Filter] = useState(INITIAL_STATE.selectedL1Filter);

      // Process data for visualizations
      const techData = useMemo(() => {
        return Object.entries(DATA.statistics.technology_analysis.top_technologies)
          .slice(0, 15)
          .map(([name, count]) => ({ name, count }));
      }, []);

      const domainData = useMemo(() => {
        return Object.entries(DATA.statistics.business_domain_analysis.top_l1_domains)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }));
      }, []);

      const featureData = useMemo(() => {
        return Object.entries(DATA.statistics.feature_analysis.top_l2_features)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }));
      }, []);

      const projectComplexityData = useMemo(() => {
        return Object.entries(DATA.statistics.technology_analysis.projects_by_technology_count)
          .map(([range, count]) => ({ range, count }));
      }, []);

      const filteredProjects = useMemo(() => {
        return DATA.projects.filter(project =>
          project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.technology_stack.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }, [searchTerm]);

      const businessFeaturesGrid = useMemo(() => {
        const features = [];
        DATA.projects.forEach(project => {
          project.business_features?.forEach(domain => {
            domain.l2_features.forEach(feature => {
              features.push({
                projectName: project.project_name,
                l1Domain: domain.l1_domain,
                l1Description: domain.l1_description,
                l2Feature: feature.l2_feature,
                l2Description: feature.l2_description,
                componentCount: feature.l3_components?.length || 0
              });
            });
          });
        });
        return features;
      }, []);

      const uniqueL1Domains = useMemo(() => {
        const domains = new Set();
        businessFeaturesGrid.forEach(f => domains.add(f.l1Domain));
        return Array.from(domains).sort();
      }, [businessFeaturesGrid]);

      const filteredBusinessFeatures = useMemo(() => {
        return businessFeaturesGrid.filter(feature => {
          const matchesSearch = 
            feature.projectName.toLowerCase().includes(featureSearchTerm.toLowerCase()) ||
            feature.l1Domain.toLowerCase().includes(featureSearchTerm.toLowerCase()) ||
            feature.l2Feature.toLowerCase().includes(featureSearchTerm.toLowerCase()) ||
            feature.l2Description.toLowerCase().includes(featureSearchTerm.toLowerCase());
          const matchesL1Filter = selectedL1Filter === 'all' || feature.l1Domain === selectedL1Filter;
          return matchesSearch && matchesL1Filter;
        });
      }, [businessFeaturesGrid, featureSearchTerm, selectedL1Filter]);

      const toggleDomain = (domain) => {
        const newExpanded = new Set(expandedDomains);
        if (newExpanded.has(domain)) {
          newExpanded.delete(domain);
        } else {
          newExpanded.add(domain);
        }
        setExpandedDomains(newExpanded);
      };

      const getSelectedProjectData = () => {
        if (!selectedProject) return null;
        return DATA.projects.find(p => p.project_name === selectedProject);
      };

      const projectData = getSelectedProjectData();

      return h('div', { className: 'min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6' },
        h('div', { className: 'max-w-9xl mx-auto' },
          // Header
          h('div', { className: 'bg-white rounded-xl shadow-lg p-6 mb-6' },
            h('div', { className: 'flex items-center justify-between mb-4' },
              h('div', { className: 'flex-1' },
                h('h1', { className: 'text-3xl font-bold text-gray-900 mb-2' }, 'LIFTR.ai Consolidated Module Analysis'),
                h('p', { className: 'text-gray-600' }, 'Legacy System Analysis Dashboard • ' + DATA.total_projects + ' Projects Analyzed'),
                h('p', { className: 'text-sm text-gray-500 mt-1' }, 'Generated: ' + new Date(DATA.consolidation_date).toLocaleString())
              ),
              h('div', { className: 'flex gap-2' },
                h('button', {
                  onClick: () => {
                    const headers = ['Project Name', 'Analysis Date', 'Technologies', 'Domains', 'Features', 'Components'];
                    const rows = DATA.projects.map(project => [
                      project.project_name,
                      project.analysis_date,
                      project.technology_stack.join('; '),
                      project.business_features.length,
                      project.business_features.reduce((sum, d) => sum + d.l2_features.length, 0),
                      project.business_features.reduce((sum, d) => sum + d.l2_features.reduce((s, f) => s + (f.l3_components?.length || 0), 0), 0)
                    ]);
                    const csv = [headers, ...rows].map(row => row.join(',')).join('\\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'lifter_analysis_export.csv';
                    a.click();
                  },
                  className: 'flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
                }, icons.Download(), h('span', null, 'CSV')),
                h('button', {
                  onClick: () => {
                    let md = '# LIFTR.ai Consolidated Module Analysis Report\\n\\n';
                    md += '**Generated:** ' + DATA.consolidation_date + '\\n\\n';
                    md += '**Total Projects:** ' + DATA.total_projects + '\\n\\n';
                    const blob = new Blob([md], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'lifter_analysis_report.md';
                    a.click();
                  },
                  className: 'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white',
                  style: { backgroundColor: BRAND_COLOR }
                }, icons.Download(), h('span', null, 'Markdown')),
                h('button', {
                  onClick: () => {
                    alert('HTML export is already a standalone file!');
                  },
                  className: 'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white',
                  style: { backgroundColor: '#3b82f6' }
                }, icons.Download(), h('span', null, 'Export HTML'))
              )
            ),
            // Key Metrics
            h('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4' },
              h('div', { className: 'bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border-l-4', style: { borderColor: BRAND_COLOR } },
                h('div', { className: 'flex items-center gap-2 mb-2' },
                  h('div', { style: { color: BRAND_COLOR } }, icons.Package()),
                  h('span', { className: 'text-sm font-medium text-gray-600' }, 'Technologies')
                ),
                h('p', { className: 'text-2xl font-bold text-gray-900' }, DATA.statistics.technology_analysis.unique_technologies),
                h('p', { className: 'text-xs text-gray-600 mt-1' }, DATA.statistics.technology_analysis.total_technology_references + ' total references')
              ),
              h('div', { className: 'bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-l-4 border-blue-500' },
                h('div', { className: 'flex items-center gap-2 mb-2' },
                  h('div', { className: 'text-blue-600' }, icons.Layers()),
                  h('span', { className: 'text-sm font-medium text-gray-600' }, 'Domains')
                ),
                h('p', { className: 'text-2xl font-bold text-gray-900' }, DATA.statistics.business_domain_analysis.unique_l1_domains),
                h('p', { className: 'text-xs text-gray-600 mt-1' }, 'Avg ' + DATA.statistics.business_domain_analysis.average_domains_per_project.toFixed(1) + ' per project')
              ),
              h('div', { className: 'bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-l-4 border-green-500' },
                h('div', { className: 'flex items-center gap-2 mb-2' },
                  h('div', { className: 'text-green-600' }, icons.FileCode()),
                  h('span', { className: 'text-sm font-medium text-gray-600' }, 'Features')
                ),
                h('p', { className: 'text-2xl font-bold text-gray-900' }, DATA.statistics.feature_analysis.unique_l2_features),
                h('p', { className: 'text-xs text-gray-600 mt-1' }, 'Avg ' + DATA.statistics.feature_analysis.average_features_per_project.toFixed(1) + ' per project')
              )
            )
          ),
          // Navigation Tabs
          h('div', { className: 'bg-white rounded-xl shadow-lg mb-6' },
            h('div', { className: 'flex border-b' },
              ['overview', 'technologies', 'domains', 'features', 'projects'].map((tab) =>
                h('button', {
                  key: tab,
                  onClick: () => setActiveTab(tab),
                  className: 'px-6 py-4 font-medium transition-colors ' + (activeTab === tab ? 'border-b-2' : 'text-gray-500 hover:text-gray-700'),
                  style: activeTab === tab ? { borderColor: BRAND_COLOR, color: BRAND_COLOR } : {}
                }, tab.charAt(0).toUpperCase() + tab.slice(1))
              )
            )
          ),
          // Tab Content
          activeTab === 'overview' && h('div', { className: 'space-y-6' },
            h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
              h('div', { className: 'bg-white rounded-xl shadow-lg p-6' },
                h('h3', { className: 'text-lg font-semibold mb-4 text-gray-900' }, 'Top 15 Technologies'),
                h(ResponsiveContainer, { width: '100%', height: 300 },
                  h(BarChart, { data: techData },
                    h(CartesianGrid, { strokeDasharray: '3 3' }),
                    h(XAxis, { dataKey: 'name', angle: -45, textAnchor: 'end', height: 100, fontSize: 12 }),
                    h(YAxis),
                    h(Tooltip),
                    h(Bar, { dataKey: 'count', fill: BRAND_COLOR })
                  )
                )
              ),
              h('div', { className: 'bg-white rounded-xl shadow-lg p-6' },
                h('h3', { className: 'text-lg font-semibold mb-4 text-gray-900' }, 'Top Business Domains'),
                h(ResponsiveContainer, { width: '100%', height: 300 },
                  h(BarChart, { data: domainData, layout: 'horizontal' },
                    h(CartesianGrid, { strokeDasharray: '3 3' }),
                    h(XAxis, { type: 'number' }),
                    h(YAxis, { dataKey: 'name', type: 'category', width: 150, fontSize: 12 }),
                    h(Tooltip),
                    h(Bar, { dataKey: 'count', fill: '#3b82f6' })
                  )
                )
              )
            ),
            h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
              h('div', { className: 'bg-white rounded-xl shadow-lg p-6' },
                h('h3', { className: 'text-lg font-semibold mb-4 text-gray-900' }, 'Project Complexity Distribution'),
                h(ResponsiveContainer, { width: '100%', height: 250 },
                  h(PieChart, null,
                    h(Pie, {
                      data: projectComplexityData,
                      cx: '50%',
                      cy: '50%',
                      labelLine: false,
                      label: ({ range, percent }) => range + ': ' + (percent * 100).toFixed(0) + '%',
                      outerRadius: 80,
                      fill: '#8884d8',
                      dataKey: 'count'
                    }, projectComplexityData.map((entry, index) =>
                      h(Cell, { key: 'cell-' + index, fill: COLORS[index % COLORS.length] })
                    )),
                    h(Tooltip)
                  )
                ),
                h('p', { className: 'text-sm text-gray-600 mt-4 text-center' }, 'Projects grouped by number of technologies used')
              ),
              h('div', { className: 'bg-white rounded-xl shadow-lg p-6' },
                h('h3', { className: 'text-lg font-semibold mb-4 text-gray-900' }, 'Most Common Features'),
                h('div', { className: 'space-y-3' },
                  (() => {
                    const maxFeatureCount = featureData[0]?.count || 1;
                    return featureData.slice(0, 8).map((feature, idx) =>
                      h('div', { key: idx, className: 'flex items-center justify-between' },
                        h('span', { className: 'text-sm text-gray-700 flex-1' }, feature.name),
                        h('div', { className: 'flex items-center gap-2 w-32' },
                          h('div', { className: 'flex-1 bg-gray-200 rounded-full h-2' },
                            h('div', {
                              className: 'h-2 rounded-full',
                              style: {
                                backgroundColor: BRAND_COLOR,
                                width: ((feature.count / maxFeatureCount) * 100) + '%'
                              }
                            })
                          ),
                          h('span', { className: 'text-xs font-medium text-gray-600 w-8 text-right' }, feature.count)
                        )
                      )
                    );
                  })()
                )
              )
            )
          ),
          activeTab === 'technologies' && h('div', { className: 'bg-white rounded-xl shadow-lg p-6' },
            h('h3', { className: 'text-lg font-semibold mb-6 text-gray-900' }, 'Technology Stack Analysis'),
            h('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
              h('div', null,
                h(ResponsiveContainer, { width: '100%', height: 500 },
                  h(BarChart, { data: techData },
                    h(CartesianGrid, { strokeDasharray: '3 3' }),
                    h(XAxis, { dataKey: 'name', angle: -45, textAnchor: 'end', height: 120, fontSize: 12 }),
                    h(YAxis),
                    h(Tooltip),
                    h(Legend),
                    h(Bar, { dataKey: 'count', name: 'Project Count', fill: BRAND_COLOR })
                  )
                )
              ),
              h('div', null,
                h('h4', { className: 'font-semibold mb-4 text-gray-800' }, 'Technology Summary'),
                h('div', { className: 'space-y-2 max-h-96 overflow-y-auto' },
                  Object.entries(DATA.statistics.technology_analysis.top_technologies).map(([tech, count], idx) =>
                    h('div', { key: idx, className: 'flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors' },
                      h('span', { className: 'font-medium text-gray-700' }, tech),
                      h('span', { className: 'px-3 py-1 rounded-full text-sm font-semibold text-white', style: { backgroundColor: BRAND_COLOR } }, count)
                    )
                  )
                )
              )
            )
          ),
          activeTab === 'domains' && h('div', { className: 'space-y-6' },
            h('div', { className: 'bg-white rounded-xl shadow-lg p-6' },
              h('h3', { className: 'text-lg font-semibold mb-6 text-gray-900' }, 'Business Domain Analysis'),
              h(ResponsiveContainer, { width: '100%', height: 400 },
                h(BarChart, { data: domainData },
                  h(CartesianGrid, { strokeDasharray: '3 3' }),
                  h(XAxis, { dataKey: 'name', angle: -45, textAnchor: 'end', height: 150, fontSize: 12 }),
                  h(YAxis),
                  h(Tooltip),
                  h(Legend),
                  h(Bar, { dataKey: 'count', name: 'Occurrences', fill: '#3b82f6' })
                )
              )
            ),
            h('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
              h('div', { className: 'bg-white rounded-xl shadow-lg p-6' },
                h('h4', { className: 'font-semibold mb-2 text-gray-800' }, 'Total Domains'),
                h('p', { className: 'text-4xl font-bold', style: { color: BRAND_COLOR } }, DATA.statistics.business_domain_analysis.unique_l1_domains),
                h('p', { className: 'text-sm text-gray-600 mt-2' }, 'Unique business domains identified')
              ),
              h('div', { className: 'bg-white rounded-xl shadow-lg p-6' },
                h('h4', { className: 'font-semibold mb-2 text-gray-800' }, 'Avg per Project'),
                h('p', { className: 'text-4xl font-bold text-blue-600' }, DATA.statistics.business_domain_analysis.average_domains_per_project.toFixed(1)),
                h('p', { className: 'text-sm text-gray-600 mt-2' }, 'Average domains per project')
              ),
              h('div', { className: 'bg-white rounded-xl shadow-lg p-6' },
                h('h4', { className: 'font-semibold mb-2 text-gray-800' }, 'Total References'),
                h('p', { className: 'text-4xl font-bold text-green-600' }, DATA.statistics.business_domain_analysis.total_l1_references),
                h('p', { className: 'text-sm text-gray-600 mt-2' }, 'Total domain references')
              )
            )
          ),
          activeTab === 'features' && h('div', { className: 'space-y-6' },
            h('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
              h('div', { className: 'bg-white rounded-xl shadow-lg p-4' },
                h('h4', { className: 'text-sm font-medium text-gray-600 mb-1' }, 'Total Features'),
                h('p', { className: 'text-2xl font-bold', style: { color: BRAND_COLOR } }, businessFeaturesGrid.length)
              ),
              h('div', { className: 'bg-white rounded-xl shadow-lg p-4' },
                h('h4', { className: 'text-sm font-medium text-gray-600 mb-1' }, 'Unique L1 Domains'),
                h('p', { className: 'text-2xl font-bold text-blue-600' }, uniqueL1Domains.length)
              ),
              h('div', { className: 'bg-white rounded-xl shadow-lg p-4' },
                h('h4', { className: 'text-sm font-medium text-gray-600 mb-1' }, 'Unique L2 Features'),
                h('p', { className: 'text-2xl font-bold text-green-600' }, new Set(businessFeaturesGrid.map(f => f.l2Feature)).size)
              ),
              h('div', { className: 'bg-white rounded-xl shadow-lg p-4' },
                h('h4', { className: 'text-sm font-medium text-gray-600 mb-1' }, 'Avg Components'),
                h('p', { className: 'text-2xl font-bold text-purple-600' }, (businessFeaturesGrid.reduce((sum, f) => sum + f.componentCount, 0) / businessFeaturesGrid.length).toFixed(1))
              )
            ),
            h('div', { className: 'bg-white rounded-xl shadow-lg p-4' },
              h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
                h('div', { className: 'relative' },
                  h('div', { className: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' }, icons.Search()),
                  h('input', {
                    type: 'text',
                    placeholder: 'Search features, projects, or descriptions...',
                    value: featureSearchTerm,
                    onChange: (e) => setFeatureSearchTerm(e.target.value),
                    className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent'
                  })
                ),
                h('div', { className: 'relative' },
                  h('div', { className: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' }, icons.Filter()),
                  h('select', {
                    value: selectedL1Filter,
                    onChange: (e) => setSelectedL1Filter(e.target.value),
                    className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent appearance-none bg-white'
                  },
                    h('option', { value: 'all' }, 'All L1 Domains (' + uniqueL1Domains.length + ')'),
                    uniqueL1Domains.map((domain, idx) =>
                      h('option', { key: idx, value: domain }, domain)
                    )
                  )
                )
              ),
              h('div', { className: 'mt-3 flex items-center justify-between' },
                h('p', { className: 'text-sm text-gray-600' }, 'Showing ' + filteredBusinessFeatures.length + ' of ' + businessFeaturesGrid.length + ' features'),
                (featureSearchTerm || selectedL1Filter !== 'all') && h('button', {
                  onClick: () => {
                    setFeatureSearchTerm('');
                    setSelectedL1Filter('all');
                  },
                  className: 'text-sm px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors',
                  style: { color: BRAND_COLOR }
                }, 'Clear Filters')
              )
            ),
            h('div', { className: 'bg-white rounded-xl shadow-lg overflow-hidden' },
              h('div', { className: 'overflow-x-auto' },
                h('table', { className: 'w-full' },
                  h('thead', { className: 'bg-gray-50 border-b-2 border-gray-200' },
                    h('tr', null,
                      h('th', { className: 'px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider' }, 'Project'),
                      h('th', { className: 'px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider' }, 'L1 Domain'),
                      h('th', { className: 'px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider' }, 'L2 Feature'),
                      h('th', { className: 'px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider' }, 'Description')
                    )
                  ),
                  h('tbody', { className: 'divide-y divide-gray-200' },
                    filteredBusinessFeatures.length === 0 ? h('tr', null,
                      h('td', { colSpan: 5, className: 'p-12 text-center' },
                        h('div', null,
                          icons.AlertCircle(),
                          h('p', { className: 'text-gray-600 font-medium mb-2 mt-4' }, 'No features found'),
                          h('p', { className: 'text-sm text-gray-500' }, 'Try adjusting your search or filter criteria')
                        )
                      )
                    ) : filteredBusinessFeatures.map((feature, idx) =>
                      h('tr', { key: idx, className: 'hover:bg-gray-50 transition-colors' },
                        h('td', { className: 'px-6 py-4 whitespace-nowrap' },
                          h('div', { className: 'flex items-center' },
                            h('div', { className: 'w-2 h-2 rounded-full mr-2', style: { backgroundColor: BRAND_COLOR } }),
                            h('span', { className: 'text-sm font-medium text-gray-900' }, feature.projectName)
                          )
                        ),
                        h('td', { className: 'px-6 py-4' },
                          h('div', null,
                            h('div', { className: 'text-sm font-medium text-gray-900 mb-1' }, feature.l1Domain),
                            h('div', { className: 'text-xs text-gray-500 max-w-xs truncate', title: feature.l1Description }, feature.l1Description)
                          )
                        ),
                        h('td', { className: 'px-6 py-4' },
                          h('span', { className: 'text-sm font-medium text-gray-900' }, feature.l2Feature)
                        ),
                        h('td', { className: 'px-6 py-4' },
                          h('div', { className: 'text-sm text-gray-700 max-w-md' }, feature.l2Description)
                        )
                      )
                    )
                  )
                )
              )
            )
          ),
          activeTab === 'projects' && h('div', { className: 'space-y-6' },
            h('div', { className: 'bg-white rounded-xl shadow-lg p-4' },
              h('div', { className: 'relative' },
                h('div', { className: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' }, icons.Search()),
                h('input', {
                  type: 'text',
                  placeholder: 'Search projects or technologies...',
                  value: searchTerm,
                  onChange: (e) => setSearchTerm(e.target.value),
                  className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent'
                })
              )
            ),
            h('div', { className: 'space-y-4' },
              filteredProjects.length === 0 ? h('div', { className: 'bg-white rounded-xl shadow-lg p-12 text-center' },
                icons.AlertCircle(),
                h('p', { className: 'text-gray-600 mt-4' }, 'No projects found matching your search criteria.')
              ) : filteredProjects.map((project, idx) =>
                h('div', { key: idx, className: 'bg-white rounded-xl shadow-lg overflow-hidden' },
                  h('div', {
                    className: 'p-4 cursor-pointer hover:bg-gray-50 transition-colors',
                    onClick: () => setSelectedProject(selectedProject === project.project_name ? null : project.project_name)
                  },
                    h('div', { className: 'flex items-center justify-between' },
                      h('div', { className: 'flex-1' },
                        h('div', { className: 'flex items-center gap-2' },
                          h('h4', { className: 'font-semibold text-lg text-gray-900' }, project.project_name),
                          h('span', { className: 'px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600' }, project.technology_stack?.length + ' techs'),
                          h('span', { className: 'px-2 py-1 bg-blue-100 text-xs rounded-full text-blue-600' }, project.business_features?.length + ' domains')
                        ),
                        h('p', { className: 'text-sm text-gray-500 mt-1' }, 'Analyzed: ' + new Date(project.analysis_date).toLocaleDateString())
                      ),
                      selectedProject === project.project_name ? h('div', { style: { color: BRAND_COLOR } }, icons.ChevronDown()) : icons.ChevronRight()
                    )
                  ),
                  selectedProject === project.project_name && projectData && h('div', { className: 'border-t border-gray-200 p-4 bg-gray-50' },
                    h('div', { className: 'mb-4' },
                      h('h5', { className: 'font-semibold text-sm text-gray-700 mb-2' }, 'Technology Stack'),
                      h('div', { className: 'flex flex-wrap gap-2' },
                        projectData.technology_stack.map((tech, techIdx) =>
                          h('span', {
                            key: techIdx,
                            className: 'px-3 py-1 rounded-full text-sm text-white',
                            style: { backgroundColor: BRAND_COLOR }
                          }, tech)
                        )
                      )
                    ),
                    h('div', null,
                      h('h5', { className: 'font-semibold text-sm text-gray-700 mb-2' }, 'Business Features'),
                      h('div', { className: 'space-y-2' },
                        projectData.business_features.map((domain, domIdx) =>
                          h('div', { key: domIdx, className: 'bg-white rounded-lg p-3' },
                            h('div', {
                              className: 'flex items-start gap-2 cursor-pointer',
                              onClick: () => toggleDomain(project.project_name + '-' + domain.l1_domain)
                            },
                              expandedDomains.has(project.project_name + '-' + domain.l1_domain) ? h('div', { style: { color: BRAND_COLOR } }, icons.ChevronDown()) : icons.ChevronRight(),
                              h('div', { className: 'flex-1' },
                                h('h6', { className: 'font-medium text-gray-900' }, domain.l1_domain),
                                h('p', { className: 'text-xs text-gray-600 mt-1' }, domain.l1_description),
                                h('p', { className: 'text-xs text-gray-500 mt-1' }, domain.l2_features.length + ' features')
                              )
                            ),
                            expandedDomains.has(project.project_name + '-' + domain.l1_domain) && h('div', { className: 'mt-3 ml-6 space-y-2' },
                              domain.l2_features.map((feature, featIdx) =>
                                h('div', { key: featIdx, className: 'bg-gray-50 rounded p-2' },
                                  h('p', { className: 'font-medium text-sm text-gray-800' }, feature.l2_feature),
                                  h('p', { className: 'text-xs text-gray-600 mt-1' }, feature.l2_description)
                                )
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          ),
          // Footer with Logo and Favicon
          h('div', { className: 'mt-8 pt-6 border-t border-gray-200' },
            h('div', { className: 'flex justify-end items-center gap-3' },
              LOGO_BASE64 && h('img', {
                src: LOGO_BASE64,
                alt: 'LIFTR.ai Logo',
                className: 'h-6 w-auto object-contain',
                style: { maxHeight: '36px' }
              }),
              LOGO_BASE64 && FAVICON_BASE64 && h('div', {
                className: 'h-6 w-px bg-gray-300'
              }),
              FAVICON_BASE64 && h('img', {
                src: FAVICON_BASE64,
                alt: 'Favicon',
                className: 'h-6 w-6 object-contain',
                style: { maxHeight: '24px', maxWidth: '24px' }
              })
            )
          )
        )
      );
    }

    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(ModuleAnalysisViz));
  </script>
</body>
</html>`;
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-9xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                The Lifter Consolidated Module Analysis
              </h1>
              <p className="text-gray-600">
                Legacy System Analysis Dashboard • {data.total_projects} Projects Analyzed
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Generated: {new Date(data.consolidation_date).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToMarkdown}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white"
                style={{ backgroundColor: BRAND_COLOR }}
              >
                <Download size={18} />
                <span>Markdown</span>
              </button>
              <button
                onClick={handleExportHTML}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white"
                style={{ backgroundColor: '#3b82f6' }}
                title="Export as standalone HTML file"
              >
                <Download size={18} />
                <span>Export HTML</span>
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border-l-4" style={{ borderColor: BRAND_COLOR }}>
              <div className="flex items-center gap-2 mb-2">
                <Package size={20} style={{ color: BRAND_COLOR }} />
                <span className="text-sm font-medium text-gray-600">Technologies</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {data.statistics.technology_analysis.unique_technologies}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {data.statistics.technology_analysis.total_technology_references} total references
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <Layers size={20} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Domains</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {data.statistics.business_domain_analysis.unique_l1_domains}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Avg {data.statistics.business_domain_analysis.average_domains_per_project.toFixed(1)} per project
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center gap-2 mb-2">
                <FileCode size={20} className="text-green-600" />
                <span className="text-sm font-medium text-gray-600">Features</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {data.statistics.feature_analysis.unique_l2_features}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Avg {data.statistics.feature_analysis.average_features_per_project.toFixed(1)} per project
              </p>
            </div>

            {/* <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} className="text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Components</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {data.statistics.component_analysis.unique_l3_components}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Avg {data.statistics.component_analysis.average_components_per_project.toFixed(1)} per project
              </p>
            </div> */}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b">
            {(['overview', 'technologies', 'domains', 'features', 'projects'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={activeTab === tab ? { borderColor: BRAND_COLOR, color: BRAND_COLOR } : {}}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Technologies Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Top 15 Technologies</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={techData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={BRAND_COLOR} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Business Domains Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Top Business Domains</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={domainData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Complexity Distribution */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Project Complexity Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={projectComplexityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, percent }: any) => `${range}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {projectComplexityData.map((entry, index) => (
                        <Cell key={`cell-${index}-${entry.range}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Projects grouped by number of technologies used
                </p>
              </div>

              {/* Top Features */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Most Common Features</h3>
                <div className="space-y-3">
                  {(() => {
                    const maxFeatureCount = featureData[0]?.count || 1;
                    return featureData.slice(0, 8).map((feature, idx) => (
                      <div key={`feature-${idx}-${feature.name}`} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 flex-1">{feature.name}</span>
                        <div className="flex items-center gap-2 w-32">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                backgroundColor: BRAND_COLOR,
                                width: `${(feature.count / maxFeatureCount) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-8 text-right">
                            {feature.count}
                          </span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Technologies Tab */}
        {activeTab === 'technologies' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-6 text-gray-900">Technology Stack Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={techData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Project Count" fill={BRAND_COLOR} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-gray-800">Technology Summary</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {Object.entries(data.statistics.technology_analysis.top_technologies).map(([tech, count], idx) => (
                    <div key={`${idx}-${tech}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className="font-medium text-gray-700">{tech}</span>
                      <span className="px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: BRAND_COLOR }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Domains Tab */}
        {activeTab === 'domains' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">Business Domain Analysis</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={domainData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={150} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Occurrences" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="font-semibold mb-2 text-gray-800">Total Domains</h4>
                <p className="text-4xl font-bold" style={{ color: BRAND_COLOR }}>
                  {data.statistics.business_domain_analysis.unique_l1_domains}
                </p>
                <p className="text-sm text-gray-600 mt-2">Unique business domains identified</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="font-semibold mb-2 text-gray-800">Avg per Project</h4>
                <p className="text-4xl font-bold text-blue-600">
                  {data.statistics.business_domain_analysis.average_domains_per_project.toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 mt-2">Average domains per project</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="font-semibold mb-2 text-gray-800">Total References</h4>
                <p className="text-4xl font-bold text-green-600">
                  {data.statistics.business_domain_analysis.total_l1_references}
                </p>
                <p className="text-sm text-gray-600 mt-2">Total domain references</p>
              </div>
            </div>
          </div>
        )}

        {/* Business Features Tab - NEW GRID VIEW */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-1">Total Features</h4>
                <p className="text-2xl font-bold" style={{ color: BRAND_COLOR }}>
                  {businessFeaturesGrid.length}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-1">Unique L1 Domains</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {uniqueL1Domains.length}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-1">Unique L2 Features</h4>
                <p className="text-2xl font-bold text-green-600">
                  {new Set(businessFeaturesGrid.map(f => f.l2Feature)).size}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-1">Avg Components</h4>
                <p className="text-2xl font-bold text-purple-600">
                  {(businessFeaturesGrid.reduce((sum, f) => sum + f.componentCount, 0) / businessFeaturesGrid.length).toFixed(1)}
                </p>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search features, projects, or descriptions..."
                    value={featureSearchTerm}
                    onChange={(e) => setFeatureSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={selectedL1Filter}
                    onChange={(e) => setSelectedL1Filter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All L1 Domains ({uniqueL1Domains.length})</option>
                    {uniqueL1Domains.map((domain, idx) => (
                      <option key={`domain-${idx}-${domain}`} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {filteredBusinessFeatures.length} of {businessFeaturesGrid.length} features
                </p>
                {(featureSearchTerm || selectedL1Filter !== 'all') && (
                  <button
                    onClick={() => {
                      setFeatureSearchTerm('');
                      setSelectedL1Filter('all');
                    }}
                    className="text-sm px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ color: BRAND_COLOR }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Grid View */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        L1 Domain
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        L2 Feature
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Components
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBusinessFeatures.map((feature, idx) => (
                      <tr key={`filteredBusinessFeatures-${idx}-${feature.projectName}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: BRAND_COLOR }}></div>
                            <span className="text-sm font-medium text-gray-900">
                              {feature.projectName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {feature.l1Domain}
                            </div>
                            <div className="text-xs text-gray-500 max-w-xs truncate" title={feature.l1Description}>
                              {feature.l1Description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {feature.l2Feature}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 max-w-md">
                            {feature.l2Description}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: BRAND_COLOR }}>
                            {feature.componentCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredBusinessFeatures.length === 0 && (
                <div className="p-12 text-center">
                  <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-600 font-medium mb-2">No features found</p>
                  <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              )}

              {filteredBusinessFeatures.length > 0 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 text-center">
                    💡 Tip: Hover over descriptions to see full text. Use filters to narrow down results.
                  </p>
                </div>
              )}
            </div>

            {/* Export Options for Features */}
            <div className="bg-white rounded-xl shadow-lg p-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Export current view ({filteredBusinessFeatures.length} features)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const headers = ['Project', 'L1 Domain', 'L2 Feature', 'L2 Description', 'Component Count'];
                    const rows = filteredBusinessFeatures.map(f => [
                      f.projectName,
                      f.l1Domain,
                      f.l2Feature,
                      f.l2Description,
                      f.componentCount.toString()
                    ]);
                    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'business_features_export.csv';
                    a.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                >
                  <Download size={16} />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search projects or technologies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
                />
              </div>
            </div>

            {/* Projects List */}
            <div className="space-y-4">
              {filteredProjects.map((project, idx) => (
                <div key={`filteredProject-${idx}-${project.project_name}`} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <button
                    className="w-full text-left p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedProject(selectedProject?.project_name === project.project_name ? null : project)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg text-gray-900">{project.project_name}</h4>
                          <span className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600">
                            {project.technology_stack?.length} techs
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-xs rounded-full text-blue-600">
                            {project.business_features?.length} domains
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Analyzed: {new Date(project.analysis_date).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedProject?.project_name === project.project_name ? (
                        <ChevronDown style={{ color: BRAND_COLOR }} />
                      ) : (
                        <ChevronRight className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {selectedProject?.project_name === project.project_name && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="mb-4">
                        <h5 className="font-semibold text-sm text-gray-700 mb-2">Technology Stack</h5>
                        <div className="flex flex-wrap gap-2">
                          {project.technology_stack.map((tech, techIdx) => (
                            <span
                              key={`${techIdx}-${tech}`}
                              className="px-3 py-1 rounded-full text-sm text-white"
                              style={{ backgroundColor: BRAND_COLOR }}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-semibold text-sm text-gray-700 mb-2">Business Features</h5>
                        <div className="space-y-2">
                          {project.business_features.map((domain, domIdx) => (
                            <div key={`project-l1Domain-${domIdx}-${domain.l1_domain}`} className="bg-white rounded-lg p-3">
                              <button
                                className="w-full text-left flex items-start gap-2 cursor-pointer"
                                onClick={() => toggleDomain(`${project.project_name}-${domain.l1_domain}`)}
                              >
                                {expandedDomains.has(`${project.project_name}-${domain.l1_domain}`) ? (
                                  <ChevronDown size={18} style={{ color: BRAND_COLOR }} className="mt-1" />
                                ) : (
                                  <ChevronRight size={18} className="text-gray-400 mt-1" />
                                )}
                                <div className="flex-1">
                                  <h6 className="font-medium text-gray-900">{domain.l1_domain}</h6>
                                  <p className="text-xs text-gray-600 mt-1">{domain.l1_description}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {domain.l2_features.length} features 
                                  </p>
                                </div>
                              </button>

                              {expandedDomains.has(`${project.project_name}-${domain.l1_domain}`) && (
                                <div className="mt-3 ml-6 space-y-2">
                                  {domain.l2_features.map((feature, featIdx) => (
                                    <div key={`domain-l2-features-${featIdx}-${feature.l2_feature}`} className="bg-gray-50 rounded p-2">
                                      <p className="font-medium text-sm text-gray-800">{feature.l2_feature}</p>
                                      <p className="text-xs text-gray-600 mt-1">{feature.l2_description}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {feature.l3_components?.length} components
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-600">No projects found matching your search criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleAnalysisViz;