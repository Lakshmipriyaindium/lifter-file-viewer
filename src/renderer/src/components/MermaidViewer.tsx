import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidViewerProps {
  code: string;
}

export default function MermaidViewer({ code }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });

    const renderDiagram = async () => {
      try {
        if (!code.trim()) return;
        const id = `mermaid-svg-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        setSvgContent(svg);
        setError('');
      } catch (err: any) {
        console.error("Mermaid parsing error", err);
        setError(`Failed to render Mermaid diagram: ${err.message || err.str || err}`);
        setSvgContent('');
      }
    };

    renderDiagram();
  }, [code]);

  return (
    <div className="w-full h-full p-4 flex flex-col items-center">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200 mb-4 w-full">
          <h3 className="font-bold">Error Rendering Diagram</h3>
          <p className="mt-1 font-mono text-sm">{error}</p>
        </div>
      )}
      {!error && svgContent && (
        <div 
          ref={containerRef}
          className="mermaid-diagram bg-white p-8 rounded-lg shadow-sm border border-gray-200 w-full overflow-auto flex justify-center"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
}
