// components/project-analysis/CodebaseAnalyzer.tsx
import React, { useState, useMemo } from 'react'
import { 
  Search, Database, Code, GitBranch, Package, FileText, 
  ChevronDown, X, Filter, BarChart3, 
  FolderOpen, Table, Grid3x3, Download, ChevronUp, Eye, Network, FileDown
} from 'lucide-react'
import IntegrationDetailsView from './IntegrationDetailsView'

// Type definitions
interface FileComposition {
  [key: string]: number
}

interface FrameworkDetails {
  dotnet_style?: string
  web_framework?: string
  angular_cli?: string
  angular_config?: string
  typescript?: boolean
  java_framework?: string
  blazor?: boolean
  blazor_type?: string
  api_types?: string[]
  [key: string]: string | number | boolean | string[] | undefined
}

interface Versions {
  tools_version?: string
  target_framework?: string
  target_frameworks?: string[]
  angular_version?: string
  java_version?: string
}

interface IntegrationPattern {
  type: string
  url: string
  source_file: string
}

interface AdditionalInfo {
  configuration_files?: string[]
  sql_file_count?: number
}

interface Project {
  project_name: string
  project_path: string
  project_type: string[]
  framework_details: FrameworkDetails
  versions: Versions
  has_ui: boolean
  has_api: boolean
  database_config: string[]
  third_party_connectivity: string[]
  libraries: string[]
  file_composition: FileComposition
  unique_extensions: string[]
  integration_patterns: IntegrationPattern[]
  build_system: string[]
  additional_info: AdditionalInfo
}

export interface CodebaseAnalysis {
  analysis_timestamp: string
  root_folder: string
  total_projects: number
  projects: Project[]
}

// Utility function to export to Excel (CSV format)
const exportToExcel = (projects: Project[], filename: string = 'codebase_analysis') => {
  const headers = [
    'Project Name',
    'Project Path',
    'Project Types',
    'Framework - Web Framework',
    'Framework - Java Framework', 
    'Framework - .NET Style',
    'Framework - Angular CLI',
    'Framework - Angular Config',
    'Framework - TypeScript',
    'Framework - Blazor',
    'Framework - Blazor Type',
    'Framework - API Types',
    'Version - Tools Version',
    'Version - Target Framework',
    'Version - Target Frameworks',
    'Version - Angular Version',
    'Version - Java Version',
    'Has UI',
    'Has API',
    'Database Config',
    'Third Party Connectivity',
    'Libraries',
    'Build System',
    'Integration Patterns',
    'Unique Extensions',
    'Total Files',
    'File Composition - C#',
    'File Composition - VB.NET',
    'File Composition - JavaScript',
    'File Composition - TypeScript',
    'File Composition - HTML',
    'File Composition - CSS',
    'File Composition - JSON',
    'File Composition - ASPX',
    'File Composition - Java',
    'File Composition - JSP',
    'File Composition - SQL',
    'File Composition - Config',
    'File Composition - Build',
    'File Composition - Other',
    'Additional Info - Configuration Files',
    'Additional Info - SQL File Count'
  ]

  const rows = projects.map(project => {
    const totalFiles = Object.values(project.file_composition).reduce((a, b) => a + b, 0)
    
    return [
      project.project_name,
      project.project_path,
      project.project_type.join('; '),
      project.framework_details.web_framework || '',
      project.framework_details.java_framework || '',
      project.framework_details.dotnet_style || '',
      project.framework_details.angular_cli || '',
      project.framework_details.angular_config || '',
      project.framework_details.typescript ? 'Yes' : 'No',
      project.framework_details.blazor ? 'Yes' : 'No',
      project.framework_details.blazor_type || '',
      project.framework_details.api_types?.join('; ') || '',
      project.versions.tools_version || '',
      project.versions.target_framework || '',
      project.versions.target_frameworks?.join('; ') || '',
      project.versions.angular_version || '',
      project.versions.java_version || '',
      project.has_ui ? 'Yes' : 'No',
      project.has_api ? 'Yes' : 'No',
      project.database_config.join('; '),
      project.third_party_connectivity.join('; '),
      project.libraries.join('; '),
      project.build_system.join('; '),
      project.integration_patterns.map(p => `${p.type}: ${p.url} (${p.source_file})`).join('; '),
      project.unique_extensions.join('; '),
      totalFiles,
      project.file_composition.csharp || 0,
      project.file_composition.vbnet || 0,
      project.file_composition.javascript || 0,
      project.file_composition.typescript || 0,
      project.file_composition.html || 0,
      project.file_composition.css || 0,
      project.file_composition.json || 0,
      project.file_composition.aspx || 0,
      project.file_composition.java || 0,
      project.file_composition.jsp || 0,
      project.file_composition.sql || 0,
      project.file_composition.config || 0,
      project.file_composition.build || 0,
      project.file_composition.other || 0,
      project.additional_info.configuration_files?.join('; ') || '',
      project.additional_info.sql_file_count || 0
    ]
  })

  // Convert to CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const cellStr = String(cell)
      if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }).join(','))
  ].join('\n')

  // Create and download file
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

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

