'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface C4MermaidRendererProps {
  code: string;
}

export const C4MermaidRenderer: React.FC<C4MermaidRendererProps> = ({ code }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis',
      },
      themeVariables: {
        primaryColor: '#fb851e',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#d1d5db',
        lineColor: '#9ca3af',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#f9fafb',
      },
    });
  }, []);

  useEffect(() => {
    if (!ref.current || !code.trim()) return;

    let isMounted = true;
    const renderDiagram = async () => {
      try {
        setError(null);
        ref.current!.innerHTML = '';

        const uniqueId = `mermaid-c4-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, code.trim());

        if (isMounted && ref.current) {
          ref.current.innerHTML = svg;

          const svgElement = ref.current.querySelector('svg');
          if (svgElement) {
            svgElement.removeAttribute('height');
            svgElement.style.width = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.display = 'block';
          }
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram syntax');
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code]);

  if (error) {
    return (
      <div className="p-4 border border-rose-200 bg-rose-50 rounded-xl text-xs text-rose-800 w-full">
        <div className="font-bold mb-1">Mermaid Syntax Error</div>
        <div className="text-slate-600 mb-2 text-[10px]">{error}</div>
        <pre className="p-3 bg-slate-100 rounded-lg overflow-x-auto text-[10px] font-mono text-slate-800">
          {code}
        </pre>
      </div>
    );
  }

  return <div ref={ref} className="w-full flex items-center justify-center" />;
};
