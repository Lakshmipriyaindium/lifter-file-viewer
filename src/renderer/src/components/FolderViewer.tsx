import React, { useState, useEffect, Component, useRef } from 'react';
import { determineChartType } from '../lib/utils';
import PlantUMLViewer from './plantuml/PlantUMLViewer';
import MermaidViewer from './MermaidViewer';
import TotalAnalysisVisualizer from './feature-analysis/TotalAnalysis';
import BusinessRulesVisualizer from './business-rule/BusinessRule';
import FlowGraphVisualizer from './flow/FlowGraphVisualizer';
import ClientCustomizationVisualizer from './client-customization/ClientCustomization';
import NodeAnalysisVisualizer from './client-customization/CustomizationByNode';
import KnowledgeGraphVisualizationV2 from './kg/KnowledgeGraphVisualizationV2';
import UserStoriesViewer from './user-stories/UserStoriesViewer';
import BusinessProcessViewer from './business-process/BusinessProcessViewer';
import ForceDirectedGraphChart from './d3-graph/ForceDirectedGraphChart';
import BusinessTermsVisualizer from './business-terms/BusinessTerms';
import ConsolidatedAnalysisViewer from './consolidated-analysis/ConsolidatedAnalysisViewer';
import LegacyVisualizer from './legacy-analysis/LegacyVisualizer';
import ComponentDistributionViewer from './component-distribution/ComponentDistributionViewer';
import SBOMViewer from './sbom/SBOMViewer';
import SecurityReportViewer from './security/SecurityReportViewer';
import ModuleAnalysisViz from './module-analysis/ModuleAnalysis';
import ProjectAnalysisDashboard from './project-analysis/ProjectAnalysisDashboard';
import CodebaseAnalyzer from './project-analysis/CodebaseAnalyzer';
import { ApiAnalysisVisualization } from './dotnet-api/DotNetAPIVisualizer';
import ProgramFlowView from './program-flow/ProgramFlowView';
import HierarchicalFeatureAnalysis from './feature-analysis/hierachy-feature';
import CapabilityModelViewer from './feature-analysis/CapabilityModelViewer';
import CrossRepoVisualizer from './cross-repo/CrossRepoVisualizer';
import FocusedAnalysis from './feature-analysis/FocusedAnalysis';
import BusinessMetricsAnalysis from './business-metrics/BusinessMetricsAnalysis';
import ConsolidatedBusinessReport from './consolidated-business/ConsolidatedBusinessReport';

interface ChartEBProps {
  onOpenInEditor: () => void;
  children: React.ReactNode;
}
interface ChartEBState {
  hasError: boolean;
}

class ChartErrorBoundary extends Component<ChartEBProps, ChartEBState> {
  constructor(props: ChartEBProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ChartEBState {
    return { hasError: true };
  }

  componentDidCatch(_error: unknown, _info: unknown) {
    // Gracefully catch any render crash from unmatched schemas
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
          <div className="text-5xl mb-4">📄</div>
          <h3 className="text-xl font-semibold mb-2">No Visualizer for this File Schema</h3>
          <p className="mb-6 max-w-md">This file does not match the expected data format for chart rendering. You can view or edit the raw content in the Editor.</p>
          <button 
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onOpenInEditor();
            }}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all"
          >
            Open in Editor
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Types for folder structure
interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  file?: File;
  size?: number;
}

