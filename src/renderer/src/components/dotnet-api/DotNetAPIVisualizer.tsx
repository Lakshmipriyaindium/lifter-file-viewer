// components/dotnet-api/DotNetAPIVisualizer.tsx
import React, { useState, useMemo } from "react";
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
} from "recharts";
import { DotNetApiAnalysisData, Project, Endpoint } from "./type";

interface ApiAnalysisVisualizationProps {
  data: DotNetApiAnalysisData;
}

const COLORS = {
  primary: "#fb851e",
  secondary: "#0ea5e9",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#a855f7",
  pink: "#ec4899",
  indigo: "#6366f1",
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.purple,
  COLORS.warning,
  COLORS.pink,
  COLORS.indigo,
  COLORS.danger,
];

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

export const ApiAnalysisVisualization: React.FC<
  ApiAnalysisVisualizationProps
> = ({ data }) => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const apiTypeData = useMemo(() => {
    const breakdown = data.Summary.ApiTypeBreakdown;
    return Object.entries(breakdown)
      .filter(([, value]) => value > 0)
      .map(([name, value], idx) => ({
        id: `api-type-${name}-${idx}`,
        name: name.replaceAll(/([A-Z])/g, " $1").trim(),
        value,
      }));
  }, [data.Summary.ApiTypeBreakdown]);

  const httpMethodData = useMemo(() => {
    const methods: Record<string, number> = {};
    for (const project of data.Projects) {
      for (const endpoint of project.Endpoints) {
        methods[endpoint.HttpMethod] = (methods[endpoint.HttpMethod] || 0) + 1;
      }
    }
    return Object.entries(methods).map(([name, value], idx) => ({ id: `http-method-${name}-${idx}`, name, value }));
  }, [data.Projects]);

  const filteredProjects = useMemo(() => {
    if (!selectedProject) return data.Projects;
    return data.Projects.filter((p) => p.Name === selectedProject);
  }, [data.Projects, selectedProject]);

  const exportToHtml = async () => {
    // Load both logos
    const logoLightBase64 = await loadLogoAsBase64('/assets/logo-light.png');
    const faviconBase64 = await loadLogoAsBase64('/favicon-3.webp');

    const logoLightImg = createLogoImg(logoLightBase64, 'Liftr.ai Logo', '90px', '90px');
    const faviconImg = createLogoImg(faviconBase64, 'Liftr.ai Favicon', '24px', '24px');

    const logoImgTag = logoLightImg && faviconImg
      ? `${logoLightImg}<div style="width: 1px; height: 24px; background-color: #9ca3af; margin: 0 12px; align-self: center;"></div>${faviconImg}`
      : logoLightImg || faviconImg || '';

    // Sanitize data: remove absolute paths from projects
    const sanitizedData = {
      ...data,
      Projects: data.Projects.map(project => ({
        ...project,
        Path: undefined // Remove the absolute path
      }))
    };
    
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.SolutionName} - API Analysis</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .chart-container { 
      height: 300px !important; 
      width: 100% !important; 
      position: relative !important; 
      max-height: 300px !important;
    }
    canvas { 
      max-height: 300px !important; 
      height: 300px !important; 
      width: 100% !important; 
    }
    #barTooltip {
      position: fixed;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.2s;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transform: translate(-50%, -100%);
      margin-top: -10px;
    }
    #barTooltip.show {
      opacity: 1;
    }
    .chart-area-hover {
      cursor: crosshair;
    }
    .project-endpoints {
      max-height: none !important;
      overflow: visible !important;
    }
    .projects-content-container {
      max-height: 800px;
      overflow-y: auto;
      padding-right: 8px;
    }
    .projects-content-container::-webkit-scrollbar {
      width: 6px;
    }
    .projects-content-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    .projects-content-container::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }
    .projects-content-container::-webkit-scrollbar-thumb:hover {
      background: #a1a1a1;
    }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <div id="app" class="w-full space-y-6 p-6">
    <div class="bg-white rounded-lg shadow-md p-6 border-l-4 flex items-start justify-between gap-4" style="border-left-color: #fb851e;">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">${data.SolutionName} - API Analysis</h1>
        <p class="text-gray-600">Analysis Date: ${new Date(data.AnalysisDate).toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
        })}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow-md p-6 border-l-4" style="border-left-color: #fb851e;">
        <h3 class="text-sm font-medium text-gray-600 mb-2">Total Projects</h3>
        <p class="text-3xl font-bold text-gray-900">${data.Summary.TotalProjects}</p>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6 border-l-4" style="border-left-color: #0ea5e9;">
        <h3 class="text-sm font-medium text-gray-600 mb-2">Total Endpoints</h3>
        <p class="text-3xl font-bold text-gray-900">${data.Summary.TotalEndpoints}</p>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6 border-l-4" style="border-left-color: #10b981;">
        <h3 class="text-sm font-medium text-gray-600 mb-2">SOAP Services</h3>
        <p class="text-3xl font-bold text-gray-900">${data.Summary.SoapServices.Total}</p>
        <p class="text-sm text-gray-500 mt-1">${data.Summary.SoapServices.WcfSoap} WCF SOAP, ${data.Summary.SoapServices.Asmx} ASMX</p>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6 border-l-4" style="border-left-color: #f59e0b;">
        <h3 class="text-sm font-medium text-gray-600 mb-2">REST/MVC APIs</h3>
        <p class="text-3xl font-bold text-gray-900">${data.Summary.RestMvcApis.Total}</p>
        <p class="text-sm text-gray-500 mt-1">${data.Summary.RestMvcApis.AspNetCore} ASP.NET Core, ${data.Summary.RestMvcApis.WebApi2} Web API 2</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">API Type Distribution</h3>
        <div class="chart-container">
          <canvas id="apiTypeChart"></canvas>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">HTTP Methods Distribution</h3>
        <div class="chart-container chart-area-hover relative">
          <canvas id="httpMethodChart"></canvas>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-gray-900">Projects & Endpoints</h3>
        <button id="showAllBtn" class="hidden px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors" style="background-color: #fb851e;">
          Show All Projects
        </button>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Project:</label>
        <select id="projectFilter" class="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option value="">All Projects</option>
          ${data.Projects.map(p => `<option value="${p.Name}">${p.Name} (${p.Endpoints.length} endpoints)</option>`).join('')}
        </select>
      </div>
      
      <div id="projectsContainer" class="projects-content-container space-y-4">
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-lg font-bold text-gray-900 mb-4">Framework Versions</h3>
      <div class="flex flex-wrap gap-2">
        ${data.Summary.FrameworkVersions.map(v => `<span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">${v}</span>`).join('')}
      </div>
    </div>
  </div>

  <div id="barTooltip"></div>

  <script>
    const fullData = ${JSON.stringify(sanitizedData, null, 2)};
    const colors = ['#fb851e', '#0ea5e9', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#6366f1', '#ef4444'];
    const apiTypeCtx = document.getElementById('apiTypeChart').getContext('2d');
    const apiTypeBreakdown = fullData.Summary.ApiTypeBreakdown;
    const apiTypeEntries = Object.entries(apiTypeBreakdown)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.replace(/([A-Z])/g, ' $1').trim(),
        value: value
      }));

    new Chart(apiTypeCtx, {
      type: 'pie',
      data: { 
        labels: apiTypeEntries.map(d => d.name), 
        datasets: [{ 
          data: apiTypeEntries.map(d => d.value), 
          backgroundColor: apiTypeEntries.map((_, i) => colors[i % colors.length]),
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
              usePointStyle: true,
              generateLabels: function(chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map(function(label, i) {
                    const value = data.datasets[0].data[i];
                    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                    return {
                      text: \`\${label} (\${percentage}%)\`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      strokeStyle: data.datasets[0].backgroundColor[i],
                      lineWidth: 1,
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return \`\${label}: \${value} (\${percentage}%)\`;
              }
            }
          }
        }
      }
    });

    const httpMethodCtx = document.getElementById('httpMethodChart').getContext('2d');
    const barTooltip = document.getElementById('barTooltip');
    const methods = {};
    fullData.Projects.forEach(project => {
      project.Endpoints.forEach(endpoint => {
        methods[endpoint.HttpMethod] = (methods[endpoint.HttpMethod] || 0) + 1;
      });
    });
    
    const methodEntries = Object.entries(methods);
    const methodLabels = methodEntries.map(([name]) => name);
    const methodValues = methodEntries.map(([_, value]) => value);

    const httpMethodChart = new Chart(httpMethodCtx, {
      type: 'bar',
      data: { 
        labels: methodLabels, 
        datasets: [{ 
          label: 'Count', 
          data: methodValues, 
          backgroundColor: methodEntries.map((_, i) => colors[i % colors.length]),
          borderRadius: 4,
          borderWidth: 0,
          hoverBackgroundColor: methodEntries.map((_, i) => colors[i % colors.length])
        }] 
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { 
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(0, 0, 0, 0)',
            borderWidth: 0,
            cornerRadius: 4,
            padding: 10,
            displayColors: false,
            callbacks: {
              title: function(tooltipItems) {
                return tooltipItems[0].label;
              },
              label: function(context) {
                return \`Count: \${context.raw}\`;
              }
            }
          }
        },
        scales: { 
          y: { 
            beginAtZero: true,
            ticks: { 
              padding: 10,
              callback: function(value) {
                if (value % 1 === 0) return value;
              }
            },
            grid: {
              drawBorder: false,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            ticks: { 
              maxRotation: 45,
              minRotation: 0
            },
            grid: {
              display: false
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
          axis: 'x'
        },
        hover: {
          mode: 'index',
          intersect: false
        }
      }
    });

    barTooltip.style.display = 'none';

    const projectFilter = document.getElementById('projectFilter');
    const projectsContainer = document.getElementById('projectsContainer');
    const showAllBtn = document.getElementById('showAllBtn');

    function renderProjects() {
      const selectedProject = projectFilter.value;
      const filteredProjects = selectedProject ? fullData.Projects.filter(p => p.Name === selectedProject) : fullData.Projects;
      
      if (selectedProject) {
        showAllBtn.classList.remove('hidden');
      } else {
        showAllBtn.classList.add('hidden');
      }
      
      projectsContainer.innerHTML = '';
      
      filteredProjects.forEach((project, projectIndex) => {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'bg-white rounded-lg shadow-md p-6 border border-gray-200 project-card';
        projectDiv.id = \`project-\${projectIndex}\`;
        
        const header = \`
          <div class="mb-4">
            <h4 class="text-lg font-bold text-gray-900 mb-2">\${project.Name}</h4>
            <div class="flex flex-wrap gap-2 text-sm">
              <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">\${project.Language}</span>
              <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">\${project.Framework}</span>
              <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">\${project.Endpoints.length} Endpoints</span>
            </div>
          </div>
        \`;
        
        const endpointsContainer = document.createElement('div');
        endpointsContainer.className = 'project-endpoints space-y-3';
        endpointsContainer.id = \`endpoints-\${projectIndex}\`;
        
        project.Endpoints.forEach((endpoint, endpointIndex) => {
          const endpointId = \`\${project.Name}-\${endpoint.Name}-\${endpointIndex}\`;
          const endpointDiv = document.createElement('div');
          endpointDiv.className = 'bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors endpoint-card';
          endpointDiv.id = endpointId;
          endpointDiv.innerHTML = \`
            <div class="cursor-pointer endpoint-header">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <h5 class="font-semibold text-gray-900 flex items-center gap-2">
                    <span class="px-2 py-1 text-xs rounded font-medium text-white" style="background-color: #fb851e;">\${endpoint.HttpMethod}</span>
                    \${endpoint.Name}
                  </h5>
                  <p class="text-sm text-gray-600 mt-1 font-mono">\${endpoint.Route}</p>
                </div>
                <span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">\${endpoint.ApiType}</span>
              </div>
            </div>
            <div class="endpoint-details hidden mt-3 pt-3 border-t border-gray-200 space-y-2">
              <div><span class="text-xs font-medium text-gray-500">Return Type:</span> <span class="text-sm text-gray-700 font-mono">\${endpoint.ReturnType}</span></div>
              <div><span class="text-xs font-medium text-gray-500">Class Name:</span> <span class="text-sm text-gray-700 font-mono">\${endpoint.ClassName}</span></div>
              \${endpoint.Parameters.length > 0 ? \`
                <div>
                  <span class="text-xs font-medium text-gray-500">Parameters:</span>
                  <div class="mt-1 space-y-1">\${endpoint.Parameters.map((param, paramIndex) => \`
                    <div class="flex items-center gap-2 text-sm font-mono">
                      <span class="text-gray-700">\${param.Name}:</span>
                      <span class="text-gray-500">\${param.Type}</span>
                      \${param.Source ? \`<span class="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">\${param.Source}</span>\` : ''}
                    </div>
                  \`).join('')}</div>
                </div>
              \` : ''}
            </div>
          \`;
          
          endpointsContainer.appendChild(endpointDiv);
        });
        
        projectDiv.innerHTML = header;
        projectDiv.appendChild(endpointsContainer);
        projectsContainer.appendChild(projectDiv);
      });
      
      document.querySelectorAll('.endpoint-header').forEach(header => {
        header.addEventListener('click', function() {
          const card = this.closest('.endpoint-card');
          const details = card.querySelector('.endpoint-details');
          details.classList.toggle('hidden');
        });
      });
      
      if (selectedProject && filteredProjects.length > 0) {
        setTimeout(() => {
          projectsContainer.scrollTop = 0;
        }, 50);
      }
    }

    projectFilter.addEventListener('change', renderProjects);
    
    showAllBtn.addEventListener('click', function() {
      projectFilter.value = '';
      renderProjects();
    });

    renderProjects();
  </script>

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
    link.download = `${data.SolutionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_api_report.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    subtitle?: string;
    color?: string;
  }> = ({ title, value, subtitle, color = COLORS.primary }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  const EndpointCard: React.FC<{ endpoint: Endpoint; projectName: string }> = ({
    endpoint,
    projectName,
  }) => {
    const endpointId = `${projectName}-${endpoint.Name}`;
    const isExpanded = expandedEndpoint === endpointId;

    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
        <div
          className="cursor-pointer"
          onClick={() =>
            setExpandedEndpoint(isExpanded ? null : endpointId)
          }
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                <span
                  className="px-2 py-1 text-xs rounded font-medium text-white"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  {endpoint.HttpMethod}
                </span>
                {endpoint.Name}
              </h5>
              <p className="text-sm text-gray-600 mt-1 font-mono">
                {endpoint.Route}
              </p>
            </div>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
              {endpoint.ApiType}
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            <div>
              <span className="text-xs font-medium text-gray-500">
                Return Type:
              </span>
              <p className="text-sm text-gray-700 font-mono mt-1">
                {endpoint.ReturnType}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500">
                Class Name:
              </span>
              <p className="text-sm text-gray-700 font-mono mt-1">
                {endpoint.ClassName}
              </p>
            </div>
            {endpoint.Parameters.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500">
                  Parameters:
                </span>
                <div className="mt-1 space-y-1">
                  {endpoint.Parameters.map((param, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm font-mono"
                    >
                      <span className="text-gray-700">{param.Name}:</span>
                      <span className="text-gray-500">{param.Type}</span>
                      {param.Source && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                          {param.Source}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="mb-4">
        <h4 className="text-lg font-bold text-gray-900 mb-2">
          {project.Name}
        </h4>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
            {project.Language}
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
            {project.Framework}
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
            {project.Endpoints.length} Endpoints
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {project.Endpoints.map((endpoint, idx) => (
          <EndpointCard
            key={idx}
            endpoint={endpoint}
            projectName={project.Name}
          />
        ))}
      </div>
    </div>
  );

  // Converted min-h-screen to h-full overflow-y-auto to fix Electron scroll issues
  return (
    <div className="w-full h-full overflow-y-auto space-y-6 p-6 bg-gray-50">
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 flex items-start justify-between gap-4" style={{ borderLeftColor: COLORS.primary }}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {data.SolutionName} - API Analysis
          </h1>
          <p className="text-gray-600">
            Analysis Date:{" "}
            {new Date(data.AnalysisDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <button
          onClick={exportToHtml}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg shadow-lg hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
        >
          Export HTML
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={data.Summary.TotalProjects}
          color={COLORS.primary}
        />
        <StatCard
          title="Total Endpoints"
          value={data.Summary.TotalEndpoints}
          color={COLORS.secondary}
        />
        <StatCard
          title="SOAP Services"
          value={data.Summary.SoapServices.Total}
          subtitle={`${data.Summary.SoapServices.WcfSoap} WCF SOAP, ${data.Summary.SoapServices.Asmx} ASMX`}
          color={COLORS.success}
        />
        <StatCard
          title="REST/MVC APIs"
          value={data.Summary.RestMvcApis.Total}
          subtitle={`${data.Summary.RestMvcApis.AspNetCore} ASP.NET Core, ${data.Summary.RestMvcApis.WebApi2} Web API 2`}
          color={COLORS.warning}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            API Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={apiTypeData}
                dataKey="value"
                nameKey="id"
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
              >
                {apiTypeData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={CHART_COLORS[apiTypeData.indexOf(entry) % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            HTTP Methods Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={httpMethodData.map(item => ({ ...item, key: item.id }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.primary} isAnimationActive={false}>
                {httpMethodData.map((entry) => (
                  <Cell key={entry.id} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Projects & Endpoints
          </h3>
          {selectedProject && (
            <button
              onClick={() => setSelectedProject(null)}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: COLORS.primary }}
            >
              Show All Projects
            </button>
          )}
        </div>

        {!selectedProject && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Project:
            </label>
            <select
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
              onChange={(e) => setSelectedProject(e.target.value || null)}
              value={selectedProject || ""}
            >
              <option value="">All Projects</option>
              {data.Projects.map((project, idx) => (
                <option key={`project-option-${idx}`} value={project.Name}>
                  {project.Name} ({project.Endpoints.length} endpoints)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-4">
          {filteredProjects.map((project, idx) => (
            <ProjectCard key={`project-card-${idx}-${project.Name}`} project={project} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Framework Versions
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.Summary.FrameworkVersions.map((version, idx) => (
            <span
              key={`framework-version-${idx}`}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
            >
              {version}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApiAnalysisVisualization;