// Utility function to export to standalone HTML
const exportToHTML = async (
  data: CodebaseAnalysis,
  currentState: {
    searchTerm: string
    filterType: string
    viewMode: 'card' | 'table'
    sortField: string
    sortDirection: 'asc' | 'desc'
    expandedRows: Set<string>
    showStats: boolean
  }
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { root_folder, ...filteredData } = data
  const projectFilteredData = {
    ...filteredData,
    projects: data.projects.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ project_path, ...rest }) => rest
    ),
  }
  
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
  
  // Serialize current state
  const stateData = {
    ...currentState,
    expandedRows: Array.from(currentState.expandedRows)
  }

  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `codebase_analysis_${dateStr}.html`

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LIFTR.ai Codebase Analysis - ${dateStr}</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    .footer {
        display: flex;
        justify-content: right;
        align-items: center;
        padding: 0rem 3rem 0rem 2rem;
      }
    .logo-container {
      position: static;
    }
    .logo-container img { height: 40px; opacity: 0.8; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useMemo, createElement: h, Fragment, useEffect, useRef } = React;
    
    const iconPaths = {
      Search: '<path d="m19 19-3.5-3.5"/><circle cx="11" cy="11" r="8"/>',
      Filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
      Table: '<path d="M12 3v18"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
      Grid3x3: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
      BarChart3: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
      FolderOpen: '<path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>',
      Code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
      GitBranch: '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m18 9a9 9 0 0 1-9 9"/>',
      FileText: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
      Package: '<path d="m21 16-9 5-9-5"/><path d="m12 21V11"/><path d="m21 16v-5l-9-5-9 5v5"/><path d="m3 8 9 5 9-5"/><path d="m12 3v8"/>',
      Database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
      ChevronDown: '<path d="m6 9 6 6 6-6"/>',
      ChevronUp: '<path d="m18 15-6-6-6 6"/>',
      Eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
      Download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
      FileDown: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/>',
      Network: '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
      X: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
    };
    
    const Icon = ({ name, className = '', size = 16, ...props }) => {
      const iconRef = useRef(null);
      
      const renderIcon = () => {
        if (!iconRef.current) return;
        
        try {
          let svgContent = null;
          
          if (window.lucide) {
            if (window.lucide.createElement) {
              const IconComponent = window.lucide[name];
              iconRef.current.innerHTML = '';

              const svg = window.lucide.createElement(IconComponent, {
                width: size,
                height: size,
                stroke: 'currentColor',
                'stroke-width': 2,
              });

              if (svg) {
                iconRef.current.appendChild(svg);
              }
            }
            else if (typeof window.lucide[name] === 'function') {
              const result = window.lucide[name]({ size, strokeWidth: 2, color: 'currentColor' });
              if (result) {
                if (typeof result === 'string') {
                  svgContent = result;
                } else if (result.outerHTML) {
                  svgContent = result.outerHTML;
                } else if (result.innerHTML) {
                  svgContent = result.innerHTML;
                }
              }
            }
            else if (window.lucide.icons && window.lucide.icons[name]) {
              const iconData = window.lucide.icons[name];
              if (iconData && iconData.path) {
                svgContent = \`<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\${iconData.path}</svg>\`;
              }
            }
          }
          
          if (!svgContent && iconPaths[name]) {
            svgContent = \`<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\${iconPaths[name]}</svg>\`;
          }
          
          if (!svgContent) {
            svgContent = \`<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>\`;
          }
          
          iconRef.current.innerHTML = svgContent;
        } catch (e) {
          const fallback = \`<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>\`;
          if (iconRef.current) {
            iconRef.current.innerHTML = fallback;
          }
        }
      };
      
      useEffect(() => {
        renderIcon();
        const timeout = setTimeout(renderIcon, 100);
        
        const handleReady = () => renderIcon();
        window.addEventListener('lucideReady', handleReady);
        
        return () => {
          clearTimeout(timeout);
          window.removeEventListener('lucideReady', handleReady);
        };
      }, [name, size]);
      
      return h('span', { 
        ref: iconRef, 
        className: (className || '') + ' inline-flex items-center justify-center',
        style: { width: size + 'px', height: size + 'px', display: 'inline-flex', flexShrink: 0 },
        ...props 
      });
    };
    
    if (typeof window !== 'undefined') {
      const checkLucide = setInterval(() => {
        if (window.lucide) {
          window.dispatchEvent(new Event('lucideReady'));
          clearInterval(checkLucide);
        }
      }, 50);
      
      setTimeout(() => clearInterval(checkLucide), 5000);
    }

    const data = ${JSON.stringify(projectFilteredData, null, 2)};
    const initialState = ${JSON.stringify(stateData, null, 2)};

    const CodebaseAnalyzer = () => {
      const [searchTerm, setSearchTerm] = useState(initialState.searchTerm || '');
      const [filterType, setFilterType] = useState(initialState.filterType || 'all');
      const [viewMode, setViewMode] = useState(initialState.viewMode || 'table');
      const [sortField, setSortField] = useState(initialState.sortField || 'project_name');
      const [sortDirection, setSortDirection] = useState(initialState.sortDirection || 'asc');
      const [expandedRows, setExpandedRows] = useState(new Set(initialState.expandedRows || []));
      const [showStats, setShowStats] = useState(initialState.showStats !== false);
      const [showIntegrationView, setShowIntegrationView] = useState(false);

      const filteredProjects = useMemo(() => {
        let filtered = data.projects;

        if (filterType !== 'all') {
          filtered = filtered.filter(p => p.project_type.includes(filterType));
        }

        if (searchTerm) {
          filtered = filtered.filter(p => 
            p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.project_type.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
            p.framework_details?.web_framework?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        filtered = [...filtered].sort((a, b) => {
          let aVal, bVal;
          switch (sortField) {
            case 'project_name':
              aVal = a.project_name;
              bVal = b.project_name;
              break;
            case 'type':
              aVal = a.project_type.join(', ');
              bVal = b.project_type.join(', ');
              break;
            case 'framework':
              aVal = a.framework_details?.web_framework || '';
              bVal = b.framework_details?.web_framework || '';
              break;
            case 'has_ui':
              aVal = a.has_ui;
              bVal = b.has_ui;
              break;
            case 'has_api':
              aVal = a.has_api;
              bVal = b.has_api;
              break;
            case 'libraries':
              aVal = a.libraries.length;
              bVal = b.libraries.length;
              break;
            case 'files':
              aVal = Object.values(a.file_composition || {}).reduce((sum, count) => sum + count, 0);
              bVal = Object.values(b.file_composition || {}).reduce((sum, count) => sum + count, 0);
              break;
            default:
              aVal = a.project_name;
              bVal = b.project_name;
          }
          if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });

        return filtered;
      }, [searchTerm, filterType, sortField, sortDirection]);

      const projectTypes = useMemo(() => {
        const types = new Set();
        data.projects.forEach(p => p.project_type.forEach(t => types.add(t)));
        return Array.from(types).sort();
      }, []);

      const handleSort = (field) => {
        if (sortField === field) {
          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
          setSortField(field);
          setSortDirection('asc');
        }
      };

      const toggleRowExpansion = (projectName) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(projectName)) {
          newExpanded.delete(projectName);
        } else {
          newExpanded.add(projectName);
        }
        setExpandedRows(newExpanded);
      };

      const stats = useMemo(() => {
        return {
          totalProjects: filteredProjects.length,
          hasUI: filteredProjects.filter(p => p.has_ui).length,
          hasAPI: filteredProjects.filter(p => p.has_api).length,
          totalFiles: filteredProjects.reduce((sum, p) => 
            sum + Object.values(p.file_composition || {}).reduce((a, b) => a + b, 0), 0
          )
        };
      }, [filteredProjects]);

      return h('div', { className: 'min-h-screen bg-gray-50 p-6' },
        h('div', { className: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white p-8 rounded-lg mb-6 shadow-lg' },
          h('h1', { className: 'text-2xl font-bold mb-2' }, 'LIFTR.ai Codebase Analysis'),
          h('div', { className: 'mt-4 flex gap-6 text-sm' },
            h('span', null, 'Analysis Date: ', data.analysis_timestamp),
            h('span', null, 'Total Projects: ', data.total_projects)
          )
        ),
        h('div', { className: 'bg-white p-6 rounded-lg shadow mb-6' },
          h('div', { className: 'flex flex-wrap gap-4' },
            h('div', { className: 'flex-1 min-w-[300px]' },
              h('div', { className: 'relative' },
                h(Icon, { name: 'Search', className: 'absolute left-3 top-3 h-4 w-4 text-gray-400' }),
                h('input', {
                  type: 'text',
                  placeholder: 'Search projects, types, or frameworks...',
                  className: 'w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500',
                  value: searchTerm,
                  onChange: (e) => setSearchTerm(e.target.value)
                })
              )
            ),
            h('div', { className: 'flex items-center gap-2' },
              h(Icon, { name: 'Filter', className: 'h-4 w-4 text-gray-600' }),
              h('select', {
                className: 'px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500',
                value: filterType,
                onChange: (e) => setFilterType(e.target.value)
              },
                h('option', { value: 'all' }, 'All Types'),
                ...projectTypes.map(type => h('option', { key: type, value: type }, type))
              )
            ),
            h('div', { className: 'flex gap-2' },
              h('button', {
                onClick: () => setViewMode('table'),
                className: \`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 \${
                  viewMode === 'table' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }\`
              },
                h(Icon, { name: 'Table', className: 'h-4 w-4' }),
                'Table View'
              ),
              h('button', {
                onClick: () => setViewMode('card'),
                className: \`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 \${
                  viewMode === 'card' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }\`
              },
                h(Icon, { name: 'Grid3x3', className: 'h-4 w-4' }),
                'Card View'
              ),
              h('button', {
                onClick: () => setShowStats(!showStats),
                className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2'
              },
                h(Icon, { name: 'BarChart3', className: 'h-4 w-4' }),
                showStats ? 'Hide' : 'Show', ' Stats'
              )
            )
          )
        ),
        showStats && h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6' },
          h('div', { className: 'bg-white p-4 rounded-lg shadow' },
            h('div', { className: 'flex items-center justify-between' },
              h('div', null,
                h('p', { className: 'text-sm text-gray-600' }, 'Projects'),
                h('p', { className: 'text-2xl font-bold text-gray-900' }, stats.totalProjects)
              ),
              h(Icon, { name: 'FolderOpen', className: 'h-8 w-8 text-orange-500', size: 32 })
            )
          ),
          h('div', { className: 'bg-white p-4 rounded-lg shadow' },
            h('div', { className: 'flex items-center justify-between' },
              h('div', null,
                h('p', { className: 'text-sm text-gray-600' }, 'With UI'),
                h('p', { className: 'text-2xl font-bold text-gray-900' }, stats.hasUI)
              ),
              h(Icon, { name: 'Code', className: 'h-8 w-8 text-blue-500', size: 32 })
            )
          ),
          h('div', { className: 'bg-white p-4 rounded-lg shadow' },
            h('div', { className: 'flex items-center justify-between' },
              h('div', null,
                h('p', { className: 'text-sm text-gray-600' }, 'With API'),
                h('p', { className: 'text-2xl font-bold text-gray-900' }, stats.hasAPI)
              ),
              h(Icon, { name: 'GitBranch', className: 'h-8 w-8 text-green-500', size: 32 })
            )
          ),
          h('div', { className: 'bg-white p-4 rounded-lg shadow' },
            h('div', { className: 'flex items-center justify-between' },
              h('div', null,
                h('p', { className: 'text-sm text-gray-600' }, 'Total Files'),
                h('p', { className: 'text-2xl font-bold text-gray-900' }, stats.totalFiles.toLocaleString())
              ),
              h(Icon, { name: 'FileText', className: 'h-8 w-8 text-purple-500', size: 32 })
            )
          )
        ),
        viewMode === 'table' && h('div', { className: 'bg-white rounded-lg shadow overflow-hidden' },
          h('div', { className: 'overflow-x-auto' },
            h('table', { className: 'w-full' },
              h('thead', { className: 'bg-gray-50 border-b' },
                h('tr', null,
                  h('th', { className: 'px-4 py-3 text-left' },
                    h('button', {
                      className: 'font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1',
                      onClick: () => handleSort('project_name')
                    },
                      'Project Name',
                      sortField === 'project_name' && (sortDirection === 'asc' 
                        ? h(Icon, { name: 'ChevronUp', className: 'h-3 w-3' })
                        : h(Icon, { name: 'ChevronDown', className: 'h-3 w-3' }))
                    )
                  ),
                  h('th', { className: 'px-4 py-3 text-left' },
                    h('button', {
                      className: 'font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1',
                      onClick: () => handleSort('type')
                    },
                      'Type',
                      sortField === 'type' && (sortDirection === 'asc' 
                        ? h(Icon, { name: 'ChevronUp', className: 'h-3 w-3' })
                        : h(Icon, { name: 'ChevronDown', className: 'h-3 w-3' }))
                    )
                  ),
                  h('th', { className: 'px-4 py-3 text-left' },
                    h('button', {
                      className: 'font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1',
                      onClick: () => handleSort('framework')
                    },
                      'Framework',
                      sortField === 'framework' && (sortDirection === 'asc' 
                        ? h(Icon, { name: 'ChevronUp', className: 'h-3 w-3' })
                        : h(Icon, { name: 'ChevronDown', className: 'h-3 w-3' }))
                    )
                  ),
                  h('th', { className: 'px-4 py-3 text-center' },
                    h('button', {
                      className: 'font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1',
                      onClick: () => handleSort('has_ui')
                    },
                      'UI',
                      sortField === 'has_ui' && (sortDirection === 'asc' 
                        ? h(Icon, { name: 'ChevronUp', className: 'h-3 w-3' })
                        : h(Icon, { name: 'ChevronDown', className: 'h-3 w-3' }))
                    )
                  ),
                  h('th', { className: 'px-4 py-3 text-center' },
                    h('button', {
                      className: 'font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1',
                      onClick: () => handleSort('has_api')
                    },
                      'API',
                      sortField === 'has_api' && (sortDirection === 'asc' 
                        ? h(Icon, { name: 'ChevronUp', className: 'h-3 w-3' })
                        : h(Icon, { name: 'ChevronDown', className: 'h-3 w-3' }))
                    )
                  ),
                  h('th', { className: 'px-4 py-3 text-left' }, 'Database'),
                  h('th', { className: 'px-4 py-3 text-center' },
                    h('button', {
                      className: 'font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1',
                      onClick: () => handleSort('libraries')
                    },
                      'Libraries',
                      sortField === 'libraries' && (sortDirection === 'asc' 
                        ? h(Icon, { name: 'ChevronUp', className: 'h-3 w-3' })
                        : h(Icon, { name: 'ChevronDown', className: 'h-3 w-3' }))
                    )
                  ),
                  h('th', { className: 'px-4 py-3 text-center' },
                    h('button', {
                      className: 'font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1',
                      onClick: () => handleSort('files')
                    },
                      'Files',
                      sortField === 'files' && (sortDirection === 'asc' 
                        ? h(Icon, { name: 'ChevronUp', className: 'h-3 w-3' })
                        : h(Icon, { name: 'ChevronDown', className: 'h-3 w-3' }))
                    )
                  ),
                  h('th', { className: 'px-4 py-3 text-center' }, 'Details')
                )
              ),
              h('tbody', null,
                ...filteredProjects.map((project, idx) => {
                  const totalFiles = Object.values(project.file_composition || {}).reduce((sum, count) => sum + count, 0);
                  const isExpanded = expandedRows.has(project.project_name);
                  return h(Fragment, { key: project.project_name },
                    h('tr', {
                      className: \`border-b hover:bg-gray-50 \${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}\`
                    },
                      h('td', { className: 'px-4 py-3 font-medium text-gray-900' }, project.project_name),
                      h('td', { className: 'px-4 py-3' },
                        h('div', { className: 'flex flex-wrap gap-1' },
                          ...(project.project_type || []).map((type, i) =>
                            h('span', {
                              key: i,
                              className: 'px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs'
                            }, type)
                          ),
                          (!project.project_type || project.project_type.length === 0) &&
                            h('span', { className: 'text-gray-400 text-sm' }, 'None')
                        )
                      ),
                      h('td', { className: 'px-4 py-3 text-sm text-gray-700' },
                        project.framework_details?.web_framework || 
                        project.framework_details?.java_framework || 
                        '-'
                      ),
                      h('td', { className: 'px-4 py-3 text-center' },
                        project.has_ui 
                          ? h('span', { className: 'inline-flex h-2 w-2 bg-green-500 rounded-full' })
                          : h('span', { className: 'inline-flex h-2 w-2 bg-gray-300 rounded-full' })
                      ),
                      h('td', { className: 'px-4 py-3 text-center' },
                        project.has_api 
                          ? h('span', { className: 'inline-flex h-2 w-2 bg-green-500 rounded-full' })
                          : h('span', { className: 'inline-flex h-2 w-2 bg-gray-300 rounded-full' })
                      ),
                      h('td', { className: 'px-4 py-3' },
                        h('div', { className: 'flex flex-wrap gap-1' },
                          ...(project.database_config || []).slice(0, 2).map((db, i) =>
                            h('span', {
                              key: i,
                              className: 'px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs'
                            }, db)
                          ),
                          (project.database_config || []).length > 2 &&
                            h('span', {
                              className: 'px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs'
                            }, '+' + ((project.database_config || []).length - 2)),
                          (!project.database_config || project.database_config.length === 0) &&
                            h('span', { className: 'text-gray-400 text-sm' }, '-')
                        )
                      ),
                      h('td', { className: 'px-4 py-3 text-center font-medium text-gray-700' },
                        (project.libraries || []).length
                      ),
                      h('td', { className: 'px-4 py-3 text-center font-medium text-gray-700' }, totalFiles),
                      h('td', { className: 'px-4 py-3 text-center' },
                        h('button', {
                          onClick: () => toggleRowExpansion(project.project_name),
                          className: 'p-1 hover:bg-gray-200 rounded transition-colors'
                        },
                          isExpanded
                            ? h(Icon, { name: 'ChevronUp', className: 'h-4 w-4 text-gray-600' })
                            : h(Icon, { name: 'Eye', className: 'h-4 w-4 text-gray-600' })
                        )
                      )
                    ),
                    isExpanded && h('tr', null,
                      h('td', { colSpan: 9, className: 'px-4 py-4 bg-gray-50 border-b' },
                        h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' },
                          Object.keys(project.versions || {}).length > 0 && h('div', { className: 'bg-white p-3 rounded border' },
                            h('h4', { className: 'font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1' },
                              h(Icon, { name: 'Package', className: 'h-3 w-3' }),
                              'Version Info'
                            ),
                            h('div', { className: 'space-y-1' },
                              ...Object.entries(project.versions || {}).map(([key, value]) =>
                                h('div', { key, className: 'text-xs' },
                                  h('span', { className: 'text-gray-500 capitalize' },
                                    key.replace(/_/g, ' '), ': '
                                  ),
                                  h('span', { className: 'text-gray-700 font-mono' },
                                    Array.isArray(value) ? value.join(', ') : String(value)
                                  )
                                )
                              )
                            )
                          ),
                          Object.keys(project.framework_details || {}).length > 0 && h('div', { className: 'bg-white p-3 rounded border' },
                            h('h4', { className: 'font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1' },
                              h(Icon, { name: 'Code', className: 'h-3 w-3' }),
                              'Framework Details'
                            ),
                            h('div', { className: 'space-y-1' },
                              ...Object.entries(project.framework_details || {}).map(([key, value]) =>
                                h('div', { key, className: 'text-xs' },
                                  h('span', { className: 'text-gray-500 capitalize' },
                                    key.replace(/_/g, ' '), ': '
                                  ),
                                  h('span', { className: 'text-gray-700' },
                                    typeof value === 'boolean' 
                                      ? (value ? 'Yes' : 'No') 
                                      : Array.isArray(value) 
                                        ? value.join(', ') 
                                        : (value || 'N/A')
                                  )
                                )
                              )
                            )
                          ),
                          (project.unique_extensions || []).length > 0 && h('div', { className: 'bg-white p-3 rounded border' },
                            h('h4', { className: 'font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1' },
                              h(Icon, { name: 'FileText', className: 'h-3 w-3' }),
                              'File Extensions (', (project.unique_extensions || []).length, ')'
                            ),
                            h('div', { className: 'flex flex-wrap gap-1 max-h-24 overflow-y-auto' },
                              ...(project.unique_extensions || []).map((ext, i) =>
                                h('span', {
                                  key: i,
                                  className: 'px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-mono'
                                }, ext)
                              )
                            )
                          ),
                          h('div', { className: 'bg-white p-3 rounded border' },
                            h('h4', { className: 'font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1' },
                              h(Icon, { name: 'BarChart3', className: 'h-3 w-3' }),
                              'File Composition'
                            ),
                            h('div', { className: 'space-y-1 max-h-32 overflow-y-auto' },
                              ...Object.entries(project.file_composition || {})
                                .sort(([, a], [, b]) => b - a)
                                .map(([type, count]) =>
                                  h('div', { key: type, className: 'text-xs flex justify-between' },
                                    h('span', { className: 'text-gray-500 capitalize' }, type, ':'),
                                    h('span', { className: 'text-gray-700 font-medium' }, count)
                                  )
                                )
                            )
                          ),
                          (project.libraries || []).length > 0 && h('div', { className: 'bg-white p-3 rounded border' },
                            h('h4', { className: 'font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1' },
                              h(Icon, { name: 'Package', className: 'h-3 w-3' }),
                              'Libraries (', (project.libraries || []).length, ')'
                            ),
                            h('div', { className: 'space-y-1 max-h-32 overflow-y-auto' },
                              ...(project.libraries || []).map((lib, i) =>
                                h('div', { key: i, className: 'text-xs text-gray-700 font-mono break-all', title: lib }, lib)
                              )
                            )
                          ),
                          (project.database_config || []).length > 0 && h('div', { className: 'bg-white p-3 rounded border' },
                            h('h4', { className: 'font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1' },
                              h(Icon, { name: 'Database', className: 'h-3 w-3' }),
                              'Database Config'
                            ),
                            h('div', { className: 'flex flex-wrap gap-1' },
                              ...(project.database_config || []).map((db, i) =>
                                h('span', {
                                  key: i,
                                  className: 'px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs'
                                }, db)
                              )
                            )
                          ),
                          (project.third_party_connectivity || []).length > 0 && h('div', { className: 'bg-white p-3 rounded border' },
                            h('h4', { className: 'font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1' },
                              h(Icon, { name: 'GitBranch', className: 'h-3 w-3' }),
                              'Third Party APIs (', (project.third_party_connectivity || []).length, ')'
                            ),
                            h('div', { className: 'space-y-1 max-h-32 overflow-y-auto' },
                              ...(project.third_party_connectivity || []).map((api, i) =>
                                h('div', { key: i, className: 'text-xs text-gray-700 font-mono break-all', title: api }, api)
                              )
                            )
                          ),
                          (project.build_system || []).length > 0 && h('div', { className: 'bg-white p-3 rounded border' },
                            h('h4', { className: 'font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1' },
                              h(Icon, { name: 'Package', className: 'h-3 w-3' }),
                              'Build System'
                            ),
                            h('div', { className: 'flex flex-wrap gap-1' },
                              ...(project.build_system || []).map((bs, i) =>
                                h('span', {
                                  key: i,
                                  className: 'px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs'
                                }, bs)
                              )
                            )
                          ),
                          (project.integration_patterns || []).length > 0 && h('div', { className: 'bg-white p-3 rounded border' },
                            h('h4', { className: 'font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1' },
                              h(Icon, { name: 'GitBranch', className: 'h-3 w-3' }),
                              'Integration Patterns (', (project.integration_patterns || []).length, ')'
                            ),
                            h('div', { className: 'space-y-2 max-h-32 overflow-y-auto' },
                              ...(project.integration_patterns || []).map((pattern, i) =>
                                h('div', { key: i, className: 'text-xs border-l-2 border-yellow-200 pl-2' },
                                  h('div', { className: 'flex items-center gap-1 mb-1' },
                                    h('span', {
                                      className: 'px-1 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs'
                                    }, pattern.type)
                                  ),
                                  h('div', { className: 'text-gray-600 font-mono break-all mb-1', title: pattern.url }, pattern.url),
                                  h('div', { className: 'text-gray-550 break-all', title: pattern.source_file },
                                    '→ ', pattern.source_file
                                  )
                                )
                              )
                            )
                          ),
                          Object.keys(project.additional_info || {}).length > 0 && h('div', { className: 'bg-white p-3 rounded border' },
                            h('h4', { className: 'font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1' },
                              h(Icon, { name: 'FileText', className: 'h-3 w-3' }),
                              'Additional Info'
                            ),
                            h('div', { className: 'space-y-1' },
                              ...Object.entries(project.additional_info || {}).map(([key, value]) =>
                                h('div', { key, className: 'text-xs' },
                                  h('span', { className: 'text-gray-500 capitalize' },
                                    key.replace(/_/g, ' '), ': '
                                  ),
                                  h('span', { className: 'text-gray-700' },
                                    Array.isArray(value) 
                                      ? h('div', { className: 'mt-1 flex flex-wrap gap-1' },
                                          ...value.map((item, i) =>
                                            h('span', {
                                              key: i,
                                              className: 'px-1 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono'
                                            }, item)
                                          )
                                        )
                                      : String(value)
                                  )
                                )
                              )
                            )
                          ),
                        )
                      )
                    )
                  );
                })
              )
            )
          ),
          filteredProjects.length === 0 && h('div', { className: 'text-center py-12' },
            h('p', { className: 'text-gray-500' }, 'No projects found matching your criteria')
          )
        ),
        viewMode === 'card' && h('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' },
          ...filteredProjects.map((project) => {
            const totalFiles = Object.values(project.file_composition || {}).reduce((sum, count) => sum + count, 0);
            return h('div', {
              key: project.project_name,
              className: 'bg-white rounded-lg shadow hover:shadow-lg transition-shadow'
            },
              h('div', { className: 'p-4' },
                h('h3', {
                  className: 'font-semibold text-gray-900 mb-2 truncate',
                  title: project.project_name
                }, project.project_name),
                h('div', { className: 'space-y-2 text-sm' },
                  h('div', { className: 'flex flex-wrap gap-1 mb-2' },
                    ...(project.project_type || []).map((type, i) =>
                      h('span', {
                        key: i,
                        className: 'px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs'
                      }, type)
                    )
                  ),
                  project.framework_details?.web_framework && h('div', { className: 'text-gray-600' },
                    h('span', { className: 'font-medium' }, 'Framework: '),
                    project.framework_details.web_framework
                  ),
                  h('div', { className: 'flex justify-between' },
                    h('span', { className: 'text-gray-600' }, 'Files:'),
                    h('span', { className: 'font-medium' }, totalFiles)
                  ),
                  h('div', { className: 'flex justify-between' },
                    h('span', { className: 'text-gray-600' }, 'Libraries:'),
                    h('span', { className: 'font-medium' }, (project.libraries || []).length)
                  ),
                  h('div', { className: 'flex gap-4 pt-2' },
                    h('div', { className: 'flex items-center gap-1' },
                      h(Icon, { name: 'Code', className: 'h-3 w-3 text-gray-400' }),
                      h('span', {
                        className: project.has_ui ? 'text-green-600' : 'text-gray-400'
                      }, 'UI')
                    ),
                    h('div', { className: 'flex items-center gap-1' },
                      h(Icon, { name: 'GitBranch', className: 'h-3 w-3 text-gray-400' }),
                      h('span', {
                        className: project.has_api ? 'text-green-600' : 'text-gray-400'
                      }, 'API')
                    )
                  ),
                  (project.database_config || []).length > 0 && h('div', { className: 'pt-2 flex flex-wrap gap-1' },
                    ...(project.database_config || []).slice(0, 2).map((db, i) =>
                      h('span', {
                        key: i,
                        className: 'px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs'
                      }, db)
                    ),
                    (project.database_config || []).length > 2 &&
                      h('span', {
                        className: 'px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs'
                      }, '+' + ((project.database_config || []).length - 2))
                  )
                )
              )
            );
          })
        )
      );
    };

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(h(CodebaseAnalyzer));
  </script>
  <footer class="footer">
    <div style="display: flex; align-items: center; justify-content: flex-end;">
        ${logoImgTag}
      </div>
  </footer>
</body>
</html>`

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const CodebaseAnalyzer: React.FC<{ data: CodebaseAnalysis }> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table')
  const [sortField, setSortField] = useState<string>('project_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showStats, setShowStats] = useState(true)
  const [showIntegrationView, setShowIntegrationView] = useState(false)

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    let filtered = data.projects

    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.project_type.includes(filterType))
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.project_type.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.framework_details.web_framework?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    filtered = [...filtered].sort((a, b) => {
      let aVal: string | number | boolean, bVal: string | number | boolean

      switch (sortField) {
        case 'project_name':
          aVal = a.project_name
          bVal = b.project_name
          break
        case 'type':
          aVal = a.project_type.join(', ')
          bVal = b.project_type.join(', ')
          break
        case 'framework':
          aVal = a.framework_details.web_framework || ''
          bVal = b.framework_details.web_framework || ''
          break
        case 'has_ui':
          aVal = a.has_ui
          bVal = b.has_ui
          break
        case 'has_api':
          aVal = a.has_api
          bVal = b.has_api
          break
        case 'libraries':
          aVal = a.libraries.length
          bVal = b.libraries.length
          break
        case 'files':
          aVal = Object.values(a.file_composition).reduce((sum, count) => sum + count, 0)
          bVal = Object.values(b.file_composition).reduce((sum, count) => sum + count, 0)
          break
        default:
          aVal = a.project_name
          bVal = b.project_name
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [data.projects, searchTerm, filterType, sortField, sortDirection])

  const projectTypes = useMemo(() => {
    const types = new Set<string>()
    for (const p of data.projects) {
      for (const t of p.project_type) {
        types.add(t)
      }
    }
    return Array.from(types).sort()
  }, [data.projects])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleRowExpansion = (projectName: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(projectName)) {
      newExpanded.delete(projectName)
    } else {
      newExpanded.add(projectName)
    }
    setExpandedRows(newExpanded)
  }

  const calculateStats = (projects: Project[]) => {
    const stats = {
      totalProjects: projects.length,
      hasUI: projects.filter(p => p.has_ui).length,
      hasAPI: projects.filter(p => p.has_api).length,
      totalFiles: projects.reduce((sum, p) => 
        sum + Object.values(p.file_composition).reduce((a, b) => a + b, 0), 0
      )
    }
    return stats
  }

  const stats = useMemo(() => calculateStats(filteredProjects), [filteredProjects])

  // Added internal scroll wrapper for Electron integration
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-8 rounded-lg mb-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-2 font-sans">The Lifter Codebase Analysis</h1>
        <div className="mt-4 flex gap-6 text-sm">
          <span>Analysis Date: {data.analysis_timestamp}</span>
          <span>Total Projects: {data.total_projects}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects, types, or frameworks..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {projectTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                viewMode === 'table' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Table className="h-4 w-4" />
              Table View
            </button>

            <button
              onClick={() => setViewMode('card')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                viewMode === 'card' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
              Card View
            </button>

            <button
              onClick={() => exportToExcel(filteredProjects, 'rmic_codebase_analysis')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export to Excel
            </button>

            <button
              onClick={() => exportToHTML(data, {
                searchTerm,
                filterType,
                viewMode,
                sortField,
                sortDirection,
                expandedRows,
                showStats
              })}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              Export HTML
            </button>

            <button
              onClick={() => setShowIntegrationView(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Network className="h-4 w-4" />
              Integration View
            </button>

            <button
              onClick={() => setShowStats(!showStats)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {showStats ? 'Hide' : 'Show'} Stats
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Projects</p>
                <p className="text-2xl font-bold text-gray-900 font-sans">{stats.totalProjects}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With UI</p>
                <p className="text-2xl font-bold text-gray-900 font-sans">{stats.hasUI}</p>
              </div>
              <Code className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With API</p>
                <p className="text-2xl font-bold text-gray-900 font-sans">{stats.hasAPI}</p>
              </div>
              <GitBranch className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Files</p>
                <p className="text-2xl font-bold text-gray-900 font-sans">{stats.totalFiles.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button className="font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1 font-sans" onClick={() => handleSort('project_name')}>
                      Project Name
                      {sortField === 'project_name' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1 font-sans" onClick={() => handleSort('type')}>
                      Type
                      {sortField === 'type' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1 font-sans" onClick={() => handleSort('framework')}>
                      Framework
                      {sortField === 'framework' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center font-sans">
                    <button className="font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1 font-sans" onClick={() => handleSort('has_ui')}>
                      UI
                      {sortField === 'has_ui' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center font-sans">
                    <button className="font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1 font-sans" onClick={() => handleSort('has_api')}>
                      API
                      {sortField === 'has_api' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-sans">Database</th>
                  <th className="px-4 py-3 text-center font-sans">
                    <button className="font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1 font-sans" onClick={() => handleSort('libraries')}>
                      Libraries
                      {sortField === 'libraries' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center font-sans">
                    <button className="font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1 font-sans" onClick={() => handleSort('files')}>
                      Files
                      {sortField === 'files' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center font-sans">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project, idx) => {
                  const totalFiles = Object.values(project.file_composition).reduce((sum, count) => sum + count, 0)
                  const isExpanded = expandedRows.has(project.project_name)

                  return (
                    <React.Fragment key={project.project_name}>
                      <tr className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {project.project_name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {project.project_type.map((type, i) => (
                              <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                {type}
                              </span>
                            ))}
                            {project.project_type.length === 0 && (
                              <span className="text-gray-400 text-sm">None</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {project.framework_details.web_framework || 
                           project.framework_details.java_framework || 
                           '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {project.has_ui ? (
                            <span className="inline-flex h-2 w-2 bg-green-500 rounded-full"></span>
                          ) : (
                            <span className="inline-flex h-2 w-2 bg-gray-300 rounded-full"></span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {project.has_api ? (
                            <span className="inline-flex h-2 w-2 bg-green-500 rounded-full"></span>
                          ) : (
                            <span className="inline-flex h-2 w-2 bg-gray-300 rounded-full"></span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {project.database_config.slice(0, 2).map((db, i) => (
                              <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-sans">
                                {db}
                              </span>
                            ))}
                            {project.database_config.length > 2 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-sans">
                                +{project.database_config.length - 2}
                              </span>
                            )}
                            {project.database_config.length === 0 && (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-700">
                          {project.libraries.length}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-700 font-sans">
                          {totalFiles}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleRowExpansion(project.project_name)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-600" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="px-4 py-4 bg-gray-50 border-b">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                              {/* Version Info */}
                              {Object.keys(project.versions).length > 0 && (
                                <div className="bg-white p-3 rounded border">
                                  <h4 className="font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1 font-sans">
                                    <Package className="h-3 w-3" />
                                    Version Info
                                  </h4>
                                  <div className="space-y-1">
                                    {Object.entries(project.versions).map(([key, value]) => (
                                      <div key={key} className="text-xs">
                                        <span className="text-gray-500 capitalize font-sans">{key.replace(/_/g, ' ')}: </span>
                                        <span className="text-gray-700 font-mono">
                                          {Array.isArray(value) ? value.join(', ') : value}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Framework Details */}
                              {Object.keys(project.framework_details).length > 0 && (
                                <div className="bg-white p-3 rounded border">
                                  <h4 className="font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1 font-sans">
                                    <Code className="h-3 w-3" />
                                    Framework Details
                                  </h4>
                                  <div className="space-y-1">
                                    {Object.entries(project.framework_details).map(([key, value]) => (
                                      <div key={key} className="text-xs">
                                        <span className="text-gray-500 capitalize font-sans">{key.replace(/_/g, ' ')}: </span>
                                        <span className="text-gray-700">
                                          {typeof value === 'boolean' 
                                            ? (value ? 'Yes' : 'No') 
                                            : Array.isArray(value) 
                                              ? value.join(', ') 
                                              : value || 'N/A'
                                          }
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Unique Extensions */}
                              {project.unique_extensions.length > 0 && (
                                <div className="bg-white p-3 rounded border">
                                  <h4 className="font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1 font-sans">
                                    <FileText className="h-3 w-3" />
                                    File Extensions ({project.unique_extensions.length})
                                  </h4>
                                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                    {project.unique_extensions.map((ext, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-mono">
                                        {ext}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* File Composition */}
                              <div className="bg-white p-3 rounded border">
                                <h4 className="font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1 font-sans">
                                  <BarChart3 className="h-3 w-3" />
                                  File Composition
                                </h4>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {Object.entries(project.file_composition)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([type, count]) => (
                                      <div key={type} className="text-xs flex justify-between">
                                        <span className="text-gray-500 capitalize font-sans">{type}:</span>
                                        <span className="text-gray-700 font-medium font-sans">{count}</span>
                                      </div>
                                    ))}
                                </div>
                              </div>

                              {/* Libraries */}
                              {project.libraries.length > 0 && (
                                <div className="bg-white p-3 rounded border">
                                  <h4 className="font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1 font-sans">
                                    <Package className="h-3 w-3" />
                                    Libraries ({project.libraries.length})
                                  </h4>
                                  <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {project.libraries.map((lib, i) => (
                                      <div key={i} className="text-xs text-gray-700 font-mono break-all" title={lib}>
                                        {lib}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Database Configuration */}
                              {project.database_config.length > 0 && (
                                <div className="bg-white p-3 rounded border">
                                  <h4 className="font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1 font-sans">
                                    <Database className="h-3 w-3" />
                                    Database Config
                                  </h4>
                                  <div className="flex flex-wrap gap-1">
                                    {project.database_config.map((db, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-sans">
                                        {db}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Third Party Connectivity */}
                              {project.third_party_connectivity.length > 0 && (
                                <div className="bg-white p-3 rounded border">
                                  <h4 className="font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1 font-sans">
                                    <GitBranch className="h-3 w-3" />
                                    Third Party APIs ({project.third_party_connectivity.length})
                                  </h4>
                                  <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {project.third_party_connectivity.map((api, i) => (
                                      <div key={i} className="text-xs text-gray-700 font-mono break-all" title={api}>
                                        {api}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Build System */}
                              {project.build_system.length > 0 && (
                                <div className="bg-white p-3 rounded border">
                                  <h4 className="font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1 font-sans">
                                    <Package className="h-3 w-3" />
                                    Build System
                                  </h4>
                                  <div className="flex flex-wrap gap-1">
                                    {project.build_system.map((bs, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-sans">{bs}</span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Integration Patterns */}
                              {project.integration_patterns.length > 0 && (
                                <div className="bg-white p-3 rounded border animate-fade-in">
                                  <h4 className="font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1 font-sans">
                                    <GitBranch className="h-3 w-3" />
                                    Integration Patterns ({project.integration_patterns.length})
                                  </h4>
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {project.integration_patterns.map((pattern, i) => (
                                      <div key={i} className="text-xs border-l-2 border-yellow-200 pl-2">
                                        <div className="flex items-center gap-1 mb-1">
                                          <span className="px-1 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-sans">
                                            {pattern.type}
                                          </span>
                                        </div>
                                        <div className="text-gray-600 font-mono break-all mb-1 font-sans" title={pattern.url}>
                                          {pattern.url}
                                        </div>
                                        <div className="text-gray-500 break-all font-sans" title={pattern.source_file}>
                                          → {pattern.source_file}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Additional Info */}
                              {Object.keys(project.additional_info).length > 0 && (
                                <div className="bg-white p-3 rounded border font-sans">
                                  <h4 className="font-semibold text-sm mb-2 text-gray-700 flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    Additional Info
                                  </h4>
                                  <div className="space-y-1">
                                    {Object.entries(project.additional_info).map(([key, value]) => (
                                      <div key={key} className="text-xs">
                                        <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}: </span>
                                        <span className="text-gray-700">
                                          {Array.isArray(value) ? (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                              {(value as string[]).map((item, i) => (
                                                <span key={i} className="px-1 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                                                  {item}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            value
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Project Path */}
                              <div className="bg-white p-3 rounded border lg:col-span-full">
                                <h4 className="font-semibold text-sm mb-1 text-gray-700 flex items-center gap-1 font-sans">
                                  <FolderOpen className="h-3 w-3" />
                                  Project Path
                                </h4>
                                <div className="text-xs text-gray-600 font-mono break-all bg-gray-50 p-2 rounded">
                                  {project.project_path}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 font-sans">No projects found matching your criteria</p>
            </div>
          )}
        </div>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProjects.map((project) => {
            const totalFiles = Object.values(project.file_composition).reduce((sum, count) => sum + count, 0)
            
            return (
              <div key={project.project_name} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 truncate" title={project.project_name}>
                    {project.project_name}
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {project.project_type.map((type, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {type}
                        </span>
                      ))}
                    </div>
                    
                    {project.framework_details.web_framework && (
                      <div className="text-gray-600">
                        <span className="font-medium">Framework:</span> {project.framework_details.web_framework}
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-sans">Files:</span>
                      <span className="font-medium font-sans">{totalFiles}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-sans">Libraries:</span>
                      <span className="font-medium font-sans">{project.libraries.length}</span>
                    </div>
                    
                    <div className="flex gap-4 pt-2">
                      <div className="flex items-center gap-1">
                        <Code className="h-3 w-3 text-gray-400" />
                        <span className={project.has_ui ? 'text-green-600 font-sans' : 'text-gray-400 font-sans'}>
                          UI
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3 text-gray-400" />
                        <span className={project.has_api ? 'text-green-600 font-sans' : 'text-gray-400 font-sans'}>
                          API
                        </span>
                      </div>
                    </div>
                    
                    {project.database_config.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1">
                        {project.database_config.slice(0, 2).map((db, i) => (
                          <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-sans font-medium">
                            {db}
                          </span>
                        ))}
                        {project.database_config.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-sans">
                            +{project.database_config.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Integration Details View Modal */}
      {showIntegrationView && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg flex-shrink-0">
              <h2 className="text-xl font-bold font-sans">Integration Details View</h2>
              <button
                onClick={() => setShowIntegrationView(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <IntegrationDetailsView data={data} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodebaseAnalyzer
