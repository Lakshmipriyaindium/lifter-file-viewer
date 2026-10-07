'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Cpu, ChevronRight, ChevronLeft, Activity, ArrowRight, Database, ShieldAlert, Server, ZoomIn, ZoomOut, Maximize2, Minimize2, RefreshCw, AlertCircle, Code, Network, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivePath, C4Data, C4Container, C4Component, C4Person, C4Entity, C4DeploymentNode, normalizeC4Data, generateContextDiagram, generateContainerDiagram, generateComponentDiagram, generateDataViewDiagram, generateDeploymentDiagram, generateSecurityDiagram } from './c4DiagramUtils';
import { C4MermaidRenderer } from './C4MermaidRenderer';

interface C4ArchitectureExplorerProps {
  application_id?: number | string;
  c4Data?: C4Data;
  showHeader?: boolean;
}

export default function C4ArchitectureExplorer({ application_id, c4Data: propC4Data, showHeader = false }: C4ArchitectureExplorerProps = {}) {
  const [c4Data, setC4Data] = useState<C4Data | null>(normalizeC4Data(propC4Data) || null);
  const [loading, setLoading] = useState<boolean>(!propC4Data && !!application_id);
  const [error, setError] = useState<string | null>(null);

  const [path, setPath] = useState<ActivePath>({ level: 1 });
  const [zoom, setZoom] = useState<number>(1);
  const [fitMode, setFitMode] = useState<'fit' | 'scroll'>('fit');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    if (propC4Data) {
      setC4Data(normalizeC4Data(propC4Data));
      setLoading(false);
      return;
    }

    if (!application_id) {
      setLoading(false);
      return;
    }

    const fetchC4Data = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/c4-architecture?application_id=${application_id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch C4 architecture data (Status ${response.status})`);
        }
        const rawData = await response.json();
        const data = normalizeC4Data(rawData);
        if (isMounted) setC4Data(data);
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("Failed to load C4 architecture data:", err);
          setError(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchC4Data();
    return () => { isMounted = false; };
  }, [application_id, propC4Data]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        const data = normalizeC4Data(parsed);
        setC4Data(data);
        setError(null);
        setPath({ level: 1 });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  // Navigation handlers
  const zoomToContext = () => { setPath({ level: 1 }); setZoom(1); };
  const zoomToContainers = () => { setPath({ level: 2 }); setZoom(1); };
  const zoomToComponents = (container: string) => {
    setPath({ level: 3, container });
    setZoom(1);
  };
  const zoomToDetails = (container: string, component: string) => {
    setPath({ level: 4, container, component });
    setZoom(1);
  };

  // Back navigation
  const goBack = () => {
    setZoom(1);
    if (path.level === 4) {
      setPath({ level: 3, container: path.container });
    } else if (path.level === 3) {
      setPath({ level: 2 });
    } else if (path.level === 2) {
      setPath({ level: 1 });
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.6));
  const handleZoomReset = () => setZoom(1);

  // Dynamic diagram generator
  const getActiveDiagram = () => {
    if (!c4Data) return 'graph LR\n  empty["No C4 Architecture Data Loaded"]';

    if (path.level === 1) return generateContextDiagram(c4Data);
    if (path.level === 2) return generateContainerDiagram(c4Data);
    if (path.level === 3) {
      return generateComponentDiagram(c4Data, path.container);
    }
    if (path.component === 'data' || path.component === 'db_schema') {
      return generateDataViewDiagram(c4Data);
    }
    if (path.component === 'deploy') {
      return generateDeploymentDiagram(c4Data);
    }
    if (path.component === 'security') {
      return generateSecurityDiagram(c4Data);
    }

    return `graph LR
      comp["${path.component.toUpperCase()} Component Detail"]
      sub["No diagram custom mapping configured."]
      comp --- sub
      style comp fill:#fb851e,stroke:#d97706,color:#fff,stroke-width:2px`;
  };

  const activeFrontendComp = path.level === 3
    ? (c4Data?.containers || []).find((c: C4Container) => c.id === path.container)
    : null;

  const totalComponents = (c4Data?.containers || []).reduce((acc: number, c: C4Container) => {
    return acc + (c.components?.length || 0);
  }, 0);

  const entityCount = c4Data?.data_view?.entities?.length;
  const deploymentCount = c4Data?.deployment_view?.nodes?.length || c4Data?.deployment?.nodes?.length;
  const containerCount = c4Data?.containers?.length;

  const projectName = c4Data?.metadata?.project_name;
  const projectDesc = c4Data?.metadata?.description;

  if (loading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <RefreshCw className="h-8 w-8 text-orange-500 animate-spin mb-3" />
        <h4 className="text-sm font-semibold text-slate-800">Fetching C4 Architecture Data...</h4>
        <p className="text-xs text-slate-500 mt-1">Retrieving system components, boundaries, and security view via API.</p>
      </div>
    );
  }

  if (error || (!c4Data && !loading)) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <AlertCircle className="h-8 w-8 text-rose-500 mb-3" />
        <h4 className="text-sm font-semibold text-slate-800">No C4 Architecture Data Available</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mb-6">
          {error || `No C4 architecture analysis results were returned for application ID: ${application_id || 'unspecified'}.`}
        </p>
        
        <label className="flex items-center gap-2 cursor-pointer bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-sm text-sm font-semibold">
          <Upload className="h-4 w-4" />
          Upload JSON File
          <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-b-xl flex flex-col gap-5 text-slate-800 font-sans">
      <style dangerouslySetInnerHTML={{
        __html: `
        .c4-diagram-canvas svg {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
        }
      `}} />

      {/* Header Info */}
      {showHeader && (
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-2xs">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold px-2 text-slate-900">
                C4 Model Explorer
              </h3>
              <p className="mt-1 px-2 text-xs text-slate-500 leading-relaxed max-w-5xl">
                {projectDesc}
              </p>
            </div>
          </div>
          <div>
            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors text-xs font-semibold">
              <Upload className="h-3.5 w-3.5" />
              Upload JSON
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs divide-x divide-y md:divide-y-0 divide-slate-200/80">
        <div className="p-3 flex items-center gap-3 bg-white">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-100">
            <Layers className="h-4 w-4" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-lg font-bold text-slate-900 leading-none">
              {containerCount}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Containers</div>
          </div>
        </div>

        <div className="p-3 flex items-center gap-3 bg-white">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-50 text-purple-600 border border-purple-100">
            <Code className="h-4 w-4" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-lg font-bold text-slate-900 leading-none">
              {totalComponents}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Components</div>
          </div>
        </div>

        <div className="p-3 flex items-center gap-3 bg-white">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Database className="h-4 w-4" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-lg font-bold text-slate-900 leading-none">
              {entityCount}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Entities</div>
          </div>
        </div>

        <div className="p-3 flex items-center gap-3 bg-white">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-600 border border-sky-100">
            <Server className="h-4 w-4" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-lg font-bold text-slate-900 leading-none">
              {deploymentCount}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Nodes</div>
          </div>
        </div>
      </div>

      {/* Path Stepper Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-2 text-xs py-0.5">
        <button
          type="button"
          onClick={zoomToContext}
          className={cn(
            "transition-colors text-xs font-medium cursor-pointer",
            path.level === 1 ? "text-orange-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          Context (C1)
        </button>

        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />

        <button
          type="button"
          onClick={zoomToContainers}
          className={cn(
            "transition-colors text-xs font-medium cursor-pointer",
            path.level === 2 ? "text-orange-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          Containers (C2)
        </button>

        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />

        <button
          type="button"
          onClick={() => zoomToComponents('container' in path ? path.container : (c4Data?.containers?.[0]?.id || 'frontend'))}
          className={cn(
            "transition-colors text-xs font-medium cursor-pointer",
            path.level === 3 ? "text-orange-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          Components (C3)
        </button>

        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />

        <button
          type="button"
          onClick={() => zoomToDetails('container' in path ? path.container : 'database', path.level === 4 ? path.component : 'db_schema')}
          className={cn(
            "transition-colors text-xs font-medium cursor-pointer",
            path.level === 4 ? "text-orange-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          {path.level === 4 ? `${path.component.replace('_', ' ').toUpperCase()} (C4)` : 'DB Schema (C4)'}
        </button>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

        {/* Visual Diagram Canvas */}
        <section className="lg:col-span-8 flex flex-col bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm relative min-h-[460px]">

          {/* Canvas Controller Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                Diagram Canvas
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Fit/Scroll Toggle Mode */}
              <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => { setFitMode('fit'); setZoom(1); }}
                  className={cn("px-2 py-1 rounded font-semibold text-[11px] transition-all", fitMode === 'fit' ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900")}
                  title="Fit diagram to viewport width"
                >
                  Fit View
                </button>
                <button
                  type="button"
                  onClick={() => { setFitMode('scroll'); }}
                  className={cn("px-2 py-1 rounded font-semibold text-[11px] transition-all", fitMode === 'scroll' ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900")}
                  title="Scrollable layout at native scale"
                >
                  Scroll View
                </button>
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 rounded text-slate-500 hover:text-slate-900"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-[10px] px-1.5 font-mono font-bold text-slate-500 select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 rounded text-slate-500 hover:text-slate-900"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomReset}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 border-l border-slate-200 ml-0.5 pl-1"
                  title="Reset Zoom"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Fullscreen Trigger */}
              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-all"
                title="Toggle Fullscreen Canvas"
              >
                {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>

              {/* Step Back Button */}
              {path.level > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1 text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 px-2.5 py-1 rounded-lg transition-all shadow-2xs"
                  title="Go Back 1 step"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              )}
            </div>
          </div>

          {/* Active Diagram View */}
          <div className="flex-1 border border-slate-200/80 bg-slate-50/70 rounded-lg relative min-h-[360px] overflow-auto flex items-center justify-center p-4">
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
                width: '100%',
                maxWidth: fitMode === 'fit' ? '100%' : 'none',
                minWidth: fitMode === 'scroll' ? '850px' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <C4MermaidRenderer code={getActiveDiagram()} />
            </div>
          </div>

          {/* Canvas Footer caption */}
          <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>Click any node in the canvas to inspect it, or use the cards to drill down levels.</span>
          </div>
        </section>

        {/* Dynamic C4 Drill-Down Sidebar */}
        <section className="lg:col-span-4 flex flex-col bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600">
                LEVEL {path.level} · ACTIVE SCOPE
              </span>
              <h4 className="text-base font-extrabold tracking-tight mt-1 text-slate-900">
                {path.level === 1 && "System Context"}
                {path.level === 2 && `${projectName} Containers`}
                {path.level === 3 && `${path.container.toUpperCase()} Components`}
                {path.level === 4 && `${path.component.replace('_', ' ').toUpperCase()} Specification`}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {path.level === 1 && "Click the system card to navigate deeper into the design."}
                {path.level === 2 && "Select a container to inspect internal components."}
                {path.level === 3 && "Inspect internal service components and views."}
                {path.level === 4 && "Detailed code schema and environment layout."}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {path.level === 1 && (
                <>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Interactive Elements:</div>
                  <button
                    type="button"
                    onClick={zoomToContainers}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-orange-50/60 hover:border-orange-200 transition-all flex items-center justify-between group shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-orange-500" />
                        {projectName}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Explores Containers, components, & deploy layout</div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                  </button>

                  <div className="p-2.5 border border-slate-200/80 bg-slate-50/40 text-[10px] text-slate-600 rounded-lg flex flex-col gap-1">
                    <div className="font-semibold text-slate-900 p-2 pb-0">Actors & Stakeholders:</div>
                    <ul className="list-disc list-inside p-2 pt-0 flex flex-col gap-0.5 text-slate-500">
                      {(c4Data?.system_context?.people || []).map((p: C4Person) => (
                        <li key={p.id}>{p.name}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {path.level === 2 && (
                <>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Select Container:</div>
                  {(c4Data?.containers || []).map((c: C4Container) => {
                    const isDb = c.id?.includes('database') || c.name?.toLowerCase().includes('database');
                    const isBackend = c.id?.includes('backend') || c.name?.toLowerCase().includes('backend');
                    const typeKey: 'database' | 'backend' | 'frontend' = isDb ? 'database' : isBackend ? 'backend' : 'frontend';

                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => zoomToComponents(c.id)}
                        className="w-full text-left p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-orange-50/60 hover:border-orange-200 transition-all flex items-center justify-between group shadow-2xs"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            {isDb ? <Database className="h-3.5 w-3.5 text-emerald-600" /> : isBackend ? <Cpu className="h-3.5 w-3.5 text-sky-600" /> : <Layers className="h-3.5 w-3.5 text-orange-500" />}
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{c.technology}</div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                      </button>
                    );
                  })}
                </>
              )}

              {path.level === 3 && path.container === 'frontend' && (
                <>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Frontend Components:</div>
                  {(activeFrontendComp?.components || []).map((comp: C4Component) => {
                    const hasDetails = comp.id === 'comp_frontend_api_client' || comp.id?.includes('api_client');
                    return (
                      <button
                        type="button"
                        key={comp.id}
                        onClick={() => {
                          if (hasDetails) zoomToDetails('frontend', 'api_client');
                        }}
                        disabled={!hasDetails}
                        className={cn(
                          "w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between group shadow-2xs",
                          hasDetails
                            ? "border-slate-200 bg-slate-50/50 hover:bg-orange-50/60 hover:border-orange-200 cursor-pointer"
                            : "border-slate-100 bg-slate-50/20 opacity-70 cursor-default"
                        )}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{comp.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{comp.technology}</div>
                        </div>
                        {hasDetails && <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />}
                      </button>
                    );
                  })}
                </>
              )}

              {path.level === 3 && path.container === 'backend' && (
                <>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Backend Components:</div>
                  <button
                    type="button"
                    onClick={() => zoomToDetails('backend', 'security')}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-rose-50/60 hover:border-rose-200 transition-all flex items-center justify-between group shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                        Security Configuration
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Basic/OAuth & database credential audit</div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
                  </button>

                  <button
                    type="button"
                    onClick={() => zoomToDetails('backend', 'data')}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-orange-50/60 hover:border-orange-200 transition-all flex items-center justify-between group shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5 text-orange-500" />
                        Data Repositories
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">JPA Query bindings & models</div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                  </button>

                  <button
                    type="button"
                    onClick={() => zoomToDetails('backend', 'deploy')}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-orange-50/60 hover:border-orange-200 transition-all flex items-center justify-between group shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Server className="h-3.5 w-3.5 text-sky-600" />
                        Deployment Environment
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Physical deployment layout</div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                  </button>
                </>
              )}

              {path.level === 3 && path.container === 'database' && (
                <>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Database Component:</div>
                  <button
                    type="button"
                    onClick={() => zoomToDetails('database', 'db_schema')}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-emerald-50/60 hover:border-emerald-200 transition-all flex items-center justify-between group shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5 text-emerald-600" />
                        Database Schema
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">SQL tables data dictionary</div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </button>
                </>
              )}

              {path.level === 4 && (
                <>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Details Inspector:</div>

                  {path.component === 'security' && (
                    <div className="flex flex-col gap-3">
                      <div className="p-3 border border-rose-200 bg-rose-50/60 rounded-lg text-xs text-rose-800 leading-relaxed">
                        <div className="flex items-center gap-1.5 font-bold mb-1 text-rose-700">
                          <ShieldAlert className="h-4 w-4 shrink-0" />
                          Plaintext SQL Secret Leak
                        </div>
                        {c4Data?.security_view?.secrets?.[0]?.description || 'Plaintext credentials identified in configuration.'}
                      </div>
                      <div className="p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-[11px] text-slate-600">
                        <strong>Remediation:</strong> Remove plaintext values and reference database credentials via environment placeholders.
                      </div>
                    </div>
                  )}

                  {(path.component === 'data' || path.component === 'db_schema') ? (
                    <div className="p-3 border border-slate-200 bg-slate-50/60 rounded-lg text-xs text-slate-600 flex flex-col gap-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5 text-orange-500" />
                        Schema Entities:
                      </div>
                      <p className="text-[11px]">Renders JPA annotations for:</p>
                      <ul className="list-disc list-inside pl-1.5 flex flex-col gap-0.5 text-slate-500 font-mono text-[10px]">
                        {(c4Data?.data_view?.entities || []).map((e: C4Entity) => (
                          <li key={e.id || e.name}>{e.name}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {path.component === 'deploy' && (
                    <div className="p-3 border border-slate-200 bg-slate-50/60 rounded-lg text-xs text-slate-600 flex flex-col gap-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Server className="h-3.5 w-3.5 text-sky-600" />
                        Environment Target Profiles:
                      </div>
                      <ul className="list-disc list-inside pl-1.5 flex flex-col gap-1 text-slate-500 text-[11px]">
                        {(c4Data?.deployment_view?.nodes || []).map((n: C4DeploymentNode) => (
                          <li key={n.id || n.name}><strong>{n.name}:</strong> {n.technology}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {path.component === 'api_client' && (
                    <div className="p-3 border border-slate-200 bg-slate-50/60 rounded-lg text-xs text-slate-600 flex flex-col gap-1.5">
                      <div className="font-bold text-slate-900">API Client Requests:</div>
                      <p className="text-[11px]">Asynchronous Fetch calls mapping backend DTO structures in TypeScript payloads.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 flex items-center justify-between">
            <span>C4 Architecture Inspector</span>
            {path.level > 1 && (
              <button
                type="button"
                onClick={zoomToContext}
                className="text-orange-600 hover:text-orange-700 font-bold transition-all"
              >
                Reset to C1 Context
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Fullscreen Overlay Modal */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col p-6 text-white animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2 text-white">
                <Maximize2 className="h-4 w-4 text-orange-500" />
                Fullscreen View: Level {path.level} Scope
              </h3>
              <p className="text-xs text-slate-400">Adjust scale or scroll to view nodes in high fidelity</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-800 rounded-lg bg-slate-900 p-0.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 rounded text-slate-400 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-[10px] px-2 font-mono font-bold text-slate-400 select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 rounded text-slate-400 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomReset}
                  className="p-1.5 rounded text-slate-400 hover:text-white border-l border-slate-800 ml-0.5 pl-1.5"
                  title="Reset Zoom"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFullScreen(false)}
                className="bg-orange-500 text-white hover:bg-orange-600 text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                Close Fullscreen
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto border border-slate-800 bg-slate-900/50 rounded-xl relative p-6 flex items-center justify-center">
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
                width: '100%',
                maxWidth: fitMode === 'fit' ? '100%' : 'none',
                minWidth: fitMode === 'scroll' ? '900px' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <C4MermaidRenderer code={getActiveDiagram()} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