export default function FolderViewer({ onBack }: { onBack: () => void }) {
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'files' | 'editor' | 'chart'>('chart');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-expand folders when searching
  useEffect(() => {
    if (!searchQuery) return;
    
    const foldersToExpand = new Set<string>(expandedFolders);
    const findFoldersToExpand = (nodes: FileNode[]) => {
      nodes.forEach(node => {
        if (node.isDirectory) {
          const hasMatchInDescendants = (n: FileNode): boolean => {
            if (n.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
            if (n.isDirectory && n.children) {
              return n.children.some(child => hasMatchInDescendants(child));
            }
            return false;
          };
          
          if (hasMatchInDescendants(node)) {
            foldersToExpand.add(node.path);
            if (node.children) findFoldersToExpand(node.children);
          }
        }
      });
    };
    
    findFoldersToExpand(tree);
    setExpandedFolders(foldersToExpand);
  }, [searchQuery]);

  const handleSelectFolderClick = () => {
    fileInputRef.current?.click();
  };

  // Files/folders to always hide in the explorer
  const HIDDEN_NAMES = new Set(['.DS_Store', '__MACOSX', 'Thumbs.db', 'desktop.ini', '.Spotlight-V100', '.Trashes']);
  const isHidden = (name: string) => name.startsWith('.') || HIDDEN_NAMES.has(name);

  const buildTreeFromFiles = (files: File[]): FileNode[] => {
    const rootNodes: FileNode[] = [];
    const dirMap = new Map<string, FileNode>();

    for (const file of files) {
      if (isHidden(file.name)) continue;
      
      const parts = file.webkitRelativePath.split('/');
      let currentLevel = rootNodes;
      let currentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        const isFile = i === parts.length - 1;
        let existingNode = dirMap.get(currentPath);
        
        if (!existingNode) {
          existingNode = {
            name: part,
            path: currentPath,
            isDirectory: !isFile,
            children: isFile ? undefined : [],
            file: isFile ? file : undefined,
            size: isFile ? file.size : 0,
          };
          dirMap.set(currentPath, existingNode);
          currentLevel.push(existingNode);
        }
        
        if (!isFile) {
          currentLevel = existingNode.children!;
        }
      }
    }

    const sortNodes = (nodes: FileNode[]) => {
      nodes.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      nodes.forEach(node => {
        if (node.children) sortNodes(node.children);
      });
    };
    
    sortNodes(rootNodes);
    
    if (rootNodes.length === 1 && rootNodes[0].isDirectory) {
        return rootNodes[0].children || [];
    }
    return rootNodes;
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const rootFolderName = filesArray[0].webkitRelativePath.split('/')[0];
      setRootPath(rootFolderName);
      const newTree = buildTreeFromFiles(filesArray);
      setTree(newTree);
      setExpandedFolders(new Set());
      setSelectedFile(null);
      setFileContent('');
    }
  };

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const [isTruncated, setIsTruncated] = useState<boolean>(false);
  const [isTooLarge, setIsTooLarge] = useState<boolean>(false);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');

  const loadPreview = async (file: FileNode) => {
    try {
      if (!file.file) return;
      const PREVIEW_LIMIT = 2 * 1024 * 1024; // 2MB preview
      const slice = file.file.slice(0, PREVIEW_LIMIT);
      const content = await slice.text();
      setFileContent(content);
      setIsTruncated(true);
      setIsTooLarge(false);
    } catch (err: any) {
      console.error('Error loading preview:', err);
      setFileContent(`Error loading file preview: ${err.message || err}`);
    }
  };

  const handleFileClick = async (file: FileNode) => {
    if (file.isDirectory) {
      toggleFolder(file.path);
    } else {
      setSelectedFile(file);
      setFileContent('');
      setIsTruncated(false);
      setIsTooLarge(false);
      setFileSizeStr('');
      
      try {
        if (!file.file) return;

        // Special check: Only for analysis_state files that are >= 15MB
        const isAnalysisState = file.name.toLowerCase().includes('analysis_state');
        const sizeMBVal = (file.size || 0) / (1024 * 1024);
        const sizeMB = sizeMBVal.toFixed(1);
        setFileSizeStr(`${sizeMB} MB`);

        if (isAnalysisState && sizeMBVal >= 15) {
          setIsTooLarge(true);
          setFileContent('');
          setActiveTab('editor');
          return;
        }

        const content = await file.file.text();
        setFileContent(content);
        // Automatically switch to Chart tab if it's a known chart type
        if (determineChartType(file.name, content)) {
          setActiveTab('chart');
        } else {
          setActiveTab('editor');
        }
      } catch (err: any) {
        console.error('Error reading file:', err);
        setFileContent(`Error loading file: ${err.message || err}`);
        setActiveTab('editor');
      }
    }
  };

  const renderTree = (nodes: FileNode[], level = 0) => {
    // Helper to check if a node or any of its descendants match the search
    const matchesSearch = (node: FileNode): boolean => {
      if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
      if (node.isDirectory && node.children) {
        return node.children.some(child => matchesSearch(child));
      }
      return false;
    };

    return nodes
      .filter(node => !searchQuery || matchesSearch(node))
      .map(node => (
        <div key={node.path} style={{ paddingLeft: `${level * 12}px` }}>
          <div 
            onClick={() => handleFileClick(node)}
            className={`flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-orange-50 group transition-colors mb-0.5 ${selectedFile?.path === node.path ? 'bg-orange-100 text-orange-700' : 'text-gray-700'}`}
          >
            <span className="mr-2 text-base flex-shrink-0">
              {node.isDirectory ? (expandedFolders.has(node.path) ? '📂' : '📁') : getFileIcon(node.name)}
            </span>
            <span className="text-xs font-medium truncate">{node.name}</span>
            {node.isDirectory && !expandedFolders.has(node.path) && node.children && node.children.length === 0 && (
              <span className="ml-auto text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">load</span>
            )}
          </div>
          {node.isDirectory && expandedFolders.has(node.path) && node.children && (
            <div>{renderTree(node.children, level + 1)}</div>
          )}
        </div>
      ));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'json') return '💠';
    if (ext === 'puml' || ext === 'mmd') return '📊';
    return '📄';
  };

  const renderChart = () => {
    if (!selectedFile || !fileContent) return <div className="flex items-center justify-center h-full text-gray-400">Select a file to view chart</div>;
    
    const mode = determineChartType(selectedFile.name, fileContent);
    
    try {
      if (mode === 'plantuml') return <PlantUMLViewer code={fileContent} />;
      if (mode === 'mermaid') return <MermaidViewer code={fileContent} />;
      
      const data = JSON.parse(fileContent);
      if (mode === 'total_analysis') return <TotalAnalysisVisualizer data={data} projectId="local" artifactId="local" />;
      if (mode === 'hierarchical_features') return <HierarchicalFeatureAnalysis data={data} />;
      if (mode === 'business_rules') return <BusinessRulesVisualizer data={data} />;
      if (mode === 'd3_graph_v2') return <FlowGraphVisualizer data={data} />;
      if (mode === 'client_customizations') return <ClientCustomizationVisualizer data={data} />;
      if (mode === 'customizations_by_node') return <NodeAnalysisVisualizer data={data} />;
      if (mode === 'kg') return <KnowledgeGraphVisualizationV2 data={data} />;
      if (mode === 'user_stories') return <UserStoriesViewer data={data} />;
      if (mode === 'business_process_flow') return <BusinessProcessViewer data={data} />;
      if (mode === 'd3_graph') return <ForceDirectedGraphChart data={data} />;
      if (mode === 'consolidated_analysis') return <ConsolidatedAnalysisViewer data={data} />;
      if (mode === 'legacy_consolidated_analysis') return <LegacyVisualizer data={data} />;
      if (mode === 'business_terms') return <BusinessTermsVisualizer data={data} />;
      if (mode === 'component_distribution') return <ComponentDistributionViewer data={data} />;
      if (mode === 'sbom') return <SBOMViewer data={data} />;
      if (mode === 'security') return <SecurityReportViewer data={data} />;
      if (mode === 'module_analysis') return <ModuleAnalysisViz data={data} />;
      if (mode === 'consolidated_project_inventory') return <ProjectAnalysisDashboard data={data} />;
      if (mode === 'project_analysis_result') return <CodebaseAnalyzer data={data} />;
      if (mode === 'API-report') return <ApiAnalysisVisualization data={data} />;
      if (mode === 'program_flow') return <ProgramFlowView data={data} />;
      if (mode === 'capability_model') return <CapabilityModelViewer data={data} />;
      if (mode === 'cross_repo') return <CrossRepoVisualizer data={data} />;
      if (mode === 'focused_analysis') return <FocusedAnalysis data={data} />;
      if (mode === 'business_metrics') return <BusinessMetricsAnalysis data={data} />;
      if (mode === 'consolidated_business_reports') return <ConsolidatedBusinessReport data={data} />;
      
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
          <div className="text-5xl mb-4">🧩</div>
          <h3 className="text-xl font-semibold mb-2">No Visualization Available</h3>
          <p className="mb-6 max-w-md">This file type or structure doesn't match any known chart formats. You can view the raw content in the Editor.</p>
          <button 
            onClick={() => setActiveTab('editor')}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all"
          >
            Open in Editor
          </button>
        </div>
      );
    } catch (e) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2 text-red-500">Parsing Error</h3>
          <p className="mb-6 max-w-md">The file content could not be parsed correctly. It might be malformed or not a valid JSON/diagram file.</p>
          <button 
            onClick={() => setActiveTab('editor')}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-all"
          >
            Check in Editor
          </button>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/50">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <h2 className="font-bold text-gray-800">Files</h2>
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>
        
        {!rootPath ? (
          <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl mb-4 text-orange-500">📂</div>
            <p className="text-sm text-gray-500 mb-6">Open a folder to start browsing your project files</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFolderChange} 
              //@ts-ignore - webkitdirectory is a non-standard attribute but works in modern browsers
              webkitdirectory="true" 
              directory="true" 
            />
            <button 
              onClick={handleSelectFolderClick}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all shadow-sm"
            >
              Open Folder
            </button>
          </div>
        ) : (
          <>
            <div className="p-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search files..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
                <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className="flex-grow overflow-y-auto px-2 pb-4">
              {renderTree(tree)}
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center space-x-2 text-xs text-gray-500 overflow-hidden">
            {selectedFile && rootPath && (
              <div className="flex items-center overflow-hidden">
                <span className="text-orange-500 font-bold mr-2">/</span>
                {selectedFile.path
                  .replace(rootPath, '')
                  .split(/[/\\\\]/)
                  .filter(Boolean)
                  .map((part, i, arr) => (
                    <React.Fragment key={i}>
                      <span className={`${i === arr.length - 1 ? 'text-gray-900 font-semibold' : 'text-gray-500 hover:text-orange-500 cursor-default'}`}>
                        {part}
                      </span>
                      {i < arr.length - 1 && <span className="mx-1.5 text-gray-300">/</span>}
                    </React.Fragment>
                  ))}
              </div>
            )}
            {!selectedFile && <span className="italic">Select a file to begin</span>}
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['editor', 'chart'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === tab ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex space-x-2">
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-hidden relative bg-gray-50">
          {selectedFile ? (
            <div className="h-full w-full">
              {activeTab === 'editor' && (
                <div className="h-full w-full flex flex-col">
                  {isTooLarge ? (
                    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-white">
                      <div className="text-6xl mb-4">📦</div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Large Analysis State File ({fileSizeStr || 'Huge'})
                      </h3>
                      <p className="text-sm text-gray-500 max-w-md mb-2">
                        <strong className="text-gray-700">{selectedFile.name}</strong> is an internal analysis state file ({fileSizeStr}).
                      </p>
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-lg max-w-lg mb-6 leading-relaxed">
                        ⚠️ Rendering huge analysis state files in the editor causes excessive memory usage and can freeze or crash the window.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => loadPreview(selectedFile)}
                          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
                        >
                          <span>👁️</span> Load 2MB Quick Preview
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isTruncated && (
                        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800 flex items-center justify-between shrink-0">
                          <span>
                            ⚠️ <strong>Large File ({fileSizeStr}):</strong> Showing first 2MB preview to keep editor fast and prevent crashes.
                          </span>
                        </div>
                      )}
                      <textarea 
                        value={fileContent}
                        readOnly
                        className="w-full flex-grow p-6 text-sm font-mono bg-white border-none focus:outline-none resize-none"
                      />
                    </>
                  )}
                </div>
              )}
              {activeTab === 'chart' && (
                <div className="h-full w-full bg-white overflow-auto">
                  <ChartErrorBoundary key={selectedFile.path} onOpenInEditor={() => setActiveTab('editor')}>
                    {renderChart()}
                  </ChartErrorBoundary>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="text-6xl mb-4">📄</div>
              <p>Select a file from the sidebar to view its content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
