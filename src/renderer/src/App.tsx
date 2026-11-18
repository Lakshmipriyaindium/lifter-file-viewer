import React, { useState, Component } from 'react';
import TotalAnalysisVisualizer from './components/feature-analysis/TotalAnalysis';
import BusinessRulesVisualizer from './components/business-rule/BusinessRule';
import MermaidViewer from './components/MermaidViewer';
import FlowGraphVisualizer from './components/flow/FlowGraphVisualizer';
import ClientCustomizationVisualizer from './components/client-customization/ClientCustomization';
import NodeAnalysisVisualizer from './components/client-customization/CustomizationByNode';
import KnowledgeGraphVisualizationV2 from './components/kg/KnowledgeGraphVisualizationV2';
import UserStoriesViewer from './components/user-stories/UserStoriesViewer';
import BusinessProcessViewer from './components/business-process/BusinessProcessViewer';
import ForceDirectedGraphChart from './components/d3-graph/ForceDirectedGraphChart';
import PlantUMLViewer from './components/plantuml/PlantUMLViewer';
import BusinessTermsVisualizer from './components/business-terms/BusinessTerms';
import ConsolidatedAnalysisViewer from './components/consolidated-analysis/ConsolidatedAnalysisViewer';
import LegacyVisualizer from './components/legacy-analysis/LegacyVisualizer';
import { determineChartType } from './lib/utils';
import FolderViewer from './components/FolderViewer';
import ModuleAnalysisViz from './components/module-analysis/ModuleAnalysis';
import ProjectAnalysisDashboard from './components/project-analysis/ProjectAnalysisDashboard';
import CodebaseAnalyzer from './components/project-analysis/CodebaseAnalyzer';
import { ApiAnalysisVisualization } from './components/dotnet-api/DotNetAPIVisualizer';
import HierarchicalFeatureAnalysis from './components/feature-analysis/hierachy-feature';
import CapabilityModelViewer from './components/feature-analysis/domain-hierarchy/CapabilityModelViewer';
import CrossRepoVisualizer from './components/cross-repo/CrossRepoVisualizer';
import CloudReadinessViewer from './components/cloud/CloudReadinessViewer';
import C4ArchitectureExplorer from './components/c4-architecture/C4ArchitectureExplorer';
import ArchitectureAnalysisViewer from './components/architecture-analysis/ArchitectureAnalysisViewer';
import { VIEWER_CARDS, ViewerCategory } from './lib/viewerCards';
import ViewerCard from './components/ViewerCard';
// ──────────────────────────────────────────────
// Error Boundary – catches render-time crashes
// caused by wrong/malformed JSON being passed to a visualizer
// ──────────────────────────────────────────────
interface EBProps { onReset: () => void; children: React.ReactNode; }
interface EBState { hasError: boolean; }

class ErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  componentDidCatch(_error: unknown, _info: unknown) {
    // errors are silently swallowed; the UI shows the fallback below
  }

  reset() {
    this.setState({ hasError: false });
    this.props.onReset();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          boxSizing: 'border-box',
        }}>
          <div style={{
            maxWidth: '448px',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            padding: '2.5rem',
            textAlign: 'center',
            border: '1px solid #fee2e2',
            boxSizing: 'border-box',
          }}>
            <div style={{ fontSize: '3.75rem', marginBottom: '1.5rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem', fontFamily: 'system-ui, sans-serif' }}>
              Wrong File Format
            </h2>
            <p style={{ color: '#4b5563', marginBottom: '2rem', lineHeight: '1.625', fontFamily: 'system-ui, sans-serif' }}>
              The uploaded file does not match the expected format for this viewer.
              Please make sure you are uploading the correct file type.
            </p>
            <button
              onClick={() => this.reset()}
              style={{
                width: '100%',
                backgroundColor: '#fb851e',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e67819')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fb851e')}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ──────────────────────────────────────────────
