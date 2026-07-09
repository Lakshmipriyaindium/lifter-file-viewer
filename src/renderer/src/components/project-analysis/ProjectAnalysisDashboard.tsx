// components/ProjectAnalysisDashboard.tsx
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
} from 'recharts';
import * as XLSX from 'xlsx';
import { ProjectAnalysisData } from './type';

interface ProjectAnalysisDashboardProps {
  data: ProjectAnalysisData;
}

// Helpers inlined for Electron environment
export const loadLogoAsBase64 = async (logoPath: string): Promise<string> => {
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

export const createLogoImg = (base64: string, alt: string, height: string = '48px', width: string = '48px') => {
  if (base64) {
    return `<img src="${base64}" alt="${alt}" style="width: ${width}; height: ${height}; flex-shrink: 0; object-fit: contain; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; display: block;">`;
  }
  return '';
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const COMPLEXITY_COLORS = {
  simple: '#10B981',
  medium: '#F59E0B',
  complex: '#EF4444',
  very_complex: '#7C3AED',
};

export default function ProjectAnalysisDashboard({ data }: Readonly<ProjectAnalysisDashboardProps>) {
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'complexity' | 'projects'>('overview');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Executive Summary Metrics
  const executiveSummary = useMemo(() => {
    const criticalVulnerabilities = data.projects.filter(p => p.security.vulnerabilitiesCount > 5).length;
    const highComplexityProjects = data.projects.filter(p => p.complexity.averageComplexity > 50).length;
    const largeProjects = data.projects.filter(p => p.loc.totalLOC > 50000).length;

    return {
      totalProjects: data.metadata.totalProjects,
      totalLOC: data.summary.totalLOC,
      criticalVulnerabilities,
      highComplexityProjects,
      largeProjects,
      averageComplexity: data.summary.averageComplexity.toFixed(2),
      totalVulnerabilities: data.summary.totalVulnerabilities,
    };
  }, [data]);

  // Chart Data Preparations
  const complexityDistributionData = useMemo(() => {
    return Object.entries(data.aggregatedMetrics.complexityLevelDistribution).map(([key, value]) => ({
      name: key.replace('_', ' ').toUpperCase(),
      value,
      percentage: ((value / data.summary.totalFiles) * 100).toFixed(1),
    }));
  }, [data]);

  const fileTypeData = useMemo(() => {
    return Object.entries(data.aggregatedMetrics.fileTypeDistribution).map(([key, value]) => ({
      name: key.toUpperCase(),
      files: value.count,
      lines: value.lines,
    }));
  }, [data]);

  const componentTypeData = useMemo(() => {
    return Object.entries(data.aggregatedMetrics.componentTypeDistribution).map(([key, value]) => ({
      name: key,
      count: value,
    }));
  }, [data]);

  const top10VulnerableProjects = useMemo(() => {
    return [...data.projects]
      .sort((a, b) => b.security.vulnerabilitiesCount - a.security.vulnerabilitiesCount)
      .slice(0, 10)
      .map(p => ({
        name: p.projectName.length > 20 ? p.projectName.substring(0, 20) + '...' : p.projectName,
        vulnerabilities: p.security.vulnerabilitiesCount,
        hardcodedCreds: p.security.hardcodedCredentialsCount,
      }));
  }, [data]);

  const top10ComplexProjects = useMemo(() => {
    return [...data.projects]
      .sort((a, b) => b.complexity.averageComplexity - a.complexity.averageComplexity)
      .slice(0, 10)
      .map(p => ({
        name: p.projectName.length > 20 ? p.projectName.substring(0, 20) + '...' : p.projectName,
        complexity: Number.parseFloat(p.complexity.averageComplexity.toFixed(2)),
      }));
  }, [data]);

  // Sorting function
  const sortedProjects = useMemo(() => {
    const sortableProjects = [...data.projects];
    if (sortConfig !== null) {
      sortableProjects.sort((a, b) => {
        let aValue: string | number, bValue: string | number;

        switch (sortConfig.key) {
          case 'name':
            aValue = a.projectName;
            bValue = b.projectName;
            break;
          case 'loc':
            aValue = a.loc.totalLOC;
            bValue = b.loc.totalLOC;
            break;
          case 'vulnerabilities':
            aValue = a.security.vulnerabilitiesCount;
            bValue = b.security.vulnerabilitiesCount;
            break;
          case 'complexity':
            aValue = a.complexity.averageComplexity;
            bValue = b.complexity.averageComplexity;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableProjects;
  }, [data.projects, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Export to Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Executive Summary Sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Projects', executiveSummary.totalProjects],
      ['Total Lines of Code', executiveSummary.totalLOC.toLocaleString()],
      ['Total Vulnerabilities', executiveSummary.totalVulnerabilities],
      ['Projects with Critical Vulnerabilities (>5)', executiveSummary.criticalVulnerabilities],
      ['High Complexity Projects (>50)', executiveSummary.highComplexityProjects],
      ['Large Projects (>50K LOC)', executiveSummary.largeProjects],
      ['Average Complexity', executiveSummary.averageComplexity],
      ['Total Components', data.summary.totalComponents],
      ['Total Services', data.summary.totalServices],
      ['Total Bundle Size', data.summary.totalBundleSizeFormatted],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

    // Projects Detail Sheet
    const projectsData = [
      [
        'Project Name',
        'Total Files',
        'Total LOC',
        'Vulnerabilities',
        'Complexity',
        'Maintainability',
        'Components',
        'Services',
        'Bundle Size',
      ],
      ...data.projects.map(p => [
        p.projectName,
        p.loc.totalFiles,
        p.loc.totalLOC,
        p.security.vulnerabilitiesCount,
        p.complexity.averageComplexity.toFixed(2),
        p.complexity.averageMaintainability.toFixed(2),
        p.inventory.totalComponents,
        p.inventory.totalServices,
        p.bundle.totalSizeFormatted,
      ]),
    ];
    const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);
    XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projects');

    // Security Details Sheet
    const securityData = [
      ['Project Name', 'Vulnerabilities', 'Hardcoded Credentials', 'Unsafe Patterns', 'Vulnerability Details'],
      ...data.projects
        .filter(p => p.security.vulnerabilitiesCount > 0)
        .map(p => [
          p.projectName,
          p.security.vulnerabilitiesCount,
          p.security.hardcodedCredentialsCount,
          p.security.unsafePatternsCount,
          p.security.vulnerabilities.join('; '),
        ]),
    ];
    const securitySheet = XLSX.utils.aoa_to_sheet(securityData);
    XLSX.utils.book_append_sheet(workbook, securitySheet, 'Security Issues');

    // Generate Excel file
    XLSX.writeFile(workbook, `Project_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToInteractiveHtml = async () => {
    // Load both logos
    const logoLightBase64 = await loadLogoAsBase64('/assets/logo-light.png');
    const faviconBase64 = await loadLogoAsBase64('/favicon-3.webp');

    const logoLightImg = createLogoImg(logoLightBase64, 'Liftr.ai Logo', '90px', '90px');
    const faviconImg = createLogoImg(faviconBase64, 'Liftr.ai Favicon', '24px', '24px');

    const logoImgTag = logoLightImg && faviconImg
      ? `${logoLightImg}<div style="width: 1px; height: 24px; background-color: #9ca3af; margin: 0 12px; align-self: center;"></div>${faviconImg}`
      : logoLightImg || faviconImg || '';
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>.NET Portfolio Analysis</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { 
      font-family: 'Inter', sans-serif; 
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .chart-container { 
      height: 300px !important; 
      width: 100% !important; 
      position: relative !important; 
    }
    .large-chart-container {
      height: 400px !important;
      width: 100% !important;
      position: relative !important;
    }
    canvas { 
      max-height: 300px !important; 
      height: 300px !important; 
      width: 100% !important; 
    }
    .metric-icon {
      padding: 12px;
      border-radius: 8px;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
    }
    .tab-active {
      border-bottom: 2px solid #3b82f6 !important;
      color: #2563eb !important;
    }
    .table-header {
      background-color: #f9fafb;
      cursor: pointer;
      user-select: none;
    }
    .table-header:hover {
      background-color: #f3f4f6;
    }
    /* Remove left/right space */
    .full-width-container {
      width: 100%;
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }
    @media (min-width: 640px) {
      .full-width-container {
        padding-left: 2rem;
        padding-right: 2rem;
      }
    }
    @media (min-width: 1024px) {
      .full-width-container {
        padding-left: 3rem;
        padding-right: 3rem;
      }
    }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="min-h-screen bg-gray-50">
    <div class="full-width-container py-6">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">.NET Portfolio Analysis</h1>
            <p class="text-gray-600 mt-2">
              Generated: ${new Date(data.metadata.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <!-- Executive Summary Cards - Full width -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="metric-icon bg-blue-50 text-blue-600">📁</div>
          </div>
          <h3 class="text-gray-500 text-sm font-medium mb-1">Total Projects</h3>
          <p class="text-3xl font-bold text-gray-900">${data.metadata.totalProjects}</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="metric-icon bg-indigo-50 text-indigo-600">💻</div>
          </div>
          <h3 class="text-gray-500 text-sm font-medium mb-1">Lines of Code</h3>
          <p class="text-3xl font-bold text-gray-900">${data.summary.totalLOC.toLocaleString()}</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="metric-icon bg-red-50 text-red-600">🔒</div>
          </div>
          <h3 class="text-gray-500 text-sm font-medium mb-1">Security Issues</h3>
          <p class="text-3xl font-bold text-gray-900">${data.summary.totalVulnerabilities}</p>
          <p class="text-sm text-gray-500 mt-2">${data.projects.filter(p => p.security.vulnerabilitiesCount > 5).length} critical projects</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="metric-icon bg-yellow-50 text-yellow-600">📊</div>
          </div>
          <h3 class="text-gray-500 text-sm font-medium mb-1">Avg Complexity</h3>
          <p class="text-3xl font-bold text-gray-900">${data.summary.averageComplexity.toFixed(2)}</p>
          <p class="text-sm text-gray-500 mt-2">${data.projects.filter(p => p.complexity.averageComplexity > 50).length} high complexity</p>
        </div>
      </div>

      <!-- Tabs - Full width -->
      <div class="bg-white rounded-lg shadow-lg mb-6">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px" id="tabContainer">
            <button class="tab px-6 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors tab-active" data-tab="overview">
              <span>📈</span>
              Overview
            </button>
            <button class="tab px-6 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors" data-tab="security">
              <span>🔐</span>
              Security
            </button>
            <button class="tab px-6 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors" data-tab="complexity">
              <span>🎯</span>
              Complexity
            </button>
            <button class="tab px-6 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors" data-tab="projects">
              <span>📋</span>
              All Projects
            </button>
          </nav>
        </div>

        <div class="p-6" id="tabContent">
          <!-- Overview Tab Content -->
          <div id="overviewContent" class="space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- File Type Distribution -->
              <div class="bg-white rounded-lg border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">File Type Distribution</h3>
                <div class="chart-container">
                  <canvas id="fileTypeChart"></canvas>
                </div>
              </div>
              
              <!-- Component Type Distribution -->
              <div class="bg-white rounded-lg border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Component Type Distribution</h3>
                <div class="chart-container">
                  <canvas id="componentTypeChart"></canvas>
                </div>
              </div>
            </div>
            
            <!-- Complexity Distribution -->
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Code Complexity Distribution</h3>
              <div class="chart-container">
                <canvas id="complexityChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Security Tab Content (hidden by default) -->
          <div id="securityContent" class="space-y-6 hidden">
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Top 10 Projects with Security Vulnerabilities</h3>
              <div class="large-chart-container">
                <canvas id="securityChart"></canvas>
              </div>
            </div>
            
            <!-- Security Details Table -->
            <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Security Issues by Project</h3>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vulnerabilities</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hardcoded Creds</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unsafe Patterns</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200" id="securityTable"></tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Complexity Tab Content (hidden by default) -->
          <div id="complexityContent" class="space-y-6 hidden">
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Top 10 Most Complex Projects</h3>
              <div class="large-chart-container">
                <canvas id="complexProjectsChart"></canvas>
              </div>
            </div>
            
            <!-- Complexity Insights -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="rounded-lg border-2 p-6 bg-green-50 border-green-200 text-green-800">
                <h4 class="font-semibold mb-2">Simple Code</h4>
                <p class="text-3xl font-bold mb-1">${data.aggregatedMetrics.complexityLevelDistribution.simple}</p>
                <p class="text-sm opacity-75">${((data.aggregatedMetrics.complexityLevelDistribution.simple / data.summary.totalFiles) * 100).toFixed(1)}% of total files</p>
              </div>
              <div class="rounded-lg border-2 p-6 bg-yellow-50 border-yellow-200 text-yellow-800">
                <h4 class="font-semibold mb-2">Complex Code</h4>
                <p class="text-3xl font-bold mb-1">${data.aggregatedMetrics.complexityLevelDistribution.complex + data.aggregatedMetrics.complexityLevelDistribution.medium}</p>
                <p class="text-sm opacity-75">${(((data.aggregatedMetrics.complexityLevelDistribution.complex + data.aggregatedMetrics.complexityLevelDistribution.medium) / data.summary.totalFiles) * 100).toFixed(1)}% of total files</p>
              </div>
              <div class="rounded-lg border-2 p-6 bg-red-50 border-red-200 text-red-800">
                <h4 class="font-semibold mb-2">Very Complex Code</h4>
                <p class="text-3xl font-bold mb-1">${data.aggregatedMetrics.complexityLevelDistribution.very_complex}</p>
                <p class="text-sm opacity-75">${((data.aggregatedMetrics.complexityLevelDistribution.very_complex / data.summary.totalFiles) * 100).toFixed(1)}% of total files</p>
              </div>
            </div>
          </div>

          <!-- Projects Tab Content (hidden by default) -->
          <div id="projectsContent" class="hidden">
            <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200" id="projectsTable">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider table-header" data-sort="name">Project Name</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider table-header" data-sort="loc">Lines of Code</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider table-header" data-sort="vulnerabilities">Vulnerabilities</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider table-header" data-sort="complexity">Complexity</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Components</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bundle Size</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200" id="projectsTableBody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Data from React component
    const analysisData = ${JSON.stringify(data, null, 2)};
    
    // Chart colors matching React UI
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
    const COMPLEXITY_COLORS = {
      'SIMPLE': '#10B981',
      'MEDIUM': '#F59E0B',
      'COMPLEX': '#EF4444',
      'VERY_COMPLEX': '#7C3AED'
    };

    // Chart.js defaults with proper tooltip configuration
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    Chart.defaults.plugins.tooltip.titleColor = 'white';
    Chart.defaults.plugins.tooltip.bodyColor = 'white';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(0, 0, 0, 0)';
    Chart.defaults.plugins.tooltip.borderWidth = 0;
    Chart.defaults.plugins.tooltip.cornerRadius = 4;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.displayColors = true;
    Chart.defaults.plugins.tooltip.boxPadding = 3;

    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    const tabContents = {
      overview: document.getElementById('overviewContent'),
      security: document.getElementById('securityContent'),
      complexity: document.getElementById('complexityContent'),
      projects: document.getElementById('projectsContent')
    };

    let chartInstances = {
      fileTypeChart: null,
      componentTypeChart: null,
      complexityChart: null,
      securityChart: null,
      complexProjectsChart: null
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Update active tab
        tabs.forEach(t => {
          t.classList.remove('tab-active');
          t.classList.remove('border-blue-500', 'text-blue-600');
          t.classList.add('border-transparent', 'text-gray-500');
        });
        tab.classList.add('tab-active', 'border-blue-500', 'text-blue-600');
        tab.classList.remove('border-transparent', 'text-gray-500');

        // Show selected content
        const tabName = tab.dataset.tab;
        Object.values(tabContents).forEach(content => {
          content.classList.add('hidden');
        });
        tabContents[tabName].classList.remove('hidden');

        // Initialize charts for the tab if needed
        if (tabName === 'overview' && !window.overviewChartsInitialized) {
          initOverviewCharts();
          window.overviewChartsInitialized = true;
        } else if (tabName === 'security' && !window.securityChartsInitialized) {
          initSecurityCharts();
          window.securityChartsInitialized = true;
        } else if (tabName === 'complexity' && !window.complexityChartsInitialized) {
          initComplexityCharts();
          window.complexityChartsInitialized = true;
        } else if (tabName === 'projects' && !window.projectsTableInitialized) {
          initProjectsTable();
          window.projectsTableInitialized = true;
        }
      });
    });

    // Initialize Overview Charts
    function initOverviewCharts() {
      // File Type Distribution Chart
      const fileTypeData = Object.entries(analysisData.aggregatedMetrics.fileTypeDistribution).map(([key, value]) => ({
        name: key.toUpperCase(),
        files: value.count,
        lines: value.lines
      }));

      const fileTypeCtx = document.getElementById('fileTypeChart').getContext('2d');
      if (chartInstances.fileTypeChart) chartInstances.fileTypeChart.destroy();
      
      chartInstances.fileTypeChart = new Chart(fileTypeCtx, {
        type: 'bar',
        data: {
          labels: fileTypeData.map(d => d.name),
          datasets: [
            {
              label: 'Files',
              data: fileTypeData.map(d => d.files),
              backgroundColor: '#3B82F6',
              borderRadius: 4,
              barPercentage: 0.7,
              categoryPercentage: 0.8
            },
            {
              label: 'Lines of Code',
              data: fileTypeData.map(d => d.lines),
              backgroundColor: '#10B981',
              borderRadius: 4,
              barPercentage: 0.7,
              categoryPercentage: 0.8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                padding: 20,
                usePointStyle: true
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  label += context.parsed.y.toLocaleString();
                  return label;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return value.toLocaleString();
                }
              },
              grid: {
                drawBorder: false
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });

      // Component Type Distribution Chart
      const componentTypeData = Object.entries(analysisData.aggregatedMetrics.componentTypeDistribution)
        .map(([key, value]) => ({
          name: key,
          count: value
        }));

      const componentTypeCtx = document.getElementById('componentTypeChart').getContext('2d');
      if (chartInstances.componentTypeChart) chartInstances.componentTypeChart.destroy();
      
      chartInstances.componentTypeChart = new Chart(componentTypeCtx, {
        type: 'pie',
        data: {
          labels: componentTypeData.map(d => d.name),
          datasets: [{
            data: componentTypeData.map(d => d.count),
            backgroundColor: COLORS.slice(0, componentTypeData.length),
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                padding: 20,
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return \`\${label}: \${value} (\${percentage}%)\`;
                }
              }
            }
          }
        }
      });

      // Complexity Distribution Chart
      const complexityData = Object.entries(analysisData.aggregatedMetrics.complexityLevelDistribution)
        .map(([key, value]) => ({
          name: key.replace('_', ' ').toUpperCase(),
          value: value
        }));

      const complexityCtx = document.getElementById('complexityChart').getContext('2d');
      if (chartInstances.complexityChart) chartInstances.complexityChart.destroy();
      
      chartInstances.complexityChart = new Chart(complexityCtx, {
        type: 'bar',
        data: {
          labels: complexityData.map(d => d.name),
          datasets: [{
            label: 'Files',
            data: complexityData.map(d => d.value),
            backgroundColor: complexityData.map(d => COMPLEXITY_COLORS[d.name] || '#8B5CF6'),
            borderRadius: 4,
            barPercentage: 0.6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  return \`Files: \${context.parsed.y.toLocaleString()}\`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return value.toLocaleString();
                }
              },
              grid: {
                drawBorder: false
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
    }

    // Initialize Security Charts
    function initSecurityCharts() {
      // Top 10 Vulnerable Projects
      const topVulnerable = [...analysisData.projects]
        .sort((a, b) => b.security.vulnerabilitiesCount - a.security.vulnerabilitiesCount)
        .slice(0, 10)
        .map(p => ({
          name: p.projectName.length > 20 ? p.projectName.substring(0, 20) + '...' : p.projectName,
          vulnerabilities: p.security.vulnerabilitiesCount,
          hardcodedCreds: p.security.hardcodedCredentialsCount
        }));

      const securityCtx = document.getElementById('securityChart').getContext('2d');
      if (chartInstances.securityChart) chartInstances.securityChart.destroy();
      
      chartInstances.securityChart = new Chart(securityCtx, {
        type: 'bar',
        data: {
          labels: topVulnerable.map(d => d.name),
          datasets: [
            {
              label: 'Vulnerabilities',
              data: topVulnerable.map(d => d.vulnerabilities),
              backgroundColor: '#EF4444',
              borderRadius: 4,
              barPercentage: 0.7
            },
            {
              label: 'Hardcoded Credentials',
              data: topVulnerable.map(d => d.hardcodedCreds),
              backgroundColor: '#F59E0B',
              borderRadius: 4,
              barPercentage: 0.7
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                padding: 20,
                usePointStyle: true
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              position: 'nearest',
              callbacks: {
                label: function(context) {
                  return \`\${context.dataset.label}: \${context.parsed.x}\`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: {
                drawBorder: false
              }
            },
            y: {
              grid: {
                display: false
              },
              ticks: {
                autoSkip: false,
                maxRotation: 0
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index',
            axis: 'y'
          }
        }
      });

      // Populate security table
      const securityTable = document.getElementById('securityTable');
      const securityProjects = analysisData.projects
        .filter(p => p.security.vulnerabilitiesCount > 0)
        .sort((a, b) => b.security.vulnerabilitiesCount - a.security.vulnerabilitiesCount);

      securityTable.innerHTML = securityProjects.map(project => {
        const vulnClass = project.security.vulnerabilitiesCount > 10 ? 'bg-red-100 text-red-800' :
                         project.security.vulnerabilitiesCount > 5 ? 'bg-orange-100 text-orange-800' :
                         'bg-yellow-100 text-yellow-800';
        
        return \`
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">\${project.projectName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <span class="px-2 py-1 rounded-full text-xs font-semibold \${vulnClass}">
                \${project.security.vulnerabilitiesCount}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${project.security.hardcodedCredentialsCount}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${project.security.unsafePatternsCount}</td>
          </tr>
        \`;
      }).join('');
    }

    // Initialize Complexity Charts
    function initComplexityCharts() {
      // Top 10 Complex Projects
      const topComplex = [...analysisData.projects]
        .sort((a, b) => b.complexity.averageComplexity - a.complexity.averageComplexity)
        .slice(0, 10)
        .map(p => ({
          name: p.projectName.length > 20 ? p.projectName.substring(0, 20) + '...' : p.projectName,
          complexity: parseFloat(p.complexity.averageComplexity.toFixed(2))
        }));

      const complexCtx = document.getElementById('complexProjectsChart').getContext('2d');
      if (chartInstances.complexProjectsChart) chartInstances.complexProjectsChart.destroy();
      
      chartInstances.complexProjectsChart = new Chart(complexCtx, {
        type: 'bar',
        data: {
          labels: topComplex.map(d => d.name),
          datasets: [{
            label: 'Complexity Score',
            data: topComplex.map(d => d.complexity),
            backgroundColor: '#8B5CF6',
            borderRadius: 4,
            barPercentage: 0.7
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              position: 'nearest',
              callbacks: {
                label: function(context) {
                  return \`Complexity: \${context.parsed.x.toFixed(2)}\`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: {
                drawBorder: false
              }
            },
            y: {
              grid: {
                display: false
              },
              ticks: {
                autoSkip: false,
                maxRotation: 0
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index',
            axis: 'y'
          }
        }
      });
    }

    // Initialize Projects Table with sorting
    function initProjectsTable() {
      const tableBody = document.getElementById('projectsTableBody');
      const sortHeaders = document.querySelectorAll('.table-header');
      let currentSort = { key: 'name', direction: 'asc' };
      let projects = [...analysisData.projects];

      function renderProjects() {
        // Sort projects
        projects.sort((a, b) => {
          let aVal, bVal;
          switch (currentSort.key) {
            case 'name':
              aVal = a.projectName.toLowerCase();
              bVal = b.projectName.toLowerCase();
              break;
            case 'loc':
              aVal = a.loc.totalLOC;
              bVal = b.loc.totalLOC;
              break;
            case 'vulnerabilities':
              aVal = a.security.vulnerabilitiesCount;
              bVal = b.security.vulnerabilitiesCount;
              break;
            case 'complexity':
              aVal = a.complexity.averageComplexity;
              bVal = b.complexity.averageComplexity;
              break;
            default:
              return 0;
          }

          if (currentSort.direction === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
          }
        });

        // Update sort indicators
        sortHeaders.forEach(header => {
          header.innerHTML = header.textContent.replace(/ ↑| ↓/g, '');
          if (header.dataset.sort === currentSort.key) {
            header.innerHTML += currentSort.direction === 'asc' ? ' ↑' : ' ↓';
          }
        });

        // Render table rows
        tableBody.innerHTML = projects.map(project => {
          const vulnClass = project.security.vulnerabilitiesCount === 0 ? 'bg-green-100 text-green-800' :
                          project.security.vulnerabilitiesCount > 10 ? 'bg-red-100 text-red-800' :
                          project.security.vulnerabilitiesCount > 5 ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800';
          
          const complexityClass = project.complexity.averageComplexity < 20 ? 'bg-green-100 text-green-800' :
                                project.complexity.averageComplexity < 50 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800';

          return \`
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">\${project.projectName}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${project.loc.totalLOC.toLocaleString()}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 py-1 rounded-full text-xs font-semibold \${vulnClass}">
                  \${project.security.vulnerabilitiesCount}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 py-1 rounded-full text-xs font-semibold \${complexityClass}">
                  \${project.complexity.averageComplexity.toFixed(1)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${project.inventory.totalComponents}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${project.inventory.totalServices}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${project.bundle.totalSizeFormatted}</td>
            </tr>
          \`;
        }).join('');
      }

      // Add click handlers for sorting
      sortHeaders.forEach(header => {
        header.addEventListener('click', () => {
          const sortKey = header.dataset.sort;
          if (currentSort.key === sortKey) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
          } else {
            currentSort.key = sortKey;
            currentSort.direction = 'asc';
          }
          renderProjects();
        });
      });

      // Initial render
      renderProjects();
    }

    // Initialize Overview tab on load
    initOverviewCharts();
    window.overviewChartsInitialized = true;
  </script>
    <!-- Footer with Trademark Logo -->
      <footer class="mt-8 pt-2 border-t border-gray-200" style="text-align: right; padding-right: 20px">
        <div style="display: flex; align-items: center; justify-content: flex-end;">
          ${logoImgTag}
        </div>
      </footer>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consolidated_project_inventory.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fixed height and scroll wrapper added to ensure full display inside Electron tab
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">.NET Portfolio Analysis</h1>
              <p className="text-gray-600 mt-2">
                Generated: {new Date(data.metadata.generatedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex justify-end items-center gap-3">
              <button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to Excel
              </button>
              <button onClick={exportToInteractiveHtml} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg shadow-lg hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 whitespace-nowrap">
                Export HTML
              </button>
            </div>

          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title="Total Projects"
            value={executiveSummary.totalProjects}
            icon="📁"
            color="blue"
          />
          <MetricCard
            title="Lines of Code"
            value={executiveSummary.totalLOC.toLocaleString()}
            icon="💻"
            color="indigo"
          />
          <MetricCard
            title="Security Issues"
            value={executiveSummary.totalVulnerabilities}
            icon="🔒"
            color="red"
            subtitle={`${executiveSummary.criticalVulnerabilities} critical projects`}
          />
          <MetricCard
            title="Avg Complexity"
            value={executiveSummary.averageComplexity}
            icon="📊"
            color="yellow"
            subtitle={`${executiveSummary.highComplexityProjects} high complexity`}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { key: 'overview', label: 'Overview', icon: '📈' },
                { key: 'security', label: 'Security', icon: '🔐' },
                { key: 'complexity', label: 'Complexity', icon: '🎯' },
                { key: 'projects', label: 'All Projects', icon: '📋' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-6 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Technology Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="File Type Distribution">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={fileTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="files" fill="#3B82F6" name="Files" />
                        <Bar dataKey="lines" fill="#10B981" name="Lines of Code" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Component Type Distribution">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={componentTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {componentTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>

                {/* Complexity Distribution */}
                <ChartCard title="Code Complexity Distribution">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={complexityDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8B5CF6" name="Files">
                        {complexityDistributionData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COMPLEXITY_COLORS[entry.name.toLowerCase().replace(' ', '_') as keyof typeof COMPLEXITY_COLORS] || '#8B5CF6'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <ChartCard title="Top 10 Projects with Security Vulnerabilities">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={top10VulnerableProjects} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="vulnerabilities" fill="#EF4444" name="Vulnerabilities" />
                      <Bar dataKey="hardcodedCreds" fill="#F59E0B" name="Hardcoded Credentials" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Security Details Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Security Issues by Project</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vulnerabilities</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hardcoded Creds</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unsafe Patterns</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.projects
                          .filter(p => p.security.vulnerabilitiesCount > 0)
                          .sort((a, b) => b.security.vulnerabilitiesCount - a.security.vulnerabilitiesCount)
                          .map((project, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {project.projectName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  project.security.vulnerabilitiesCount > 10 ? 'bg-red-100 text-red-800' :
                                  project.security.vulnerabilitiesCount > 5 ? 'bg-orange-100 text-orange-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {project.security.vulnerabilitiesCount}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {project.security.hardcodedCredentialsCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {project.security.unsafePatternsCount}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'complexity' && (
              <div className="space-y-6">
                <ChartCard title="Top 10 Most Complex Projects">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={top10ComplexProjects} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="complexity" fill="#8B5CF6" name="Complexity Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Complexity Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InsightCard
                    title="Simple Code"
                    value={data.aggregatedMetrics.complexityLevelDistribution.simple}
                    percentage={((data.aggregatedMetrics.complexityLevelDistribution.simple / data.summary.totalFiles) * 100).toFixed(1)}
                    color="green"
                  />
                  <InsightCard
                    title="Complex Code"
                    value={data.aggregatedMetrics.complexityLevelDistribution.complex + data.aggregatedMetrics.complexityLevelDistribution.medium}
                    percentage={(((data.aggregatedMetrics.complexityLevelDistribution.complex + data.aggregatedMetrics.complexityLevelDistribution.medium) / data.summary.totalFiles) * 100).toFixed(1)}
                    color="yellow"
                  />
                  <InsightCard
                    title="Very Complex Code"
                    value={data.aggregatedMetrics.complexityLevelDistribution.very_complex}
                    percentage={((data.aggregatedMetrics.complexityLevelDistribution.very_complex / data.summary.totalFiles) * 100).toFixed(1)}
                    color="red"
                  />
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          onClick={() => requestSort('name')}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        >
                          Project Name {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => requestSort('loc')}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        >
                          Lines of Code {sortConfig?.key === 'loc' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => requestSort('vulnerabilities')}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        >
                          Vulnerabilities {sortConfig?.key === 'vulnerabilities' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => requestSort('complexity')}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        >
                          Complexity {sortConfig?.key === 'complexity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Components
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Services
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bundle Size
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedProjects.map((project, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {project.projectName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {project.loc.totalLOC.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              project.security.vulnerabilitiesCount === 0 ? 'bg-green-100 text-green-800' :
                              project.security.vulnerabilitiesCount > 10 ? 'bg-red-100 text-red-800' :
                                project.security.vulnerabilitiesCount > 5 ? 'bg-orange-100 text-orange-800' :
                                  'bg-yellow-100 text-yellow-800'
                            }`}>
                              {project.security.vulnerabilitiesCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              project.complexity.averageComplexity < 20 ? 'bg-green-100 text-green-800' :
                              project.complexity.averageComplexity < 50 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                              {project.complexity.averageComplexity.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {project.inventory.totalComponents}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {project.inventory.totalServices}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {project.bundle.totalSizeFormatted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'indigo' | 'red' | 'yellow';
  subtitle?: string;
}

function MetricCard({ title, value, icon, color, subtitle }: Readonly<MetricCardProps>) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

function ChartCard({ title, children }: Readonly<ChartCardProps>) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

interface InsightCardProps {
  title: string;
  value: number;
  percentage: string;
  color: 'green' | 'yellow' | 'red';
}

function InsightCard({ title, value, percentage, color }: Readonly<InsightCardProps>) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`rounded-lg border-2 p-6 ${colorClasses[color]}`}>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-75">{percentage}% of total files</p>
    </div>
  );
}
