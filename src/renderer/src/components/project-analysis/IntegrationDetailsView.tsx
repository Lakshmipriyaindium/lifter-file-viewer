// components/project-analysis/IntegrationDetailsView.tsx
import React, { useState, useMemo } from 'react'
import { 
  Search, Code, GitBranch, FileText, 
  ChevronDown, Filter, BarChart3, 
  FolderOpen, Table, Grid3x3, Download, ChevronUp, Eye,
  Server, Globe, AlertTriangle, Activity, ExternalLink
} from 'lucide-react'

// Use the same interfaces as CodebaseAnalyzer
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

function formatFrameworkDetailValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
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

export interface IntegrationDetailsViewProps {
  data: CodebaseAnalysis
}

// Utility function to export integration details to CSV
const exportIntegrationDetails = (projects: Project[], filename: string = 'integration_details'): void => {
  const headers = [
    'Project Name',
    'Project Path',
    'Project Types',
    'Integration Type',
    'Integration URL',
    'Source File',
    'Has UI',
    'Has API',
    'Database Config',
    'Third Party Connectivity',
    'Libraries Count',
    'Build System',
    'Framework',
    'Total Files'
  ]

  const rows: string[][] = []
  
  for (const project of projects) {
    const totalFiles = Object.values(project.file_composition).reduce((sum, count) => sum + count, 0)
    
    if (project.integration_patterns.length > 0) {
      for (const pattern of project.integration_patterns) {
        rows.push([
          project.project_name,
          project.project_path,
          project.project_type.join('; '),
          pattern.type,
          pattern.url,
          pattern.source_file,
          project.has_ui ? 'Yes' : 'No',
          project.has_api ? 'Yes' : 'No',
          project.database_config.join('; '),
          project.third_party_connectivity.join('; '),
          project.libraries.length.toString(),
          project.build_system.join('; '),
          project.framework_details.web_framework || project.framework_details.java_framework || 'N/A',
          totalFiles.toString()
        ])
      }
    } else {
      // Include projects without integration patterns
      rows.push([
        project.project_name,
        project.project_path,
        project.project_type.join('; '),
        'No Integrations',
        '',
        '',
        project.has_ui ? 'Yes' : 'No',
        project.has_api ? 'Yes' : 'No',
        project.database_config.join('; '),
        project.third_party_connectivity.join('; '),
        project.libraries.length.toString(),
        project.build_system.join('; '),
        project.framework_details.web_framework || project.framework_details.java_framework || 'N/A',
        totalFiles.toString()
      ])
    }
  }

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

// Export Summary Interface
interface ExportSummary {
  metadata: {
    analysis_timestamp: string
    root_folder: string
    total_projects: number
    export_timestamp: string
  }
  integration_summary: {
    total_projects_with_integrations: number
    total_integration_patterns: number
    integration_types: string[]
    projects_with_third_party: number
  }
  projects_summary: Array<{
    project_name: string
    project_type: string[]
    integration_count: number
    integration_types: string[]
    has_ui: boolean
    has_api: boolean
    database_connections: number
    third_party_connections: number
    framework: string
    libraries_count: number
  }>
}

// Utility function to export integration summary to JSON
const exportIntegrationSummary = (data: CodebaseAnalysis, filename: string = 'integration_summary'): void => {
  const summaryData: ExportSummary = {
    metadata: {
      analysis_timestamp: data.analysis_timestamp,
      root_folder: data.root_folder,
      total_projects: data.total_projects,
      export_timestamp: new Date().toISOString()
    },
    integration_summary: {
      total_projects_with_integrations: data.projects.filter(p => p.integration_patterns.length > 0).length,
      total_integration_patterns: data.projects.reduce((sum, p) => sum + p.integration_patterns.length, 0),
      integration_types: [...new Set(data.projects.flatMap(p => p.integration_patterns.map(i => i.type)))],
      projects_with_third_party: data.projects.filter(p => p.third_party_connectivity.length > 0).length
    },
    projects_summary: data.projects.map(project => ({
      project_name: project.project_name,
      project_type: project.project_type,
      integration_count: project.integration_patterns.length,
      integration_types: [...new Set(project.integration_patterns.map(p => p.type))],
      has_ui: project.has_ui,
      has_api: project.has_api,
      database_connections: project.database_config.length,
      third_party_connections: project.third_party_connectivity.length,
      framework: project.framework_details.web_framework || project.framework_details.java_framework || 'Unknown',
      libraries_count: project.libraries.length
    }))
  }

  const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const IntegrationDetailsView: React.FC<IntegrationDetailsViewProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterHasIntegrations, setFilterHasIntegrations] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table')
  const [sortField, setSortField] = useState<string>('project_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showStats, setShowStats] = useState(true)

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    let filtered = data.projects

    // Apply integration type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(project => 
        project.integration_patterns.some((p: IntegrationPattern) => p.type === filterType)
      )
    }

    // Apply integration existence filter
    if (filterHasIntegrations === 'with_integrations') {
      filtered = filtered.filter(project => project.integration_patterns.length > 0)
    } else if (filterHasIntegrations === 'without_integrations') {
      filtered = filtered.filter(project => project.integration_patterns.length === 0)
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.project_type.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
        project.integration_patterns.some((p: IntegrationPattern) => 
          p.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.url.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        project.framework_details.web_framework?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.framework_details.java_framework?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aVal: string | number
      let bVal: string | number

      switch (sortField) {
        case 'project_name':
          aVal = a.project_name
          bVal = b.project_name
          break
        case 'integrations_count':
          aVal = a.integration_patterns.length
          bVal = b.integration_patterns.length
          break
        case 'type':
          aVal = a.project_type.join(', ')
          bVal = b.project_type.join(', ')
          break
        case 'framework':
          aVal = a.framework_details.web_framework || a.framework_details.java_framework || ''
          bVal = b.framework_details.web_framework || b.framework_details.java_framework || ''
          break
        case 'third_party_count':
          aVal = a.third_party_connectivity.length
          bVal = b.third_party_connectivity.length
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
  }, [data.projects, searchTerm, filterType, filterHasIntegrations, sortField, sortDirection])

  // Get unique integration types for filter
  const integrationTypes = useMemo(() => {
    const types = new Set<string>()
    for (const project of data.projects) {
      for (const p of project.integration_patterns) {
        types.add(p.type)
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
    return {
      totalProjects: projects.length,
      projectsWithIntegrations: projects.filter(p => p.integration_patterns.length > 0).length,
      totalIntegrations: projects.reduce((sum, p) => sum + p.integration_patterns.length, 0),
      projectsWithThirdParty: projects.filter(p => p.third_party_connectivity.length > 0).length,
      uniqueIntegrationTypes: new Set(
        projects.flatMap(p => p.integration_patterns.map((pattern: IntegrationPattern) => pattern.type))
      ).size
    }
  }

  const stats = useMemo(() => calculateStats(filteredProjects), [filteredProjects])

  return (
    <div className="bg-gray-50 p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-8 rounded-lg mb-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Integration Patterns Analysis</h1>
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
                placeholder="Search applications, integrations, protocols..."
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
              {integrationTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={filterHasIntegrations}
            onChange={(e) => setFilterHasIntegrations(e.target.value)}
          >
            <option value="all">All Projects</option>
            <option value="with_integrations">With Integrations</option>
            <option value="without_integrations">Without Integrations</option>
          </select>

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
              Table
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
              Cards
            </button>

            <button
              onClick={() => exportIntegrationDetails(filteredProjects)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>

            <button
              onClick={() => exportIntegrationSummary(data)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>

            <button
              onClick={() => setShowStats(!showStats)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {showStats ? 'Hide' : 'Show'} Stats
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Integrations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.projectsWithIntegrations}</p>
              </div>
              <GitBranch className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Integrations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalIntegrations}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Third Party</p>
                <p className="text-2xl font-bold text-gray-900">{stats.projectsWithThirdParty}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Integration Types</p>
                <p className="text-2xl font-bold text-gray-900">{stats.uniqueIntegrationTypes}</p>
              </div>
              <Globe className="h-8 w-8 text-purple-500" />
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
                    <button className="font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1" onClick={() => handleSort('project_name')}>
                      Project Name
                      {sortField === 'project_name' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1" onClick={() => handleSort('type')}>
                      Type
                      {sortField === 'type' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">
                    <button className="font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1" onClick={() => handleSort('integrations_count')}>
                      Integrations
                      {sortField === 'integrations_count' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1" onClick={() => handleSort('framework')}>
                      Framework
                      {sortField === 'framework' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">UI/API</th>
                  <th className="px-4 py-3 text-center">
                    <button className="font-medium text-gray-900 hover:text-orange-600 flex items-center gap-1" onClick={() => handleSort('third_party_count')}>
                      3rd Party
                      {sortField === 'third_party_count' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Database</th>
                  <th className="px-4 py-3 text-center">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project, idx) => {
                  const isExpanded = expandedRows.has(project.project_name)
                  const totalFiles = Object.values(project.file_composition).reduce((sum, count) => sum + count, 0)

                  return (
                    <React.Fragment key={project.project_name}>
                      <tr className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3 font-medium text-gray-900 font-sans">
                          {project.project_name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {project.project_type.slice(0, 2).map((type: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                {type}
                              </span>
                            ))}
                            {project.project_type.length > 2 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                +{project.project_type.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-lg text-gray-900">{project.integration_patterns.length}</span>
                            {project.integration_patterns.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 justify-center">
                                {[...new Set(project.integration_patterns.map((p: IntegrationPattern) => p.type))].slice(0, 2).map((type: string, i: number) => (
                                  <span key={i} className="px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                    {type}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {project.framework_details.web_framework || 
                           project.framework_details.java_framework ||
                           (project.framework_details.dotnet_style ? '.NET' : '') ||
                           'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            {project.has_ui && <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">UI</span>}
                            {project.has_api && <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">API</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-700">
                          {project.third_party_connectivity.length}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {project.database_config.slice(0, 2).map((db: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-sans">
                                {db}
                              </span>
                            ))}
                            {project.database_config.length > 2 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                +{project.database_config.length - 2}
                              </span>
                            )}
                            {project.database_config.length === 0 && (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </div>
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
                          <td colSpan={8} className="px-4 py-6 bg-gray-50 border-b">
                            <div className="space-y-6">
                              {/* Project Info */}
                              <div className="bg-white p-4 rounded-lg border">
                                <h4 className="font-semibold text-lg mb-3 text-gray-800 flex items-center gap-2">
                                  <Server className="h-5 w-5 text-orange-500" />
                                  Project Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">Path</p>
                                    <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">{project.project_path}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Files</p>
                                    <p className="text-lg font-semibold text-gray-900">{totalFiles.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">Libraries ({project.libraries.length})</p>
                                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                      {project.libraries.slice(0, 5).map((lib: string, i: number) => (
                                        <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">{lib}</span>
                                      ))}
                                      {project.libraries.length > 5 && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                          +{project.libraries.length - 5} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Integration Patterns */}
                              {project.integration_patterns.length > 0 && (
                                <div className="bg-white p-4 rounded-lg border">
                                  <h4 className="font-semibold text-lg mb-3 text-gray-800 flex items-center gap-2">
                                    <GitBranch className="h-5 w-5 text-blue-500" />
                                    Integration Patterns ({project.integration_patterns.length})
                                  </h4>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {project.integration_patterns.map((pattern: IntegrationPattern, i: number) => (
                                      <div key={i} className="border rounded-lg p-4 hover:shadow-md transition-shadow animate-fade-in">
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex-1">
                                            <div className="flex flex-wrap gap-2 mb-2">
                                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{pattern.type}</span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                          <div>
                                            <p className="text-gray-600 font-sans">URL/Endpoint:</p>
                                            <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">{pattern.url}</p>
                                          </div>

                                          <div>
                                            <p className="text-gray-600 font-sans">Source File:</p>
                                            <p className="font-mono text-xs bg-gray-55 p-2 rounded break-all">{pattern.source_file}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Third Party Connectivity */}
                              {project.third_party_connectivity.length > 0 && (
                                <div className="bg-white p-4 rounded-lg border">
                                  <h4 className="font-semibold text-lg mb-3 text-gray-800 flex items-center gap-2">
                                    <ExternalLink className="h-5 w-5 text-green-500" />
                                    Third Party Connectivity ({project.third_party_connectivity.length})
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {project.third_party_connectivity.map((conn: string, i: number) => (
                                      <div key={i} className="p-3 bg-gray-50 rounded border">
                                        <p className="text-sm font-mono break-all">{conn}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Framework & Version Details */}
                              <div className="bg-white p-4 rounded-lg border">
                                <h4 className="font-semibold text-lg mb-3 text-gray-800 flex items-center gap-2">
                                  <Code className="h-5 w-5 text-purple-500" />
                                  Technical Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {/* Framework Details */}
                                  {Object.keys(project.framework_details).length > 0 && (
                                    <div>
                                      <p className="text-sm text-gray-600 mb-2">Framework Details:</p>
                                      <div className="space-y-1">
                                        {Object.entries(project.framework_details).map(([key, value]) => (
                                          value && (
                                            <div key={key} className="text-xs">
                                              <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}: </span>
                                              <span className="text-gray-700">
                                                {formatFrameworkDetailValue(value)}
                                              </span>
                                            </div>
                                          )
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Version Info */}
                                  {Object.keys(project.versions).length > 0 && (
                                    <div>
                                      <p className="text-sm text-gray-600 mb-2">Version Info:</p>
                                      <div className="space-y-1">
                                        {Object.entries(project.versions).map(([key, value]) => (
                                          value && (
                                            <div key={key} className="text-xs">
                                              <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}: </span>
                                              <span className="text-gray-700 font-mono">
                                                {Array.isArray(value) ? value.join(', ') : value}
                                              </span>
                                            </div>
                                          )
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Build System */}
                                  {project.build_system.length > 0 && (
                                    <div>
                                      <p className="text-sm text-gray-600 mb-2">Build System:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {project.build_system.map((bs: string, i: number) => (
                                          <span key={i} className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">{bs}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* File Composition */}
                              <div className="bg-white p-4 rounded-lg border">
                                <h4 className="font-semibold text-lg mb-3 text-gray-800 flex items-center gap-2">
                                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                                  File Composition
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                  {Object.entries(project.file_composition)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([type, count]) => (
                                      <div key={type} className="text-center p-3 bg-gray-50 rounded">
                                        <div className="text-lg font-semibold text-gray-900">{count}</div>
                                        <div className="text-sm text-gray-600 capitalize">{type}</div>
                                      </div>
                                    ))}
                                </div>
                              </div>

                              {/* Extensions */}
                              {project.unique_extensions.length > 0 && (
                                <div className="bg-white p-4 rounded-lg border">
                                  <h4 className="font-semibold text-lg mb-3 text-gray-800 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-gray-500" />
                                    File Extensions ({project.unique_extensions.length})
                                  </h4>
                                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                                    {project.unique_extensions.map((ext: string, i: number) => (
                                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                                        {ext}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const totalFiles = Object.values(project.file_composition).reduce((sum, count) => sum + count, 0)
            
            return (
              <div key={project.project_name} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2 truncate" title={project.project_name}>
                        {project.project_name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {project.project_type.map((type: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Integration Patterns:</span>
                      <span className="font-medium text-lg">{project.integration_patterns.length}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Third Party:</span>
                      <span className="font-medium text-orange-600">{project.third_party_connectivity.length}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Files:</span>
                      <span className="font-medium text-gray-700">{totalFiles.toLocaleString()}</span>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="flex justify-center gap-3 mb-3">
                        {project.has_ui && <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-sans">UI</span>}
                        {project.has_api && <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-sans">API</span>}
                      </div>

                      <div className="space-y-2">
                        {project.integration_patterns.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Integration Types:</p>
                            <div className="flex flex-wrap gap-1">
                              {[...new Set(project.integration_patterns.map((p: IntegrationPattern) => p.type))].slice(0, 3).map((type: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{type}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-gray-500 mb-1">Framework:</p>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {project.framework_details.web_framework || 
                             project.framework_details.java_framework ||
                             (project.framework_details.dotnet_style ? '.NET' : '') ||
                             'N/A'}
                          </span>
                        </div>

                        {project.database_config.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Database:</p>
                            <div className="flex flex-wrap gap-1">
                              {project.database_config.slice(0, 2).map((db: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{db}</span>
                              ))}
                              {project.database_config.length > 2 && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-sans">
                                  +{project.database_config.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default IntegrationDetailsView