// Shared header bar used inside every visualizer page
// ──────────────────────────────────────────────
function ViewerHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
      <h1 className="text-xl font-bold text-gray-800">LIFTR File Viewer</h1>
      <button
        onClick={onBack}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
      >
        ← Back to Home
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main App
// ──────────────────────────────────────────────
function App() {
  const [appView, setAppView] = useState<'choice' | 'single' | 'folder'>('choice');
  const [activeTab, setActiveTab] = useState<ViewerCategory>('functional_analysis');
  const [data, setData] = useState<any>(null);
  const [rawText, setRawText] = useState<string>('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<
    'mermaid' | 'plantuml' | 'total_analysis' | 'business_rules' | 'd3_graph' | 'd3_graph_v2' | 'client_customizations' | 'customizations_by_node' | 'kg' | 'user_stories' | 'business_process_flow' | 'consolidated_analysis' | 'legacy_consolidated_analysis' | 'consolidated_business_reports' | 'business_terms' | 'module_analysis' | 'consolidated_project_inventory' | 'project_analysis_result' | 'API-report' | 'capability_model' | 'cross_repo' | 'cloud' | 'hierarchical_features' | 'c4_architecture' | 'architecture_analysis' | null
  >(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, selectedMode: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state first
    setData(null);
    setRawText('');
    setError('');
    setMode(null);

    try {
      const isAnalysisState = file.name.toLowerCase().includes('analysis_state');
      if (isAnalysisState) {
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB >= 15) {
          throw new Error(
            `File "${file.name}" is an analysis state file and is very large (${sizeMB.toFixed(1)} MB). It cannot be opened directly in the visualizer because parsing it will freeze or crash the window. Please view it using an external editor.`
          );
        }
      }

      const text = await file.text();

      let actualMode = selectedMode;
      if (!actualMode) {
        actualMode = (determineChartType(file.name, text) as string) ?? '';
      }

      if (!actualMode) {
        throw new Error(
          'Could not determine the file type. Make sure the file name contains a recognised keyword (e.g. client_customizations, customizations_by_node, _d3_v2, etc.).'
        );
      }

      const jsonModes = ['total_analysis', 'hierarchical_features', 'business_rules', 'd3_graph', 'd3_graph_v2', 'client_customizations', 'customizations_by_node', 'kg', 'user_stories', 'business_process_flow', 'consolidated_analysis', 'consolidated_business_reports', 'business_terms', 'module_analysis', 'consolidated_project_inventory', 'project_analysis_result', 'API-report', 'capability_model', 'cross_repo', 'cloud', 'c4_architecture', 'architecture_analysis'];
      if (jsonModes.includes(actualMode)) {
        const parsedData = JSON.parse(text); // throws if invalid JSON
        setData(parsedData);
      } else {
        setRawText(text);
      }

      setMode(actualMode as any);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (e: any) {
      setError(e.message || 'Failed to process file.');
    }

    event.target.value = '';
  };

  const resetApp = () => {
    setData(null);
    setRawText('');
    setMode(null);
    setError('');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // ── Error screen (e.g. JSON parse failure, unknown file type) ──
  if (error) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        boxSizing: 'border-box',
      }}>
        <div style={{
          maxWidth: '448px',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          padding: '2.5rem',
          textAlign: 'center',
          border: '1px solid #fee2e2',
          boxSizing: 'border-box',
        }}>
          <div style={{ fontSize: '3.75rem', marginBottom: '1.5rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem', fontFamily: 'system-ui, sans-serif' }}>
            Unsupported File
          </h2>
          <p style={{ color: '#4b5563', marginBottom: '2rem', lineHeight: '1.625', fontFamily: 'system-ui, sans-serif' }}>
            {error}
          </p>
          <button
            onClick={resetApp}
            style={{
              width: '100%',
              backgroundColor: '#fb851e',
              color: 'white',
              fontWeight: 'bold',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e67819')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fb851e')}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Visualizer routes ──
  if (mode === 'total_analysis' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <TotalAnalysisVisualizer data={data} projectId="local" artifactId="local" />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'hierarchical_features' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <HierarchicalFeatureAnalysis data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'business_rules' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <BusinessRulesVisualizer data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'd3_graph_v2' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <FlowGraphVisualizer data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'client_customizations' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <ClientCustomizationVisualizer data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'customizations_by_node' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <NodeAnalysisVisualizer data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'kg' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <KnowledgeGraphVisualizationV2 data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'user_stories' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <UserStoriesViewer data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'business_process_flow' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <BusinessProcessViewer data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'd3_graph' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <ForceDirectedGraphChart data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'consolidated_analysis' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <ConsolidatedAnalysisViewer data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'legacy_consolidated_analysis' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <LegacyVisualizer data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'business_terms' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <BusinessTermsVisualizer data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'module_analysis' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <ModuleAnalysisViz data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'consolidated_project_inventory' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <ProjectAnalysisDashboard data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'project_analysis_result' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <CodebaseAnalyzer data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'API-report' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <ApiAnalysisVisualization data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'capability_model' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <CapabilityModelViewer data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'cross_repo' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <CrossRepoVisualizer data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'cloud' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <CloudReadinessViewer data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'c4_architecture' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <C4ArchitectureExplorer data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'architecture_analysis' && data) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <ArchitectureAnalysisViewer data={data} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'plantuml' && rawText) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <PlantUMLViewer code={rawText} />
        </ErrorBoundary>
      </div>
    );
  }

  if (mode === 'mermaid' && rawText) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <ViewerHeader onBack={resetApp} />
        <ErrorBoundary onReset={resetApp}>
          <MermaidViewer code={rawText} />
        </ErrorBoundary>
      </div>
    );
  }

  // ── Choice screen ──
  if (appView === 'choice') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 w-full">
        <div className="max-w-4xl w-full text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Lifter</h1>
          <p className="text-gray-600 mb-12 text-xl">How would you like to explore your analysis today?</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Upload Folder Option */}
            <div
              onClick={() => setAppView('folder')}
              className="bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl border-2 border-transparent hover:border-orange-500 transition-all duration-500 cursor-pointer group p-12 flex flex-col items-center"
            >
              <div className="w-28 h-28 bg-orange-50 rounded-3xl flex items-center justify-center text-6xl mb-8 group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-500">📂</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Project Explorer</h2>
              <p className="text-gray-500 text-lg text-center leading-relaxed">
                Browse entire folders, view code, and see integrated diagrams in one place.
              </p>
            </div>

            {/* Single File Viewer Option */}
            <div
              onClick={() => setAppView('single')}
              className="bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl border-2 border-transparent hover:border-orange-500 transition-all duration-500 cursor-pointer group p-12 flex flex-col items-center"
            >
              <div className="w-28 h-28 bg-orange-50 rounded-3xl flex items-center justify-center text-6xl mb-8 group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-500">📄</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Single File Viewer</h2>
              <p className="text-gray-500 text-lg text-center leading-relaxed">
                Quickly upload and visualize individual analysis or diagram files.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Folder Viewer ──
  if (appView === 'folder') {
    return <FolderViewer onBack={() => setAppView('choice')} />;
  }

  const displayedCards = VIEWER_CARDS.filter((card) => card.category === activeTab);
  const systemCount = VIEWER_CARDS.filter((card) => card.category === 'system_assessment').length;
  const functionalCount = VIEWER_CARDS.filter((card) => card.category === 'functional_analysis').length;

  // ── Home screen (Single File Viewer) ──
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8 w-full">
      <div className="w-full">
        <div className="flex items-center mb-10">
          <button
            onClick={() => setAppView('choice')}
            className="mr-6 p-2 text-gray-400 hover:text-orange-500 transition-colors"
          >
            <span className="text-2xl">←</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Single File Viewer</h1>
            <p className="text-gray-500">Select a specific viewer for your file</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8 space-x-8">

          <button
            onClick={() => setActiveTab('functional_analysis')}
            className={`pb-4 px-2 font-semibold text-lg transition-all relative flex items-center ${activeTab === 'functional_analysis'
              ? 'text-orange-600 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
          >
            Functional Analysis
            <span
              className={`ml-2.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${activeTab === 'functional_analysis'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-500'
                }`}
            >
              {functionalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('system_assessment')}
            className={`pb-4 px-2 font-semibold text-lg transition-all relative flex items-center ${activeTab === 'system_assessment'
              ? 'text-orange-600 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
          >
            System Assessment
            <span
              className={`ml-2.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${activeTab === 'system_assessment'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-500'
                }`}
            >
              {systemCount}
            </span>
          </button>

        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {displayedCards.map((card) => (
            <ViewerCard key={card.id} card={card} onUpload={handleFileUpload} />
          ))}
        </div>

        {/* Auto-detect */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4 text-sm font-medium">OR AUTO-DETECT FILE TYPE</p>
          <label className="inline-block cursor-pointer bg-white border border-gray-200 hover:border-orange-500 text-gray-600 font-medium py-2.5 px-8 rounded-full shadow-sm transition-all hover:text-orange-600">
            Upload Any File
            <input type="file" accept=".json,.mmd,.txt" onChange={(e) => handleFileUpload(e, '')} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}

export default App;
